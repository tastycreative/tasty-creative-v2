import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL required" },
        { status: 400 }
      );
    }

    // Allow OnlyFans CDN URLs and Google Drive URLs
    const allowedDomains = [
      "cdn2.onlyfans.com",
      "cdn3.onlyfans.com",
      "cdn4.onlyfans.com",
      "cdn5.onlyfans.com",
      "public.onlyfans.com",
      "lh3.googleusercontent.com",
      "drive.google.com",
      "work.fife.usercontent.google.com",
    ];

    const isAllowedDomain = allowedDomains.some((domain) =>
      imageUrl.includes(domain)
    );

    if (!isAllowedDomain) {
      return NextResponse.json(
        { error: "Invalid image URL domain" },
        { status: 400 }
      );
    }

    console.log(`Processing image stream request`);
    console.log(`Original URL: ${imageUrl}`);

    // Parse the URL to check for AWS authentication parameters
    const parsedUrl = new URL(imageUrl);
    const hasAwsAuth =
      parsedUrl.searchParams.has("Policy") &&
      parsedUrl.searchParams.has("Signature") &&
      parsedUrl.searchParams.has("Key-Pair-Id");

    // Detect if this is a Google Drive URL
    const isGoogleDrive =
      imageUrl.includes("lh3.googleusercontent.com") ||
      imageUrl.includes("drive.google.com") ||
      imageUrl.includes("googleapis.com") ||
      imageUrl.includes("usercontent.google.com");

    // Prepare headers to mimic browser request
    const requestHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Sec-Fetch-Dest": "image",
      "Sec-Fetch-Mode": "no-cors",
      "Sec-Fetch-Site": "cross-site",
      "Cache-Control": "no-cache",
    };

    // Add domain-specific headers
    if (isGoogleDrive) {
      // For Google Drive, use Google-specific headers
      requestHeaders["Referer"] = "https://drive.google.com/";
      requestHeaders["Origin"] = "https://drive.google.com";
    } else {
      // For OnlyFans CDN, use OnlyFans headers
      requestHeaders["Referer"] = "https://onlyfans.com/";
      requestHeaders["Origin"] = "https://onlyfans.com";
    }

    if (hasAwsAuth) {
      const policy = parsedUrl.searchParams.get("Policy");
      const signature = parsedUrl.searchParams.get("Signature");
      const keyPairId = parsedUrl.searchParams.get("Key-Pair-Id");

      if (policy && signature && keyPairId) {
        console.log("Adding CloudFront authentication parameters");

        requestHeaders["Cookie"] =
          `CloudFront-Policy=${policy}; CloudFront-Signature=${signature}; CloudFront-Key-Pair-Id=${keyPairId}`;


        requestHeaders["CloudFront-Policy"] = policy;
        requestHeaders["CloudFront-Signature"] = signature;
        requestHeaders["CloudFront-Key-Pair-Id"] = keyPairId;

        console.log("Authentication methods applied: query params (preserved), cookies, headers");
      }
    }

    // Stream the image directly without downloading
    console.log(`Streaming image from ${isGoogleDrive ? 'Google Drive' : 'CDN'}`);

    let response: Response | null = null;
    let lastError: Error | null = null;

    try {
      response = await fetch(imageUrl, {
        headers: requestHeaders,
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        console.error(`Stream failed with status: ${response.status}`);
      }
    } catch (error) {
      lastError = error as Error;
      console.error("Stream attempt failed:", error);
    }

    if (!response || !response.ok) {
      console.error("Stream failed:", lastError?.message);

      // Return a styled placeholder for failed streams
      const placeholderSvg = `
        <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="stripes" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
              <rect width="5" height="10" fill="#f3f4f6"/>
              <rect x="5" width="5" height="10" fill="#e5e7eb"/>
            </pattern>
          </defs>
          <rect width="300" height="300" fill="url(#stripes)"/>
          <rect x="20" y="20" width="260" height="260" fill="white" stroke="#d1d5db" stroke-width="2" rx="8"/>
          <g transform="translate(150,130)">
            <circle cx="0" cy="0" r="30" fill="#ef4444" opacity="0.1"/>
            <path d="M-15,-15 L15,15 M15,-15 L-15,15" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
          </g>
          <text x="150" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#374151" font-weight="600">
            Image Load Failed
          </text>
          <text x="150" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">
            ${lastError?.message || "Access Restricted"}
          </text>
          <text x="150" y="240" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#9ca3af">
            Check file sharing settings
          </text>
        </svg>
      `;

      return new NextResponse(placeholderSvg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache", 
          "Expires": "0",
          "X-Cache": "ERROR",
        },
      });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const contentLength = response.headers.get("content-length");

    // Validate content type
    if (!contentType.startsWith("image/")) {
      console.error(`Invalid content type received: ${contentType}`);

      const errorSvg = `
        <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
          <rect width="300" height="300" fill="#fef2f2"/>
          <rect x="20" y="20" width="260" height="260" fill="white" stroke="#fecaca" stroke-width="2" rx="8"/>
          <text x="150" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#dc2626">
            Invalid Content Type: ${contentType}
          </text>
        </svg>
      `;

      return new NextResponse(errorSvg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0", 
          "X-Cache": "ERROR",
        },
      });
    }

    console.log(`Streaming image: ${contentType}, length: ${contentLength || 'unknown'}`);

    // Stream the image directly
    const imageStream = response.body;
    
    if (!imageStream) {
      return NextResponse.json(
        { error: "No image stream available" },
        { status: 500 }
      );
    }

    // Return streaming response with no caching (fresh URLs each time)
    return new NextResponse(imageStream, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-cache, no-store, must-revalidate", // No caching for fresh URLs
        "Pragma": "no-cache",
        "Expires": "0",
        "Access-Control-Allow-Origin": "*",
        "X-Cache": "STREAM",
        ...(contentLength && { "Content-Length": contentLength }),
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);

    // Return error placeholder
    const errorSvg = `
      <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="300" fill="#fef2f2"/>
        <rect x="20" y="20" width="260" height="260" fill="white" stroke="#fecaca" stroke-width="2" rx="8"/>
        <g transform="translate(150,150)">
          <circle cx="0" cy="0" r="25" fill="#dc2626" opacity="0.1"/>
          <text x="0" y="5" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#dc2626">⚠</text>
        </g>
        <text x="150" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#dc2626" font-weight="600">
          Proxy Error
        </text>
        <text x="150" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#6b7280">
          ${error instanceof Error ? error.message : "Unknown error"}
        </text>
      </svg>
    `;

    return new NextResponse(errorSvg, {
      status: 500,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=60", // Cache errors for 1 minute
      },
    });
  }
}
