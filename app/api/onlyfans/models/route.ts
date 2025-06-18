
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const ONLYFANS_API_BASE = "https://onlyfansapi.com/api";

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
    
    switch (endpoint) {
      case "profile":
        if (!username) {
          return NextResponse.json({ error: "Username required for profile data" }, { status: 400 });
        }
        apiUrl = `${ONLYFANS_API_BASE}/users/${username}`;
        break;
      case "stats":
        if (!username) {
          return NextResponse.json({ error: "Username required for stats data" }, { status: 400 });
        }
        apiUrl = `${ONLYFANS_API_BASE}/users/${username}/stats`;
        break;
      case "posts":
        if (!username) {
          return NextResponse.json({ error: "Username required for posts data" }, { status: 400 });
        }
        apiUrl = `${ONLYFANS_API_BASE}/users/${username}/posts`;
        break;
      case "earnings":
        if (!username) {
          return NextResponse.json({ error: "Username required for earnings data" }, { status: 400 });
        }
        apiUrl = `${ONLYFANS_API_BASE}/users/${username}/earnings`;
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
