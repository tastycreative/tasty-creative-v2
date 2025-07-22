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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50 flex items-center justify-center">
      <div className="text-gray-900 text-xl font-semibold">Redirecting...</div>
    </div>
  );
}
