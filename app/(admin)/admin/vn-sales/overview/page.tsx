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
import { Separator } from "@/components/ui/separator";
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
  Minus,
  X,
  ExternalLink,
  MoreHorizontal,
  Database,
  Sparkles,
  Brain,
  Shield,
} from "lucide-react";
import { getVoicesForProfile } from "@/app/services/elevenlabs-implementation";

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

  // Analytics time period tracking states
  const [trackingPeriod, setTrackingPeriod] = useState<"1d" | "7d" | "30d" | "90d" | "1y" | "all" | "custom">("7d");
  const [customDateRange, setCustomDateRange] = useState<{
    start: string;
    end: string;
  }>({
    start: "",
    end: ""
  });
  const [showCustomRange, setShowCustomRange] = useState(false);

  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [apiKeyProfiles, setApiKeyProfiles] = useState<any>({});
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);

  // Load API key profiles from database via API
  const loadProfiles = useCallback(async () => {
    setIsLoadingProfiles(true);
    try {
      const response = await fetch("/api/voice-profiles");
      const data = await response.json();

      if (response.ok && data.success) {
        setApiKeyProfiles(data.profiles);
      } else {
        console.error("Failed to load voice profiles:", data.error);
        setApiKeyProfiles({});
      }
    } catch (error) {
      console.error("Error loading API profiles:", error);
      setApiKeyProfiles({});
    } finally {
      setIsLoadingProfiles(false);
    }
  }, []);

  // Enhanced loadStats function with caching and analytics
  const loadStats = useCallback(async (forceRefresh = false) => {
    setIsLoadingStats(true);
    try {
      const periodParam = trackingPeriod !== "custom" ? `&period=${trackingPeriod}` : 
                         (customDateRange.start && customDateRange.end ? `&startDate=${customDateRange.start}&endDate=${customDateRange.end}` : '');
      
      const [vnStatsRes, voiceStatsRes] = await Promise.all([
        fetch("/api/vn-sales/stats"),
        fetch(
          `/api/elevenlabs/total-history${forceRefresh ? "?forceRefresh=true" : "?"}${periodParam}`
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
  }, [trackingPeriod, customDateRange]);

  // Helper functions for time period calculations
  const getPeriodLabel = (period: string) => {
    switch (period) {
      case "1d": return "Last 24 Hours";
      case "7d": return "Last 7 Days";
      case "30d": return "Last 30 Days";
      case "90d": return "Last 90 Days";
      case "1y": return "Last Year";
      case "all": return "All Time";
      case "custom": return "Custom Range";
      default: return "Last 7 Days";
    }
  };

  const handlePeriodChange = (period: "1d" | "7d" | "30d" | "90d" | "1y" | "all" | "custom") => {
    setTrackingPeriod(period);
    if (period !== "custom") {
      setShowCustomRange(false);
      setCustomDateRange({ start: "", end: "" });
    } else {
      setShowCustomRange(true);
    }
  };

  const handleCustomRangeSubmit = () => {
    if (customDateRange.start && customDateRange.end) {
      loadStats(true);
    }
  };

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
    loadProfiles();
  }, [loadStats, loadProfiles]);

  // Reload data when tracking period changes
  useEffect(() => {
    if (trackingPeriod !== "custom") {
      loadStats(true);
    }
  }, [trackingPeriod, loadStats]);

  useEffect(() => {
    const loadVoices = async () => {
      if (selectedApiProfile) {
        try {
          const profileVoices = await getVoicesForProfile(selectedApiProfile);
          setAvailableVoices(profileVoices);
          setSelectedVoice(profileVoices[0]?.voiceId || "");
        } catch (error) {
          console.error("Error loading voices for profile:", error);
          setAvailableVoices([]);
          setSelectedVoice("");
        }
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 border dark:border-gray-600">
          <div className="flex items-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Clear All Sales Data
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Are you sure you want to delete all voice note sales data? This
            action cannot be undone.
          </p>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowClearConfirmation(false)}
              disabled={isClearingData}
              className="flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleClearAllData}
              disabled={isClearingData}
              className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white"
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
    <div className="min-h-screen p-6 space-y-6 bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800">
      <ExternalSaleNotification />

      {/* Enhanced Header Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-10 dark:opacity-20" />
        <div className="relative backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 rounded-xl p-6 border border-purple-200 dark:border-purple-700 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  VN Sales Overview
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Real-time analytics and performance insights
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Sales
                </p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {recentSales.length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Active Models
                </p>
                <p className="text-xl font-bold text-pink-600 dark:text-pink-400">
                  {accountStats?.accountStats?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status alerts */}
      {clearStatus && (
        <Alert
          className={`${
            clearStatus.type === "success"
              ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 dark:border-green-700"
              : "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 dark:border-red-700"
          } mb-6 shadow-lg`}
        >
          {clearStatus.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
          <AlertDescription
            className={
              clearStatus.type === "success"
                ? "text-green-700 dark:text-green-300"
                : "text-red-700 dark:text-red-300"
            }
          >
            {clearStatus.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-500/10 to-indigo-600/10 rounded-3xl" />
        <Card className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white shadow-lg">
                    <Mic className="h-8 w-8" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-pink-800 bg-clip-text text-transparent dark:from-gray-100 dark:via-purple-300 dark:to-pink-300">
                    VN Sales Tracker
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 text-lg flex items-center gap-2 mt-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    Advanced analytics, real-time tracking, and intelligent
                    insights
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        Live Updates
                      </span>
                    </div>
                    {isCached && (
                      <div className="flex items-center space-x-2">
                        <Timer className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          Cached ({cacheAge}s ago)
                        </span>
                      </div>
                    )}
                    {lastRefresh && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Last updated: {lastRefresh.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Header Controls */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Auto Refresh
                  </label>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className={`w-11 h-6 rounded-full cursor-pointer transition-all duration-200 ${
                        autoRefresh
                          ? "bg-purple-500 shadow-lg"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-all duration-200 mt-0.5 ${
                          autoRefresh ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => loadStats(true)}
                  disabled={isLoadingStats}
                  variant="outline"
                  size="sm"
                  className="border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20"
                >
                  {isLoadingStats ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">Refresh</span>
                </Button>

                <Button
                  onClick={exportData}
                  variant="outline"
                  size="sm"
                  className="border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/20"
                >
                  <Download className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">Export</span>
                </Button>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Total Sales
                    </p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      ${vnStats?.totalSales?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl p-4 border border-green-200 dark:border-green-800/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                      Today
                    </p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {vnStats?.todaySales || 0}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl p-4 border border-purple-200 dark:border-purple-800/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      This Week
                    </p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {vnStats?.weekSales || 0}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 rounded-xl p-4 border border-orange-200 dark:border-orange-800/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                      Active Models
                    </p>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                      {accountStats?.accountStats?.length || 0}
                    </p>
                  </div>
                  <Database className="h-8 w-8 text-orange-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Controls Section */}
      <Card className="mb-6 backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-purple-200 dark:border-purple-700">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {lastRefresh && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
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
                  className={`${autoRefresh ? "bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700" : "dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"}`}
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
                    onChange={(e) =>
                      setRefreshInterval(parseInt(e.target.value))
                    }
                    className="text-xs border rounded px-2 py-1 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
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
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoadingStats ? "animate-spin" : ""}`}
                />
                {isLoadingStats ? "Refreshing..." : "Refresh"}
              </Button>
              <Button
                onClick={exportData}
                variant="outline"
                size="sm"
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              {recentSales.length > 0 && (
                <Button
                  onClick={() => setShowClearConfirmation(true)}
                  disabled={isClearingData}
                  variant="outline"
                  size="sm"
                  className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Clear Data
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
            <Bell className="h-5 w-5 mr-2 text-blue-500" />
            Smart Alerts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map((alert, index) => (
              <Alert
                key={index}
                className="border-l-4 border-l-blue-500 dark:bg-gray-800 dark:border-gray-600"
              >
                {getAlertIcon(alert.type)}
                <div>
                  <AlertDescription className="dark:text-gray-300">
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
        <Card className="border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 dark:hover:border-pink-500 group bg-white dark:bg-gray-800 relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  VN Sales Today
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {isLoadingStats ? (
                    <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                  ) : (
                    `$${vnStats?.vnSalesToday?.toFixed(2) || "0.00"}`
                  )}
                </p>
                <div className="flex items-center text-sm">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    Real-time
                  </span>
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-full group-hover:bg-green-100 dark:group-hover:bg-green-900/50 transition-colors">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Voice Generated */}
        <Card className="border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 dark:hover:border-pink-500 group bg-white dark:bg-gray-800 relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Total Voice Generated
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {isLoadingStats ? (
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  ) : (
                    voiceStats?.totalVoiceGenerated?.toLocaleString() || "0"
                  )}
                </p>
                <div className="flex items-center text-sm">
                  <Activity className="h-3 w-3 text-blue-500 mr-1" />
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    {voiceStats?.newVoicesToday || 0} new today
                  </span>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-full group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                <FileAudio className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 dark:hover:border-pink-500 group bg-white dark:bg-gray-800 relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Total Revenue
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {isLoadingStats ? (
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  ) : (
                    `$${vnStats?.totalRevenue?.toFixed(2) || "0.00"}`
                  )}
                </p>
                <div className="flex items-center text-sm">
                  <BarChart3 className="h-3 w-3 text-purple-500 mr-1" />
                  <span className="text-purple-600 dark:text-purple-400 font-medium">
                    From {vnStats?.salesByModel?.length || 0} models
                  </span>
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-full group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors">
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average VN Price */}
        <Card className="border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 dark:hover:border-pink-500 group bg-white dark:bg-gray-800 relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Average VN Price
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {isLoadingStats ? (
                    <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                  ) : (
                    `$${vnStats?.averageVnPrice?.toFixed(2) || "0.00"}`
                  )}
                </p>
                <div className="flex items-center text-sm">
                  <Star className="h-3 w-3 text-orange-500 mr-1" />
                  <span className="text-orange-600 dark:text-orange-400 font-medium">
                    Per voice note
                  </span>
                </div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-full group-hover:bg-orange-100 dark:group-hover:bg-orange-900/50 transition-colors">
                <Star className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Generating Account */}
        <Card className="border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 dark:hover:border-pink-500 group bg-white dark:bg-gray-800 relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Top Account
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {isLoadingStats ? (
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  ) : (
                    accountStats?.topAccount?.totalGenerated?.toLocaleString() ||
                    "0"
                  )}
                </p>
                <div className="flex items-center text-sm">
                  <User className="h-3 w-3 text-indigo-500 mr-1" />
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium truncate">
                    {accountStats?.topAccount?.accountName || "No data"}
                  </span>
                </div>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-full group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                <Award className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Most Active Today */}
        <Card className="border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 dark:hover:border-pink-500 group bg-white dark:bg-gray-800 relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Most Active Today
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {isLoadingStats ? (
                    <Loader2 className="w-6 h-6 animate-spin text-red-600" />
                  ) : (
                    accountStats?.mostActiveToday?.generatedToday || "0"
                  )}
                </p>
                <div className="flex items-center text-sm">
                  <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
                  <span className="text-red-600 dark:text-red-400 font-medium truncate">
                    {accountStats?.mostActiveToday?.accountName ||
                      "No activity"}
                  </span>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-full group-hover:bg-red-100 dark:group-hover:bg-red-900/50 transition-colors">
                <Zap className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      {insights && showInsights && (
        <Card className="border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-800 mb-8">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900 dark:text-gray-100 font-bold flex items-center">
                <Target className="h-5 w-5 mr-2 text-green-500" />
                Performance Insights
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInsights(!showInsights)}
                className="dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {insights.activeToday}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Active Today
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {insights.highPerformers}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  High Performers
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {insights.inactiveAccounts}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Inactive Accounts
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {insights.averagePerAccount}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Avg per Account
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                🎯 Smart Recommendations
              </h4>
              <div className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
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
        <Card className="border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-800 mb-8">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-gray-900 dark:text-gray-100 font-bold flex items-center">
                <Activity className="h-5 w-5 mr-2 text-indigo-500" />
                Enhanced Account Analytics
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({getPeriodLabel(trackingPeriod)})
                </span>
              </CardTitle>
              
              {/* Time Period Selector */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Select value={trackingPeriod} onValueChange={handlePeriodChange}>
                    <SelectTrigger className="w-40 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                      <SelectItem value="1d">Last 24 Hours</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="90d">Last 90 Days</SelectItem>
                      <SelectItem value="1y">Last Year</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadStats(true)}
                  disabled={isLoadingStats}
                  className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {isLoadingStats ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* Custom Date Range Selector */}
            {showCustomRange && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      From:
                    </Label>
                    <Input
                      type="date"
                      value={customDateRange.start}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      To:
                    </Label>
                    <Input
                      type="date"
                      value={customDateRange.end}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                    />
                  </div>
                  <Button
                    onClick={handleCustomRangeSubmit}
                    disabled={!customDateRange.start || !customDateRange.end || isLoadingStats}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800"
                  >
                    Apply Range
                  </Button>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-6">
            {/* Period Summary Stats */}
            <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {accountStats.accountStats?.reduce((sum: number, acc: EnhancedAccountStats) => 
                      sum + (trackingPeriod === "1d" ? acc.generatedToday : 
                            trackingPeriod === "7d" ? acc.generatedThisWeek :
                            acc.totalGenerated), 0)?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total for Period</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {accountStats.accountStats?.filter((acc: EnhancedAccountStats) => acc.status === "active").length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active Accounts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {Math.round((accountStats.accountStats?.reduce((sum: number, acc: EnhancedAccountStats) => 
                      sum + (trackingPeriod === "1d" ? acc.generatedToday : 
                            trackingPeriod === "7d" ? acc.generatedThisWeek :
                            acc.totalGenerated), 0) || 0) / (accountStats.accountStats?.length || 1))}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg per Account</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {accountStats.accountStats?.filter((acc: EnhancedAccountStats) => acc.velocity === "high").length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">High Velocity</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accountStats.accountStats.map(
                (account: EnhancedAccountStats, index: number) => (
                  <div
                    key={account.accountId}
                    className={`p-4 rounded-lg border transition-all duration-300 hover:shadow-md ${
                      index === 0
                        ? "bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-700"
                        : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(account.status)}
                        {index === 0 && (
                          <Star className="h-4 w-4 text-indigo-500" />
                        )}
                        <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {account.accountName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(account.trend)}
                        {index === 0 && (
                          <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700 text-xs">
                            #1
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-2">
                      {/* Period-specific main metric */}
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {trackingPeriod === "1d" ? "Today:" :
                           trackingPeriod === "7d" ? "This Week:" :
                           trackingPeriod === "30d" ? "Last 30 Days:" :
                           trackingPeriod === "90d" ? "Last 90 Days:" :
                           trackingPeriod === "1y" ? "This Year:" :
                           "Total Generated:"}
                        </span>
                        <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">
                          {trackingPeriod === "1d" ? account.generatedToday.toLocaleString() :
                           trackingPeriod === "7d" ? account.generatedThisWeek.toLocaleString() :
                           account.totalGenerated.toLocaleString()}
                        </span>
                      </div>

                      {/* Comparison metrics based on period */}
                      {trackingPeriod === "1d" && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            vs Yesterday:
                          </span>
                          <div className="flex items-center space-x-1">
                            <span className="font-medium text-gray-500 dark:text-gray-400">
                              {account.generatedYesterday}
                            </span>
                            {account.generatedToday > account.generatedYesterday ? (
                              <TrendingUp className="h-3 w-3 text-green-500" />
                            ) : account.generatedToday < account.generatedYesterday ? (
                              <TrendingDown className="h-3 w-3 text-red-500" />
                            ) : (
                              <Minus className="h-3 w-3 text-gray-400" />
                            )}
                          </div>
                        </div>
                      )}

                      {(trackingPeriod === "7d" || trackingPeriod === "30d" || trackingPeriod === "90d") && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Daily Average:
                          </span>
                          <span className="font-medium text-blue-600 dark:text-blue-400">
                            {Math.round(account.avgDailyGeneration).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {/* Always show total for reference unless it's the main metric */}
                      {trackingPeriod !== "all" && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            All-time Total:
                          </span>
                          <span className="font-medium text-gray-600 dark:text-gray-300">
                            {account.totalGenerated.toLocaleString()}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Avg Daily:
                        </span>
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          {account.avgDailyGeneration}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Velocity:
                        </span>
                        <Badge
                          className={`text-xs ${getVelocityBadge(account.velocity)} dark:bg-opacity-20 dark:border-opacity-50`}
                        >
                          {account.velocity.toUpperCase()}
                        </Badge>
                      </div>

                      {account.lastGenerationDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Last Activity:
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {account.lastActivityHours < 24
                              ? `${account.lastActivityHours}h ago`
                              : account.lastGenerationDate}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress bar - Period-specific */}
                    <div className="mt-3 overflow-hidden">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Relative to top performer
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {(() => {
                            if (!accountStats.accountStats[0]) return "0%";
                            
                            const currentValue = trackingPeriod === "1d" ? account.generatedToday : 
                                                trackingPeriod === "7d" ? account.generatedThisWeek :
                                                account.totalGenerated;
                            const topValue = trackingPeriod === "1d" ? accountStats.accountStats[0].generatedToday : 
                                           trackingPeriod === "7d" ? accountStats.accountStats[0].generatedThisWeek :
                                           accountStats.accountStats[0].totalGenerated;
                            
                            const percentage = topValue > 0 ? Math.min(100, Math.round((currentValue / topValue) * 100)) : 0;
                            return `${percentage}%`;
                          })()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            index === 0
                              ? "bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400"
                              : account.velocity === "high"
                                ? "bg-green-400 dark:bg-green-500"
                                : account.velocity === "medium"
                                  ? "bg-yellow-400 dark:bg-yellow-500"
                                  : "bg-gray-400 dark:bg-gray-500"
                          }`}
                          style={{
                            width: (() => {
                              if (!accountStats.accountStats[0]) return "0%";
                              
                              const currentValue = trackingPeriod === "1d" ? account.generatedToday : 
                                                  trackingPeriod === "7d" ? account.generatedThisWeek :
                                                  account.totalGenerated;
                              const topValue = trackingPeriod === "1d" ? accountStats.accountStats[0].generatedToday : 
                                             trackingPeriod === "7d" ? accountStats.accountStats[0].generatedThisWeek :
                                             accountStats.accountStats[0].totalGenerated;
                              
                              if (topValue <= 0) return "0%";
                              const percentage = Math.min(100, Math.max(0, (currentValue / topValue) * 100));
                              return `${percentage}%`;
                            })()
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Mini chart for recent activity */}
                    {account.recentActivity &&
                      account.recentActivity.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            7-day activity:
                          </div>
                          <div className="flex items-end space-x-1 h-6">
                            {account.recentActivity.map((day, i) => (
                              <div
                                key={i}
                                className="flex-1 bg-blue-200 dark:bg-blue-700 rounded-sm"
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

            {/* Enhanced Summary with Period-specific insights */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                  <Target className="h-4 w-4 mr-2 text-indigo-500" />
                  {getPeriodLabel(trackingPeriod)} Insights
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                    <div className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      🚀 Top Growth Pattern
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                      {trackingPeriod === "1d" && "Daily peak activity typically occurs between 10AM-2PM"}
                      {trackingPeriod === "7d" && "Weekly patterns show highest activity on Tuesday-Thursday"}
                      {trackingPeriod === "30d" && "Monthly growth averages 15-20% for active accounts"}
                      {trackingPeriod === "90d" && "Quarterly trends show seasonal variations in usage"}
                      {trackingPeriod === "1y" && "Annual growth patterns reveal user lifecycle stages"}
                      {trackingPeriod === "all" && "Historical data reveals long-term engagement trends"}
                      {trackingPeriod === "custom" && "Custom period analysis for targeted insights"}
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                    <div className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      📊 Period Performance
                    </div>
                    <div className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                      {accountStats.accountStats?.filter((acc: EnhancedAccountStats) => 
                        (trackingPeriod === "1d" ? acc.generatedToday : 
                         trackingPeriod === "7d" ? acc.generatedThisWeek : 
                         acc.totalGenerated) > 0).length || 0} accounts active in this period
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {accountStats.accountStats.length}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Total Accounts
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-green-600 dark:text-green-400">
                    {accountStats.accountStats.filter((acc: EnhancedAccountStats) => 
                      (trackingPeriod === "1d" ? acc.generatedToday : 
                       trackingPeriod === "7d" ? acc.generatedThisWeek : 
                       acc.totalGenerated) > 0).length}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Active in Period
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-blue-600 dark:text-blue-400">
                    {accountStats.accountStats.filter((acc: EnhancedAccountStats) => acc.velocity === "high").length}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    High Velocity
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-red-600 dark:text-red-400">
                    {
                      accountStats.accountStats.filter(
                        (acc: any) => acc.status === "inactive"
                      ).length
                    }
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Need Attention
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2 flex items-center justify-center gap-2">
                <Clock className="h-3 w-3" />
                <span>
                  {getPeriodLabel(trackingPeriod)} data • Last updated:{" "}
                  {accountStats.lastUpdated
                    ? new Date(accountStats.lastUpdated).toLocaleTimeString()
                    : "Unknown"}
                </span>
                {isCached && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    Cached ({Math.round(cacheAge / 60)}m old)
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Sales Table */}
      {recentSales.length > 0 && (
        <Card className="border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-800">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900 dark:text-gray-100 font-bold flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-500" />
                Recent Sales ({recentSales.length})
              </CardTitle>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
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
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                  <Input
                    placeholder="Search by model, voice note, or ID..."
                    value={salesFilter}
                    onChange={(e) => setSalesFilter(e.target.value)}
                    className="pl-10 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Select
                  value={sortBy}
                  onValueChange={(value: "date" | "price" | "model") =>
                    setSortBy(value)
                  }
                >
                  <SelectTrigger className="w-24 sm:w-32 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                    <SelectItem
                      value="date"
                      className="dark:text-gray-100 dark:hover:bg-gray-700"
                    >
                      Date
                    </SelectItem>
                    <SelectItem
                      value="price"
                      className="dark:text-gray-100 dark:hover:bg-gray-700"
                    >
                      Price
                    </SelectItem>
                    <SelectItem
                      value="model"
                      className="dark:text-gray-100 dark:hover:bg-gray-700"
                    >
                      Model
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="px-3 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
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
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-pink-300 dark:hover:border-pink-500 hover:shadow-md transition-all duration-300"
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-full flex-shrink-0">
                          <Mic className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {sale.model}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <User className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">
                              {sale.source || "Unknown"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                          ${sale.sale.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {Math.floor(sale.sale * 0.8)} pts
                        </div>
                      </div>
                    </div>

                    {/* Voice Note Content */}
                    <div className="mb-3">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
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
                            className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 text-xs font-medium mt-2 flex items-center"
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
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
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
                              ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
                              : "dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {sale.status}
                        </Badge>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          ID: {sale.id.substring(0, 6)}...
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
                <div>
                  Showing {filteredAndSortedSales().length} of{" "}
                  {recentSales.length} sales
                </div>
                <div className="flex items-center space-x-4">
                  <span>
                    Total Revenue:
                    <span className="font-semibold text-green-600 dark:text-green-400 ml-1">
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
        <Card className="border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-800">
          <CardContent className="p-12">
            <div className="text-center text-gray-600 dark:text-gray-400">
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-full">
                  <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                </div>
                <div>
                  <p className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No sales data found
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
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
