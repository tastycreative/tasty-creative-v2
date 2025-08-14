"use client";

import React from "react";
import dynamic from "next/dynamic";

// Avoid SSR issues by dynamically importing the client component
const GifMaker3 = dynamic(() => import("@/components/gif-maker-3/GifMaker3"), {
  ssr: false,
});

export default function GIF3Page() {
  return <GifMaker3 />;
}
