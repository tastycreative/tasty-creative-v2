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
      {/* Base solid background layer */}
      <div className="fixed inset-0 bg-slate-950 -z-50"></div>
      
      {/* Main content container */}
      <div className="min-h-screen flex flex-col  relative">
        {/* Animated Starry Background */}
        <div className="fixed inset-0 -z-40 overflow-hidden">
          <div className="absolute inset-0 stars-container">
            <div className="stars"></div>
            <div className="stars2"></div>
            <div className="stars3"></div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <EmailVerificationBanner />
          <ContentLayout>{children}</ContentLayout>
        </div>
      </div>
    </SidebarProvider>
  );
}