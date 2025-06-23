
"use client";

import { useParams } from "next/navigation";
import { ReactNode } from "react";

interface ModelAppLayoutProps {
  children: ReactNode;
}

export default function ModelAppLayout({ children }: ModelAppLayoutProps) {
  const params = useParams();
  const modelName = params ? decodeURIComponent(params.modelName as string) : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            {modelName} Apps
          </h1>
          <p className="text-gray-400">
            Specialized tools and generators for {modelName}
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
