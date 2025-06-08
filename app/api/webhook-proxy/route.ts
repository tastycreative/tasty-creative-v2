/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// Webhook URL configuration
const WEBHOOK_URLS = {
  default: "https://n8n.tastycreative.xyz/webhook/8891f352-4735-4daf-9b0f-bf691c59d1a0",
  discord: "https://n8n.tastycreative.xyz/webhook/6dc27650-f328-4b37-912b-006882d69a65",
  vip: "https://n8n.tastycreative.xyz/webhook/fc87dd15-0df9-4ee1-8947-2a82d961fed4",
  ftt: "https://n8n.tastycreative.xyz/webhook/4713ce33-501e-49b0-a6c6-38a907e1651b",
} as const;


function determineWebhookUrl(isCustomRequest: boolean, type: string): string {
  if (isCustomRequest) return WEBHOOK_URLS.discord;
  if (type === "VIP") return WEBHOOK_URLS.vip;
  if (type === "FTT") return WEBHOOK_URLS.ftt;
  return WEBHOOK_URLS.default;
}

function processModelField(value: string): string {
  const match = value.match(/\(([^)]+)\)$/);
  return match ? match[1] : value;
}

function createForwardData(formData: FormData): FormData {
  const forwardData = new FormData();

  formData.forEach((value, key) => {
    if (key === "model" && typeof value === "string") {
      forwardData.append("model", processModelField(value));
    } else if (key !== "imageFile" && key !== "isCustomRequest") {
      forwardData.append(key, value);
    }
  });

  // Handle image file separately
  const imageFile = formData.get("imageFile") as File | null;
  if (imageFile) {
    forwardData.append("data", imageFile, imageFile.name);
  }

  return forwardData;
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check using Auth.js
    const session = await auth();
    if (!session || !session.user) {
      console.error("Authentication failed: No session or user found");
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    
    // Extract request parameters
    const isCustomRequest = formData.get("isCustomRequest") === "true";
    const requestType = formData.get("type") as string;

    // Prepare data for forwarding
    const forwardData = createForwardData(formData);

    // Add user information from session
    if (session.user.name) {
      forwardData.append("user_name", session.user.name);
    }
    if (session.user.email) {
      forwardData.append("user_email", session.user.email);
    }

    // Determine target webhook URL
    const targetUrl = determineWebhookUrl(isCustomRequest, requestType);
    console.log("Target webhook URL:", targetUrl);

    // Forward the request to the appropriate webhook
    const response = await fetch(targetUrl, {
      method: "POST",
      body: forwardData,
    });

    if (!response.ok) {
      console.error(`Webhook request failed with status: ${response.status}`);
      return NextResponse.json(
        { error: `Webhook request failed with status: ${response.status}` },
        { status: response.status }
      );
    }

    // Parse response
    const textData = await response.text();
    try {
      const jsonData = JSON.parse(textData);
      return NextResponse.json(jsonData);
    } catch (parseError) {
      console.error("Failed to parse webhook response as JSON:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON response from webhook", rawResponse: textData },
        { status: 502 }
      );
    }

  } catch (error: any) {
    console.error("Webhook proxy error:", error);
    
    // Handle specific error types
    if (error.name === "AuthenticationError" || error.status === 401) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    if (error.name === "NetworkError" || error.code === "NETWORK_ERROR") {
      return NextResponse.json(
        { error: "Network error occurred while calling webhook" },
        { status: 503 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { 
        error: "Failed to call webhook",
        message: "An unexpected error occurred while processing the request"
      },
      { status: 500 }
    );
  }
}