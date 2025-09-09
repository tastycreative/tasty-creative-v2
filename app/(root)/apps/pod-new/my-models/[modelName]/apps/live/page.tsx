import React from 'react';
import { Radio, Users, DollarSign, Clock, Eye, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface LivePageProps {
  params: Promise<{
    modelName: string;
  }>;
}

export default async function LivePage({ params }: LivePageProps) {
  const { modelName } = await params;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl text-white">
            <Radio className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              LIVE Streaming
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Live streaming management for {decodeURIComponent(modelName)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className="bg-red-500/10 text-red-600 border-red-200 dark:border-red-800">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
            OFFLINE
          </Badge>
          <Button className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600">
            Start Live Stream
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              Total Viewers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Currently offline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Peak Viewers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">247</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Last stream</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Tips Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">$0</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">This session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Stream Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">0:00</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Not streaming</p>
          </CardContent>
        </Card>
      </div>

      {/* Stream Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Radio className="h-5 w-5 mr-2 text-red-500" />
            Stream Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Radio className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Stream Preview</p>
              <p className="text-sm">Camera feed will appear here when live</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stream Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Stream Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Configure your live streaming settings, chat moderation, and viewer interaction preferences.
            </p>
            <Button variant="outline" className="w-full">
              Open Stream Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Stream Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              View detailed analytics about your live streams, viewer engagement, and earnings.
            </p>
            <Button variant="outline" className="w-full">
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: LivePageProps) {
  const { modelName } = await params;
  const normalized = decodeURIComponent(modelName).trim();

  return {
    title: `${normalized} - LIVE Streaming | Tasty Creative`,
    description: `Live streaming management for ${normalized}`,
  };
}