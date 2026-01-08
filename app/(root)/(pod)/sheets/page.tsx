"use client";

import dynamic from "next/dynamic";

const SheetsIntegration = dynamic(
  () => import("@/components/SheetsIntegration"),
  {
    loading: () => (
      <div className="bg-slate-900/70 border border-white/10 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
          <span className="text-slate-200">Loading sheets integration...</span>
        </div>
      </div>
    ),
    ssr: false,
  }
);

export default function PodNewSheetsPage() {
  return <SheetsIntegration />;
}
