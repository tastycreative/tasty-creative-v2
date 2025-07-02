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
      const policy = parsedUrl.searchParams.get('Policy');
      const signature = parsedUrl.searchParams.get('Signature');
      const keyPairId = parsedUrl.searchParams.get('Key-Pair-Id');
      
      console.log("AWS CloudFront Auth Parameters:");
      console.log("- Policy:", policy);
      console.log("- Signature:", signature);
      console.log("- Key-Pair-Id:", keyPairId);
      
      if (policy) {
        try {
          const decodedPolicy = JSON.parse(Buffer.from(policy, 'base64').toString());
          console.log("Decoded AWS Policy:", decodedPolicy);
        } catch {
          console.log("Could not parse AWS policy");
        }
      }
    }

    // Prepare headers with CloudFront authentication if available
    const requestHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "Referer": "https://onlyfans.com/",
      "Accept": "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
      "Origin": "https://onlyfans.com",
    };

    // Add CloudFront authentication parameters as cookies if they exist
    if (hasAwsAuth) {
      const policy = parsedUrl.searchParams.get('Policy');
      const signature = parsedUrl.searchParams.get('Signature');
      const keyPairId = parsedUrl.searchParams.get('Key-Pair-Id');
      
      if (policy && signature && keyPairId) {
        // Try adding as cookies (some CDNs expect this)
        requestHeaders["Cookie"] = `CloudFront-Policy=${policy}; CloudFront-Signature=${signature}; CloudFront-Key-Pair-Id=${keyPairId}`;
        
        // Also try as custom headers
        requestHeaders["CloudFront-Policy"] = policy;
        requestHeaders["CloudFront-Signature"] = signature;
        requestHeaders["CloudFront-Key-Pair-Id"] = keyPairId;
        
        console.log("Added CloudFront authentication to request headers");
      }
    }

    const response = await fetch(imageUrl, {
      headers: requestHeaders,
    });

    if (!response.ok) {
      console.error(`Image fetch failed: ${response.status} ${response.statusText} for URL: ${imageUrl}`);
      
      // Log response body for debugging
      const responseText = await response.text();
      console.error("Response body:", responseText);
      
      // Special handling for 403 errors from OnlyFans CDN
      if (response.status === 403) {
        console.error("OnlyFans CDN returned 403 Forbidden - likely due to IP restrictions or expired authentication");
        
        // Check if it's a CloudFront authentication error
        if (responseText.includes("MissingKey") || responseText.includes("Key-Pair-Id")) {
          console.error("CloudFront authentication error detected");
        }
        
        // Return a placeholder image for 403 errors
        const placeholderSvg = `
          <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="300" fill="#f9fafb"/>
            <rect x="1" y="1" width="298" height="298" fill="none" stroke="#e5e7eb" stroke-width="2" stroke-dasharray="5,5"/>
            <g transform="translate(150,150)">
              <rect x="-40" y="-25" width="80" height="50" fill="#3b82f6" rx="6" opacity="0.1"/>
              <circle cx="0" cy="-8" r="6" fill="#3b82f6" opacity="0.3"/>
              <polygon points="-12,0 12,0 0,12" fill="#3b82f6" opacity="0.3"/>
              <text x="0" y="35" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#6b7280" font-weight="500">
                OnlyFans Media
              </text>
              <text x="0" y="48" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#9ca3af">
                (Preview Restricted)
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
