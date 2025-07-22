"use client";

import { useParams } from "next/navigation";
import ModelAssetsTab from "@/components/models/ModelAssetTabs";

export default function ModelAssetsPage() {
  const params = useParams();
  let modelName = params ? decodeURIComponent(params.modelName as string) : "";
  modelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);

  return (
    <div className="p-6 bg-white/50">
      <ModelAssetsTab modelName={modelName} />
    </div>
  );
}
