"use client";

import { useParams } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamically import the component to avoid SSR issues
const ModelContentGalleryTab = dynamic(
  () => import("@/components/models/tabs/ModelContentGalleryTab"),
  { ssr: false }
);

export default function ModelContentGalleryPage() {
  const params = useParams();
  let modelName = params ? decodeURIComponent(params.modelName as string) : "";
  modelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);

  return (
    <div className="p-6">
      <ModelContentGalleryTab modelName={modelName} />
    </div>
  );
}
