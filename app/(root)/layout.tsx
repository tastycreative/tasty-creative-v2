import { auth } from "@/auth";

import ContentLayout from "@/components/ContentLayout";
import { RootLayoutClient } from "@/components/RootLayoutClient";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { SidebarProvider } from "@/components/SidebarProvider";
import NotificationBell from "@/components/notifications/NotificationBell";

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
      <RootLayoutClient>{children}</RootLayoutClient>
      {/* Fixed Notification Bell - Top Right */}
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-full shadow-lg border border-pink-200/50 dark:border-pink-500/30 hover:shadow-xl transition-all duration-300 hover:border-pink-300/60 dark:hover:border-pink-400/50">
          <NotificationBell className="sm:scale-100 scale-90" />
        </div>
      </div>
    </SidebarProvider>
  );
}