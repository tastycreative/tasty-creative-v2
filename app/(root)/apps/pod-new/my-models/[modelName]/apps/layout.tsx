"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ModelProfileSidebar } from '@/components/pod-new/features/models/profile/ModelProfileSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ExtendedModelDetails } from '@/lib/mock-data/model-profile';

interface AppsLayoutProps {
  children: React.ReactNode;
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
    apps: { connected: [], available: [] },
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

export default function AppsLayout({ children, params }: AppsLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [modelData, setModelData] = React.useState<ExtendedModelDetails | null>(null);
  const [modelName, setModelName] = React.useState<string>('');

  React.useEffect(() => {
    async function resolveParams() {
      const resolvedParams = await params;
      const normalized = decodeURIComponent(resolvedParams.modelName).trim();
      setModelName(normalized);
      setModelData(createSkeletonModel(normalized));
    }
    resolveParams();
  }, [params]);

  // Extract current app route from pathname
  const currentAppRoute = React.useMemo(() => {
    if (!pathname) return undefined;
    
    const segments = pathname.split('/').filter(Boolean); // Remove empty segments
    
    // Find the last 'apps' in the path (since we have /apps/pod-new/my-models/[modelName]/apps/[appRoute])
    let appsIndex = -1;
    for (let i = segments.length - 1; i >= 0; i--) {
      if (segments[i] === 'apps') {
        appsIndex = i;
        break;
      }
    }
    
    if (appsIndex !== -1 && appsIndex < segments.length - 1) {
      const appRoute = segments[appsIndex + 1];
      
      // Map route names to IDs
      switch (appRoute) {
        case 'live': return 'live';
        case 'x-ads': return 'x-ads';
        case 'gif-maker': return 'gif-maker';
        case 'first-to-tip': return 'first-to-tip';
        case 'vip': return 'vip';
        default: return undefined;
      }
    }
    return undefined;
  }, [pathname]);

  const handleTabChange = (tabId: string) => {
    if (tabId === 'apps') {
      // Already on apps, do nothing
      return;
    }
    // Navigate back to the main model profile page with the selected tab
    router.push(`/apps/pod-new/my-models/${encodeURIComponent(modelName)}?tab=${tabId}`);
  };

  if (!modelData) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background">
      <SidebarProvider>
        <div className="flex h-full w-full">
          <ModelProfileSidebar
            modelData={modelData}
            activeTab="apps"
            onTabChange={handleTabChange}
            creatorName={modelName}
            currentAppRoute={currentAppRoute}
          />
          <SidebarInset className="flex-1 overflow-hidden">
            <main className="h-full overflow-y-auto">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}