"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import GifMakerErrorBoundary from "@/components/gif-maker-3/GifMakerErrorBoundary";

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

export default function GifMakerPage({ params }: GifMakerPageProps) {
  const [modelName, setModelName] = React.useState<string>("");

  React.useEffect(() => {
    params.then(({ modelName }) => {
      setModelName(modelName);
    });
  }, [params]);

  if (!modelName) {
    return (
      <div className="bg-slate-900/70 border border-white/10 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
          <span className="text-slate-200">Loading GIF Maker...</span>
        </div>
      </div>
    );
  }

  return (
    <GifMakerErrorBoundary>
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
    </GifMakerErrorBoundary>
  );
}