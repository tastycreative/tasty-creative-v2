
"use client";

import { auth } from "@/auth";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  DollarSign, 
  TrendingUp, 
  BarChart3,
  Mic,
  FileAudio,
  Star,
  Activity,
  Calendar,
  Eye
} from "lucide-react";
import { API_KEY_PROFILES, getVoicesForProfile } from "@/app/services/elevenlabs-implementation";

interface VoiceHistoryItem {
  history_item_id: string;
  text: string;
  date_unix: number;
  voice_name: string;
}

export default function VNSalesPage() {
  const [selectedApiProfile, setSelectedApiProfile] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [selectedVoiceNote, setSelectedVoiceNote] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [voiceHistory, setVoiceHistory] = useState<VoiceHistoryItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [vnStats, setVnStats] = useState<any>(null);
  const [voiceStats, setVoiceStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Import API profiles and voice data from elevenlabs implementation
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);

  // Function to load real VN and voice statistics
  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const [vnStatsRes, voiceStatsRes] = await Promise.all([
        fetch('/api/vn-sales/stats'),
        fetch('/api/elevenlabs/total-history')
      ]);

      if (vnStatsRes.ok) {
        const vnData = await vnStatsRes.json();
        setVnStats(vnData);
      }

      if (voiceStatsRes.ok) {
        const voiceData = await voiceStatsRes.json();
        setVoiceStats(voiceData);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    loadStats(); // Load stats on component mount
  }, []);

  useEffect(() => {
    const loadVoices = async () => {
        if (selectedApiProfile) {
            const profileVoices = getVoicesForProfile(selectedApiProfile);
            setAvailableVoices(profileVoices);

            // Reset selected voice when changing profiles
            setSelectedVoice(profileVoices[0]?.voiceId || "");
        } else {
            setAvailableVoices([]);
            setSelectedVoice("");
        }
    };

    loadVoices();
}, [selectedApiProfile]);

// Separate useEffect for voice history that depends on both profile and voice
useEffect(() => {
    loadVoiceHistory();
}, [selectedApiProfile, selectedVoice]);

  // Reset voice note selection when voice changes
  useEffect(() => {
    setSelectedVoiceNote("");
  }, [selectedVoice]);

  const loadVoiceHistory = async () => {
    if (!selectedApiProfile || !selectedVoice) return;

    try {
      setIsLoadingHistory(true);

      // Fetch from ElevenLabs history using selected API profile and specific voice
      const response = await fetch('/api/elevenlabs/fetch-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKeyProfileKey: selectedApiProfile,
          voiceId: selectedVoice, // Use the specific selected voice ID
          pageSize: 100,
          pageIndex: 1,
          forceRefresh: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        setVoiceHistory(data.items || []);
      } else {
        console.error('Failed to fetch voice history');
      }
    } catch (error) {
      console.error('Error loading voice history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedApiProfile || !selectedVoice || !selectedVoiceNote || !salePrice) {
      setSubmitStatus({
        type: 'error',
        message: 'Please fill in all required fields'
      });
      return;
    }

    const selectedVoiceData = voiceHistory.find(item => item.history_item_id === selectedVoiceNote);
    if (!selectedVoiceData) {
      setSubmitStatus({
        type: 'error',
        message: 'Selected voice note not found'
      });
      return;
    }

    // Get the model name from the selected voice
    const selectedVoiceInfo = availableVoices.find(v => v.voiceId === selectedVoice);
    const modelName = selectedVoiceInfo?.name || 'Unknown Model';

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('/api/vn-sales/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedVoiceData.history_item_id, // Include the history_item_id as id
          model: modelName, // Use the voice name as the model name
          voiceNote: selectedVoiceData.text,
          sale: parseFloat(salePrice),
          soldDate: new Date().toISOString(),
          status: 'Completed',
          generatedDate: new Date(selectedVoiceData.date_unix * 1000).toISOString()
        })
      });

      if (response.ok) {
        setSubmitStatus({
          type: 'success',
          message: 'Voice note sale submitted successfully!'
        });

        // Reset form
        setSelectedApiProfile("");
        setSelectedVoice("");
        setSelectedVoiceNote("");
        setSalePrice("");

        // Reload stats to show updated data
        loadStats();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit voice note sale');
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to submit voice note sale'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (unixTimestamp: number) => {
    return new Date(unixTimestamp * 1000).toLocaleDateString() + ' ' + 
           new Date(unixTimestamp * 1000).toLocaleTimeString();
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gradient-to-br from-gray-50 via-white to-pink-50">
      {/* Header */}
      <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-pink-50 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">VN Sales Tracker</h1>
              <Mic className="h-6 w-6 text-pink-500" />
            </div>
            <p className="text-gray-600">
              Track video note sales, loyalty points, and transactions
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={loadStats}
              disabled={isLoadingStats}
              className="inline-flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingStats ? 'animate-spin' : ''}`} />
              Refresh Stats
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">VN Sales Today</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {isLoadingStats ? (
                    <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                  ) : (
                    `$${vnStats?.vnSalesToday?.toFixed(2) || '0.00'}`
                  )}
                </p>
                <div className="flex items-center text-sm">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-600 font-medium">Real-time data</span>
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-full group-hover:bg-green-100 transition-colors">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Voice Generated</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {isLoadingStats ? (
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  ) : (
                    voiceStats?.totalVoiceGenerated?.toLocaleString() || '0'
                  )}
                </p>
                <div className="flex items-center text-sm">
                  <Activity className="h-3 w-3 text-blue-500 mr-1" />
                  <span className="text-blue-600 font-medium">
                    {voiceStats?.newVoicesToday || 0} new today
                  </span>
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-full group-hover:bg-blue-100 transition-colors">
                <FileAudio className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {isLoadingStats ? (
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  ) : (
                    `$${vnStats?.totalRevenue?.toFixed(2) || '0.00'}`
                  )}
                </p>
                <div className="flex items-center text-sm">
                  <BarChart3 className="h-3 w-3 text-purple-500 mr-1" />
                  <span className="text-purple-600 font-medium">
                    From {vnStats?.salesByModel?.length || 0} models
                  </span>
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-full group-hover:bg-purple-100 transition-colors">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Average VN Price</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {isLoadingStats ? (
                    <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                  ) : (
                    `$${vnStats?.averageVnPrice?.toFixed(2) || '0.00'}`
                  )}
                </p>
                <div className="flex items-center text-sm">
                  <Star className="h-3 w-3 text-orange-500 mr-1" />
                  <span className="text-orange-600 font-medium">Per voice note</span>
                </div>
              </div>
              <div className="bg-orange-50 p-3 rounded-full group-hover:bg-orange-100 transition-colors">
                <Star className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Voice Note Sale Submission Form */}
      <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 bg-white">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-pink-50 border-b border-gray-200">
          <CardTitle className="text-gray-900 font-bold flex items-center">
            <Mic className="h-5 w-5 mr-2 text-pink-500" />
            Submit Voice Note Sale
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* API Profile Selection */}
            <div className="space-y-2">
              <Label htmlFor="apiProfile" className="text-sm font-medium text-gray-700">
                Select API Profile
              </Label>
              <Select value={selectedApiProfile} onValueChange={setSelectedApiProfile}>
                <SelectTrigger className="w-full bg-white border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all">
                  <SelectValue placeholder="Choose an API profile" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  {Object.entries(API_KEY_PROFILES).map(([key, profile]) => (
                    <SelectItem key={key} value={key} className="hover:bg-gray-50">
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Voice Selection */}
            <div className="space-y-2">
              <Label htmlFor="voice-selection" className="text-sm font-medium text-gray-700">
                Select Voice ({availableVoices.length} available)
              </Label>
              <Select
                value={selectedVoice}
                onValueChange={setSelectedVoice}
                disabled={availableVoices.length === 0}
              >
                <SelectTrigger className="w-full bg-white border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all disabled:bg-gray-50">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300 max-h-72">
                  {availableVoices.map((voice) => (
                    <SelectItem
                      key={voice.voiceId}
                      value={voice.voiceId}
                      className="hover:bg-gray-50"
                    >
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Voice Note Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="voiceNote" className="text-sm font-medium text-gray-700">
                  Select Voice Note
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadVoiceHistory}
                  disabled={isLoadingHistory}
                  className="text-gray-600 hover:text-gray-800 border-gray-300 hover:border-pink-300 hover:bg-pink-50 transition-all"
                >
                  {isLoadingHistory ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh History
                    </>
                  )}
                </Button>
              </div>
              <Select 
                value={selectedVoiceNote} 
                onValueChange={setSelectedVoiceNote} 
                disabled={!selectedVoice || !selectedApiProfile}
              >
                <SelectTrigger className="w-full bg-white border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all disabled:bg-gray-50">
                  <SelectValue placeholder={
                    !selectedApiProfile 
                      ? "Select an API profile first" 
                      : !selectedVoice 
                        ? "Select a voice first" 
                        : "Choose a voice note from history"
                  } />
                </SelectTrigger>
                <SelectContent className="max-h-60 bg-white border-gray-300">
                  {voiceHistory.map((item) => (
                    <SelectItem key={item.history_item_id} value={item.history_item_id} className="hover:bg-gray-50">
                      <div className="flex flex-col space-y-1">
                        <span className="font-medium text-gray-900">
                          {truncateText(item.text, 40)}
                        </span>
                        <span className="text-xs text-gray-500">
                          Generated: {formatDate(item.date_unix)} | Voice: {item.voice_name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedVoice && selectedApiProfile && voiceHistory.length === 0 && !isLoadingHistory && (
                <p className="text-sm text-gray-600 mt-1">
                  No voice notes found for {availableVoices.find(v => v.voiceId === selectedVoice)?.name} in {API_KEY_PROFILES[selectedApiProfile as keyof typeof API_KEY_PROFILES]?.name}. Generate some voice notes first.
                </p>
              )}
            </div>

            {/* Sale Price */}
            <div className="space-y-2">
              <Label htmlFor="salePrice" className="text-sm font-medium text-gray-700">
                Sale Price ($)
              </Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                min="0"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="Enter sale amount"
                className="w-full bg-white border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
              />
            </div>

            {/* Submit Status */}
            {submitStatus && (
              <Alert className={
                submitStatus.type === 'success' 
                  ? 'border-green-500 bg-green-50 text-green-800' 
                  : 'border-red-500 bg-red-50 text-red-800'
              }>
                {submitStatus.type === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={
                  submitStatus.type === 'success' ? 'text-green-700' : 'text-red-700'
                }>
                  {submitStatus.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-pink-500 hover:bg-pink-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
              disabled={isSubmitting || !selectedApiProfile || !selectedVoice || !selectedVoiceNote || !salePrice}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting Sale...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Submit Voice Note Sale
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Enhanced Sales by Model */}
      <Card className="border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 bg-white">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-pink-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900 font-bold flex items-center">
              <Eye className="h-5 w-5 mr-2 text-pink-500" />
              Sales by Model
            </CardTitle>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {isLoadingStats ? (
              <div className="flex justify-center py-8">
                <div className="flex items-center text-gray-500">
                  <Loader2 className="h-6 w-6 animate-spin mr-2 text-pink-500" />
                  <span>Fetching sales data...</span>
                </div>
              </div>
            ) : vnStats?.salesByModel?.length > 0 ? (
              vnStats.salesByModel.map((model: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-pink-50 rounded-lg border border-gray-200 hover:border-pink-300 transition-all duration-300 group hover:shadow-md"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-pink-100 p-2 rounded-full group-hover:bg-pink-200 transition-colors">
                      <Mic className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-pink-700 transition-colors">
                        {model.name}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center">
                        <FileAudio className="h-3 w-3 mr-1" />
                        {model.sales} VN sales
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 text-lg">
                      ${model.revenue.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center justify-end">
                      <Star className="h-3 w-3 mr-1 text-yellow-500" />
                      {model.loyaltyPoints} loyalty pts
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-600 py-8">
                <div className="flex flex-col items-center space-y-3">
                  <div className="bg-gray-100 p-4 rounded-full">
                    <BarChart3 className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium">No sales data found</p>
                  <p className="text-sm text-gray-500">Submit some sales above to see analytics!</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
