import { ModelProfileLayout } from "@/components/pod-new/layouts/ModelProfileLayout";
import type { ExtendedModelDetails } from "@/lib/mock-data/model-profile";

interface ModelProfilePageProps {
  params: Promise<{
    modelName: string;
  }>;
}

function createSkeletonModel(name: string): ExtendedModelDetails {
  const now = new Date().toISOString();
  return {
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    status: "active",
    launchDate: now,
    referrerName: "",
    personalityType: "",
    commonTerms: [],
    commonEmojis: [],
    instagram: undefined,
    twitter: undefined,
    tiktok: undefined,
    chattingManagers: [],
    profileImage: undefined,
    stats: {
      totalRevenue: 0,
      monthlyRevenue: 0,
      subscribers: 0,
      avgResponseTime: "",
    },
    profile: {
      bio: "",
      location: "",
      timezone: "",
      languages: [],
      joinedDate: now,
      lastActive: now,
      verificationStatus: "verified",
      badges: [],
    },
    analytics: {
      performanceScore: 0,
      growthRate: 0,
      engagementRate: 0,
      satisfactionScore: 0,
      responseTime: { average: "", trend: 0 },
      revenue: {
        thisMonth: 0,
        lastMonth: 0,
        trend: 0,
        breakdown: { tips: 0, subscriptions: 0, customs: 0, other: 0 },
      },
      subscribers: { total: 0, active: 0, trend: 0, newThisMonth: 0 },
    },
    assets: {
      totalImages: 0,
      categories: { profilePhotos: 0, contentImages: 0, promotional: 0 },
      recentUploads: [],
    },
    chatters: {
      totalChatters: 0,
      activeChatters: 0,
      topChatters: [],
      recentActivity: [],
      analytics: { avgSessionTime: "", responseRate: 0, tipConversionRate: 0 },
    },
    apps: {
      connected: [],
      available: [],
    },
    gallery: {
      totalPosts: 0,
      totalViews: 0,
      totalLikes: 0,
      recentPosts: [],
      topPerforming: [],
    },
    forum: {
      totalThreads: 0,
      totalPosts: 0,
      moderationQueue: 0,
      recentActivity: [],
      popularThreads: [],
    },
  };
}

export default async function ModelProfilePage({ params }: ModelProfilePageProps) {
  const { modelName } = await params;
  const decodedName = decodeURIComponent(modelName);

  // Create skeleton model data for demonstration
  const modelData = createSkeletonModel(decodedName);

  return (
    <ModelProfileLayout
      modelData={modelData}
      creatorName={decodedName}
    />
  );
}