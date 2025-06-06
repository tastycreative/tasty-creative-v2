/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

export async function POST(request: Request) {
  try {
    console.log("Starting form creation...");

    const session = await auth();

    if (!session || !session.user || !session.user.email) {
      console.log("Not authenticated. No session or user found.");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!session.accessToken) {
      console.log("Not authenticated. No access token found in session.");
      return NextResponse.json({ error: "Not authenticated. No access token." }, { status: 401 });
    }

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

    const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const { title, headers, folderId } = await request.json();

    console.log(`Creating spreadsheet: ${title}`);

    // Create new spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title,
        },
        sheets: [
          {
            properties: {
              title: 'Responses',
            },
            data: [
              {
                rowData: [
                  {
                    values: headers.map((header: string) => ({
                      userEnteredValue: { stringValue: header },
                    })),
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    console.log(`Spreadsheet created with ID: ${spreadsheet.data.spreadsheetId}`);

    // Move to specified folder
    await drive.files.update({
      fileId: spreadsheet.data.spreadsheetId!,
      addParents: folderId,
      fields: 'id, parents',
    });

    console.log(`Moved spreadsheet to folder: ${folderId}`);

    return NextResponse.json({ 
      success: true, 
      spreadsheetId: spreadsheet.data.spreadsheetId 
    });

  } catch (error: any) {
    console.error("Error creating form:", error);

    if (error.code === 403 && error.errors && error.errors.length > 0) {
      console.error("Google API Permission Error (403):", error.errors[0].message);
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors[0].message || 'The authenticated Google account does not have permission to create spreadsheets.'}`
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create form" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    console.log("Starting form update...");

    const session = await auth();

    if (!session || !session.user || !session.user.email) {
      console.log("Not authenticated. No session or user found.");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!session.accessToken) {
      console.log("Not authenticated. No access token found in session.");
      return NextResponse.json({ error: "Not authenticated. No access token." }, { status: 401 });
    }

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

    const sheets = google.sheets({ version: "v4", auth: oauth2Client });

    const { spreadsheetId, title, headers } = await request.json();

    console.log(`Updating spreadsheet: ${spreadsheetId}`);

    // Update spreadsheet title
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            updateSpreadsheetProperties: {
              properties: {
                title,
              },
              fields: 'title',
            },
          },
        ],
      },
    });

    // Update headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'A1:Z1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers],
      },
    });

    console.log("Spreadsheet updated successfully");

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Error updating form:", error);

    if (error.code === 403 && error.errors && error.errors.length > 0) {
      console.error("Google API Permission Error (403):", error.errors[0].message);
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors[0].message || 'The authenticated Google account does not have permission to update this spreadsheet.'}`
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update form" },
      { status: 500 }
    );
  }
}