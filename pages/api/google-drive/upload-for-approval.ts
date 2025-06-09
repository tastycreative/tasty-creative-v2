/* eslint-disable @typescript-eslint/no-explicit-any */
import { google } from "googleapis";
import { NextApiRequest, NextApiResponse } from "next";
import { auth } from "@/auth";
import busboy from "busboy";

// Disable the default body parser
export const config = {
  api: {
    bodyParser: false,
    // Increase the limit if you're on a paid Vercel plan
    maxDuration: 60, // 60 seconds timeout
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
        error: "Not authenticated. No access token." 
      });
    }

    // Set up OAuth2 client with Auth.js session
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
    const parentFolderId = "1DtsejmJr3k-1ToMgQ1DLgfe3EA36gbMb";
    
    // Process the request using busboy for streaming
    const bb = busboy({ headers: req.headers });
    
    let model = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filePromises: any[] = [];
    const fileMetadata: Record<string, { filename: string; mimeType: string }> = {};

    // Handle form fields
    bb.on('field', (fieldname, val) => {
      if (fieldname === 'model') {
        model = val;
        if (model === "Victoria (V)") {
          model = "V";
        } else if (model === "Tita") {
          model = "Tita Sahara";
        }
      }
    });

    // Handle file uploads
    bb.on('file', (fieldname, fileStream, { filename, mimeType }) => {
      if (!filename) return;
      
      // Store file metadata for later use
      fileMetadata[fieldname] = { filename, mimeType };
      
      // Create a promise for each file upload that will resolve when the upload is complete
      const filePromise = new Promise(async (resolve, reject) => {
        try {
          // First get the target folder IDs
          const modelFolder = await drive.files.list({
            q: `'${parentFolderId}' in parents and name = '${model}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
            fields: "files(id, name)",
          });
  
          if (!modelFolder.data.files?.length) {
            reject(new Error("Model folder not found"));
            return;
          }
  
          const modelFolderId = modelFolder.data.files[0].id;
  
          const approvalFolder = await drive.files.list({
            q: `'${modelFolderId}' in parents and name = 'For Approval✅' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
            fields: "files(id, name)",
          });
  
          if (!approvalFolder.data.files?.length) {
            reject(new Error("'For Approval✅' folder not found"));
            return;
          }
  
          const approvalFolderId = approvalFolder.data.files[0].id;
  
          // Generate appropriate filenames based on the field
          let uploadFileName = `${model}_collage`;
          if (fieldname === 'image') {
            uploadFileName += '.jpg';
          } else if (fieldname === 'gif') {
            uploadFileName += '.gif';
          }
  
          // Upload the file to Google Drive
          if (!fileMetadata[fieldname]?.mimeType || !approvalFolderId) {
            throw new Error("Invalid file metadata or folder ID");
          }

          const fileUpload = await drive.files.create({
            requestBody: {
              name: uploadFileName,
              mimeType: fileMetadata[fieldname].mimeType,
              parents: [approvalFolderId],
            },
            media: {
              mimeType: fileMetadata[fieldname].mimeType,
              body: fileStream,
            },
          });
  
          // Get file link
          const fileLink = await drive.files.get({
            fileId: fileUpload.data.id as string,
            fields: "webViewLink",
          });
  
          resolve({
            type: fieldname,
            id: fileUpload.data.id,
            link: fileLink.data.webViewLink,
          });
        } catch (error) {
          reject(error);
        }
      });
  
      filePromises.push(filePromise);
    });

    // Handle errors during parsing
    bb.on('error', (error) => {
      console.error('Busboy error:', error);
      res.status(500).json({ error: 'File upload error' });
    });

    // Handle the end of the request
    bb.on('close', async () => {
      try {
        // Wait for all file uploads to complete
        const responses = await Promise.all(filePromises);
        res.status(200).json({ success: true, uploads: responses });
      } catch (error: any) {
        console.error('Upload error:', error);
        
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
        
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        res.status(500).json({ error: errorMessage });
      }
    });

    // Pipe the request into busboy
    if (req.socket) {
      req.pipe(bb);
    } else {
      // If req.socket is not available, handle the case (e.g., in local testing)
      res.status(500).json({ error: 'Server configuration error' });
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Server error:", error);
    
    // Handle Google API specific errors at the top level too
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
    
    res.status(500).json({ error: "Server error" });
  }
}