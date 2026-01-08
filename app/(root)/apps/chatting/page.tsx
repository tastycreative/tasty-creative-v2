"use client";

import dynamic from "next/dynamic";

const ChattingPage = dynamic(
  () => import("@/components/ChattingPage"),
  { ssr: false }
);

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50">
      <title>Chatting | Tasty Creative</title>
      <ChattingPage />
    </div>
  );
}
