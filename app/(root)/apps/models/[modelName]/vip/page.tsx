
"use client";

import VIPFlyer from "@/components/VIPFlyer";
import { useParams } from "next/navigation";
import { ArrowLeft, Crown } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ModelVIPPage() {
  const params = useParams();
  const router = useRouter();
  const modelName = decodeURIComponent(params.modelName as string);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <Crown className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">VIP Flyers</h2>
            <p className="text-sm text-gray-400">for {modelName}</p>
          </div>
        </div>
      </div>

      {/* VIP Flyer Component */}
      <VIPFlyer modelName={modelName} />
    </div>
  );
}
