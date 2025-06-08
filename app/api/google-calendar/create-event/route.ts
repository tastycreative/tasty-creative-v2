/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { DateTime } from "luxon";
import { auth } from "@/auth";

// Define types
interface FormData {
  model: string;
  date: string;
  time: string;
  timezone: string;
  paid: boolean;
  customImage: boolean;
  imageId: string;
  thumbnail: string;
  webViewLink: string;
}

// Map of common timezone abbreviations to IANA timezone identifiers
const timezoneMap: Record<string, string> = {
  EST: "America/New_York",
  EDT: "America/New_York",
  CST: "America/Chicago",
  CDT: "America/Chicago",
  MST: "America/Denver",
  MDT: "America/Denver",
  PST: "America/Los_Angeles",
  PDT: "America/Los_Angeles",
  GMT: "Europe/London",
  UTC: "Etc/UTC",
};

// Logging helper function
function log(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] ${message}`, JSON.stringify(data, null, 2));
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

/**
 * Search for Google Sheet files in a folder and its subfolders
 * @param drive Google Drive API instance
 * @param folderId Parent folder ID to search in
 * @param modelName Model name to search for
 * @param isPaid Whether to search for "Paid" or "Free" in file names
 * @returns Found spreadsheet ID and sheet name, or null if not found
 */
async function findSpreadsheet(
  drive: any,
  folderId: string,
  modelName: string,
  isPaid: boolean
): Promise<{ spreadsheetId: string; sheetName: string } | null> {
  log(
    `Starting spreadsheet search for model: ${modelName} (${
      isPaid ? "Paid" : "Free"
    }) in folder: ${folderId}`
  );

  const sheetMimeType = "application/vnd.google-apps.spreadsheet";
  const paidTerm = isPaid ? "Paid" : "Free";

  try {
    // Search for all spreadsheets in the parent folder and its subfolders
    log(`Searching for spreadsheets in folder: ${folderId}`);
    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='${sheetMimeType}'`,
      fields: "files(id, name)",
      spaces: "drive",
      includeItemsFromAllDrives: false,
      supportsAllDrives: false,
    });

    const files = response.data.files || [];
    log(`Found ${files.length} spreadsheets in parent folder`, { files });

    // First pass: Look for exact match with model name and paid/free status
    for (const file of files) {
      const fileName = file.name.toLowerCase();

      const valueMatch = modelName.match(/\(([^)]+)\)$/);
      const conCatModelName = valueMatch ? valueMatch[1] : modelName;
      const modelNameLower = conCatModelName.toLowerCase();
      const paidTermLower = paidTerm.toLowerCase();

      // Skip files with OFTV in the name
      if (fileName.includes("oftv") || fileName.includes("OFTV")) {
        log(`Skipping spreadsheet with OFTV in name: ${file.name}`);
        continue;
      }

      if (fileName.includes("ppv") || fileName.includes("PPV")) {
        log(`Skipping spreadsheet with PPV in name: ${file.name}`);
        continue;
      }

      if (fileName.includes(modelNameLower + " " + paidTermLower)) {
        log(`Found matching spreadsheet: ${file.name}`, { file });
        return {
          spreadsheetId: file.id,
          sheetName: "Used Captions", // Default sheet name, adjust as needed
        };
      }
    }

    // If no direct matches found in the parent folder, search in subfolders
    const folderMimeType = "application/vnd.google-apps.folder";
    log(`Searching for subfolders in folder: ${folderId}`);
    const foldersResponse = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='${folderMimeType}'`,
      fields: "files(id, name)",
    });

    const folders = foldersResponse.data.files || [];
    log(`Found ${folders.length} subfolders`, { folders });

    // Search each subfolder recursively
    for (const folder of folders) {
      log(`Searching in subfolder: ${folder.name} (${folder.id})`);

      // Search for spreadsheets in this subfolder
      const result = await searchInFolder(drive, folder.id, modelName, isPaid);
      if (result) {
        log(`Found spreadsheet in subfolder: ${folder.name}`, { result });
        return result;
      }

      // If not found, search through any further subfolders
      const result2 = await searchRecursively(
        drive,
        folder.id,
        modelName,
        isPaid
      );
      if (result2) {
        log(
          `Found spreadsheet in recursive search of subfolder: ${folder.name}`,
          { result2 }
        );
        return result2;
      }
    }

    log(
      `No matching spreadsheet found for model: ${modelName} in folder hierarchy`
    );
    return null;
  } catch (error) {
    log("Error searching for spreadsheet", error);
    return null;
  }
}

/**
 * Search for matching spreadsheets in a specific folder
 */
async function searchInFolder(
  drive: any,
  folderId: string,
  modelName: string,
  isPaid: boolean
): Promise<{ spreadsheetId: string; sheetName: string } | null> {
  log(`Searching in folder: ${folderId} for model: ${modelName}`);

  const sheetMimeType = "application/vnd.google-apps.spreadsheet";
  const paidTerm = isPaid ? "Paid" : "Free";

  try {
    // Get all spreadsheets in this folder
    const sheetsResponse = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='${sheetMimeType}'`,
      fields: "files(id, name)",
    });

    const sheets = sheetsResponse.data.files || [];
    log(`Found ${sheets.length} spreadsheets in folder ${folderId}`, {
      sheets,
    });

    // First pass: Look for exact match with model name and paid/free status
    for (const sheet of sheets) {
      const fileName = sheet.name.toLowerCase();
      const valueMatch = modelName.match(/\(([^)]+)\)$/);
      const conCatModelName = valueMatch ? valueMatch[1] : modelName;
      const modelNameLower = conCatModelName.toLowerCase();
      const paidTermLower = paidTerm.toLowerCase();

      // Skip files with OFTV in the name
      if (fileName.includes("oftv") || fileName.includes("OFTV")) {
        log(`Skipping spreadsheet with OFTV in name: ${sheet.name}`);
        continue;
      }
      if (fileName.includes("ppv") || fileName.includes("PPV")) {
        log(`Skipping spreadsheet with PPV in name: ${sheet.name}`);
        continue;
      }

      if (fileName.includes(modelNameLower + " " + paidTermLower)) {
        log(`Found matching spreadsheet in folder: ${sheet.name}`, { sheet });
        return {
          spreadsheetId: sheet.id,
          sheetName: "Used Captions", // Default sheet name
        };
      }
    }

    log(`No matching spreadsheet found in folder: ${folderId}`);
    return null;
  } catch (error) {
    log(`Error searching folder ${folderId}:`, error);
    return null;
  }
}

/**
 * Recursively search for spreadsheets in folders and subfolders
 */
async function searchRecursively(
  drive: any,
  folderId: string,
  modelName: string,
  isPaid: boolean
): Promise<{ spreadsheetId: string; sheetName: string } | null> {
  log(
    `Starting recursive search in folder: ${folderId} for model: ${modelName}`
  );

  const folderMimeType = "application/vnd.google-apps.folder";

  try {
    // Get all subfolders
    const subFoldersResponse = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='${folderMimeType}'`,
      fields: "files(id, name)",
    });

    const subFolders = subFoldersResponse.data.files || [];
    log(`Found ${subFolders.length} subfolders in folder ${folderId}`, {
      subFolders,
    });

    // First, search for spreadsheets directly in this folder
    const result = await searchInFolder(drive, folderId, modelName, isPaid);
    log(`Search in folder ${folderId} result:`, result);
    if (result) return result;

    // Recursively search each subfolder
    for (const subFolder of subFolders) {
      log(
        `Recursively searching subfolder: ${subFolder.name} (${subFolder.id})`
      );
      const result = await searchRecursively(
        drive,
        subFolder.id,
        modelName,
        isPaid
      );
      log(`Recursive search result for subfolder ${subFolder.name}:`, result);
      if (result) return result;
    }

    log(
      `No matching spreadsheet found in recursive search of folder: ${folderId}`
    );
    return null;
  } catch (error) {
    log(`Error searching folder ${folderId}:`, error);
    return null;
  }
}

function generateSpreadsheetLink(
  spreadsheetId: string,
  sheetName: string,
  rowNumber: number,
  actualSheetId: number
): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${actualSheetId}&range=${rowNumber}:${rowNumber}`;
}

export async function POST(request: NextRequest) {
  try {
    log("Received POST request to calendar/sheets endpoint");

    // Authentication check using Auth.js
    const session = await auth();
    if (!session || !session.user) {
      log("Authentication failed: No session or user found");
      return NextResponse.json(
        { message: "Not authenticated with Google", requireAuth: true },
        { status: 401 }
      );
    }

    if (!session.accessToken) {
      log("Authentication failed: No access token found in session");
      return NextResponse.json(
        { 
          message: "Not authenticated. No access token.", 
          requireAuth: true 
        },
        { status: 401 }
      );
    }

    log("Authentication successful with Auth.js session");

    // Set up Google OAuth2 client with session credentials
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

    // Parse request body
    let formData: FormData;
    try {
      log("Parsing request body");
      formData = await request.json();
      log("Parsed form data:", formData);
    } catch (parseError) {
      log("Failed to parse request body:", parseError);
      return NextResponse.json(
        { message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (
      !formData.model ||
      !formData.date ||
      !formData.time ||
      !formData.timezone
    ) {
      log("Missing required fields in form data");
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Initialize Google APIs
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const sheets = google.sheets({ version: "v4", auth: oauth2Client });

    const parentFolderId = process.env.GOOGLE_DRIVE_SHEET_FOLDER_ID!;
    log(`✅ Using parent folder ID: ${parentFolderId}`);

    // Process timezone and datetime
    const ianaTimezone = timezoneMap[formData.timezone] || formData.timezone;
    log(`🌐 Received timezone: ${formData.timezone}`);
    log(`🔁 Converted to IANA timezone: ${ianaTimezone}`);

    const { date, time, timezone } = formData;
    const dateTimeString = `${date}T${time}`;
    log(`📅 Combined date and time string: ${dateTimeString}`);

    const userDateTime = DateTime.fromISO(dateTimeString, { zone: timezone });
    log(`🕒 Parsed user time (${timezone}): ${userDateTime.toISO()}`);

    const laDateTime = userDateTime.setZone("America/Los_Angeles");
    log(`🌴 Converted to Los Angeles time: ${laDateTime.toISO()}`);

    const laEndTime = laDateTime.plus({ hours: 1 });
    log(`⏰ Event duration: 1 hour`);
    log(`🟢 Event start in LA: ${laDateTime.toISO()}`);
    log(`🔚 Event end in LA: ${laEndTime.toISO()}`);

    const eventStart = laDateTime.toISO();
    const eventEnd = laEndTime.toISO();

    // Create calendar event description
    let description = `Model: ${formData.model}\n`;
    if (formData.paid) description += "This is a paid session\n";
    if (formData.thumbnail) description += `Thumbnail: ${formData.thumbnail}\n`;
    if (formData.webViewLink)
      description += `WebView Link: ${formData.webViewLink}\n`;

    const event = {
      summary: `${formData.model} OF Live`,
      description,
      start: {
        dateTime: eventStart,
        timeZone: "America/Los_Angeles",
      },
      end: {
        dateTime: eventEnd,
        timeZone: "America/Los_Angeles",
      },
      colorId: formData.paid ? "11" : "10",
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "popup", minutes: 30 },
        ],
      },
    };

    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    log(`Creating calendar event in calendar: ${calendarId}`, { event });

    let calendarSuccess: { eventId: string; eventLink: string } | null = null;

    try {
      const response = await calendar.events.insert({
        calendarId: calendarId,
        requestBody: event,
      });

      calendarSuccess = {
        eventId: response.data.id!,
        eventLink: response.data.htmlLink!,
      };

      log("Successfully created calendar event", calendarSuccess);
    } catch (calendarError: any) {
      if (calendarError.code === 401) {
        log("Authentication expired error from Google Calendar API");
        return NextResponse.json(
          { message: "Authentication expired", requireAuth: true },
          { status: 401 }
        );
      }
      log("Google Calendar API error:", calendarError);
      return NextResponse.json(
        {
          message: `Error creating calendar event: ${calendarError.message}`,
          error: calendarError.message,
        },
        { status: 500 }
      );
    }

    if (!calendarSuccess) {
      log("Calendar event creation failed");
      return NextResponse.json(
        { message: "Failed to create calendar event" },
        { status: 500 }
      );
    }

    // Find appropriate spreadsheet based on model and paid status
    log(
      `Searching for spreadsheet for model: ${formData.model} (${
        formData.paid ? "Paid" : "Free"
      })`
    );
    const spreadsheetInfo = await findSpreadsheet(
      drive,
      parentFolderId,
      formData.model,
      formData.paid
    );

    log("Spreadsheet search result:", spreadsheetInfo);

    if (!spreadsheetInfo) {
      log("No matching spreadsheet found but calendar event was created");
      return NextResponse.json(
        {
          message: `Calendar Event created but could not find appropriate spreadsheet for model ${
            formData.model
          } (${formData.paid ? "Paid" : "Free"})`,
          eventId: calendarSuccess.eventId,
          eventLink: calendarSuccess.eventLink,
        },
        { status: 207 } // Partial success
      );
    }

    const { spreadsheetId, sheetName } = spreadsheetInfo;
    log(`Found spreadsheet: ${spreadsheetId} with sheet: ${sheetName}`);

    try {
      // Process Google Sheets operations
      log(
        `Fetching headers from spreadsheet: ${spreadsheetId}, sheet: ${sheetName}`
      );
      const headerRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!1:3`, // Fetch first 3 rows
      });

      const headerRows = headerRes.data.values || [];
      log(`Found ${headerRows.length} header rows`, { headerRows });

      let headers: string[] = [];

      // Find the first row that contains the required headers
      for (let i = 0; i < headerRows.length; i++) {
        if (
          headerRows[i].includes("Time (PST)") &&
          headerRows[i].includes("Content/Flyer")
        ) {
          headers = headerRows[i]; // Set the valid header row
          break;
        }
      }

      if (headers.length === 0) {
        log("Could not find required columns in spreadsheet", { headerRows });
        throw new Error(
          `Could not find required columns. Headers found: ${JSON.stringify(
            headerRows
          )}`
        );
      }

      const filteredHeaders = headers.map((header, index) =>
        header.trim() ? header.trim().toLowerCase() : `empty_${index}`
      );
      log("Filtered headers:", filteredHeaders);

      // Find all required column indexes
      const timeColumnIndex = filteredHeaders.indexOf("time (pst)");
      const flyerColumnIndex = filteredHeaders.indexOf("content/flyer");
      const paywallContentIndex = filteredHeaders.indexOf("paywall content");
      const captionIndex = filteredHeaders.indexOf("caption");
      const priceInfoIndex = filteredHeaders.indexOf("price/info");
      const scheduleIndex = filteredHeaders.indexOf("post schedule");

      log("Column indexes found:", {
        timeColumnIndex,
        flyerColumnIndex,
        paywallContentIndex,
        captionIndex,
        priceInfoIndex,
        scheduleIndex,
      });

      // Check if required columns exist
      if (timeColumnIndex === -1 || flyerColumnIndex === -1) {
        log("Required columns not found", { filteredHeaders });
        throw new Error(
          `Could not find required columns. Headers found: ${filteredHeaders.join(
            ", "
          )}`
        );
      }

      // Get the full sheet data to identify section boundaries
      log("Fetching full sheet data to identify section boundaries");
      const fullDataRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}`,
      });

      log("Full sheet data retrieved");
      const allRows = fullDataRes.data.values || [];
      log(`Total rows in sheet: ${allRows.length}`);

      // Find the row index where "1 Time Post" section starts
      let oneTimePostStartRow = 0;
      for (let i = 0; i < allRows.length; i++) {
        const row = allRows[i];
        if (row && row.some((cell) => cell === "1 Time Post")) {
          oneTimePostStartRow = i + 1; // Add 1 because we want the row after the header
          break;
        }
      }
      log(`"1 Time Post" section starts at row: ${oneTimePostStartRow}`);

      // Find the row index where "Used Post" section starts
      let usedPostStartRow = allRows.length;
      for (let i = oneTimePostStartRow; i < allRows.length; i++) {
        const row = allRows[i];
        if (row && row.some((cell) => cell === "Used Post")) {
          usedPostStartRow = i;
          break;
        }
      }
      log(`"Used Post" section starts at row: ${usedPostStartRow}`);

      // Get sheet metadata to find actual sheet ID
      log("Getting sheet metadata to find actual sheet ID");
      const sheetInfo = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: "sheets.properties",
      });

      const sheetsInfo = sheetInfo.data.sheets || [];
      let actualSheetId = null;

      // Find the sheet with the matching name
      for (const sheet of sheetsInfo) {
        if (sheet.properties?.title === sheetName) {
          actualSheetId = sheet.properties.sheetId;
          break;
        }
      }

      if (actualSheetId === null) {
        log(`Sheet named "${sheetName}" not found in the spreadsheet`);
        throw new Error(
          `Unable to find sheet "${sheetName}" in the spreadsheet`
        );
      }
      log(`Actual sheet ID found: ${actualSheetId}`);

      // Create a new row right before the "Used Post" section
      try {
        log(
          `Attempting to insert new row before "Used Post" section at row ${usedPostStartRow}`
        );
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                insertDimension: {
                  range: {
                    sheetId: actualSheetId,
                    dimension: "ROWS",
                    startIndex: usedPostStartRow,
                    endIndex: usedPostStartRow + 1,
                  },
                  inheritFromBefore: true,
                },
              },
            ],
          },
        });
        log("Successfully inserted new row");
      } catch (error) {
        log("Error inserting row:", error);
        // Continue execution even if this fails - we'll try to use an existing row
      }

      if (!eventStart) {
        throw new Error("eventStart is null or undefined");
      }
      const pstTime = DateTime.fromISO(eventStart, {
        zone: "America/Los_Angeles",
      });

      // Format to "hh:mm a" (e.g., "02:15 PM")
      const formattedTime = pstTime.toFormat("hh:mm a");

      const imageFormula = `=HYPERLINK("${formData.webViewLink}", IMAGE("${formData.thumbnail}"))`;
      log(`Image formula: ${imageFormula}`);

      // Create an array for the row values
      const rowValues = Array(
        Math.max(
          timeColumnIndex,
          flyerColumnIndex,
          scheduleIndex !== -1 ? scheduleIndex : 0,
          paywallContentIndex !== -1 ? paywallContentIndex : 0,
          captionIndex !== -1 ? captionIndex : 0,
          priceInfoIndex !== -1 ? priceInfoIndex : 0
        ) + 1
      ).fill("");
      log("Initialized empty row values array", { rowValues });

      // Populate with our data
      rowValues[timeColumnIndex] = formattedTime;
      rowValues[flyerColumnIndex] = imageFormula;

      // Set Post Schedule to "LIVE"
      if (scheduleIndex !== -1) {
        rowValues[scheduleIndex] = "LIVE POST";
      }

      log("Populated row values", { rowValues });

      // The row where we'll add our new data - right before the Used Post section
      const targetRow = usedPostStartRow + 1; // +1 because sheet rows are 1-indexed and we inserted a row
      log(`Target row for data insertion: ${targetRow}`);

      try {
        // Update the values in the target row
        log(`Updating values in row ${targetRow}`);
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A${targetRow}`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [rowValues],
          },
        });
        log("Successfully updated row values");
      } catch (error) {
        log("Error updating values:", error);
        throw error; // This is critical, so we'll throw the error if it fails
      }

      try {
        // Define the range for all cells to be highlighted
        const columnsToFormat = [
          timeColumnIndex,
          flyerColumnIndex,
          paywallContentIndex,
          captionIndex,
          priceInfoIndex,
          scheduleIndex,
        ].filter((index) => index !== -1);

        const lastColumnIndex = Math.max(...columnsToFormat);
        const firstColumnIndex = Math.min(...columnsToFormat);

        log(
          `Highlighting cells from column ${firstColumnIndex} to ${lastColumnIndex} in row ${targetRow}`
        );

        // Now format the row with yellow background
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                updateCells: {
                  range: {
                    sheetId: actualSheetId,
                    startRowIndex: targetRow - 1,
                    endRowIndex: targetRow,
                    startColumnIndex: firstColumnIndex,
                    endColumnIndex: lastColumnIndex + 1,
                  },
                  rows: [
                    {
                      values: columnsToFormat.map(() => ({
                        userEnteredFormat: {
                          backgroundColor: {
                            red: 1.0,
                            green: 0.0,
                            blue: 1.0,
                          },
                        },
                      })),
                    },
                  ],
                  fields: "userEnteredFormat.backgroundColor",
                },
              },
            ],
          },
        });
        log("Successfully highlighted cells");
      } catch (error) {
        log("Error highlighting cells:", error);
        // Continue execution even if highlighting fails
      }

      const spreadsheetLink = generateSpreadsheetLink(
        spreadsheetId,
        sheetName,
        targetRow,
        actualSheetId ?? 0
      );
      log("Generated spreadsheet link", { spreadsheetLink });

      // Return success response
      return NextResponse.json({
        message: "Event created and logged in Google Sheets",
        eventId: calendarSuccess.eventId,
        eventLink: calendarSuccess.eventLink,
        spreadsheetId,
        sheetName,
        spreadsheetLink,
      });

    } catch (sheetsError: any) {
      log("Error updating spreadsheet:", sheetsError);
      // Return partial success - calendar worked but sheets failed
      return NextResponse.json(
        {
          message:
            "Event created on calendar but failed to update spreadsheet",
          eventId: calendarSuccess.eventId,
          eventLink: calendarSuccess.eventLink,
          spreadsheetError:
            sheetsError instanceof Error
              ? sheetsError.message
              : "Unknown error",
        },
        { status: 207 }
      ); // 207 Multi-Status
    }

  } catch (error: any) {
    log("Error processing request:", error);
    
    // Handle specific error types
    if (error.name === "AuthenticationError" || error.status === 401) {
      return NextResponse.json(
        { message: "Authentication failed", requireAuth: true },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        message: "Failed to process request", 
        error: error.message 
      },
      { status: 500 }
    );
  }
}