import { NextResponse } from 'next/server';

// In-memory cache for API responses
let cachedData: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Historical data storage (in production, use a database)
let historicalData: any[] = [];

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('forceRefresh') === 'true';
    
    // Check cache first
    const now = Date.now();
    if (!forceRefresh && cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('📦 Returning cached data');
      return NextResponse.json({
        ...cachedData,
        cached: true,
        cacheAge: Math.floor((now - cacheTimestamp) / 1000)
      });
    }

    console.log('🔄 Fetching fresh data from ElevenLabs...');

    // Map all API key profiles with their names
    const API_KEY_MAP: Record<string, { key: string | undefined, name: string }> = {
      account_1: { key: process.env.ELEVENLABS_KEY_ACCOUNT_1, name: "OF Bri's voice" },
      account_2: { key: process.env.ELEVENLABS_KEY_ACCOUNT_2, name: "OF Coco's voice" },
      account_3: { key: process.env.ELEVENLABS_KEY_ACCOUNT_3, name: "OF Mel's voice" },
      account_4: { key: process.env.ELEVENLABS_KEY_ACCOUNT_4, name: "OF Lala's voice" },
      account_5: { key: process.env.ELEVENLABS_KEY_ACCOUNT_5, name: "OF Bronwin's voice" },
      account_6: { key: process.env.ELEVENLABS_KEY_ACCOUNT_6, name: "OF Nicole's voice" },
      account_7: { key: process.env.ELEVENLABS_KEY_ACCOUNT_7, name: "OF Sarah's voice" },
      account_8: { key: process.env.ELEVENLABS_KEY_ACCOUNT_8, name: "OF Carter Cameron's voice" },
      account_9: { key: process.env.ELEVENLABS_KEY_ACCOUNT_9, name: "OF Sinatra's voice" },
      account_10: { key: process.env.ELEVENLABS_KEY_ACCOUNT_10, name: "OF Michelle G's voice" },
      account_11: { key: process.env.ELEVENLABS_KEY_ACCOUNT_11, name: "OF Oakly's voice" },
      account_12: { key: process.env.ELEVENLABS_KEY_ACCOUNT_12, name: "OF Marcie's voice" },
      account_13: { key: process.env.ELEVENLABS_KEY_ACCOUNT_13, name: "OF Elle's voice" },
      account_14: { key: process.env.ELEVENLABS_KEY_ACCOUNT_14, name: "OF Razz's voice" },
      account_15: { key: process.env.ELEVENLABS_KEY_ACCOUNT_15, name: "OF Autumn's voice" },
      account_16: { key: process.env.ELEVENLABS_KEY_ACCOUNT_16, name: "OF Natalie's voice" },
      account_17: { key: process.env.ELEVENLABS_KEY_ACCOUNT_17, name: "OF Dakota's voice" },
      account_18: { key: process.env.ELEVENLABS_KEY_ACCOUNT_18, name: "OF Victoria's voice" },
    };

    let totalVoiceGenerated = 0;
    let totalGeneratedToday = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    const thisWeek = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    // Array to store enhanced per-account stats
    const accountStats: Array<{
      accountId: string;
      accountName: string;
      totalGenerated: number;
      generatedToday: number;
      generatedYesterday: number;
      generatedThisWeek: number;
      lastGenerationDate?: string;
      avgDailyGeneration: number;
      velocity: 'high' | 'medium' | 'low';
      trend: 'up' | 'down' | 'stable';
      status: 'active' | 'warning' | 'inactive';
      lastActivityHours: number;
      recentActivity: Array<{ date: string; count: number }>;
    }> = [];

    // Track daily patterns
    const dailyBreakdown: Record<string, number> = {};
    
    // Fetch history from each account with enhanced analytics
    for (const [profileKey, { key: apiKey, name: accountName }] of Object.entries(API_KEY_MAP)) {
      if (!apiKey) continue;

      try {
        // Fetch all history with proper pagination
        let allHistoryItems: any[] = [];
        let hasMoreData = true;
        let startAfter = '';
        let pageCount = 0;
        
        console.log(`📊 Analyzing ${accountName}...`);
        
        while (hasMoreData && pageCount < 20) {
          const url = startAfter 
            ? `https://api.elevenlabs.io/v1/history?page_size=1000&start_after_history_item_id=${startAfter}`
            : 'https://api.elevenlabs.io/v1/history?page_size=1000';
            
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'xi-api-key': apiKey
            }
          });

          if (response.ok) {
            const data = await response.json();
            const historyItems = data.history || [];
            
            if (historyItems.length === 0) {
              hasMoreData = false;
            } else {
              allHistoryItems = [...allHistoryItems, ...historyItems];
              
              if (historyItems.length === 1000) {
                startAfter = historyItems[historyItems.length - 1].history_item_id;
                pageCount++;
              } else {
                hasMoreData = false;
              }
            }
          } else {
            console.error(`❌ API Error for ${accountName}:`, response.status);
            hasMoreData = false;
          }
        }
        
        const historyItems = allHistoryItems;
        console.log(`✅ ${accountName}: ${historyItems.length} total generations`);

        // Enhanced analytics calculations
        const accountTotal = historyItems.length;
        totalVoiceGenerated += accountTotal;
        
        // Time-based analytics
        const todayCount = historyItems.filter((item: any) => {
          const itemDate = new Date(item.date_unix * 1000).toDateString();
          return itemDate === today;
        }).length;
        
        const yesterdayCount = historyItems.filter((item: any) => {
          const itemDate = new Date(item.date_unix * 1000).toDateString();
          return itemDate === yesterday;
        }).length;
        
        const thisWeekCount = historyItems.filter((item: any) => {
          return item.date_unix * 1000 > thisWeek;
        }).length;
        
        totalGeneratedToday += todayCount;
        
        // Calculate velocity and trends
        const avgDailyGeneration = accountTotal > 0 ? Math.round(thisWeekCount / 7) : 0;
        const velocity = avgDailyGeneration > 20 ? 'high' : avgDailyGeneration > 5 ? 'medium' : 'low';
        const trend = todayCount > yesterdayCount ? 'up' : todayCount < yesterdayCount ? 'down' : 'stable';
        
        // Activity status
        let status: 'active' | 'warning' | 'inactive' = 'inactive';
        let lastActivityHours = 0;
        
        if (historyItems.length > 0) {
          const mostRecent = historyItems.reduce((latest: any, current: any) => {
            return current.date_unix > latest.date_unix ? current : latest;
          });
          
          lastActivityHours = Math.floor((Date.now() - (mostRecent.date_unix * 1000)) / (1000 * 60 * 60));
          
          if (lastActivityHours < 24) status = 'active';
          else if (lastActivityHours < 72) status = 'warning';
          else status = 'inactive';
        }
        
        // Recent 7-day activity pattern
        const recentActivity = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
          const dateStr = date.toDateString();
          const count = historyItems.filter((item: any) => {
            const itemDate = new Date(item.date_unix * 1000).toDateString();
            return itemDate === dateStr;
          }).length;
          
          recentActivity.push({
            date: date.toLocaleDateString(),
            count
          });
          
          // Add to daily breakdown
          dailyBreakdown[dateStr] = (dailyBreakdown[dateStr] || 0) + count;
        }
        
        // Find the most recent generation date
        let lastGenerationDate: string | undefined;
        if (historyItems.length > 0) {
          const mostRecent = historyItems.reduce((latest: any, current: any) => {
            return current.date_unix > latest.date_unix ? current : latest;
          });
          lastGenerationDate = new Date(mostRecent.date_unix * 1000).toLocaleDateString();
        }
        
        // Add to account stats
        accountStats.push({
          accountId: profileKey,
          accountName,
          totalGenerated: accountTotal,
          generatedToday: todayCount,
          generatedYesterday: yesterdayCount,
          generatedThisWeek: thisWeekCount,
          lastGenerationDate,
          avgDailyGeneration,
          velocity,
          trend,
          status,
          lastActivityHours,
          recentActivity
        });
        
      } catch (error) {
        console.error(`❌ Error processing ${accountName}:`, error);
        // Add account with 0 stats if error occurred
        accountStats.push({
          accountId: profileKey,
          accountName,
          totalGenerated: 0,
          generatedToday: 0,
          generatedYesterday: 0,
          generatedThisWeek: 0,
          avgDailyGeneration: 0,
          velocity: 'low' as const,
          trend: 'stable' as const,
          status: 'inactive' as const,
          lastActivityHours: 999,
          recentActivity: []
        });
      }
    }

    // Sort accounts by total generated (descending)
    accountStats.sort((a, b) => b.totalGenerated - a.totalGenerated);
    
    // Calculate advanced metrics
    const topAccount = accountStats[0];
    const mostActiveToday = accountStats.reduce((prev, current) => 
      current.generatedToday > prev.generatedToday ? current : prev
    );
    const fastestGrowing = accountStats.reduce((prev, current) => 
      current.avgDailyGeneration > prev.avgDailyGeneration ? current : prev
    );
    
    // Generate alerts
    const alerts: Array<{
      type: 'success' | 'warning' | 'info' | 'error';
      title: string;
      message: string;
      account: string;
    }> = [];
    
    // High performer alerts
    accountStats.forEach(account => {
      if (account.generatedToday > 50) {
        alerts.push({
          type: 'success',
          title: 'High Performance! 🔥',
          message: `${account.accountName} generated ${account.generatedToday} voices today!`,
          account: account.accountName
        });
      }
      
      if (account.status === 'inactive' && account.totalGenerated > 100) {
        alerts.push({
          type: 'warning',
          title: 'Account Inactive ⚠️',
          message: `${account.accountName} hasn't generated voices in ${account.lastActivityHours} hours`,
          account: account.accountName
        });
      }
      
      if (account.trend === 'up' && account.generatedToday > account.generatedYesterday * 2) {
        alerts.push({
          type: 'info',
          title: 'Trending Up! 📈',
          message: `${account.accountName} doubled production vs yesterday`,
          account: account.accountName
        });
      }
    });
    
    // Performance insights
    const insights = {
      totalAccounts: accountStats.length,
      activeToday: accountStats.filter(acc => acc.generatedToday > 0).length,
      highPerformers: accountStats.filter(acc => acc.velocity === 'high').length,
      inactiveAccounts: accountStats.filter(acc => acc.status === 'inactive').length,
      averagePerAccount: Math.round(totalVoiceGenerated / accountStats.length),
      weeklyGrowth: accountStats.reduce((sum, acc) => sum + acc.generatedThisWeek, 0),
      topPerformerToday: mostActiveToday?.accountName,
      fastestGrowingAccount: fastestGrowing?.accountName
    };
    
    // Create response data
    const responseData = {
      totalVoiceGenerated,
      newVoicesToday: totalGeneratedToday,
      accountStats,
      topAccount: topAccount || null,
      mostActiveToday,
      fastestGrowing,
      alerts: alerts.slice(0, 5), // Limit to 5 most important alerts
      insights,
      dailyBreakdown: Object.entries(dailyBreakdown).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString(),
        count
      })).slice(-7), // Last 7 days
      lastUpdated: new Date().toISOString(),
      cached: false,
      cacheAge: 0
    };
    
    // Cache the data
    cachedData = responseData;
    cacheTimestamp = now;
    
    // Store historical snapshot (in production, save to database)
    historicalData.push({
      timestamp: new Date().toISOString(),
      totalVoiceGenerated,
      newVoicesToday: totalGeneratedToday,
      activeAccounts: insights.activeToday
    });
    
    // Keep only last 30 days of historical data
    if (historicalData.length > 30) {
      historicalData = historicalData.slice(-30);
    }
    
    console.log('✨ Enhanced analytics complete!');
    
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error("❌ Error fetching enhanced voice history:", error);
    return NextResponse.json(
      { error: "Failed to fetch voice history stats" },
      { status: 500 }
    );
  }
}

// Add endpoint to get historical data
export async function POST(request: Request) {
  try {
    const { action } = await request.json();
    
    if (action === 'getHistorical') {
      return NextResponse.json({
        historical: historicalData,
        trends: {
          // Calculate basic trends from historical data
          avgDailyGrowth: historicalData.length > 1 
            ? Math.round((historicalData[historicalData.length - 1]?.totalVoiceGenerated - historicalData[0]?.totalVoiceGenerated) / historicalData.length)
            : 0
        }
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}