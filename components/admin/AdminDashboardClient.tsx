/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { formatForDisplay } from "@/lib/dateUtils";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateTime } from "luxon";
import {
  Users,
  TrendingUp,
  Activity,
  UserCheck,
  Calendar,
  CalendarDays,
  DollarSign,
  FileText,
  BarChart3,
  Loader2,
  MessageCircle,
  Trophy,
  Medal,
  Award,
  Eye,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy,
  Wand2,
  CheckCircle,
  RefreshCw,
  Mic,
} from "lucide-react";
import CountUp from "react-countup";
import { API_KEY_PROFILES } from "@/app/services/elevenlabs-implementation";

interface DashboardData {
  stats: {
    totalUsers: number;
    totalUsersThisMonth: number;
    userGrowthPercentage: number;
    usersByRole: Record<string, number>;
    voiceNoteCount?: number;
    activeModelCount?: number;
  };
  recentUsers: Array<{
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    createdAt: Date;
    image: string | null;
  }>;
  userGrowthData: Array<{
    month: string;
    users: number;
  }>;
  vnSales: {
    vnSalesToday: number;
    vnSalesGrowth: number;
    totalVnCount: number;
    newVnToday: number;
    loyaltyPointsEarned: number;
    loyaltyPointsGrowth: number;
    averageVnPrice: number;
    priceIncrease: number;
    totalRevenue: number;
    salesByModel: Array<{
      name: string;
      sales: number;
      revenue: number;
      loyaltyPoints: number;
    }>;
  };
  analytics: {
    activeCampaigns: number;
    newCampaignsThisWeek: number;
    conversionRate: number;
    conversionGrowth: number;
    totalRevenue: number;
    revenueGrowth: number;
    roi: number;
    roiGrowth: number;
  };
  contentGeneration: {
    totalContentGenerated: number;
    contentGeneratedToday: number;
    contentGrowth: number;
    contentByTracker: Array<{
      tracker: string;
      count: number;
    }>;
    recentActivities?: Array<{
      tracker: string;
      name: string;
      email: string;
      createdAt: string;
      activity: string;
      image?: string;
    }>;
  };
}

const ROLE_COLORS = {
  ADMIN: "#ec4899",
  MODERATOR: "#f97316",
  USER: "#10b981",
  SWD: "#8b5cf6",
  GUEST: "#94a3b8",
};

export function AdminDashboardClient({ data }: { data: DashboardData }) {
  const { stats, recentUsers, userGrowthData, analytics } = data;

  // Add custom CSS for animations
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      const style = document.createElement("style");
      style.textContent = `
        @keyframes fadeInSlideUp {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

  // State for real-time VN sales and voice data
  const [vnSalesData, setVnSalesData] = useState(data.vnSales);
  const [isLoadingVoiceStats, setIsLoadingVoiceStats] = useState(true);
  const [isLoadingVnSales, setIsLoadingVnSales] = useState(false); // NEW STATE

  // State for content generation data (using original data from server)
  const [contentGenerationData, setContentGenerationData] = useState(
    data.contentGeneration
  );
  const [isLoadingContentStats, setIsLoadingContentStats] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  const [isLoadingMassMessages, setIsLoadingMassMessages] = useState(false);
  const [totalMassMessages, setTotalMassMessages] = useState(0);
  const [massMessagingLeaderboard, setMassMessagingLeaderboard] = useState<
    Array<{
      name: string;
      username: string;
      totalMessages: number;
      totalViews: number;
      totalSent: number;
      viewRate: number;
      paidMessages: number;
      freeMessages: number;
      totalRevenue: number;
      averagePrice: number;
      totalPurchases: number;
      avatar?: string;
      rank: number;
    }>
  >([]);
  const [topPerformingMessages, setTopPerformingMessages] = useState<
    Array<{
      id: number;
      text: string;
      textCropped: string;
      viewedCount: number;
      sentCount: number;
      viewRate: number;
      isFree: boolean;
      price?: string;
      purchasedCount?: number;
      revenue: number;
      date: string;
      modelName: string;
      modelUsername: string;
      modelAvatar?: string;
      rank: number;
    }>
  >([]);

  // State for SWD leaderboard data
  const [swdData, setSwdData] = useState<{
    totalSend: Array<{ creator: string; amount: number; rank: number }>;
    totalBuy: Array<{ creator: string; amount: string; rank: number }>;
    totalScripts: number;
    totalDriveScripts: number;
    totalPerformanceScripts: number;
    totalRevenue: number;
  }>({
    totalSend: [],
    totalBuy: [],
    totalScripts: 0,
    totalDriveScripts: 0,
    totalPerformanceScripts: 0,
    totalRevenue: 0,
  });
  const [isLoadingSwdData, setIsLoadingSwdData] = useState(true);

  // State for generated captions
  const [generatedCaptions, setGeneratedCaptions] = useState<string[]>([]);
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [showGeneratedCaptions, setShowGeneratedCaptions] = useState(false);
  const [copiedCaptionId, setCopiedCaptionId] = useState<string | null>(null);

  // Date range state
  const [dateRange, setDateRange] = useState<"30" | "60" | "90" | "custom">(
    "30"
  );
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showCustomDateInputs, setShowCustomDateInputs] = useState(false);

  // State for managing expanded messages in leaderboard
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(
    new Set()
  );

  // State for managing loading messages transition
  const [currentLoadingMessageIndex, setCurrentLoadingMessageIndex] =
    useState(0);

  // Helper function to calculate growth percentage
  const calculateGrowthPercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Helper function to calculate price increase
  const calculatePriceIncrease = (current: number, previous: number) => {
    return Math.round((current - previous) * 100) / 100;
  };

  // Helper function to calculate total loyalty points
  const calculateTotalLoyaltyPoints = (salesByModel: any[]) => {
    return salesByModel.reduce(
      (total, model) => total + (model.loyaltyPoints || 0),
      0
    );
  };

  // CORRECTED: VN Sales data fetching function (only updates sales data, not voice generation stats)
  const fetchVnSalesData = async () => {
    try {
      setIsLoadingVnSales(true);
      const response = await fetch("/api/vn-sales/stats");
      if (response.ok) {
        const vnSalesStats = await response.json();

        console.log("Fetched VN Sales stats:", vnSalesStats);

        // Calculate total loyalty points
        const loyaltyPointsEarned =
          vnSalesStats.salesByModel?.reduce(
            (total: number, model: any) => total + (model.loyaltyPoints || 0),
            0
          ) || 0;

        // Update vnSalesData with SALES data only (NOT voice generation counts)
        setVnSalesData((prev) => ({
          ...prev,
          // Sales-related data from VN sales API
          vnSalesToday: vnSalesStats.vnSalesToday || 0,
          vnSalesGrowth: calculateGrowthPercentage(
            vnSalesStats.vnSalesToday || 0,
            prev.vnSalesToday
          ),
          totalRevenue: vnSalesStats.totalRevenue || 0,
          averageVnPrice: vnSalesStats.averageVnPrice || 0,
          priceIncrease: calculatePriceIncrease(
            vnSalesStats.averageVnPrice || 0,
            prev.averageVnPrice
          ),
          salesByModel: vnSalesStats.salesByModel || [],
          loyaltyPointsEarned: loyaltyPointsEarned,
          loyaltyPointsGrowth: calculateGrowthPercentage(
            loyaltyPointsEarned,
            prev.loyaltyPointsEarned
          ),

          // Keep existing totalVnCount and newVnToday from ElevenLabs (don't overwrite)
          // totalVnCount: prev.totalVnCount, // Keep existing
          // newVnToday: prev.newVnToday, // Keep existing
        }));
      } else {
        console.error("Failed to fetch VN sales data:", response.status);
      }
    } catch (error) {
      console.error("Error fetching VN sales data:", error);
    } finally {
      setIsLoadingVnSales(false);
    }
  };

  // Function to fetch voice stats separately
  const fetchVoiceStatsOnly = async () => {
    try {
      setIsLoadingVoiceStats(true);
      const response = await fetch("/api/elevenlabs/total-history");
      if (response.ok) {
        const voiceStats = await response.json();

        // Update vnSalesData with VOICE GENERATION stats only
        setVnSalesData((prev) => ({
          ...prev,
          totalVnCount: voiceStats.totalVoiceGenerated || 0, // From ElevenLabs
          newVnToday: voiceStats.newVoicesToday || 0, // From ElevenLabs
        }));

        console.log("Voice stats fetched:", voiceStats);
      }
    } catch (error) {
      console.error("Error fetching voice data:", error);
    } finally {
      setIsLoadingVoiceStats(false);
    }
  };

  const fetchContentGenerationData = async () => {
    try {
      const response = await fetch("/api/content-generated/stats");
      if (response.ok) {
        const contentStats = await response.json();
        setContentGenerationData({
          totalContentGenerated: contentStats.totalContentGenerated || 0,
          contentGeneratedToday: contentStats.contentGeneratedToday || 0,
          contentGrowth: contentStats.contentGrowth || 0,
          contentByTracker: contentStats.contentByTracker || [],
        });
        setRecentActivities(contentStats.recentActivities || []);
      }
    } catch (error) {
      console.error("Error fetching content generation data:", error);
    } finally {
      setIsLoadingContentStats(false);
    }
  };

  // Loading messages for mass messaging campaigns
  const loadingMessages = [
    "Loading mass messaging data...",
    "Fetching campaign analytics...",
    "Processing message statistics...",
    "Analyzing performance metrics...",
    "Gathering revenue data...",
    "Collecting view statistics...",
    "Compiling results...",
    "Preparing dashboard...",
  ];

  // Function to toggle message expansion
  const toggleMessageExpansion = (messageId: number) => {
    setExpandedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  // Function to generate captions based on top performing messages
  const generateCaptions = async () => {
    if (topPerformingMessages.length === 0) {
      console.error("No top messages available for caption generation");
      return;
    }

    setIsGeneratingCaptions(true);
    setShowGeneratedCaptions(false);

    try {
      const response = await fetch("/api/generate-captions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topMessages: topPerformingMessages.slice(0, 5), // Use top 5 messages
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate captions");
      }

      const data = await response.json();

      if (data.success && data.captions) {
        setGeneratedCaptions(data.captions);
        setShowGeneratedCaptions(true);
      } else {
        throw new Error(data.message || "Failed to generate captions");
      }
    } catch (error) {
      console.error("Error generating captions:", error);
    } finally {
      setIsGeneratingCaptions(false);
    }
  };

  // Function to generate captions based on top performing leaderboard models
  const generateLeaderboardCaptions = async () => {
    if (massMessagingLeaderboard.length === 0) {
      console.error("No leaderboard data available for caption generation");
      return;
    }

    setIsGeneratingCaptions(true);
    setShowGeneratedCaptions(false);

    try {
      const response = await fetch("/api/generate-captions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topLeaderboard: massMessagingLeaderboard.slice(0, 5), // Use top 5 from leaderboard
          topMessages: topPerformingMessages.slice(0, 5), // Also include top messages for context
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate captions");
      }

      const data = await response.json();

      if (data.success && data.captions) {
        setGeneratedCaptions(data.captions);
        setShowGeneratedCaptions(true);
      } else {
        throw new Error(data.message || "Failed to generate captions");
      }
    } catch (error) {
      console.error("Error generating captions:", error);
    } finally {
      setIsGeneratingCaptions(false);
    }
  };

  // Enhanced copy function
  const copyToClipboard = async (caption: string, captionId: string) => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopiedCaptionId(captionId);

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedCaptionId(null);
      }, 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = caption;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

      setCopiedCaptionId(captionId);
      setTimeout(() => {
        setCopiedCaptionId(null);
      }, 2000);
    }
  };

  // Helper functions (moved outside useEffect to avoid dependency issues)
  const getCurrentDateRange = React.useCallback(() => {
    const now = DateTime.now();
    let startDate: DateTime;
    let endDate = now;

    if (dateRange === "custom") {
      if (customStartDate && customEndDate) {
        const customStart = DateTime.fromISO(customStartDate);
        const customEnd = DateTime.fromISO(customEndDate);
        if (customStart.isValid && customEnd.isValid) {
          startDate = customStart;
          endDate = customEnd;
        } else {
          startDate = now.minus({ days: 30 });
        }
      } else {
        startDate = now.minus({ days: 30 });
      }
    } else {
      const days = parseInt(dateRange);
      startDate = now.minus({ days });
    }

    return { startDate, endDate };
  }, [dateRange, customStartDate, customEndDate]);

  // Helper function for paginated mass messaging fetch
  const fetchMassMessagesWithPagination = React.useCallback(
    async (accountId: string, startDate: DateTime, endDate: DateTime) => {
      const allMessages: any[] = [];
      let offset = 0;
      const limit = 100;
      let hasMoreData = true;

      while (hasMoreData) {
        try {
          const messagesResponse = await fetch(
            `/api/onlyfans/models?accountId=${encodeURIComponent(accountId)}&endpoint=mass-messaging&limit=${limit}&offset=${offset}`
          );

          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            const messages =
              messagesData.data?.list ||
              messagesData.list ||
              messagesData.data ||
              [];

            if (!Array.isArray(messages) || messages.length === 0) {
              hasMoreData = false;
              break;
            }

            // Filter messages by date range on the client side
            const filteredMessages = messages.filter((msg: any) => {
              if (!msg.date) return false;
              const messageDate =
                DateTime.fromISO(msg.date) ||
                DateTime.fromJSDate(new Date(msg.date));
              return messageDate >= startDate && messageDate <= endDate;
            });

            allMessages.push(...filteredMessages);

            // If we got fewer messages than the limit, we've reached the end
            if (messages.length < limit) {
              hasMoreData = false;
            } else {
              offset += limit;
            }

            // If all messages in this batch are outside our date range and we're getting older data,
            // we can stop fetching (assuming messages are sorted by date desc)
            if (filteredMessages.length === 0 && messages.length > 0) {
              const oldestMessageInBatch = messages[messages.length - 1];
              if (oldestMessageInBatch.date) {
                const oldestDate =
                  DateTime.fromISO(oldestMessageInBatch.date) ||
                  DateTime.fromJSDate(new Date(oldestMessageInBatch.date));
                if (oldestDate < startDate) {
                  hasMoreData = false;
                }
              }
            }
          } else {
            hasMoreData = false;
          }
        } catch (error) {
          console.error(
            `Error fetching mass messages for account ${accountId} at offset ${offset}:`,
            error
          );
          hasMoreData = false;
        }
      }

      return allMessages;
    },
    []
  );

  const fetchTotalMassMessages = React.useCallback(async () => {
    setIsLoadingMassMessages(true);
    try {
      // Get current date range
      const { startDate, endDate } = getCurrentDateRange();

      // First get all OnlyFans accounts
      const accountsResponse = await fetch(
        "/api/onlyfans/models?endpoint=accounts"
      );
      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        const accounts = accountsData.accounts || accountsData || [];

        let totalMessages = 0;
        const leaderboardData: Array<{
          name: string;
          username: string;
          totalMessages: number;
          totalViews: number;
          totalSent: number;
          viewRate: number;
          paidMessages: number;
          freeMessages: number;
          totalRevenue: number;
          averagePrice: number;
          totalPurchases: number;
          avatar?: string;
          rank: number;
        }> = [];

        // Fetch mass messages for each account with pagination and date filtering
        const allMessages: Array<{
          id: number;
          text: string;
          textCropped: string;
          viewedCount: number;
          sentCount: number;
          viewRate: number;
          isFree: boolean;
          price?: string;
          purchasedCount?: number;
          revenue: number;
          date: string;
          modelName: string;
          modelUsername: string;
          modelAvatar?: string;
          rank: number;
        }> = [];

        for (const account of accounts) {
          const accountId = account.id || account.onlyfans_user_data?.id;
          if (accountId) {
            const accountMessages = await fetchMassMessagesWithPagination(
              accountId,
              startDate,
              endDate
            );

            totalMessages += accountMessages.length;

            // Add individual messages to the global list
            accountMessages.forEach((msg) => {
              const viewRate =
                msg.sentCount > 0 ? (msg.viewedCount / msg.sentCount) * 100 : 0;
              const revenue =
                !msg.isFree && msg.price
                  ? parseFloat(msg.price) * (msg.purchasedCount || 0)
                  : 0;

              allMessages.push({
                id: msg.id,
                text: msg.text,
                textCropped: msg.textCropped,
                viewedCount: msg.viewedCount || 0,
                sentCount: msg.sentCount || 0,
                viewRate,
                isFree: msg.isFree,
                price: msg.price,
                purchasedCount: msg.purchasedCount || 0,
                revenue,
                date: msg.date,
                modelName:
                  account.onlyfans_user_data?.name || account.name || "Unknown",
                modelUsername:
                  account.onlyfans_user_data?.username ||
                  account.username ||
                  "N/A",
                modelAvatar:
                  account.onlyfans_user_data?.avatar || account.avatar,
                rank: 0, // Will be set after sorting
              });
            });

            // Calculate detailed metrics for this account
            let totalViews = 0;
            let totalSent = 0;
            let paidMessages = 0;
            let freeMessages = 0;
            let totalRevenue = 0;
            let totalPurchases = 0;
            let priceSum = 0;
            let paidMessageCount = 0;

            accountMessages.forEach((msg) => {
              totalViews += msg.viewedCount || 0;
              totalSent += msg.sentCount || 0;
              totalPurchases += msg.purchasedCount || 0;

              if (msg.isFree) {
                freeMessages++;
              } else {
                paidMessages++;
                if (msg.price) {
                  const price = parseFloat(msg.price);
                  if (!isNaN(price)) {
                    priceSum += price;
                    paidMessageCount++;
                    totalRevenue += price * (msg.purchasedCount || 0);
                  }
                }
              }
            });

            const viewRate = totalSent > 0 ? (totalViews / totalSent) * 100 : 0;
            const averagePrice =
              paidMessageCount > 0 ? priceSum / paidMessageCount : 0;

            // Add to leaderboard data if there are messages
            if (accountMessages.length > 0) {
              leaderboardData.push({
                name:
                  account.onlyfans_user_data?.name || account.name || "Unknown",
                username:
                  account.onlyfans_user_data?.username ||
                  account.username ||
                  "N/A",
                totalMessages: accountMessages.length,
                totalViews,
                totalSent,
                viewRate,
                paidMessages,
                freeMessages,
                totalRevenue,
                averagePrice,
                totalPurchases,
                avatar: account.onlyfans_user_data?.avatar || account.avatar,
                rank: 0, // Will be set after sorting
              });
            }
          }
        }

        // Sort messages by revenue (primary), then by views (secondary), then by view rate (tertiary)
        allMessages.sort((a, b) => {
          if (b.revenue !== a.revenue) {
            return b.revenue - a.revenue;
          }
          if (b.viewedCount !== a.viewedCount) {
            return b.viewedCount - a.viewedCount;
          }
          return b.viewRate - a.viewRate;
        });
        allMessages.forEach((msg, index) => {
          msg.rank = index + 1;
        });

        // Set top performing messages
        setTopPerformingMessages(allMessages.slice(0, 10));

        // Sort leaderboard by total revenue (primary), then view count (secondary), then view rate (tertiary)
        leaderboardData.sort((a, b) => {
          if (b.totalRevenue !== a.totalRevenue) {
            return b.totalRevenue - a.totalRevenue;
          }
          if (b.totalViews !== a.totalViews) {
            return b.totalViews - a.totalViews;
          }
          return b.viewRate - a.viewRate;
        });
        leaderboardData.forEach((item, index) => {
          item.rank = index + 1;
        });

        setTotalMassMessages(totalMessages);
        setMassMessagingLeaderboard(leaderboardData.slice(0, 5)); // Top 5
      }
    } catch (error) {
      console.error("Error fetching total mass messages:", error);
    } finally {
      setIsLoadingMassMessages(false);
    }
  }, [getCurrentDateRange, fetchMassMessagesWithPagination]);

  // CORRECTED: Fetch all data once (proper separation of voice stats and sales stats)
  useEffect(() => {
    // CORRECTED: Fetch voice data separately and only update voice generation stats
    const fetchVoiceData = async () => {
      try {
        const response = await fetch("/api/elevenlabs/total-history");
        if (response.ok) {
          const voiceStats = await response.json();

          // Update vnSalesData with VOICE GENERATION stats only
          setVnSalesData((prev) => ({
            ...prev,
            totalVnCount: voiceStats.totalVoiceGenerated || 0, // From ElevenLabs
            newVnToday: voiceStats.newVoicesToday || 0, // From ElevenLabs
          }));

          console.log("Voice stats fetched:", voiceStats);
        }
      } catch (error) {
        console.error("Error fetching voice data:", error);
      } finally {
        setIsLoadingVoiceStats(false);
      }
    };

    const fetchSwdData = async () => {
      try {
        // Fetch both SWD performance data and script lists
        const [swdResponse, driveResponse] = await Promise.all([
          fetch(`/api/google/swd-data`),
          fetch("/api/google/list-scripts"),
        ]);

        if (swdResponse.ok && driveResponse.ok) {
          const swdStats = await swdResponse.json();
          const driveStats = await driveResponse.json();

          // Calculate leaderboard data for all months (no filtering)
          const creatorStats: Record<string, any> = {};

          // Initialize creator stats from model data
          if (swdStats.modelData) {
            swdStats.modelData.forEach((model: any) => {
              creatorStats[model.creator] = {
                creator: model.creator,
                totalSend: 0,
                totalBuy: 0,
              };
            });
          }

          // Aggregate all send/buy data across all months
          if (swdStats.sendBuyData) {
            swdStats.sendBuyData.forEach((item: any) => {
              if (!creatorStats[item.creator]) {
                creatorStats[item.creator] = {
                  creator: item.creator,
                  totalSend: 0,
                  totalBuy: 0,
                };
              }
              creatorStats[item.creator].totalSend += item.totalSend || 0;
              creatorStats[item.creator].totalBuy += item.totalBuy || 0;
            });
          }

          const creatorStatsArray = Object.values(creatorStats);

          // Create leaderboards
          const totalSendLeaderboard = creatorStatsArray
            .sort((a: any, b: any) => b.totalSend - a.totalSend)
            .slice(0, 5)
            .map((creator: any, index) => ({
              creator: creator.creator,
              amount: creator.totalSend,
              rank: index,
            }));

          const totalBuyLeaderboard = creatorStatsArray
            .sort((a: any, b: any) => b.totalBuy - a.totalBuy)
            .slice(0, 5)
            .map((creator: any, index) => ({
              creator: creator.creator,
              amount: `$${creator.totalBuy.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
              rank: index,
            }));

          // Calculate total revenue from ALL creators (not just top 5)
          const totalRevenueFromAllCreators = creatorStatsArray.reduce(
            (total: number, creator: any) => total + (creator.totalBuy || 0),
            0
          );

          // Count scripts
          const totalDriveScripts = driveStats.documents
            ? driveStats.documents.length
            : 0;
          const totalPerformanceScripts = swdStats.sendBuyData
            ? swdStats.sendBuyData.length
            : 0;

          // Unique scripts (avoid double counting by checking for duplicates)
          const uniqueScriptTitles = new Set();
          if (driveStats.documents) {
            driveStats.documents.forEach((doc: any) =>
              uniqueScriptTitles.add(doc.name.toLowerCase())
            );
          }
          if (swdStats.sendBuyData) {
            swdStats.sendBuyData.forEach((script: any) =>
              uniqueScriptTitles.add(script.scriptTitle.toLowerCase())
            );
          }
          const totalUniqueScripts = uniqueScriptTitles.size;

          setSwdData({
            totalSend: totalSendLeaderboard,
            totalBuy: totalBuyLeaderboard,
            totalScripts: totalUniqueScripts,
            totalDriveScripts,
            totalPerformanceScripts,
            totalRevenue: totalRevenueFromAllCreators,
          });
        }
      } catch (error) {
        console.error("Error fetching SWD data:", error);
      } finally {
        setIsLoadingSwdData(false);
      }
    };

    // Fetch VN sales data, voice data, SWD data, and content data
    fetchVnSalesData(); // Fetch VN sales data
    fetchVoiceData(); // Fetch voice generation data separately
    fetchSwdData();
    fetchContentGenerationData();
  }, []); // Empty dependency array - only run once

  // Add event listener for real-time VN sales updates
  useEffect(() => {
    const handleVnSaleSubmitted = (event: CustomEvent) => {
      console.log("🎉 VN Sale detected in AdminDashboard:", event.detail);

      // Refresh VN sales data when a sale is submitted from other pages
      fetchVnSalesData();
    };

    // Listen for the custom event from AIVoicePage and VNSalesPage
    window.addEventListener(
      "vnSaleSubmitted",
      handleVnSaleSubmitted as EventListener
    );

    return () => {
      window.removeEventListener(
        "vnSaleSubmitted",
        handleVnSaleSubmitted as EventListener
      );
    };
  }, []);

  // Fetch mass messages when component mounts or date range changes
  useEffect(() => {
    // Reset expanded messages when date range changes
    setExpandedMessages(new Set());
    fetchTotalMassMessages();
  }, [fetchTotalMassMessages]); // Re-fetch when date range changes

  // Loading message cycling effect for mass messaging
  useEffect(() => {
    if (!isLoadingMassMessages) {
      setCurrentLoadingMessageIndex(0);
      return;
    }

    const scheduleNextMessage = () => {
      // Random interval between 5-10 seconds (5000-10000ms)
      const randomInterval = Math.floor(Math.random() * 5000) + 5000;

      const timeout = setTimeout(() => {
        setCurrentLoadingMessageIndex(
          (prevIndex) => (prevIndex + 1) % loadingMessages.length
        );
        scheduleNextMessage(); // Schedule the next message change
      }, randomInterval);

      return timeout;
    };

    // Initial delay before first message change (3-7 seconds)
    const initialDelay = Math.floor(Math.random() * 4000) + 3000;
    const initialTimeout = setTimeout(() => {
      setCurrentLoadingMessageIndex(
        (prevIndex) => (prevIndex + 1) % loadingMessages.length
      );
      scheduleNextMessage(); // Start the recurring schedule
    }, initialDelay);

    return () => clearTimeout(initialTimeout);
  }, [isLoadingMassMessages, loadingMessages.length]);

  const vnSales = vnSalesData;

  const roleChartData = Object.entries(stats.usersByRole).map(
    ([role, count]) => ({
      name: role,
      value: count,
      color: ROLE_COLORS[role as keyof typeof ROLE_COLORS] || "#6b7280",
    })
  );

  // CORRECTED: Updated statCards with proper loading states
  const statCards = [
    {
      title: "Total Revenue",
      value: vnSales.totalRevenue,
      formattedValue: `$${vnSales.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      description: `+${analytics.revenueGrowth}% from last week`,
      color: "text-green-600",
      bgColor: "bg-green-50",
      iconBgColor: "bg-green-100",
      prefix: "$",
      suffix: "",
      isLoading: isLoadingVnSales, // Sales loading state
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      formattedValue: stats.totalUsers.toLocaleString(),
      icon: Users,
      description: "All registered users",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      iconBgColor: "bg-gray-100",
      prefix: "",
      suffix: "",
    },
    {
      title: "VN Sales Today",
      value: vnSales.vnSalesToday,
      formattedValue: `$${vnSales.vnSalesToday.toLocaleString()}`,
      icon: DollarSign,
      description: `+${vnSales.vnSalesGrowth}% from yesterday`,
      color: "text-green-600",
      bgColor: "bg-green-50",
      iconBgColor: "bg-green-100",
      prefix: "$",
      suffix: "",
      isLoading: isLoadingVnSales, // Sales loading state
    },
    {
      title: "Total VN Count", // CORRECTED: This tracks voice generation, not sales
      value: vnSales.totalVnCount,
      formattedValue: isLoadingVoiceStats // CORRECTED: Use voice loading state
        ? "Loading..."
        : vnSales.totalVnCount.toLocaleString(),
      icon: FileText,
      description: isLoadingVoiceStats ? ( // CORRECTED: Use voice loading state
        "Fetching from ElevenLabs..."
      ) : (
        <div className="flex items-center space-x-3 text-sm">
          <span className="text-gray-500 dark:text-gray-400">{vnSales.newVnToday} new today</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
            <span className="text-pink-600 font-medium">
              {Object.keys(API_KEY_PROFILES).length} active models
            </span>
          </div>
        </div>
      ),
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      iconBgColor: "bg-blue-100",
      prefix: "",
      suffix: "",
      isLoading: isLoadingVoiceStats, // CORRECTED: Use voice loading state
    },
    {
      title: "Content Generated",
      value: contentGenerationData.totalContentGenerated,
      formattedValue:
        contentGenerationData.totalContentGenerated.toLocaleString(),
      icon: FileText,
      description: `${contentGenerationData.contentGeneratedToday} generated today`,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      iconBgColor: "bg-purple-100",
      prefix: "",
      suffix: "",
      isLoading: false,
    },
    {
      title: "Total Mass Messages",
      value: totalMassMessages,
      formattedValue: isLoadingMassMessages
        ? "Loading..."
        : totalMassMessages.toLocaleString(),
      icon: MessageCircle,
      description: "Total number of mass messages sent",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      iconBgColor: "bg-pink-100",
      prefix: "",
      suffix: "",
      isLoading: isLoadingMassMessages,
    },
    {
      title: "Total Scripts",
      value: swdData.totalScripts,
      formattedValue: isLoadingSwdData
        ? "Loading..."
        : swdData.totalScripts.toLocaleString(),
      icon: FileText,
      description: isLoadingSwdData
        ? "Fetching from Google Drive & Sheets..."
        : `${swdData.totalDriveScripts} from Drive, ${swdData.totalPerformanceScripts} from performance data`,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      iconBgColor: "bg-orange-100",
      prefix: "",
      suffix: "",
      isLoading: isLoadingSwdData,
    },
    {
      title: "SWD Total Revenue",
      value: isLoadingSwdData ? 0 : swdData.totalRevenue,
      formattedValue: isLoadingSwdData
        ? "Loading..."
        : `$${swdData.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      description: isLoadingSwdData
        ? "Fetching from Google Sheets..."
        : `Total revenue from all script creators`,
      color: "text-green-600",
      bgColor: "bg-green-50",
      iconBgColor: "bg-green-100",
      prefix: "$",
      suffix: "",
      isLoading: isLoadingSwdData,
      // Add decimals property for CountUp to show cents
      decimals: 2,
    },
  ];
  return (
    <div className="min-h-screen p-6 space-y-6 bg-gradient-to-br from-gray-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-pink-200 dark:border-pink-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
          <div className="flex items-center space-x-3 mb-2 sm:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Admin Dashboard
            </h1>
            <Sparkles className="h-6 w-6 text-pink-500" />
          </div>
          {/* CORRECTED: Separate refresh buttons for VN Sales and Voice Stats */}
          <div className="flex gap-3">
            <button
              onClick={fetchVnSalesData}
              disabled={isLoadingVnSales}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border border-pink-300 dark:border-pink-500/50 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <DollarSign
                className={`h-4 w-4 mr-2 ${isLoadingVnSales ? "animate-spin" : ""}`}
              />
              {isLoadingVnSales ? "Refreshing Sales..." : "Refresh VN Sales"}
            </button>

            <button
              onClick={fetchVoiceStatsOnly}
              disabled={isLoadingVoiceStats}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border border-pink-300 dark:border-pink-500/50 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <FileText
                className={`h-4 w-4 mr-2 ${isLoadingVoiceStats ? "animate-spin" : ""}`}
              />
              {isLoadingVoiceStats
                ? "Refreshing Voice..."
                : "Refresh Voice Stats"}
            </button>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          Monitor your application&apos;s performance and user activity
        </p>

        {/* CORRECTED: Status indicators showing data sources */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-600 dark:text-gray-300">
              VN Sales: Real-time from Google Sheets
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-gray-600 dark:text-gray-300">
              Voice Generation: Live from ElevenLabs
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 auto-rows-min">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;

          // More fluid responsive classes based on card priority/importance
          const getGridClasses = (index: number) => {
            if (index === 0) {
              // Featured card - takes more space on larger screens
              return "col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 row-span-1";
            } else if (index === 1) {
              // Second priority - medium card
              return "col-span-1 sm:col-span-1 lg:col-span-2 xl:col-span-2 row-span-1";
            } else if (index < 5) {
              // Regular priority cards
              return "col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-2 row-span-1";
            } else {
              // Lower priority cards - smaller on larger screens
              return "col-span-1 row-span-1";
            }
          };

          return (
            <div
              key={index}
              className={`${getGridClasses(index)} bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 lg:p-6 hover:shadow-xl transition-all duration-500 group relative overflow-hidden hover:border-pink-200 dark:hover:border-pink-500/50 min-h-[140px] flex`}
            >
              {/* Animated gradient backgrounds */}
              <div className="absolute -right-6 -top-6 sm:-right-10 sm:-top-10 w-20 h-20 sm:w-40 sm:h-40 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-700" />
              <div className="absolute -left-6 -bottom-6 sm:-left-10 sm:-bottom-10 w-16 h-16 sm:w-32 sm:h-32 bg-gradient-to-tr from-blue-100 to-green-100 dark:from-blue-900/30 dark:to-green-900/30 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-700" />

              <div className="relative z-10 flex flex-col justify-between w-full">
                {index === 0 ? (
                  // Featured card layout - adapts better to different sizes
                  <>
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-2 sm:mb-4 gap-2">
                      <div
                        className={`${stat.iconBgColor} p-2 sm:p-4 rounded-xl sm:rounded-2xl group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon
                          className={`h-5 w-5 sm:h-8 sm:w-8 ${stat.color}`}
                        />
                      </div>
                      <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs">
                        Featured
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm sm:text-lg font-medium text-gray-600 dark:text-gray-300 mb-1 sm:mb-2">
                        {stat.title}
                      </p>
                      <p className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
                        {(stat as any).isLoading ? (
                          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-pink-500" />
                        ) : (
                          <CountUp
                            end={stat.value}
                            duration={2.5}
                            prefix={stat.prefix}
                            suffix={stat.suffix}
                            decimals={(stat as any).decimals || 0}
                          />
                        )}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {stat.description}
                      </p>
                    </div>
                  </>
                ) : (
                  // Regular card layout - more compact and flexible
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 truncate">
                          {stat.title}
                        </p>
                        <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                          {(stat as any).isLoading ? (
                            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-pink-500" />
                          ) : (
                            <CountUp
                              end={stat.value}
                              duration={2.5}
                              prefix={stat.prefix}
                              suffix={stat.suffix}
                              decimals={(stat as any).decimals || 0}
                            />
                          )}
                        </p>
                      </div>
                      <div
                        className={`${stat.iconBgColor} p-1.5 sm:p-2 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ml-2`}
                      >
                        <Icon
                          className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-auto">
                      {stat.description}
                    </p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MM Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Date Range Selector for MM Campaigns */}
        <div className="lg:col-span-2 mb-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Mass Messaging Analytics
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Filter campaigns and leaderboards by date range
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <CalendarDays className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date Range:
                  </Label>
                </div>
                <div className="relative">
                  <Select
                    value={dateRange}
                    onValueChange={(value: "30" | "60" | "90" | "custom") => {
                      setDateRange(value);
                      if (value !== "custom") {
                        setShowCustomDateInputs(false);
                      } else {
                        setShowCustomDateInputs(true);
                      }
                    }}
                  >
                    <SelectTrigger className="w-auto min-w-[180px]">
                      <SelectValue>
                        {dateRange === "custom" &&
                        customStartDate &&
                        customEndDate
                          ? `${DateTime.fromISO(customStartDate).toLocaleString(DateTime.DATE_MED)} - ${DateTime.fromISO(customEndDate).toLocaleString(DateTime.DATE_MED)}`
                          : `Last ${dateRange} days`}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="60">Last 60 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                      <SelectItem value="custom">Custom range</SelectItem>
                    </SelectContent>
                  </Select>

                  {showCustomDateInputs && (
                    <DateRangePicker
                      startDate={customStartDate}
                      endDate={customEndDate}
                      onDateRangeChange={(start, end) => {
                        setCustomStartDate(start);
                        setCustomEndDate(end);
                      }}
                      onClose={() => setShowCustomDateInputs(false)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Top Performing Messages Leaderboard */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-500/50 transition-all duration-300 relative group overflow-hidden">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100/25 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
          </div>
          <CardHeader className="bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                <Trophy className="h-5 w-5 text-pink-500" />
                <span>MM Campaigns Leaderboard</span>
              </CardTitle>
              <button
                onClick={generateCaptions}
                disabled={
                  isGeneratingCaptions || topPerformingMessages.length === 0
                }
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  isGeneratingCaptions || topPerformingMessages.length === 0
                    ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 hover:shadow-lg hover:scale-105"
                }`}
              >
                {isGeneratingCaptions ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                <span>
                  {isGeneratingCaptions ? "Generating..." : "Generate Captions"}
                </span>
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-6 bg-white dark:bg-gray-800">
            <div className="space-y-4">
              {isLoadingMassMessages ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="flex items-center space-x-3">
                    <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
                    <div className="flex flex-col items-start">
                      <div className="h-6 overflow-hidden">
                        <span
                          key={currentLoadingMessageIndex}
                          className="block text-gray-600 dark:text-gray-300 font-medium transition-all duration-700 ease-in-out transform animate-pulse"
                          style={{
                            animation: "fadeInSlideUp 0.7s ease-in-out",
                          }}
                        >
                          {loadingMessages[currentLoadingMessageIndex]}
                        </span>
                      </div>
                      <div className="flex space-x-1 mt-2">
                        {loadingMessages.map((_, index) => (
                          <div
                            key={index}
                            className={`h-1 w-3 rounded-full transition-all duration-500 ${
                              index === currentLoadingMessageIndex
                                ? "bg-pink-500 scale-110"
                                : "bg-gray-300 dark:bg-gray-600"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 text-center max-w-md">
                    This may take a moment as we fetch and analyze data from
                    multiple accounts...
                  </div>
                </div>
              ) : topPerformingMessages.length > 0 ? (
                <>
                  {topPerformingMessages.slice(0, 5).map((message) => {
                    const getRankIcon = (rank: number) => {
                      switch (rank) {
                        case 1:
                          return <Trophy className="h-5 w-5 text-yellow-500" />;
                        case 2:
                          return <Medal className="h-5 w-5 text-gray-400 dark:text-gray-500" />;
                        case 3:
                          return <Award className="h-5 w-5 text-amber-600" />;
                        default:
                          return (
                            <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-bold">
                              {rank}
                            </div>
                          );
                      }
                    };

                    const getRankStyle = (rank: number) => {
                      switch (rank) {
                        case 1:
                          return "bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border-yellow-200 dark:border-yellow-500/50 hover:border-yellow-300 dark:hover:border-yellow-400/70";
                        case 2:
                          return "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500";
                        case 3:
                          return "bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200 dark:border-amber-500/50 hover:border-amber-300 dark:hover:border-amber-400/70";
                        default:
                          return "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500";
                      }
                    };

                    return (
                      <div
                        key={`message-${message.id}`}
                        className={`flex flex-col p-4 rounded-lg border ${getRankStyle(message.rank)} transition-all duration-300 hover:scale-[1.01] hover:shadow-md relative group overflow-hidden`}
                      >
                        {/* Glass reflection effect for individual message items */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-in-out"></div>
                        </div>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            {getRankIcon(message.rank)}
                            <div className="flex items-center space-x-3">
                              {message.modelAvatar ? (
                                <Image
                                  src={`/api/image-proxy?url=${message.modelAvatar}`}
                                  alt={message.modelName}
                                  width={32}
                                  height={32}
                                  className="h-8 w-8 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                  <span className="text-white font-bold text-sm">
                                    {message.modelName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div>
                                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                  {message.modelName}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  @{message.modelUsername}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={message.isFree ? "secondary" : "default"}
                              className={
                                message.isFree
                                  ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600"
                                  : "bg-black dark:bg-gray-900 text-white border-black dark:border-gray-700"
                              }
                            >
                              {message.isFree ? "Free" : "Paid"}
                            </Badge>
                            {!message.isFree && message.price && (
                              <Badge className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/50">
                                ${message.price}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            <div
                              className={`transition-all duration-300 ease-in-out ${expandedMessages.has(message.id) ? "max-h-none" : "line-clamp-2"}`}
                              dangerouslySetInnerHTML={{
                                __html: expandedMessages.has(message.id)
                                  ? message.text
                                  : message.textCropped,
                              }}
                            />
                            {/* Show read more button if the full text is longer than the cropped text or if text is longer than 150 characters */}
                            {message.text &&
                              (message.text.length > 150 ||
                                (message.textCropped &&
                                  message.text.length >
                                    message.textCropped.length)) && (
                                <button
                                  onClick={() =>
                                    toggleMessageExpansion(message.id)
                                  }
                                  className="inline-flex items-center mt-2 px-2 py-1 text-xs text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-md font-medium transition-all duration-200 border border-transparent hover:border-pink-200 dark:hover:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-20"
                                >
                                  {expandedMessages.has(message.id) ? (
                                    <>
                                      <span>Read less</span>
                                      <ChevronUp className="h-3 w-3 ml-1 transition-transform duration-200" />
                                    </>
                                  ) : (
                                    <>
                                      <span>Read more</span>
                                      <ChevronDown className="h-3 w-3 ml-1 transition-transform duration-200" />
                                    </>
                                  )}
                                </button>
                              )}
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {new Date(message.date).toLocaleDateString()} at{" "}
                            {new Date(message.date).toLocaleTimeString()}
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-6">
                            <div className="text-center">
                              <p className="font-bold text-lg sm:text-xl text-pink-600 dark:text-pink-400">
                                {message.viewedCount.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">views</p>
                            </div>
                            <div className="text-center">
                              <p className="font-semibold text-base sm:text-lg text-gray-700 dark:text-gray-300">
                                {message.sentCount.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">sent</p>
                            </div>
                            <div className="text-center">
                              <p className="font-semibold text-base sm:text-lg text-green-600 dark:text-green-400">
                                {message.viewRate.toFixed(1)}%
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">view rate</p>
                            </div>
                            {!message.isFree && (
                              <>
                                <div className="text-center">
                                  <p className="font-semibold text-base sm:text-lg text-purple-600 dark:text-purple-400">
                                    {message.purchasedCount}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    purchases
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="font-semibold text-base sm:text-lg text-yellow-600 dark:text-yellow-400">
                                    ${message.revenue.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    revenue
                                  </p>
                                </div>
                              </>
                            )}
                          </div>

                          {message.rank === 1 && (
                            <div className="flex items-center">
                              <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded-full border border-yellow-200 dark:border-yellow-500/50">
                                👑 Top Message
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div className="text-center text-gray-500 dark:text-gray-400 py-4 border-t border-gray-200 dark:border-gray-600 mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm">
                          Top Message Views:{" "}
                          <span className="text-pink-600 dark:text-pink-400 font-semibold">
                            {topPerformingMessages[0]?.viewedCount.toLocaleString() ||
                              "0"}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm">
                          Avg View Rate (Top 5):{" "}
                          <span className="text-green-600 dark:text-green-400 font-semibold">
                            {topPerformingMessages.length > 0
                              ? (
                                  topPerformingMessages
                                    .slice(0, 5)
                                    .reduce(
                                      (sum, msg) => sum + msg.viewRate,
                                      0
                                    ) /
                                  Math.min(5, topPerformingMessages.length)
                                ).toFixed(1)
                              : 0}
                            %
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm">
                          Total Messages Analyzed:{" "}
                          <span className="text-purple-600 dark:text-purple-400 font-semibold">
                            {topPerformingMessages.length.toLocaleString()}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    No mass messaging data found. Start sending campaigns to see
                    the top performing messages!
                  </p>
                </div>
              )}
            </div>
            {/* Generated Captions Section */}
            {showGeneratedCaptions && generatedCaptions.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    <span>AI-Generated Captions</span>
                  </h3>
                  <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/50">
                    {generatedCaptions.length} Generated
                  </Badge>
                </div>
                <div className="space-y-3">
                  {generatedCaptions.map((caption, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-500/30 hover:border-purple-300 dark:hover:border-purple-400/50 transition-all duration-300 group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                              Caption #{index + 1}
                            </span>
                            <Badge
                              variant="secondary"
                              className="bg-white/50 dark:bg-gray-800/50 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30 text-xs"
                            >
                              AI Generated
                            </Badge>
                          </div>

                          {/* Display caption with paragraph breaks */}
                          <div className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
                            {caption
                              .split("\n\n")
                              .map((paragraph, paragraphIndex) => (
                                <p
                                  key={paragraphIndex}
                                  className="mb-3 last:mb-0"
                                >
                                  {paragraph}
                                </p>
                              ))}
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            copyToClipboard(caption, `caption-${index}`)
                          }
                          className={`ml-3 p-2 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                            copiedCaptionId === `caption-${index}`
                              ? "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30"
                              : "text-gray-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white/50 dark:hover:bg-gray-700/50"
                          }`}
                          title={
                            copiedCaptionId === `caption-${index}`
                              ? "Copied!"
                              : "Copy caption"
                          }
                        >
                          {copiedCaptionId === `caption-${index}` ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    💡 These captions are generated with proper paragraph
                    structure based on your top-performing messages. Review and
                    customize them before use.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* MM Campaign Leaderboards */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-500/50 transition-all duration-300 relative group overflow-hidden">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100/25 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
          </div>
          <CardHeader className="bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 border-b border-gray-200 dark:border-gray-600">
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span>MM Campaign Champion Leaderboards</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white dark:bg-gray-800">
            <div className="space-y-4">
              {isLoadingMassMessages ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="flex items-center space-x-3">
                    <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
                    <div className="flex flex-col items-start">
                      <div className="h-6 overflow-hidden">
                        <span
                          key={currentLoadingMessageIndex}
                          className="block text-gray-600 dark:text-gray-300 font-medium transition-all duration-700 ease-in-out transform animate-pulse"
                          style={{
                            animation: "fadeInSlideUp 0.7s ease-in-out",
                          }}
                        >
                          {loadingMessages[currentLoadingMessageIndex]}
                        </span>
                      </div>
                      <div className="flex space-x-1 mt-2">
                        {loadingMessages.map((_, index) => (
                          <div
                            key={index}
                            className={`h-1 w-3 rounded-full transition-all duration-500 ${
                              index === currentLoadingMessageIndex
                                ? "bg-pink-500 scale-110"
                                : "bg-gray-300 dark:bg-gray-600"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 text-center max-w-md">
                    Calculating campaign performance metrics across all
                    models...
                  </div>
                </div>
              ) : massMessagingLeaderboard.length > 0 ? (
                <>
                  {massMessagingLeaderboard.map((model, index) => {
                    const getTrophyIcon = (rank: number) => {
                      switch (rank) {
                        case 1:
                          return <Trophy className="h-6 w-6 text-yellow-500" />;
                        case 2:
                          return <Medal className="h-6 w-6 text-gray-400 dark:text-gray-500" />;
                        case 3:
                          return <Award className="h-6 w-6 text-amber-600" />;
                        default:
                          return (
                            <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-sm font-bold">
                              {rank}
                            </div>
                          );
                      }
                    };

                    const getRankStyle = (rank: number) => {
                      switch (rank) {
                        case 1:
                          return "bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border-yellow-200 dark:border-yellow-500/50 hover:border-yellow-300 dark:hover:border-yellow-400/70";
                        case 2:
                          return "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500";
                        case 3:
                          return "bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200 dark:border-amber-500/50 hover:border-amber-300 dark:hover:border-amber-400/70";
                        default:
                          return "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500";
                      }
                    };

                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${getRankStyle(model.rank)} transition-all duration-300 hover:scale-[1.02] hover:shadow-md relative group overflow-hidden`}
                      >
                        {/* Glass reflection effect for individual model items */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-in-out"></div>
                        </div>
                        <div className="space-y-4">
                          {/* Header with model info */}
                          <div className="flex items-center space-x-3">
                            {getTrophyIcon(model.rank)}
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              {model.avatar ? (
                                <Image
                                  src={`/api/image-proxy?url=${model.avatar}`}
                                  alt={model.name}
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-gray-600 flex-shrink-0"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-bold text-lg">
                                    {model.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                  {model.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                  @{model.username}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Main stats - responsive grid */}
                          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div className="text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-500/30">
                              <p className="font-bold text-lg sm:text-xl text-green-600 dark:text-green-400">
                                ${model.totalRevenue.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                total revenue
                              </p>
                            </div>
                            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-500/30">
                              <p className="font-bold text-lg sm:text-xl text-purple-600 dark:text-purple-400">
                                {model.totalViews.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                total views
                              </p>
                            </div>
                            <div className="text-center p-3 bg-pink-50 dark:bg-pink-900/30 rounded-lg border border-pink-200 dark:border-pink-500/30 xs:col-span-2 lg:col-span-1">
                              <p className="font-bold text-lg sm:text-xl text-pink-600 dark:text-pink-400">
                                {model.viewRate.toFixed(1)}%
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">view rate</p>
                            </div>
                          </div>

                          {/* Message breakdown */}
                          <div className="flex flex-wrap items-center justify-center gap-3">
                            <div className="flex items-center space-x-1 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full border border-green-200 dark:border-green-500/30">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                {model.freeMessages} free
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded-full border border-yellow-200 dark:border-yellow-500/30">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                                {model.paidMessages} paid
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded-full border border-orange-200 dark:border-orange-500/30">
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                {model.totalPurchases} purchases
                              </span>
                            </div>
                          </div>

                          {/* Additional details */}
                          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>
                              Avg Price:{" "}
                              <span className="text-green-600 dark:text-green-400 font-medium">
                                ${model.averagePrice.toFixed(2)}
                              </span>
                            </span>
                            <span>
                              {model.totalMessages} msgs •{" "}
                              {model.totalSent.toLocaleString()} sent
                            </span>
                          </div>

                          {/* Rank badges */}
                          <div className="flex justify-center">
                            {model.rank === 1 && (
                              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full border border-green-200 dark:border-green-500/30 font-medium">
                                💰 Revenue Champion
                              </span>
                            )}
                            {model.rank === 2 && (
                              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600 font-medium">
                                🥈 Runner-up
                              </span>
                            )}
                            {model.rank === 3 && (
                              <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-500/30 font-medium">
                                🥉 Third Place
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="text-center text-gray-500 dark:text-gray-400 py-4 border-t border-gray-200 dark:border-gray-600 mt-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
                      <div className="p-2">
                        <p className="text-sm">
                          Total Messages:{" "}
                          <span className="text-orange-600 dark:text-orange-400 font-semibold block sm:inline">
                            {totalMassMessages.toLocaleString()}
                          </span>
                        </p>
                      </div>
                      <div className="p-2">
                        <p className="text-sm">
                          Total Revenue:{" "}
                          <span className="text-green-600 dark:text-green-400 font-semibold block sm:inline">
                            $
                            {massMessagingLeaderboard
                              .reduce(
                                (sum, model) => sum + model.totalRevenue,
                                0
                              )
                              .toLocaleString()}
                          </span>
                        </p>
                      </div>
                      <div className="p-2 col-span-2 sm:col-span-1">
                        <p className="text-sm">
                          Total Views:{" "}
                          <span className="text-purple-600 dark:text-purple-400 font-semibold block sm:inline">
                            {massMessagingLeaderboard
                              .reduce((sum, model) => sum + model.totalViews, 0)
                              .toLocaleString()}
                          </span>
                        </p>
                      </div>
                      <div className="p-2">
                        <p className="text-sm">
                          Avg View Rate:{" "}
                          <span className="text-pink-600 dark:text-pink-400 font-semibold block sm:inline">
                            {massMessagingLeaderboard.length > 0
                              ? (
                                  massMessagingLeaderboard.reduce(
                                    (sum, model) => sum + model.viewRate,
                                    0
                                  ) / massMessagingLeaderboard.length
                                ).toFixed(1)
                              : 0}
                            %
                          </span>
                        </p>
                      </div>
                      <div className="p-2">
                        <p className="text-sm">
                          Total Purchases:{" "}
                          <span className="text-orange-600 dark:text-orange-400 font-semibold block sm:inline">
                            {massMessagingLeaderboard
                              .reduce(
                                (sum, model) => sum + model.totalPurchases,
                                0
                              )
                              .toLocaleString()}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    No mass messaging data found. Start sending campaigns to see
                    the leaderboard!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SWD Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Send Leaderboard */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-500/50 transition-all duration-300 relative group overflow-hidden">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100/25 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
          </div>
          <CardHeader className="bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 border-b border-gray-200 dark:border-gray-600">
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
              <Trophy className="h-5 w-5 text-purple-500" />
              <span>SWD Total Send Leaderboard</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white dark:bg-gray-800">
            <div className="space-y-4">
              {isLoadingSwdData ? (
                <div className="flex justify-center py-8">
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin mr-2 text-purple-500" />
                    <span>Loading SWD leaderboard...</span>
                  </div>
                </div>
              ) : swdData.totalSend.length > 0 ? (
                <>
                  {swdData.totalSend.map((entry, index) => {
                    const getRankIcon = (rank: number) => {
                      switch (rank) {
                        case 0:
                          return <Trophy className="h-6 w-6 text-yellow-500" />;
                        case 1:
                          return <Medal className="h-6 w-6 text-gray-400 dark:text-gray-500" />;
                        case 2:
                          return <Award className="h-6 w-6 text-amber-600" />;
                        default:
                          return (
                            <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-sm font-bold">
                              {rank + 1}
                            </div>
                          );
                      }
                    };

                    const getRankStyle = (rank: number) => {
                      switch (rank) {
                        case 0:
                          return "bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border-yellow-200 dark:border-yellow-500/50 hover:border-yellow-300 dark:hover:border-yellow-400/70";
                        case 1:
                          return "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500";
                        case 2:
                          return "bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200 dark:border-amber-500/50 hover:border-amber-300 dark:hover:border-amber-400/70";
                        default:
                          return "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500";
                      }
                    };

                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-4 rounded-lg border ${getRankStyle(entry.rank)} transition-all duration-300 hover:scale-[1.02] hover:shadow-md`}
                      >
                        <div className="flex items-center space-x-4">
                          {getRankIcon(entry.rank)}
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">
                              {entry.creator}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {entry.amount.toLocaleString()} total sent
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-purple-600 dark:text-purple-400">
                            #{entry.rank + 1}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    No SWD send data found. Upload script performance data to
                    see the leaderboard!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Total Buy Leaderboard */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-500/50 transition-all duration-300 relative group overflow-hidden">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100/25 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
          </div>
          <CardHeader className="bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 border-b border-gray-200 dark:border-gray-600">
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span>SWD Total Buy Leaderboard</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white dark:bg-gray-800">
            <div className="space-y-4">
              {isLoadingSwdData ? (
                <div className="flex justify-center py-8">
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin mr-2 text-green-500" />
                    <span>Loading SWD leaderboard...</span>
                  </div>
                </div>
              ) : swdData.totalBuy.length > 0 ? (
                <>
                  {swdData.totalBuy.map((entry, index) => {
                    const getRankIcon = (rank: number) => {
                      switch (rank) {
                        case 0:
                          return <Trophy className="h-6 w-6 text-yellow-500" />;
                        case 1:
                          return <Medal className="h-6 w-6 text-gray-400 dark:text-gray-500" />;
                        case 2:
                          return <Award className="h-6 w-6 text-amber-600" />;
                        default:
                          return (
                            <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-sm font-bold">
                              {rank + 1}
                            </div>
                          );
                      }
                    };

                    const getRankStyle = (rank: number) => {
                      switch (rank) {
                        case 0:
                          return "bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border-yellow-200 dark:border-yellow-500/50 hover:border-yellow-300 dark:hover:border-yellow-400/70";
                        case 1:
                          return "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500";
                        case 2:
                          return "bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200 dark:border-amber-500/50 hover:border-amber-300 dark:hover:border-amber-400/70";
                        default:
                          return "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500";
                      }
                    };

                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-4 rounded-lg border ${getRankStyle(entry.rank)} transition-all duration-300 hover:scale-[1.02] hover:shadow-md`}
                      >
                        <div className="flex items-center space-x-4">
                          {getRankIcon(entry.rank)}
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">
                              {entry.creator}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Revenue generated
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600 dark:text-green-400">
                            {entry.amount}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            #{entry.rank + 1}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    No SWD buy data found. Upload script performance data to see
                    the leaderboard!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VN Sales by Model - CORRECTED WITH REAL DATA */}
        <Card className="bg-white dark:bg-gray-800 border border-pink-200 dark:border-pink-500/30 hover:border-pink-300 dark:hover:border-pink-500/50 transition-all duration-300 relative group overflow-hidden">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100/25 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
          </div>
          <CardHeader className="bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 border-b border-pink-200 dark:border-pink-500/30">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                <DollarSign className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                <span>VN Sales by Model</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <button
                  onClick={fetchVnSalesData}
                  disabled={isLoadingVnSales}
                  className="inline-flex items-center px-3 py-1 bg-white dark:bg-gray-700 hover:bg-pink-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border border-pink-200 dark:border-pink-500/30 rounded-md transition-all duration-300 text-sm"
                >
                  {isLoadingVnSales ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  Refresh
                </button>
                {vnSales.salesByModel && vnSales.salesByModel.length > 0 && (
                  <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-500/30 text-xs">
                    {vnSales.salesByModel.length} Models
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 bg-white dark:bg-gray-800">
            <div className="space-y-4">
              {isLoadingVnSales ? (
                <div className="flex justify-center py-8">
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin mr-2 text-orange-500 dark:text-orange-400" />
                    <span>Loading VN sales data...</span>
                  </div>
                </div>
              ) : vnSales.salesByModel && vnSales.salesByModel.length > 0 ? (
                <>
                  {vnSales.salesByModel.map((model: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-pink-200 dark:border-pink-500/30 hover:border-pink-300 dark:hover:border-pink-500/50 transition-all duration-300 hover:shadow-sm"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-full">
                          <Mic className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            {model.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {model.sales} VN sales
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600 dark:text-green-400">
                          ${model.revenue.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {model.loyaltyPoints} loyalty pts
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Summary section */}
                  <div className="text-center text-gray-500 dark:text-gray-400 py-4 border-t border-pink-200 dark:border-pink-500/30 mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm">
                          Total Models:
                          <span className="text-orange-600 dark:text-orange-400 font-semibold ml-1">
                            {vnSales.salesByModel.length}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm">
                          Total Sales:
                          <span className="text-blue-600 dark:text-blue-400 font-semibold ml-1">
                            {vnSales.salesByModel.reduce(
                              (sum: number, model: any) => sum + model.sales,
                              0
                            )}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm">
                          Average VN Price:
                          <span className="text-purple-600 font-semibold ml-1">
                            ${vnSales.averageVnPrice.toFixed(2)}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Real-time indicator */}
                    <div className="flex items-center justify-center mt-3 text-xs text-gray-400 dark:text-gray-500">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                      <span>
                        Last updated: {new Date().toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full">
                      <DollarSign className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                        No VN sales data found
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                        Submit some voice note sales to see analytics by model!
                      </p>
                    </div>
                    <button
                      onClick={fetchVnSalesData}
                      className="mt-2 inline-flex items-center px-3 py-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-sm rounded-md transition-all duration-300"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Check for Sales
                    </button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Content Generation by Tracker */}
        <Card className="bg-white dark:bg-gray-800 border border-pink-200 dark:border-pink-500/30 hover:border-pink-300 dark:hover:border-pink-500/50 transition-all duration-300 relative group overflow-hidden">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
          </div>
          <CardHeader className="bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 border-b border-pink-200 dark:border-pink-500/30">
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <span>Content Generation by Tracker</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white dark:bg-gray-800">
            <div className="space-y-4">
              {isLoadingContentStats ? (
                <div className="flex justify-center py-8">
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin mr-2 text-pink-500" />
                    <span>Fetching content data from Google Sheets...</span>
                  </div>
                </div>
              ) : contentGenerationData.contentByTracker.length > 0 ? (
                <>
                  {contentGenerationData.contentByTracker.map(
                    (tracker, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-pink-200 dark:border-pink-500/30 hover:border-pink-300 dark:hover:border-pink-500/50 transition-all duration-300"
                      >
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            {tracker.tracker}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Content generation tracker
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-purple-600 dark:text-purple-400">
                            {tracker.count.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            items generated
                          </p>
                        </div>
                      </div>
                    )
                  )}
                  <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                    <p className="text-sm">
                      Total Content Generated:{" "}
                      <span className="text-purple-600 dark:text-purple-400 font-semibold">
                        {contentGenerationData.totalContentGenerated.toLocaleString()}{" "}
                      </span>{" "}
                      (+{contentGenerationData.contentGrowth}% growth)
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                  <p className="text-sm">
                    No content generation data found. Generate some content to
                    see analytics!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users Table */}
        <Card className="bg-white dark:bg-gray-800 border border-pink-200 dark:border-pink-500/30 hover:border-pink-300 dark:hover:border-pink-500/50 transition-all duration-300 relative group overflow-hidden">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100/25 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
          </div>
          <CardHeader className="bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 border-b border-pink-200 dark:border-pink-500/30">
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
              <Calendar className="h-5 w-5 text-purple-500" />
              <span>Recent Users</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white dark:bg-gray-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-pink-200 dark:border-pink-500/30">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      User
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Role
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.slice(0, 5).map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-pink-200 dark:border-pink-500/30 hover:bg-pink-50 dark:hover:bg-gray-700/50 transition-colors duration-300"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          {user.image ? (
                            <Image
                              src={`/api/image-proxy?url=${user.image}`}
                              alt={user.name || ""}
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded-full object-cover border border-pink-200 dark:border-pink-500/30"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            </div>
                          )}
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {user.name || "No name"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{user.email}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="secondary"
                          className={`
                            ${user.role === "ADMIN" ? "bg-black text-white border-black" : ""}
                            ${user.role === "MODERATOR" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-500/30" : ""}
                            ${user.role === "USER" ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-500/30" : ""}
                            ${user.role === "GUEST" ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600" : ""}
                          `}
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
                        {formatForDisplay(user.createdAt, 'date')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Table */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-500/50 transition-all duration-300 relative group overflow-hidden">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
          </div>
          <CardHeader className="bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 border-b border-gray-200 dark:border-gray-600">
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
              <Activity className="h-5 w-5 text-green-500" />
              <span>Recent Content Generation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white dark:bg-gray-800">
            {isLoadingContentStats ? (
              <div className="flex justify-center py-8">
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                  <Loader2 className="h-6 w-6 animate-spin mr-2 text-pink-500" />
                  <span>Loading recent activity...</span>
                </div>
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-600">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        User
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Model
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Activity
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Tracker
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivities.slice(0, 5).map((activity, index) => {
                      return (
                        <tr
                          key={index}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-300"
                        >
                          <td className="py-2 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                {activity.image ? (
                                  <img
                                    src={`/api/image-proxy?url=${encodeURIComponent(activity.image)}`}
                                    alt={activity.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.style.display = "none";
                                      const fallback =
                                        target.nextSibling as HTMLElement;
                                      if (fallback)
                                        fallback.style.display = "flex";
                                    }}
                                  />
                                ) : null}
                                <div
                                  className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
                                  style={{
                                    display: activity.image ? "none" : "flex",
                                  }}
                                >
                                  <span className="text-white text-sm font-medium">
                                    {activity.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {activity.name}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                  {formatForDisplay(activity.createdAt, 'relative')}
                                </p>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {activity.tracker}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-700 dark:text-gray-300 text-sm">
                            <div className="max-w-[120px] truncate">
                              {activity.model || "N/A"}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-700 dark:text-gray-300 text-sm">
                            Generated content
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant="secondary"
                              className={`text-xs
                                ${activity.tracker === "VIP Gen Tracker" ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-500/30" : ""}
                                ${activity.tracker === "Live Gen Tracker" ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-500/30" : ""}
                                ${activity.tracker === "FTT Gen Tracker" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-500/30" : ""}
                                ${activity.tracker === "AI Gen Tracker" ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-500/30" : ""}
                              `}
                            >
                              {activity.tracker.replace(" Gen Tracker", "")}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">
                  No recent content generation activity found
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-500/50 transition-all duration-300 relative group overflow-hidden">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100/25 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
          </div>
          <CardHeader className="bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 border-b border-gray-200 dark:border-gray-600">
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
              <Activity className="h-5 w-5 text-pink-500" />
              <span>User Growth (12 Months)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white dark:bg-gray-800">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#6b7280" }}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#6b7280" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--foreground)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#ec4899"
                  strokeWidth={3}
                  dot={{ fill: "#ec4899", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Users by Role Chart */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-500/50 transition-all duration-300 relative group overflow-hidden">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100/25 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
          </div>
          <CardHeader className="bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 border-b border-gray-200 dark:border-gray-600">
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
              <UserCheck className="h-5 w-5 text-green-500" />
              <span>Users by Role</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white dark:bg-gray-800">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roleChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--foreground)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
