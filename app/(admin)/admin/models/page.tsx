"use client";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
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
  ExternalLink
} from "lucide-react";

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
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          OnlyFans Models Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage and monitor OnlyFans model performance and data
        </p>
      </div>

      {/* Search Section */}
      <div className="mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search OnlyFans Username
            </label>
            <Input
              type="text"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              placeholder="Enter OnlyFans username..."
              className="w-full"
            />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={loading || !searchUsername.trim()}
            className="px-6"
          >
            <Search className="w-4 h-4 mr-2" />
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
      </div>

      {/* OnlyFans Data Display */}
      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="accounts">All Accounts</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="posts">Recent Posts</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
        </TabsList>

          <TabsContent value="accounts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Connected OnlyFans Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                {accountsLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500/30 border-t-blue-500"></div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Loading accounts...</p>
                    </div>
                  </div>
                ) : accountsData.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {accountsData.map((account, index) => (
                      <Card key={account.id || index} className="p-4">
                        <div className="flex items-center space-x-4">
                          {account.avatar && (
                            <img 
                              src={account.avatar} 
                              alt={account.username || account.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate">
                              {account.name || account.username || 'Unknown'}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              @{account.username || 'No username'}
                            </p>
                            {account.subscribersCount && (
                              <p className="text-xs text-gray-500">
                                {account.subscribersCount.toLocaleString()} subscribers
                              </p>
                            )}
                          </div>
                          {account.isVerified && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              Verified
                            </Badge>
                          )}
                        </div>
                        {account.about && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 line-clamp-2">
                            {account.about}
                          </p>
                        )}
                        <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
                          <span>Posts: {account.postsCount || 0}</span>
                          <span>Likes: {account.likesCount || 0}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-600 dark:text-gray-400 py-8">
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
                <Card>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <img
                        src={profileData.avatar || "/model.png"}
                        alt={profileData.name}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-2xl">{profileData.name}</CardTitle>
                          {profileData.isVerified && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
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
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="text-2xl font-bold">{profileData.subscribersCount?.toLocaleString()}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Subscribers</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="text-2xl font-bold">{profileData.photosCount?.toLocaleString()}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Photos</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-purple-500" />
                        <div>
                          <p className="text-2xl font-bold">{profileData.videosCount?.toLocaleString()}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Videos</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-red-500" />
                        <div>
                          <p className="text-2xl font-bold">{profileData.likesCount?.toLocaleString()}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Likes</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            {statsData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold">${statsData.totalEarnings?.toLocaleString()}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold">${statsData.monthlyEarnings?.toLocaleString()}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Earnings</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="text-2xl font-bold">{statsData.activeSubscribers?.toLocaleString()}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Active Subscribers</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="text-2xl font-bold">{statsData.engagementRate?.toFixed(1)}%</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Engagement Rate</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="posts" className="space-y-4">
            {postsData.length > 0 ? (
              <div className="space-y-4">
                {postsData.slice(0, 10).map((post) => (
                  <Card key={post.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <p className="text-gray-800 dark:text-gray-200 mb-2">
                            {post.text.substring(0, 200)}
                            {post.text.length > 200 && "..."}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Heart className="w-4 h-4" />
                              {post.likesCount} likes
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" />
                              {post.commentsCount} comments
                            </span>
                            <span>{post.mediaCount} media files</span>
                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {post.price > 0 && (
                          <Badge variant="outline" className="ml-4">
                            ${post.price}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-600 dark:text-gray-400">No posts data available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="earnings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Earnings Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-600 dark:text-gray-400">
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
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500/30 border-t-blue-500"></div>
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
              Fetching OnlyFans data...
            </p>
          </div>
        </div>
      )}

      
    </div>
  );
}