"use client";

import { useParams } from "next/navigation";
import ModelAppsTab from "@/components/models/tabs/ModelAppsTab";

export default function ModelAppsPage() {
  const params = useParams();
  let modelName = params ? decodeURIComponent(params.modelName as string) : "";
  modelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);

  return (
    <div className="p-6 bg-white/50">
      <ModelAppsTab modelName={modelName} />
    </div>
  );
}
