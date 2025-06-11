import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

// Utility to initialize Google Sheets API client
async function getSheetsClient() {
  const session = await auth();

  if (!session || !session.user) {
    throw new Error("Not authenticated");
  }

  if (!session.accessToken) {
    throw new Error("Not authenticated. No access token.");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
    expiry_date: session.expiresAt ? session.expiresAt * 1000 : undefined, // Convert seconds to milliseconds
  });

  return google.sheets({ version: "v4", auth: oauth2Client });
}

// GET chatting managers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tab = "Chatting Managers";
    const managerFilter = searchParams.get("manager");

    const sheets = await getSheetsClient();
    const spreadsheetId = "1FX5XKSn4Cfk2kx3yNQ7WxdGoPX9-GiRsEckilLM3fQk";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tab}!A:A`,
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      return NextResponse.json([], { status: 200 });
    }

    const [header, ...dataRows] = rows;

    const managers = dataRows
      .map((row, index) => ({
        name: row[0]?.trim() || "",
        rowIndex: index + 2,
      }))
      .filter((entry) => entry.name !== "");

    if (managerFilter) {
      const filtered = managers.filter(
        (m) => m.name.toLowerCase() === managerFilter.toLowerCase()
      );
      return NextResponse.json(filtered, { status: 200 });
    }

    return NextResponse.json(managers, { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("GET: Error fetching chatting managers:", error);
    
    // Check for Google API permission errors (403)
    if (error.code === 403 && error.errors && error.errors.length > 0) {
      console.error(
        "Google API Permission Error (403):",
        error.errors[0].message
      );
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors[0].message || "The authenticated Google account does not have permission for the Google Sheet."}`,
        },
        { status: 403 }
      );
    }

    // Handle authentication errors
    const status = error.message === "Not authenticated" || 
                   error.message === "Not authenticated. No access token." ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

// PUT (update or add manager)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { originalName, newName } = body;

    if (!newName) {
      return NextResponse.json(
        { error: "Missing required field: newName" },
        { status: 400 }
      );
    }

    const sheets = await getSheetsClient();
    const spreadsheetId = "1FX5XKSn4Cfk2kx3yNQ7WxdGoPX9-GiRsEckilLM3fQk";
    const tab = "Chatting Managers";

    // Fetch all rows
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tab}!A:A`,
    });

    const rows = response.data.values || [];
    let rowIndex = -1;

    if (originalName) {
      for (let i = 1; i < rows.length; i++) {
        if (
          (rows[i][0] || "").trim().toLowerCase() ===
          originalName.trim().toLowerCase()
        ) {
          rowIndex = i + 1;
          break;
        }
      }
    }

    if (rowIndex !== -1) {
      // Update existing row
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${tab}!A${rowIndex}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [[newName]],
        },
      });

      return NextResponse.json(
        { success: true, updated: true },
        { status: 200 }
      );
    } else {
      // Append new row
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${tab}!A:A`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [[newName]],
        },
      });

      return NextResponse.json({ success: true, added: true }, { status: 200 });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("PUT: Error updating/adding manager:", error);
    
    // Check for Google API permission errors (403)
    if (error.code === 403 && error.errors && error.errors.length > 0) {
      console.error(
        "Google API Permission Error (403):",
        error.errors[0].message
      );
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors[0].message || "The authenticated Google account does not have permission for the Google Sheet."}`,
        },
        { status: 403 }
      );
    }

    // Handle authentication errors
    const status = error.message === "Not authenticated" || 
                   error.message === "Not authenticated. No access token." ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}