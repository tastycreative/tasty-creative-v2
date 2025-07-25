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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Loader2,
  TrendingUp,
  Award,
  Trophy,
  Star,
  Zap,
  Sparkles,
  Crown,
  Medal,
  Users,
  FileText,
  Brain,
  Hash,
  Calendar,
  Plus,
  CheckCircle,
  PenTool,
} from "lucide-react";
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

interface SWDDashboardProps {
  onScriptClick?: (scriptLink: string) => void;
}

export const SWDDashboard = ({ onScriptClick }: SWDDashboardProps) => {
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
          scriptLink: item.scriptLink,
        })),
      topSent: creatorFilteredData
        .sort((a, b) => b.totalSend - a.totalSend)
        .slice(0, 3)
        .map((item) => ({
          title: item.scriptTitle,
          totalSend: item.totalSend,
          scriptLink: item.scriptLink,
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
          <div className="absolute inset-0 blur-xl bg-gradient-to-r from-pink-500 to-rose-500 rounded-full animate-pulse"></div>
          <Loader2 className="relative w-16 h-16 text-pink-500 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Loading Script Data...
        </h2>
        <p className="text-gray-600">Fetching your dashboard information</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Error Loading Data
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAllData}
            className="px-4 py-2 bg-red-100 border border-red-300 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
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
            <Button className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2">
              <PenTool className="w-4 h-4" />
              Script Request
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-pink-200 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50 border-b border-pink-200 px-6 py-4">
              <DialogTitle className="text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-500" />
                Submit Script Request
              </DialogTitle>
            </DialogHeader>
            <RequestForm
              onRequestSubmitted={fetchAllData}
              onSuccess={() => setShowRequestSuccess(true)}
            />
          </DialogContent>
        </Dialog>

        {(userRole === "SWD" || userRole === "ADMIN") && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Send+Buy Input Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-pink-200 max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50 border-b border-pink-200 px-6 py-4">
                <DialogTitle className="text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-pink-500" />
                  Quick Data Entry - Send+Buy Input
                </DialogTitle>
              </DialogHeader>
              <QuickDataEntry
                onDataSubmitted={fetchAllData}
                onSuccess={() => setShowQuickDataSuccess(true)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Model Selection Card */}
      <Card className="bg-white/80 border-pink-200 backdrop-blur-xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-50/50 to-rose-50/50"></div>
        <CardHeader className="relative">
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-pink-500" />
            Model Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Select Model</label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-full max-w-md bg-white border-pink-300 text-gray-900 hover:bg-pink-50 transition-all duration-200">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent className="bg-white border-pink-200">
                {apiData?.availableCreators.map((creator) => (
                  <SelectItem
                    key={creator}
                    value={creator}
                    className="text-gray-900 hover:bg-pink-50 focus:bg-pink-50"
                  >
                    {creator}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedModel && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">Selected creator:</span>
              <Badge className="bg-pink-100 text-pink-700 border-pink-200">
                {selectedModel}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model Stats */}
      {currentModelData && (
        <ModelStats
          modelData={currentModelData}
          selectedModel={selectedModel}
        />
      )}

      {/* Best Scripts */}
      <BestScripts
        bestScripts={bestScripts}
        selectedModel={selectedModel}
        onScriptClick={onScriptClick}
      />

      {/* Leaderboard */}
      <Leaderboard
        leaderboard={leaderboard}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        availableMonths={apiData?.availableMonths || []}
      />

      {/* Success Modals */}
      <Dialog
        open={showQuickDataSuccess}
        onOpenChange={setShowQuickDataSuccess}
      >
        <DialogContent className="bg-white border-pink-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Success!
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-gray-600 mb-4">
              Your script data has been successfully submitted and added to the
              spreadsheet.
            </p>
            <Button
              onClick={() => setShowQuickDataSuccess(false)}
              className="w-full bg-pink-500 hover:bg-pink-600"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRequestSuccess} onOpenChange={setShowRequestSuccess}>
        <DialogContent className="bg-white border-pink-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Request Submitted!
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-gray-600 mb-4">
              Your script request has been successfully submitted. We&apos;ll
              process it and get back to you soon.
            </p>
            <Button
              onClick={() => setShowRequestSuccess(false)}
              className="w-full bg-pink-500 hover:bg-pink-600"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
