import React from 'react';
import { Zap, Target, BarChart3, DollarSign, Eye, MousePointerClick, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface XAdsPageProps {
  params: Promise<{
    modelName: string;
  }>;
}

export default async function XAdsPage({ params }: XAdsPageProps) {
  const { modelName } = await params;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              X ADS Manager
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Social media advertising for {decodeURIComponent(modelName)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className="bg-green-500/10 text-green-600 border-green-200 dark:border-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            3 Active Campaigns
          </Badge>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              Impressions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">24,567</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12.5% vs last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <MousePointerClick className="h-4 w-4 mr-2" />
              Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">1,847</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">7.5% CTR</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Ad Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">$2,456</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">234</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">12.7% rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Active Campaigns
            </div>
            <Button size="sm" variant="outline">
              View All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              name: "OnlyFans Profile Promotion",
              status: "Active",
              budget: "$800",
              spent: "$487",
              impressions: "12.4K",
              clicks: "967",
              progress: 61
            },
            {
              name: "Content Teaser Campaign",
              status: "Active",
              budget: "$600",
              spent: "$234",
              impressions: "8.2K",
              clicks: "543",
              progress: 39
            },
            {
              name: "Premium Content Ads",
              status: "Active",
              budget: "$1000",
              spent: "$678",
              impressions: "15.8K",
              clicks: "1.2K",
              progress: 68
            }
          ].map((campaign, index) => (
            <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {campaign.name}
                  </h3>
                  <Badge variant="outline" className="text-green-600 border-green-200 dark:border-green-800">
                    {campaign.status}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {campaign.spent} of {campaign.budget}
                </div>
              </div>
              <Progress value={campaign.progress} className="mb-2" />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{campaign.impressions} impressions</span>
                <span>{campaign.clicks} clicks</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Campaign Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Deep dive into your campaign performance with detailed analytics and insights.
            </p>
            <Button variant="outline" className="w-full">
              View Analytics Dashboard
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audience Targeting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Refine your target audience for better campaign performance and ROI.
            </p>
            <Button variant="outline" className="w-full">
              Manage Audiences
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: XAdsPageProps) {
  const { modelName } = await params;
  const normalized = decodeURIComponent(modelName).trim();

  return {
    title: `${normalized} - X ADS Manager | Tasty Creative`,
    description: `Social media advertising management for ${normalized}`,
  };
}