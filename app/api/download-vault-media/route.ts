import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mediaUrls } = await request.json();

    if (!mediaUrls || !Array.isArray(mediaUrls)) {
      return NextResponse.json(
        { error: "Media URLs array required" },
        { status: 400 }
      );
    }

    const downloadedFiles: { url: string; blob: string; filename: string }[] =
      [];

    for (const mediaUrl of mediaUrls) {
      try {
        console.log("Downloading media from:", mediaUrl);

        // Use the same approach as your scraper - direct fetch without CORS restrictions
        const response = await fetch(mediaUrl, {
          method: "GET",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            Referer: "https://onlyfans.com/",
            Accept: "*/*",
          },
        });

        if (!response.ok) {
          console.error(
            `Failed to download ${mediaUrl}: ${response.status} ${response.statusText}`
          );
          continue;
        }

        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get("content-type") || "video/mp4";

        // Convert to base64 for transmission to client
        const base64 = Buffer.from(buffer).toString("base64");

        // Generate filename
        const url = new URL(mediaUrl);
        const ext = url.pathname.includes(".")
          ? url.pathname.split(".").pop()
          : "mp4";
        const filename = `vault-video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;

        downloadedFiles.push({
          url: mediaUrl,
          blob: `data:${contentType};base64,${base64}`,
          filename: filename,
        });

        console.log(
          `Successfully downloaded: ${filename} (${buffer.byteLength} bytes)`
        );
      } catch (error) {
        console.error(`Error downloading ${mediaUrl}:`, error);
        continue;
      }
    }

    if (downloadedFiles.length === 0) {
      return NextResponse.json(
        { error: "No files could be downloaded" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      files: downloadedFiles,
      count: downloadedFiles.length,
    });
  } catch (error) {
    console.error("Download endpoint error:", error);
    return NextResponse.json(
      { error: "Failed to download media files" },
      { status: 500 }
    );
  }
}
