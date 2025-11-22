import { google } from "googleapis";
import { NextRequest } from "next/server";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get("fileId");
  if (!fileId) {
    return new Response(JSON.stringify({ error: "Missing fileId" }), {
      status: 400,
    });
  }

  try {
    const session = await auth();
    if (!session || !session.user || !session.accessToken) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
      });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL
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
      fields: "id, name, parents",
    });
    const parentId = fileMeta.data.parents?.[0];
    const fileName = fileMeta.data.name;
    if (!parentId || !fileName) {
      return new Response(
        JSON.stringify({ error: "No parent or name found for file" }),
        { status: 404 }
      );
    }

    // 2. List all files in the parent folder
    const listRes = await drive.files.list({
      q: `'${parentId}' in parents and trashed = false`,
      fields: "files(id, name, thumbnailLink, mimeType)",
      pageSize: 1000,
    });
    // 3. Find the sibling file with the same name (but different ID)
    const sibling = listRes.data.files?.find(
      (f) => f.name === fileName && f.id !== fileId
    );
    if (sibling) {
      return new Response(
        JSON.stringify({
          id: sibling.id,
          name: sibling.name,
          thumbnailLink: sibling.thumbnailLink,
          mimeType: sibling.mimeType,
        }),
        { status: 200 }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "No sibling file with matching name found" }),
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error("Drive sibling thumbnail API error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { status: 500 }
    );
  }
}
