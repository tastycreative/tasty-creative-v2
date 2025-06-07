/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/forms/[formId]/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!session.accessToken) {
      return NextResponse.json({ error: "Not authenticated. No access token." }, { status: 401 });
    }

    // Await params to get formId
    const { formId } = await params;

    const oauth2Client = new google.auth.OAuth2(
      process.env.AUTH_GOOGLE_ID,
      process.env.AUTH_GOOGLE_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
    );

    oauth2Client.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
      expiry_date: session.expiresAt ? session.expiresAt * 1000 : undefined,
    });

    const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Get spreadsheet details
    const file = await drive.files.get({
      fileId: formId,
      fields: 'id, name, createdTime, modifiedTime',
    });

    // Get headers from first row
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: formId,
      range: '1:1',
    });

    const headers = headerResponse.data.values?.[0] || [];
    
    // Parse form data
    const fullTitle = file.data.name || '';
    const parts = fullTitle.split(' - ');
    const creatorEmail = parts[parts.length - 1];
    
    // Parse questions from headers (skip User and Timestamp columns)
    const questions = headers.slice(2).map((header: string, index: number) => ({
      id: `q${index + 1}`,
      title: header.replace(' - required', '').trim(),
      required: header.includes(' - required'),
      column: String.fromCharCode(67 + index), // Start from C
    })).filter((q: any) => q.title);

    const form = {
      id: formId,
      spreadsheetId: formId,
      title: fullTitle,
      fullTitle,
      creatorEmail,
      createdAt: file.data.createdTime,
      updatedAt: file.data.modifiedTime,
      questions,
    };

    return NextResponse.json({ form });

  } catch (error: any) {
    console.error("Error fetching form:", error);
    return NextResponse.json(
      { error: "Failed to fetch form" },
      { status: 500 }
    );
  }
}