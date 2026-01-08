"use client";

import dynamic from "next/dynamic";

const ModelsPage = dynamic(
  () => import("@/components/models/ModelPage"),
  { ssr: false }
);

export default function Page() {
  return (
    <div>
      <title>Models | Tasty Creative</title>
      <ModelsPage />
    </div>
  );
}
