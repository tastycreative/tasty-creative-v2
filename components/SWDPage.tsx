'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, TrendingUp, Award, Trophy, Star, Zap, Sparkles, Crown, Medal, Users, FileText, Brain, Hash, Calendar } from 'lucide-react'

interface ModelData {
  creator: string
  totalSets: number
  totalScripts: number
  personalityType: string
  commonTerms: string
  commonEmojis: string
  restrictedTerms: string
}

interface SendBuyData {
  creator: string
  month: string
  dateUpdated: string
  scriptTitle: string
  scriptLink: string
  totalSend: number
  totalBuy: number
}

interface BestScript {
  title: string
  totalBuy?: string
  totalSend?: number
}

interface LeaderboardEntry {
  creator: string
  amount: string | number
  rank: number
}

interface Leaderboard {
  totalSend: LeaderboardEntry[]
  totalBuy: LeaderboardEntry[]
  zeroSet: string[]
  zeroScript: string[]
  highestSet: LeaderboardEntry[]
  lowestSet: LeaderboardEntry[]
  highestScript: LeaderboardEntry[]
  lowestScript: LeaderboardEntry[]
}

interface ApiResponse {
  modelData: ModelData[]
  sendBuyData: SendBuyData[]
  availableCreators: string[]
  availableMonths: string[]
}

interface CreatorStats {
  creator: string
  totalSend: number
  totalBuy: number
  totalSets: number
  totalScripts: number
}

const SWDPage = () => {
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [apiData, setApiData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/google/swd-data')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch script data')
      }
      
      const data: ApiResponse = await response.json()
      setApiData(data)
      
      // Set default selected model to first model if not set
      if (!selectedModel && data.modelData && data.modelData.length > 0) {
        setSelectedModel(data.modelData[0].creator)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Client-side filtering and calculations
  const { filteredSendBuyData, bestScripts, leaderboard } = useMemo(() => {
    if (!apiData) {
      return {
        filteredSendBuyData: [],
        bestScripts: { bestSeller: [], topSent: [] },
        leaderboard: {
          totalSend: [],
          totalBuy: [],
          zeroSet: [],
          zeroScript: [],
          highestSet: [],
          lowestSet: [],
          highestScript: [],
          lowestScript: []
        }
      }
    }

    // Filter by month for leaderboard only
    const monthFilteredData = selectedMonth !== 'all' 
      ? apiData.sendBuyData.filter(item => 
          item.month.toLowerCase() === selectedMonth.toLowerCase()
        )
      : apiData.sendBuyData

    // Filter by creator for best scripts only (no month filter)
    const creatorFilteredData = selectedModel 
      ? apiData.sendBuyData.filter(item => item.creator.toLowerCase() === selectedModel.toLowerCase())
      : apiData.sendBuyData

    // Calculate best scripts (filtered by creator only, not month)
    const bestScripts = {
      bestSeller: creatorFilteredData
        .sort((a, b) => b.totalBuy - a.totalBuy)
        .slice(0, 3)
        .map((item): BestScript => ({
          title: item.scriptTitle,
          totalBuy: `${item.totalBuy.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        })),
      topSent: creatorFilteredData
        .sort((a, b) => b.totalSend - a.totalSend)
        .slice(0, 3)
        .map((item): BestScript => ({
          title: item.scriptTitle,
          totalSend: item.totalSend
        }))
    }

    // Calculate leaderboard stats (using month-filtered data)
    const creatorStats: Record<string, CreatorStats> = {}
    
    // Initialize creator stats from model data
    apiData.modelData.forEach((model) => {
      creatorStats[model.creator] = {
        creator: model.creator,
        totalSend: 0,
        totalBuy: 0,
        totalSets: model.totalSets,
        totalScripts: model.totalScripts
      }
    })

    // Aggregate send/buy data by creator (using month-filtered data for leaderboard)
    monthFilteredData.forEach((item) => {
      if (!creatorStats[item.creator]) {
        creatorStats[item.creator] = {
          creator: item.creator,
          totalSend: 0,
          totalBuy: 0,
          totalSets: 0,
          totalScripts: 0
        }
      }
      creatorStats[item.creator].totalSend += item.totalSend
      creatorStats[item.creator].totalBuy += item.totalBuy
    })

    const creatorStatsArray = Object.values(creatorStats)

    // Generate leaderboard
    const leaderboard: Leaderboard = {
      totalSend: creatorStatsArray
        .sort((a, b) => b.totalSend - a.totalSend)
        .slice(0, 5)
        .map((creator, index) => ({
          creator: creator.creator,
          amount: creator.totalSend,
          rank: index
        })),
      totalBuy: creatorStatsArray
        .sort((a, b) => b.totalBuy - a.totalBuy)
        .slice(0, 5)
        .map((creator, index) => ({
          creator: creator.creator,
          amount: `$${creator.totalBuy.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          rank: index
        })),
      zeroSet: creatorStatsArray
        .filter(creator => creator.totalSets === 0)
        .map(creator => creator.creator),
      zeroScript: creatorStatsArray
        .filter(creator => creator.totalScripts === 0)
        .map(creator => creator.creator),
      highestSet: creatorStatsArray
        .filter(creator => creator.totalSets > 0)
        .sort((a, b) => b.totalSets - a.totalSets)
        .slice(0, 5)
        .map((creator, index) => ({
          creator: creator.creator,
          amount: creator.totalSets,
          rank: index
        })),
      lowestSet: creatorStatsArray
        .filter(creator => creator.totalSets > 0)
        .sort((a, b) => a.totalSets - b.totalSets)
        .slice(0, 5)
        .map((creator, index) => ({
          creator: creator.creator,
          amount: creator.totalSets,
          rank: index
        })),
      highestScript: creatorStatsArray
        .filter(creator => creator.totalScripts > 0)
        .sort((a, b) => b.totalScripts - a.totalScripts)
        .slice(0, 5)
        .map((creator, index) => ({
          creator: creator.creator,
          amount: creator.totalScripts,
          rank: index
        })),
      lowestScript: creatorStatsArray
        .filter(creator => creator.totalScripts > 0)
        .sort((a, b) => a.totalScripts - b.totalScripts)
        .slice(0, 5)
        .map((creator, index) => ({
          creator: creator.creator,
          amount: creator.totalScripts,
          rank: index
        }))
    }

    return {
      filteredSendBuyData: filteredData,
      bestScripts,
      leaderboard
    }
  }, [apiData, selectedModel, selectedMonth])

  const handleModelChange = (value: string) => {
    setSelectedModel(value)
  }

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value)
  }

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Crown className="w-5 h-5 text-yellow-400" />
    if (rank === 1) return <Medal className="w-5 h-5 text-gray-300" />
    if (rank === 2) return <Award className="w-5 h-5 text-amber-600" />
    return <Star className="w-4 h-4 text-purple-400" />
  }

  const currentModelData = apiData?.modelData.find(model => model.creator === selectedModel)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="relative">
              <div className="absolute inset-0 blur-xl bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-pulse"></div>
              <Loader2 className="relative w-16 h-16 text-white animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-white">Loading Script Data...</h2>
            <p className="text-gray-400">Fetching your dashboard information</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-red-400 mb-2">Error Loading Data</h2>
              <p className="text-gray-400 mb-4">{error}</p>
              <button 
                onClick={() => fetchAllData()}
                className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Animated Header */}
        <div className="text-center space-y-4 py-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 opacity-50 animate-pulse"></div>
            <h1 className="relative text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
              Script Writing Dashboard
            </h1>
          </div>
          <p className="text-gray-400 text-lg">Manage and track script performance in real-time</p>
        </div>

        {/* Model Selection Card */}
        <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-pink-900/10"></div>
          <CardHeader className="relative">
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Model Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Select Model</label>
              <Select value={selectedModel} onValueChange={handleModelChange}>
                <SelectTrigger className="w-full max-w-md bg-gray-800/50 border-gray-700 text-white hover:bg-gray-800/70 transition-all duration-200">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800">
                  {apiData?.availableCreators.map((creator) => (
                    <SelectItem 
                      key={creator} 
                      value={creator}
                      className="text-white hover:bg-gray-800 focus:bg-gray-800"
                    >
                      {creator}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Active Creator Filter Display */}
            {selectedModel && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-gray-400">Selected creator:</span>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                  {selectedModel}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Model Stats */}
        {currentModelData && (
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/5 to-purple-900/5"></div>
            <CardHeader className="relative border-b border-gray-800">
              <CardTitle className="text-white text-2xl flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                {selectedModel}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative p-0">
              <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y divide-gray-800">
                <div className="p-6 space-y-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">Total Sets</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{currentModelData.totalSets}</p>
                </div>
                <div className="p-6 space-y-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Hash className="w-4 h-4" />
                    <span className="text-sm">Total Scripts</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{currentModelData.totalScripts}</p>
                </div>
                <div className="p-6 space-y-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Brain className="w-4 h-4" />
                    <span className="text-sm">Personality</span>
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    {currentModelData.personalityType}
                  </Badge>
                </div>
                <div className="p-6 space-y-2">
                  <div className="text-gray-400 text-sm mb-1">Common Terms</div>
                  <p className="text-white text-sm">{currentModelData.commonTerms}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-y divide-gray-800">
                <div className="p-6 space-y-2">
                  <div className="text-gray-400 text-sm">Common Emojis</div>
                  <p className="text-2xl">{currentModelData.commonEmojis}</p>
                </div>
                <div className="p-6 space-y-2 md:col-span-2">
                  <div className="text-gray-400 text-sm">Restricted Terms</div>
                  <p className="text-white text-sm">{currentModelData.restrictedTerms || 'None'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Best Scripts */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Best Seller */}
          <Card className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border-amber-800/30 backdrop-blur-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center justify-center gap-3">
                <TrendingUp className="w-6 h-6 text-amber-400" />
                Best Seller Scripts
                <TrendingUp className="w-6 h-6 text-amber-400" />
              </CardTitle>
              {selectedModel && (
                <p className="text-center text-amber-200 text-sm">for {selectedModel}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {bestScripts.bestSeller.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  No data available for the selected filters
                </div>
              ) : (
                bestScripts.bestSeller.map((script, index) => (
                  <div 
                    key={index} 
                    className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg border border-amber-800/20 hover:border-amber-600/40 transition-all duration-200"
                  >
                    <span className="text-white font-medium">{script.title}</span>
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                      {script.totalBuy}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Top Sent */}
          <Card className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border-blue-800/30 backdrop-blur-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center justify-center gap-3">
                <Zap className="w-6 h-6 text-blue-400" />
                Top Sent Scripts
                <Zap className="w-6 h-6 text-blue-400" />
              </CardTitle>
              {selectedModel && (
                <p className="text-center text-blue-200 text-sm">for {selectedModel}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {bestScripts.topSent.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  No data available for the selected filters
                </div>
              ) : (
                bestScripts.topSent.map((script, index) => (
                  <div 
                    key={index} 
                    className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg border border-blue-800/20 hover:border-blue-600/40 transition-all duration-200"
                  >
                    <span className="text-white font-medium">{script.title}</span>
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                      {script.totalSend?.toLocaleString() || 0}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-xl overflow-hidden">
          <CardHeader className="text-center border-b border-gray-800 bg-gradient-to-r from-purple-900/20 via-pink-900/20 to-purple-900/20">
            <CardTitle className="text-3xl text-white flex items-center justify-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              LEADERBOARD
              <Trophy className="w-8 h-8 text-yellow-400" />
            </CardTitle>
            
            {/* Month Filter for Leaderboard */}
            <div className="mt-4 flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Filter by Month:</span>
              </div>
              <Select value={selectedMonth} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-48 bg-gray-800/50 border-gray-700 text-white hover:bg-gray-800/70 transition-all duration-200">
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800">
                  <SelectItem 
                    value="all"
                    className="text-white hover:bg-gray-800 focus:bg-gray-800"
                  >
                    All Months
                  </SelectItem>
                  {apiData?.availableMonths.map((month) => (
                    <SelectItem 
                      key={month} 
                      value={month}
                      className="text-white hover:bg-gray-800 focus:bg-gray-800"
                    >
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <p className="text-gray-400 mt-2">
              {selectedMonth !== 'all' ? `${selectedMonth} Rankings` : 'Overall Rankings'}
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            {/* Main Leaderboards */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Total Send */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white text-center flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  TOTAL SEND
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                </h3>
                <div className="space-y-2">
                  {leaderboard.totalSend.map((entry, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-purple-600/50 transition-all duration-200 ${
                        entry.rank === 0 ? 'border-yellow-500/50 bg-yellow-900/10' : ''
                      }`}
                    >
                      <div className="flex-shrink-0">{getRankIcon(entry.rank)}</div>
                      <span className="flex-grow text-white font-medium">{entry.creator}</span>
                      <span className={`font-bold text-lg ${
                        entry.rank === 0 ? 'text-yellow-400' : 'text-gray-300'
                      }`}>
                        {typeof entry.amount === 'number' ? entry.amount.toLocaleString() : entry.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Buy */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white text-center flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  TOTAL BUY
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </h3>
                <div className="space-y-2">
                  {leaderboard.totalBuy.map((entry, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-green-600/50 transition-all duration-200 ${
                        entry.rank === 0 ? 'border-yellow-500/50 bg-yellow-900/10' : ''
                      }`}
                    >
                      <div className="flex-shrink-0">{getRankIcon(entry.rank)}</div>
                      <span className="flex-grow text-white font-medium">{entry.creator}</span>
                      <span className={`font-bold text-lg ${
                        entry.rank === 0 ? 'text-yellow-400' : 'text-gray-300'
                      }`}>
                        {entry.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator className="bg-gray-800" />

            {/* Secondary Leaderboards */}
            <div className="grid md:grid-cols-4 gap-6">
              {/* Highest Set */}
              <div className="space-y-3">
                <h4 className="font-semibold text-white text-sm">Highest Set</h4>
                <div className="space-y-2">
                  {leaderboard.highestSet.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <span className="text-purple-400">{entry.rank + 1}.</span>
                      <span className="text-gray-300 truncate">{entry.creator}</span>
                      <span className="text-white ml-auto">{entry.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lowest Set */}
              <div className="space-y-3">
                <h4 className="font-semibold text-white text-sm">Lowest Set</h4>
                <div className="space-y-2">
                  {leaderboard.lowestSet.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <span className="text-purple-400">{entry.rank + 1}.</span>
                      <span className="text-gray-300 truncate">{entry.creator}</span>
                      <span className="text-white ml-auto">{entry.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Highest Script */}
              <div className="space-y-3">
                <h4 className="font-semibold text-white text-sm">Highest Script</h4>
                <div className="space-y-2">
                  {leaderboard.highestScript.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <span className="text-purple-400">{entry.rank + 1}.</span>
                      <span className="text-gray-300 truncate">{entry.creator}</span>
                      <span className="text-white ml-auto">{entry.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lowest Script */}
              <div className="space-y-3">
                <h4 className="font-semibold text-white text-sm">Lowest Script</h4>
                <div className="space-y-2">
                  {leaderboard.lowestScript.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <span className="text-purple-400">{entry.rank + 1}.</span>
                      <span className="text-gray-300 truncate">{entry.creator}</span>
                      <span className="text-white ml-auto">{entry.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Zero Lists */}
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <Card className="bg-red-900/10 border-red-800/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-red-400 text-sm">Zero Set Creators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {leaderboard.zeroSet.length === 0 ? (
                      <span className="text-gray-400 text-sm">No creators with zero sets</span>
                    ) : (
                      leaderboard.zeroSet.map((creator, index) => (
                        <Badge key={index} className="bg-red-900/20 text-red-300 border-red-800/30">
                          {creator}
                        </Badge>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-orange-900/10 border-orange-800/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-orange-400 text-sm">Zero Script Creators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {leaderboard.zeroScript.length === 0 ? (
                      <span className="text-gray-400 text-sm">No creators with zero scripts</span>
                    ) : (
                      leaderboard.zeroScript.map((creator, index) => (
                        <Badge key={index} className="bg-orange-900/20 text-orange-300 border-orange-800/30">
                          {creator}
                        </Badge>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SWDPage