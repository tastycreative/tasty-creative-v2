/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  User,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Search,
  Filter,
  Download,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle,
  Calendar,
  FileText,
  ArrowUpDown,
  Eye,
  Target,
  Award,
  Clock,
  Zap,
  MoreVertical,
  Copy,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Flag,
  LineChart,
} from "lucide-react";

interface UserSale {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  model: string;
  voiceNote: string;
  sale: number;
  soldDate: string;
  status: string;
  generatedDate: string;
  source?: string;
}

interface UserStats {
  userId: string;
  userName: string;
  userEmail: string;
  totalSales: number;
  totalRevenue: number;
  averageSale: number;
  salesCount: number;
  todaySales: number;
  weekSales: number;
  monthSales: number;
  lastSaleDate: string | null;
  trend: "up" | "down" | "stable";
}

export default function SalesTrackerPage() {
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [users, setUsers] = useState<UserStats[]>([]);
  const [allSystemUsers, setAllSystemUsers] = useState<any[]>([]); // All users from database
  const [sales, setSales] = useState<UserSale[]>([]);
  const [filteredSales, setFilteredSales] = useState<UserSale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "price" | "user">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  // Expandable sales state
  const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set());
  
  // Date range state
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" });
  
  // Chart visibility
  const [showChart, setShowChart] = useState(true);
  
  // Mobile view detection
  const [isMobileView, setIsMobileView] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper function to get color for sale amount
  const getSaleColor = (amount: number) => {
    if (amount < 10) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300";
    if (amount < 50) return "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300";
    return "bg-gradient-to-r from-blue-500 to-purple-500 text-white";
  };

  // Helper function to toggle expanded sale
  const toggleExpanded = (saleId: string) => {
    const newExpanded = new Set(expandedSales);
    if (newExpanded.has(saleId)) {
      newExpanded.delete(saleId);
    } else {
      newExpanded.add(saleId);
    }
    setExpandedSales(newExpanded);
  };

  // Load all sales data
  const loadSalesData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all voice models from database
      const voiceModelsResponse = await fetch("/api/voice-models");
      if (voiceModelsResponse.ok) {
        const voiceModelsData = await voiceModelsResponse.json();
        const modelNames = voiceModelsData.models?.map((model: any) => model.voiceName) || [];
        setAvailableModels(modelNames.sort());
      }

      // Fetch all users from the system
      const usersResponse = await fetch("/api/users");
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setAllSystemUsers(usersData.users || []);
      }

      // Fetch all sales
      const salesResponse = await fetch("/api/vn-sales/stats");
      if (salesResponse.ok) {
        const salesData = await salesResponse.json();
        const allSales = salesData.recentSales || [];
        setSales(allSales);
        
        // Calculate user statistics
        const userMap = new Map<string, UserStats>();
        
        allSales.forEach((sale: UserSale) => {
          if (!userMap.has(sale.userId)) {
            userMap.set(sale.userId, {
              userId: sale.userId,
              userName: sale.userName,
              userEmail: sale.userEmail,
              totalSales: 0,
              totalRevenue: 0,
              averageSale: 0,
              salesCount: 0,
              todaySales: 0,
              weekSales: 0,
              monthSales: 0,
              lastSaleDate: null,
              trend: "stable",
            });
          }
          
          const userStats = userMap.get(sale.userId)!;
          userStats.totalRevenue += sale.sale;
          userStats.salesCount += 1;
          
          const saleDate = new Date(sale.soldDate);
          const now = new Date();
          const daysDiff = Math.floor((now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === 0) userStats.todaySales += sale.sale;
          if (daysDiff <= 7) userStats.weekSales += sale.sale;
          if (daysDiff <= 30) userStats.monthSales += sale.sale;
          
          if (!userStats.lastSaleDate || saleDate > new Date(userStats.lastSaleDate)) {
            userStats.lastSaleDate = sale.soldDate;
          }
        });
        
        // Calculate averages and trends
        const userStatsArray = Array.from(userMap.values()).map(stats => {
          stats.averageSale = stats.salesCount > 0 ? stats.totalRevenue / stats.salesCount : 0;
          stats.totalSales = stats.totalRevenue;
          
          // Simple trend calculation based on recent activity
          if (stats.todaySales > stats.weekSales / 7) {
            stats.trend = "up";
          } else if (stats.todaySales < stats.weekSales / 14) {
            stats.trend = "down";
          } else {
            stats.trend = "stable";
          }
          
          return stats;
        });
        
        // Sort by total revenue
        userStatsArray.sort((a, b) => b.totalRevenue - a.totalRevenue);
        setUsers(userStatsArray);
      }
    } catch (error) {
      console.error("Error loading sales data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter and sort sales
  useEffect(() => {
    let filtered = [...sales];
    
    // User filter
    if (selectedUser !== "all") {
      filtered = filtered.filter(sale => sale.userId === selectedUser);
    }
    
    // Model filter
    if (modelFilter !== "all") {
      filtered = filtered.filter(sale => sale.model === modelFilter);
    }
    
    // Date filter
    const now = new Date();
    if (dateFilter !== "all") {
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.soldDate);
        const daysDiff = Math.floor((now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dateFilter === "today") return daysDiff === 0;
        if (dateFilter === "week") return daysDiff <= 7;
        if (dateFilter === "month") return daysDiff <= 30;
        return true;
      });
    }
    
    // Custom date range filter
    if (customDateRange.start) {
      filtered = filtered.filter(sale => 
        new Date(sale.soldDate) >= new Date(customDateRange.start)
      );
    }
    if (customDateRange.end) {
      filtered = filtered.filter(sale => 
        new Date(sale.soldDate) <= new Date(customDateRange.end)
      );
    }
    
    // Search filter (use debounced search)
    if (debouncedSearch) {
      filtered = filtered.filter(sale =>
        sale.model.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        sale.voiceNote.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        sale.userName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        sale.userEmail.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      let compareValue = 0;
      switch (sortBy) {
        case "date":
          compareValue = new Date(a.soldDate).getTime() - new Date(b.soldDate).getTime();
          break;
        case "price":
          compareValue = a.sale - b.sale;
          break;
        case "user":
          compareValue = a.userName.localeCompare(b.userName);
          break;
      }
      return sortOrder === "desc" ? -compareValue : compareValue;
    });
    
    setFilteredSales(filtered);
  }, [sales, selectedUser, debouncedSearch, sortBy, sortOrder, dateFilter, modelFilter, customDateRange]);

  // Load data on mount
  useEffect(() => {
    loadSalesData();
  }, [loadSalesData]);

  // Pagination logic
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSales.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSales, currentPage, itemsPerPage]);

  // Revenue chart data (last 7 days)
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        revenue: 0,
        sales: 0,
      };
    });

    filteredSales.forEach(sale => {
      const saleDate = new Date(sale.soldDate);
      const daysDiff = Math.floor((new Date().getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 7) {
        const index = 6 - daysDiff;
        if (index >= 0 && index < 7) {
          last7Days[index].revenue += sale.sale;
          last7Days[index].sales += 1;
        }
      }
    });

    return last7Days;
  }, [filteredSales]);

  const maxChartRevenue = Math.max(...chartData.map(d => d.revenue), 1);

  // Calculate overall stats
  const overallStats = {
    totalUsers: users.length,
    totalRevenue: users.reduce((sum, user) => sum + user.totalRevenue, 0),
    totalSales: users.reduce((sum, user) => sum + user.salesCount, 0),
    averagePerUser: users.length > 0 ? users.reduce((sum, user) => sum + user.totalRevenue, 0) / users.length : 0,
    todayRevenue: users.reduce((sum, user) => sum + user.todaySales, 0),
    weekRevenue: users.reduce((sum, user) => sum + user.weekSales, 0),
    topUser: users.length > 0 ? users[0] : null,
  };

  // Get selected user stats
  const selectedUserStats = selectedUser === "all" 
    ? null 
    : users.find(u => u.userId === selectedUser);

  // Export functionality
  const exportToCSV = () => {
    const csvData = [
      ["User Name", "User Email", "Model", "Voice Note", "Sale Amount", "Sale Date", "Generated Date", "Status", "Source"],
      ...filteredSales.map(sale => [
        sale.userName,
        sale.userEmail,
        sale.model,
        sale.voiceNote.replace(/,/g, ";"), // Replace commas in text
        sale.sale.toFixed(2),
        new Date(sale.soldDate).toLocaleDateString(),
        new Date(sale.generatedDate).toLocaleDateString(),
        sale.status,
        sale.source || "N/A",
      ]),
    ]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-tracker-${selectedUser}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-10 dark:opacity-20" />
        <div className="relative backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 rounded-xl p-6 border border-purple-200 dark:border-purple-700 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Sales Tracker
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Track voice note sales by user
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={loadSalesData}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
              <Button
                onClick={exportToCSV}
                variant="outline"
                size="sm"
                className="border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/20"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Stats - Only show when "All Users" is selected */}
      {selectedUser === "all" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card key="total-users" className="border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Users
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                    {overallStats.totalUsers}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Active sellers
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-full">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card key="total-revenue" className="border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Revenue
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                    {formatCurrency(overallStats.totalRevenue)}
                  </p>
                  <p className="text-xs text-green-500 dark:text-green-400 mt-1">
                    {overallStats.totalSales} sales
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card key="avg-per-user" className="border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Avg per User
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                    {formatCurrency(overallStats.averagePerUser)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Average revenue
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-full">
                  <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card key="top-seller" className="border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Top Seller
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-2 truncate">
                    {overallStats.topUser?.userName || "N/A"}
                  </p>
                  <p className="text-xs text-orange-500 dark:text-orange-400 mt-1">
                    {overallStats.topUser ? formatCurrency(overallStats.topUser.totalRevenue) : "No sales"}
                  </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-full">
                  <Award className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue Trend Chart */}
      {selectedUser === "all" && showChart && (
        <Card className="border border-gray-200 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <LineChart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Revenue Trend (Last 7 Days)
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChart(false)}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chartData.map((day, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 w-16">
                    {day.date}
                  </div>
                  <div className="flex-1">
                    <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg transition-all duration-500"
                        style={{ width: `${(day.revenue / maxChartRevenue) * 100}%` }}
                      />
                      {day.revenue > 0 && (
                        <div className="absolute inset-0 flex items-center px-3 text-xs font-semibold text-white">
                          {formatCurrency(day.revenue)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 w-16 text-right">
                    {day.sales} {day.sales === 1 ? 'sale' : 'sales'}
                  </div>
                </div>
              ))}
            </div>
            {chartData.every(d => d.revenue === 0) && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No sales data in the last 7 days
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!showChart && selectedUser === "all" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowChart(true)}
          className="w-full"
        >
          <ChevronDown className="h-4 w-4 mr-2" />
          Show Revenue Trend Chart
        </Button>
      )}

      {/* User Selection & Filters */}
      <Card className="border border-gray-200 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Filters</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Filter and search sales data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* User Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select User
              </label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="font-semibold">All Users</span>
                    </div>
                  </SelectItem>
                  <div className="h-px bg-gray-200 dark:bg-gray-600 my-1" />
                  
                  {/* Users with sales */}
                  {users.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Users with Sales
                      </div>
                      {users.map((user) => (
                        <SelectItem key={user.userId} value={user.userId}>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.userName}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatCurrency(user.totalRevenue)} • {user.salesCount} sales
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                      <div className="h-px bg-gray-200 dark:bg-gray-600 my-1" />
                    </>
                  )}
                  
                  {/* All system users */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    All System Users
                  </div>
                  {allSystemUsers
                    .filter(sysUser => !users.some(u => u.userId === sysUser.id)) // Exclude users already shown above
                    .map((sysUser) => (
                      <SelectItem key={sysUser.id} value={sysUser.id}>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{sysUser.name || sysUser.email}</span>
                            <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">
                              {sysUser.role}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {sysUser.email} • No sales yet
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Time Period
              </label>
              <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range - Start */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                From Date
              </label>
              <Input
                type="date"
                value={customDateRange.start}
                onChange={(e) => {
                  setCustomDateRange({ ...customDateRange, start: e.target.value });
                  setDateFilter("all");
                }}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
              />
            </div>

            {/* Custom Date Range - End */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                To Date
              </label>
              <Input
                type="date"
                value={customDateRange.end}
                onChange={(e) => {
                  setCustomDateRange({ ...customDateRange, end: e.target.value });
                  setDateFilter("all");
                }}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
              />
            </div>

            {/* Model Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Voice Model
              </label>
              <Select value={modelFilter} onValueChange={setModelFilter}>
                <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="All Models" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span className="font-semibold">All Models</span>
                    </div>
                  </SelectItem>
                  <div className="h-px bg-gray-200 dark:bg-gray-600 my-1" />
                  {availableModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      <div className="flex items-center gap-2">
                        <Zap className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                        <span>{model}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sort By
              </label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectItem value="date">Sale Date</SelectItem>
                  <SelectItem value="price">Sale Amount</SelectItem>
                  <SelectItem value="user">User Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search sales..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                />
                {searchQuery !== debouncedSearch && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 size={14} className="animate-spin text-purple-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Clear Custom Dates Button */}
            {(customDateRange.start || customDateRange.end) && (
              <div className="space-y-2 flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomDateRange({ start: "", end: "" })}
                  className="w-full dark:border-gray-600 dark:text-gray-300"
                >
                  Clear Custom Dates
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredSales.length} of {sales.length} sales
              </div>
              {modelFilter !== "all" && (
                <div className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {modelFilter}
                </div>
              )}
              {availableModels.length > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {availableModels.length} {availableModels.length === 1 ? 'model' : 'models'} available
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="dark:border-gray-600 dark:text-gray-300"
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              {sortOrder === "asc" ? "Ascending" : "Descending"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selected User Stats */}
      {selectedUserStats && (
        <Card className="border border-purple-200 dark:border-purple-700 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              {selectedUserStats.userName}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {selectedUserStats.userEmail}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div key="user-stat-revenue" className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(selectedUserStats.totalRevenue)}
                </p>
              </div>
              <div key="user-stat-sales" className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {selectedUserStats.salesCount}
                </p>
              </div>
              <div key="user-stat-avg" className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Average Sale</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(selectedUserStats.averageSale)}
                </p>
              </div>
              <div key="user-stat-week" className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">This Week</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(selectedUserStats.weekSales)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sales Records with Pagination */}
      <Card className="border border-gray-200 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-800">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-gray-900 dark:text-gray-100 font-bold flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-500" />
              Sales Records ({filteredSales.length})
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="h-4 w-4 mr-1" />
                Last updated: {new Date().toLocaleTimeString()}
              </div>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[110px] h-8">
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
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
                  <Skeleton className="h-16 w-16 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                  <Skeleton className="h-12 w-24" />
                </div>
              ))}
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">No sales found</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Try adjusting your filters or select a different user
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 transition-all overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {sale.userName}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {sale.userEmail}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Model:</span> {sale.model}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {expandedSales.has(sale.id) 
                              ? sale.voiceNote 
                              : truncateText(sale.voiceNote, 100)}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                              <Clock className="h-3 w-3" />
                              {formatDate(sale.soldDate)}
                            </span>
                            {sale.source && (
                              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                {sale.source}
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded ${
                              sale.status === "Completed"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                : "bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                            }`}>
                              {sale.status}
                            </span>
                            {sale.voiceNote.length > 100 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpanded(sale.id)}
                                className="h-6 text-xs text-purple-600 dark:text-purple-400"
                              >
                                {expandedSales.has(sale.id) ? (
                                  <>
                                    <ChevronUp className="h-3 w-3 mr-1" />
                                    Show Less
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                    Show More
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className={`text-2xl font-bold px-3 py-1 rounded-lg ${getSaleColor(sale.sale)}`}>
                              {formatCurrency(sale.sale)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Sale Amount
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => toggleExpanded(sale.id)}>
                                <Eye size={14} className="mr-2" />
                                {expandedSales.has(sale.id) ? 'Hide Details' : 'View Details'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                const text = `${sale.userName} - ${sale.model}\n${formatCurrency(sale.sale)} - ${formatDate(sale.soldDate)}\n${sale.voiceNote}`;
                                navigator.clipboard.writeText(text);
                              }}>
                                <Copy size={14} className="mr-2" />
                                Copy Info
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedUser(sale.userId);
                              }}>
                                <User size={14} className="mr-2" />
                                Filter by User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setModelFilter(sale.model);
                              }}>
                                <Zap size={14} className="mr-2" />
                                Filter by Model
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, filteredSales.length)} of{' '}
                    {filteredSales.length} results
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
            </>
          )}
        </CardContent>
      </Card>

      {/* User Leaderboard - Only show when "All Users" is selected */}
      {selectedUser === "all" && users.length > 0 && (
        <Card className="border border-gray-200 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-800">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
            <CardTitle className="text-gray-900 dark:text-gray-100 font-bold flex items-center">
              <Award className="h-5 w-5 mr-2 text-orange-500" />
              User Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {users.slice(0, 10).map((user, index) => (
                <div
                  key={user.userId}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                    index === 0
                      ? "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-700"
                      : index === 1
                      ? "bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-700 dark:to-slate-700 border-gray-300 dark:border-gray-600"
                      : index === 2
                      ? "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-700"
                      : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                  }`}
                  onClick={() => setSelectedUser(user.userId)}
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                    index === 0
                      ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white"
                      : index === 1
                      ? "bg-gradient-to-br from-gray-300 to-slate-400 text-white"
                      : index === 2
                      ? "bg-gradient-to-br from-orange-300 to-amber-400 text-white"
                      : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                  }`}>
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {user.userName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {user.userEmail} • {user.salesCount} sales
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(user.totalRevenue)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-end gap-1">
                      {user.trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
                      {user.trend === "down" && <TrendingDown className="h-3 w-3 text-red-500" />}
                      {formatCurrency(user.averageSale)} avg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
