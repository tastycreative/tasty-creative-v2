import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";
import { statusEmitter } from "./status/route";

// Configuration
const BETTERFANS_TEMPLATE_ID = "1whNomJu69mIidOJk-9kExphJSWRG7ncMea75EtDlEJY";
const BETTERFANS_TEMPLATE_GID = "193810044";
const POD_TEMPLATE_ID = "1Bvz11KpPN1g4n0H67SJhTrx43OeHF_RDlUWi1zG2QAk";
const POD_TEMPLATE_GID = "1071193551";
const SHARED_FOLDER_ID = "1jV4H9nDmseNL8AdvokY8uAOM5am4YC_c";

// Extract spreadsheet ID from URL
function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// Extract GID from URL
function extractGid(url: string): string | null {
  const match = url.match(/gid=([0-9]+)/);
  return match ? match[1] : null;
}

// Helper function to find or create a model-specific folder
async function findOrCreateModelFolder(
  drive: any,
  modelName: string,
  parentFolderId: string
): Promise<string> {
  try {
    // First, search for existing folder with the model name
    const searchResponse = await drive.files.list({
      q: `name='${modelName}' and parents in '${parentFolderId}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id, name)",
    });

    const existingFolder = searchResponse.data.files?.[0];

    if (existingFolder?.id) {
      console.log(
        `Found existing folder for model "${modelName}": ${existingFolder.id}`
      );
      return existingFolder.id;
    }

    // If folder doesn't exist, create it
    console.log(
      `Creating new folder for model "${modelName}" in parent folder ${parentFolderId}`
    );
    const createResponse = await drive.files.create({
      requestBody: {
        name: modelName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentFolderId],
      },
      fields: "id, name",
    });

    const newFolderId = createResponse.data.id;
    console.log(`Created new folder for model "${modelName}": ${newFolderId}`);
    return newFolderId;
  } catch (error) {
    console.error(
      `Error finding/creating folder for model "${modelName}":`,
      error
    );
    throw new Error(`Failed to create folder for model: ${modelName}`);
  }
}

// Helper function to implement retry logic with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 5,
  baseDelay: number = 1000,
  maxDelay: number = 30000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Check if it's a quota error (429 status code)
      const isQuotaError =
        error?.code === 429 ||
        error?.status === 429 ||
        (error?.message && error.message.includes("Quota exceeded"));

      if (!isQuotaError || attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      );

      console.log(
        `Quota exceeded, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries + 1})`
      );

      // Emit retry status to frontend
      try {
        statusEmitter.broadcast({
          type: "quota_retry",
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          delay: Math.round(delay),
          message: `Google Sheets quota reached. Retrying in ${Math.round(delay / 1000)} seconds...`,
        });
      } catch (emitError) {
        console.warn("Failed to emit retry status:", emitError);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export async function POST(request: NextRequest) {
  try {
    //console.log("Starting POST request...");

    const session = await auth();

    if (!session || !session.user) {
      //console.log("Not authenticated. No session or user found.");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!session.accessToken) {
      //console.log("Not authenticated. No access token found in session.");
      return NextResponse.json(
        { error: "Not authenticated. No access token." },
        { status: 401 }
      );
    }
    // It's also good practice to check for refreshToken if your OAuth flow provides it and it's essential for refreshing tokens.
    // Depending on the Google API client library behavior, a missing refresh token might not be an immediate issue
    // if the access token is still valid, but it will prevent refreshing the token later.
    // For now, we'll proceed if accessToken is present, assuming the library handles refresh token absence gracefully if not strictly needed for this call.

    //console.log("Session retrieved:", session);

    // Create a fresh OAuth client for each request to avoid any caching issues
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL
    );

    oauth2Client.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken, // session.refreshToken should be available if scoped correctly
      expiry_date: session.expiresAt ? session.expiresAt * 1000 : undefined, // Convert seconds to milliseconds
    });

    // Create fresh Google API clients for each request
    const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const { sourceUrl, fromType, toType, modelName } = await request.json();

    if (!sourceUrl) {
      return NextResponse.json(
        { error: "Source URL is required" },
        { status: 400 }
      );
    }

    if (!fromType || !toType) {
      return NextResponse.json(
        { error: "Conversion direction (fromType and toType) is required" },
        { status: 400 }
      );
    }

    if (!modelName) {
      return NextResponse.json(
        { error: "Model name is required for creating model-specific folders" },
        { status: 400 }
      );
    }

    console.log("New integration request - Processing:", fromType, "→", toType);
    console.log("Source URL:", sourceUrl);
    console.log("Model Name:", modelName);

    // Validate and extract spreadsheet ID and GID from source URL
    const sourceSpreadsheetId = extractSpreadsheetId(sourceUrl);
    const sourceGid = extractGid(sourceUrl);

    if (!sourceSpreadsheetId) {
      return NextResponse.json(
        { error: "Invalid Google Sheets URL" },
        { status: 400 }
      );
    }

    console.log("Processing source spreadsheet ID:", sourceSpreadsheetId);
    console.log("Source GID:", sourceGid || "Using default sheet");

    // Step 1: Get sheet information and validate access to source spreadsheet
    let scheduleSheets: Array<{ name: string; id: number }> = [];
    let spreadsheetName = "";

    try {
      // First, get spreadsheet metadata to find all Schedule #1 sheets
      const spreadsheetInfo = await sheets.spreadsheets.get({
        spreadsheetId: sourceSpreadsheetId,
      });

      // Get the spreadsheet name
      spreadsheetName =
        spreadsheetInfo.data.properties?.title || "Untitled Spreadsheet";
      console.log("Source spreadsheet name:", spreadsheetName);

      // Find sheets based on conversion direction
      if (spreadsheetInfo.data.sheets) {
        if (fromType === "Scheduler") {
          // Find all sheets that contain "Schedule #1" in their name and are not hidden
          scheduleSheets = spreadsheetInfo.data.sheets
            .filter((sheet) => {
              const sheetTitle = sheet.properties?.title || "";
              const isHidden = sheet.properties?.hidden === true;
              return sheetTitle.includes("Schedule #1") && !isHidden;
            })
            .map((sheet) => ({
              name: sheet.properties?.title || "",
              id: sheet.properties?.sheetId || 0,
            }))
            .sort((a, b) => {
              // Custom sort to ensure proper alphabetical order (1A, 1B, 1C, etc.)
              const aMatch = a.name.match(/Schedule #1([A-Z])/);
              const bMatch = b.name.match(/Schedule #1([A-Z])/);

              if (aMatch && bMatch) {
                return aMatch[1].localeCompare(bMatch[1]);
              }
              return a.name.localeCompare(b.name);
            });
        } else {
          // For Betterfans to POD, find all "Schedule #1" sheets (Schedule #1A, #1B, etc.)
          scheduleSheets = spreadsheetInfo.data.sheets
            .filter((sheet) => {
              const sheetTitle = sheet.properties?.title || "";
              const isHidden = sheet.properties?.hidden === true;
              // Match sheets like "Schedule #1A", "Schedule #1B", etc.
              return sheetTitle.includes("Schedule #1") && !isHidden;
            })
            .map((sheet) => ({
              name: sheet.properties?.title || "",
              id: sheet.properties?.sheetId || 0,
            }))
            .sort((a, b) => {
              // For Betterfans, sort Schedule A, B, C, etc.
              const aMatch = a.name.match(/Schedule ([A-Z])/);
              const bMatch = b.name.match(/Schedule ([A-Z])/);

              if (aMatch && bMatch) {
                return aMatch[1].localeCompare(bMatch[1]);
              }
              return a.name.localeCompare(b.name);
            });
        }

        console.log(
          `Found ${scheduleSheets.length} sheets (in alphabetical order):`,
          scheduleSheets.map((s) => s.name)
        );
      }

      if (scheduleSheets.length === 0) {
        const expectedPattern = "Schedule #1";
        return NextResponse.json(
          {
            error: `No visible sheets matching pattern "${expectedPattern}" found in the spreadsheet`,
          },
          { status: 400 }
        );
      }

      // Test access to all schedule sheets to ensure we can read them
      for (const sheet of scheduleSheets) {
        const testRange =
          fromType === "Scheduler"
            ? `'${sheet.name}'!C12:T12` // POD test range
            : `'${sheet.name}'!B2:P2`; // Betterfans test range
        console.log("Testing access to range:", testRange);

        try {
          await retryWithBackoff(async () => {
            return await sheets.spreadsheets.values.get({
              spreadsheetId: sourceSpreadsheetId,
              range: testRange,
            });
          });
        } catch (rangeError) {
          console.warn(
            `Could not access range in sheet "${sheet.name}":`,
            rangeError
          );
          // Continue with other sheets even if one fails
        }
      }

      console.log("Successfully validated access to source spreadsheet");

      // Emit success status for sheet validation
      try {
        statusEmitter.broadcast({
          type: "validation_complete",
          message: "Sheet access validated successfully",
        });
      } catch (emitError) {
        console.warn("Failed to emit validation status:", emitError);
      }
    } catch (error: unknown) {
      console.error("Error reading source spreadsheet:", error);

      // Check if the error is from Google API and has a 403 status
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 403 &&
        "errors" in error &&
        Array.isArray(error.errors) &&
        error.errors.length > 0
      ) {
        console.error(
          "Google API Permission Error (403):",
          error.errors[0].message
        );
        return NextResponse.json(
          {
            error: "GooglePermissionDenied",
            message: `Google API Error: ${error.errors[0].message || "The authenticated Google account does not have permission for the source spreadsheet."}`,
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          error:
            "Failed to read source spreadsheet. Please check if the spreadsheet is accessible with your Google account.",
        },
        { status: 400 }
      );
    }

    // Step 2: Create a copy of the destination spreadsheet
    let newSpreadsheetId: string;
    const templateId =
      toType === "Betterfans Sheet" ? BETTERFANS_TEMPLATE_ID : POD_TEMPLATE_ID;
    const templateGid =
      toType === "Betterfans Sheet"
        ? BETTERFANS_TEMPLATE_GID
        : POD_TEMPLATE_GID;

    try {
      // Step 2a: Find or create model-specific folder
      const modelFolderId = await findOrCreateModelFolder(
        drive,
        modelName,
        SHARED_FOLDER_ID
      );
      console.log(
        `Using model folder ID: ${modelFolderId} for model: ${modelName}`
      );

      // Create a more descriptive filename using the source spreadsheet name
      const currentDate = new Date();
      const dateStr = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD format
      const timeStr = currentDate.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      }); // HH:MM format
      const conversionDirection = `${fromType.replace(" Sheet", "")} to ${toType.replace(" Sheet", "")}`;
      const newFileName = `${spreadsheetName} - ${conversionDirection} - ${dateStr} ${timeStr}`;

      const copyResponse = await drive.files.copy({
        fileId: templateId,
        requestBody: {
          name: newFileName,
          parents: [modelFolderId], // Place the file in the model-specific folder
        },
      });

      newSpreadsheetId = copyResponse.data.id!;
      console.log(
        "Created copy with ID:",
        newSpreadsheetId,
        "in model folder:",
        modelFolderId
      );
    } catch (error: unknown) {
      console.error("Error creating copy:", error);

      // Check if the error is from Google API and has a 403 status
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 403 &&
        "errors" in error &&
        Array.isArray(error.errors) &&
        error.errors.length > 0
      ) {
        console.error(
          "Google API Permission Error (403):",
          error.errors[0].message
        );
        return NextResponse.json(
          {
            error: "GooglePermissionDenied",
            message: `Google API Error: ${error.errors[0].message || "The authenticated Google account does not have permission for the destination spreadsheet."}`,
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: "Failed to create copy of destination spreadsheet" },
        { status: 500 }
      );
    }

    // Step 2.5: Find the correct template sheet GID for POD template
    let actualTemplateGid = templateGid;

    if (toType === "Scheduler") {
      try {
        // Get the template spreadsheet info to find the TEMPLATE sheet GID
        const templateInfo = await sheets.spreadsheets.get({
          spreadsheetId: templateId,
        });

        const templateSheet = templateInfo.data.sheets?.find(
          (sheet) => sheet.properties?.title === "TEMPLATE"
        );

        if (templateSheet?.properties?.sheetId !== undefined) {
          actualTemplateGid = templateSheet.properties.sheetId.toString();
          console.log("Found TEMPLATE sheet with GID:", actualTemplateGid);
        } else {
          console.error(
            "TEMPLATE sheet not found in POD template, using first sheet"
          );
          actualTemplateGid =
            templateInfo.data.sheets?.[0]?.properties?.sheetId?.toString() ||
            "0";
        }
      } catch (error) {
        console.error("Failed to get template sheet info:", error);
        actualTemplateGid = "0"; // Fallback
      }
    }

    // Step 2.6: Create additional sheets and copy data
    try {
      // Build the source URL fresh for each request to avoid any caching issues
      const sourceSpreadsheetUrl = `https://docs.google.com/spreadsheets/d/${sourceSpreadsheetId}`;
      console.log(
        "Using source spreadsheet URL for IMPORTRANGE:",
        sourceSpreadsheetUrl
      );

      // Process sheets in reverse order so the first sheet ends up on top
      for (let i = scheduleSheets.length - 1; i >= 0; i--) {
        const schedule = scheduleSheets[i];
        let targetSheetId: number;
        let targetSheetName: string;

        // Keep the same sheet name as the original, but remove trailing periods
        targetSheetName = schedule.name.replace(/\.+$/, ""); // Remove one or more periods at the end

        console.log(
          `Processing sheet ${i + 1}/${scheduleSheets.length}: "${schedule.name}" -> "${targetSheetName}"`
        );

        // Create duplicate sheets for all schedules
        try {
          // Duplicate the original template sheet for each schedule
          const duplicateSheetResponse = await sheets.spreadsheets.batchUpdate({
            spreadsheetId: newSpreadsheetId,
            requestBody: {
              requests: [
                {
                  duplicateSheet: {
                    sourceSheetId: parseInt(actualTemplateGid),
                    newSheetName: targetSheetName,
                  },
                },
              ],
            },
          });

          const newSheet =
            duplicateSheetResponse.data.replies?.[0]?.duplicateSheet
              ?.properties;
          if (newSheet?.sheetId) {
            targetSheetId = newSheet.sheetId;
            console.log(
              `Duplicated template sheet for "${targetSheetName}" with ID: ${targetSheetId}`
            );
          } else {
            console.error(`Failed to get sheet ID for ${targetSheetName}`);
            continue; // Skip this schedule if sheet creation fails
          }
        } catch (error) {
          console.error(
            `Failed to duplicate template sheet for ${targetSheetName}:`,
            error
          );
          continue; // Skip this schedule if sheet creation fails
        }

        // Update cell C3 with the sheet name only when converting Betterfans to POD
        if (fromType === "Betterfans Sheet") {
          try {
            await sheets.spreadsheets.values.update({
              spreadsheetId: newSpreadsheetId,
              range: `'${targetSheetName}'!C3`,
              valueInputOption: "RAW",
              requestBody: {
                values: [["          " + targetSheetName.toLocaleUpperCase()]],
              },
            });
            console.log(`Updated cell C3 with sheet name: ${targetSheetName}`);
          } catch (error) {
            console.warn(
              `Failed to update cell C3 for ${targetSheetName}:`,
              error
            );
          }
        }

        // Handle data copying based on conversion direction
        if (fromType === "Scheduler") {
          // POD → Betterfans: Use IMPORTRANGE formulas (existing logic)
          console.log(
            `Creating IMPORTRANGE formulas for "${targetSheetName}" using source: ${sourceSpreadsheetUrl}`
          );

          const importFormulas = [
            // B2: =IMPORTRANGE("url", "Sheet!C12:C") - Source column C (Date)
            [
              `=IMPORTRANGE("${sourceSpreadsheetUrl}", "'${schedule.name}'!C12:C")`,
            ],
            // C2: =IMPORTRANGE("url", "Sheet!D12:D") - Source column D (Time)
            [
              `=IMPORTRANGE("${sourceSpreadsheetUrl}", "'${schedule.name}'!D12:D")`,
            ],
            // D2: =IMPORTRANGE("url", "Sheet!E12:E") - Source column E
            [
              `=IMPORTRANGE("${sourceSpreadsheetUrl}", "'${schedule.name}'!E12:E")`,
            ],
            // E2: =IMPORTRANGE("url", "Sheet!F12:F") - Source column F
            [
              `=IMPORTRANGE("${sourceSpreadsheetUrl}", "'${schedule.name}'!F12:F")`,
            ],
            // F2: Skip - leave as template (index 4 skipped)
            null,
            // G2: =IMPORTRANGE("url", "Sheet!I12:I") - Source column I
            [
              `=IMPORTRANGE("${sourceSpreadsheetUrl}", "'${schedule.name}'!I12:I")`,
            ],
            // H2: Skip - leave as template (index 6 skipped)
            null,
            // I2: =IMPORTRANGE("url", "Sheet!J12:J") - Source column J
            [
              `=IMPORTRANGE("${sourceSpreadsheetUrl}", "'${schedule.name}'!K12:K")`,
            ],
            // J2: Skip - leave as template (index 8 skipped)
            null,
            // K2: =IMPORTRANGE("url", "Sheet!K12:K") - Source column K (Price)
            [
              `=IMPORTRANGE("${sourceSpreadsheetUrl}", "'${schedule.name}'!N12:N")`,
            ],
            // L2: =IMPORTRANGE("url", "Sheet!M12:M") - Source column M
            [
              `=IMPORTRANGE("${sourceSpreadsheetUrl}", "'${schedule.name}'!M12:M")`,
            ],
            // M2: =IMPORTRANGE("url", "Sheet!O12:O") - Source column O
            [
              `=IMPORTRANGE("${sourceSpreadsheetUrl}", "'${schedule.name}'!O12:O")`,
            ],
            // N2: =IMPORTRANGE("url", "Sheet!P12:P") - Source column P
            [
              `=IMPORTRANGE("${sourceSpreadsheetUrl}", "'${schedule.name}'!P12:P")`,
            ],
            // O2: =IMPORTRANGE("url", "Sheet!R12:R") - Source column R
            [
              `=IMPORTRANGE("${sourceSpreadsheetUrl}", "'${schedule.name}'!R12:R")`,
            ],
            // P2: =IMPORTRANGE("url", "Sheet!T12:T") - Source column T
            [
              `=IMPORTRANGE("${sourceSpreadsheetUrl}", "'${schedule.name}'!T12:T")`,
            ],
          ];

          // Log the first formula to verify correct source URL
          console.log(
            `Sample IMPORTRANGE formula for "${targetSheetName}":`,
            importFormulas[0]?.[0]
          );

          // Create update requests for IMPORTRANGE formulas
          const formulaRequests = importFormulas
            .map((formula, index) => {
              if (formula === null) return null; // Skip columns F, H, J

              const targetColumn = index + 1; // B=1, C=2, etc. (0-indexed offset + 1)
              return {
                updateCells: {
                  range: {
                    sheetId: targetSheetId,
                    startRowIndex: 1, // Row 2 (0-indexed)
                    endRowIndex: 2, // Row 2 (exclusive end)
                    startColumnIndex: targetColumn,
                    endColumnIndex: targetColumn + 1,
                  },
                  rows: [
                    {
                      values: [
                        {
                          userEnteredValue: {
                            formulaValue: formula[0],
                          },
                        },
                      ],
                    },
                  ],
                  fields: "userEnteredValue",
                },
              };
            })
            .filter((request) => request !== null); // Remove null entries

          // Execute the batch update for formulas
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId: newSpreadsheetId,
            requestBody: {
              requests: formulaRequests,
            },
          });
        } else {
          // Betterfans → POD: Copy real data (reverse mapping)
          // First, check R1 to determine the sheet type and get the appropriate data range
          let sourceRange: string;
          let additionalMappings: Array<{ source: number; target: string }> =
            [];

          try {
            // Check cell R1 to determine sheet type
            const r1Check = await retryWithBackoff(async () => {
              return await sheets.spreadsheets.values.get({
                spreadsheetId: sourceSpreadsheetId,
                range: `'${schedule.name}'!R1`,
              });
            });

            const r1Value = r1Check.data.values?.[0]?.[0] || "";
            console.log(`Sheet ${schedule.name} R1 value: "${r1Value}"`);

            if (r1Value === "Story Post Schedule") {
              // V -> AL, W -> AK, X -> AM
              // In B2:X array: V=index 20, W=index 21, X=index 22
              sourceRange = `'${schedule.name}'!B2:X`;
              additionalMappings = [
                { source: 20, target: "AL" }, // V → AL (V is index 20 in B2:X)
                { source: 21, target: "AK" }, // W → AK (W is index 21 in B2:X)
                { source: 22, target: "AM" }, // X → AM (X is index 22 in B2:X)
              ];
              console.log(
                `Using Story Post Schedule mapping: V→AL, W→AK, X→AM`
              );
            } else if (r1Value === "Subscriber Promo Schedule") {
              // S -> AL, T -> AK, U -> AM
              // B2:U range: B=0,C=1,D=2,E=3,F=4,G=5,H=6,I=7,J=8,K=9,L=10,M=11,N=12,O=13,P=14,Q=15,R=16,S=17,T=18,U=19
              sourceRange = `'${schedule.name}'!B2:U`;
              additionalMappings = [
                { source: 17, target: "AL" }, // S → AL (S is index 17 in B2:U)
                { source: 18, target: "AK" }, // T → AK (T is index 18 in B2:U)
                { source: 19, target: "AM" }, // U → AM (U is index 19 in B2:U)
              ];
              console.log(
                `Using Subscriber Promo Schedule mapping: S→AL, T→AK, U→AM`
              );
            } else {
              // Default to basic range without STU/VWX columns
              sourceRange = `'${schedule.name}'!B2:P`;
              console.log(
                `Unknown R1 value "${r1Value}", using basic mapping (no additional columns)`
              );
            }
          } catch (error) {
            console.warn(
              `Failed to check R1 for ${schedule.name}, using basic range:`,
              error
            );
            sourceRange = `'${schedule.name}'!B2:P`;
          }

          // Get the data from the source Betterfans sheet

          try {
            const sourceData = await retryWithBackoff(async () => {
              return await sheets.spreadsheets.values.get({
                spreadsheetId: sourceSpreadsheetId,
                range: sourceRange,
              });
            });

            const values = sourceData.data.values || [];
            if (values.length === 0) {
              console.log(`No data found in ${schedule.name}, skipping...`);
              continue;
            }

            // Base mapping: Betterfans → POD (B→E, C→D, etc., skip H and J)
            const baseMappingPairs = [
              { source: 0, target: "E" }, // B → E
              { source: 1, target: "D" }, // C → D
              { source: 2, target: "F" }, // D → F
              { source: 3, target: "G" }, // E → G
              { source: 5, target: "I" }, // G → I
              { source: 7, target: "K" }, // I → K
              { source: 9, target: "N" }, // K → N
              { source: 10, target: "M" }, // L → M
              { source: 11, target: "O" }, // M → O
              { source: 12, target: "P" }, // N → P
              { source: 13, target: "R" }, // O → R
              { source: 14, target: "T" }, // P → T
            ];

            // Combine base mapping with additional mappings based on R1 value
            const mappingPairs = [...baseMappingPairs, ...additionalMappings];

            // Prepare data for batch update using explicit mapping
            const batchUpdates = [];

            for (const mapping of mappingPairs) {
              const sourceColIndex = mapping.source;
              const targetCol = mapping.target;

              // Extract column data
              const columnData = values.map((row) => row[sourceColIndex] || "");

              // Create range for this column starting at row 12
              const targetRange = `'${targetSheetName}'!${targetCol}12:${targetCol}`;

              batchUpdates.push({
                range: targetRange,
                values: columnData.map((value) => [value]), // Convert to 2D array for sheets API
              });

              console.log(
                `Mapping Betterfans column ${String.fromCharCode(65 + sourceColIndex)} to POD column ${targetCol}`
              );
            }

            // Execute batch update for all columns
            await sheets.spreadsheets.values.batchUpdate({
              spreadsheetId: newSpreadsheetId,
              requestBody: {
                valueInputOption: "RAW",
                data: batchUpdates,
              },
            });

            console.log(
              `Successfully copied real data for sheet: ${targetSheetName}`
            );
          } catch (dataError) {
            console.error(
              `Failed to copy data for ${schedule.name}:`,
              dataError
            );
            continue;
          }
        }

        // Auto-resize columns for this sheet in a separate request
        try {
          const resizeStartIndex = fromType === "Scheduler" ? 1 : 3; // B for Betterfans, D for POD
          const resizeEndIndex = fromType === "Scheduler" ? 16 : 21; // P for Betterfans, T for POD

          await sheets.spreadsheets.batchUpdate({
            spreadsheetId: newSpreadsheetId,
            requestBody: {
              requests: [
                {
                  autoResizeDimensions: {
                    dimensions: {
                      sheetId: targetSheetId,
                      dimension: "COLUMNS",
                      startIndex: resizeStartIndex,
                      endIndex: resizeEndIndex,
                    },
                  },
                },
              ],
            },
          });
        } catch (resizeError) {
          console.warn(
            `Failed to auto-resize columns for sheet ${targetSheetName}:`,
            resizeError
          );
        }

        console.log(`Successfully processed sheet: ${targetSheetName}`);
      }

      const processType =
        fromType === "Scheduler" ? "IMPORTRANGE formulas" : "real data copying";
      console.log(
        `Successfully set up ${processType} for ${scheduleSheets.length} sheets`
      );

      // Emit completion status
      try {
        statusEmitter.broadcast({
          type: "processing_complete",
          message: `Successfully processed ${scheduleSheets.length} sheets`,
        });
      } catch (emitError) {
        console.warn("Failed to emit completion status:", emitError);
      }
    } catch (error) {
      const processType =
        fromType === "Scheduler" ? "IMPORTRANGE formulas" : "data copying";
      console.error(`Error setting up ${processType}:`, error);

      // Clean up the created file if formula setup failed
      try {
        await drive.files.delete({
          fileId: newSpreadsheetId,
        });
      } catch (deleteError) {
        console.error(
          "Error deleting file after failed formula setup:",
          deleteError
        );
      }

      return NextResponse.json(
        {
          error: `Failed to set up ${processType}`,
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }

    // Step 4: Create shareable link and return success
    try {
      await drive.permissions.create({
        fileId: newSpreadsheetId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });

      const file = await drive.files.get({
        fileId: newSpreadsheetId,
        fields: "webViewLink,name",
      });

      const isRealTimeSync = fromType === "Scheduler";
      const syncType = isRealTimeSync ? "IMPORTRANGE" : "STATIC_COPY";
      const processMessage = isRealTimeSync
        ? `IMPORTRANGE formulas set up successfully for ${scheduleSheets.length} sheets with real-time sync`
        : `Real data copied successfully for ${scheduleSheets.length} sheets`;

      const columnMapping =
        fromType === "Scheduler"
          ? "POD E→Betterfans B, POD D→Betterfans C, POD F→Betterfans D, POD G→Betterfans E, POD I→Betterfans G, POD K→Betterfans I, POD N→Betterfans K, POD M→Betterfans L, POD O→Betterfans M, POD P→Betterfans N, POD R→Betterfans O, POD T→Betterfans P"
          : "Betterfans B→POD E, Betterfans C→POD D, Betterfans D→POD F, Betterfans E→POD G, Betterfans G→POD I, Betterfans I→POD K, Betterfans K→POD N, Betterfans L→POD M, Betterfans M→POD O, Betterfans N→POD P, Betterfans O→POD R, Betterfans P→POD T, Betterfans S→POD AL, Betterfans T→POD AK, Betterfans U→POD AM";

      const finalResponse = {
        success: true,
        message: processMessage,
        spreadsheetUrl: file.data.webViewLink,
        spreadsheetId: newSpreadsheetId,
        fileName: file.data.name,
        syncType,
        conversionDirection: `${fromType} → ${toType}`,
        sourceSpreadsheetName: spreadsheetName,
        scheduleSheets: scheduleSheets.map((s) => s.name),
        sheetsCount: scheduleSheets.length,
        realTimeSync: isRealTimeSync,
        columnMapping,
        modelName: modelName,
        folderStructure: `Created in model-specific folder: ${modelName}`,
      };

      console.log("Successfully created spreadsheet integration:", {
        sourceId: sourceSpreadsheetId,
        newSpreadsheetUrl: file.data.webViewLink,
        fileName: file.data.name,
        modelName: modelName,
        folderStructure: `Model-specific folder: ${modelName}`,
        requestTimestamp: new Date().toISOString(),
      });

      return NextResponse.json(finalResponse);
    } catch (error) {
      console.error("Error creating permissions or getting file info:", error);
      return NextResponse.json(
        {
          error: "Failed to finalize spreadsheet setup",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "POD API - Use POST method to copy spreadsheet data",
    endpoints: {
      POST: "/api/pod - Copy data from source spreadsheet to destination template",
    },
    required_env_vars: [
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "NEXTAUTH_URL",
    ],
    authentication: "Requires Google OAuth authentication via session",
  });
}
