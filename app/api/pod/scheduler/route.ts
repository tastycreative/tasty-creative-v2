import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

// Function to extract spreadsheet ID from Google Sheets URL
function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

export async function POST(request: NextRequest) {
  try {
    // Try different authentication methods
    let sheets;

    // First, try with API key for public spreadsheets
    if (process.env.AUTH_API_KEY) {
      console.log("Trying API key authentication for scheduler data");
      try {
        sheets = google.sheets({
          version: "v4",
          auth: process.env.AUTH_API_KEY,
        });
      } catch (apiKeyError) {
        console.log("API key setup failed:", apiKeyError.message);
        sheets = null;
      }
    }

    // If API key failed or not available, try session-based authentication
    if (!sheets) {
      const session = await auth();

      if (!session || !session.user || !session.accessToken) {
        return NextResponse.json(
          {
            error:
              "Authentication not available - need user login or valid API key",
          },
          { status: 401 }
        );
      }

      console.log("Using session-based authentication for scheduler data");
      const oauth2Client = new google.auth.OAuth2(
        process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
        process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
        process.env.NEXTAUTH_URL
      );

      oauth2Client.setCredentials({
        access_token: session.accessToken,
        refresh_token: session.refreshToken,
        expiry_date: session.expiresAt ? session.expiresAt * 1000 : undefined,
      });

      sheets = google.sheets({ version: "v4", auth: oauth2Client });
    }

    const { sheetUrl } = await request.json();

    if (!sheetUrl) {
      return NextResponse.json(
        { error: "Sheet URL is required" },
        { status: 400 }
      );
    }

    const spreadsheetId = extractSpreadsheetId(sheetUrl);
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "Invalid Google Sheets URL" },
        { status: 400 }
      );
    }

    try {
      // Fetch data from C6:I range to get the scheduler data
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "C6:I61", // Extended range to ensure we get all data
      });

      // Fetch data from M8:R range to get the full schedule setup
      const fullScheduleResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "M8:R", // Range for full schedule setup data
      });

      const values = response.data.values || [];
      const fullScheduleValues = fullScheduleResponse.data.values || [];
      console.log("Raw data from C6:I61:", values);
      console.log("Raw data from M8:R:", fullScheduleValues);

      // Parse the scheduler data structure
      const schedulerData = parseSchedulerData(values);

      // Parse the full schedule setup data
      const fullScheduleSetup = parseFullScheduleSetup(fullScheduleValues);

      // Extract schedule name from the first row (C6:I61 where first row is at index 0)
      const scheduleRow = values[0] || [];
      const scheduleName = scheduleRow[5] || "Schedule #1A"; // Column H (index 5) contains "Schedulle #1A"

      console.log(`Successfully fetched scheduler data`);
      return NextResponse.json({
        schedulerData: schedulerData.scheduleData,
        scheduleCheckerData: schedulerData.scheduleCheckerData,
        fullScheduleSetup: fullScheduleSetup,
        currentSchedule: scheduleName,
      });
    } catch (sheetsError) {
      console.error(
        "Error fetching scheduler data from Google Sheets:",
        sheetsError
      );

      // If API key failed and we haven't tried OAuth yet, try OAuth
      if (process.env.AUTH_API_KEY && !sheets.auth.credentials) {
        console.log(
          "API key authentication failed for scheduler, trying OAuth..."
        );

        try {
          const session = await auth();

          if (session && session.user && session.accessToken) {
            const oauth2Client = new google.auth.OAuth2(
              process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
              process.env.AUTH_GOOGLE_SECRET ||
                process.env.GOOGLE_CLIENT_SECRET,
              process.env.NEXTAUTH_URL
            );

            oauth2Client.setCredentials({
              access_token: session.accessToken,
              refresh_token: session.refreshToken,
              expiry_date: session.expiresAt
                ? session.expiresAt * 1000
                : undefined,
            });

            const oauthSheets = google.sheets({
              version: "v4",
              auth: oauth2Client,
            });

            const oauthResponse = await oauthSheets.spreadsheets.values.get({
              spreadsheetId,
              range: "C6:I61",
            });

            const oauthFullScheduleResponse =
              await oauthSheets.spreadsheets.values.get({
                spreadsheetId,
                range: "M8:R",
              });

            const values = oauthResponse.data.values || [];
            const fullScheduleValues =
              oauthFullScheduleResponse.data.values || [];

            const schedulerData = parseSchedulerData(values);
            const fullScheduleSetup =
              parseFullScheduleSetup(fullScheduleValues);
            const scheduleRow = values[0] || [];
            const scheduleName = scheduleRow[5] || "Schedule #1A";

            console.log(`OAuth fallback successful for scheduler data`);
            return NextResponse.json({
              schedulerData: schedulerData.scheduleData,
              scheduleCheckerData: schedulerData.scheduleCheckerData,
              fullScheduleSetup: fullScheduleSetup,
              currentSchedule: scheduleName,
            });
          }
        } catch (oauthError) {
          console.error(
            "OAuth fallback also failed for scheduler:",
            oauthError
          );
        }
      }

      return NextResponse.json(
        { error: "Failed to access Google Sheets. Please check permissions." },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("Error fetching scheduler data:", error);
    return NextResponse.json(
      { error: "Failed to fetch scheduler data" },
      { status: 500 }
    );
  }
}

function parseSchedulerData(values: string[][]): {
  scheduleData: Array<{ type: string; status: string }>;
  scheduleCheckerData: {
    massMessages: Array<{ text: string; checker: string }>;
    wallPosts: Array<{ text: string; checker: string }>;
  };
} {
  const scheduleData: Array<{
    type: string;
    status: string;
  }> = [];

  const scheduleCheckerData: {
    massMessages: Array<{ text: string; checker: string }>;
    wallPosts: Array<{ text: string; checker: string }>;
  } = {
    massMessages: [],
    wallPosts: [],
  };

  if (values.length < 10) {
    console.log("Not enough rows for scheduler data");
    return {
      scheduleData,
      scheduleCheckerData,
    };
  }

  console.log("Parsing scheduler data structure...");

  // Look for "Broad Schedule Overview" around rows 6-7 (C12:I13 in original sheet)
  let overviewRowIndex = -1;
  for (let i = 0; i < Math.min(values.length, 10); i++) {
    const row = values[i];
    if (
      row.some(
        (cell) => cell && cell.toLowerCase().includes("broad schedule overview")
      )
    ) {
      overviewRowIndex = i;
      console.log('Found "Broad Schedule Overview" at row index:', i);
      break;
    }
  }

  if (overviewRowIndex === -1) {
    console.log('No "Broad Schedule Overview" found');
    return {
      scheduleData,
      scheduleCheckerData,
    };
  }

  // Look for Type:/Status: headers 2 rows after overview (C14:I15 in original sheet)
  const headerRowIndex = overviewRowIndex + 2;

  if (headerRowIndex >= values.length) {
    console.log("No header row found");
    return {
      scheduleData,
      scheduleCheckerData,
    };
  }

  const headerRow = values[headerRowIndex];
  console.log("Header row:", headerRow);

  // Find positions of Type and Status headers
  const typePositions: number[] = [];
  const statusPositions: number[] = [];

  headerRow.forEach((cell, index) => {
    if (cell && cell.toLowerCase().includes("type")) {
      typePositions.push(index);
    } else if (cell && cell.toLowerCase().includes("status")) {
      statusPositions.push(index);
    }
  });

  console.log("Type positions:", typePositions);
  console.log("Status positions:", statusPositions);

  // Process data rows (C16:I20 in original sheet)
  const dataStartRow = headerRowIndex + 1;
  const dataEndRow = Math.min(dataStartRow + 10, values.length); // Process up to 10 rows to account for gaps

  for (let rowIndex = dataStartRow; rowIndex < dataEndRow; rowIndex++) {
    const dataRow = values[rowIndex];

    // Skip empty rows but continue processing (don't break)
    if (!dataRow || dataRow.every((cell) => !cell || cell.trim() === "")) {
      console.log("Skipping empty row at index", rowIndex);
      continue;
    }

    // Stop if we hit "Schedule Checker" or similar section headers
    if (
      dataRow.some(
        (cell) => cell && cell.toLowerCase().includes("schedule checker")
      )
    ) {
      console.log("Reached Schedule Checker section, stopping data parsing");
      break;
    }

    // First type/status pair (columns 0-3 for type, column 4 for status)
    if (typePositions.length > 0 && statusPositions.length > 0) {
      const type1 = dataRow[typePositions[0]] || "";
      const status1 = dataRow[statusPositions[0]] || "";

      // Additional filter to exclude section headers
      if (
        type1.trim() !== "" &&
        !type1.toLowerCase().includes("schedule checker")
      ) {
        scheduleData.push({
          type: type1.trim().replace(":", ""), // Remove colon from type
          status: status1.trim(),
        });
      }
    }

    // Second type/status pair (column 5 for type, column 6 for status)
    if (typePositions.length > 1 && statusPositions.length > 1) {
      const type2 = dataRow[typePositions[1]] || "";
      const status2 = dataRow[statusPositions[1]] || "";

      // Additional filter to exclude section headers
      if (
        type2.trim() !== "" &&
        !type2.toLowerCase().includes("schedule checker")
      ) {
        scheduleData.push({
          type: type2.trim().replace(":", ""), // Remove colon from type
          status: status2.trim(),
        });
      }
    }
  }

  // Parse Schedule Checker section
  // Look for "Schedule Checker" around row 18 (C24:I25 in original sheet)
  let scheduleCheckerRowIndex = -1;
  for (let i = 15; i < Math.min(values.length, 25); i++) {
    const row = values[i];
    if (
      row.some(
        (cell) => cell && cell.toLowerCase().includes("schedule checker")
      )
    ) {
      scheduleCheckerRowIndex = i;
      console.log('Found "Schedule Checker" at row index:', i);
      break;
    }
  }

  if (scheduleCheckerRowIndex !== -1) {
    // Look for Mass Messages and Wall Posts headers 2-3 rows after Schedule Checker
    const massMessagesStartRow = scheduleCheckerRowIndex + 2;
    const dataProcessingEndRow = Math.min(
      massMessagesStartRow + 40,
      values.length
    ); // Process up to 40 rows

    for (
      let rowIndex = massMessagesStartRow;
      rowIndex < dataProcessingEndRow;
      rowIndex++
    ) {
      const dataRow = values[rowIndex];

      if (!dataRow || dataRow.every((cell) => !cell || cell.trim() === "")) {
        continue;
      }

      // Skip header rows
      if (
        dataRow.some(
          (cell) =>
            cell &&
            (cell.toLowerCase().includes("mass messages:") ||
              cell.toLowerCase().includes("wall posts:") ||
              cell.toLowerCase().includes("checker:"))
        )
      ) {
        console.log("Skipping header row at:", rowIndex);
        continue;
      }

      // Process Mass Messages data - check columns 0-3 for text content
      let massMessageText = "";
      let massMessageValue = "";

      // Find the first non-empty cell in columns 0-3 for the message text
      for (let col = 0; col < 4; col++) {
        if (dataRow[col] && dataRow[col].trim() !== "") {
          massMessageText = dataRow[col].trim();
          break;
        }
      }

      // Get the value from column 4 (checker column for mass messages)
      massMessageValue = dataRow[4] || "";

      if (
        massMessageText !== "" &&
        massMessageText.toLowerCase() !== "checker:"
      ) {
        scheduleCheckerData.massMessages.push({
          text: massMessageText,
          checker: massMessageValue.trim(),
        });
      }

      // Process Wall Posts data - check columns 5-6 for wall post content
      const wallPostText = dataRow[5] || ""; // Column H (index 5)
      const wallPostValue = dataRow[6] || ""; // Column I (index 6)

      if (
        wallPostText.trim() !== "" &&
        !wallPostText.toLowerCase().includes("checker")
      ) {
        scheduleCheckerData.wallPosts.push({
          text: wallPostText.trim(),
          checker: wallPostValue.trim(),
        });
      }
    }
  }

  console.log("Parsed scheduler data:", scheduleData);
  console.log("Parsed schedule checker data:", scheduleCheckerData);

  return {
    scheduleData,
    scheduleCheckerData,
  };
}

function parseFullScheduleSetup(values: string[][]): Array<{
  mmTime: string;
  massMessageType: string;
  postTime: string;
  wallPostType: string;
  storyTime: string;
  storyPostTime: string;
}> {
  const fullScheduleSetup: Array<{
    mmTime: string;
    massMessageType: string;
    postTime: string;
    wallPostType: string;
    storyTime: string;
    storyPostTime: string;
  }> = [];

  console.log("Parsing full schedule setup data from M8:R range...");
  console.log("Full schedule values:", values);

  if (!values || values.length === 0) {
    console.log("No full schedule setup data found");
    return fullScheduleSetup;
  }

  // Process each row from M8:R range
  // Expected columns: M (mmTime), N (massMessageType), O (postTime), P (wallPostType), Q (storyTime), R (storyPostTime)
  for (let rowIndex = 0; rowIndex < values.length; rowIndex++) {
    const row = values[rowIndex];

    // Skip empty rows
    if (!row || row.every((cell) => !cell || cell.trim() === "")) {
      continue;
    }

    // Extract data from each column (M8:R corresponds to indices 0-5)
    const mmTime = row[0] || '""';
    const massMessageType = row[1] || '""';
    const postTime = row[2] || '""';
    const wallPostType = row[3] || '""';
    const storyTime = row[4] || '""';
    const storyPostTime = row[5] || '""';

    // Add to the array if at least one field has meaningful data
    if (
      mmTime !== '""' ||
      massMessageType !== '""' ||
      postTime !== '""' ||
      wallPostType !== '""' ||
      storyTime !== '""' ||
      storyPostTime !== '""'
    ) {
      fullScheduleSetup.push({
        mmTime: mmTime.trim(),
        massMessageType: massMessageType.trim(),
        postTime: postTime.trim(),
        wallPostType: wallPostType.trim(),
        storyTime: storyTime.trim(),
        storyPostTime: storyPostTime.trim(),
      });
    }
  }

  console.log("Parsed full schedule setup:", fullScheduleSetup);
  return fullScheduleSetup;
}
