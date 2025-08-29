'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Clock, 
  Calendar, 
  TrendingUp, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle,
  Send,
  Target,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

interface PTRItem {
  id: string;
  sheetRowId: string;
  title: string;
  creatorName: string;
  captionText: string;
  gifUrl?: string;
  previewUrl?: string;
  price: number;
  lastUsed: Date | null;
  usageCount: number;
  rotationStatus: 'Active' | 'Resting' | 'Ready';
  daysSinceLastSent: number | null;
  isReadyForRotation: boolean;
  outcome?: string;
  performanceHistory?: Array<{
    sentDate: string;
    result?: 'good' | 'bad' | 'pending';
  }>;
}

interface DailyPTRStatus {
  sentToday: number;
  goal: number;
  morningPTR: { sent: boolean; item?: PTRItem };
  eveningPTR: { sent: boolean; item?: PTRItem };
  readyForRotation: PTRItem[];
}

interface PTRDashboardProps {
  dailyGoal?: number;
}

const PTRDashboard: React.FC<PTRDashboardProps> = ({ dailyGoal = 2 }) => {
  const [dailyStatus, setDailyStatus] = useState<DailyPTRStatus | null>(null);
  const [readyPTRs, setReadyPTRs] = useState<PTRItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingPTR, setSendingPTR] = useState<Set<string>>(new Set());

  // Fetch daily PTR status
  const fetchDailyStatus = async () => {
    try {
      const response = await fetch('/api/ptr-rotation?endpoint=daily-status');
      if (response.ok) {
        const data = await response.json();
        setDailyStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch daily PTR status:', error);
    }
  };

  // Fetch ready PTRs
  const fetchReadyPTRs = async () => {
    try {
      const response = await fetch('/api/ptr-rotation?endpoint=ready');
      if (response.ok) {
        const data = await response.json();
        setReadyPTRs(data.readyForRotation || []);
      }
    } catch (error) {
      console.error('Failed to fetch ready PTRs:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchDailyStatus(), fetchReadyPTRs()]);
      setLoading(false);
    };
    
    fetchData();
  }, []);

  // Mark PTR as sent
  const handleMarkAsSent = async (item: PTRItem) => {
    if (sendingPTR.has(item.id)) return;

    setSendingPTR(prev => new Set(prev).add(item.id));

    try {
      const response = await fetch('/api/ptr-rotation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: item.sheetRowId,
          sentAt: new Date().toISOString(),
          result: 'pending', // Will be updated based on actual performance
        }),
      });

      if (response.ok) {
        toast.success(`Marked "${item.title}" as sent!`, {
          description: 'PTR tracking updated successfully',
          duration: 3000,
        });
        
        // Refresh data
        await Promise.all([fetchDailyStatus(), fetchReadyPTRs()]);
      } else {
        const errorData = await response.json();
        toast.error('Failed to mark PTR as sent', {
          description: errorData.error || 'Please try again',
        });
      }
    } catch (error) {
      console.error('Error marking PTR as sent:', error);
      toast.error('Network error', {
        description: 'Please check your connection and try again',
      });
    } finally {
      setSendingPTR(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  // Get rotation status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ready': return 'bg-green-100 text-green-700 border-green-200';
      case 'Resting': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Active': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Get rotation status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Ready': return <RotateCcw className="w-4 h-4" />;
      case 'Resting': return <Clock className="w-4 h-4" />;
      case 'Active': return <TrendingUp className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
        <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Daily PTR Goal Tracker */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Today's PTR Goals
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Track your daily rotation progress
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {dailyStatus?.sentToday || 0}/{dailyStatus?.goal || dailyGoal}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">PTRs sent</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min(100, ((dailyStatus?.sentToday || 0) / (dailyStatus?.goal || dailyGoal)) * 100)}%` 
              }}
            />
          </div>

          {/* Morning/Evening PTR Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Morning PTR</span>
              </div>
              {dailyStatus?.morningPTR.sent ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    Sent: {dailyStatus.morningPTR.item?.title || 'Unknown'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Not sent yet</span>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Evening PTR</span>
              </div>
              {dailyStatus?.eveningPTR.sent ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    Sent: {dailyStatus.eveningPTR.item?.title || 'Unknown'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Not sent yet</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ready for Rotation PTRs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Ready for Rotation ({readyPTRs.length})
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => Promise.all([fetchDailyStatus(), fetchReadyPTRs()])}
            className="border-gray-300 dark:border-gray-600"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {readyPTRs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No PTRs Ready for Rotation
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                All PTRs are either recently sent or still in their resting period.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readyPTRs.slice(0, 6).map((ptr) => (
              <Card key={ptr.id} className="group hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4">
                  {/* PTR Preview */}
                  <div className="relative h-32 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-lg mb-3 overflow-hidden">
                    {ptr.previewUrl ? (
                      <img 
                        src={ptr.previewUrl} 
                        alt={ptr.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Star className="w-8 h-8 text-white opacity-50" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge className={`text-xs px-2 py-1 border ${getStatusColor(ptr.rotationStatus)}`}>
                        {getStatusIcon(ptr.rotationStatus)}
                        <span className="ml-1">{ptr.rotationStatus}</span>
                      </Badge>
                    </div>
                  </div>

                  {/* PTR Info */}
                  <div className="space-y-2 mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                      {ptr.title}
                    </h4>
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>{ptr.creatorName}</span>
                      <span className="font-medium">${ptr.price}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                      <span>Used {ptr.usageCount} times</span>
                      <span>
                        {ptr.daysSinceLastSent === null 
                          ? 'Never sent' 
                          : `${ptr.daysSinceLastSent} days ago`
                        }
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                    onClick={() => handleMarkAsSent(ptr)}
                    disabled={sendingPTR.has(ptr.id)}
                  >
                    {sendingPTR.has(ptr.id) ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    {sendingPTR.has(ptr.id) ? 'Marking...' : 'Mark as Sent'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {readyPTRs.length > 6 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing top 6 ready PTRs. {readyPTRs.length - 6} more available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PTRDashboard;