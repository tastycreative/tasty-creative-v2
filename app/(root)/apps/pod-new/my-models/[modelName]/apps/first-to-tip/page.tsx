import React from 'react';
import { Trophy, Users, DollarSign, Clock, Award, Star, Timer, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FirstToTipPageProps {
  params: Promise<{
    modelName: string;
  }>;
}

export default async function FirstToTipPage({ params }: FirstToTipPageProps) {
  const { modelName } = await params;

  const topTippers = [
    { name: "Alex M.", amount: "$125", time: "2m 34s", avatar: "" },
    { name: "Jordan K.", amount: "$89", time: "3m 12s", avatar: "" },
    { name: "Sam L.", amount: "$67", time: "4m 56s", avatar: "" },
    { name: "Casey R.", amount: "$45", time: "6m 23s", avatar: "" },
    { name: "Taylor B.", amount: "$34", time: "8m 45s", avatar: "" },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl text-white">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              First to Tip Leaderboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Fastest tippers for {decodeURIComponent(modelName)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-800">
            <Timer className="w-3 h-3 mr-2" />
            Live Tracking
          </Badge>
          <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
            <Trophy className="h-4 w-4 mr-2" />
            Start Competition
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <Trophy className="h-4 w-4 mr-2" />
              Total Winners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">847</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Total Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">$12,456</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">From competitions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Fastest Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">1.2s</div>
            <p className="text-xs text-yellow-600 dark:text-yellow-400">Record holder</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Participants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">234</div>
            <p className="text-xs text-blue-600 dark:text-blue-400">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Competition */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Award className="h-5 w-5 mr-2 text-yellow-500" />
              Current Competition
            </div>
            <Badge className="bg-red-500/10 text-red-600 border-red-200 dark:border-red-800">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
              Inactive
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Active Competition
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start a new "First to Tip" competition to engage your audience
            </p>
            <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
              Start New Competition
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-500" />
              All-Time Fastest Tippers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topTippers.map((tipper, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                      {tipper.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{tipper.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">⏱️ {tipper.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">{tipper.amount}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">First tip</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gift className="h-5 w-5 mr-2" />
              Competition Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Minimum Tip Amount</h4>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">$5</p>
              </div>
              
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Winner Reward</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Custom content or exclusive access
                </p>
              </div>
              
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Competition Duration</h4>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">24h</p>
              </div>
            </div>
            
            <Button variant="outline" className="w-full">
              Configure Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: FirstToTipPageProps) {
  const { modelName } = await params;
  const normalized = decodeURIComponent(modelName).trim();

  return {
    title: `${normalized} - First to Tip | Tasty Creative`,
    description: `First to tip competition leaderboard for ${normalized}`,
  };
}