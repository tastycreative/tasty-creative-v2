import { auth } from "@/auth";
import { EmailVerificationBanner } from "@/components/email-verification-banner";
import ContentLayout from "@/components/ContentLayout";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { SidebarProvider } from "@/components/SidebarProvider";

export const metadata: Metadata = {
  title: {
    template: "%s | Tasty Creative",
    default: "",
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
      {/* Base background layer - admin dashboard style */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-pink-50/30 to-rose-50/50 -z-50"></div>
      
      {/* Main content container */}
      <div className="min-h-screen flex flex-col relative">
        {/* Enhanced decorative background elements - pinkish circles */}
        <div className="fixed inset-0 -z-40 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-96 h-96 bg-gradient-to-r from-pink-200/40 to-rose-200/40 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-32 left-20 w-80 h-80 bg-gradient-to-r from-pink-100/50 to-rose-100/50 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-r from-pink-50/30 to-rose-50/30 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/3 w-64 h-64 bg-gradient-to-r from-rose-200/30 to-pink-200/30 rounded-full blur-2xl animate-pulse" />
          <div className="absolute top-1/4 left-10 w-48 h-48 bg-gradient-to-r from-pink-300/20 to-rose-300/20 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-1/3 right-10 w-32 h-32 bg-gradient-to-r from-rose-100/40 to-pink-100/40 rounded-full blur-xl animate-pulse" />
          <div className="absolute top-2/3 left-1/4 w-40 h-40 bg-gradient-to-r from-pink-200/25 to-rose-200/25 rounded-full blur-2xl animate-pulse" />
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