"use client";

import { useParams } from "next/navigation";
import ModelForumTab from "@/components/models/tabs/ModelForumTab";

export default function ModelForumPage() {
  const params = useParams();
  let modelName = params ? decodeURIComponent(params.modelName as string) : "";
  modelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);

  return (
    <div className="p-6 bg-white/50">
      <ModelForumTab modelName={modelName} />
    </div>
  );
}
