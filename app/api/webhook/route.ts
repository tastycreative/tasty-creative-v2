/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// Type definitions
interface WebhookResponseData {
  data: any;
  timestamp: number;
  userId: string; // Add user association for security
}

// Store webhook data mapped to requestId
const webhookResponses: Record<string, WebhookResponseData> = {};

// Cleanup interval to prevent memory leaks (24 hours)
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;
const MAX_AGE = 60 * 60 * 1000; // 1 hour max age for responses

// Periodic cleanup to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  Object.keys(webhookResponses).forEach(requestId => {
    if (now - webhookResponses[requestId].timestamp > MAX_AGE) {
      delete webhookResponses[requestId];
    }
  });
}, CLEANUP_INTERVAL);

function validateRequestId(requestId: string | null): boolean {
  return Boolean(requestId && typeof requestId === 'string' && requestId.trim().length > 0);
}

export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      console.error("Authentication failed: No session, user, or email found");
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Parse request body
    let body: any;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { requestId } = body;

    // Validate requestId
    if (!validateRequestId(requestId)) {
      return NextResponse.json(
        { error: "Missing or invalid requestId" },
        { status: 400 }
      );
    }

    // Store webhook response with user association
    webhookResponses[requestId] = {
      data: body,
      timestamp: Date.now(),
      userId: session.user.email, // Use email as unique identifier
    };

    console.log(`Webhook response stored for requestId: ${requestId}, user: ${session.user.email}`);

    return NextResponse.json({ 
      success: true,
      requestId,
      timestamp: webhookResponses[requestId].timestamp
    });

  } catch (error: any) {
    console.error("Webhook storage error:", error);
    
    // Handle specific error types
    if (error.name === "AuthenticationError" || error.status === 401) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to store webhook response",
        message: "An unexpected error occurred while processing the request"
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Authentication check
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      console.error("Authentication failed: No session, user, or email found");
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Extract requestId from search params
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("requestId");

    // Validate requestId
    if (!validateRequestId(requestId)) {
      return NextResponse.json(
        { error: "Missing or invalid requestId" },
        { status: 400 }
      );
    }

    const storedResponse = webhookResponses[requestId!];

    // Check if response exists
    if (!storedResponse) {
      return NextResponse.json(
        { error: "Response not found or expired", requestId },
        { status: 404 }
      );
    }

    // Security check: ensure user can only access their own responses
    if (storedResponse.userId !== session.user.email) {
      console.warn(`Unauthorized access attempt: User ${session.user.email} tried to access requestId ${requestId} owned by ${storedResponse.userId}`);
      return NextResponse.json(
        { error: "Unauthorized access to this response" },
        { status: 403 }
      );
    }

    // Check if response has expired
    const now = Date.now();
    if (now - storedResponse.timestamp > MAX_AGE) {
      delete webhookResponses[requestId!];
      return NextResponse.json(
        { error: "Response has expired", requestId },
        { status: 410 }
      );
    }

    // Return the response and clear it from storage
    const response = {
      ...storedResponse,
      retrievedAt: now
    };
    
    // Clear the stored response after retrieval
    delete webhookResponses[requestId!];

    console.log(`Webhook response retrieved for requestId: ${requestId}, user: ${session.user.email}`);

    return NextResponse.json(response);

  } catch (error: any) {
    console.error("Webhook retrieval error:", error);
    
    // Handle specific error types
    if (error.name === "AuthenticationError" || error.status === 401) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to retrieve webhook response",
        message: "An unexpected error occurred while processing the request"
      },
      { status: 500 }
    );
  }
}