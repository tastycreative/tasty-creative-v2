import { google } from "googleapis";
import { NextApiRequest, NextApiResponse } from "next";
import { auth } from "@/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get session using Auth.js
    const session = await auth();

    if (!session || !session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!session.accessToken) {
      return res.status(401).json({
        error: "Not authenticated. No access token.",
      });
    }

    const { model, fileType } = req.body;
    if (!model || !fileType) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Convert model name if needed
    let modelName = model;
    if (modelName === "Victoria (V)") {
      modelName = "V";
    } else if (modelName === "Tita") {
      modelName = "Tita Sahara";
    }

    // Determine mime type based on fileType
    let mimeType = "image/jpeg";
    let fileExtension = ".jpg";
    if (fileType === "gif") {
      mimeType = "image/gif";
      fileExtension = ".gif";
    }

    // Set up OAuth2 client with Auth.js session
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
    const parentFolderId = "1DtsejmJr3k-1ToMgQ1DLgfe3EA36gbMb";

    // 1. Find model folder
    const modelFolder = await drive.files.list({
      q: `'${parentFolderId}' in parents and name = '${modelName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id, name)",
    });

    if (!modelFolder.data.files?.length) {
      return res.status(404).json({ error: "Model folder not found" });
    }

    const modelFolderId = modelFolder.data.files[0].id;

    // 2. Find 'For Approval✅' subfolder
    const approvalFolder = await drive.files.list({
      q: `'${modelFolderId}' in parents and name = 'For Approval✅' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id, name)",
    });

    if (!approvalFolder.data.files?.length) {
      return res
        .status(404)
        .json({ error: "'For Approval✅' folder not found" });
    }

    const approvalFolderId = approvalFolder.data.files[0].id;

    // Create a placeholder file
    const fileName = `${modelName}_collage${fileExtension}`;
    const fileMetadata = {
      name: fileName,
      parents: approvalFolderId ? [approvalFolderId] : [],
      mimeType: mimeType,
    };

    // Create the file first (this creates a placeholder)
    const file = await drive.files.create({
      requestBody: fileMetadata,
      fields: "id",
    });

    const fileId = file.data.id;

    // Get file details
    const fileDetails = await drive.files.get({
      fileId: fileId as string,
      fields: "id,name,webViewLink",
    });

    // Generate a resumable upload URL
    const uploadUrl = await new Promise<string>((resolve, reject) => {
      oauth2Client
        .getRequestHeaders()
        .then((headers) => {
          // Prepare the URL for creating a resumable upload session
          const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=resumable`;

          // Set up the HTTP request to create a resumable upload session
          fetch(url, {
            method: "PATCH",
            headers: {
              Authorization: headers.Authorization,
              "Content-Type": "application/json",
              "X-Upload-Content-Type": mimeType,
            },
            body: JSON.stringify({ name: fileName }),
          })
            .then((response) => {
              if (response.status === 200) {
                // The 'Location' header contains the resumable upload URL
                const location = response.headers.get("Location");
                if (location) {
                  resolve(location);
                } else {
                  reject(new Error("No upload URL in response"));
                }
              } else {
                reject(
                  new Error(
                    `Failed to create resumable upload session: ${response.status}`
                  )
                );
              }
            })
            .catch((err) => reject(err));
        })
        .catch((err) => reject(err));
    });

    return res.status(200).json({
      success: true,
      fileId: fileId,
      uploadUrl: uploadUrl,
      webViewLink: fileDetails.data.webViewLink,
      fileName: fileName,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error:", error);

    // Handle Google API specific errors
    if (error.code === 403 && error.errors && error.errors.length > 0) {
      console.error(
        "Google API Permission Error (403):",
        error.errors[0].message
      );
      return res.status(403).json({
        error: "GooglePermissionDenied",
        message: `Google API Error: ${error.errors[0].message || "The authenticated Google account does not have permission for Google Drive."}`,
      });
    }

    return res.status(500).json({ error: "Server error" });
  }
}
