import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const ONLYFANS_API_BASE = "https://app.onlyfansapi.com/api";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    const endpoint = searchParams.get("endpoint") || "profile";
    const accountId = searchParams.get("accountId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const chatId = searchParams.get("chatId");
    const listId = searchParams.get("listId");
    const linkId = searchParams.get("linkId");
    const userId = searchParams.get("userId");

    const apiKey = process.env.ONLYFANS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OnlyFans API key not configured" },
        { status: 500 }
      );
    }

    let apiUrl = "";
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    // If accountId is provided, add it to headers for authentication context
    if (accountId) {
      headers["X-Account-ID"] = accountId;
    }

    switch (endpoint) {
      case "accounts":
        apiUrl = `${ONLYFANS_API_BASE}/accounts`;
        break;
      case "profile":
        if (!username) {
          return NextResponse.json(
            { error: "Username required for profile data" },
            { status: 400 }
          );
        }
        apiUrl = `${ONLYFANS_API_BASE}/accounts/${username}`;
        break;
      case "stats":
        if (!username) {
          return NextResponse.json(
            { error: "Username required for stats data" },
            { status: 400 }
          );
        }
        apiUrl = `${ONLYFANS_API_BASE}/accounts/${username}/stats`;
        break;
      case "posts":
        if (!username) {
          return NextResponse.json(
            { error: "Username required for posts data" },
            { status: 400 }
          );
        }
        apiUrl = `${ONLYFANS_API_BASE}/accounts/${username}/posts`;
        break;
      case "chats":
        if (!accountId) {
          return NextResponse.json(
            { error: "Account ID required for chats data" },
            { status: 400 }
          );
        }
        // GET /chats endpoint - lists all chats
        apiUrl = `${ONLYFANS_API_BASE}/chats`;
        break;
      case "chat-messages":
        if (!accountId || !chatId) {
          return NextResponse.json(
            { error: "Account ID and Chat ID required for chat messages" },
            { status: 400 }
          );
        }
        // GET /chats/{chat_id}/messages endpoint
        apiUrl = `${ONLYFANS_API_BASE}/chats/${chatId}/messages`;
        break;
      case "active-fans":
        if (!accountId) {
          return NextResponse.json(
            { error: "Account ID required for active fans data" },
            { status: 400 }
          );
        }
        // GET /{account}/fans/active endpoint
        apiUrl = `${ONLYFANS_API_BASE}/${accountId}/fans/active`;
        break;
      case "expired-fans":
        if (!accountId) {
          return NextResponse.json(
            { error: "Account ID required for expired fans data" },
            { status: 400 }
          );
        }
        // GET /{account}/fans/expired endpoint
        apiUrl = `${ONLYFANS_API_BASE}/${accountId}/fans/expired`;
        break;
      case "vault-media":
        if (!accountId) {
          return NextResponse.json(
            { error: "Account ID required for vault media data" },
            { status: 400 }
          );
        }
        const listParam = searchParams.get("list");
        if (!listParam) {
          return NextResponse.json(
            { error: "List ID required for vault media data" },
            { status: 400 }
          );
        }
        // GET /{account}/media/vault?list={list_id} endpoint
        apiUrl = `${ONLYFANS_API_BASE}/${accountId}/media/vault?list=${listParam}`;
        break;
      case "vault-lists":
        if (!accountId) {
          return NextResponse.json(
            { error: "Account ID required for vault lists data" },
            { status: 400 }
          );
        }
        // GET /{account}/media/vault/lists endpoint with pagination
        const listLimit = searchParams.get("limit") || "20";
        const listOffset = searchParams.get("offset") || "0";
        apiUrl = `${ONLYFANS_API_BASE}/${accountId}/media/vault/lists?limit=${listLimit}&offset=${listOffset}`;
        break;
      case "vault-list-details":
        if (!accountId || !listId) {
          return NextResponse.json(
            { error: "Account ID and List ID required for vault list details" },
            { status: 400 }
          );
        }
        // GET /{account}/media/vault/lists/{list_id} endpoint
        apiUrl = `${ONLYFANS_API_BASE}/${accountId}/media/vault/lists/${listId}`;
        break;
      case "account-balances":
        if (!accountId) {
          return NextResponse.json(
            { error: "Account ID required for account balances data" },
            { status: 400 }
          );
        }
        // GET /{account}/payouts/account-balances endpoint
        apiUrl = `${ONLYFANS_API_BASE}/${accountId}/payouts/account-balances`;
        break;
      case "profile-details":
        if (!accountId) {
          return NextResponse.json(
            { error: "Account ID required for profile details data" },
            { status: 400 }
          );
        }
        // GET /public-profiles/{account_id} endpoint
        apiUrl = `${ONLYFANS_API_BASE}/public-profiles/${accountId}`;
        break;
      case "profile-visitors":
        if (!accountId || !startDate || !endDate) {
          return NextResponse.json(
            {
              error:
                "Account ID, start date, and end date required for profile visitors data",
            },
            { status: 400 }
          );
        }
        // GET /{account}/statistics/reach/profile-visitors endpoint with required date parameters
        apiUrl = `${ONLYFANS_API_BASE}/${accountId}/statistics/reach/profile-visitors`;
        break;
      case "earnings":
        if (!accountId || !startDate || !endDate) {
          return NextResponse.json(
            {
              error:
                "Account ID, start date, and end date required for earnings data",
            },
            { status: 400 }
          );
        }
        // GET /{account}/statistics/statements/earnings endpoint
        apiUrl = `${ONLYFANS_API_BASE}/${accountId}/statistics/statements/earnings`;
        break;
      case "tracking-links":
        if (!accountId) {
          return NextResponse.json(
            { error: "Account ID required for tracking links data" },
            { status: 400 }
          );
        }
        // GET /tracking-links endpoint
        apiUrl = `${ONLYFANS_API_BASE}/tracking-links`;
        break;
      case "tracking-link-subscribers":
        if (!accountId || !linkId) {
          return NextResponse.json(
            {
              error:
                "Account ID and Link ID required for tracking link subscribers",
            },
            { status: 400 }
          );
        }
        // GET /tracking-links/{link_id}/subscribers endpoint
        apiUrl = `${ONLYFANS_API_BASE}/tracking-links/${linkId}/subscribers`;
        break;
      case "transactions":
        if (!accountId || !startDate || !endDate) {
          return NextResponse.json(
            {
              error:
                "Account ID, start date, and end date required for transactions data",
            },
            { status: 400 }
          );
        }
        // GET /transactions endpoint with required date parameters
        apiUrl = `${ONLYFANS_API_BASE}/transactions?start_date=${startDate}&end_date=${endDate}`;
        break;
      case "user-details":
        if (!accountId || !userId) {
          return NextResponse.json(
            { error: "Account ID and User ID required for user details" },
            { status: 400 }
          );
        }
        // GET /users/{user_id} endpoint
        apiUrl = `${ONLYFANS_API_BASE}/users/${userId}`;
        break;
      case "mass-messaging":
        if (!accountId) {
          return NextResponse.json(
            { error: "Account ID required for mass messaging statistics" },
            { status: 400 }
          );
        }
        // GET /{account}/mass-messaging/statistics endpoint with pagination
        const limit = searchParams.get("limit") || "100";
        const offset = searchParams.get("offset") || "0";
        apiUrl = `${ONLYFANS_API_BASE}/${accountId}/mass-messaging/statistics?limit=${limit}&offset=${offset}`;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid endpoint" },
          { status: 400 }
        );
    }

    console.log(`Making OnlyFans API request to: ${apiUrl}`);

    // Prepare request options
    const requestOptions: RequestInit = {
      headers,
      method: "GET",
    };

    // For earnings endpoint, add query parameters to URL
    if (endpoint === "earnings") {
      apiUrl += `?start_date=${encodeURIComponent(startDate || "")}&end_date=${encodeURIComponent(endDate || "")}&type=total`;
    }

    // For profile visitors endpoint, add query parameters to URL
    if (endpoint === "profile-visitors") {
      const type = searchParams.get("type") || "total";
      apiUrl += `?start_date=${encodeURIComponent(startDate || "")}&end_date=${encodeURIComponent(endDate || "")}&type=${type}`;
    }

    // For fans endpoints, add pagination parameters as query parameters
    if (endpoint === "active-fans" || endpoint === "expired-fans") {
      const limit = searchParams.get("limit") || "50";
      const offset = searchParams.get("offset") || "0";

      apiUrl += `?limit=${limit}&offset=${offset}`;
    }

    const response = await fetch(apiUrl, requestOptions);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OnlyFans API Error:", response.status, errorText);
      return NextResponse.json(
        { error: `OnlyFans API Error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`OnlyFans API response for ${endpoint}:`, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("OnlyFans API integration error:", error);
    return NextResponse.json(
      { error: "Failed to fetch OnlyFans data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("POST request body:", body);
    const { endpoint, accountId, url, expiration_date } = body;
    console.log("Extracted values:", {
      endpoint,
      accountId,
      url,
      expiration_date,
    });

    const apiKey = process.env.ONLYFANS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OnlyFans API key not configured" },
        { status: 500 }
      );
    }

    if (endpoint === "media-scrape") {
      if (!accountId || !url) {
        console.log("Missing required params for media scraping");
        return NextResponse.json(
          { error: "Account ID and URL required for media scraping" },
          { status: 400 }
        );
      }

      const apiUrl = `${ONLYFANS_API_BASE}/${accountId}/media/scrape`;

      const requestBody = {
        url: url,
        expiration_date:
          expiration_date ||
          new Date(Date.now() + 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "OnlyFans Media Scrape Error:",
          response.status,
          errorText
        );
        return NextResponse.json(
          { error: `OnlyFans API Error: ${response.status} - ${errorText}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log("OnlyFans Media Scrape response:", data);

      // Normalize the response to provide a consistent structure
      const normalizedResponse = {
        success: true,
        data: data,
        scrapedUrl: data.temporary_url || data.url, // Support both field names
        temporary_url: data.temporary_url, // Keep original field
        url: data.url // Keep original field
      };

      return NextResponse.json(normalizedResponse);
    }

    return NextResponse.json(
      { error: "Unsupported POST endpoint" },
      { status: 400 }
    );
  } catch (error) {
    console.error("OnlyFans API POST error:", error);
    return NextResponse.json(
      { error: "Failed to process OnlyFans POST request" },
      { status: 500 }
    );
  }
}
