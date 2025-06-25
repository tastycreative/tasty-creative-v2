
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Zap } from 'lucide-react';

interface BestScript {
  title: string;
  totalBuy?: string;
  totalSend?: number;
}

interface BestScriptsProps {
  bestScripts: {
    bestSeller: BestScript[];
    topSent: BestScript[];
  };
  selectedModel: string;
}

export const BestScripts = ({ bestScripts, selectedModel }: BestScriptsProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border-amber-800/30 backdrop-blur-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-white flex items-center justify-center gap-3">
            <TrendingUp className="w-6 h-6 text-amber-400" />
            Best Seller Scripts
            <TrendingUp className="w-6 h-6 text-amber-400" />
          </CardTitle>
          {selectedModel && (
            <p className="text-center text-amber-200 text-sm">
              for {selectedModel}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {bestScripts.bestSeller.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No data available for the selected filters
            </div>
          ) : (
            bestScripts.bestSeller.map((script, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg border border-amber-800/20 hover:border-amber-600/40 transition-all duration-200"
              >
                <span className="text-white font-medium">
                  {script.title}
                </span>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                  {script.totalBuy}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border-blue-800/30 backdrop-blur-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-white flex items-center justify-center gap-3">
            <Zap className="w-6 h-6 text-blue-400" />
            Top Sent Scripts
            <Zap className="w-6 h-6 text-blue-400" />
          </CardTitle>
          {selectedModel && (
            <p className="text-center text-blue-200 text-sm">
              for {selectedModel}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {bestScripts.topSent.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No data available for the selected filters
            </div>
          ) : (
            bestScripts.topSent.map((script, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg border border-blue-800/20 hover:border-blue-600/40 transition-all duration-200"
              >
                <span className="text-white font-medium">
                  {script.title}
                </span>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
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
