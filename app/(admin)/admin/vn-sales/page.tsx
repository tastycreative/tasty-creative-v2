"use client";

import { auth } from "@/auth";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { API_KEY_PROFILES } from "@/app/services/elevenlabs-implementation";

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



  // Function to get voices for a specific profile (copied from elevenlabs implementation)
  const getVoicesForProfile = async (profileKey: string) => {
    try {
        const profile = API_KEY_PROFILES[profileKey as keyof typeof API_KEY_PROFILES];

        if (!profile) {
            console.error(`Profile not found for profile key: ${profileKey}`);
            return [];
        }

        const response = await fetch('/api/elevenlabs/get-voices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ profileKey: profileKey }),
        });

        if (!response.ok) {
            console.error('Failed to fetch voices:', response.status, response.statusText);
            return [];
        }

        const data = await response.json();
        if (data && data.voices) {
            // Map the voices to the format expected by the Select component
            return data.voices.map((voice: any) => ({
                voiceId: voice.voice_id,
                name: voice.name,
            }));
        } else {
            console.warn('No voices returned from API');
            return [];
        }
    } catch (error) {
        console.error('Error fetching voices:', error);
        return [];
    }
};

  useEffect(() => {
    loadStats(); // Load stats on component mount
  }, []);

  useEffect(() => {
    const loadVoices = async () => {
        if (selectedApiProfile) {
            const profileVoices = await getVoicesForProfile(selectedApiProfile);
            setAvailableVoices(profileVoices);

            // Reset selected voice when changing profiles
            setSelectedVoice(profileVoices[0]?.voiceId || "");
        } else {
            setAvailableVoices([]);
            setSelectedVoice("");
        }
    };

    loadVoices();
    loadVoiceHistory(); // Load voice history whenever the API profile changes
}, [selectedApiProfile]);

  // Reset voice note selection when voice changes
  useEffect(() => {
    setSelectedVoiceNote("");
  }, [selectedVoice]);

  const loadVoiceHistory = async () => {
    if (!selectedApiProfile) return;

    try {
      setIsLoadingHistory(true);

      // Fetch from ElevenLabs history using selected API profile
      const response = await fetch('/api/elevenlabs/fetch-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKeyProfileKey: selectedApiProfile,
          voiceId: '', // Empty to get all voices
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
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">VN Sales Tracker</h1>
        <p className="text-gray-600 dark:text-gray-400">Track video note sales, loyalty points, and transactions</p>
      </div>

      <div className="grid gap-6">
        {/* Voice Note Sale Submission Form */}
        <Card className="bg-white dark:bg-gray-800 shadow">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Submit Voice Note Sale</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* API Profile Selection */}
              <div>
                <Label htmlFor="apiProfile" className="text-gray-700 dark:text-gray-300">Select API Profile</Label>
                <Select value={selectedApiProfile} onValueChange={setSelectedApiProfile}>
                  <SelectTrigger className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="Choose an API profile" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                    {Object.entries(API_KEY_PROFILES).map(([key, profile]) => (
                      <SelectItem key={key} value={key} className="dark:text-white dark:hover:bg-gray-700">
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Voice Selection */}
              <div>
                <Label htmlFor="voice-selection" className="text-gray-700 dark:text-gray-300">
                  Select Voice ({availableVoices.length} available)
                </Label>
                <Select
                  value={selectedVoice}
                  onValueChange={setSelectedVoice}
                  disabled={availableVoices.length === 0}
                >
                  <SelectTrigger className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 max-h-72">
                    {availableVoices.map((voice) => (
                      <SelectItem
                        key={voice.voiceId}
                        value={voice.voiceId}
                        className="dark:text-white dark:hover:bg-gray-700"
                      >
                        {voice.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Voice Note Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="voiceNote" className="text-gray-700 dark:text-gray-300">Select Voice Note</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={loadVoiceHistory}
                    disabled={isLoadingHistory}
                  >
                    {isLoadingHistory ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Refresh History'
                    )}
                  </Button>
                </div>
                <Select value={selectedVoiceNote} onValueChange={setSelectedVoiceNote} disabled={!selectedVoice || !selectedApiProfile}>
                  <SelectTrigger className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder={!selectedApiProfile ? "Select an API profile first" : !selectedVoice ? "Select a voice first" : "Choose a voice note from history"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                    {voiceHistory
                      .filter((item) => {
                        if (!selectedVoice) return false;
                        // More flexible matching - check if voice name contains the selected voice name or vice versa
                        const selectedVoiceData = availableVoices.find(v => v.voiceId === selectedVoice);
                        if (!selectedVoiceData) return false;

                        // Extract the core name (e.g., "Bri" from "OF Bri")
                        const coreName = selectedVoiceData.name.replace(/^OF\s/, '').replace(/\s\(.*\)$/, '');
                        return item.voice_name && (
                          item.voice_name.includes(coreName) || 
                          coreName.includes(item.voice_name) ||
                          item.voice_name === selectedVoiceData.name
                        );
                      })
                      .map((item) => (
                        <SelectItem key={item.history_item_id} value={item.history_item_id} className="dark:text-white dark:hover:bg-gray-700">
                          <div className="flex flex-col">
                            <span className="font-medium">
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
                {selectedVoice && selectedApiProfile && voiceHistory.filter((item) => {
                  const selectedVoiceData = availableVoices.find(v => v.voiceId === selectedVoice);
                  if (!selectedVoiceData) return false;

                  const coreName = selectedVoiceData.name.replace(/^OF\s/, '').replace(/\s\(.*\)$/, '');
                  return item.voice_name && (
                    item.voice_name.includes(coreName) || 
                    coreName.includes(item.voice_name) ||
                    item.voice_name === selectedVoiceData.name
                  );
                }).length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    No voice notes found for {availableVoices.find(v => v.voiceId === selectedVoice)?.name} in {API_KEY_PROFILES[selectedApiProfile as keyof typeof API_KEY_PROFILES]?.name}. Generate some voice notes first.
                  </p>
                )}
                {selectedApiProfile && voiceHistory.length === 0 && !isLoadingHistory && (
                  <p className="text-sm text-gray-500 mt-1">
                    No voice history found in {API_KEY_PROFILES[selectedApiProfile as keyof typeof API_KEY_PROFILES]?.name}. Make sure the API profile has voice generation history.
                  </p>
                )}
              </div>

              {/* Sale Price */}
              <div>
                <Label htmlFor="salePrice" className="text-gray-700 dark:text-gray-300">Sale Price ($)</Label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="Enter sale amount"
                  className="w-full"
                />
              </div>

              {/* Submit Status */}
              {submitStatus && (
                <Alert className={submitStatus.type === 'success' ? 'border-green-500' : 'border-red-500'}>
                  {submitStatus.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={submitStatus.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                    {submitStatus.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting || !selectedApiProfile || !selectedVoice || !selectedVoiceNote || !salePrice}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting Sale...
                  </>
                ) : (
                  'Submit Voice Note Sale'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sales Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">VN Sales Today</h3>
            <p className="text-2xl font-bold text-green-600">
              {isLoadingStats ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                `$${vnStats?.vnSalesToday?.toFixed(2) || '0.00'}`
              )}
            </p>
            <p className="text-sm text-gray-500">Real-time data</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Voice Generated</h3>
            <p className="text-2xl font-bold text-blue-600">
              {isLoadingStats ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                voiceStats?.totalVoiceGenerated?.toLocaleString() || '0'
              )}
            </p>
            <p className="text-sm text-blue-600">
              {voiceStats?.newVoicesToday || 0} new today
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</h3>
            <p className="text-2xl font-bold text-purple-600">
              {isLoadingStats ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                `$${vnStats?.totalRevenue?.toFixed(2) || '0.00'}`
              )}
            </p>
            <p className="text-sm text-purple-600">From {vnStats?.salesByModel?.length || 0} models</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Average VN Price</h3>
            <p className="text-2xl font-bold text-orange-600">
              {isLoadingStats ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                `$${vnStats?.averageVnPrice?.toFixed(2) || '0.00'}`
              )}
            </p>
            <p className="text-sm text-gray-500">Per voice note</p>
          </div>
        </div>

        {/* Sales by Model */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Sales by Model</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {isLoadingStats ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : vnStats?.salesByModel?.length > 0 ? (
                vnStats.salesByModel.map((model: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{model.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{model.sales} VN sales</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">${model.revenue.toFixed(2)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{model.loyaltyPoints} loyalty pts</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-600 dark:text-gray-400 py-4">
                  <p className="text-sm">No sales data found. Submit some sales above to see analytics!</p>
                </div>
              )}
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={loadStats}
                  disabled={isLoadingStats}
                  className="text-sm"
                >
                  {isLoadingStats ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Stats
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}