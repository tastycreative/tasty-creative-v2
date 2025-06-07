/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/forms/submit/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

export async function POST(request: Request) {
  try {
    console.log("Starting form submission...");

    const session = await auth();

    if (!session || !session.user) {
      console.log("Not authenticated. No session or user found.");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!session.accessToken) {
      console.log("Not authenticated. No access token found in session.");
      return NextResponse.json(
        { error: "Not authenticated. No access token." },
        { status: 401 }
      );
    }

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

    // Parse request body
    const { spreadsheetId, formId, formTitle, creatorEmail, data } =
      await request.json();

    console.log(`Submitting to spreadsheet: ${spreadsheetId}`);
    console.log(`Form ID: ${formId}`);
    console.log(`Form Title: ${formTitle}`);
    console.log(`Creator Email: ${creatorEmail}`);

    // Get headers to map data correctly
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "A1:Z1",
    });

    const headers = headerResponse.data.values?.[0] || [];

    // Create row data in correct order
    const rowData = headers.map((header: string, index: number) => {
      if (index === 0) {
        // Column A - User
        return (
          data.User ||
          `${session.user?.name || ""} (${session.user?.email || ""})`
        );
      }
      if (index === 1) {
        // Column B - Timestamp
        return data.Timestamp || new Date().toISOString();
      }

      // For other columns, match by header name (remove " - required" suffix)
      const headerClean = header.replace(" - required", "").trim();

      // Try to find the data by header name
      return data[headerClean] || "";
    });

    // Append to spreadsheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "A:Z",
      valueInputOption: "RAW",
      requestBody: {
        values: [rowData],
      },
    });

    console.log("Form submitted successfully to spreadsheet");

    // Send email notification to form creator
    try {
      // Dynamic import to avoid client-side module resolution issues
      const { sendFormSubmissionEmail } = await import("@/lib/email");

      await sendFormSubmissionEmail({
        to: creatorEmail,
        formTitle: formTitle.replace(` - ${creatorEmail}`, ""),
        submitterName: session.user?.name || "Anonymous",
        submitterEmail: session.user?.email || "No email",
        submissionData: {
          ...data,
          User:
            data.User ||
            `${session.user?.name || ""} (${session.user?.email || ""})`,
          Timestamp: data.Timestamp || new Date().toISOString(),
        },
        formResultsUrl: `${process.env.NEXTAUTH_URL}/apps/forms/${formId}/results`,
      });

      console.log("Email notification sent successfully to:", creatorEmail);
    } catch (emailError) {
      console.error("Error sending email notification:", emailError);
      // Don't fail the submission if email fails
      // You might want to log this to a monitoring service
    }

    // Optionally send confirmation email to submitter
    if (session.user?.email) {
      try {
        const { sendSubmissionConfirmationEmail } = await import("@/lib/email");

        await sendSubmissionConfirmationEmail({
          to: session.user.email,
          formTitle: formTitle.replace(` - ${creatorEmail}`, ""),
          submissionData: {
            ...data,
            User:
              data.User ||
              `${session.user?.name || ""} (${session.user?.email || ""})`,
            Timestamp: data.Timestamp || new Date().toISOString(),
          },
        });

        console.log(
          "Confirmation email sent to submitter:",
          session.user.email
        );
      } catch (confirmError) {
        console.error("Error sending confirmation email:", confirmError);
        // Don't fail the submission if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Form submitted successfully and notifications sent",
    });
  } catch (error: any) {
    console.error("Error submitting form:", error);

    if (error.code === 403 && error.errors && error.errors.length > 0) {
      console.error(
        "Google API Permission Error (403):",
        error.errors[0].message
      );
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors[0].message || "The authenticated Google account does not have permission to edit this spreadsheet."}`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to submit form",
        message: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
