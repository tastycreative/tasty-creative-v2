
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, TrendingUp, Award, Trophy, Star, Zap, Sparkles, Crown, Medal, Users, FileText, Brain, Hash, Calendar, Plus, CheckCircle, PenTool } from 'lucide-react'
import { Button } from "../ui/button";
import { useSession } from "next-auth/react";
import { QuickDataEntry } from "./QuickDataEntry";
import { RequestForm } from "./RequestForm";
import { BestScripts } from "./BestScripts";
import { ModelStats } from "./ModelStats";
import { Leaderboard } from "./Leaderboard";

interface ModelData {
  creator: string;
  totalSets: number;
  totalScripts: number;
  personalityType: string;
  commonTerms: string;
  commonEmojis: string;
  restrictedTerms: string;
}

interface SendBuyData {
  creator: string;
  month: string;
  dateUpdated: string;
  scriptTitle: string;
  scriptLink: string;
  totalSend: number;
  totalBuy: number;
}

interface ApiResponse {
  modelData: ModelData[];
  sendBuyData: SendBuyData[];
  availableCreators: string[];
  availableMonths: string[];
}

export const SWDDashboard = () => {
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuickDataSuccess, setShowQuickDataSuccess] = useState(false);
  const [showRequestSuccess, setShowRequestSuccess] = useState(false);

  const { data: session } = useSession();
  const userRole = session?.user?.role || "GUEST";

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/google/swd-data");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch script data");
      }

      const data: ApiResponse = await response.json();
      setApiData(data);

      if (!selectedModel && data.modelData && data.modelData.length > 0) {
        setSelectedModel(data.modelData[0].creator);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const { bestScripts, leaderboard } = useMemo(() => {
    if (!apiData) {
      return {
        bestScripts: { bestSeller: [], topSent: [] },
        leaderboard: {
          totalSend: [],
          totalBuy: [],
          zeroSet: [],
          zeroScript: [],
          highestSet: [],
          lowestSet: [],
          highestScript: [],
          lowestScript: [],
        },
      };
    }

    const monthFilteredData =
      selectedMonth !== "all"
        ? apiData.sendBuyData.filter(
            (item) => item.month.toLowerCase() === selectedMonth.toLowerCase()
          )
        : apiData.sendBuyData;

    const creatorFilteredData = selectedModel
      ? apiData.sendBuyData.filter(
          (item) => item.creator.toLowerCase() === selectedModel.toLowerCase()
        )
      : apiData.sendBuyData;

    const bestScripts = {
      bestSeller: creatorFilteredData
        .sort((a, b) => b.totalBuy - a.totalBuy)
        .slice(0, 3)
        .map((item) => ({
          title: item.scriptTitle,
          totalBuy: `${item.totalBuy.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        })),
      topSent: creatorFilteredData
        .sort((a, b) => b.totalSend - a.totalSend)
        .slice(0, 3)
        .map((item) => ({
          title: item.scriptTitle,
          totalSend: item.totalSend,
        })),
    };

    const creatorStats: Record<string, any> = {};

    apiData.modelData.forEach((model) => {
      creatorStats[model.creator] = {
        creator: model.creator,
        totalSend: 0,
        totalBuy: 0,
        totalSets: model.totalSets,
        totalScripts: model.totalScripts,
      };
    });

    monthFilteredData.forEach((item) => {
      if (!creatorStats[item.creator]) {
        creatorStats[item.creator] = {
          creator: item.creator,
          totalSend: 0,
          totalBuy: 0,
          totalSets: 0,
          totalScripts: 0,
        };
      }
      creatorStats[item.creator].totalSend += item.totalSend;
      creatorStats[item.creator].totalBuy += item.totalBuy;
    });

    const creatorStatsArray = Object.values(creatorStats);

    const leaderboard = {
      totalSend: creatorStatsArray
        .sort((a: any, b: any) => b.totalSend - a.totalSend)
        .slice(0, 5)
        .map((creator: any, index) => ({
          creator: creator.creator,
          amount: creator.totalSend,
          rank: index,
        })),
      totalBuy: creatorStatsArray
        .sort((a: any, b: any) => b.totalBuy - a.totalBuy)
        .slice(0, 5)
        .map((creator: any, index) => ({
          creator: creator.creator,
          amount: `$${creator.totalBuy.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
          rank: index,
        })),
      zeroSet: creatorStatsArray
        .filter((creator: any) => creator.totalSets === 0)
        .map((creator: any) => creator.creator),
      zeroScript: creatorStatsArray
        .filter((creator: any) => creator.totalScripts === 0)
        .map((creator: any) => creator.creator),
      highestSet: creatorStatsArray
        .filter((creator: any) => creator.totalSets > 0)
        .sort((a: any, b: any) => b.totalSets - a.totalSets)
        .slice(0, 5)
        .map((creator: any, index) => ({
          creator: creator.creator,
          amount: creator.totalSets,
          rank: index,
        })),
      lowestSet: creatorStatsArray
        .filter((creator: any) => creator.totalSets > 0)
        .sort((a: any, b: any) => a.totalSets - b.totalSets)
        .slice(0, 5)
        .map((creator: any, index) => ({
          creator: creator.creator,
          amount: creator.totalSets,
          rank: index,
        })),
      highestScript: creatorStatsArray
        .filter((creator: any) => creator.totalScripts > 0)
        .sort((a: any, b: any) => b.totalScripts - a.totalScripts)
        .slice(0, 5)
        .map((creator: any, index) => ({
          creator: creator.creator,
          amount: creator.totalScripts,
          rank: index,
        })),
      lowestScript: creatorStatsArray
        .filter((creator: any) => creator.totalScripts > 0)
        .sort((a: any, b: any) => a.totalScripts - b.totalScripts)
        .slice(0, 5)
        .map((creator: any, index) => ({
          creator: creator.creator,
          amount: creator.totalScripts,
          rank: index,
        })),
    };

    return { bestScripts, leaderboard };
  }, [apiData, selectedModel, selectedMonth]);

  const currentModelData = apiData?.modelData.find(
    (model) => model.creator === selectedModel
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative">
          <div className="absolute inset-0 blur-xl bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-pulse"></div>
          <Loader2 className="relative w-16 h-16 text-white animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-white">Loading Script Data...</h2>
        <p className="text-gray-400">Fetching your dashboard information</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-red-400 mb-2">Error Loading Data</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchAllData}
            className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2">
              <PenTool className="w-4 h-4" />
              Script Request
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="bg-gradient-to-r from-purple-900/20 via-pink-900/20 to-purple-900/20 border-b border-gray-800 px-6 py-4">
              <DialogTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                Submit Script Request
              </DialogTitle>
            </DialogHeader>
            <RequestForm onRequestSubmitted={fetchAllData} onSuccess={() => setShowRequestSuccess(true)} />
          </DialogContent>
        </Dialog>

        {(userRole === "SWD" || userRole === "ADMIN") && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Send+Buy Input Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800 max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="bg-gradient-to-r from-green-900/20 via-blue-900/20 to-purple-900/20 border-b border-gray-800 px-6 py-4">
                <DialogTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-400" />
                  Quick Data Entry - Send+Buy Input
                </DialogTitle>
              </DialogHeader>
              <QuickDataEntry onDataSubmitted={fetchAllData} onSuccess={() => setShowQuickDataSuccess(true)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Model Selection Card */}
      <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-pink-900/10"></div>
        <CardHeader className="relative">
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Model Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Select Model</label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-full max-w-md bg-gray-800/50 border-gray-700 text-white hover:bg-gray-800/70 transition-all duration-200">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800">
                {apiData?.availableCreators.map((creator) => (
                  <SelectItem
                    key={creator}
                    value={creator}
                    className="text-white hover:bg-gray-800 focus:bg-gray-800"
                  >
                    {creator}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedModel && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-400">Selected creator:</span>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                {selectedModel}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model Stats */}
      {currentModelData && (
        <ModelStats modelData={currentModelData} selectedModel={selectedModel} />
      )}

      {/* Best Scripts */}
      <BestScripts bestScripts={bestScripts} selectedModel={selectedModel} />

      {/* Leaderboard */}
      <Leaderboard 
        leaderboard={leaderboard} 
        selectedMonth={selectedMonth} 
        onMonthChange={setSelectedMonth}
        availableMonths={apiData?.availableMonths || []}
      />

      {/* Success Modals */}
      <Dialog open={showQuickDataSuccess} onOpenChange={setShowQuickDataSuccess}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Success!
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-gray-300 mb-4">
              Your script data has been successfully submitted and added to the spreadsheet.
            </p>
            <Button
              onClick={() => setShowQuickDataSuccess(false)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRequestSuccess} onOpenChange={setShowRequestSuccess}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Request Submitted!
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-gray-300 mb-4">
              Your script request has been successfully submitted. We&apos;ll process it and get back to you soon.
            </p>
            <Button
              onClick={() => setShowRequestSuccess(false)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
