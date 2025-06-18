
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

    const apiKey = process.env.ONLYFANS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OnlyFans API key not configured" }, { status: 500 });
    }

    let apiUrl = "";
    
    const accountId = searchParams.get("accountId");
    
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
      case "earnings":
        if (!username && !accountId) {
          return NextResponse.json({ error: "Username or accountId required for earnings data" }, { status: 400 });
        }
        apiUrl = `${ONLYFANS_API_BASE}/accounts/${accountId || username}/earnings`;
        break;
      case "chats":
        if (!accountId) {
          return NextResponse.json({ error: "Account ID required for chats data" }, { status: 400 });
        }
        apiUrl = `${ONLYFANS_API_BASE}/chats`;
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
        apiUrl = `${ONLYFANS_API_BASE}/media-vault`;
        break;
      case "vault-lists":
        if (!accountId) {
          return NextResponse.json({ error: "Account ID required for vault lists data" }, { status: 400 });
        }
        apiUrl = `${ONLYFANS_API_BASE}/media-vault-lists`;
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
        apiUrl = `${ONLYFANS_API_BASE}/public-profiles/${accountId}`;
        break;
      case "profile-visitors":
        if (!accountId) {
          return NextResponse.json({ error: "Account ID required for profile visitors data" }, { status: 400 });
        }
        apiUrl = `${ONLYFANS_API_BASE}/statistics-reach/profile-visitors`;
        break;
      case "transactions":
        if (!accountId) {
          return NextResponse.json({ error: "Account ID required for transactions data" }, { status: 400 });
        }
        apiUrl = `${ONLYFANS_API_BASE}/transactions`;
        break;
      case "tracking-links":
        if (!accountId) {
          return NextResponse.json({ error: "Account ID required for tracking links data" }, { status: 400 });
        }
        apiUrl = `${ONLYFANS_API_BASE}/tracking-links`;
        break;
      default:
        return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
    }

    const response = await fetch(apiUrl, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OnlyFans API Error:", response.status, errorText);
      return NextResponse.json(
        { error: `OnlyFans API Error: ${response.status}` }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("OnlyFans API integration error:", error);
    return NextResponse.json(
      { error: "Failed to fetch OnlyFans data" }, 
      { status: 500 }
    );
  }
}
