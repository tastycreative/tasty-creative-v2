
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

    const apiKey = process.env.ONLYFANS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OnlyFans API key not configured" }, { status: 500 });
    }

    let apiUrl = "";
    let headers: Record<string, string> = {
      "Authorization": `Bearer ${apiKey}`,
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
          return NextResponse.json({ error: "Username required for profile data" }, { status: 400 });
        }
        apiUrl = `${ONLYFANS_API_BASE}/accounts/${username}`;
        break;
      case "stats":
        if (!username) {
          return NextResponse.json({ error: "Username required for stats data" }, { status: 400 });
        }
        apiUrl = `${ONLYFANS_API_BASE}/accounts/${username}/stats`;
        break;
      case "posts":
        if (!username) {
          return NextResponse.json({ error: "Username required for posts data" }, { status: 400 });
        }
        apiUrl = `${ONLYFANS_API_BASE}/accounts/${username}/posts`;
        break;
      case "chats":
        if (!accountId) {
          return NextResponse.json({ error: "Account ID required for chats data" }, { status: 400 });
        }
        apiUrl = `${ONLYFANS_API_BASE}/chats/list`;
        break;
      case "chat-messages":
        const chatId = searchParams.get("chatId");
        if (!accountId || !chatId) {
          return NextResponse.json({ error: "Account ID and Chat ID required for chat messages" }, { status: 400 });
        }
        apiUrl = `${ONLYFANS_API_BASE}/chats/${chatId}/messages`;
        break;
      case "active-fans":
        if (!accountId) {
          return NextResponse.json({ error: "Account ID required for active fans data" }, { status: 400 });
        }
        apiUrl = `${ONLYFANS_API_BASE}/fans/active`;
        break;
      case "expired-fans":
        if (!accountId) {
          return NextResponse.json({ error: "Account ID required for expired fans data" }, { status: 400 });
        }
        apiUrl = `${ONLYFANS_API_BASE}/fans/expired`;
        break;
      case "vault-media":
        if (!accountId) {
          return NextResponse.json({ error: "Account ID required for vault media data" }, { status: 400 });
        }
        apiUrl = `${ONLYFANS_API_BASE}/media-vault/list`;
        break;
      case "vault-lists":
        if (!accountId) {
          return NextResponse.json({ error: "Account ID required for vault lists data" }, { status: 400 });
        }
        apiUrl = `${ONLYFANS_API_BASE}/media-vault-lists/list`;
        break;
      case "vault-list-details":
        const listId = searchParams.get("listId");
        if (!accountId || !listId) {
          return NextResponse.json({ error: "Account ID and List ID required for vault list details" }, { status: 400 });
        }
        apiUrl = `${ONLYFANS_API_BASE}/media-vault-lists/${listId}`;
        break;
      case "account-balances":
        if (!accountId) {
          return NextResponse.json({ error: "Account ID required for account balances data" }, { status: 400 });
        }
        apiUrl = `${ONLYFANS_API_BASE}/payouts/account-balances`;
        break;
      case "account-details":
        if (!accountId) {
          return NextResponse.json({ error: "Account ID required for account details data" }, { status: 400 });
        }
        apiUrl = `${ONLYFANS_API_BASE}/public-profiles/details`;
        break;
      case "profile-visitors":
        if (!accountId) {
          return NextResponse.json({ error: "Account ID required for profile visitors data" }, { status: 400 });
        }
        apiUrl = `${ONLYFANS_API_BASE}/statistics-reach/profile-visitors`;
        break;
      case "earnings":
        if (!accountId) {
          return NextResponse.json({ error: "Account ID required for earnings data" }, { status: 400 });
        }
        apiUrl = `${ONLYFANS_API_BASE}/statistics-statements/earnings`;
        break;
      case "tracking-links":
        if (!accountId) {
          return NextResponse.json({ error: "Account ID required for tracking links data" }, { status: 400 });
        }
        apiUrl = `${ONLYFANS_API_BASE}/tracking-links/list`;
        break;
      case "tracking-link-subscribers":
        const linkId = searchParams.get("linkId");
        if (!accountId || !linkId) {
          return NextResponse.json({ error: "Account ID and Link ID required for tracking link subscribers" }, { status: 400 });
        }
        apiUrl = `${ONLYFANS_API_BASE}/tracking-links/${linkId}/subscribers`;
        break;
      case "transactions":
        if (!accountId) {
          return NextResponse.json({ error: "Account ID required for transactions data" }, { status: 400 });
        }
        apiUrl = `${ONLYFANS_API_BASE}/transactions/list`;
        break;
      case "user-details":
        const userId = searchParams.get("userId");
        if (!accountId || !userId) {
          return NextResponse.json({ error: "Account ID and User ID required for user details" }, { status: 400 });
        }
        apiUrl = `${ONLYFANS_API_BASE}/users/${userId}/details`;
        break;
      default:
        return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
    }

    console.log(`Making OnlyFans API request to: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers,
      method: 'GET'
    });

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
