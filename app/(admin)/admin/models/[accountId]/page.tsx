
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  Users, 
  DollarSign, 
  MessageCircle,
  Eye,
  Heart,
  Image,
  Video,
  TrendingUp,
  Clock,
  Link,
  CreditCard,
  Wallet,
  Trophy,
  Loader2,
  BarChart3
} from "lucide-react";

interface ChatData {
  id: string;
  with_user: {
    id: number;
    name: string;
    username: string;
    avatar: string;
  };
  last_message: {
    text: string;
    created_at: string;
    
  };
  unread_count: number;
}

interface FanData {
  id: number;
  name: string;
  username: string;
  avatar: string | null;
  displayName: string;
  subscribedBy: boolean;
  subscribedByExpire: boolean;
  subscribedByExpireDate: string;
  subscribedByAutoprolong: boolean;
  subscribedIsExpiredNow: boolean;
  subscribedOn: boolean;
  subscribedOnExpiredNow: boolean;
  subscribedOnDuration: string;
  currentSubscribePrice: number;
  isVerified: boolean;
  canEarn: boolean;
}

interface VaultMediaData {
  id: string;
  name: string;
  type: string;
  url: string;
  thumbnail: string;
  created_at: string;
  size: number;
}

interface EarningsData {
  total_earnings?: number;
  current_balance?: number;
  pending_balance?: number;
  monthly_earnings?: number;
  daily_earnings?: Record<string, number>;
  // New structure based on API response
  total?: {
    delta: number;
    chartCount: Array<{date: string; count: number}>;
    chartAmount: Array<{date: string; count: number}>;
    total: number;
    gross: number;
  };
}

interface ProfileVisitors {
  total_visitors: number;
  unique_visitors: number;
  daily_visitors: Record<string, number>;
}

interface TransactionData {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
  status: string;
}

interface MassMessageData {
  id: number;
  date: string;
  text: string;
  giphyId: string | null;
  textCropped: string;
  isFree: boolean;
  sentCount: number;
  viewedCount: number;
  canUnsend: boolean;
  unsendSeconds: number;
  isCanceled: boolean;
  mediaTypes: string | null;
  hasError: boolean;
  releaseForms: any[];
  price?: string;
  purchasedCount?: number;
}

// New interface for mass messaging leaderboard data
interface MassMessagingLeaderboardItem {
  id: string;
  name: string;
  username: string;
  avatar: string;
  totalViews: number;
  totalSent: number;
  viewRate: number;
  averagePrice: number;
  freeMessages: number;
  paidMessages: number;
  totalPurchases: number;
}

export default function AccountDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params?.accountId as string;

  console.log('Account details page params:', params);
  console.log('Account ID:', accountId);

  const [accountData, setAccountData] = useState<any>(null);
  const [chatsData, setChatsData] = useState<ChatData[]>([]);
  const [activeFans, setActiveFans] = useState<FanData[]>([]);
  const [expiredFans, setExpiredFans] = useState<FanData[]>([]);
  const [vaultMedia, setVaultMedia] = useState<VaultMediaData[]>([]);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [profileVisitors, setProfileVisitors] = useState<ProfileVisitors | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [trackingLinks, setTrackingLinks] = useState<any[]>([]);
  const [massMessages, setMassMessages] = useState<MassMessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [massMessagingLeaderboard, setMassMessagingLeaderboard] = useState<MassMessagingLeaderboardItem[]>([]);
  const [isLoadingMassMessages, setIsLoadingMassMessages] = useState(false);

  const fetchAccountDetails = async () => {
    try {
      setLoading(true);

      if (!accountId) {
        setError('Account ID is required');
        return;
      }

      console.log(`Fetching data for account: ${accountId}`);

      // First, try to get the account from the accounts list to get basic info
      try {
        const accountsResponse = await fetch('/api/onlyfans/models?endpoint=accounts');
        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json();
          const accounts = accountsData.accounts || accountsData || [];
          const currentAccount = accounts.find((acc: any) => 
            acc.id === accountId || 
            acc.username === accountId || 
            acc.onlyfans_user_data?.name === accountId ||
            acc.onlyfans_user_data?.id === accountId ||
            acc.onlyfans_user_data?.id?.toString() === accountId
          );
          if (currentAccount) {
            setAccountData(currentAccount);
            console.log('Found account in accounts list:', currentAccount);
            // Use the actual account ID from the found account for API calls
            const realAccountId = currentAccount.id || currentAccount.onlyfans_user_data?.id || accountId;
            console.log('Using real account ID for API calls:', realAccountId);
          }
        }
      } catch (err) {
        console.error('Error fetching accounts list:', err);
      }

      // Get the real account ID to use for API calls
      let realAccountId = accountId;
      if (accountData) {
        realAccountId = accountData.id || accountData.onlyfans_user_data?.id || accountId;
      }

      console.log('Making API calls with account ID:', realAccountId);

      // Set up date parameters (last 30 days for endpoints that require them)
      const endDate = new Date().toISOString().split('T')[0]; // Today
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days ago

      // Define endpoints with their specific requirements
      const endpointConfigs = [
        { name: 'chats', url: `/api/onlyfans/models?accountId=${encodeURIComponent(realAccountId)}&endpoint=chats` },
        { name: 'active-fans', url: `/api/onlyfans/models?accountId=${encodeURIComponent(realAccountId)}&endpoint=active-fans` },
        { name: 'expired-fans', url: `/api/onlyfans/models?accountId=${encodeURIComponent(realAccountId)}&endpoint=expired-fans` },
        { name: 'vault-media', url: `/api/onlyfans/models?accountId=${encodeURIComponent(realAccountId)}&endpoint=vault-media` },
        { name: 'earnings', url: `/api/onlyfans/models?accountId=${encodeURIComponent(realAccountId)}&endpoint=earnings&startDate=${startDate}&endDate=${endDate}` },
        { name: 'profile-visitors', url: `/api/onlyfans/models?accountId=${encodeURIComponent(realAccountId)}&endpoint=profile-visitors&startDate=${startDate}&endDate=${endDate}` },
        { name: 'transactions', url: `/api/onlyfans/models?accountId=${encodeURIComponent(realAccountId)}&endpoint=transactions&startDate=${startDate}&endDate=${endDate}` },
        { name: 'tracking-links', url: `/api/onlyfans/models?accountId=${encodeURIComponent(realAccountId)}&endpoint=tracking-links` },
        { name: 'profile-details', url: `/api/onlyfans/models?accountId=${encodeURIComponent(realAccountId)}&endpoint=profile-details` },
        { name: 'account-balances', url: `/api/onlyfans/models?accountId=${encodeURIComponent(realAccountId)}&endpoint=account-balances` },
        { name: 'vault-lists', url: `/api/onlyfans/models?accountId=${encodeURIComponent(realAccountId)}&endpoint=vault-lists` },
        { name: 'mass-messaging', url: `/api/onlyfans/models?accountId=${encodeURIComponent(realAccountId)}&endpoint=mass-messaging` }
      ];

      const responses = await Promise.allSettled(
        endpointConfigs.map(config => {
          console.log(`Fetching ${config.name}: ${config.url}`);
          return fetch(config.url)
            .then(res => {
              if (!res.ok) {
                console.error(`Error fetching ${config.name}:`, res.status, res.statusText);
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
              }
              return res.json();
            });
        })
      );

      // Process responses
      responses.forEach((response, index) => {
        const endpointConfig = endpointConfigs[index];
        const endpoint = endpointConfig.name;
        if (response.status === 'fulfilled') {
          const data = response.value;
          console.log(`Processing ${endpoint} data:`, data);

          switch (endpoint) {
            case 'chats':
              const chatsArray = Array.isArray(data) ? data : (data.chats || data.data || []);
              setChatsData(chatsArray);
              console.log(`Processed ${endpoint}:`, chatsArray);
              break;
            case 'active-fans':
              const activeFansArray = Array.isArray(data) ? data : (data.data?.list || data.list || data.data || []);
              setActiveFans(activeFansArray);
              console.log(`Processed ${endpoint}:`, activeFansArray);
              break;
            case 'expired-fans':
              const expiredFansArray = Array.isArray(data) ? data : (data.data?.list || data.list || data.data || []);
              setExpiredFans(expiredFansArray);
              console.log(`Processed ${endpoint}:`, expiredFansArray);
              break;
            case 'vault-media':
              const vaultMediaArray = Array.isArray(data) ? data : (data.media || data.data || []);
              setVaultMedia(vaultMediaArray);
              console.log(`Processed ${endpoint}:`, vaultMediaArray);
              break;
            case 'vault-lists':
              const vaultListsArray = Array.isArray(data) ? data : (data.lists || data.data || []);
              // You can add a new state for vault lists if needed
              console.log(`Processed ${endpoint}:`, vaultListsArray);
              break;
            case 'earnings':
              const earningsData = data.data || data;
              // Transform the API response to match our interface
              const transformedEarnings = {
                total_earnings: earningsData.total?.total || 0,
                current_balance: earningsData.total?.total || 0,
                pending_balance: 0,
                monthly_earnings: earningsData.total?.chartAmount?.[0]?.count || 0,
                daily_earnings: {},
                total: earningsData.total
              };
              setEarnings(transformedEarnings);
              console.log(`Processed ${endpoint}:`, transformedEarnings);
              break;
            case 'profile-visitors':
              const visitorsData = data.data || data;
              // Transform the API response to match our interface
              const transformedVisitors = {
                total_visitors: visitorsData.chart?.visitors?.reduce((sum: number, visitor: any) => sum + visitor.count, 0) || 0,
                unique_visitors: visitorsData.chart?.visitors?.length || 0,
                daily_visitors: visitorsData.chart?.visitors?.reduce((acc: any, visitor: any) => {
                  const date = new Date(visitor.date).toLocaleDateString();
                  acc[date] = visitor.count;
                  return acc;
                }, {}) || {}
              };
              setProfileVisitors(transformedVisitors);
              console.log(`Processed ${endpoint}:`, transformedVisitors);
              break;
            case 'transactions':
              const transactionsArray = Array.isArray(data) ? data : (data.transactions || data.data || []);
              setTransactions(transactionsArray);
              console.log(`Processed ${endpoint}:`, transactionsArray);
              break;
            case 'tracking-links':
              const trackingLinksArray = Array.isArray(data) ? data : (data.links || data.data || []);
              setTrackingLinks(trackingLinksArray);
              console.log(`Processed ${endpoint}:`, trackingLinksArray);
              break;
            case 'profile-details':
              const profileDetailsData = data.profile || data;
              if (profileDetailsData && Object.keys(profileDetailsData).length > 0) {
                setAccountData((prev: any) => ({ ...prev, ...profileDetailsData }));
              }
              console.log(`Processed ${endpoint}:`, profileDetailsData);
              break;
            case 'account-balances':
              if (data && typeof data === 'object') {
                setEarnings(prev => ({ 
                  ...prev, 
                  current_balance: data.current_balance || prev?.current_balance,
                  pending_balance: data.pending_balance || prev?.pending_balance,
                  total_earnings: data.total_earnings || prev?.total_earnings
                }));
                console.log(`Processed ${endpoint}:`, data);
              }
              break;
            case 'mass-messaging':
              const massMessagesArray = Array.isArray(data) ? data : (data.data?.list || data.list || data.data || []);
              setMassMessages(massMessagesArray);
              console.log(`Processed ${endpoint}:`, massMessagesArray);
              break;
          }
        } else {
          console.error(`Failed to fetch ${endpoint}:`, response.reason);
        }
      });

      // Fetch mass messaging leaderboard data
      setIsLoadingMassMessages(true);
      try {
        const leaderboardResponse = await fetch(`/api/onlyfans/models?endpoint=mass-messaging-leaderboard`);
        if (leaderboardResponse.ok) {
          const leaderboardData = await leaderboardResponse.json();
          setMassMessagingLeaderboard(leaderboardData);
          console.log("Mass Messaging Leaderboard Data:", leaderboardData);
        } else {
          console.error("Failed to fetch mass messaging leaderboard:", leaderboardResponse.status, leaderboardResponse.statusText);
        }
      } catch (err) {
        console.error("Error fetching mass messaging leaderboard:", err);
      } finally {
        setIsLoadingMassMessages(false);
      }

    } catch (err) {
      console.error('Error fetching account details:', err);
      setError('Failed to load account details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) {
      console.log('Account ID from params:', accountId);
      fetchAccountDetails();
    }
  }, [accountId]);

  // Debug effect to log account data changes
  useEffect(() => {
    if (accountData) {
      console.log('Account data updated:', accountData);
    }
  }, [accountData]);

  if (loading) {
    return (
      <div className="min-h-screen p-6 space-y-6 bg-gradient-to-br from-gray-50 via-white to-pink-50">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="animate-spin h-10 w-10 text-pink-500" />
            <p className="text-sm text-gray-600">Loading account details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 space-y-6 bg-gradient-to-br from-gray-50 via-white to-pink-50">
        <div className="text-center text-red-600 py-8">
          <p>{error}</p>
          <Button onClick={() => router.back()} className="mt-4 bg-black text-white hover:bg-gray-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gradient-to-br from-gray-50 via-white to-pink-50">
      {/* Header */}
      <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-pink-50 rounded-lg border overflow-hidden relative group">
        {/* Glass reflection effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
        </div>
        
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 hover:bg-gray-100 transition-colors duration-300"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Models
        </Button>

        <div className="flex items-center gap-4">
          {(accountData?.avatar || accountData?.onlyfans_user_data?.avatar) && (
            <div className="relative">
              <img 
                src={accountData?.avatar || accountData?.onlyfans_user_data?.avatar} 
                alt={accountData?.display_name || accountData?.name || 'Account'}
                className="w-16 h-16 rounded-full object-cover border-2 border-pink-200"
              />
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {accountData?.onlyfans_user_data?.display_name || 
               accountData?.display_name || 
               accountData?.name || 
               accountData?.onlyfans_user_data?.name || 
               `Account ${accountId}`}
            </h1>
            <p className="text-gray-600">
              @{accountData?.onlyfans_user_data?.name || 
                accountData?.username || 
                accountData?.onlyfans_user_data?.username || 
                accountId}
            </p>
            {accountData?.onlyfans_user_data?.email && (
              <p className="text-sm text-blue-600">
                {accountData.onlyfans_user_data.email}
              </p>
            )}
            <div className="mt-2 text-sm text-gray-600 flex gap-4">
              <div className="flex items-center gap-2">
                <span>Account ID:</span>
                <Badge variant="outline">{accountId}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span>Status:</span>
                <Badge variant={accountData?.is_authenticated ? "default" : "secondary"} className={accountData?.is_authenticated ? "bg-black text-white" : ""}>
                  {accountData?.is_authenticated ? 'Authenticated' : 'Not Authenticated'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeFans.length}</p>
                <p className="text-sm text-gray-600">Active Fans</p>
              </div>
              <Users className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">${earnings?.total?.total?.toLocaleString() || earnings?.total_earnings?.toLocaleString() || '0'}</p>
                <p className="text-sm text-gray-600">Total Earnings</p>
                {earnings?.total?.gross && (
                  <p className="text-xs text-gray-500">Gross: ${earnings.total.gross.toLocaleString()}</p>
                )}
              </div>
              <DollarSign className="w-5 h-5 text-green-500 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{chatsData.length}</p>
                <p className="text-sm text-gray-600">Active Chats</p>
              </div>
              <MessageCircle className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{profileVisitors?.total_visitors?.toLocaleString() || '0'}</p>
                <p className="text-sm text-gray-600">Profile Visits</p>
              </div>
              <Eye className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{(Array.isArray(massMessages) ? massMessages.reduce((sum, msg) => sum + (msg.sentCount || 0), 0) : 0).toLocaleString()}</p>
                <p className="text-sm text-gray-600">Mass Messages Sent</p>
              </div>
              <MessageCircle className="w-5 h-5 text-pink-500 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-9 bg-white border border-gray-200 rounded-lg p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">Overview</TabsTrigger>
          <TabsTrigger value="chats" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">Chats</TabsTrigger>
          <TabsTrigger value="fans" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">Fans</TabsTrigger>
          <TabsTrigger value="earnings" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">Earnings</TabsTrigger>
          <TabsTrigger value="media" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">Media Vault</TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">Transactions</TabsTrigger>
          <TabsTrigger value="tracking" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">Tracking</TabsTrigger>
          <TabsTrigger value="visitors" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">Visitors</TabsTrigger>
          <TabsTrigger value="messaging" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">Mass Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
              {/* Glass reflection effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-green-500" />
                  Account Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Current Balance:</span>
                    <span className="font-bold text-green-600">${earnings?.current_balance?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Pending Balance:</span>
                    <span className="font-bold text-yellow-600">${earnings?.pending_balance?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Monthly Earnings:</span>
                    <span className="font-bold text-gray-900">${earnings?.monthly_earnings?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
              {/* Glass reflection effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  Fan Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Active Subscribers:</span>
                    <span className="font-bold text-green-600">{activeFans.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Expired Subscribers:</span>
                    <span className="font-bold text-red-600">{expiredFans.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Media Items:</span>
                    <span className="font-bold text-gray-900">{vaultMedia.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="chats" className="space-y-4">
          <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
            {/* Glass reflection effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
            </div>
            <CardHeader>
              <CardTitle>Recent Chats ({chatsData.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {chatsData.length > 0 ? (
                <div className="space-y-4">
                  {chatsData.slice(0, 10).map((chat) => (
                    <div key={chat.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                      <img 
                        src={chat.with_user?.avatar || '/model.png'} 
                        alt={chat.with_user?.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{chat.with_user?.name}</h4>
                        <p className="text-sm text-gray-600 truncate">
                          {chat.last_message?.text || 'No messages'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {chat.last_message?.created_at && new Date(chat.last_message.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {chat.unread_count > 0 && (
                        <Badge variant="destructive">{chat.unread_count}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600 py-8">No chats found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fans" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
              {/* Glass reflection effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
              </div>
              <CardHeader>
                <CardTitle className="text-green-600">Active Fans ({activeFans.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {activeFans.length > 0 ? activeFans.slice(0, 5).map((fan) => (
                  <div key={fan.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg mb-3 hover:bg-gray-50 transition-colors duration-200">
                    <img 
                      src={fan.avatar || '/model.png'} 
                      alt={fan.displayName || fan.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{fan.displayName || fan.name}</h5>
                      <p className="text-sm text-gray-600">@{fan.username}</p>
                      <p className="text-xs text-gray-500">
                        Duration: {fan.subscribedOnDuration || 'N/A'}
                      </p>
                      <p className="text-xs text-pink-600 font-medium">
                        Price: ${fan.currentSubscribePrice || 0}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge className="bg-green-100 text-green-700 border-green-300">Active</Badge>
                      {fan.isVerified && <Badge variant="outline" className="text-xs">Verified</Badge>}
                      {fan.subscribedByAutoprolong && <Badge variant="outline" className="text-xs">Auto-renew</Badge>}
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-gray-600 py-4">No active fans found</p>
                )}
              </CardContent>
            </Card>

            <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
              {/* Glass reflection effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
              </div>
              <CardHeader>
                <CardTitle className="text-red-600">Expired Fans ({expiredFans.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {expiredFans.length > 0 ? expiredFans.slice(0, 5).map((fan) => (
                  <div key={fan.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg mb-3 hover:bg-gray-50 transition-colors duration-200">
                    <img 
                      src={fan.avatar || '/model.png'} 
                      alt={fan.displayName || fan.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{fan.displayName || fan.name}</h5>
                      <p className="text-sm text-gray-600">@{fan.username}</p>
                      <p className="text-xs text-gray-500">
                        Expired: {fan.subscribedByExpireDate ? new Date(fan.subscribedByExpireDate).toLocaleDateString() : 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Last Price: ${fan.currentSubscribePrice || 0}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge className="bg-red-100 text-red-700 border-red-300">Expired</Badge>
                      {fan.isVerified && <Badge variant="outline" className="text-xs">Verified</Badge>}
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-gray-600 py-4">No expired fans found</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-6">
          <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
            {/* Glass reflection effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
            </div>
            <CardHeader>
              <CardTitle>Earnings Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <Wallet className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">${earnings?.total?.total?.toLocaleString() || earnings?.current_balance?.toLocaleString() || '0'}</p>
                  <p className="text-sm text-gray-600">Net Earnings</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">${earnings?.total?.gross?.toLocaleString() || earnings?.pending_balance?.toLocaleString() || '0'}</p>
                  <p className="text-sm text-gray-600">Gross Earnings</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{earnings?.total?.delta ? `${earnings.total.delta}%` : 'N/A'}</p>
                  <p className="text-sm text-gray-600">Growth Rate</p>
                </div>
              </div>

              {earnings?.total?.chartAmount && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Monthly Earnings Breakdown</h3>
                  <div className="space-y-2">
                    {earnings.total.chartAmount.slice(0, 6).map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors duration-200">
                        <span className="text-sm text-gray-700">{new Date(item.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                        <span className="font-medium text-gray-900">${item.count.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
            {/* Glass reflection effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
            </div>
            <CardHeader>
              <CardTitle>Media Vault ({vaultMedia.length} items)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {vaultMedia.slice(0, 9).map((media) => (
                  <div key={media.id} className="border border-gray-200 rounded-lg p-4 hover:border-pink-300 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-2 mb-2">
                      {media.type === 'video' ? (
                        <Video className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Image className="w-4 h-4 text-green-500" />
                      )}
                      <span className="font-medium truncate text-gray-900">{media.name}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {(media.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(media.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
            {/* Glass reflection effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
            </div>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.slice(0, 10).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-600">{transaction.type}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">+${transaction.amount}</p>
                        <Badge variant={transaction.status === 'completed' ? 'default' : 'outline'} className={transaction.status === 'completed' ? 'bg-green-100 text-green-700 border-green-300' : ''}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600 py-8">No transactions found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-6">
          <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
            {/* Glass reflection effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
            </div>
            <CardHeader>
              <CardTitle>Tracking Links</CardTitle>
            </CardHeader>
            <CardContent>
              {trackingLinks.length > 0 ? (
                <div className="space-y-3">
                  {trackingLinks.map((link, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-lg hover:border-pink-300 hover:shadow-sm transition-all duration-200">
                      <div className="flex items-center gap-2">
                        <Link className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-gray-900">{link.name || `Link ${index + 1}`}</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{link.url}</p>
                      <p className="text-xs text-gray-500">Clicks: {link.clicks || 0}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600 py-8">No tracking links found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visitors" className="space-y-6">
          <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
            {/* Glass reflection effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
            </div>
            <CardHeader>
              <CardTitle>Profile Visitors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <Eye className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{profileVisitors?.total_visitors?.toLocaleString() || '0'}</p>
                  <p className="text-sm text-gray-600">Total Visitors</p>
                </div>
                <div className="text-center p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <Users className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{profileVisitors?.unique_visitors?.toLocaleString() || '0'}</p>
                  <p className="text-sm text-gray-600">Unique Visitors</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messaging" className="space-y-6">
          <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
            {/* Glass reflection effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
            </div>
            <CardHeader>
              <CardTitle>Mass Messaging Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <MessageCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{Array.isArray(massMessages) ? massMessages.length : 0}</p>
                  <p className="text-sm text-gray-600">Total Messages</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{(Array.isArray(massMessages) ? massMessages.reduce((sum, msg) => sum + (msg.sentCount || 0), 0) : 0).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Total Sent</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <Eye className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{(Array.isArray(massMessages) ? massMessages.reduce((sum, msg) => sum + (msg.viewedCount || 0), 0) : 0).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Total Viewed</p>
                </div>
              </div>

              {Array.isArray(massMessages) && massMessages.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Mass Messages</h3>
                  {massMessages.slice(0, 10).map((message) => (
                    <div key={message.id} className="border border-gray-200 rounded-lg p-4 hover:border-pink-300 hover:shadow-sm transition-all duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={message.isFree ? "secondary" : "default"} className={!message.isFree ? "bg-pink-100 text-pink-700 border-pink-300" : ""}>
                              {message.isFree ? "Free" : "Paid"}
                            </Badge>
                            {!message.isFree && message.price && (
                              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                ${message.price}
                              </Badge>
                            )}
                            {message.isCanceled && <Badge variant="destructive">Canceled</Badge>}
                            {message.hasError && <Badge variant="destructive">Error</Badge>}
                          </div>
                          <div 
                            className="text-sm text-gray-700 mb-2" 
                            dangerouslySetInnerHTML={{ __html: message.textCropped }}
                          />
                          <p className="text-xs text-gray-500">
                            {new Date(message.date).toLocaleDateString()} at {new Date(message.date).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-sm font-medium">
                            <span className="text-green-600">{message.sentCount} sent</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-blue-600">{message.viewedCount} viewed</span>
                          </div>
                          {!message.isFree && message.purchasedCount !== undefined && (
                            <div className="text-sm">
                              <span className="text-purple-600">{message.purchasedCount} purchased</span>
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            {message.viewedCount > 0 ? ((message.viewedCount / message.sentCount) * 100).toFixed(1) : 0}% view rate
                          </div>
                          {!message.isFree && message.price && message.purchasedCount !== undefined && (
                            <div className="text-xs text-gray-500">
                              Revenue: ${(parseFloat(message.price) * message.purchasedCount).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600 py-8">No mass messages found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
