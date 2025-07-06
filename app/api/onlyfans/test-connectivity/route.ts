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
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    console.log("Testing connectivity to:", testUrl);

    // Test with a simple HEAD request first
    const startTime = Date.now();
    
    try {
      const response = await fetch(testUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      const responseTime = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        status: response.status,
        statusText: response.statusText,
        responseTime: responseTime,
        headers: Object.fromEntries(response.headers.entries()),
        contentLength: response.headers.get('content-length'),
        contentType: response.headers.get('content-type'),
        url: testUrl
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime: responseTime,
        url: testUrl,
        suggestion: "Check if the URL is accessible and not expired"
      });
    }

  } catch (error) {
    console.error("Connectivity test error:", error);
    return NextResponse.json(
      { error: "Failed to test connectivity" },
      { status: 500 }
    );
  }
}
