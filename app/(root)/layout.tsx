import { auth } from "@/auth";
import { EmailVerificationBanner } from "@/components/email-verification-banner";
import { redirect } from "next/navigation";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session?.user?.role === "GUEST") {
    redirect("/");
  }
  return (
    <div className="min-h-screen">
      <EmailVerificationBanner />
      {children}
    </div>
  );
}
