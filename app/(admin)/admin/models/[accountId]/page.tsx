
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
  Wallet
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
  avatar: string;
  subscribed_at: string;
  expired_at?: string;
  total_spent: number;
  is_subscribed: boolean;
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
  total_earnings: number;
  current_balance: number;
  pending_balance: number;
  monthly_earnings: number;
  daily_earnings: Record<string, number>;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
            acc.onlyfans_user_data?.id === accountId
          );
          if (currentAccount) {
            setAccountData(currentAccount);
            console.log('Found account in accounts list:', currentAccount);
          }
        }
      } catch (err) {
        console.error('Error fetching accounts list:', err);
      }
      
      // Fetch all the data from different endpoints
      const endpoints = [
        'chats',
        'active-fans', 
        'expired-fans',
        'vault-media',
        'earnings',
        'profile-visitors',
        'transactions',
        'tracking-links',
        'account-details',
        'account-balances'
      ];

      const responses = await Promise.allSettled(
        endpoints.map(endpoint => {
          const url = `/api/onlyfans/models?accountId=${encodeURIComponent(accountId)}&endpoint=${endpoint}`;
          console.log(`Fetching: ${url}`);
          return fetch(url)
            .then(res => {
              if (!res.ok) {
                console.error(`Error fetching ${endpoint}:`, res.status, res.statusText);
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
              }
              return res.json();
            });
        })
      );

      // Process responses
      responses.forEach((response, index) => {
        const endpoint = endpoints[index];
        if (response.status === 'fulfilled') {
          const data = response.value;
          console.log(`Processing ${endpoint} data:`, data);
          
          switch (endpoint) {
            case 'chats':
              setChatsData(Array.isArray(data) ? data : data.chats || data.data || []);
              break;
            case 'active-fans':
              setActiveFans(Array.isArray(data) ? data : data.fans || data.data || []);
              break;
            case 'expired-fans':
              setExpiredFans(Array.isArray(data) ? data : data.fans || data.data || []);
              break;
            case 'vault-media':
              setVaultMedia(Array.isArray(data) ? data : data.media || data.data || []);
              break;
            case 'earnings':
              setEarnings(data.earnings || data);
              break;
            case 'profile-visitors':
              setProfileVisitors(data.visitors || data);
              break;
            case 'transactions':
              setTransactions(Array.isArray(data) ? data : data.transactions || data.data || []);
              break;
            case 'tracking-links':
              setTrackingLinks(Array.isArray(data) ? data : data.links || data.data || []);
              break;
            case 'account-details':
              setAccountData(data.profile || data);
              break;
            case 'account-balances':
              if (data && typeof data === 'object') {
                setEarnings(prev => ({ ...prev, ...data }));
              }
              break;
          }
        } else {
          console.error(`Failed to fetch ${endpoint}:`, response.reason);
        }
      });

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
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500/30 border-t-blue-500"></div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Loading account details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-500 py-8">
          <p>{error}</p>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Models
        </Button>
        
        <div className="flex items-center gap-4">
          {(accountData?.avatar || accountData?.onlyfans_user_data?.avatar) && (
            <img 
              src={accountData?.avatar || accountData?.onlyfans_user_data?.avatar} 
              alt={accountData?.display_name || accountData?.name || 'Account'}
              className="w-16 h-16 rounded-full object-cover"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {accountData?.onlyfans_user_data?.display_name || 
               accountData?.display_name || 
               accountData?.name || 
               accountData?.onlyfans_user_data?.name || 
               `Account ${accountId}`}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              @{accountData?.onlyfans_user_data?.name || 
                accountData?.username || 
                accountData?.onlyfans_user_data?.username || 
                accountId}
            </p>
            {accountData?.onlyfans_user_data?.email && (
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {accountData.onlyfans_user_data.email}
              </p>
            )}
            <div className="mt-2 text-sm text-gray-500">
              <p>Account ID: {accountId}</p>
              <p>Authentication: {accountData?.is_authenticated ? 'Authenticated' : 'Not Authenticated'}</p>
              <p>Status: {accountData?.authentication_progress || 'Unknown'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{activeFans.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Fans</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">${earnings?.total_earnings?.toLocaleString() || '0'}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{chatsData.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Chats</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{profileVisitors?.total_visitors?.toLocaleString() || '0'}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Profile Visits</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chats">Chats</TabsTrigger>
          <TabsTrigger value="fans">Fans</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="media">Media Vault</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="visitors">Visitors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Account Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Current Balance:</span>
                    <span className="font-bold text-green-600">${earnings?.current_balance?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Balance:</span>
                    <span className="font-bold text-yellow-600">${earnings?.pending_balance?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Earnings:</span>
                    <span className="font-bold">${earnings?.monthly_earnings?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fan Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Active Subscribers:</span>
                    <span className="font-bold text-green-600">{activeFans.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expired Subscribers:</span>
                    <span className="font-bold text-red-600">{expiredFans.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Media Items:</span>
                    <span className="font-bold">{vaultMedia.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="chats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Chats ({chatsData.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {chatsData.length > 0 ? (
                <div className="space-y-4">
                  {chatsData.slice(0, 10).map((chat) => (
                    <div key={chat.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <img 
                        src={chat.with_user?.avatar || '/model.png'} 
                        alt={chat.with_user?.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold">{chat.with_user?.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
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
                <p className="text-center text-gray-500 py-8">No chats found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fans" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Active Fans ({activeFans.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {activeFans.slice(0, 5).map((fan) => (
                  <div key={fan.id} className="flex items-center gap-3 p-3 border rounded-lg mb-3">
                    <img 
                      src={fan.avatar || '/model.png'} 
                      alt={fan.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h5 className="font-medium">{fan.name}</h5>
                      <p className="text-sm text-gray-600">${fan.total_spent}</p>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expired Fans ({expiredFans.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {expiredFans.slice(0, 5).map((fan) => (
                  <div key={fan.id} className="flex items-center gap-3 p-3 border rounded-lg mb-3">
                    <img 
                      src={fan.avatar || '/model.png'} 
                      alt={fan.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h5 className="font-medium">{fan.name}</h5>
                      <p className="text-sm text-gray-600">${fan.total_spent}</p>
                    </div>
                    <Badge variant="outline">Expired</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Earnings Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Wallet className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">${earnings?.current_balance?.toLocaleString() || '0'}</p>
                  <p className="text-sm text-gray-600">Available Now</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">${earnings?.pending_balance?.toLocaleString() || '0'}</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">${earnings?.total_earnings?.toLocaleString() || '0'}</p>
                  <p className="text-sm text-gray-600">Total Earned</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Media Vault ({vaultMedia.length} items)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {vaultMedia.slice(0, 9).map((media) => (
                  <div key={media.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {media.type === 'video' ? (
                        <Video className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Image className="w-4 h-4 text-green-500" />
                      )}
                      <span className="font-medium truncate">{media.name}</span>
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
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.slice(0, 10).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-600">{transaction.type}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">+${transaction.amount}</p>
                        <Badge variant={transaction.status === 'completed' ? 'secondary' : 'outline'}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No transactions found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tracking Links</CardTitle>
            </CardHeader>
            <CardContent>
              {trackingLinks.length > 0 ? (
                <div className="space-y-3">
                  {trackingLinks.map((link, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Link className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">{link.name || `Link ${index + 1}`}</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{link.url}</p>
                      <p className="text-xs text-gray-500">Clicks: {link.clicks || 0}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No tracking links found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visitors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Visitors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Eye className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{profileVisitors?.total_visitors?.toLocaleString() || '0'}</p>
                  <p className="text-sm text-gray-600">Total Visitors</p>
                </div>
                <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <Users className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{profileVisitors?.unique_visitors?.toLocaleString() || '0'}</p>
                  <p className="text-sm text-gray-600">Unique Visitors</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
