import { google } from "googleapis";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!session.accessToken) {
      return NextResponse.json(
        { error: "Not authenticated. No access token." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { requestedBy, model, sextingSet, specialRequest } = body;

    // Validate required fields
    if (!requestedBy || !model || !sextingSet || !specialRequest) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
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
    const spreadsheetId = "1hmC08YXrDygHzQiMd-33MJBT26QEoSaBnvvMozsIop0";

    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Manila",
    });

    const user = `${session.user.name || "Unknown"} (${session.user.email})`;

    // Append the new row
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Requests!A1:F1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[timestamp, user, requestedBy, model, sextingSet, specialRequest]],
      },
    });

    return NextResponse.json({ message: "Request added successfully." });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error adding data to Requests sheet:", error);

    if (error.code === 403 && error.errors && error.errors.length > 0) {
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors[0].message}`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to add row", details: error.message },
      { status: 500 }
    );
  }
}
