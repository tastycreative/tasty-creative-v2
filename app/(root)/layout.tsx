import { auth } from "@/auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { RootLayoutClient } from "@/components/RootLayoutClient";

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

  return <RootLayoutClient>{children}</RootLayoutClient>;
}
