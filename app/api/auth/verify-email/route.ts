import { verifyEmail } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    redirect("/sign-in?error=missing-token");
  }

  try {
    const result = await verifyEmail(token);

    // Check if user is currently logged in
    const session = await auth();

    if (session) {
      // User is logged in - they need to refresh their session
      if (result.alreadyVerified) {
        redirect("/dashboard?message=already-verified");
      } else {
        redirect("/verify-success");
      }
    } else {
      // User is not logged in - send to sign in
      if (result.alreadyVerified) {
        redirect("/sign-in?message=already-verified");
      } else {
        redirect("/sign-in?verified=true");
      }
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Invalid token";

    // Check if user is logged in
    const session = await auth();
    if (session) {
      redirect(`/dashboard?error=${encodeURIComponent(errorMessage)}`);
    } else {
      redirect(`/sign-in?error=${encodeURIComponent(errorMessage)}`);
    }
  }
}
