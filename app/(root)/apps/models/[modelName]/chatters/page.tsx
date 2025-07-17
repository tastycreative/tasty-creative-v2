"use client";

import { useParams } from "next/navigation";
import ModelChattersTab from "@/components/models/tabs/ModelChattersTab";

export default function ModelChattersPage() {
  const params = useParams();
  let modelName = params ? decodeURIComponent(params.modelName as string) : "";
  modelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);

  return (
    <div className="p-6">
      <ModelChattersTab modelName={modelName} />
    </div>
  );
}
