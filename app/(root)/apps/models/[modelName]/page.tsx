"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ModelDetailsPage() {
  const params = useParams();
  const router = useRouter();
  
  const modelName = params?.modelName as string;

  useEffect(() => {
    if (modelName) {
      router.replace(`/apps/models/${modelName}/info`);
    }
  }, [modelName, router]);

  return (
    <div className="p-6">
      <div className="text-white">Redirecting...</div>
    </div>
  );
}
