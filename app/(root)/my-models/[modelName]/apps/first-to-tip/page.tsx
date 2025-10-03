"use client";

import React from "react";
import { useParams } from "next/navigation";
import FTTFlyer from "@/components/pod-new/features/apps/FTTPage";

export default function FirstToTipPage() {
  const params = useParams();
  const modelName = params?.modelName as string;
  const decodedName = modelName ? decodeURIComponent(modelName) : "";

  return (
    <div>
      <FTTFlyer modelName={decodedName} />
    </div>
  );
}
