
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Eye,
  Heart,
  MessageCircle,
  Calendar,
  Search,
  ExternalLink,
  Trophy,
  Star,
  Loader2,
  Sparkles
} from "lucide-react";
import CountUp from "react-countup";

interface OnlyFansProfile {
  id: string;
  username: string;
  name: string;
  about: string;
  avatar: string;
  cover: string;
  location: string;
  website: string;
  isVerified: boolean;
  subscribersCount: number;
  photosCount: number;
  videosCount: number;
  likesCount: number;
  joinDate: string;
  lastSeen: string;
}

interface OnlyFansStats {
  totalEarnings: number;
  monthlyEarnings: number;
  totalSubscribers: number;
  activeSubscribers: number;
  totalPosts: number;
  totalLikes: number;
  avgLikesPerPost: number;
  engagementRate: number;
}

interface OnlyFansPost {
  id: string;
  text: string;
  price: number;
  isArchived: boolean;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  mediaCount: number;
}

export default function AdminModelsPage() {
  const [searchUsername, setSearchUsername] = useState("");
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<OnlyFansProfile | null>(null);
  const [statsData, setStatsData] = useState<OnlyFansStats | null>(null);
  const [postsData, setPostsData] = useState<OnlyFansPost[]>([]);
  const [accountsData, setAccountsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOnlyFansData = async (username: string, endpoint: string) => {
    try {
      const response = await fetch(`/api/onlyfans/models?username=${username}&endpoint=${endpoint}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${endpoint} data`);
      }
      return await response.json();
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      throw err;
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/onlyfans/models?endpoint=accounts');
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      const data = await response.json();
      setAccountsData(data.accounts || data || []);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError('Failed to load OnlyFans accounts');
    } finally {
      setAccountsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSearch = async () => {
    if (!searchUsername.trim()) return;

    setLoading(true);
    setError("");
    setSelectedModel(searchUsername);

    try {
      // Fetch profile data
      const profile = await fetchOnlyFansData(searchUsername, "profile");
      setProfileData(profile);

      // Fetch stats data
      const stats = await fetchOnlyFansData(searchUsername, "stats");
      setStatsData(stats);

      // Fetch recent posts
      const posts = await fetchOnlyFansData(searchUsername, "posts");
      setPostsData(posts.posts || []);

    } catch (err) {
      setError("Failed to fetch OnlyFans data. Please check the username and try again.");
      setProfileData(null);
      setStatsData(null);
      setPostsData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gradient-to-br from-gray-50 via-white to-pink-50">
      {/* Header */}
      <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-pink-50 rounded-lg border">
        <div className="flex items-center space-x-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">OnlyFans Models Management</h1>
          <Sparkles className="h-6 w-6 text-pink-500" />
        </div>
        <p className="text-gray-600">
          Manage and monitor OnlyFans model performance and data
        </p>
      </div>

      {/* Search Section */}
      <Card className="border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative overflow-hidden">
        {/* Glass reflection effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
        </div>
        <CardHeader className="bg-gradient-to-r from-gray-50 to-pink-50 border-b">
          <CardTitle className="flex items-center space-x-2 text-gray-900">
            <Search className="h-5 w-5 text-pink-500" />
            <span>Search OnlyFans Models</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OnlyFans Username
              </label>
              <Input
                type="text"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                placeholder="Enter OnlyFans username..."
                className="w-full border-gray-200 focus:border-pink-300 focus:ring-pink-200"
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={loading || !searchUsername.trim()}
              className="px-6 bg-black hover:bg-gray-800 text-white border-black"
            >
              <Search className="w-4 h-4 mr-2" />
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* OnlyFans Data Display */}
      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-white border border-gray-200 rounded-lg p-1">
          <TabsTrigger value="accounts" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">All Accounts</TabsTrigger>
          <TabsTrigger value="overview" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">Overview</TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">Statistics</TabsTrigger>
          <TabsTrigger value="posts" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">Recent Posts</TabsTrigger>
          <TabsTrigger value="earnings" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">Earnings</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-6">
          <Card className="bg-white border border-gray-200 hover:border-pink-300 transition-all duration-300 relative group overflow-hidden">
            {/* Glass reflection effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
            </div>
            <CardHeader className="bg-gradient-to-r from-gray-50 to-pink-50 border-b">
              <CardTitle className="flex items-center space-x-2 text-gray-900">
                <Users className="h-5 w-5 text-pink-500" />
                <span>Connected OnlyFans Accounts</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {accountsLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-pink-500" />
                    <p className="text-sm text-gray-600">Loading accounts...</p>
                  </div>
                </div>
              ) : accountsData.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {accountsData.map((account, index) => (
                    <Card key={account.id || index} className="border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative overflow-hidden">
                      {/* Glass reflection effect for individual account cards */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-in-out"></div>
                      </div>
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4 mb-4">
                          {account.avatar && (
                            <img 
                              src={account.avatar} 
                              alt={account.username || account.name}
                              className="w-12 h-12 rounded-full object-cover border border-gray-200"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate text-gray-900">
                              {account.display_name || account.onlyfans_user_data?.name || 'Unknown'}
                            </h3>
                            <p className="text-sm text-gray-600 truncate">
                              @{account.onlyfans_user_data?.name || 'No username'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {account.onlyfans_user_data?.isVerified && (
                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                  Verified
                                </Badge>
                              )}
                              <Badge 
                                variant={account.is_authenticated ? "secondary" : "destructive"} 
                                className={`text-xs ${account.is_authenticated ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200" : ""}`}
                              >
                                {account.authentication_progress}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Users className="w-4 h-4 text-pink-500" />
                              <span className="text-xs text-gray-500">Subscribers</span>
                            </div>
                            <p className="font-bold text-lg text-gray-900">
                              <CountUp end={account.onlyfans_user_data?.subscribersCount || 0} duration={2} />
                            </p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Eye className="w-4 h-4 text-green-500" />
                              <span className="text-xs text-gray-500">Posts</span>
                            </div>
                            <p className="font-bold text-lg text-gray-900">
                              <CountUp end={account.onlyfans_user_data?.postsCount || 0} duration={2} />
                            </p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <span className="text-xs text-gray-500">Price</span>
                            </div>
                            <p className="font-bold text-lg text-green-600">
                              ${account.onlyfans_user_data?.subscribePrice || 'N/A'}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="text-xs text-gray-500">Favorites</span>
                            </div>
                            <p className="font-bold text-lg text-gray-900">
                              <CountUp end={account.onlyfans_user_data?.favoritedCount || 0} duration={2} />
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Photos:</span>
                            <span className="font-medium text-gray-900">{account.onlyfans_user_data?.photosCount?.toLocaleString() || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Videos:</span>
                            <span className="font-medium text-gray-900">{account.onlyfans_user_data?.videosCount?.toLocaleString() || 'N/A'}</span>
                          </div>
                          {account.onlyfans_user_data?.email && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Email:</span>
                              <span className="font-medium text-blue-600 truncate">{account.onlyfans_user_data.email}</span>
                            </div>
                          )}
                        </div>

                        <Button 
                          size="sm" 
                          className="w-full bg-black hover:bg-gray-800 text-white border-black group-hover:scale-105 transition-transform duration-300"
                          onClick={() => {
                            const accountId = account.id || account.username || account.onlyfans_user_data?.name || account.onlyfans_user_data?.id || 'unknown';
                            console.log('Navigating to account details with ID:', accountId, 'Full account data:', account);
                            window.location.href = `/admin/models/${encodeURIComponent(accountId)}`;
                          }}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p>No OnlyFans accounts found</p>
                  <p className="text-sm mt-2">Make sure your API key is configured correctly</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          {profileData && (
            <div className="grid gap-6">
              {/* Profile Header */}
              <Card className="border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative overflow-hidden">
                {/* Glass reflection effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                </div>
                <CardHeader className="bg-gradient-to-r from-gray-50 to-pink-50 border-b">
                  <div className="flex items-start gap-4">
                    <img
                      src={profileData.avatar || "/model.png"}
                      alt={profileData.name}
                      className="w-20 h-20 rounded-full object-cover border-2 border-pink-200"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-2xl text-gray-900">{profileData.name}</CardTitle>
                        {profileData.isVerified && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">
                        @{profileData.username}
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        {profileData.about}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Joined {new Date(profileData.joinDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          Last seen {new Date(profileData.lastSeen).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { icon: Users, label: "Subscribers", value: profileData.subscribersCount, color: "text-blue-500", bgColor: "bg-blue-50", iconBgColor: "bg-blue-100" },
                  { icon: Eye, label: "Photos", value: profileData.photosCount, color: "text-green-500", bgColor: "bg-green-50", iconBgColor: "bg-green-100" },
                  { icon: Eye, label: "Videos", value: profileData.videosCount, color: "text-purple-500", bgColor: "bg-purple-50", iconBgColor: "bg-purple-100" },
                  { icon: Heart, label: "Total Likes", value: profileData.likesCount, color: "text-red-500", bgColor: "bg-red-50", iconBgColor: "bg-red-100" }
                ].map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={index} className="border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative overflow-hidden">
                      {/* Glass reflection effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
                      </div>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2">
                          <div className={`${stat.iconBgColor} p-3 rounded-full group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className={`w-5 h-5 ${stat.color} group-hover:text-pink-600 transition-colors duration-300`} />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-900">
                              <CountUp end={stat.value || 0} duration={2.5} />
                            </p>
                            <p className="text-sm text-gray-600">{stat.label}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          {statsData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: DollarSign, label: "Total Earnings", value: statsData.totalEarnings, color: "text-green-500", bgColor: "bg-green-50", iconBgColor: "bg-green-100", prefix: "$" },
                { icon: TrendingUp, label: "Monthly Earnings", value: statsData.monthlyEarnings, color: "text-blue-500", bgColor: "bg-blue-50", iconBgColor: "bg-blue-100", prefix: "$" },
                { icon: Users, label: "Active Subscribers", value: statsData.activeSubscribers, color: "text-purple-500", bgColor: "bg-purple-50", iconBgColor: "bg-purple-100" },
                { icon: TrendingUp, label: "Engagement Rate", value: statsData.engagementRate, color: "text-orange-500", bgColor: "bg-orange-50", iconBgColor: "bg-orange-100", suffix: "%" }
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative overflow-hidden">
                    {/* Glass reflection effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2">
                        <div className={`${stat.iconBgColor} p-3 rounded-full group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className={`w-5 h-5 ${stat.color} group-hover:text-pink-600 transition-colors duration-300`} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900">
                            {stat.prefix}
                            <CountUp 
                              end={stat.value || 0} 
                              duration={2.5} 
                              decimals={stat.suffix === "%" ? 1 : 0}
                            />
                            {stat.suffix}
                          </p>
                          <p className="text-sm text-gray-600">{stat.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          {postsData.length > 0 ? (
            <div className="space-y-4">
              {postsData.slice(0, 10).map((post) => (
                <Card key={post.id} className="border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative overflow-hidden">
                  {/* Glass reflection effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <p className="text-gray-800 mb-2">
                          {post.text.substring(0, 200)}
                          {post.text.length > 200 && "..."}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            <CountUp end={post.likesCount} duration={1} /> likes
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            <CountUp end={post.commentsCount} duration={1} /> comments
                          </span>
                          <span><CountUp end={post.mediaCount} duration={1} /> media files</span>
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {post.price > 0 && (
                        <Badge variant="outline" className="ml-4 border-green-200 text-green-700 bg-green-50">
                          ${post.price}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6 text-center">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No posts data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="earnings" className="space-y-6">
          <Card className="bg-white border border-gray-200 hover:border-pink-300 transition-all duration-300 relative group overflow-hidden">
            {/* Glass reflection effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
            </div>
            <CardHeader className="bg-gradient-to-r from-gray-50 to-pink-50 border-b">
              <CardTitle className="flex items-center space-x-2 text-gray-900">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span>Earnings Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center text-gray-600">
                <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p>Detailed earnings data will be displayed here</p>
                <p className="text-sm mt-2">This section will show earnings breakdowns, trends, and analytics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-40">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-pink-500" />
            <p className="text-sm text-gray-600 font-medium">
              Fetching OnlyFans data...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
