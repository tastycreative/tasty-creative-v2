import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";

// Cache directory for downloaded images
const CACHE_DIR = path.join(process.cwd(), "temp", "image-cache");
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Ensure cache directory exists
async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create cache directory:", error);
  }
}

// Generate cache key from URL
function getCacheKey(url: string): string {
  return createHash("md5").update(url).digest("hex");
}

// Check if cache file exists and is valid
async function isCacheValid(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    const age = Date.now() - stats.mtime.getTime();
    return age < CACHE_DURATION;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");
    const forceRefresh = searchParams.get("refresh") === "true";

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL required" },
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
    
    const isAllowedDomain = allowedDomains.some(domain => imageUrl.includes(domain));
    
    if (!isAllowedDomain) {
      return NextResponse.json({ error: "Invalid image URL domain" }, { status: 400 });
    }

    await ensureCacheDir();

    const cacheKey = getCacheKey(imageUrl);
    console.log(`Processing image request for cache key: ${cacheKey}`);
    console.log(`Original URL: ${imageUrl}`);

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const tempExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
      
      for (const ext of tempExtensions) {
        const tempPath = path.join(CACHE_DIR, `${cacheKey}.${ext}`);
        if (await isCacheValid(tempPath)) {
          console.log(`Serving cached image: ${tempPath}`);
          
          const cachedBuffer = await fs.readFile(tempPath);
          const mimeType = `image/${ext === "jpg" ? "jpeg" : ext}`;
          
          return new NextResponse(cachedBuffer, {
            headers: {
              "Content-Type": mimeType,
              "Cache-Control": "public, max-age=86400", // 24 hours
              "X-Cache": "HIT",
            },
          });
        }
      }
    }

    // Cache miss - need to download the image
    console.log("Cache miss - downloading image from OnlyFans CDN");

    // Parse the URL to check for AWS authentication parameters
    const parsedUrl = new URL(imageUrl);
    const hasAwsAuth =
      parsedUrl.searchParams.has("Policy") &&
      parsedUrl.searchParams.has("Signature") &&
      parsedUrl.searchParams.has("Key-Pair-Id");

    // Prepare headers to mimic browser request
    const requestHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Referer": "https://onlyfans.com/",
      "Origin": "https://onlyfans.com",
      "Sec-Fetch-Dest": "image",
      "Sec-Fetch-Mode": "no-cors",
      "Sec-Fetch-Site": "cross-site",
      "Cache-Control": "no-cache",
    };

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

    // Download the image with retries
    let response: Response | null = null;
    let lastError: Error | null = null;
    
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Download attempt ${attempt}/${maxRetries}`);
        
        response = await fetch(imageUrl, {
          headers: requestHeaders,
          // Add a timeout to prevent hanging
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        if (response.ok) {
          break; // Success!
        } else {
          console.warn(`Attempt ${attempt} failed with status: ${response.status}`);
          if (attempt === maxRetries) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        }
      } catch (error) {
        lastError = error as Error;
        console.error(`Download attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    if (!response || !response.ok) {
      console.error("All download attempts failed");
      
      // Return a styled placeholder for failed downloads
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
            OnlyFans Media
          </text>
          <text x="150" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">
            Unable to Load
          </text>
          <text x="150" y="240" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#9ca3af">
            ${lastError?.message || "CDN Access Restricted"}
          </text>
        </svg>
      `;

      return new NextResponse(placeholderSvg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=300", // Cache error for 5 minutes
          "X-Cache": "ERROR",
        },
      });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    
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
          "Cache-Control": "public, max-age=300",
          "X-Cache": "ERROR",
        },
      });
    }

    // Download and cache the image
    const imageBuffer = await response.arrayBuffer();
    const imageSize = imageBuffer.byteLength;
    
    console.log(`Successfully downloaded image: ${imageSize} bytes, type: ${contentType}`);

    // Save to cache
    try {
      const extension = contentType.split("/")[1] || "jpg";
      const cacheFilePath = path.join(CACHE_DIR, `${cacheKey}.${extension}`);
      
      await fs.writeFile(cacheFilePath, Buffer.from(imageBuffer));
      console.log(`Image cached to: ${cacheFilePath}`);
    } catch (cacheError) {
      console.error("Failed to cache image:", cacheError);
      // Continue anyway - we can still serve the image
    }

    // Return the image
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // 24 hours
        "X-Cache": "MISS",
        "X-Image-Size": imageSize.toString(),
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
