import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL required" }, { status: 400 });
    }

    // Only allow OnlyFans CDN URLs for security
    if (!imageUrl.includes("cdn2.onlyfans.com")) {
      return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
    }

    console.log("Fetching image from:", imageUrl);
    
    // Parse the URL to check for AWS authentication parameters
    const parsedUrl = new URL(imageUrl);
    const hasAwsAuth = parsedUrl.searchParams.has('Policy') && 
                      parsedUrl.searchParams.has('Signature') && 
                      parsedUrl.searchParams.has('Key-Pair-Id');
    
    if (hasAwsAuth) {
      console.log("URL contains AWS CloudFront authentication parameters");
      const epochTime = parsedUrl.searchParams.get('Policy');
      if (epochTime) {
        try {
          const policy = JSON.parse(Buffer.from(epochTime, 'base64').toString());
          console.log("AWS Policy:", policy);
        } catch {
          console.log("Could not parse AWS policy");
        }
      }
    }

    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Referer": "https://onlyfans.com/",
        "Accept": "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Origin": "https://onlyfans.com",
      },
    });

    if (!response.ok) {
      console.error(`Image fetch failed: ${response.status} ${response.statusText} for URL: ${imageUrl}`);
      
      // Special handling for 403 errors from OnlyFans CDN
      if (response.status === 403) {
        console.error("OnlyFans CDN returned 403 Forbidden - likely due to IP restrictions or expired authentication");
        
        // Return a placeholder image for 403 errors
        const placeholderSvg = `
          <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="300" fill="#f3f4f6"/>
            <g transform="translate(150,150)">
              <rect x="-50" y="-30" width="100" height="60" fill="#d1d5db" rx="8"/>
              <circle cx="0" cy="-10" r="8" fill="#9ca3af"/>
              <polygon points="-15,5 15,5 0,20" fill="#9ca3af"/>
              <text x="0" y="45" text-anchor="middle" font-family="Arial" font-size="12" fill="#6b7280">
                Thumbnail unavailable
              </text>
            </g>
          </svg>
        `;
        
        return new NextResponse(placeholderSvg, {
          headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
      
      return NextResponse.json({ error: "Failed to fetch image" }, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "";
    
    // Check if the response is actually an image
    if (!contentType.startsWith("image/")) {
      console.error(`Invalid content type: ${contentType}. Expected image, got:`, contentType);
      
      // If it's JSON, log the error response
      if (contentType.includes("application/json")) {
        const errorText = await response.text();
        console.error("CDN returned JSON error:", errorText);
      }
      
      return NextResponse.json({ error: "Invalid image response from CDN" }, { status: 400 });
    }

    const imageBuffer = await response.arrayBuffer();
    
    console.log(`Successfully proxied image: ${imageUrl} (${contentType}, ${imageBuffer.byteLength} bytes)`);

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error("Image proxy error:", error);
    return NextResponse.json(
      { error: "Failed to proxy image" }, 
      { status: 500 }
    );
  }
}
