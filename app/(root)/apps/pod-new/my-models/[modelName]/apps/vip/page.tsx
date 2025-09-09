import React from 'react';
import { Crown, Users, DollarSign, Star, Gift, Shield, Sparkles, Heart, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface VipPageProps {
  params: Promise<{
    modelName: string;
  }>;
}

export default async function VipPage({ params }: VipPageProps) {
  const { modelName } = await params;

  const vipMembers = [
    { name: "Premium Fan", tier: "Diamond", spending: "$1,247", joinDate: "Jan 2024", avatar: "" },
    { name: "Top Supporter", tier: "Platinum", spending: "$892", joinDate: "Feb 2024", avatar: "" },
    { name: "VIP Member", tier: "Gold", spending: "$567", joinDate: "Mar 2024", avatar: "" },
    { name: "Elite Fan", tier: "Silver", spending: "$234", joinDate: "Apr 2024", avatar: "" },
  ];

  const vipTiers = [
    { name: "Silver", price: "$50", perks: ["Priority Messages", "Exclusive Content"], color: "from-gray-400 to-gray-600", members: 45 },
    { name: "Gold", price: "$100", perks: ["Silver Benefits", "Custom Requests", "Video Calls"], color: "from-yellow-400 to-yellow-600", members: 23 },
    { name: "Platinum", price: "$200", perks: ["Gold Benefits", "Personal Chat", "Priority Support"], color: "from-purple-400 to-purple-600", members: 12 },
    { name: "Diamond", price: "$500", perks: ["Platinum Benefits", "Exclusive Events", "Personal Assistant"], color: "from-blue-400 to-blue-600", members: 5 },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white">
            <Crown className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              VIP Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Premium memberships for {decodeURIComponent(modelName)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className="bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800">
            <Crown className="w-3 h-3 mr-2" />
            85 VIP Members
          </Badge>
          <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
            <Gift className="h-4 w-4 mr-2" />
            Send VIP Reward
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <Crown className="h-4 w-4 mr-2" />
              VIP Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">85</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">+12 this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              VIP Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">$8,940</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Monthly recurring</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <Star className="h-4 w-4 mr-2" />
              Average Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">Gold</div>
            <p className="text-xs text-blue-600 dark:text-blue-400">$105 avg spend</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <Heart className="h-4 w-4 mr-2" />
              Retention Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">94%</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">High loyalty</p>
          </CardContent>
        </Card>
      </div>

      {/* VIP Tiers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2" />
              VIP Tier Structure
            </div>
            <Button size="sm" variant="outline">
              Edit Tiers
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {vipTiers.map((tier, index) => (
              <div key={index} className="relative group">
                <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 transition-all">
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r ${tier.color} text-white mb-4`}>
                      <Crown className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {tier.name}
                    </h3>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      {tier.price}
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/month</span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {tier.perks.map((perk, perkIndex) => (
                        <div key={perkIndex} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Shield className="h-3 w-3 mr-2 text-emerald-500" />
                          {perk}
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {tier.members} Members
                      </div>
                      <Progress value={(tier.members / 50) * 100} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top VIP Members & Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-500" />
              Top VIP Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vipMembers.map((member, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={`text-xs ${
                          member.tier === 'Diamond' ? 'border-blue-200 text-blue-600' :
                          member.tier === 'Platinum' ? 'border-purple-200 text-purple-600' :
                          member.tier === 'Gold' ? 'border-yellow-200 text-yellow-600' :
                          'border-gray-200 text-gray-600'
                        }`}>
                          {member.tier}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Since {member.joinDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">{member.spending}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total spent</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />
              VIP Communication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <Gift className="h-4 w-4 mr-3" />
                Send Exclusive Content
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <MessageCircle className="h-4 w-4 mr-3" />
                Broadcast to VIP Members
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Sparkles className="h-4 w-4 mr-3" />
                Schedule VIP Event
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Heart className="h-4 w-4 mr-3" />
                Create Special Offer
              </Button>
            </div>
            
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Quick Stats</h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Messages sent:</span>
                  <span>247 this week</span>
                </div>
                <div className="flex justify-between">
                  <span>Response rate:</span>
                  <span>89%</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg. response time:</span>
                  <span>2m 34s</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: VipPageProps) {
  const { modelName } = await params;
  const normalized = decodeURIComponent(modelName).trim();

  return {
    title: `${normalized} - VIP Management | Tasty Creative`,
    description: `VIP member management for ${normalized}`,
  };
}