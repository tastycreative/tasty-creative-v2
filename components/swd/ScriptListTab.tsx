"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  FileText,
  ExternalLink,
  Search,
  Calendar,
  TrendingUp,
  Eye,
  Filter,
  SortAsc,
  SortDesc,
} from "lucide-react";

interface GoogleDoc {
  id: string;
  name: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink: string;
  size?: string;
}

interface SendBuyScript {
  creator: string;
  month: string;
  dateUpdated: string;
  scriptTitle: string;
  scriptLink: string;
  totalSend: number;
  totalBuy: number;
}

interface CombinedScript {
  id: string;
  title: string;
  type: "drive" | "performance";
  link: string;
  modifiedTime?: string;
  createdTime?: string;
  creator?: string;
  month?: string;
  totalSend?: number;
  totalBuy?: number;
  dateUpdated?: string;
}

export const ScriptListTab = () => {
  const [scripts, setScripts] = useState<CombinedScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"title" | "date" | "performance">(
    "date"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterType, setFilterType] = useState<"all" | "drive" | "performance">(
    "all"
  );

  useEffect(() => {
    fetchAllScripts();
  }, []);

  const fetchAllScripts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both Google Drive scripts and performance data scripts
      const [driveResponse, performanceResponse] = await Promise.all([
        fetch("/api/google/list-scripts"),
        fetch("/api/google/swd-data"),
      ]);

      if (!driveResponse.ok) {
        throw new Error("Failed to fetch Google Drive scripts");
      }
      if (!performanceResponse.ok) {
        throw new Error("Failed to fetch performance data");
      }

      const driveData = await driveResponse.json();
      const performanceData = await performanceResponse.json();

      const combinedScripts: CombinedScript[] = [];

      // Add Google Drive scripts
      if (driveData.documents) {
        driveData.documents.forEach((doc: GoogleDoc) => {
          combinedScripts.push({
            id: doc.id,
            title: doc.name,
            type: "drive",
            link: doc.webViewLink,
            modifiedTime: doc.modifiedTime,
            createdTime: doc.createdTime,
          });
        });
      }

      // Add scripts from performance data (Send+Buy Input)
      if (performanceData.sendBuyData) {
        performanceData.sendBuyData.forEach((script: SendBuyScript) => {
          // Check if this script is already in the list from Google Drive
          const existingScript = combinedScripts.find(
            (s) =>
              s.title
                .toLowerCase()
                .includes(script.scriptTitle.toLowerCase()) ||
              script.scriptTitle.toLowerCase().includes(s.title.toLowerCase())
          );

          if (!existingScript) {
            // Extract document ID from Google Docs URL for unique identification
            const docIdMatch = script.scriptLink.match(
              /\/document\/d\/([a-zA-Z0-9-_]+)/
            );
            const docId = docIdMatch
              ? docIdMatch[1]
              : `perf_${Date.now()}_${Math.random()}`;

            combinedScripts.push({
              id: docId,
              title: script.scriptTitle,
              type: "performance",
              link: script.scriptLink,
              creator: script.creator,
              month: script.month,
              totalSend: script.totalSend,
              totalBuy: script.totalBuy,
              dateUpdated: script.dateUpdated,
            });
          } else {
            // Enhance existing script with performance data
            existingScript.creator = script.creator;
            existingScript.month = script.month;
            existingScript.totalSend = script.totalSend;
            existingScript.totalBuy = script.totalBuy;
            existingScript.dateUpdated = script.dateUpdated;
          }
        });
      }

      setScripts(combinedScripts);
    } catch (err) {
      console.error("Error fetching scripts:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedScripts = scripts
    .filter((script) => {
      const matchesSearch =
        script.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (script.creator &&
          script.creator.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter = filterType === "all" || script.type === filterType;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "date":
          const dateA = new Date(
            a.modifiedTime || a.dateUpdated || a.createdTime || 0
          );
          const dateB = new Date(
            b.modifiedTime || b.dateUpdated || b.createdTime || 0
          );
          comparison = dateA.getTime() - dateB.getTime();
          break;
        case "performance":
          const buyA = a.totalBuy || 0;
          const buyB = b.totalBuy || 0;
          comparison = buyA - buyB;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  const handleScriptClick = (script: CombinedScript) => {
    window.open(script.link, "_blank");
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return "N/A";
    return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading all scripts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/80 border-pink-200">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-400 mb-4">Error: {error}</p>
            <Button
              onClick={fetchAllScripts}
              variant="outline"
              className="border-pink-300"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white/80 border-pink-200 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            All Scripts
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
              {filteredAndSortedScripts.length} scripts
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Filters and Search */}
      <Card className="bg-white/80 border-pink-200 backdrop-blur-xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-4 h-4" />
                <Input
                  placeholder="Search scripts or creators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-pink-300 text-gray-900"
                />
              </div>
            </div>

            {/* Filter Type */}
            <div className="flex gap-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
                className={
                  filterType === "all" ? "bg-pink-500" : "border-pink-300"
                }
              >
                <Filter className="w-4 h-4 mr-1" />
                All
              </Button>
              <Button
                variant={filterType === "drive" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("drive")}
                className={
                  filterType === "drive" ? "bg-pink-500" : "border-pink-300"
                }
              >
                Drive
              </Button>
              <Button
                variant={filterType === "performance" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("performance")}
                className={
                  filterType === "performance"
                    ? "bg-amber-600"
                    : "border-pink-300"
                }
              >
                Performance
              </Button>
            </div>

            {/* Sort */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "title" | "date" | "performance")
                }
                className="px-3 py-2 text-sm bg-white border border-pink-300 text-gray-700 rounded"
              >
                <option value="date">Date</option>
                <option value="title">Title</option>
                <option value="performance">Performance</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="border-pink-300"
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scripts List */}
      {filteredAndSortedScripts.length === 0 ? (
        <Card className="bg-white/80 border-pink-200">
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-gray-900 font-medium mb-2">No scripts found</h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAndSortedScripts.map((script) => (
            <Card
              key={script.id}
              className="bg-white/80 border-pink-200 hover:border-pink-300 transition-all duration-200 cursor-pointer"
              onClick={() => handleScriptClick(script)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-gray-900 font-medium truncate">
                        {script.title}
                      </h3>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          script.type === "drive"
                            ? "bg-green-500/20 text-green-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {script.type === "drive" ? "Drive" : "Performance"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
                      {script.creator && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-gray-700">
                            Creator:
                          </span>
                          <span>{script.creator}</span>
                        </div>
                      )}
                      {(script.modifiedTime || script.dateUpdated) && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {formatDate(
                              script.modifiedTime || script.dateUpdated
                            )}
                          </span>
                        </div>
                      )}
                      {script.totalSend !== undefined && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-gray-700">
                            Sent:
                          </span>
                          <span>{script.totalSend.toLocaleString()}</span>
                        </div>
                      )}
                      {script.totalBuy !== undefined && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-green-400" />
                          <span className="text-green-400">
                            {formatCurrency(script.totalBuy)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-gray-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScriptClick(script);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Open
                    </Button>
                    <ExternalLink className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
