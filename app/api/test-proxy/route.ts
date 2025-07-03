import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const testUrl = searchParams.get("url");

    if (!testUrl) {
      // Return test info if no URL provided
      return NextResponse.json({
        message: "OnlyFans Media Proxy Test Endpoint",
        usage: {
          image: "/api/test-proxy?url=<image_url>",
          video: "/api/test-proxy?url=<video_url>&type=video",
          cleanup:
            "/api/proxy-image/cleanup (GET for status, DELETE for cleanup)",
        },
        features: [
          "Server-side caching (24 hour retention)",
          "CloudFront authentication support",
          "Multiple CDN domain support",
          "Retry logic with exponential backoff",
          "Proper error handling with SVG placeholders",
          "Video streaming support",
        ],
      });
    }

    const type = searchParams.get("type") || "image";

    if (type === "video") {
      // Test video streaming
      const videoResponse = await fetch(
        `${request.nextUrl.origin}/api/proxy-video?url=${encodeURIComponent(testUrl)}`,
        {
          method: "HEAD",
        }
      );

      return NextResponse.json({
        success: videoResponse.ok,
        status: videoResponse.status,
        type: "video",
        url: testUrl,
        contentType: videoResponse.headers.get("content-type"),
        contentLength: videoResponse.headers.get("content-length"),
        acceptRanges: videoResponse.headers.get("accept-ranges"),
      });
    } else {
      // Test image proxy
      const imageResponse = await fetch(
        `${request.nextUrl.origin}/api/proxy-image?url=${encodeURIComponent(testUrl)}`
      );

      const cacheStatus = imageResponse.headers.get("x-cache") || "UNKNOWN";
      const imageSize = imageResponse.headers.get("x-image-size");

      return NextResponse.json({
        success: imageResponse.ok,
        status: imageResponse.status,
        type: "image",
        url: testUrl,
        contentType: imageResponse.headers.get("content-type"),
        cacheStatus,
        imageSize: imageSize
          ? `${Math.round(parseInt(imageSize) / 1024)} KB`
          : "unknown",
        cached: cacheStatus === "HIT",
      });
    }
  } catch (error) {
    console.error("Proxy test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
