import { auth } from "@/auth";
import { EmailVerificationBanner } from "@/components/email-verification-banner";
import { ProtectedFeature } from "@/components/protected-feature";
import SideBar from "@/components/SideBar";
import { Metadata } from "next";
import { redirect } from "next/navigation";

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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
      {/* Animated Starry Background */}
      <div className="fixed z-0 ">
        <div className="stars-container">
          {/* Small stars */}
          <div className="stars"></div>
          {/* Medium stars */}
          <div className="stars2"></div>
          {/* Large stars */}
          <div className="stars3"></div>
        </div>
      </div>

      <EmailVerificationBanner />

      <div className="flex gap-6 flex-1 p-4 relative z-10">
        <SideBar />

        <div className="flex-1 relative ml-76">
          <div className="h-full rounded-2xl backdrop-blur-[2px] shadow-xl border border-white/50 dark:border-slate-700/50 overflow-hidden ">
            {/* Subtle dot pattern */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" />

            {/* Gentle top gradient */}
            <div className="absolute inset-x-0 top-0 h-32 " />

            {/* Content */}
            <ProtectedFeature>
              <div className="relative h-full p-6">{children}</div>
            </ProtectedFeature>
          </div>
        </div>
      </div>
    </div>
  );
}
