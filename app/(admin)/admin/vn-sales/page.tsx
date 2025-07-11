/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Mic,
  FileAudio,
  Star,
  Activity,
  Calendar,
  Eye,
  User,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Bell,
  Zap,
  Target,
  Award,
  AlertTriangle,
  Info,
  Download,
  Play,
  Pause,
  Settings,
  Timer,
  Flame,
  TrendingUpIcon,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import {
  API_KEY_PROFILES,
  getVoicesForProfile,
} from "@/app/services/elevenlabs-implementation";

interface VoiceHistoryItem {
  history_item_id: string;
  text: string;
  date_unix: number;
  voice_name: string;
}

interface SaleRecord {
  id: string;
  model: string;
  voiceNote: string;
  sale: number;
  soldDate: string;
  status: string;
  generatedDate: string;
  originalHistoryId?: string;
  submittedBy?: string;
  source?: string;
}

interface EnhancedAccountStats {
  accountId: string;
  accountName: string;
  totalGenerated: number;
  generatedToday: number;
  generatedYesterday: number;
  generatedThisWeek: number;
  lastGenerationDate?: string;
  avgDailyGeneration: number;
  velocity: "high" | "medium" | "low";
  trend: "up" | "down" | "stable";
  status: "active" | "warning" | "inactive";
  lastActivityHours: number;
  recentActivity: Array<{ date: string; count: number }>;
}

interface Alert {
  type: "success" | "warning" | "info" | "error";
  title: string;
  message: string;
  account: string;
}

export default function VNSalesPage() {
  const [selectedApiProfile, setSelectedApiProfile] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [selectedVoiceNote, setSelectedVoiceNote] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [voiceHistory, setVoiceHistory] = useState<VoiceHistoryItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [vnStats, setVnStats] = useState<any>(null);
  const [voiceStats, setVoiceStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [accountStats, setAccountStats] = useState<any>(null);

  // Enhanced states
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [showInsights, setShowInsights] = useState(true);
  const [isCached, setIsCached] = useState(false);
  const [cacheAge, setCacheAge] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Sales table states
  const [recentSales, setRecentSales] = useState<SaleRecord[]>([]);
  const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set());
  const [salesFilter, setSalesFilter] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "price" | "model">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // External sales tracking
  const [lastExternalSale, setLastExternalSale] = useState<any>(null);
  const [showExternalSaleNotification, setShowExternalSaleNotification] =
    useState(false);

  // Clear data states
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);
  const [clearStatus, setClearStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [availableVoices, setAvailableVoices] = useState<any[]>([]);

  // Enhanced loadStats function with caching and analytics
  const loadStats = useCallback(async (forceRefresh = false) => {
    setIsLoadingStats(true);
    try {
      const [vnStatsRes, voiceStatsRes] = await Promise.all([
        fetch("/api/vn-sales/stats"),
        fetch(
          `/api/elevenlabs/total-history${forceRefresh ? "?forceRefresh=true" : ""}`
        ),
      ]);

      if (vnStatsRes.ok) {
        const vnData = await vnStatsRes.json();
        setVnStats(vnData);
        if (vnData.recentSales) {
          setRecentSales(vnData.recentSales);
        }
      } else {
        console.error("Failed to load VN stats:", vnStatsRes.status);
      }

      if (voiceStatsRes.ok) {
        const voiceData = await voiceStatsRes.json();
        setVoiceStats(voiceData);
        setAccountStats(voiceData);
        setAlerts(voiceData.alerts || []);
        setInsights(voiceData.insights || null);
        setIsCached(voiceData.cached || false);
        setCacheAge(voiceData.cacheAge || 0);
        setLastRefresh(new Date());

        console.log("Enhanced Voice Stats loaded:", voiceData);
      } else {
        console.error("Failed to load voice stats:", voiceStatsRes.status);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      console.log(`🔄 Auto-refreshing data (every ${refreshInterval}s)`);
      loadStats(false); // Use cache if available
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadStats]);

  // Export functionality
  const exportData = useCallback(() => {
    if (!accountStats?.accountStats) return;

    const csvData = [
      [
        "Account Name",
        "Total Generated",
        "Today",
        "This Week",
        "Avg Daily",
        "Status",
        "Trend",
      ],
      ...accountStats.accountStats.map((acc: EnhancedAccountStats) => [
        acc.accountName,
        acc.totalGenerated,
        acc.generatedToday,
        acc.generatedThisWeek,
        acc.avgDailyGeneration,
        acc.status,
        acc.trend,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voice-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [accountStats]);

  // Utility functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case "warning":
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      case "inactive":
        return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case "down":
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      case "stable":
        return <Minus className="h-3 w-3 text-gray-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const getVelocityBadge = (velocity: string) => {
    const colors = {
      high: "bg-green-100 text-green-800 border-green-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      low: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[velocity as keyof typeof colors] || colors.low;
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  // Toggle expanded view for voice notes
  const toggleSaleExpansion = (saleId: string) => {
    setExpandedSales((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(saleId)) {
        newSet.delete(saleId);
      } else {
        newSet.add(saleId);
      }
      return newSet;
    });
  };

  // Filter and sort sales
  const filteredAndSortedSales = () => {
    let filtered = recentSales;

    if (salesFilter) {
      filtered = filtered.filter(
        (sale) =>
          sale.model.toLowerCase().includes(salesFilter.toLowerCase()) ||
          sale.voiceNote.toLowerCase().includes(salesFilter.toLowerCase()) ||
          sale.id.toLowerCase().includes(salesFilter.toLowerCase())
      );
    }

    filtered = [...filtered].sort((a, b) => {
      let compareValue = 0;
      switch (sortBy) {
        case "date":
          compareValue =
            new Date(a.soldDate).getTime() - new Date(b.soldDate).getTime();
          break;
        case "price":
          compareValue = a.sale - b.sale;
          break;
        case "model":
          compareValue = a.model.localeCompare(b.model);
          break;
      }
      return sortOrder === "desc" ? -compareValue : compareValue;
    });

    return filtered;
  };

  // Clear all sales data
  const clearAllSalesData = async () => {
    try {
      const response = await fetch("/api/vn-sales/clear-all", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        await loadStats();
        return {
          success: true,
          message: "All sales data cleared successfully!",
        };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to clear sales data");
      }
    } catch (error) {
      console.error("Error clearing sales data:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to clear sales data",
      };
    }
  };

  const handleClearAllData = async () => {
    setIsClearingData(true);
    setClearStatus(null);
    const result = await clearAllSalesData();
    if (result.success) {
      setClearStatus({ type: "success", message: result.message });
      setShowClearConfirmation(false);
      setTimeout(() => setClearStatus(null), 5000);
    } else {
      setClearStatus({ type: "error", message: result.message });
    }
    setIsClearingData(false);
  };

  // Initialize and load data
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    const loadVoices = async () => {
      if (selectedApiProfile) {
        const profileVoices = getVoicesForProfile(selectedApiProfile);
        setAvailableVoices(profileVoices);
        setSelectedVoice(profileVoices[0]?.voiceId || "");
      } else {
        setAvailableVoices([]);
        setSelectedVoice("");
      }
    };
    loadVoices();
  }, [selectedApiProfile]);

  useEffect(() => {
    loadVoiceHistory();
  }, [selectedApiProfile, selectedVoice]);

  useEffect(() => {
    setSelectedVoiceNote("");
  }, [selectedVoice]);

  // Load voice history
  const loadVoiceHistory = async () => {
    if (!selectedApiProfile || !selectedVoice) return;

    try {
      setIsLoadingHistory(true);
      const response = await fetch("/api/elevenlabs/fetch-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKeyProfileKey: selectedApiProfile,
          voiceId: selectedVoice,
          pageSize: 100,
          pageIndex: 1,
          forceRefresh: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setVoiceHistory(data.items || []);
      } else {
        console.error("Failed to fetch voice history");
      }
    } catch (error) {
      console.error("Error loading voice history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Submit sale
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !selectedApiProfile ||
      !selectedVoice ||
      !selectedVoiceNote ||
      !salePrice
    ) {
      setSubmitStatus({
        type: "error",
        message: "Please fill in all required fields",
      });
      return;
    }

    const selectedVoiceData = voiceHistory.find(
      (item) => item.history_item_id === selectedVoiceNote
    );
    if (!selectedVoiceData) {
      setSubmitStatus({
        type: "error",
        message: "Selected voice note not found",
      });
      return;
    }

    const selectedVoiceInfo = availableVoices.find(
      (v) => v.voiceId === selectedVoice
    );
    const modelName = selectedVoiceInfo?.name || "Unknown Model";

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const uniqueId = `${selectedVoiceData.history_item_id}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

      const response = await fetch("/api/vn-sales/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: uniqueId,
          model: modelName,
          voiceNote: selectedVoiceData.text,
          sale: parseFloat(salePrice),
          soldDate: new Date().toISOString(),
          status: "Completed",
          generatedDate: new Date(
            selectedVoiceData.date_unix * 1000
          ).toISOString(),
          originalHistoryId: selectedVoiceData.history_item_id,
          source: "VNSalesPage",
        }),
      });

      if (response.ok) {
        setSubmitStatus({
          type: "success",
          message: `Voice note sale of $${parseFloat(salePrice).toFixed(2)} submitted successfully! 🎉`,
        });

        // Reset form
        setSelectedApiProfile("");
        setSelectedVoice("");
        setSelectedVoiceNote("");
        setSalePrice("");

        await loadStats();
        setTimeout(() => setSubmitStatus(null), 5000);
      } else {
        const errorData = await response.json();
        if (response.status === 409) {
          setSubmitStatus({
            type: "error",
            message:
              "This sale has already been recorded. Try selecting a different voice note.",
          });
        } else {
          throw new Error(
            errorData.error || "Failed to submit voice note sale"
          );
        }
      }
    } catch (error) {
      console.error("Sale submission error:", error);
      setSubmitStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to submit voice note sale",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions for formatting
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const formatDateUnix = (unixTimestamp: number) => {
    return (
      new Date(unixTimestamp * 1000).toLocaleDateString() +
      " " +
      new Date(unixTimestamp * 1000).toLocaleTimeString()
    );
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  // Listen for external sales
  useEffect(() => {
    const handleExternalSale = (event: CustomEvent) => {
      console.log("🎉 External sale detected:", event.detail);
      setLastExternalSale(event.detail);
      setShowExternalSaleNotification(true);
      loadStats();
      setTimeout(() => setShowExternalSaleNotification(false), 5000);
    };

    window.addEventListener(
      "vnSaleSubmitted",
      handleExternalSale as EventListener
    );
    return () =>
      window.removeEventListener(
        "vnSaleSubmitted",
        handleExternalSale as EventListener
      );
  }, [loadStats]);

  // Confirmation Dialog
  const ClearConfirmationDialog = () => {
    if (!showClearConfirmation) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">
              Clear All Sales Data
            </h3>
          </div>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete all voice note sales data? This
            action cannot be undone.
          </p>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowClearConfirmation(false)}
              disabled={isClearingData}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleClearAllData}
              disabled={isClearingData}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isClearingData ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Clearing...
                </>
              ) : (
                "Yes, Clear All"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // External Sale Notification
  const ExternalSaleNotification = () => {
    if (!showExternalSaleNotification || !lastExternalSale) return null;
    return (
      <div className="fixed top-4 right-4 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse border border-green-400">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <div className="font-semibold">New Sale Submitted!</div>
            <div className="text-sm opacity-90">
              ${lastExternalSale.sale} • {lastExternalSale.model} •{" "}
              {lastExternalSale.source}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gradient-to-br from-gray-50 via-white to-pink-50">
      {/* Custom styles */}
      <style jsx global>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      <ExternalSaleNotification />

      {/* Status alerts */}
      {clearStatus && (
        <Alert
          className={`${
            clearStatus.type === "success"
              ? "border-green-500 bg-green-50 text-green-800"
              : "border-red-500 bg-red-50 text-red-800"
          } mb-6`}
        >
          {clearStatus.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription
            className={
              clearStatus.type === "success" ? "text-green-700" : "text-red-700"
            }
          >
            {clearStatus.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Header */}
      <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-pink-50 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                VN Sales Tracker
              </h1>
              <Mic className="h-6 w-6 text-pink-500" />
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600">Live Updates</span>
              </div>
              {isCached && (
                <div className="flex items-center space-x-1">
                  <Timer className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-blue-600">
                    Cached ({cacheAge}s ago)
                  </span>
                </div>
              )}
            </div>
            <p className="text-gray-600">
              Advanced analytics, real-time tracking, and intelligent insights
            </p>
            {lastRefresh && (
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`${autoRefresh ? "bg-green-50 border-green-300" : ""}`}
              >
                {autoRefresh ? (
                  <Pause className="h-4 w-4 mr-1" />
                ) : (
                  <Play className="h-4 w-4 mr-1" />
                )}
                Auto-refresh
              </Button>
              {autoRefresh && (
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                  className="text-xs border rounded px-2 py-1"
                >
                  <option value={10}>10s</option>
                  <option value={30}>30s</option>
                  <option value={60}>1m</option>
                  <option value={300}>5m</option>
                </select>
              )}
            </div>
            <Button
              onClick={() => loadStats(true)}
              disabled={isLoadingStats}
              variant="outline"
              size="sm"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoadingStats ? "animate-spin" : ""}`}
              />
              {isLoadingStats ? "Refreshing..." : "Refresh"}
            </Button>
            <Button onClick={exportData} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            {recentSales.length > 0 && (
              <Button
                onClick={() => setShowClearConfirmation(true)}
                disabled={isClearingData}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Clear Data
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Bell className="h-5 w-5 mr-2 text-blue-500" />
            Smart Alerts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map((alert, index) => (
              <Alert key={index} className="border-l-4 border-l-blue-500">
                {getAlertIcon(alert.type)}
                <div>
                  <AlertDescription>
                    <span className="font-medium">{alert.title}</span>
                    <br />
                    {alert.message}
                  </AlertDescription>
                </div>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        {/* VN Sales Today */}
        <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  VN Sales Today
                </p>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {isLoadingStats ? (
                    <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                  ) : (
                    `$${vnStats?.vnSalesToday?.toFixed(2) || "0.00"}`
                  )}
                </p>
                <div className="flex items-center text-sm">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-600 font-medium">Real-time</span>
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-full group-hover:bg-green-100 transition-colors">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Voice Generated */}
        <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Total Voice Generated
                </p>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {isLoadingStats ? (
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  ) : (
                    voiceStats?.totalVoiceGenerated?.toLocaleString() || "0"
                  )}
                </p>
                <div className="flex items-center text-sm">
                  <Activity className="h-3 w-3 text-blue-500 mr-1" />
                  <span className="text-blue-600 font-medium">
                    {voiceStats?.newVoicesToday || 0} new today
                  </span>
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-full group-hover:bg-blue-100 transition-colors">
                <FileAudio className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Total Revenue
                </p>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {isLoadingStats ? (
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  ) : (
                    `$${vnStats?.totalRevenue?.toFixed(2) || "0.00"}`
                  )}
                </p>
                <div className="flex items-center text-sm">
                  <BarChart3 className="h-3 w-3 text-purple-500 mr-1" />
                  <span className="text-purple-600 font-medium">
                    From {vnStats?.salesByModel?.length || 0} models
                  </span>
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-full group-hover:bg-purple-100 transition-colors">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average VN Price */}
        <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Average VN Price
                </p>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {isLoadingStats ? (
                    <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                  ) : (
                    `$${vnStats?.averageVnPrice?.toFixed(2) || "0.00"}`
                  )}
                </p>
                <div className="flex items-center text-sm">
                  <Star className="h-3 w-3 text-orange-500 mr-1" />
                  <span className="text-orange-600 font-medium">
                    Per voice note
                  </span>
                </div>
              </div>
              <div className="bg-orange-50 p-3 rounded-full group-hover:bg-orange-100 transition-colors">
                <Star className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Generating Account */}
        <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Top Account
                </p>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {isLoadingStats ? (
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  ) : (
                    accountStats?.topAccount?.totalGenerated?.toLocaleString() ||
                    "0"
                  )}
                </p>
                <div className="flex items-center text-sm">
                  <User className="h-3 w-3 text-indigo-500 mr-1" />
                  <span className="text-indigo-600 font-medium truncate">
                    {accountStats?.topAccount?.accountName || "No data"}
                  </span>
                </div>
              </div>
              <div className="bg-indigo-50 p-3 rounded-full group-hover:bg-indigo-100 transition-colors">
                <Award className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Most Active Today */}
        <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Most Active Today
                </p>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {isLoadingStats ? (
                    <Loader2 className="w-6 h-6 animate-spin text-red-600" />
                  ) : (
                    accountStats?.mostActiveToday?.generatedToday || "0"
                  )}
                </p>
                <div className="flex items-center text-sm">
                  <Flame className="h-3 w-3 text-red-500 mr-1" />
                  <span className="text-red-600 font-medium truncate">
                    {accountStats?.mostActiveToday?.accountName ||
                      "No activity"}
                  </span>
                </div>
              </div>
              <div className="bg-red-50 p-3 rounded-full group-hover:bg-red-100 transition-colors">
                <Zap className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      {insights && showInsights && (
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 bg-white mb-8">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-pink-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900 font-bold flex items-center">
                <Target className="h-5 w-5 mr-2 text-green-500" />
                Performance Insights
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInsights(!showInsights)}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {insights.activeToday}
                </div>
                <div className="text-sm text-gray-600">Active Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {insights.highPerformers}
                </div>
                <div className="text-sm text-gray-600">High Performers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {insights.inactiveAccounts}
                </div>
                <div className="text-sm text-gray-600">Inactive Accounts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {insights.averagePerAccount}
                </div>
                <div className="text-sm text-gray-600">Avg per Account</div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">
                🎯 Smart Recommendations
              </h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p>
                  • Focus on <strong>{insights.topPerformerToday}</strong> -
                  highest activity today
                </p>
                <p>
                  • Scale up <strong>{insights.fastestGrowingAccount}</strong> -
                  fastest growing account
                </p>
                <p>
                  • Check inactive accounts - {insights.inactiveAccounts} need
                  attention
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Account Performance Breakdown */}
      {accountStats?.accountStats && accountStats.accountStats.length > 0 && (
        <Card className="border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 bg-white mb-8">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-pink-50 border-b border-gray-200">
            <CardTitle className="text-gray-900 font-bold flex items-center">
              <Activity className="h-5 w-5 mr-2 text-indigo-500" />
              Enhanced Account Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accountStats.accountStats.map(
                (account: EnhancedAccountStats, index: number) => (
                  <div
                    key={account.accountId}
                    className={`p-4 rounded-lg border transition-all duration-300 hover:shadow-md ${
                      index === 0
                        ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200"
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(account.status)}
                        {index === 0 && (
                          <Star className="h-4 w-4 text-indigo-500" />
                        )}
                        <span className="font-medium text-gray-900 text-sm">
                          {account.accountName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(account.trend)}
                        {index === 0 && (
                          <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs">
                            #1
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">
                          Total Generated:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {account.totalGenerated.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">
                          Today vs Yesterday:
                        </span>
                        <div className="flex items-center space-x-1">
                          <span className="font-medium text-green-600">
                            {account.generatedToday}
                          </span>
                          <span className="text-xs text-gray-400">vs</span>
                          <span className="font-medium text-gray-500">
                            {account.generatedYesterday}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">
                          Avg Daily:
                        </span>
                        <span className="font-medium text-blue-600">
                          {account.avgDailyGeneration}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Velocity:</span>
                        <Badge
                          className={`text-xs ${getVelocityBadge(account.velocity)}`}
                        >
                          {account.velocity.toUpperCase()}
                        </Badge>
                      </div>

                      {account.lastGenerationDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">
                            Last Activity:
                          </span>
                          <span className="text-xs text-gray-500">
                            {account.lastActivityHours < 24
                              ? `${account.lastActivityHours}h ago`
                              : account.lastGenerationDate}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            index === 0 ? "bg-indigo-500" : "bg-gray-400"
                          }`}
                          style={{
                            width:
                              accountStats.accountStats[0].totalGenerated > 0
                                ? `${(account.totalGenerated / accountStats.accountStats[0].totalGenerated) * 100}%`
                                : "0%",
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Mini chart for recent activity */}
                    {account.recentActivity &&
                      account.recentActivity.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs text-gray-600 mb-1">
                            7-day activity:
                          </div>
                          <div className="flex items-end space-x-1 h-6">
                            {account.recentActivity.map((day, i) => (
                              <div
                                key={i}
                                className="flex-1 bg-blue-200 rounded-sm"
                                style={{
                                  height: `${Math.max(10, (day.count / Math.max(...account.recentActivity.map((d) => d.count))) * 100)}%`,
                                }}
                                title={`${day.date}: ${day.count} voices`}
                              ></div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )
              )}
            </div>

            {/* Enhanced Summary */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-gray-900">
                    {accountStats.accountStats.length}
                  </div>
                  <div className="text-gray-500">Total Accounts</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-green-600">
                    {
                      accountStats.accountStats.filter(
                        (acc: any) => acc.generatedToday > 0
                      ).length
                    }
                  </div>
                  <div className="text-gray-500">Active Today</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-blue-600">
                    {
                      accountStats.accountStats.filter(
                        (acc: any) => acc.velocity === "high"
                      ).length
                    }
                  </div>
                  <div className="text-gray-500">High Velocity</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-red-600">
                    {
                      accountStats.accountStats.filter(
                        (acc: any) => acc.status === "inactive"
                      ).length
                    }
                  </div>
                  <div className="text-gray-500">Need Attention</div>
                </div>
              </div>
              <div className="text-xs text-gray-400 text-center mt-2">
                Last updated:{" "}
                {accountStats.lastUpdated
                  ? new Date(accountStats.lastUpdated).toLocaleTimeString()
                  : "Unknown"}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voice Note Sale Submission Form */}
      <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 bg-white">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-pink-50 border-b border-gray-200">
          <CardTitle className="text-gray-900 font-bold flex items-center">
            <Mic className="h-5 w-5 mr-2 text-pink-500" />
            Submit Voice Note Sale
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* API Profile Selection */}
            <div className="space-y-2">
              <Label
                htmlFor="apiProfile"
                className="text-sm font-medium text-gray-700"
              >
                Select API Profile
              </Label>
              <Select
                value={selectedApiProfile}
                onValueChange={setSelectedApiProfile}
              >
                <SelectTrigger className="w-full bg-white border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all">
                  <SelectValue placeholder="Choose an API profile" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  {Object.entries(API_KEY_PROFILES).map(([key, profile]) => (
                    <SelectItem
                      key={key}
                      value={key}
                      className="hover:bg-gray-50"
                    >
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Voice Selection */}
            <div className="space-y-2">
              <Label
                htmlFor="voice-selection"
                className="text-sm font-medium text-gray-700"
              >
                Select Voice ({availableVoices.length} available)
              </Label>
              <Select
                value={selectedVoice}
                onValueChange={setSelectedVoice}
                disabled={availableVoices.length === 0}
              >
                <SelectTrigger className="w-full bg-white border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all disabled:bg-gray-50">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300 max-h-72">
                  {availableVoices.map((voice) => (
                    <SelectItem
                      key={voice.voiceId}
                      value={voice.voiceId}
                      className="hover:bg-gray-50"
                    >
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Voice Note Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="voiceNote"
                  className="text-sm font-medium text-gray-700"
                >
                  Select Voice Note
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadVoiceHistory}
                  disabled={isLoadingHistory}
                  className="text-gray-600 hover:text-gray-800 border-gray-300 hover:border-pink-300 hover:bg-pink-50 transition-all"
                >
                  {isLoadingHistory ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh History
                    </>
                  )}
                </Button>
              </div>
              <Select
                value={selectedVoiceNote}
                onValueChange={setSelectedVoiceNote}
                disabled={!selectedVoice || !selectedApiProfile}
              >
                <SelectTrigger className="w-full bg-white border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all disabled:bg-gray-50">
                  <SelectValue
                    placeholder={
                      !selectedApiProfile
                        ? "Select an API profile first"
                        : !selectedVoice
                          ? "Select a voice first"
                          : "Choose a voice note from history"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-60 bg-white border-gray-300">
                  {voiceHistory.map((item) => (
                    <SelectItem
                      key={item.history_item_id}
                      value={item.history_item_id}
                      className="hover:bg-gray-50"
                    >
                      <div className="flex flex-col space-y-1">
                        <span className="font-medium text-gray-900">
                          {truncateText(item.text, 40)}
                        </span>
                        <span className="text-xs text-gray-500">
                          Generated: {formatDateUnix(item.date_unix)} | Voice:{" "}
                          {item.voice_name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedVoice &&
                selectedApiProfile &&
                voiceHistory.length === 0 &&
                !isLoadingHistory && (
                  <p className="text-sm text-gray-600 mt-1">
                    No voice notes found for{" "}
                    {
                      availableVoices.find((v) => v.voiceId === selectedVoice)
                        ?.name
                    }{" "}
                    in{" "}
                    {
                      API_KEY_PROFILES[
                        selectedApiProfile as keyof typeof API_KEY_PROFILES
                      ]?.name
                    }
                    . Generate some voice notes first.
                  </p>
                )}
            </div>

            {/* Sale Price */}
            <div className="space-y-2">
              <Label
                htmlFor="salePrice"
                className="text-sm font-medium text-gray-700"
              >
                Sale Price ($)
              </Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                min="0"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="Enter sale amount"
                className="w-full bg-white border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
              />
            </div>

            {/* Submit Status */}
            {submitStatus && (
              <Alert
                className={
                  submitStatus.type === "success"
                    ? "border-green-500 bg-green-50 text-green-800"
                    : "border-red-500 bg-red-50 text-red-800"
                }
              >
                {submitStatus.type === "success" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription
                  className={
                    submitStatus.type === "success"
                      ? "text-green-700"
                      : "text-red-700"
                  }
                >
                  {submitStatus.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-pink-500 hover:bg-pink-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
              disabled={
                isSubmitting ||
                !selectedApiProfile ||
                !selectedVoice ||
                !selectedVoiceNote ||
                !salePrice
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting Sale...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Submit Voice Note Sale
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Sales Table */}
      {recentSales.length > 0 && (
        <Card className="border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 bg-white">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-pink-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900 font-bold flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-500" />
                Recent Sales ({recentSales.length})
              </CardTitle>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Filter and Sort Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by model, voice note, or ID..."
                    value={salesFilter}
                    onChange={(e) => setSalesFilter(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select
                  value={sortBy}
                  onValueChange={(value: "date" | "price" | "model") =>
                    setSortBy(value)
                  }
                >
                  <SelectTrigger className="w-24 sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="model">Model</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="px-3"
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>
              </div>
            </div>

            {/* Mobile-First Responsive Sales Cards */}
            <div className="space-y-4">
              {filteredAndSortedSales().map((sale) => {
                const isExpanded = expandedSales.has(sale.id);
                const { date, time } = formatDate(sale.soldDate);

                return (
                  <div
                    key={sale.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-pink-300 hover:shadow-md transition-all duration-300"
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="bg-pink-100 p-2 rounded-full flex-shrink-0">
                          <Mic className="h-4 w-4 text-pink-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 truncate">
                            {sale.model}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <User className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">
                              {sale.source || "Unknown"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <div className="text-lg font-semibold text-green-600">
                          ${sale.sale.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {Math.floor(sale.sale * 0.8)} pts
                        </div>
                      </div>
                    </div>

                    {/* Voice Note Content */}
                    <div className="mb-3">
                      <div className="text-sm text-gray-900">
                        <div
                          className={`${
                            isExpanded ? "" : "line-clamp-3"
                          } transition-all duration-300`}
                        >
                          {sale.voiceNote}
                        </div>
                        {sale.voiceNote.length > 150 && (
                          <button
                            onClick={() => toggleSaleExpansion(sale.id)}
                            className="text-pink-600 hover:text-pink-700 text-xs font-medium mt-2 flex items-center"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" />
                                Show less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Show more
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Footer Row */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{date}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{time}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            sale.status === "Completed"
                              ? "default"
                              : "secondary"
                          }
                          className={`text-xs ${
                            sale.status === "Completed"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : ""
                          }`}
                        >
                          {sale.status}
                        </Badge>
                        <div className="text-xs text-gray-400">
                          ID: {sale.id.substring(0, 6)}...
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
                <div>
                  Showing {filteredAndSortedSales().length} of{" "}
                  {recentSales.length} sales
                </div>
                <div className="flex items-center space-x-4">
                  <span>
                    Total Revenue:
                    <span className="font-semibold text-green-600 ml-1">
                      $
                      {filteredAndSortedSales()
                        .reduce((sum, sale) => sum + sale.sale, 0)
                        .toFixed(2)}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {recentSales.length === 0 && !isLoadingStats && (
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 bg-white">
          <CardContent className="p-12">
            <div className="text-center text-gray-600">
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-gray-100 p-6 rounded-full">
                  <FileText className="h-12 w-12 text-gray-400" />
                </div>
                <div>
                  <p className="text-xl font-medium text-gray-900 mb-2">
                    No sales data found
                  </p>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Submit your first voice note sale using the form above to
                    see your sales data here!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <ClearConfirmationDialog />
    </div>
  );
}
