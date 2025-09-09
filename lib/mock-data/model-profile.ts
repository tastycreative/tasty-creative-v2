// Mock data for model profile page - Frontend UI development only
export interface ExtendedModelDetails {
  // Basic model info (extending existing ModelDetails)
  id: string;
  name: string;
  status: "active" | "dropped";
  launchDate: string;
  referrerName: string;
  personalityType: string;
  commonTerms: string[];
  commonEmojis: string[];
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  chattingManagers: string[];
  profileImage?: string;
  stats?: {
    totalRevenue: number;
    monthlyRevenue: number;
    subscribers: number;
    avgResponseTime: string;
  };

  // Extended profile data for the new page
  profile: {
    bio: string;
    location: string;
    timezone: string;
    languages: string[];
    joinedDate: string;
    lastActive: string;
    verificationStatus: "verified" | "pending" | "unverified";
    badges: string[];
  };

  // Analytics & Performance
  analytics: {
    performanceScore: number;
    growthRate: number;
    engagementRate: number;
    satisfactionScore: number;
    responseTime: {
      average: string;
      trend: number;
    };
    revenue: {
      thisMonth: number;
      lastMonth: number;
      trend: number;
      breakdown: {
        tips: number;
        subscriptions: number;
        customs: number;
        other: number;
      };
    };
    subscribers: {
      total: number;
      active: number;
      trend: number;
      newThisMonth: number;
    };
  };

  // Assets
  assets: {
    totalImages: number;
    categories: {
      profilePhotos: number;
      contentImages: number;
      promotional: number;
    };
    recentUploads: Array<{
      id: string;
      url: string;
      name: string;
      type: string;
      size: number;
      uploadDate: string;
      category: string;
    }>;
  };

  // Chatters
  chatters: {
    totalChatters: number;
    activeChatters: number;
    topChatters: Array<{
      id: string;
      username: string;
      avatar?: string;
      totalSpent: number;
      messageCount: number;
      lastActive: string;
      favorite: boolean;
    }>;
    recentActivity: Array<{
      id: string;
      username: string;
      action: string;
      amount?: number;
      timestamp: string;
    }>;
    analytics: {
      avgSessionTime: string;
      responseRate: number;
      tipConversionRate: number;
    };
  };

  // Connected Apps
  apps: {
    connected: Array<{
      id: string;
      name: string;
      icon: string;
      status: "connected" | "disconnected" | "error";
      lastSync: string;
      description: string;
    }>;
    available: Array<{
      id: string;
      name: string;
      icon: string;
      description: string;
      category: string;
    }>;
  };

  // Gallery/Content
  gallery: {
    totalPosts: number;
    totalViews: number;
    totalLikes: number;
    recentPosts: Array<{
      id: string;
      thumbnail: string;
      title: string;
      type: "image" | "video" | "live";
      views: number;
      likes: number;
      comments: number;
      revenue: number;
      publishedAt: string;
    }>;
    topPerforming: Array<{
      id: string;
      thumbnail: string;
      title: string;
      views: number;
      revenue: number;
      engagementRate: number;
    }>;
  };

  // Forum/Community
  forum: {
    totalThreads: number;
    totalPosts: number;
    moderationQueue: number;
    recentActivity: Array<{
      id: string;
      type: "thread" | "reply" | "like" | "report";
      user: string;
      content: string;
      timestamp: string;
    }>;
    popularThreads: Array<{
      id: string;
      title: string;
      author: string;
      replies: number;
      views: number;
      lastActivity: string;
      pinned?: boolean;
    }>;
  };
}

// Mock data for demonstration
export const mockModelData: ExtendedModelDetails = {
  // Basic info
  id: "model-sarah-chen",
  name: "Sarah Chen",
  status: "active",
  launchDate: "2023-06-15",
  referrerName: "Elite Talent Agency",
  personalityType: "Adventurous & Playful",
  commonTerms: ["adventure", "travel", "fashion", "lifestyle", "wellness"],
  commonEmojis: ["✨", "🌟", "💫", "🦋", "🌸"],
  instagram: "@sarahchen_official",
  twitter: "@sarahchen",
  tiktok: "@sarahchentiktok",
  chattingManagers: ["Emma Rodriguez", "Alex Kim"],
  profileImage:
    "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
  stats: {
    totalRevenue: 245000,
    monthlyRevenue: 28500,
    subscribers: 8450,
    avgResponseTime: "2.3 min",
  },

  // Extended profile
  profile: {
    bio: "Travel enthusiast & lifestyle creator sharing authentic moments from around the world. Let's explore together! ✨",
    location: "Los Angeles, CA",
    timezone: "PST",
    languages: ["English", "Mandarin", "Spanish"],
    joinedDate: "2023-06-15",
    lastActive: "2 minutes ago",
    verificationStatus: "verified",
    badges: [
      "Top Performer",
      "Elite Creator",
      "Community Favorite",
      "Rising Star",
    ],
  },

  // Analytics
  analytics: {
    performanceScore: 92,
    growthRate: 18.5,
    engagementRate: 23.7,
    satisfactionScore: 4.8,
    responseTime: {
      average: "2.3 min",
      trend: -12, // 12% improvement
    },
    revenue: {
      thisMonth: 28500,
      lastMonth: 24200,
      trend: 17.8,
      breakdown: {
        tips: 12400,
        subscriptions: 8900,
        customs: 5200,
        other: 2000,
      },
    },
    subscribers: {
      total: 8450,
      active: 6240,
      trend: 15.2,
      newThisMonth: 485,
    },
  },

  // Assets
  assets: {
    totalImages: 342,
    categories: {
      profilePhotos: 45,
      contentImages: 267,
      promotional: 30,
    },
    recentUploads: [
      {
        id: "img-1",
        url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=300&fit=crop",
        name: "sunset-beach-shoot.jpg",
        type: "image/jpeg",
        size: 2400000,
        uploadDate: "2024-01-08T10:30:00Z",
        category: "profilePhotos",
      },
      {
        id: "img-2",
        url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop",
        name: "fashion-studio-01.jpg",
        type: "image/jpeg",
        size: 1800000,
        uploadDate: "2024-01-07T15:45:00Z",
        category: "contentImages",
      },
    ],
  },

  // Chatters
  chatters: {
    totalChatters: 1205,
    activeChatters: 89,
    topChatters: [
      {
        id: "chatter-1",
        username: "alex_vip",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face",
        totalSpent: 2850,
        messageCount: 347,
        lastActive: "5 min ago",
        favorite: true,
      },
      {
        id: "chatter-2",
        username: "mike_premium",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face",
        totalSpent: 1940,
        messageCount: 892,
        lastActive: "1 hour ago",
        favorite: true,
      },
    ],
    recentActivity: [
      {
        id: "activity-1",
        username: "alex_vip",
        action: "sent tip",
        amount: 50,
        timestamp: "2024-01-08T14:30:00Z",
      },
      {
        id: "activity-2",
        username: "jenny_gold",
        action: "new message",
        timestamp: "2024-01-08T14:25:00Z",
      },
    ],
    analytics: {
      avgSessionTime: "23 min",
      responseRate: 94.5,
      tipConversionRate: 12.8,
    },
  },

  // Apps
  apps: {
    connected: [
      {
        id: "instagram",
        name: "Instagram",
        icon: "📱",
        status: "connected",
        lastSync: "2024-01-08T12:00:00Z",
        description: "Auto-sync posts and stories",
      },
      {
        id: "twitter",
        name: "Twitter",
        icon: "🐦",
        status: "connected",
        lastSync: "2024-01-08T11:30:00Z",
        description: "Cross-post content updates",
      },
    ],
    available: [
      {
        id: "tiktok",
        name: "TikTok",
        icon: "🎵",
        description: "Sync TikTok videos and engagement",
        category: "social",
      },
      {
        id: "calendar",
        name: "Google Calendar",
        icon: "📅",
        description: "Schedule and manage content calendar",
        category: "productivity",
      },
    ],
  },

  // Gallery
  gallery: {
    totalPosts: 189,
    totalViews: 2450000,
    totalLikes: 184500,
    recentPosts: [
      {
        id: "post-1",
        thumbnail:
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=300&fit=crop",
        title: "Golden Hour Beach Vibes",
        type: "image",
        views: 12400,
        likes: 890,
        comments: 45,
        revenue: 340,
        publishedAt: "2024-01-07T18:30:00Z",
      },
      {
        id: "post-2",
        thumbnail:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop",
        title: "Behind the Scenes: Studio Day",
        type: "video",
        views: 8900,
        likes: 567,
        comments: 23,
        revenue: 180,
        publishedAt: "2024-01-06T14:15:00Z",
      },
    ],
    topPerforming: [
      {
        id: "top-1",
        thumbnail:
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=300&fit=crop",
        title: "Golden Hour Beach Vibes",
        views: 12400,
        revenue: 340,
        engagementRate: 7.2,
      },
    ],
  },

  // Forum
  forum: {
    totalThreads: 23,
    totalPosts: 156,
    moderationQueue: 2,
    recentActivity: [
      {
        id: "forum-1",
        type: "thread",
        user: "fan_sarah_1",
        content: "Started new discussion: Travel Recommendations",
        timestamp: "2024-01-08T13:45:00Z",
      },
      {
        id: "forum-2",
        type: "reply",
        user: "sarah_supporter",
        content: "Replied to: Behind the Scenes Stories",
        timestamp: "2024-01-08T12:20:00Z",
      },
    ],
    popularThreads: [
      {
        id: "thread-1",
        title: "Travel Recommendations & Tips",
        author: "fan_sarah_1",
        replies: 23,
        views: 456,
        lastActivity: "2024-01-08T13:45:00Z",
        pinned: true,
      },
      {
        id: "thread-2",
        title: "Behind the Scenes Stories",
        author: "sarah_supporter",
        replies: 18,
        views: 289,
        lastActivity: "2024-01-08T12:20:00Z",
      },
    ],
  },
};

// Navigation items for sidebar
export const navigationItems = [
  {
    id: "information",
    label: "Information",
    icon: "📊",
    href: "/apps/pod-new/my-models/sarah-chen",
    description: "Overview, stats, and personal details",
  },
  {
    id: "assets",
    label: "Assets",
    icon: "🖼️",
    href: "/apps/pod-new/my-models/sarah-chen/assets",
    description: "Photos, videos, and media files",
  },
  {
    id: "chatters",
    label: "Chatters",
    icon: "💬",
    href: "/apps/pod-new/my-models/sarah-chen/chatters",
    description: "Fan engagement and conversations",
  },
  {
    id: "apps",
    label: "Apps",
    icon: "📱",
    href: "/apps/pod-new/my-models/sarah-chen/apps",
    description: "Connected platforms and integrations",
  },
  {
    id: "gallery",
    label: "Gallery",
    icon: "🖼️",
    href: "/apps/pod-new/my-models/sarah-chen/gallery",
    description: "Content performance and analytics",
  },
  {
    id: "forum",
    label: "Forum",
    icon: "💬",
    href: "/apps/pod-new/my-models/sarah-chen/forum",
    description: "Community discussions and moderation",
  },
];

// Mock data for multiple models (for testing navigation)
export const mockModelsDirectory = [
  {
    id: "sarah-chen",
    name: "Sarah Chen",
    slug: "sarah-chen",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
  },
  {
    id: "amber",
    name: "Amber Rose",
    slug: "amber",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face",
  },
  {
    id: "emma-rodriguez",
    name: "Emma Rodriguez",
    slug: "emma-rodriguez",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
  },
  {
    id: "alex-kim",
    name: "Alex Kim",
    slug: "alex-kim",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
  },
  {
    id: "bri",
    name: "Bri",
    slug: "bri",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=face",
  },
];

// Utility function to get mock data by model name
export const getMockModelData = (
  modelName: string
): ExtendedModelDetails | null => {
  const modelInfo = mockModelsDirectory.find((m) => m.slug === modelName);

  if (!modelInfo) {
    return null;
  }

  // Generate variations based on model name for demo
  const baseRevenue =
    modelName === "amber"
      ? 35000
      : modelName === "emma-rodriguez"
        ? 22000
        : 28500;
  const baseSubscribers =
    modelName === "amber"
      ? 12500
      : modelName === "emma-rodriguez"
        ? 6800
        : 8450;

  return {
    ...mockModelData,
    id: modelName,
    name: modelInfo.name,
    profileImage: modelInfo.avatar,
    analytics: {
      ...mockModelData.analytics,
      revenue: {
        ...mockModelData.analytics.revenue,
        thisMonth: baseRevenue,
        lastMonth: Math.round(baseRevenue * 0.85),
      },
      subscribers: {
        ...mockModelData.analytics.subscribers,
        total: baseSubscribers,
        active: Math.round(baseSubscribers * 0.74),
      },
    },
    stats: {
      ...mockModelData.stats!,
      monthlyRevenue: baseRevenue,
      subscribers: baseSubscribers,
    },
  };
};
