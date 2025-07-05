import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const ACCOUNT_ID = "acct_0a4c116d5a104a37a8526087c68d4e61";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const originalUrl = searchParams.get("url");
    const accountId = searchParams.get("accountId") || ACCOUNT_ID;

    if (!originalUrl) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    console.log("Image scraper API called for:", originalUrl);
    console.log("Using account ID:", accountId);

    // If the URL is already a temporary URL, proxy it directly
    if (
      originalUrl.includes("cdn3.onlyfans.com") ||
      originalUrl.includes("digitaloceanspaces.com")
    ) {
      console.log("URL is already a temporary URL, proxying:", originalUrl);

      try {
        const imageResponse = await fetch(originalUrl);

        if (!imageResponse.ok) {
          console.error(
            "Failed to fetch image from URL:",
            imageResponse.status
          );
          return NextResponse.json(
            { error: "Failed to fetch image" },
            { status: 500 }
          );
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const contentType =
          imageResponse.headers.get("content-type") || "image/jpeg";

        return new Response(imageBuffer, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (error) {
        console.error("Error proxying existing temporary URL:", error);
        return NextResponse.json(
          { error: "Failed to proxy image" },
          { status: 500 }
        );
      }
    }

    // Prepare the request body for OnlyFans API
    const requestBody = {
      endpoint: "media-scrape",
      accountId: accountId,
      url: originalUrl,
      expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " "), // 24 hours from now
    };

    console.log("Calling OnlyFans media-scrape API:", requestBody);

    // Call the OnlyFans models API directly with proper authentication
    const baseUrl = request.nextUrl.origin;
    const apiUrl = `${baseUrl}/api/onlyfans/models`;

    console.log("Making internal request to:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forward the authentication cookies
        Cookie: request.headers.get("Cookie") || "",
        // Forward any authorization headers
        Authorization: request.headers.get("Authorization") || "",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("Response status:", response.status);
    console.log("Response content-type:", response.headers.get("content-type"));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OnlyFans media scrape failed:", errorText);
      console.error("Response status:", response.status);

      return NextResponse.json({ error: "Scraping failed" }, { status: 500 });
    }

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Expected JSON but got:", contentType);
      console.error("Response body:", text.substring(0, 500)); // Log first 500 chars

      return NextResponse.json(
        { error: "Invalid response format" },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log("OnlyFans Media Scrape response:", data);

    if (data.temporary_url) {
      console.log("Fetching and proxying image from:", data.temporary_url);

      try {
        // Fetch the actual image from the temporary URL
        const imageResponse = await fetch(data.temporary_url);

        if (!imageResponse.ok) {
          console.error(
            "Failed to fetch image from temporary URL:",
            imageResponse.status
          );
          return NextResponse.json(
            { error: "Failed to fetch scraped image" },
            { status: 500 }
          );
        }

        // Get the image content and content type
        const imageBuffer = await imageResponse.arrayBuffer();
        const imageContentType =
          imageResponse.headers.get("content-type") || "image/jpeg";

        console.log(
          "Successfully proxied image, content-type:",
          imageContentType
        );

        // Return the image directly with proper headers
        return new Response(imageBuffer, {
          headers: {
            "Content-Type": imageContentType,
            "Cache-Control": "public, max-age=3600", // Cache for 1 hour
            "Access-Control-Allow-Origin": "*", // Allow CORS
          },
        });
      } catch (proxyError) {
        console.error("Error proxying image:", proxyError);
        return NextResponse.json(
          { error: "Failed to proxy image" },
          { status: 500 }
        );
      }
    }

    console.warn("No temporary_url in response");
    return NextResponse.json(
      { error: "No temporary URL received" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Image scraper API error:", error);

    // Log more details about the error
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      console.error(
        "JSON parsing error - likely received HTML instead of JSON"
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
