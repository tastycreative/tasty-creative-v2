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
    </SidebarProvider>
  );
}
