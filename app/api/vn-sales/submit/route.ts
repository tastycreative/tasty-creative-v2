import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated session
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Add role-based access control
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { id, model, voiceNote, sale, soldDate, status, generatedDate, originalHistoryId, source } = body;

    // Validate required fields
    if (!id || !model || !voiceNote || !sale || !soldDate) {
      return NextResponse.json(
        { error: "Missing required fields: id, model, voiceNote, sale, soldDate" },
        { status: 400 }
      );
    }

    // Validate sale amount
    const saleAmount = parseFloat(sale);
    if (isNaN(saleAmount) || saleAmount <= 0) {
      return NextResponse.json(
        { error: "Sale amount must be a positive number" },
        { status: 400 }
      );
    }

    // Set up OAuth2 client with Auth.js session tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    if (!session.accessToken) {
      return NextResponse.json(
        {
          error: "No access token available. Please re-authenticate with Google.",
        },
        { status: 401 }
      );
    }

    oauth2Client.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken || undefined,
      expiry_date: session.expiresAt ? session.expiresAt * 1000 : undefined,
    });

    // Check token expiration
    if (
      !session.refreshToken &&
      session.expiresAt &&
      new Date().getTime() > session.expiresAt * 1000
    ) {
      return NextResponse.json(
        {
          error: "Access token expired and no refresh token available. Please re-authenticate with Google.",
        },
        { status: 401 }
      );
    }

    const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    const spreadsheetId = "1_a08KImbkIA3z0_DTGWoqJdnRiw1y-kygj-Wr2cB_gk";

    // Get submitter info from session
    const submittedBy = session.user.name || session.user.email || 'Unknown Admin';
    const submissionSource = source || 'Manual Entry';

    // Format the data row
    // Columns: ID, Model, Voice Note, Sale, Sold Date, Status, Generated Date, Original History ID, Submitted By, Source
    const rowData = [
      id,
      model,
      voiceNote,
      saleAmount, // Use the parsed number, not string
      soldDate,
      status || "Completed",
      generatedDate || new Date().toISOString(),
      originalHistoryId || '', // Add original history ID for reference
      submittedBy, // User who submitted this sale
      submissionSource, // Source of the submission (AIVoicePage, VNSalesPage, etc.)
    ];

    let sheetName = model;

    console.log('Submitting sale:', {
      id,
      model,
      saleAmount,
      soldDate,
      originalHistoryId,
      submittedBy,
      source: submissionSource,
      isHistorySale: !!originalHistoryId,
      timestamp: new Date().toISOString()
    });

    try {
      // First, check if the sheet exists
      const spreadsheetResponse = await sheets.spreadsheets.get({
        spreadsheetId,
      });

      const existingSheets = spreadsheetResponse.data.sheets?.map(sheet => 
        sheet.properties?.title
      ) || [];

      // If sheet doesn't exist, create it
      if (!existingSheets.includes(sheetName)) {
        console.log(`Creating new sheet: ${sheetName}`);
        
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sheetName,
                  },
                },
              },
            ],
          },
        });

        // Add headers to the new sheet
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A1:J1`,
          valueInputOption: "RAW",
          requestBody: {
            values: [["ID", "Model", "Voice Note", "Sale", "Sold Date", "Status", "Generated Date", "Original History ID", "Submitted By", "Source"]],
          },
        });

        console.log(`Sheet ${sheetName} created with headers`);
      } else {
        // Check if headers need to be updated for existing sheets
        try {
          const headerResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A1:J1`,
          });

          const existingHeaders = headerResponse.data.values?.[0] || [];
          const expectedHeaders = ["ID", "Model", "Voice Note", "Sale", "Sold Date", "Status", "Generated Date", "Original History ID", "Submitted By", "Source"];
          
          // If headers are missing or incomplete, update them
          if (existingHeaders.length < expectedHeaders.length || 
              !expectedHeaders.every((header, index) => existingHeaders[index] === header)) {
            console.log(`Updating headers for sheet: ${sheetName}`);
            
            await sheets.spreadsheets.values.update({
              spreadsheetId,
              range: `${sheetName}!A1:J1`,
              valueInputOption: "RAW",
              requestBody: {
                values: [expectedHeaders],
              },
            });
            
            console.log(`Headers updated for sheet ${sheetName}`);
          }
        } catch (headerError) {
          console.warn(`Could not check/update headers for ${sheetName}:`, headerError);
        }
      }

      // Note: We removed the duplicate check since we're now using unique IDs
      // This allows multiple sales from the same history item
      
      // Append the new row
      const appendResponse = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A:J`,
        valueInputOption: "RAW", // Use RAW to preserve number formatting
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [rowData],
        },
      });

      console.log(`✅ Successfully added sale to ${sheetName}:`, {
        id,
        model,
        sale: saleAmount,
        soldDate,
        originalHistoryId,
        submittedBy,
        source: submissionSource,
        updatedRange: appendResponse.data.updates?.updatedRange,
        updatedRows: appendResponse.data.updates?.updatedRows,
        updatedColumns: appendResponse.data.updates?.updatedColumns,
        updatedCells: appendResponse.data.updates?.updatedCells
      });

      // Return success response with the data that was added
      return NextResponse.json({
        success: true,
        message: "Voice note sale submitted successfully",
        data: {
          id,
          model,
          sale: saleAmount,
          soldDate,
          status: status || "Completed",
          sheetName,
          originalHistoryId,
          submittedBy,
          source: submissionSource,
          updatedRange: appendResponse.data.updates?.updatedRange,
          timestamp: new Date().toISOString()
        },
      });

    } catch (sheetError: any) {
      console.error(`❌ Error working with sheet ${sheetName}:`, sheetError);
      
      // Handle specific Google Sheets API errors
      if (sheetError.code === 403) {
        return NextResponse.json(
          {
            error: "GooglePermissionDenied",
            message: "Google API permission denied. Please check your Google Sheets access permissions.",
          },
          { status: 403 }
        );
      }
      
      // Handle quota exceeded errors
      if (sheetError.code === 429) {
        return NextResponse.json(
          {
            error: "QuotaExceeded",
            message: "Google Sheets API quota exceeded. Please try again in a few minutes.",
          },
          { status: 429 }
        );
      }
      
      throw sheetError;
    }

  } catch (error: any) {
    console.error("❌ Error submitting VN sale:", error);

    // Handle specific Google API errors
    if (error.code === 403 && error.errors && error.errors.length > 0) {
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors[0].message || "The authenticated Google account does not have permission for the Google Sheet."}`,
        },
        { status: 403 }
      );
    }

    // Handle token expiration errors
    if (error.message && error.message.includes("invalid_grant")) {
      return NextResponse.json(
        {
          error: "GoogleAuthExpired",
          message: "Google authentication has expired. Please refresh the page and sign in again.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to submit voice note sale",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}