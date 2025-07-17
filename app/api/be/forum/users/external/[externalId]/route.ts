import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:3000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ externalId: string }> }
) {
  try {
    const { externalId } = await params;

    const response = await fetch(`${BACKEND_URL}/forum/users/external/${externalId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
      throw new Error(`Backend responded with ${response.status}`);
    }

    const user = await response.json();
    return NextResponse.json(user);

  } catch (error) {
    console.error("Error fetching forum user by external ID:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
