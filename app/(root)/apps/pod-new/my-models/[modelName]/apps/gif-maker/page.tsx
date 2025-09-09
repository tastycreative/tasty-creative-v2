"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";

const GifMaker3 = dynamic(() => import("@/components/gif-maker-3/GifMaker3"), {
  loading: () => (
    <div className="bg-slate-900/70 border border-white/10 rounded-lg p-6">
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
        <span className="text-slate-200">Loading GIF Maker...</span>
      </div>
    </div>
  ),
  ssr: false,
});

interface GifMakerPageProps {
  params: Promise<{
    modelName: string;
  }>;
}

export default async function GifMakerPage({ params }: GifMakerPageProps) {
  const { modelName } = await params;

  return (
    <Suspense
      fallback={
        <div className="bg-slate-900/70 border border-white/10 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
            <span className="text-slate-200">Loading GIF Maker for {decodeURIComponent(modelName)}...</span>
          </div>
        </div>
      }
    >
      <GifMaker3 />
    </Suspense>
  );
}

