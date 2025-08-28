import { verifyEmail } from "@/app/actions/auth";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/sign-in?error=missing-token", request.url));
  }

  try {
    const result = await verifyEmail(token);

    // Check if user is currently logged in
    const session = await auth();

    if (session) {
      // User is logged in - send to verify success to refresh session
      if (result.alreadyVerified) {
        return NextResponse.redirect(new URL("/dashboard?message=already-verified", request.url));
      } else {
        return NextResponse.redirect(new URL("/verify-success", request.url));
      }
    } else {
      // User is not logged in - send to sign in
      if (result.alreadyVerified) {
        return NextResponse.redirect(new URL("/sign-in?message=already-verified", request.url));
      } else {
        return NextResponse.redirect(new URL("/sign-in?verified=true", request.url));
      }
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Invalid token";

    // Check if user is logged in
    const session = await auth();
    if (session) {
      return NextResponse.redirect(new URL(`/dashboard?error=${encodeURIComponent(errorMessage)}`, request.url));
    } else {
      return NextResponse.redirect(new URL(`/sign-in?error=${encodeURIComponent(errorMessage)}`, request.url));
    }
  }
}
