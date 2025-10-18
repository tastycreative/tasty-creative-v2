"use client";

import React from "react";
import { useParams } from "next/navigation";
import LiveFlyer from "@/components/pod-new/features/apps/LiveFlyer";

export default function LivePage() {
  const params = useParams();
  const modelName = params?.modelName as string;
  const decodedName = modelName ? decodeURIComponent(modelName) : "";

  return (
    <div>
      <LiveFlyer modelName={decodedName} />
    </div>
  );
}