"use client";

import React from "react";
import { useParams } from "next/navigation";
import VIPFlyer from "@/components/pod-new/features/apps/VIPFlyer";

export default function VIPPage() {
  const params = useParams();
  const modelName = params?.modelName as string;
  const decodedName = modelName ? decodeURIComponent(modelName) : "";

  return (
    <div>
      <VIPFlyer modelName={decodedName} />
    </div>
  );
}