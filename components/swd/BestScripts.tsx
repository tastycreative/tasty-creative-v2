"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Zap } from "lucide-react";

interface BestScript {
  title: string;
  totalBuy?: string;
  totalSend?: number;
  scriptLink?: string;
}

interface BestScriptsProps {
  bestScripts: {
    bestSeller: BestScript[];
    topSent: BestScript[];
  };
  selectedModel: string;
  onScriptClick?: (scriptLink: string) => void;
}

export const BestScripts = ({
  bestScripts,
  selectedModel,
  onScriptClick,
}: BestScriptsProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200 backdrop-blur-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-gray-900 flex items-center justify-center gap-3">
            <TrendingUp className="w-6 h-6 text-pink-500" />
            Best Seller Scripts
            <TrendingUp className="w-6 h-6 text-pink-500" />
          </CardTitle>
          {selectedModel && (
            <p className="text-center text-pink-600 text-sm">
              for {selectedModel}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {bestScripts.bestSeller.length === 0 ? (
            <div className="text-center text-gray-600 py-8">
              No data available for the selected filters
            </div>
          ) : (
            bestScripts.bestSeller.map((script, index) => (
              <div
                key={index}
                className={`flex justify-between items-center p-3 bg-white/80 rounded-lg border border-pink-200 hover:border-pink-300 transition-all duration-200 ${
                  script.scriptLink && onScriptClick
                    ? "cursor-pointer hover:bg-pink-50 hover:scale-[1.02]"
                    : ""
                }`}
                onClick={() => {
                  if (script.scriptLink && onScriptClick) {
                    onScriptClick(script.scriptLink);
                  }
                }}
              >
                <span className="text-gray-900 font-medium">{script.title}</span>
                <Badge className="bg-pink-100 text-pink-700 border-pink-200">
                  {script.totalBuy}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200 backdrop-blur-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-gray-900 flex items-center justify-center gap-3">
            <Zap className="w-6 h-6 text-pink-500" />
            Top Sent Scripts
            <Zap className="w-6 h-6 text-pink-500" />
          </CardTitle>
          {selectedModel && (
            <p className="text-center text-pink-600 text-sm">
              for {selectedModel}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {bestScripts.topSent.length === 0 ? (
            <div className="text-center text-gray-600 py-8">
              No data available for the selected filters
            </div>
          ) : (
            bestScripts.topSent.map((script, index) => (
              <div
                key={index}
                className={`flex justify-between items-center p-3 bg-white/80 rounded-lg border border-pink-200 hover:border-pink-300 transition-all duration-200 ${
                  script.scriptLink && onScriptClick
                    ? "cursor-pointer hover:bg-pink-50 hover:scale-[1.02]"
                    : ""
                }`}
                onClick={() => {
                  if (script.scriptLink && onScriptClick) {
                    onScriptClick(script.scriptLink);
                  }
                }}
              >
                <span className="text-gray-900 font-medium">{script.title}</span>
                <Badge className="bg-pink-100 text-pink-700 border-pink-200">
                  {script.totalSend?.toLocaleString() || 0}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
