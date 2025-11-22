import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

// Helper to extract Google Sheet file ID from URL
function extractSheetId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string; linkId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }
    const { linkId } = await params;
    if (!linkId) {
      return NextResponse.json(
        { error: "Link ID is required" },
        { status: 400 }
      );
    }

    // Find the sheet link to get the sheetUrl
    const sheetLink = await prisma.clientModelSheetLinks.findUnique({
      where: { id: linkId },
      select: { sheetUrl: true },
    });

    // Delete the sheet link from DB
    await prisma.clientModelSheetLinks.delete({
      where: { id: linkId },
    });

    // If sheetUrl exists, try to delete the Google Sheet from Drive
    if (sheetLink?.sheetUrl) {
      const fileId = extractSheetId(sheetLink.sheetUrl);
      if (fileId) {
        try {
          // Setup Google OAuth2 client (same as generation logic)
          const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
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
          const drive = google.drive({ version: "v3", auth: oauth2Client });
          await drive.files.delete({ fileId });
        } catch (err) {
          console.error("Failed to delete Google Sheet from Drive:", err);
          // Don't fail the API if Drive deletion fails
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting sheet link:", error);
    return NextResponse.json(
      { error: "Failed to delete sheet link" },
      { status: 500 }
    );
  }
}
