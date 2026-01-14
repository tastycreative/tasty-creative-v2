"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import GifMakerErrorBoundary from "@/components/gif-maker-3/GifMakerErrorBoundary";

// Loading component with gallery theme
const LoadingState = ({ message = "Loading GIF Maker..." }: { message?: string }) => (
  <div className="relative overflow-hidden bg-white/70 dark:bg-[#121216] border border-pink-200/60 dark:border-pink-500/20 rounded-2xl p-8">
    {/* Background Pattern */}
    <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
    </div>
    {/* Decorative Circles */}
    <div className="absolute -top-8 -right-8 w-24 h-24 bg-pink-500/10 rounded-full opacity-50 blur-2xl"></div>
    <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-purple-500/10 rounded-full opacity-50 blur-2xl"></div>

    <div className="relative flex items-center justify-center space-x-4">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-pink-500 border-t-transparent"></div>
      <span className="text-gray-700 dark:text-gray-200 font-medium">{message}</span>
    </div>
  </div>
);

const GifMaker3 = dynamic(() => import("@/components/gif-maker-3/GifMaker3"), {
  loading: () => <LoadingState />,
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
    return <LoadingState />;
  }

  return (
    <GifMakerErrorBoundary>
      <Suspense fallback={<LoadingState message={`Loading GIF Maker for ${decodeURIComponent(modelName)}...`} />}>
        <GifMaker3 />
      </Suspense>
    </GifMakerErrorBoundary>
  );
}