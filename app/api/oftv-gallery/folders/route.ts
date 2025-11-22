import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const galleryId = searchParams.get("galleryId");
    const clientModelId = searchParams.get("clientModelId");
    const folderId = searchParams.get("folderId"); // For navigating into subfolders

    // If no galleryId or clientModelId provided, return all OFTVGallery records as folders
    if (!galleryId && !clientModelId && !folderId) {
      const galleries = await prisma.oFTVGallery.findMany({
        where: {
          parentFolderLink: {
            not: null,
          },
        },
        include: {
          clientModel: {
            select: {
              clientName: true,
            },
          },
        },
        orderBy: {
          clientModel: {
            clientName: "asc",
          },
        },
      });

      // Return galleries as folders
      const galleryFolders = galleries.map((gallery: any) => ({
        id: gallery.id, // Use the actual gallery database ID
        name: gallery.clientModel.clientName,
        webViewLink: `https://drive.google.com/drive/folders/${gallery.parentFolderLink}`, // Direct link to Google Drive
        itemCount: 0, // Will be populated when clicked
        createdAt: gallery.createdAt.toISOString(),
        modifiedAt: gallery.updatedAt.toISOString(),
        isPublished: false,
        isGallery: true, // Flag to indicate this is a gallery folder, not a Drive folder
        clientModel: gallery.clientModel.clientName,
        clientModelId: gallery.clientModelId,
        parentFolderLink: gallery.parentFolderLink,
        driveFolderId: gallery.parentFolderLink, // The Drive folder ID
      }));

      return NextResponse.json({
        success: true,
        clientModel: "All OFTV Models",
        folders: galleryFolders,
        publishedFolders: [],
        totalFolders: galleryFolders.length,
        totalPublishedFolders: 0,
      });
    }

    // Setup OAuth2 client for Google Drive API
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

    // If folderId is provided, we're navigating into a subfolder
    if (folderId) {
      console.log("Fetching contents of subfolder:", folderId);

      // Verify access to the folder
      try {
        const folderCheck = await drive.files.get({
          fileId: folderId,
          fields: "id, name, mimeType, parents, capabilities",
          supportsAllDrives: true,
        });
        console.log("Subfolder access check:", {
          id: folderCheck.data.id,
          name: folderCheck.data.name,
          parents: folderCheck.data.parents,
        });
      } catch (error: any) {
        console.error("Cannot access subfolder:", error.message);
        const userEmail = (session as any).user?.email || "your account";
        return NextResponse.json(
          {
            error: "Cannot access folder",
            details: `You don't have permission to access this folder. Please ask the folder owner to share it with ${userEmail}.`,
            code: error.code,
            folderId,
          },
          { status: 403 }
        );
      }

      // Fetch folders and files in this subfolder
      const [foldersResponse, filesResponse] = await Promise.all([
        drive.files.list({
          q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
          fields: "files(id, name, webViewLink, modifiedTime, createdTime)",
          orderBy: "name",
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        }),
        drive.files.list({
          q: `'${folderId}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false`,
          fields:
            "files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink, modifiedTime, createdTime, size, imageMediaMetadata, videoMediaMetadata)",
          orderBy: "name",
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        }),
      ]);

      const folders = foldersResponse.data.files || [];
      const files = filesResponse.data.files || [];

      // Format folders with item counts
      const foldersWithCounts = await Promise.all(
        folders.map(async (folder) => {
          const itemsResponse = await drive.files.list({
            q: `'${folder.id}' in parents and trashed=false`,
            fields: "files(id)",
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
          });

          return {
            id: folder.id,
            name: folder.name,
            webViewLink: folder.webViewLink,
            itemCount: itemsResponse.data.files?.length || 0,
            createdAt: folder.createdTime,
            modifiedAt: folder.modifiedTime,
            isFolder: true,
          };
        })
      );

      // Format files
      const formattedFiles = files.map((file) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        thumbnailLink: file.thumbnailLink,
        size: file.size,
        createdAt: file.createdTime,
        modifiedAt: file.modifiedTime,
        isFolder: false,
        // Image metadata
        width: file.imageMediaMetadata?.width,
        height: file.imageMediaMetadata?.height,
        // Video metadata
        durationMillis: file.videoMediaMetadata?.durationMillis,
      }));

      return NextResponse.json({
        success: true,
        folderId,
        folders: foldersWithCounts,
        files: formattedFiles,
        totalFolders: foldersWithCounts.length,
        totalFiles: formattedFiles.length,
        totalItems: foldersWithCounts.length + formattedFiles.length,
      });
    }

    // Fetch specific gallery's folders from Google Drive
    const gallery = await prisma.oFTVGallery.findUnique({
      where: galleryId ? { id: galleryId } : { clientModelId: clientModelId! },
      include: {
        clientModel: {
          select: {
            clientName: true,
          },
        },
      },
    });

    if (!gallery?.parentFolderLink) {
      return NextResponse.json(
        {
          error: "No parent folder link configured for this gallery",
          folders: [],
          publishedFolders: [],
        },
        { status: 200 }
      );
    }

    const parentFolderId = gallery.parentFolderLink;

    console.log("Fetching folders from Drive for gallery:", {
      galleryId: gallery.id,
      clientModel: gallery.clientModel.clientName,
      parentFolderId,
    });

    // First, verify we can access the parent folder itself
    try {
      const folderCheck = await drive.files.get({
        fileId: parentFolderId,
        fields: "id, name, mimeType, capabilities",
        supportsAllDrives: true, // Support Shared Drives
      });
      console.log("Parent folder access check:", {
        id: folderCheck.data.id,
        name: folderCheck.data.name,
        mimeType: folderCheck.data.mimeType,
        canListChildren: folderCheck.data.capabilities?.canListChildren,
      });
    } catch (error: any) {
      console.error("Cannot access parent folder:", error.message);

      // Get user email from session for helpful error message
      const userEmail = (session as any).user?.email || "your account";

      return NextResponse.json(
        {
          error: "Cannot access parent folder",
          details: `You don't have permission to access this Google Drive folder. Please ask the folder owner to share it with ${userEmail} and grant at least "Viewer" permissions.`,
          code: error.code,
          folderId: parentFolderId,
        },
        { status: 403 }
      );
    }

    // Fetch all folders from the parent folder
    const foldersResponse = await drive.files.list({
      q: `'${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id, name, webViewLink, modifiedTime, createdTime)",
      orderBy: "name",
      supportsAllDrives: true, // Support Shared Drives
      includeItemsFromAllDrives: true, // Include items from Shared Drives
    });

    const allFolders = foldersResponse.data.files || [];

    // Also check for any files (not just folders) to debug
    const allItemsResponse = await drive.files.list({
      q: `'${parentFolderId}' in parents and trashed=false`,
      fields: "files(id, name, mimeType)",
      pageSize: 10,
      supportsAllDrives: true, // Support Shared Drives
      includeItemsFromAllDrives: true, // Include items from Shared Drives
    });

    console.log("Drive API response:", {
      foundFolders: allFolders.length,
      folderNames: allFolders.map((f) => f.name),
      totalItems: allItemsResponse.data.files?.length || 0,
      itemTypes: allItemsResponse.data.files?.map((f) => ({
        name: f.name,
        type: f.mimeType,
      })),
    });

    // Separate published and regular folders
    const publishedFolder = allFolders.find((folder) =>
      folder.name?.toLowerCase().startsWith("published")
    );

    let publishedSubfolders: any[] = [];
    if (publishedFolder?.id) {
      const publishedResponse = await drive.files.list({
        q: `'${publishedFolder.id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: "files(id, name, webViewLink, modifiedTime, createdTime)",
        orderBy: "name",
        supportsAllDrives: true, // Support Shared Drives
        includeItemsFromAllDrives: true, // Include items from Shared Drives
      });
      publishedSubfolders = publishedResponse.data.files || [];
    }

    const regularFolders = allFolders.filter(
      (folder) => !folder.name?.toLowerCase().startsWith("published")
    );

    // Format the response with item counts
    const folders = await Promise.all(
      regularFolders.map(async (folder) => {
        const itemsResponse = await drive.files.list({
          q: `'${folder.id}' in parents and trashed=false`,
          fields: "files(id)",
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        });

        return {
          id: folder.id,
          name: folder.name,
          webViewLink: folder.webViewLink,
          itemCount: itemsResponse.data.files?.length || 0,
          createdAt: folder.createdTime,
          modifiedAt: folder.modifiedTime,
          isPublished: false,
          isFolder: true,
          clientModel: gallery.clientModel.clientName,
          galleryId: gallery.id,
        };
      })
    );

    const publishedFoldersFormatted = await Promise.all(
      publishedSubfolders.map(async (folder) => {
        const itemsResponse = await drive.files.list({
          q: `'${folder.id}' in parents and trashed=false`,
          fields: "files(id)",
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        });

        return {
          id: folder.id,
          name: folder.name,
          webViewLink: folder.webViewLink,
          itemCount: itemsResponse.data.files?.length || 0,
          createdAt: folder.createdTime,
          modifiedAt: folder.modifiedTime,
          isPublished: true,
          isFolder: true,
          clientModel: gallery.clientModel.clientName,
          galleryId: gallery.id,
        };
      })
    );

    return NextResponse.json({
      success: true,
      clientModel: gallery.clientModel.clientName,
      parentFolderId,
      publishedFolderId: publishedFolder?.id || null,
      folders,
      publishedFolders: publishedFoldersFormatted,
      totalFolders: folders.length,
      totalPublishedFolders: publishedFoldersFormatted.length,
    });
  } catch (error: any) {
    console.error("Error fetching OFTV gallery folders:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      errors: error.errors,
    });
    return NextResponse.json(
      {
        error: "Failed to fetch folders from Google Drive",
        details: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}
