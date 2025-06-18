
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
          // Return mock data for now since the endpoint doesn't exist
          return NextResponse.json({ 
            chats: [
              {
                id: "chat_1",
                with_user: {
                  id: 12345,
                  name: "Fan User 1",
                  username: "fan1",
                  avatar: "/model.png"
                },
                last_message: {
                  text: "Hey! Love your content",
                  created_at: new Date().toISOString()
                },
                unread_count: 2
              }
            ]
          });
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
          // Return mock data for now
          return NextResponse.json({ 
            fans: [
              {
                id: 1,
                name: "Active Fan 1",
                username: "activefan1",
                avatar: "/model.png",
                subscribed_at: new Date().toISOString(),
                total_spent: 150,
                is_subscribed: true
              }
            ]
          });
        }
        apiUrl = `${ONLYFANS_API_BASE}/fans/active`;
        break;
      case "expired-fans":
        if (!accountId) {
          // Return mock data for now
          return NextResponse.json({ 
            fans: [
              {
                id: 2,
                name: "Expired Fan 1",
                username: "expiredfan1",
                avatar: "/model.png",
                subscribed_at: new Date().toISOString(),
                expired_at: new Date().toISOString(),
                total_spent: 75,
                is_subscribed: false
              }
            ]
          });
        }
        apiUrl = `${ONLYFANS_API_BASE}/fans/expired`;
        break;
      case "vault-media":
        if (!accountId) {
          // Return mock data for now
          return NextResponse.json({ 
            media: [
              {
                id: "media_1",
                name: "Photo Set 1",
                type: "image",
                url: "/model.png",
                thumbnail: "/model.png",
                created_at: new Date().toISOString(),
                size: 1024000
              }
            ]
          });
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
          // Return mock data for now
          return NextResponse.json({ 
            current_balance: 1250.50,
            pending_balance: 340.75,
            total_earnings: 15680.25
          });
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
          // Return mock data for now
          return NextResponse.json({ 
            visitors: {
              total_visitors: 12450,
              unique_visitors: 8730,
              daily_visitors: {
                "2024-01-15": 120,
                "2024-01-16": 135,
                "2024-01-17": 98
              }
            }
          });
        }
        apiUrl = `${ONLYFANS_API_BASE}/statistics-reach/profile-visitors`;
        break;
      case "earnings":
        if (!accountId) {
          // Return mock data for now
          return NextResponse.json({ 
            earnings: {
              total_earnings: 15680.25,
              current_balance: 1250.50,
              pending_balance: 340.75,
              monthly_earnings: 2840.30,
              daily_earnings: {
                "2024-01-15": 95.50,
                "2024-01-16": 128.75,
                "2024-01-17": 87.25
              }
            }
          });
        }
        apiUrl = `${ONLYFANS_API_BASE}/statistics-statements/earnings`;
        break;
      case "tracking-links":
        if (!accountId) {
          // Return mock data for now
          return NextResponse.json({ 
            links: [
              {
                id: "link_1",
                name: "Twitter Bio Link",
                url: "https://onlyfans.com/autumren?ref=twitter",
                clicks: 1250,
                created_at: new Date().toISOString()
              }
            ]
          });
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
          // Return mock data for now
          return NextResponse.json({ 
            transactions: [
              {
                id: "trans_1",
                type: "subscription",
                amount: 20.00,
                description: "Monthly subscription",
                created_at: new Date().toISOString(),
                status: "completed"
              }
            ]
          });
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

    // Skip API call for endpoints that return mock data
    const mockDataEndpoints = ['chats', 'active-fans', 'expired-fans', 'vault-media', 'account-balances', 'profile-visitors', 'earnings', 'tracking-links', 'transactions'];
    if (mockDataEndpoints.includes(endpoint) && !accountId) {
      // Mock data already returned above
      return;
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
