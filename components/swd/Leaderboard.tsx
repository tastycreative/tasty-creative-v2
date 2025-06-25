
"use client";

import React from "react";
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
import { Trophy, Crown, Medal, Award, Star, Calendar } from 'lucide-react';

interface LeaderboardEntry {
  creator: string;
  amount: string | number;
  rank: number;
}

interface LeaderboardData {
  totalSend: LeaderboardEntry[];
  totalBuy: LeaderboardEntry[];
  zeroSet: string[];
  zeroScript: string[];
  highestSet: LeaderboardEntry[];
  lowestSet: LeaderboardEntry[];
  highestScript: LeaderboardEntry[];
  lowestScript: LeaderboardEntry[];
}

interface LeaderboardProps {
  leaderboard: LeaderboardData;
  selectedMonth: string;
  onMonthChange: (value: string) => void;
  availableMonths: string[];
}

export const Leaderboard = ({ leaderboard, selectedMonth, onMonthChange, availableMonths }: LeaderboardProps) => {
  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 1) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 2) return <Award className="w-5 h-5 text-amber-600" />;
    return <Star className="w-4 h-4 text-purple-400" />;
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-xl overflow-hidden">
      <CardHeader className="text-center border-b border-gray-800 bg-gradient-to-r from-purple-900/20 via-pink-900/20 to-purple-900/20">
        <CardTitle className="text-3xl text-white flex items-center justify-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-400" />
          LEADERBOARD
          <Trophy className="w-8 h-8 text-yellow-400" />
        </CardTitle>

        <div className="mt-4 flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Filter by Month:</span>
          </div>
          <Select value={selectedMonth} onValueChange={onMonthChange}>
            <SelectTrigger className="w-48 bg-gray-800/50 border-gray-700 text-white hover:bg-gray-800/70 transition-all duration-200">
              <SelectValue placeholder="All months" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800">
              <SelectItem
                value="all"
                className="text-white hover:bg-gray-800 focus:bg-gray-800"
              >
                All Months
              </SelectItem>
              {availableMonths.map((month) => (
                <SelectItem
                  key={month}
                  value={month}
                  className="text-white hover:bg-gray-800 focus:bg-gray-800"
                >
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-gray-400 mt-2">
          {selectedMonth !== "all"
            ? `${selectedMonth} Rankings`
            : "Overall Rankings"}
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white text-center flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              TOTAL SEND
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            </h3>
            <div className="space-y-2">
              {leaderboard.totalSend.map((entry, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-purple-600/50 transition-all duration-200 ${
                    entry.rank === 0
                      ? "border-yellow-500/50 bg-yellow-900/10"
                      : ""
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getRankIcon(entry.rank)}
                  </div>
                  <span className="flex-grow text-white font-medium">
                    {entry.creator}
                  </span>
                  <span
                    className={`font-bold text-lg ${
                      entry.rank === 0 ? "text-yellow-400" : "text-gray-300"
                    }`}
                  >
                    {typeof entry.amount === "number"
                      ? entry.amount.toLocaleString()
                      : entry.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white text-center flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              TOTAL BUY
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </h3>
            <div className="space-y-2">
              {leaderboard.totalBuy.map((entry, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-green-600/50 transition-all duration-200 ${
                    entry.rank === 0
                      ? "border-yellow-500/50 bg-yellow-900/10"
                      : ""
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getRankIcon(entry.rank)}
                  </div>
                  <span className="flex-grow text-white font-medium">
                    {entry.creator}
                  </span>
                  <span
                    className={`font-bold text-lg ${
                      entry.rank === 0 ? "text-yellow-400" : "text-gray-300"
                    }`}
                  >
                    {entry.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Separator className="bg-gray-800" />

        <div className="grid md:grid-cols-4 gap-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-white text-sm">Highest Set</h4>
            <div className="space-y-2">
              {leaderboard.highestSet.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="text-purple-400">{entry.rank + 1}.</span>
                  <span className="text-gray-300 truncate">
                    {entry.creator}
                  </span>
                  <span className="text-white ml-auto">{entry.amount}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-white text-sm">Lowest Set</h4>
            <div className="space-y-2">
              {leaderboard.lowestSet.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="text-purple-400">{entry.rank + 1}.</span>
                  <span className="text-gray-300 truncate">
                    {entry.creator}
                  </span>
                  <span className="text-white ml-auto">{entry.amount}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-white text-sm">Highest Script</h4>
            <div className="space-y-2">
              {leaderboard.highestScript.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="text-purple-400">{entry.rank + 1}.</span>
                  <span className="text-gray-300 truncate">
                    {entry.creator}
                  </span>
                  <span className="text-white ml-auto">{entry.amount}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-white text-sm">Lowest Script</h4>
            <div className="space-y-2">
              {leaderboard.lowestScript.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="text-purple-400">{entry.rank + 1}.</span>
                  <span className="text-gray-300 truncate">
                    {entry.creator}
                  </span>
                  <span className="text-white ml-auto">{entry.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Card className="bg-red-900/10 border-red-800/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-red-400 text-sm">
                Zero Set Creators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {leaderboard.zeroSet.length === 0 ? (
                  <span className="text-gray-400 text-sm">
                    No creators with zero sets
                  </span>
                ) : (
                  leaderboard.zeroSet.map((creator, index) => (
                    <Badge
                      key={index}
                      className="bg-red-900/20 text-red-300 border-red-800/30"
                    >
                      {creator}
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-900/10 border-orange-800/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-orange-400 text-sm">
                Zero Script Creators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {leaderboard.zeroScript.length === 0 ? (
                  <span className="text-gray-400 text-sm">
                    No creators with zero scripts
                  </span>
                ) : (
                  leaderboard.zeroScript.map((creator, index) => (
                    <Badge
                      key={index}
                      className="bg-orange-900/20 text-orange-300 border-orange-800/30"
                    >
                      {creator}
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};
