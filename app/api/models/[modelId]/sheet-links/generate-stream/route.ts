import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

// Helper function to extract folder ID from Google Drive URL or return the ID itself
function extractFolderId(url: string): string | null {
  if (!url) return null;
  if (!url.includes("/") && !url.includes("http")) {
    return url;
  }
  const patterns = [
    /folders\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /[-\w]{25,}/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  const session = await auth();
  
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR') {
    return new Response("Insufficient permissions", { status: 403 });
  }

  const { modelId } = await params;
  
  // Get caption bank options from query params
  const searchParams = request.nextUrl.searchParams;
  const captionBankOptions = {
    free: searchParams.get('free') === 'true',
    paid: searchParams.get('paid') === 'true',
  };

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      const sendEvent = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Step 1: Validate model configuration
        sendEvent('progress', { step: 'validate', message: 'Validating model configuration' });
        
        const clientModel = await prisma.clientModel.findUnique({
          where: { clientName: decodeURIComponent(modelId) },
        });

        if (!clientModel) {
          sendEvent('error', { message: 'Model not found' });
          controller.close();
          return;
        }

        if (!clientModel.launchesPodFolderId) {
          sendEvent('error', { message: 'Model does not have a launches pod folder configured' });
          controller.close();
          return;
        }

        const launchesFolderId = extractFolderId(clientModel.launchesPodFolderId);
        if (!launchesFolderId) {
          sendEvent('error', { message: 'Invalid launches pod folder ID' });
          controller.close();
          return;
        }

        // Setup Google APIs
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );

        oauth2Client.setCredentials({
          access_token: session.accessToken,
          refresh_token: session.refreshToken,
          expiry_date: session.expiresAt ? session.expiresAt * 1000 : undefined,
        });

        const drive = google.drive({ version: "v3", auth: oauth2Client });
        const sheets = google.sheets({ version: "v4", auth: oauth2Client });

        // Step 2: Search/Create CAPTION BANK folder
        sendEvent('progress', { step: 'folder', message: 'Searching for CAPTION BANK folder' });
        
        let captionBankFolderId: string | null = null;
        const folderSearchResponse = await drive.files.list({
          q: `name='CAPTION BANK' and '${launchesFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
          fields: 'files(id, name)',
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        });

        if (folderSearchResponse.data.files && folderSearchResponse.data.files.length > 0) {
          captionBankFolderId = folderSearchResponse.data.files[0].id || null;
        } else {
          sendEvent('progress', { step: 'folder', message: 'Creating CAPTION BANK folder' });
          const folderMetadata = {
            name: 'CAPTION BANK',
            mimeType: 'application/vnd.google-apps.folder',
            parents: [launchesFolderId],
          };
          const folder = await drive.files.create({
            requestBody: folderMetadata,
            fields: 'id, name',
            supportsAllDrives: true,
          });
          captionBankFolderId = folder.data.id || null;
        }

        if (!captionBankFolderId) {
          sendEvent('error', { message: 'Failed to get CAPTION BANK folder ID' });
          controller.close();
          return;
        }

        // Step 3: Copy template sheet
        sendEvent('progress', { step: 'copy', message: 'Copying template sheet' });
        
        const templateSheetId = '1zleCtSDIiTRyI_KyGVVzx7JXgRwH3WJ5MwVsrnKVrrQ';
        const newSheetName = `🔴 ${clientModel.clientName} - The Schedule Library`;

        const copiedFile = await drive.files.copy({
          fileId: templateSheetId,
          requestBody: {
            name: newSheetName,
            parents: [captionBankFolderId],
          },
          fields: 'id, name',
          supportsAllDrives: true,
        });

        const sheetId = copiedFile.data.id;
        const sheetName = copiedFile.data.name || newSheetName;

        if (!sheetId) {
          sendEvent('error', { message: 'Failed to copy template sheet' });
          controller.close();
          return;
        }

        // Step 4: Duplicate tabs based on selections
        const selectedTypes = [];
        if (captionBankOptions.free) selectedTypes.push('FREE');
        if (captionBankOptions.paid) selectedTypes.push('PAID');

        if (selectedTypes.length > 0) {
          sendEvent('progress', { 
            step: 'duplicate', 
            message: `Duplicating ${selectedTypes.join(' and ')} tab${selectedTypes.length > 1 ? 's' : ''}` 
          });

          const sourceSheetId = 17850419;
          const duplicateRequests: any[] = [];

          if (captionBankOptions.free) {
            duplicateRequests.push({
              duplicateSheet: {
                sourceSheetId: sourceSheetId,
                insertSheetIndex: 6,
                newSheetName: "FREE"
              }
            });
          }

          if (captionBankOptions.paid) {
            duplicateRequests.push({
              duplicateSheet: {
                sourceSheetId: sourceSheetId,
                insertSheetIndex: captionBankOptions.free ? 7 : 6,
                newSheetName: "PAID"
              }
            });
          }

          const batchUpdateResponse = await sheets.spreadsheets.batchUpdate({
            spreadsheetId: sheetId,
            requestBody: { requests: duplicateRequests }
          });

          // Step 5: Update merged cell A-E with model name and tab type
          sendEvent('progress', { step: 'update', message: 'Updating tab headers with model name' });

          const updateRequests: any[] = [];
          const replies = batchUpdateResponse.data.replies || [];

          for (let i = 0; i < replies.length; i++) {
            const reply = replies[i];
            if (reply.duplicateSheet) {
              const newSheetId = reply.duplicateSheet.properties?.sheetId;
              const tabName = reply.duplicateSheet.properties?.title; // "FREE" or "PAID"
              
              if (newSheetId !== undefined && tabName) {
                // Update merged cell A1:E1 with "[modelname] FREE" or "[modelname] PAID"
                updateRequests.push({
                  updateCells: {
                    range: {
                      sheetId: newSheetId,
                      startRowIndex: 0,
                      endRowIndex: 1,
                      startColumnIndex: 0,
                      endColumnIndex: 5
                    },
                    rows: [{
                      values: [{
                        userEnteredValue: {
                          stringValue: `${clientModel.clientName} ${tabName}`
                        }
                      }]
                    }],
                    fields: 'userEnteredValue'
                  }
                });
              }
            }
          }

          if (updateRequests.length > 0) {
            await sheets.spreadsheets.batchUpdate({
              spreadsheetId: sheetId,
              requestBody: { requests: updateRequests }
            });
          }

          // Step 6: Protect cells
          sendEvent('progress', { step: 'protect', message: 'Protecting cells in new tabs' });

          const protectionRequests: any[] = [];

          for (const reply of replies) {
            if (reply.duplicateSheet) {
              const newSheetId = reply.duplicateSheet.properties?.sheetId;
              
              if (newSheetId !== undefined) {
                protectionRequests.push(
                  {
                    addProtectedRange: {
                      protectedRange: {
                        range: {
                          sheetId: newSheetId,
                          startRowIndex: 2,
                          endRowIndex: 3,
                          startColumnIndex: 3,
                          endColumnIndex: 4
                        },
                        description: "Protect D3",
                        warningOnly: false
                      }
                    }
                  },
                  {
                    addProtectedRange: {
                      protectedRange: {
                        range: {
                          sheetId: newSheetId,
                          startRowIndex: 2,
                          endRowIndex: 3,
                          startColumnIndex: 19,
                          endColumnIndex: 20
                        },
                        description: "Protect T3",
                        warningOnly: false
                      }
                    }
                  }
                );
              }
            }
          }

          if (protectionRequests.length > 0) {
            await sheets.spreadsheets.batchUpdate({
              spreadsheetId: sheetId,
              requestBody: { requests: protectionRequests }
            });
          }

          // Step 7: Update MasterSheet DB formulas
          sendEvent('progress', { step: 'formulas', message: 'Updating MasterSheet DB formulas' });

          // Get sheet IDs for MasterSheet DB tabs
          const spreadsheetData = await sheets.spreadsheets.get({
            spreadsheetId: sheetId,
          });

          const sheetsList = spreadsheetData.data.sheets || [];
          const mmSheet = sheetsList.find(s => s.properties?.title === 'MasterSheet DB (MM)');
          const postSheet = sheetsList.find(s => s.properties?.title === 'MasterSheet DB (POST)');

          const formulaUpdateRequests: any[] = [];

          // Build MM formula based on selections
          let mmFormula = '';
          if (captionBankOptions.free && captionBankOptions.paid) {
            mmFormula = '=QUERY({ ' +
              'IFERROR(FILTER(FREE!A3:O, LEN(FREE!A3:A))); ' +
              'IFERROR(FILTER(PAID!A3:O, LEN(PAID!A3:A))) ' +
              '}, "SELECT Col4, Col2, Col3, Col5, Col6, Col7, Col8, Col9, Col10, Col11, Col12, Col13, Col14, Col15", 0)';
          } else if (captionBankOptions.free) {
            mmFormula = '=QUERY({ ' +
              'IFERROR(FILTER(FREE!A3:O, LEN(FREE!A3:A))) ' +
              '}, "SELECT Col4, Col2, Col3, Col5, Col6, Col7, Col8, Col9, Col10, Col11, Col12, Col13, Col14, Col15", 0)';
          } else if (captionBankOptions.paid) {
            mmFormula = '=QUERY({ ' +
              'IFERROR(FILTER(PAID!A3:O, LEN(PAID!A3:A))) ' +
              '}, "SELECT Col4, Col2, Col3, Col5, Col6, Col7, Col8, Col9, Col10, Col11, Col12, Col13, Col14, Col15", 0)';
          }

          // Build POST formula based on selections
          let postFormula = '';
          if (captionBankOptions.free && captionBankOptions.paid) {
            postFormula = '=IFERROR(' +
              'QUERY({' +
                'IFERROR(FILTER(FREE!Q3:AE, LEN(FREE!Q3:Q)), {""});' +
                'IFERROR(FILTER(PAID!Q3:AE, LEN(PAID!Q3:Q)), {""})' +
              '},' +
              '"SELECT Col4, Col2, Col3, Col5, Col6, Col7, Col8, Col9, Col10, Col11, Col12, Col13, Col14, Col15",' +
              '0),' +
              '"No Data Found")';
          } else if (captionBankOptions.free) {
            postFormula = '=IFERROR(' +
              'QUERY({' +
                'IFERROR(FILTER(FREE!Q3:AE, LEN(FREE!Q3:Q)), {""})' +
              '},' +
              '"SELECT Col4, Col2, Col3, Col5, Col6, Col7, Col8, Col9, Col10, Col11, Col12, Col13, Col14, Col15",' +
              '0),' +
              '"No Data Found")';
          } else if (captionBankOptions.paid) {
            postFormula = '=IFERROR(' +
              'QUERY({' +
                'IFERROR(FILTER(PAID!Q3:AE, LEN(PAID!Q3:Q)), {""})' +
              '},' +
              '"SELECT Col4, Col2, Col3, Col5, Col6, Col7, Col8, Col9, Col10, Col11, Col12, Col13, Col14, Col15",' +
              '0),' +
              '"No Data Found")';
          }

          // Update MasterSheet DB (MM) at cell A2
          if (mmSheet?.properties?.sheetId !== undefined && mmFormula) {
            formulaUpdateRequests.push({
              updateCells: {
                range: {
                  sheetId: mmSheet.properties.sheetId,
                  startRowIndex: 1, // Row 2
                  endRowIndex: 2,
                  startColumnIndex: 0, // Column A
                  endColumnIndex: 1
                },
                rows: [{
                  values: [{
                    userEnteredValue: {
                      formulaValue: mmFormula
                    }
                  }]
                }],
                fields: 'userEnteredValue'
              }
            });
          }

          // Update MasterSheet DB (POST) at cell A2
          if (postSheet?.properties?.sheetId !== undefined && postFormula) {
            formulaUpdateRequests.push({
              updateCells: {
                range: {
                  sheetId: postSheet.properties.sheetId,
                  startRowIndex: 1, // Row 2
                  endRowIndex: 2,
                  startColumnIndex: 0, // Column A
                  endColumnIndex: 1
                },
                rows: [{
                  values: [{
                    userEnteredValue: {
                      formulaValue: postFormula
                    }
                  }]
                }],
                fields: 'userEnteredValue'
              }
            });
          }

          if (formulaUpdateRequests.length > 0) {
            await sheets.spreadsheets.batchUpdate({
              spreadsheetId: sheetId,
              requestBody: { requests: formulaUpdateRequests }
            });
          }
        }

        // Step 8: Save to database
        sendEvent('progress', { step: 'save', message: 'Saving to database' });

        const newSheetLink = await prisma.clientModelSheetLinks.create({
          data: {
            clientModelId: clientModel.id,
            sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}`,
            sheetName,
            sheetType: 'Caption Bank',
            folderName: 'CAPTION BANK',
            folderId: captionBankFolderId,
          },
        });

        // Step 9: Complete
        sendEvent('progress', { step: 'complete', message: 'Finalizing' });
        sendEvent('complete', { 
          sheetLink: newSheetLink,
          message: `Caption Bank sheet "${sheetName}" successfully generated` 
        });

        controller.close();
      } catch (error: any) {
        console.error("Error generating sheet:", error);
        sendEvent('error', { message: error.message || 'Failed to generate sheet' });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
