
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
    <Card className="bg-white/80 border-pink-200 backdrop-blur-xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 to-rose-50/50"></div>
      <CardHeader className="relative border-b border-pink-200">
        <CardTitle className="text-gray-900 text-2xl flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          {selectedModel}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative p-0">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y divide-pink-200">
          <div className="p-6 space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <FileText className="w-4 h-4" />
              <span className="text-sm">Total Sets</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {modelData.totalSets}
            </p>
          </div>
          <div className="p-6 space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <Hash className="w-4 h-4" />
              <span className="text-sm">Total Scripts</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {modelData.totalScripts}
            </p>
          </div>
          <div className="p-6 space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <Brain className="w-4 h-4" />
              <span className="text-sm">Personality</span>
            </div>
            <Badge className="bg-pink-100 text-pink-700 border-pink-200">
              {modelData.personalityType}
            </Badge>
          </div>
          <div className="p-6 space-y-2">
            <div className="text-gray-600 text-sm mb-1">Common Terms</div>
            <p className="text-gray-900 text-sm">
              {modelData.commonTerms}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-y divide-pink-200">
          <div className="p-6 space-y-2">
            <div className="text-gray-600 text-sm">Common Emojis</div>
            <p className="text-2xl">{modelData.commonEmojis}</p>
          </div>
          <div className="p-6 space-y-2 md:col-span-2">
            <div className="text-gray-600 text-sm">Restricted Terms</div>
            <p className="text-gray-900 text-sm">
              {modelData.restrictedTerms || "None"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
