
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface ModelData {
  creator: string
  totalSets: number
  totalScripts: number
  personalityType: string
  commonTerms: string
  commonEmojis: string
  restrictedTerms: string
}

interface BestScript {
  title: string
  totalBuy: string
  totalSend: number
}

interface LeaderboardEntry {
  creator: string
  amount: string | number
  rank: number
}

interface ScriptData {
  modelData: ModelData[]
  bestScripts: {
    bestSeller: BestScript[]
    topSent: BestScript[]
  }
  leaderboard: {
    totalSend: LeaderboardEntry[]
    totalBuy: LeaderboardEntry[]
    zeroSet: string[]
    zeroScript: string[]
    highestSet: LeaderboardEntry[]
    lowestSet: LeaderboardEntry[]
    highestScript: LeaderboardEntry[]
    lowestScript: LeaderboardEntry[]
  }
}

const SWDPage = () => {
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [scriptData, setScriptData] = useState<ScriptData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchScriptData()
  }, [])

  const fetchScriptData = async () => {
    try {
      setLoading(true)
      // Replace with your actual Google Sheets API endpoint
      const response = await fetch('/api/google/swd-data')
      
      if (!response.ok) {
        throw new Error('Failed to fetch script data')
      }
      
      const data = await response.json()
      setScriptData(data)
      
      // Set default selected model to first model
      if (data.modelData && data.modelData.length > 0) {
        setSelectedModel(data.modelData[0].creator)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getStarRating = (rank: number) => {
    const stars = '★'.repeat(5 - rank) + '☆'.repeat(rank)
    return stars
  }

  const currentModelData = scriptData?.modelData.find(model => model.creator === selectedModel)

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Script Writing Dashboard</h1>
          <p className="text-muted-foreground">Loading script data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Script Writing Dashboard</h1>
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Script Writing Dashboard</h1>
        <p className="text-muted-foreground">Manage and track script performance</p>
      </div>

      {/* Model Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Model Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {scriptData?.modelData.map((model) => (
                <SelectItem key={model.creator} value={model.creator}>
                  {model.creator}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Model Stats Table */}
      {currentModelData && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedModel}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-semibold">Creator</th>
                    <th className="text-left p-2 font-semibold">Total Sets</th>
                    <th className="text-left p-2 font-semibold">Total Scripts</th>
                    <th className="text-left p-2 font-semibold">Personality Type</th>
                    <th className="text-left p-2 font-semibold">Common Terms</th>
                    <th className="text-left p-2 font-semibold">Common Emojis</th>
                    <th className="text-left p-2 font-semibold">Restricted Terms or Emojis</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2">{currentModelData.creator}</td>
                    <td className="p-2">{currentModelData.totalSets}</td>
                    <td className="p-2">{currentModelData.totalScripts}</td>
                    <td className="p-2">{currentModelData.personalityType}</td>
                    <td className="p-2">{currentModelData.commonTerms}</td>
                    <td className="p-2">{currentModelData.commonEmojis}</td>
                    <td className="p-2">{currentModelData.restrictedTerms}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Best Scripts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">🏅 BEST SCRIPTS 🏅</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Best Seller Scripts */}
            <div>
              <h3 className="font-semibold mb-3 text-center">Best Seller Script ⏩</h3>
              <div className="space-y-2">
                <div className="flex justify-between font-semibold border-b pb-1">
                  <span>Script Title</span>
                  <span>Total Buy</span>
                </div>
                {scriptData?.bestScripts.bestSeller.map((script, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-sm">{script.title}</span>
                    <span className="text-sm font-medium">{script.totalBuy}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Sent Scripts */}
            <div>
              <h3 className="font-semibold mb-3 text-center">Top Sent ⏪ Scripts</h3>
              <div className="space-y-2">
                <div className="flex justify-between font-semibold border-b pb-1">
                  <span>Script Title</span>
                  <span>Total Send</span>
                </div>
                {scriptData?.bestScripts.topSent.map((script, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-sm">{script.title}</span>
                    <span className="text-sm font-medium">{script.totalSend.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">🏆 LEADERBOARD 🏆</CardTitle>
          <p className="text-center text-muted-foreground">February</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Total Send and Total Buy */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3 text-center">TOTAL SEND</h3>
              <div className="space-y-2">
                <div className="flex justify-between font-semibold border-b pb-1">
                  <span></span>
                  <span>Creator</span>
                  <span>Amount</span>
                </div>
                {scriptData?.leaderboard.totalSend.map((entry, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{getStarRating(entry.rank)}</span>
                    <span className="text-sm">{entry.creator}</span>
                    <span className="text-sm font-medium">{entry.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-center">TOTAL BUY</h3>
              <div className="space-y-2">
                <div className="flex justify-between font-semibold border-b pb-1">
                  <span></span>
                  <span>Creator</span>
                  <span>Amount</span>
                </div>
                {scriptData?.leaderboard.totalBuy.map((entry, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{getStarRating(entry.rank)}</span>
                    <span className="text-sm">{entry.creator}</span>
                    <span className="text-sm font-medium">{entry.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Leaderboards */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Highest/Lowest Sets */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Highest Set</h4>
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold text-xs border-b pb-1">
                    <span></span>
                    <span>Creator</span>
                    <span>Value</span>
                  </div>
                  {scriptData?.leaderboard.highestSet.map((entry, index) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                      <span>{getStarRating(entry.rank)}</span>
                      <span>{entry.creator}</span>
                      <span>{entry.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Lowest Set (non-zero)</h4>
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold text-xs border-b pb-1">
                    <span></span>
                    <span>Creator</span>
                    <span>Value</span>
                  </div>
                  {scriptData?.leaderboard.lowestSet.map((entry, index) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                      <span>{getStarRating(entry.rank)}</span>
                      <span>{entry.creator}</span>
                      <span>{entry.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Highest/Lowest Scripts */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Highest Script</h4>
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold text-xs border-b pb-1">
                    <span></span>
                    <span>Creator</span>
                    <span>Value</span>
                  </div>
                  {scriptData?.leaderboard.highestScript.map((entry, index) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                      <span>{getStarRating(entry.rank)}</span>
                      <span>{entry.creator}</span>
                      <span>{entry.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Lowest Script (non-zero)</h4>
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold text-xs border-b pb-1">
                    <span></span>
                    <span>Creator</span>
                    <span>Value</span>
                  </div>
                  {scriptData?.leaderboard.lowestScript.map((entry, index) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                      <span>{getStarRating(entry.rank)}</span>
                      <span>{entry.creator}</span>
                      <span>{entry.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Zero Lists */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Zero Set</h4>
                <div className="space-y-1">
                  {scriptData?.leaderboard.zeroSet.map((creator, index) => (
                    <div key={index} className="text-xs">{creator}</div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Zero Script</h4>
                <div className="space-y-1">
                  {scriptData?.leaderboard.zeroScript.map((creator, index) => (
                    <div key={index} className="text-xs">{creator}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SWDPage
