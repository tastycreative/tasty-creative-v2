"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  TrendingUp,
  Activity,
  CreditCard,
  Search,
  Download,
  Calendar,
  Filter,
  BarChart3,
  Zap,
  Clock,
  User,
  Loader2,
  RefreshCw,
  MoreVertical,
  Copy,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Minus,
  FileText,
  Mic,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Helper function to format dates
const formatDate = (date: Date, formatStr: string) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  if (formatStr === "yyyy-MM-dd HH:mm:ss") {
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
  if (formatStr === "MMM dd, yyyy") {
    return `${monthNames[d.getMonth()]} ${day}, ${year}`;
  }
  if (formatStr === "HH:mm:ss") {
    return `${hours}:${minutes}:${seconds}`;
  }
  if (formatStr === "yyyy-MM-dd") {
    return `${year}-${month}-${day}`;
  }
  return d.toISOString();
};

interface GenerationRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  voiceName: string;
  text: string;
  charactersUsed: number;
  accountKey: string;
  generatedAt: Date;
  createdAt: Date;
}

interface UserStats {
  userId: string;
  userName: string;
  userEmail: string;
  totalGenerations: number;
  totalCredits: number;
  lastGeneration: Date;
  averageCredits: number;
}

export default function GenerationTrackerPage() {
  const [generations, setGenerations] = useState<GenerationRecord[]>([]);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterBy, setFilterBy] = useState<"all" | "user" | "voice" | "account">("all");
  const [sortBy, setSortBy] = useState<"date" | "credits" | "user">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month">("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedVoice, setSelectedVoice] = useState<string>("all");
  const [topUsersTimeRange, setTopUsersTimeRange] = useState<"all" | "today" | "week" | "month">("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Stats
  const [totalGenerations, setTotalGenerations] = useState(0);
  const [totalCreditsUsed, setTotalCreditsUsed] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [averageCreditsPerGen, setAverageCreditsPerGen] = useState(0);

  // Previous stats for trend indicators
  const [prevStats, setPrevStats] = useState({
    generations: 0,
    credits: 0,
    users: 0,
    average: 0,
  });

  // Mobile view state
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    loadGenerations();
    
    // Check if mobile view
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    calculateStats();
  }, [generations]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadGenerations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/generations/list");
      if (response.ok) {
        const data = await response.json();
        setGenerations(data.generations || []);
        setUserStats(data.userStats || []);
      }
    } catch (error) {
      console.error("Error loading generations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = () => {
    const total = generations.length;
    const credits = generations.reduce((sum, gen) => sum + (gen.charactersUsed || 0), 0);
    const uniqueUsers = new Set(generations.map((gen) => gen.userId)).size;
    const avg = total > 0 ? Math.round(credits / total) : 0;

    setTotalGenerations(total);
    setTotalCreditsUsed(credits);
    setActiveUsers(uniqueUsers);
    setAverageCreditsPerGen(avg);
  };

  const filterGenerations = () => {
    let filtered = [...generations];

    // Apply date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const cutoff = new Date();

      switch (dateRange) {
        case "today":
          cutoff.setHours(0, 0, 0, 0);
          break;
        case "week":
          cutoff.setDate(now.getDate() - 7);
          break;
        case "month":
          cutoff.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter((gen) => new Date(gen.generatedAt) >= cutoff);
    }

    // Apply user filter
    if (selectedUser !== "all") {
      filtered = filtered.filter((gen) => gen.userId === selectedUser);
    }

    // Apply voice filter
    if (selectedVoice !== "all") {
      filtered = filtered.filter((gen) => gen.voiceName === selectedVoice);
    }

    // Apply search query (use debounced search)
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (gen) =>
          gen.userName.toLowerCase().includes(query) ||
          gen.userEmail.toLowerCase().includes(query) ||
          gen.voiceName.toLowerCase().includes(query) ||
          gen.text.toLowerCase().includes(query) ||
          gen.accountKey.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "date":
          comparison = new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime();
          break;
        case "credits":
          comparison = a.charactersUsed - b.charactersUsed;
          break;
        case "user":
          comparison = a.userName.localeCompare(b.userName);
          break;
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    return filtered;
  };

  // Get unique voice names for filter
  const availableVoices = useMemo(() => {
    const voices = new Set(generations.map((g) => g.voiceName));
    return Array.from(voices).sort();
  }, [generations]);

  // Get credit badge color
  const getCreditColor = useCallback((credits: number) => {
    if (credits < 1000) return "bg-green-500/20 text-green-400 border-green-500/50";
    if (credits < 5000) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    return "bg-red-500/20 text-red-400 border-red-500/50";
  }, []);

  // Calculate trends
  const calculateTrends = useCallback(() => {
    const currentTotal = generations.length;
    const currentCredits = generations.reduce((sum, g) => sum + (g.charactersUsed || 0), 0);
    const currentUsers = new Set(generations.map((g) => g.userId)).size;
    const currentAvg = currentTotal > 0 ? currentCredits / currentTotal : 0;

    return {
      generations: prevStats.generations !== 0 
        ? ((currentTotal - prevStats.generations) / prevStats.generations) * 100 
        : 0,
      credits: prevStats.credits !== 0 
        ? ((currentCredits - prevStats.credits) / prevStats.credits) * 100 
        : 0,
      users: prevStats.users !== 0 
        ? ((currentUsers - prevStats.users) / prevStats.users) * 100 
        : 0,
      average: prevStats.average !== 0 
        ? ((currentAvg - prevStats.average) / prevStats.average) * 100 
        : 0,
    };
  }, [generations, prevStats]);

  const trends = useMemo(() => calculateTrends(), [calculateTrends]);

  const exportToCSV = () => {
    const filtered = filterGenerations();
    const headers = ["Date", "User", "Email", "Voice", "Credits Used", "Account", "Text Preview"];
    const rows = filtered.map((gen) => [
      formatDate(new Date(gen.generatedAt), "yyyy-MM-dd HH:mm:ss"),
      gen.userName,
      gen.userEmail,
      gen.voiceName,
      gen.charactersUsed.toString(),
      gen.accountKey,
      gen.text.substring(0, 100).replace(/,/g, ";"),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `generations_${formatDate(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredGenerations = filterGenerations();
  
  // Pagination logic
  const totalPages = Math.ceil(filteredGenerations.length / itemsPerPage);
  const paginatedGenerations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredGenerations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredGenerations, currentPage, itemsPerPage]);
  
  // Calculate top users based on time range
  const getTopUsers = () => {
    let filteredGens = [...generations];

    // Apply time filter for top users
    if (topUsersTimeRange !== "all") {
      const now = new Date();
      const cutoff = new Date();

      switch (topUsersTimeRange) {
        case "today":
          cutoff.setHours(0, 0, 0, 0);
          break;
        case "week":
          cutoff.setDate(now.getDate() - 7);
          break;
        case "month":
          cutoff.setDate(now.getDate() - 30);
          break;
      }

      filteredGens = filteredGens.filter((gen) => new Date(gen.generatedAt) >= cutoff);
    }

    // Group by user and count generations
    const userMap = new Map();
    filteredGens.forEach((gen) => {
      if (!userMap.has(gen.userId)) {
        userMap.set(gen.userId, {
          userId: gen.userId,
          userName: gen.userName,
          userEmail: gen.userEmail,
          totalGenerations: 0,
          totalCredits: 0,
        });
      }
      const user = userMap.get(gen.userId);
      user.totalGenerations += 1;
      user.totalCredits += gen.charactersUsed || 0;
    });

    // Convert to array and sort by generations
    return Array.from(userMap.values())
      .sort((a, b) => b.totalGenerations - a.totalGenerations)
      .slice(0, 5);
  };

  const topUsers = getTopUsers();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50 to-rose-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400">
              Generation Tracker
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Monitor all voice generations and user activity
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadGenerations}
              disabled={isLoading}
              className="bg-white dark:bg-gray-800"
            >
              <RefreshCw size={16} className={`mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="bg-white dark:bg-gray-800"
            >
              <Download size={16} className="mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm border-pink-200 dark:border-pink-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center justify-between">
                <span className="flex items-center">
                  <Activity size={16} className="mr-2" />
                  Total Generations
                </span>
                {trends.generations !== 0 && (
                  <span className={`flex items-center text-xs ${trends.generations > 0 ? 'text-green-500' : trends.generations < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                    {trends.generations > 0 ? <ArrowUp size={14} /> : trends.generations < 0 ? <ArrowDown size={14} /> : <Minus size={14} />}
                    {Math.abs(trends.generations).toFixed(1)}%
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {totalGenerations.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                All time
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm border-pink-200 dark:border-pink-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center justify-between">
                <span className="flex items-center">
                  <CreditCard size={16} className="mr-2" />
                  Total Credits Used
                </span>
                {trends.credits !== 0 && (
                  <span className={`flex items-center text-xs ${trends.credits > 0 ? 'text-green-500' : trends.credits < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                    {trends.credits > 0 ? <ArrowUp size={14} /> : trends.credits < 0 ? <ArrowDown size={14} /> : <Minus size={14} />}
                    {Math.abs(trends.credits).toFixed(1)}%
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {totalCreditsUsed.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Characters generated
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm border-pink-200 dark:border-pink-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center justify-between">
                <span className="flex items-center">
                  <Users size={16} className="mr-2" />
                  Active Users
                </span>
                {trends.users !== 0 && (
                  <span className={`flex items-center text-xs ${trends.users > 0 ? 'text-green-500' : trends.users < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                    {trends.users > 0 ? <ArrowUp size={14} /> : trends.users < 0 ? <ArrowDown size={14} /> : <Minus size={14} />}
                    {Math.abs(trends.users).toFixed(1)}%
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {activeUsers}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Unique users
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm border-pink-200 dark:border-pink-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center justify-between">
                <span className="flex items-center">
                  <BarChart3 size={16} className="mr-2" />
                  Avg Credits/Gen
                </span>
                {trends.average !== 0 && (
                  <span className={`flex items-center text-xs ${trends.average > 0 ? 'text-green-500' : trends.average < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                    {trends.average > 0 ? <ArrowUp size={14} /> : trends.average < 0 ? <ArrowDown size={14} /> : <Minus size={14} />}
                    {Math.abs(trends.average).toFixed(1)}%
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {averageCreditsPerGen}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Per generation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Users Card */}
        <Card className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm border-pink-200 dark:border-pink-500/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <TrendingUp size={20} className="mr-2 text-pink-600 dark:text-pink-400" />
                  Top 5 Most Active Users
                </CardTitle>
                <CardDescription>Users ranked by number of generations</CardDescription>
              </div>
              <Select 
                value={topUsersTimeRange} 
                onValueChange={(value: any) => setTopUsersTimeRange(value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {topUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No users found for this time period
              </div>
            ) : (
              <div className="space-y-3">
                {topUsers.map((user, index) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                            : index === 1
                            ? "bg-gradient-to-r from-gray-400 to-gray-600"
                            : index === 2
                            ? "bg-gradient-to-r from-orange-400 to-orange-600"
                            : "bg-gradient-to-r from-pink-400 to-rose-600"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {user.userName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {user.userEmail}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-pink-600 dark:text-pink-400">
                        {user.totalGenerations} generations
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {user.totalCredits.toLocaleString()} credits
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm border-pink-200 dark:border-pink-500/30">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter size={20} className="mr-2 text-pink-600 dark:text-pink-400" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Search
                </label>
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <Input
                    placeholder="Search anything..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  {searchQuery !== debouncedSearch && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 size={14} className="animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Filter by User
                </label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent className="max-w-[300px]">
                    <SelectItem value="all">
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span>All Users</span>
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          ({generations.length} total)
                        </span>
                      </div>
                    </SelectItem>
                    {userStats
                      .sort((a, b) => b.totalGenerations - a.totalGenerations)
                      .map((user) => (
                        <SelectItem key={user.userId} value={user.userId}>
                          <div className="flex items-center justify-between gap-2 w-full">
                            <span className="truncate">
                              {user.userName}
                            </span>
                            <span className="text-xs font-semibold text-pink-600 dark:text-pink-400 whitespace-nowrap">
                              ({user.totalGenerations})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <Mic size={14} />
                  Voice Model
                </label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Voices" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Voices</SelectItem>
                    {availableVoices.map((voice) => (
                      <SelectItem key={voice} value={voice}>
                        {voice}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Date Range
                </label>
                <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Sort By
                </label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="credits">Credits Used</SelectItem>
                    <SelectItem value="user">User Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Sort Order
                </label>
                <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generations Table/Cards */}
        <Card className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm border-pink-200 dark:border-pink-500/30">
          <CardHeader>
            <CardTitle className="flex items-center justify-between flex-wrap gap-2">
              <span className="flex items-center">
                <Zap size={20} className="mr-2 text-pink-600 dark:text-pink-400" />
                All Generations
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {filteredGenerations.length} results
                </Badge>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-[100px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 / page</SelectItem>
                    <SelectItem value="25">25 / page</SelectItem>
                    <SelectItem value="50">50 / page</SelectItem>
                    <SelectItem value="100">100 / page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
                    <Skeleton className="h-12 w-24" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                ))}
              </div>
            ) : filteredGenerations.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No generations found matching your filters
              </div>
            ) : isMobileView ? (
              // Mobile Card View
              <div className="space-y-4">
                {paginatedGenerations.map((gen) => (
                  <div
                    key={gen.id}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400 mt-1" />
                        <div>
                          <div className="font-semibold text-sm">
                            {formatDate(new Date(gen.generatedAt), "MMM dd, yyyy")}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(new Date(gen.generatedAt), "HH:mm:ss")}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            alert(gen.text);
                          }}>
                            <FileText size={14} className="mr-2" />
                            View Full Text
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            navigator.clipboard.writeText(gen.text);
                          }}>
                            <Copy size={14} className="mr-2" />
                            Copy Text
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(gen.userId);
                          }}>
                            <User size={14} className="mr-2" />
                            Filter by User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-gray-400" />
                      <div>
                        <div className="font-semibold text-sm">{gen.userName}</div>
                        <div className="text-xs text-gray-500">{gen.userEmail}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Mic size={12} />
                        {gen.voiceName}
                      </Badge>
                      <Badge className={getCreditColor(gen.charactersUsed)}>
                        {gen.charactersUsed.toLocaleString()} credits
                      </Badge>
                      <Badge variant="outline">{gen.accountKey}</Badge>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                      {gen.text}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Desktop Table View
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Voice</TableHead>
                      <TableHead>Credits Used</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Text Preview</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedGenerations.map((gen) => (
                      <TableRow 
                        key={gen.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-gray-400" />
                              {formatDate(new Date(gen.generatedAt), "MMM dd, yyyy")}
                            </div>
                            <span className="text-gray-500">
                              {formatDate(new Date(gen.generatedAt), "HH:mm:ss")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-gray-400" />
                            <div>
                              <div className="font-semibold text-sm">{gen.userName}</div>
                              <div className="text-xs text-gray-500">{gen.userEmail}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <Mic size={12} />
                            {gen.voiceName}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCreditColor(gen.charactersUsed)}>
                            {gen.charactersUsed.toLocaleString()} credits
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{gen.accountKey}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
                            {gen.text.substring(0, 100)}
                            {gen.text.length > 100 && "..."}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                alert(gen.text);
                              }}>
                                <FileText size={14} className="mr-2" />
                                View Full Text
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                navigator.clipboard.writeText(gen.text);
                              }}>
                                <Copy size={14} className="mr-2" />
                                Copy Text
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedUser(gen.userId);
                              }}>
                                <User size={14} className="mr-2" />
                                Filter by User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination Controls */}
            {!isLoading && filteredGenerations.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredGenerations.length)} of{' '}
                  {filteredGenerations.length} results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={16} className="mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight size={16} className="ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
