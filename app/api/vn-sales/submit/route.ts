import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const { id, model, voiceNote, sale, soldDate, status } = await request.json();

    if (!id || !model || !voiceNote || !sale || !soldDate || !status) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: id, model, voiceNote, sale, soldDate, status",
        },
        { status: 400 }
      );
    }

    // Set up OAuth2 client with Auth.js session tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Check if we have the necessary tokens
    if (!session.accessToken) {
      return NextResponse.json(
        {
          error:
            "No access token available. Please re-authenticate with Google.",
        },
        { status: 401 }
      );
    }

    oauth2Client.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken || undefined,
      expiry_date: session.expiresAt ? session.expiresAt * 1000 : undefined,
    });

    // If no refresh token, try to refresh the access token manually
    if (
      !session.refreshToken &&
      session.expiresAt &&
      new Date().getTime() > session.expiresAt * 1000
    ) {
      return NextResponse.json(
        {
          error:
            "Access token expired and no refresh token available. Please re-authenticate with Google.",
        },
        { status: 401 }
      );
    }

    // Initialize the Google Sheets API
    const sheets = google.sheets({ version: "v4", auth: oauth2Client });

    const spreadsheetId = "1_a08KImbkIA3z0_DTGWoqJdnRiw1y-kygj-Wr2cB_gk";
    const sheetName = model.replace(/^OF\s+/i, "").trim(); // Remove 'OF ' prefix if present

    // Format the data for the spreadsheet
    // Headers: 'id' 'Voice Note' 'Sale' 'Sold Date' 'Status'
    const rowData = [
      id, // history_item_id
      voiceNote,
      sale,
      new Date(soldDate).toLocaleDateString() + ' ' + new Date(soldDate).toLocaleTimeString(),
      status,
    ];

    // Append to the specific model sheet
    const range = `${sheetName}!A:E`;

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values: [rowData],
      },
    });

    return NextResponse.json({
      success: true,
      message: "Voice note sale submitted successfully",
      data: {
        id,
        model,
        voiceNote,
        sale,
        soldDate,
        status,
      },
    });
  } catch (error: any) {
    console.error("Error submitting VN sale:", error);

    // Handle Google API permission errors specifically
    if (error.code === 403 && error.errors && error.errors.length > 0) {
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors[0].message || "The authenticated Google account does not have permission for the Google Sheet."}`,
        },
        { status: 403 }
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
