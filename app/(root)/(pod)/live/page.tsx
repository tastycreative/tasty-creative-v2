"use client";

import dynamic from "next/dynamic";

const LiveFlyer = dynamic(
  () => import("@/components/pod-new/features/apps/LiveFlyer"),
  { ssr: false }
);

export default function LivePage() {
  return <LiveFlyer />;
}
