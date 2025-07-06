import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { VIDEO_DOWNLOAD_CONFIG, getVideoHeaders } from "@/lib/video-download-config";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { url, filename } = body;

    if (!url) {
      return NextResponse.json(
        { error: "Video URL is required" },
        { status: 400 }
      );
    }

    console.log("Downloading video from:", url);

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Download the video from the temporary URL with extended timeout and retry logic
    let response;
    const maxRetries = VIDEO_DOWNLOAD_CONFIG.MAX_RETRIES;
    const timeoutMs = VIDEO_DOWNLOAD_CONFIG.DOWNLOAD_TIMEOUT;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Download attempt ${attempt}/${maxRetries} for:`, url);
        
        // Create an AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: getVideoHeaders()
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`Download successful on attempt ${attempt}`);
          break;
        } else {
          console.log(`Download failed on attempt ${attempt}: ${response.status} ${response.statusText}`);
          if (attempt === maxRetries) {
            return NextResponse.json(
              { error: `Failed to download video after ${maxRetries} attempts: ${response.status} ${response.statusText}` },
              { status: response.status }
            );
          }
        }
      } catch (fetchError) {
        console.error(`Download attempt ${attempt} failed:`, fetchError);
        
        if (attempt === maxRetries) {
          // If all retries failed, provide helpful error information
          console.log("All download attempts failed");
          
          const errorDetails = fetchError instanceof Error ? fetchError.message : "Unknown error";
          const isTimeoutError = errorDetails.includes('timeout') || errorDetails.includes('TIMEOUT');
          const isConnectError = errorDetails.includes('connect') || errorDetails.includes('CONNECT');
          
          let suggestion = "Please try selecting the videos again to get fresh URLs.";
          if (isTimeoutError) {
            suggestion = "The download timed out. This may be due to network issues or a large file size. Please try again.";
          } else if (isConnectError) {
            suggestion = "Could not connect to the media server. Please check your internet connection and try again.";
          }
          
          return NextResponse.json(
            { 
              error: "Download failed after multiple attempts",
              details: errorDetails,
              suggestion: suggestion,
              retryCount: maxRetries,
              timeoutMs: timeoutMs
            },
            { status: 503 }
          );
        }
        
        // Wait before retry (exponential backoff)
        const delay = Math.min(attempt * 2000, 10000); // Cap at 10 seconds
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // At this point, response should be defined and successful
    if (!response || !response.ok) {
      console.error("Unexpected: No successful response after retry loop");
      return NextResponse.json(
        { error: "Failed to download video: No successful response" },
        { status: 500 }
      );
    }

    // Get the video content
    const videoBuffer = await response.arrayBuffer();
    console.log("Downloaded video size:", videoBuffer.byteLength, "bytes");

    if (videoBuffer.byteLength === 0) {
      return NextResponse.json(
        { error: "Downloaded video is empty" },
        { status: 400 }
      );
    }

    // Return the video content with appropriate headers
    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': videoBuffer.byteLength.toString(),
        'Content-Disposition': `attachment; filename="${filename || 'video.mp4'}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error("Video download error:", error);
    return NextResponse.json(
      { error: "Failed to download video" },
      { status: 500 }
    );
  }
}
