"use client";

import dynamic from "next/dynamic";

const VaultPage = dynamic(
  () => import("@/components/VaultPage"),
  { ssr: false }
);

export default function Page() {
  return (
    <div>
      <title>Vault | Tasty Creative</title>
      <VaultPage />
    </div>
  );
}
