import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const videoUrl = searchParams.get("url");

    if (!videoUrl) {
      return NextResponse.json(
        { error: "Video URL required" },
        { status: 400 }
      );
    }

    // Allow OnlyFans CDN URLs and other common CDN patterns
    const allowedDomains = [
      "cdn2.onlyfans.com",
      "cdn3.onlyfans.com", 
      "cdn4.onlyfans.com",
      "cdn5.onlyfans.com",
      "public.onlyfans.com"
    ];
    
    const isAllowedDomain = allowedDomains.some(domain => videoUrl.includes(domain));
    
    if (!isAllowedDomain) {
      return NextResponse.json({ error: "Invalid video URL domain" }, { status: 400 });
    }

    console.log("Streaming video from OnlyFans CDN:", videoUrl);

    // Parse the URL to check for AWS authentication parameters
    const parsedUrl = new URL(videoUrl);
    const hasAwsAuth =
      parsedUrl.searchParams.has("Policy") &&
      parsedUrl.searchParams.has("Signature") &&
      parsedUrl.searchParams.has("Key-Pair-Id");

    // Prepare headers to mimic browser request
    const requestHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "identity", // Don't compress for streaming
      "Referer": "https://onlyfans.com/",
      "Origin": "https://onlyfans.com",
      "Sec-Fetch-Dest": "video",
      "Sec-Fetch-Mode": "no-cors",
      "Sec-Fetch-Site": "cross-site",
      "Cache-Control": "no-cache",
    };

    // Add range header if client requested a range
    const range = request.headers.get("range");
    if (range) {
      requestHeaders["Range"] = range;
    }

    // Add CloudFront authentication if available
    if (hasAwsAuth) {
      const policy = parsedUrl.searchParams.get("Policy");
      const signature = parsedUrl.searchParams.get("Signature");
      const keyPairId = parsedUrl.searchParams.get("Key-Pair-Id");

      if (policy && signature && keyPairId) {
        console.log("Adding CloudFront authentication parameters");
        requestHeaders["CloudFront-Policy"] = policy;
        requestHeaders["CloudFront-Signature"] = signature;
        requestHeaders["CloudFront-Key-Pair-Id"] = keyPairId;
      }
    }

    // Fetch the video with timeout
    const response = await fetch(videoUrl, {
      headers: requestHeaders,
      signal: AbortSignal.timeout(60000), // 60 second timeout
    });

    if (!response.ok) {
      console.error(`Video fetch failed: ${response.status} ${response.statusText}`);
      
      return NextResponse.json(
        { error: `Failed to fetch video: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "video/mp4";
    const contentLength = response.headers.get("content-length");
    const acceptRanges = response.headers.get("accept-ranges");
    const contentRange = response.headers.get("content-range");

    // Validate content type
    if (!contentType.startsWith("video/") && !contentType.includes("octet-stream")) {
      console.error(`Invalid content type for video: ${contentType}`);
      
      return NextResponse.json(
        { error: "Invalid video content type" },
        { status: 400 }
      );
    }

    console.log(`Streaming video: ${contentType}, length: ${contentLength || 'unknown'}`);

    // Prepare response headers
    const responseHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400", // 24 hours
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range, Content-Range, Accept-Ranges",
    };

    // Copy range-related headers for video streaming
    if (contentLength) {
      responseHeaders["Content-Length"] = contentLength;
    }
    if (acceptRanges) {
      responseHeaders["Accept-Ranges"] = acceptRanges;
    }
    if (contentRange) {
      responseHeaders["Content-Range"] = contentRange;
    }

    // Stream the video content
    const videoStream = response.body;
    
    if (!videoStream) {
      return NextResponse.json(
        { error: "No video stream available" },
        { status: 500 }
      );
    }

    // Return streaming response
    return new NextResponse(videoStream, {
      status: response.status,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error("Video streaming error:", error);
    
    return NextResponse.json(
      { error: "Failed to stream video" },
      { status: 500 }
    );
  }
}

// Handle HEAD requests for video metadata
export async function HEAD(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
      return new NextResponse(null, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const videoUrl = searchParams.get("url");

    if (!videoUrl) {
      return new NextResponse(null, { status: 400 });
    }

    // Allow OnlyFans CDN URLs
    const allowedDomains = [
      "cdn2.onlyfans.com",
      "cdn3.onlyfans.com", 
      "cdn4.onlyfans.com",
      "cdn5.onlyfans.com",
      "public.onlyfans.com"
    ];
    
    const isAllowedDomain = allowedDomains.some(domain => videoUrl.includes(domain));
    
    if (!isAllowedDomain) {
      return new NextResponse(null, { status: 400 });
    }

    // HEAD request to get video metadata
    const response = await fetch(videoUrl, {
      method: "HEAD",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://onlyfans.com/",
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return new NextResponse(null, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "video/mp4";
    const contentLength = response.headers.get("content-length");
    const acceptRanges = response.headers.get("accept-ranges");

    return new NextResponse(null, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": contentLength || "0",
        "Accept-Ranges": acceptRanges || "bytes",
        "Cache-Control": "public, max-age=3600",
      },
    });

  } catch (error) {
    console.error("Video HEAD request error:", error);
    return new NextResponse(null, { status: 500 });
  }
}
