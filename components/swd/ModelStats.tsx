
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileText, Hash, Brain } from 'lucide-react';

interface ModelData {
  creator: string;
  totalSets: number;
  totalScripts: number;
  personalityType: string;
  commonTerms: string;
  commonEmojis: string;
  restrictedTerms: string;
}

interface ModelStatsProps {
  modelData: ModelData;
  selectedModel: string;
}

export const ModelStats = ({ modelData, selectedModel }: ModelStatsProps) => {
  return (
    <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/5 to-purple-900/5"></div>
      <CardHeader className="relative border-b border-gray-800">
        <CardTitle className="text-white text-2xl flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          {selectedModel}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative p-0">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y divide-gray-800">
          <div className="p-6 space-y-2">
            <div className="flex items-center gap-2 text-gray-400">
              <FileText className="w-4 h-4" />
              <span className="text-sm">Total Sets</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {modelData.totalSets}
            </p>
          </div>
          <div className="p-6 space-y-2">
            <div className="flex items-center gap-2 text-gray-400">
              <Hash className="w-4 h-4" />
              <span className="text-sm">Total Scripts</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {modelData.totalScripts}
            </p>
          </div>
          <div className="p-6 space-y-2">
            <div className="flex items-center gap-2 text-gray-400">
              <Brain className="w-4 h-4" />
              <span className="text-sm">Personality</span>
            </div>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              {modelData.personalityType}
            </Badge>
          </div>
          <div className="p-6 space-y-2">
            <div className="text-gray-400 text-sm mb-1">Common Terms</div>
            <p className="text-white text-sm">
              {modelData.commonTerms}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-y divide-gray-800">
          <div className="p-6 space-y-2">
            <div className="text-gray-400 text-sm">Common Emojis</div>
            <p className="text-2xl">{modelData.commonEmojis}</p>
          </div>
          <div className="p-6 space-y-2 md:col-span-2">
            <div className="text-gray-400 text-sm">Restricted Terms</div>
            <p className="text-white text-sm">
              {modelData.restrictedTerms || "None"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
