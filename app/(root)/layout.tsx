import { auth } from "@/auth";
import { EmailVerificationBanner } from "@/components/email-verification-banner";
import ContentLayout from "@/components/ContentLayout";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { SidebarProvider } from "@/components/SidebarProvider";

export const metadata: Metadata = {
  title: {
    template: "%s | Tasty Creative",
    default: "Dashboard",
  },
  description: "Tasty Creative",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Small stars */}
            <div className="stars"></div>
            {/* Medium stars */}
            <div className="stars2"></div>
            {/* Large stars */}
            <div className="stars3"></div>
          </div>
        </div>

        <EmailVerificationBanner />

        <ContentLayout>{children}</ContentLayout>
      </div>
    </SidebarProvider>
  );
}