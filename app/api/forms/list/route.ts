/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

export async function GET(request: Request) {
  try {
    console.log("Starting forms list request...");

    const session = await auth();

    if (!session || !session.user) {
      console.log("Not authenticated. No session or user found.");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!session.accessToken) {
      console.log("Not authenticated. No access token found in session.");
      return NextResponse.json({ error: "Not authenticated. No access token." }, { status: 401 });
    }

    console.log("Session retrieved:", session.user.email);

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

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId') || "1Jjo19OEpSJC9dLWJxgqfs382Vv-UKwci";

    console.log(`Fetching spreadsheets from folder: ${folderId}`);

    // List all spreadsheets in the folder
    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      fields: 'files(id, name, createdTime, modifiedTime)',
    });

    console.log(`Found ${response.data.files?.length || 0} spreadsheets`);

    const forms = [];
    
    for (const file of response.data.files || []) {
      try {
        // Get headers from first row
        const headerResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: file.id!,
          range: '1:1', // Get first row (headers)
        });

        const headers = headerResponse.data.values?.[0] || [];

        // Get row count for responses
        const rowCount = await sheets.spreadsheets.values.get({
          spreadsheetId: file.id!,
          range: 'A:A',
        });
        const responses = (rowCount.data.values?.length || 1) - 1; // Subtract header row

        // Parse form data
        const fullTitle = file.name || '';
        const parts = fullTitle.split(' - ');
        const creatorEmail = parts[parts.length - 1];
        
        // Parse questions from headers (skip User and Timestamp columns)
        const questions = headers.slice(2).map((header: string, index: number) => ({
          id: `q${index + 1}`,
          title: header.replace(' - required', '').trim(),
          required: header.includes(' - required'),
          column: String.fromCharCode(67 + index), // Start from C
        })).filter((q: any) => q.title);

        forms.push({
          id: file.id,
          spreadsheetId: file.id,
          title: fullTitle,
          fullTitle,
          creatorEmail,
          createdAt: file.createdTime,
          updatedAt: file.modifiedTime,
          questions,
          responses,
        });
      } catch (err) {
        console.error(`Error processing spreadsheet ${file.id}:`, err);
      }
    }

    console.log(`Returning ${forms.length} forms`);
    return NextResponse.json({ forms });

  } catch (error: any) {
    console.error("Error fetching forms:", error);

    if (error.code === 403 && error.errors && error.errors.length > 0) {
      console.error("Google API Permission Error (403):", error.errors[0].message);
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors[0].message || 'The authenticated Google account does not have permission for the folder.'}`
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch forms" },
      { status: 500 }
    );
  }
}