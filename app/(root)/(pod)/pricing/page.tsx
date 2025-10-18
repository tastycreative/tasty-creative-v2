"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { usePodData } from "@/lib/stores/podStore";

const PricingGuide = dynamic(() => import("@/components/PricingGuide"), {
  loading: () => (
    <div className="bg-slate-900/70 border border-white/10 rounded-lg p-6">
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
        <span className="text-slate-200">Loading pricing guide...</span>
      </div>
    </div>
  ),
  ssr: false,
});

export default function PodNewPricingPage() {
  const { podData } = usePodData();

  return (
    <Suspense
      fallback={
        <div className="bg-slate-900/70 border border-white/10 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
            <span className="text-slate-200">Loading pricing guide...</span>
          </div>
        </div>
      }
    >
      <PricingGuide creators={podData?.creators || []} />
    </Suspense>
  );
}
