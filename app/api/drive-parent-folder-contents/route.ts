import { google } from "googleapis";
import { NextRequest } from "next/server";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get("fileId");
  if (!fileId) {
    return new Response(JSON.stringify({ error: "Missing fileId" }), { status: 400 });
  }

  try {
    const session = await auth();
    if (!session || !session.user || !session.accessToken) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
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
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // 1. Get the file metadata to find its parent and name
    const fileMeta = await drive.files.get({
      fileId,
      fields: 'id, name, parents'
    });
    const parentId = fileMeta.data.parents?.[0];
    const fileName = fileMeta.data.name;
    if (!parentId || !fileName) {
      return new Response(JSON.stringify({ error: "No parent or name found for file" }), { status: 404 });
    }

    // 2. List all files in the parent folder (like FolderViewer)
    const listRes = await drive.files.list({
      q: `'${parentId}' in parents and trashed = false`,
      fields: 'files(id, name, thumbnailLink, mimeType, webViewLink, createdTime, size, videoMediaMetadata)',
      pageSize: 1000
    });
    // 3. Find the file with the same name
    const match = listRes.data.files?.find(f => f.name === fileName);
    if (match) {
      return new Response(JSON.stringify(match), { status: 200 });
    } else {
      return new Response(JSON.stringify({ error: "No matching file found in parent folder" }), { status: 404 });
    }
  } catch (error: any) {
    console.error("Drive parent folder contents API error:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), { status: 500 });
  }
}
