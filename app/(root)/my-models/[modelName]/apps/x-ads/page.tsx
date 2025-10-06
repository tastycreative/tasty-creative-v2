"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress";
import {
  Eye,
  MousePointer,
  DollarSign,
  TrendingUp,
  Target,
  BarChart3,
  Plus
} from "lucide-react";

interface XAdsPageProps {
  params: Promise<{
    modelName: string;
  }>;
}

export default function XAdsPage({ params }: XAdsPageProps) {
  const [modelName, setModelName] = React.useState<string>("");

  React.useEffect(() => {
    params.then(({ modelName }) => {
      setModelName(modelName);
    });
  }, [params]);

  const decodedName = modelName ? decodeURIComponent(modelName) : "";

  if (!modelName) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading X Ads Manager...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Impressions",
      value: "125,430",
      icon: Eye,
      trend: "+12.5%",
      color: "text-blue-600"
    },
    {
      title: "Clicks",
      value: "8,924",
      icon: MousePointer,
      trend: "+8.2%",
      color: "text-green-600"
    },
    {
      title: "Ad Spend",
      value: "$2,140",
      icon: DollarSign,
      trend: "-5.1%",
      color: "text-orange-600"
    },
    {
      title: "Conversions",
      value: "342",
      icon: TrendingUp,
      trend: "+15.3%",
      color: "text-purple-600"
    }
  ];

  const campaigns = [
    {
      name: "OnlyFans Profile Promotion",
      status: "Active",
      budget: "$500",
      performance: 85,
      impressions: "45,234"
    },
    {
      name: "Content Teaser Campaign",
      status: "Active",
      budget: "$750",
      performance: 72,
      impressions: "32,145"
    },
    {
      name: "Premium Content Ads",
      status: "Paused",
      budget: "$300",
      performance: 93,
      impressions: "28,891"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {decodedName} - X ADS Manager
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Manage and monitor advertising campaigns
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Campaign
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className={`text-sm ${stat.color}`}>
                    {stat.trend}
                  </p>
                </div>
                <div className={`p-3 rounded-full bg-gray-100 dark:bg-gray-800 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Active Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.map((campaign, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium">{campaign.name}</h3>
                    <Badge variant={campaign.status === "Active" ? "default" : "secondary"}>
                      {campaign.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                    <span>Budget: {campaign.budget}</span>
                    <span>Impressions: {campaign.impressions}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Performance</p>
                    <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                        style={{ width: `${campaign.performance}%` }}
                      />
                    </div>
                    <p className="text-xs mt-1">{campaign.performance}%</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Campaign Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300">
              Detailed analytics and insights for your advertising campaigns will be displayed here.
            </p>
            <Button variant="outline" className="mt-4">
              View Analytics
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Audience Targeting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300">
              Configure and manage your target audience settings for optimal campaign performance.
            </p>
            <Button variant="outline" className="mt-4">
              Manage Targeting
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}