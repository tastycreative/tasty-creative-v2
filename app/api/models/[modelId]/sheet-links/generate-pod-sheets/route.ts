import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

// Helper function to extract folder ID from Google Drive URL or return the ID itself
function extractFolderId(url: string): string | null {
  if (!url) return null;
  if (!url.includes("/") && !url.includes("http")) {
    return url;
  }
  const patterns = [
    /folders\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /[-\w]{25,}/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
    return new Response("Insufficient permissions", { status: 403 });
  }

  const { modelId } = await params;

  // Get POD sheet options from query params
  const searchParams = request.nextUrl.searchParams;
  const podSheetOptions = {
    free: searchParams.get("free") === "true",
    paid: searchParams.get("paid") === "true",
    oftv: searchParams.get("oftv") === "true",
  };

  console.log("🎯 POD Sheet Options:", podSheetOptions);

  // Template sheet IDs
  const TEMPLATE_SHEETS = {
    analyst: "1ixhN7Mzqb6tUAPD10ZZA0QRlETIuKHMir5z4DPsawq4",
    creator: "1gS0O847mzEVhDkWqy75EUXS4-t5vsDWiOyq9hioMqlg",
    scheduler: "1PiqbaOG3WA57BVGD2RpQ8brOS4xYCc_0GNARJDqYxGo",
  };

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (event: string, data: any) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        // Step 1: Validate model configuration
        sendEvent("progress", {
          step: "validate",
          message: "Validating model configuration",
        });

        const clientModel = await prisma.clientModel.findUnique({
          where: { clientName: decodeURIComponent(modelId) },
        });

        if (!clientModel) {
          sendEvent("error", { message: "Model not found" });
          controller.close();
          return;
        }

        let launchesFolderId: string | null = clientModel.launchesPodFolderId
          ? extractFolderId(clientModel.launchesPodFolderId)
          : null;

        // If launchesPodFolderId is missing, create the folder in Google Drive and update the DB
        if (!launchesFolderId) {
          sendEvent("progress", {
            step: "folder",
            message: `Creating [${clientModel.clientName}] - POD folder in Launches`,
            progress: 5,
          });

          // Setup Google APIs (service account recommended for folder creation)
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

          // Parent folder ID for all POD folders
          const POD_PARENT_FOLDER_ID = "1M23UBT4E0oD1nR7CYVEuc-a5oVVtkeqc";
          const podFolderName = `${clientModel.clientName} - POD`;

          // Check if folder already exists (avoid duplicates)
          const folderQuery = `name='${podFolderName}' and '${POD_PARENT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
          const folderSearchResponse = await drive.files.list({
            q: folderQuery,
            fields: "files(id, name)",
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
          });

          if (
            folderSearchResponse.data.files &&
            folderSearchResponse.data.files.length > 0
          ) {
            launchesFolderId = folderSearchResponse.data.files[0].id!;
            sendEvent("progress", {
              step: "folder",
              message: `Found existing POD folder`,
              progress: 10,
            });
          } else {
            // Create the folder
            const folderMetadata = {
              name: podFolderName,
              mimeType: "application/vnd.google-apps.folder",
              parents: [POD_PARENT_FOLDER_ID],
            };
            const folderResponse = await drive.files.create({
              requestBody: folderMetadata,
              fields: "id",
              supportsAllDrives: true,
            });
            launchesFolderId = folderResponse.data.id!;
            sendEvent("progress", {
              step: "folder",
              message: `Created POD folder`,
              progress: 15,
            });
          }

          // Update ClientModel with new launchesPodFolderId
          await prisma.clientModel.update({
            where: { clientName: clientModel.clientName },
            data: { launchesPodFolderId: launchesFolderId },
          });
        }

        // Setup Google APIs
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

        // Determine which tiers to generate
        const selectedTiers: string[] = [];
        if (podSheetOptions.free) selectedTiers.push("FREE");
        if (podSheetOptions.paid) selectedTiers.push("PAID");
        if (podSheetOptions.oftv) selectedTiers.push("OFTV");

        if (selectedTiers.length === 0) {
          sendEvent("error", { message: "No tiers selected" });
          controller.close();
          return;
        }

        console.log("📑 Selected Tiers:", selectedTiers);

        const createdSheetLinks: any[] = [];
        // Calculate total steps: folder check/create + 3 sheets per tier + final save
        let totalSteps = selectedTiers.length + selectedTiers.length * 3 + 1;
        let currentStep = 0;

        // First pass: Check/create all folders
        const tierFolderMap: Record<string, string> = {};

        for (const tier of selectedTiers) {
          currentStep++;
          sendEvent("progress", {
            step: "folder",
            message: `Checking ${tier} folder in Launches POD`,
            progress: Math.round((currentStep / totalSteps) * 100),
          });

          // Step 2: Check if tier folder exists, create if not
          const folderQuery = `name='${tier}' and '${launchesFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;

          const folderSearchResponse = await drive.files.list({
            q: folderQuery,
            fields: "files(id, name)",
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
          });

          let tierFolderId: string;

          if (
            folderSearchResponse.data.files &&
            folderSearchResponse.data.files.length > 0
          ) {
            tierFolderId = folderSearchResponse.data.files[0].id!;
            console.log(`✅ Found existing ${tier} folder:`, tierFolderId);
            sendEvent("progress", {
              step: "folder",
              message: `Found existing ${tier} folder`,
              progress: Math.round((currentStep / totalSteps) * 100),
            });
          } else {
            // Create the tier folder
            sendEvent("progress", {
              step: "folder",
              message: `Creating ${tier} folder`,
              progress: Math.round((currentStep / totalSteps) * 100),
            });

            const folderMetadata = {
              name: tier,
              mimeType: "application/vnd.google-apps.folder",
              parents: [launchesFolderId],
            };

            const folderResponse = await drive.files.create({
              requestBody: folderMetadata,
              fields: "id",
              supportsAllDrives: true,
            });

            tierFolderId = folderResponse.data.id!;
            console.log(`✅ Created ${tier} folder:`, tierFolderId);

            sendEvent("progress", {
              step: "folder",
              message: `${tier} folder created successfully`,
              progress: Math.round((currentStep / totalSteps) * 100),
            });
          }

          tierFolderMap[tier] = tierFolderId;
        }

        // Second pass: Generate all sheets for all tiers
        for (const tier of selectedTiers) {
          const tierFolderId = tierFolderMap[tier];

          // Step 3: Copy the 3 sheets (Analyst, Creator, Scheduler)
          const sheetTypes = ["analyst", "creator", "scheduler"];

          for (const sheetType of sheetTypes) {
            currentStep++;
            const sheetTypeCapitalized =
              sheetType.charAt(0).toUpperCase() + sheetType.slice(1);

            sendEvent("progress", {
              step: "copy",
              message: `Generating ${tier} ${sheetTypeCapitalized} Sheet`,
              progress: Math.round((currentStep / totalSteps) * 100),
            });

            const templateId =
              TEMPLATE_SHEETS[sheetType as keyof typeof TEMPLATE_SHEETS];
            const newSheetName = `${clientModel.clientName} ${sheetTypeCapitalized} Sheet`;

            const copiedFile = await drive.files.copy({
              fileId: templateId,
              requestBody: {
                name: newSheetName,
                parents: [tierFolderId],
              },
              fields: "id, name, webViewLink",
              supportsAllDrives: true,
            });

            const sheetId = copiedFile.data.id;
            const sheetName = copiedFile.data.name || newSheetName;
            const sheetUrl =
              copiedFile.data.webViewLink ||
              `https://docs.google.com/spreadsheets/d/${sheetId}`;

            if (!sheetId) {
              throw new Error(
                `Failed to copy ${tier} ${sheetTypeCapitalized} sheet`
              );
            }

            console.log(
              `✅ Created ${tier} ${sheetTypeCapitalized} Sheet:`,
              sheetId
            );

            // Step 4: Save to database
            const newSheetLink = await prisma.clientModelSheetLinks.create({
              data: {
                clientModelId: clientModel.id,
                sheetUrl,
                sheetName,
                sheetType: `${sheetTypeCapitalized} Sheet`,
                folderName: tier,
                folderId: tierFolderId,
              },
            });

            createdSheetLinks.push(newSheetLink);
          }
        }

        // Step 4: All sheets for all tiers have been generated
        sendEvent("progress", {
          step: "copy",
          message: `All sheets generated successfully`,
          progress: Math.round((currentStep / totalSteps) * 100),
        });

        // Add a small delay so users can see the "All sheets generated" message
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Step 5: Final save step
        currentStep++;
        sendEvent("progress", {
          step: "save",
          message: `Saving to database`,
          progress: Math.round((currentStep / totalSteps) * 100),
        });

        // Step 6: Complete
        sendEvent("progress", {
          step: "complete",
          message: "Finalizing",
          progress: 100,
        });
        sendEvent("complete", {
          sheetLinks: createdSheetLinks,
          message: `Successfully generated POD Sheets for ${selectedTiers.join(", ")}`,
        });

        controller.close();
      } catch (error: any) {
        console.error("Error generating POD sheets:", error);
        sendEvent("error", {
          message: error.message || "Failed to generate POD sheets",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
