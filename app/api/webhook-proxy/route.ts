import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// const webhookUrl = process.env.WEBHOOK_URL!;
const webhookUrl =
  "https://n8n.tastycreative.xyz/webhook/8891f352-4735-4daf-9b0f-bf691c59d1a0";
// const discordWebhookUrl = process.env.DISCORD_BOT_WEBHOOK_URL!;
const discordWebhookUrl =
  "https://n8n.tastycreative.xyz/webhook/6dc27650-f328-4b37-912b-006882d69a65";
// const vipWebhookUrl = process.env.VIP_WEBHOOK_URL!;
const vipWebhookUrl =
  "https://n8n.tastycreative.xyz/webhook/fc87dd15-0df9-4ee1-8947-2a82d961fed4";
const fttWebhookUrl =
  "https://n8n.tastycreative.xyz/webhook/4713ce33-501e-49b0-a6c6-38a907e1651b";

export async function POST(request: NextRequest) {
  try {
    // Get the session using Auth.js
    const session = await auth();
    
    const formData = await request.formData();

    // Get isCustomRequest from form data
    const isCustomRequest = formData.get("isCustomRequest") === "true";
    const isVip = formData.get("type") === "VIP";
    const isFtt = formData.get("type") === "FTT";

    // Prepare FormData for forwarding
    const forwardData = new FormData();

    formData.forEach((value, key) => {
      if (key === "model" && typeof value === "string") {
        const match = value.match(/\(([^)]+)\)$/);
        const formattedModel = match ? match[1] : value;
        forwardData.append("model", formattedModel);
      } else if (key !== "imageFile" && key !== "isCustomRequest") {
        forwardData.append(key, value);
      }
    });

    // Append the file separately
    const imageFile = formData.get("imageFile") as File | null;
    if (imageFile) {
      forwardData.append("data", imageFile, imageFile.name);
    }

    // 🧠 Extract user info from Auth.js session
    if (session?.user) {
      if (session.user.name) {
        forwardData.append("user_name", session.user.name);
      }
      if (session.user.email) {
        forwardData.append("user_email", session.user.email);
      }
    } else {
      console.warn("No authenticated session found");
      // Optionally, you might want to return an error if authentication is required
      // return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Determine which URL to use
    const targetUrl = isCustomRequest
      ? discordWebhookUrl
      : isVip
      ? vipWebhookUrl
      : isFtt
      ? fttWebhookUrl
      : webhookUrl;
    console.log("targetUrl", targetUrl);

    // Forward the request
    const response = await fetch(targetUrl, {
      method: "POST",
      body: forwardData,
    });

    const textData = await response.text();
    try {
      const jsonData = JSON.parse(textData);
      return NextResponse.json(jsonData);
    } catch {
      return NextResponse.json({ error: "Invalid JSON response from webhook" });
    }
  } catch (error) {
    console.error("Webhook proxy error:", error);
    return NextResponse.json(
      { error: "Failed to call webhook" },
      { status: 500 }
    );
  }
}