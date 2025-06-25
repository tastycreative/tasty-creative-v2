
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    // Get session using Auth.js
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { requesterName, modelName, sextingSet, specialRequests, dateRequested, status } = body;

    // Validate required fields
    if (!requesterName || !modelName || !sextingSet) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Initialize Google Sheets API
    const auth2 = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth: auth2 });
    
    // Use environment variable for requests sheet ID, fallback to main SWD sheet
    const spreadsheetId = process.env.GOOGLE_SHEET_SWD_REQUESTS_ID || process.env.GOOGLE_SHEET_SWD_ID;
    
    if (!spreadsheetId) {
      throw new Error("No spreadsheet ID configured");
    }

    // Prepare the row data
    const values = [
      [
        dateRequested,
        requesterName,
        modelName,
        sextingSet,
        specialRequests || "",
        status || "Pending",
        session.user.name || session.user.email || "Unknown User"
      ]
    ];

    // Append the data to the sheet
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Requests!A:G", // Assuming a "Requests" sheet with columns A-G
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values,
      },
    });

    return NextResponse.json({
      message: "Request submitted successfully",
      updatedCells: result.data.updates?.updatedCells,
    });

  } catch (error) {
    console.error("Error submitting request:", error);
    return NextResponse.json(
      { 
        error: "Failed to submit request", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Initialize Google Sheets API
    const auth2 = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth: auth2 });
    
    const spreadsheetId = process.env.GOOGLE_SHEET_SWD_REQUESTS_ID || process.env.GOOGLE_SHEET_SWD_ID;
    
    if (!spreadsheetId) {
      throw new Error("No spreadsheet ID configured");
    }

    // Get the requests data
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Requests!A:G",
    });

    const rows = result.data.values || [];
    
    // Skip header row and format data
    const requests = rows.slice(1).map((row, index) => ({
      id: index + 1,
      dateRequested: row[0] || "",
      requesterName: row[1] || "",
      modelName: row[2] || "",
      sextingSet: row[3] || "",
      specialRequests: row[4] || "",
      status: row[5] || "Pending",
      submittedBy: row[6] || "",
    }));

    return NextResponse.json({
      requests,
      total: requests.length,
    });

  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch requests", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
