import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import dynamic from "next/dynamic";
import "./globals.css";
import { Providers } from "./providers";
// import QuicklinksNavigation from "@/components/QuickLinksNavigation";
import { SessionMonitor } from "@/components/SessionMonitor";
import { SessionErrorHandler } from "@/components/auth/SessionErrorHandler";

// Lazy load FeedbackButton - rarely used, heavy with 8 icons (code-split for better initial load)
const FeedbackButton = dynamic(() => import("@/components/FeedbackButton"));

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tasty Creative",
  description: "Crafting Digital Experiences Beyond Imagination",
  icons: {
    icon: [
      {
        url: "/tasty-new.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/tasty-new.png", 
        sizes: "16x16",
        type: "image/png",
      }
    ],
    apple: "/tasty-new.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <SessionMonitor />
          <SessionErrorHandler />
          {children}
          <FeedbackButton />
          {/* <QuicklinksNavigation /> */}
          {/* <ChatBot /> */}
        </Providers>
      </body>
    </html>
  );
}
