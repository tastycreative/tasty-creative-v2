"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Calendar,
  CreditCard,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  Bug,
  ChevronDown,
  ChevronUp,
  PauseCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { API_KEY_PROFILES } from "@/app/services/elevenlabs-implementation";

interface AccountBilling {
  profileKey: string;
  profileName: string;
  status: "success" | "error" | "loading" | "billing_issue";
  subscription?: {
    tier?: string;
    status?: string;
    currency?: string;
    next_invoice_time_unix?: number;
    invoice_amount_cents?: number;
    monthly_price?: number;
    annual_price?: number;
    billing_period?: string;
    _raw?: any; // For debugging
  };
  character?: {
    limit: number;
    remaining: number;
    used: number;
  };
  error?: string;
  errorType?: string;
  billingIssue?: string; // New field for billing issue description
  debug?: any; // For debugging
}

export default function AIFinancePage() {
  const [accountsData, setAccountsData] = useState<AccountBilling[]>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showDebugMode, setShowDebugMode] = useState(false);
  const [expandedDebugRows, setExpandedDebugRows] = useState<Set<string>>(
    new Set()
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Function to detect billing problems
  const checkForBillingProblems = (
    data: any
  ): { hasProblem: boolean; issue?: string } => {
    // Check subscription status
    if (data.subscription?.status) {
      const status = data.subscription.status.toLowerCase();
      if (
        status.includes("suspend") ||
        status.includes("deactivat") ||
        status.includes("cancel")
      ) {
        return { hasProblem: true, issue: `Account ${status}` };
      }
      if (status.includes("past_due") || status.includes("overdue")) {
        return { hasProblem: true, issue: "Payment overdue" };
      }
      if (
        status.includes("incomplete") ||
        status.includes("incomplete_expired")
      ) {
        return { hasProblem: true, issue: "Incomplete payment" };
      }
    }

    // Check if next billing date is in the past (overdue)
    if (data.subscription?.next_invoice_time_unix) {
      const nextBilling = data.subscription.next_invoice_time_unix * 1000;
      const now = Date.now();
      const daysPast = (now - nextBilling) / (1000 * 60 * 60 * 24);

      if (daysPast > 7) {
        // More than 7 days past due
        return {
          hasProblem: true,
          issue: `Payment ${Math.floor(daysPast)} days overdue`,
        };
      }
    }

    // Check character usage (close to or at limit)
    if (data.character) {
      const usagePercentage =
        (data.character.used / data.character.limit) * 100;
      if (usagePercentage >= 100) {
        return { hasProblem: true, issue: "Character limit exceeded" };
      }
      if (usagePercentage >= 95) {
        return { hasProblem: true, issue: "Near character limit (95%+)" };
      }
    }

    // Check for missing monthly price on paid plans
    if (
      data.subscription?.tier &&
      data.subscription.tier.toLowerCase() !== "free" &&
      data.subscription.tier.toLowerCase() !== "starter" &&
      (!data.subscription.monthly_price ||
        data.subscription.monthly_price === 0)
    ) {
      return { hasProblem: true, issue: "Missing billing information" };
    }

    // Check for accounts with no subscription info but API key works
    if (!data.subscription?.tier && !data.subscription?.status) {
      return { hasProblem: true, issue: "No subscription information" };
    }

    return { hasProblem: false };
  };

  // Initialize accounts data
  useEffect(() => {
    const initialData: AccountBilling[] = Object.entries(API_KEY_PROFILES).map(
      ([key, profile]) => ({
        profileKey: key,
        profileName: profile.name,
        status: "loading",
      })
    );
    setAccountsData(initialData);
    loadAllAccountsBilling();
  }, []);

  const loadAllAccountsBilling = async () => {
    setIsLoadingAll(true);
    setGlobalError(null);
    setLastUpdated(new Date());

    const updatedAccounts: AccountBilling[] = [];

    for (const [profileKey, profile] of Object.entries(API_KEY_PROFILES)) {
      try {
        const response = await fetch("/api/elevenlabs/check-balance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            apiKeyProfileKey: profileKey,
          }),
        });

        const data = await response.json();

        console.log(`Response for ${profileKey}:`, data); // Debug log
        console.log(
          `Raw subscription data for ${profileKey}:`,
          data.subscription?._raw
        ); // Debug raw data
        console.log(`Debug data for ${profileKey}:`, data.debug); // Debug processed data

        if (response.ok && data.status === "success") {
          // Check for billing problems even on successful API calls
          const billingCheck = checkForBillingProblems(data);

          updatedAccounts.push({
            profileKey,
            profileName: profile.name,
            status: billingCheck.hasProblem ? "billing_issue" : "success",
            subscription: data.subscription,
            character: data.character,
            billingIssue: billingCheck.issue,
            debug: data.debug, // Include debug data
          });
        } else {
          updatedAccounts.push({
            profileKey,
            profileName: profile.name,
            status: "error",
            error: data.error || "Failed to fetch billing data",
            errorType: data.errorType || "unknown",
            debug: data.debug, // Include debug data even for errors
          });
        }
      } catch (error) {
        console.error(`Network error for ${profileKey}:`, error);
        updatedAccounts.push({
          profileKey,
          profileName: profile.name,
          status: "error",
          error: "Network error",
          errorType: "network_error",
        });
      }
    }

    setAccountsData(updatedAccounts);
    setIsLoadingAll(false);
  };

  const refreshSingleAccount = async (profileKey: string) => {
    setAccountsData((prev) =>
      prev.map((account) =>
        account.profileKey === profileKey
          ? { ...account, status: "loading" as const }
          : account
      )
    );

    try {
      const response = await fetch("/api/elevenlabs/check-balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKeyProfileKey: profileKey,
        }),
      });

      const data = await response.json();

      console.log(`Single refresh response for ${profileKey}:`, data); // Debug log

      setAccountsData((prev) =>
        prev.map((account) => {
          if (account.profileKey === profileKey) {
            if (response.ok && data.status === "success") {
              // Check for billing problems
              const billingCheck = checkForBillingProblems(data);

              return {
                ...account,
                status: billingCheck.hasProblem
                  ? ("billing_issue" as const)
                  : ("success" as const),
                subscription: data.subscription,
                character: data.character,
                billingIssue: billingCheck.issue,
                error: undefined,
                errorType: undefined,
                debug: data.debug,
              };
            } else {
              return {
                ...account,
                status: "error" as const,
                error: data.error,
                errorType: data.errorType,
                billingIssue: undefined,
                debug: data.debug,
              };
            }
          }
          return account;
        })
      );
    } catch (error) {
      console.error(`Network error for ${profileKey}:`, error);
      setAccountsData((prev) =>
        prev.map((account) =>
          account.profileKey === profileKey
            ? {
                ...account,
                status: "error" as const,
                error: "Network error",
                errorType: "network_error",
                billingIssue: undefined,
              }
            : account
        )
      );
    }
  };

  const toggleDebugRow = (profileKey: string) => {
    setExpandedDebugRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(profileKey)) {
        newSet.delete(profileKey);
      } else {
        newSet.add(profileKey);
      }
      return newSet;
    });
  };

  const formatDate = (unixTimestamp?: number) => {
    if (!unixTimestamp) return "N/A";
    return (
      new Date(unixTimestamp * 1000).toLocaleDateString() +
      " " +
      new Date(unixTimestamp * 1000).toLocaleTimeString()
    );
  };

  const formatCurrency = (amount?: number, currency: string = "USD") => {
    if (!amount || amount === 0) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Calculate summary stats
  const successfulAccounts = accountsData.filter(
    (acc) => acc.status === "success"
  );

  // Enhanced calculation with better null checking
  const totalMonthlyBill = successfulAccounts.reduce((sum, acc) => {
    const monthlyPrice = acc.subscription?.monthly_price || 0;
    console.log(`Account ${acc.profileKey} monthly price:`, monthlyPrice); // Debug log
    return sum + monthlyPrice;
  }, 0);

  const activeSubscriptions = successfulAccounts.filter(
    (acc) =>
      acc.subscription?.status === "active" ||
      (acc.subscription?.tier && acc.subscription?.tier !== "free")
  ).length;

  const errorAccounts = accountsData.filter(
    (acc) => acc.status === "error"
  ).length;

  // Add billing issues count
  const billingIssueAccounts = accountsData.filter(
    (acc) => acc.status === "billing_issue"
  ).length;

  // Enhanced next billing calculation
  const nextBillingDates = successfulAccounts
    .filter((acc) => acc.subscription?.next_invoice_time_unix)
    .map((acc) => {
      console.log(
        `Account ${acc.profileKey} next billing:`,
        acc.subscription!.next_invoice_time_unix
      ); // Debug log
      return acc.subscription!.next_invoice_time_unix!;
    })
    .sort((a, b) => a - b);

  const nextBillingDate =
    nextBillingDates.length > 0 ? nextBillingDates[0] : null;

  const getStatusIcon = (account: AccountBilling) => {
    switch (account.status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "billing_issue":
        return <PauseCircle className="h-4 w-4 text-orange-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "loading":
        return <Loader2 className="h-4 w-4 animate-spin text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (account: AccountBilling) => {
    switch (account.status) {
      case "success":
        return "Active";
      case "billing_issue":
        return "Billing Issue";
      case "error":
        return "Error";
      case "loading":
        return "Loading...";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = (account: AccountBilling) => {
    switch (account.status) {
      case "success":
        return "text-green-600";
      case "billing_issue":
        return "text-orange-600";
      case "error":
        return "text-red-600";
      case "loading":
        return "text-gray-500";
      default:
        return "text-gray-400";
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.round((used / limit) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600 bg-red-50";
    if (percentage >= 75) return "text-orange-600 bg-orange-50";
    if (percentage >= 50) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  // Pagination logic
  const filteredAccounts = accountsData.filter(
    (account) => statusFilter === "all" || account.status === statusFilter
  );

  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAccounts = filteredAccounts.slice(startIndex, endIndex);

  // Reset pagination when filter changes
  const handleFilterChange = (newFilter: string) => {
    setStatusFilter(newFilter);
    setCurrentPage(1);
  };

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToPrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gradient-to-br from-gray-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">AI Finance</h1>
              <DollarSign className="h-6 w-6 text-pink-500" />
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              ElevenLabs billing overview and subscription management
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadAllAccountsBilling}
              disabled={isLoadingAll}
              className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoadingAll ? "animate-spin" : ""}`}
              />
              Refresh All
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 dark:hover:border-pink-500 group bg-white dark:bg-gray-700 relative overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100/25 dark:via-pink-900/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Total Monthly Bill
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  ${totalMonthlyBill.toFixed(2)}
                  {showDebugMode && totalMonthlyBill === 0 && (
                    <span className="text-sm text-red-500 ml-2">⚠️ Zero</span>
                  )}
                </p>
                <div className="flex items-center text-sm">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-600 font-medium">
                    {activeSubscriptions} active
                  </span>
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-full group-hover:bg-green-100 dark:group-hover:bg-green-900/50 transition-colors">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 dark:hover:border-pink-500 group bg-white dark:bg-gray-700 relative overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100/25 dark:via-pink-900/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Active Accounts
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {activeSubscriptions}
                </p>
                <div className="flex items-center text-sm">
                  <Activity className="h-3 w-3 text-blue-500 mr-1" />
                  <span className="text-blue-600 font-medium">
                    of {accountsData.length} total
                  </span>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-full group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 dark:hover:border-pink-500 group bg-white dark:bg-gray-700 relative overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100/25 dark:via-pink-900/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Next Billing
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {nextBillingDate
                    ? new Date(nextBillingDate * 1000).toLocaleDateString()
                    : "N/A"}
                  {showDebugMode && !nextBillingDate && (
                    <span className="text-sm text-red-500 ml-2">⚠️ None</span>
                  )}
                </p>
                <div className="flex items-center text-sm">
                  <Calendar className="h-3 w-3 text-purple-500 mr-1" />
                  <span className="text-purple-600 font-medium">Upcoming</span>
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-full group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors">
                <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 dark:hover:border-pink-500 group bg-white dark:bg-gray-700 relative overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100/25 dark:via-pink-900/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Issues Found
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {errorAccounts + billingIssueAccounts}
                </p>
                <div className="flex items-center text-sm">
                  <AlertTriangle className="h-3 w-3 text-orange-500 mr-1" />
                  <span className="text-orange-600 font-medium">
                    {billingIssueAccounts} billing, {errorAccounts} errors
                  </span>
                </div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-full group-hover:bg-orange-100 dark:group-hover:bg-orange-900/50 transition-colors">
                <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global Error Alert */}
      {globalError && (
        <Alert className="border-red-500 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-700 dark:text-red-300">
            {globalError}
          </AlertDescription>
        </Alert>
      )}

      {/* Status Filter */}
      <Card className="border border-gray-200 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by Status:
              </span>
            </div>
            <div className="flex space-x-2">
              {[
                { value: "all", label: "All", count: accountsData.length },
                {
                  value: "success",
                  label: "Active",
                  count: accountsData.filter((acc) => acc.status === "success")
                    .length,
                },
                {
                  value: "billing_issue",
                  label: "Billing Issues",
                  count: accountsData.filter(
                    (acc) => acc.status === "billing_issue"
                  ).length,
                },
                {
                  value: "error",
                  label: "Errors",
                  count: accountsData.filter((acc) => acc.status === "error")
                    .length,
                },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => handleFilterChange(filter.value)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-all duration-200 ${
                    statusFilter === filter.value
                      ? "bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-500/50 text-pink-700 dark:text-pink-400 font-medium"
                      : "bg-gray-50 dark:bg-gray-600 border-gray-200 dark:border-gray-500 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500"
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Billing Table */}
      <Card className="border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-700">
        <CardHeader className="">
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900 dark:text-gray-100 font-bold flex items-center">
              <Eye className="h-5 w-5 mr-2 text-pink-500" />
              Account Billing Overview
            </CardTitle>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              <span>
                Last updated: {lastUpdated?.toLocaleTimeString() || "Never"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Monthly Bill
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Next Billing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                {currentAccounts.map((account) => {
                  const usagePercentage = account.character
                    ? getUsagePercentage(
                        account.character.used,
                        account.character.limit
                      )
                    : 0;

                  return (
                    <React.Fragment key={account.profileKey}>
                      <tr
                        className={`hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors ${
                          account.status === "billing_issue"
                            ? "bg-orange-25 dark:bg-orange-900/20"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-full mr-3">
                              <CreditCard className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {account.profileName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {account.profileKey}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(account)}
                            <div className="ml-2">
                              <span
                                className={`text-sm font-medium ${getStatusColor(account)}`}
                              >
                                {getStatusText(account)}
                              </span>
                              {account.status === "billing_issue" &&
                                account.billingIssue && (
                                  <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                    {account.billingIssue}
                                  </div>
                                )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {account.status === "success" ||
                          account.status === "billing_issue" ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {account.subscription?.tier || "Unknown"}
                                {showDebugMode &&
                                  !account.subscription?.tier && (
                                    <span className="text-red-500 ml-1">
                                      ⚠️
                                    </span>
                                  )}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {account.subscription?.billing_period || "N/A"}
                              </div>
                            </div>
                          ) : account.status === "error" ? (
                            <div className="text-sm text-red-600 dark:text-red-400">
                              {account.errorType === "invalid_key"
                                ? "Invalid API Key"
                                : account.errorType === "missing_key"
                                  ? "No API Key"
                                  : "Error"}
                            </div>
                          ) : (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {account.status === "success" ||
                          account.status === "billing_issue" ? (
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {formatCurrency(
                                account.subscription?.monthly_price,
                                account.subscription?.currency
                              )}
                              {showDebugMode &&
                                !account.subscription?.monthly_price && (
                                  <span className="text-red-500 ml-1">
                                    ⚠️ Missing
                                  </span>
                                )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(account.status === "success" ||
                            account.status === "billing_issue") &&
                          account.subscription?.next_invoice_time_unix ? (
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              {formatDate(
                                account.subscription.next_invoice_time_unix
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500">
                              N/A
                              {showDebugMode &&
                                (account.status === "success" ||
                                  account.status === "billing_issue") && (
                                  <span className="text-red-500 ml-1">
                                    ⚠️ Missing
                                  </span>
                                )}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(account.status === "success" ||
                            account.status === "billing_issue") &&
                          account.character ? (
                            <div>
                              <div
                                className={`text-sm font-medium px-2 py-1 rounded-full ${getUsageColor(usagePercentage)}`}
                              >
                                {usagePercentage}% used
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {account.character.used.toLocaleString()} /{" "}
                                {account.character.limit.toLocaleString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                refreshSingleAccount(account.profileKey)
                              }
                              disabled={account.status === "loading"}
                              className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 border-gray-300 dark:border-gray-600 hover:border-pink-300 dark:hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/30 transition-all"
                            >
                              {account.status === "loading" ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3 h-3" />
                              )}
                            </Button>
                            {showDebugMode &&
                              (account.debug || account.subscription?._raw) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    toggleDebugRow(account.profileKey)
                                  }
                                  className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 border-yellow-300 dark:border-yellow-600 hover:border-yellow-400 dark:hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/30"
                                >
                                  {expandedDebugRows.has(account.profileKey) ? (
                                    <ChevronUp className="w-3 h-3" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3" />
                                  )}
                                </Button>
                              )}
                          </div>
                        </td>
                      </tr>
                      {/* Debug Row */}
                      {showDebugMode &&
                        expandedDebugRows.has(account.profileKey) && (
                          <tr className="bg-yellow-50 dark:bg-yellow-900/20">
                            <td colSpan={7} className="px-6 py-4">
                              <div className="text-sm">
                                <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                                  Debug Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h5 className="font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                                      Processed Fields
                                    </h5>
                                    <pre className="text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-2 rounded border overflow-auto max-h-40">
                                      {JSON.stringify(
                                        account.debug?.processedFields || {},
                                        null,
                                        2
                                      )}
                                    </pre>
                                  </div>
                                  <div>
                                    <h5 className="font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                                      Raw ElevenLabs Response
                                    </h5>
                                    <pre className="text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-2 rounded border overflow-auto max-h-40">
                                      {JSON.stringify(
                                        account.subscription?._raw ||
                                          account.debug?.rawResponse ||
                                          {},
                                        null,
                                        2
                                      )}
                                    </pre>
                                  </div>
                                </div>
                                {account.billingIssue && (
                                  <div className="mt-4">
                                    <h5 className="font-medium text-orange-700 dark:text-orange-400 mb-1">
                                      Billing Issue Detected
                                    </h5>
                                    <div className="text-sm text-orange-800 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/30 p-2 rounded">
                                      {account.billingIssue}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{startIndex + 1}</span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(endIndex, filteredAccounts.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">{filteredAccounts.length}</span>{" "}
                  results
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevious}
                    disabled={currentPage === 1}
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 border-gray-300 dark:border-gray-600 hover:border-pink-300 dark:hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        // Show first page, last page, current page, and pages around current
                        return (
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 1
                        );
                      })
                      .map((page, index, array) => {
                        // Add ellipsis if there's a gap
                        const prevPage = array[index - 1];
                        const showEllipsisBefore =
                          prevPage && page - prevPage > 1;

                        return (
                          <React.Fragment key={page}>
                            {showEllipsisBefore && (
                              <span className="px-2 py-1 text-gray-500 dark:text-gray-400">
                                ...
                              </span>
                            )}
                            <button
                              onClick={() => goToPage(page)}
                              className={`px-3 py-1 text-sm rounded border transition-all duration-200 ${
                                currentPage === page
                                  ? "bg-pink-100 border-pink-300 text-pink-700 font-medium"
                                  : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNext}
                    disabled={currentPage === totalPages}
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 border-gray-300 dark:border-gray-600 hover:border-pink-300 dark:hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
