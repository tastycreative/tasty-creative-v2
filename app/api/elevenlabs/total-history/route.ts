
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Map all API key profiles
    const API_KEY_MAP: Record<string, string | undefined> = {
      account_1: process.env.ELEVENLABS_KEY_ACCOUNT_1,
      account_2: process.env.ELEVENLABS_KEY_ACCOUNT_2,
      account_3: process.env.ELEVENLABS_KEY_ACCOUNT_3,
      account_4: process.env.ELEVENLABS_KEY_ACCOUNT_4,
      account_5: process.env.ELEVENLABS_KEY_ACCOUNT_5,
      account_6: process.env.ELEVENLABS_KEY_ACCOUNT_6,
      account_7: process.env.ELEVENLABS_KEY_ACCOUNT_7,
      account_8: process.env.ELEVENLABS_KEY_ACCOUNT_8,
      account_9: process.env.ELEVENLABS_KEY_ACCOUNT_9,
      account_10: process.env.ELEVENLABS_KEY_ACCOUNT_10,
      account_11: process.env.ELEVENLABS_KEY_ACCOUNT_11,
      account_12: process.env.ELEVENLABS_KEY_ACCOUNT_12,
      account_13: process.env.ELEVENLABS_KEY_ACCOUNT_13,
      account_14: process.env.ELEVENLABS_KEY_ACCOUNT_14,
      account_15: process.env.ELEVENLABS_KEY_ACCOUNT_15,
      account_16: process.env.ELEVENLABS_KEY_ACCOUNT_16,
      account_17: process.env.ELEVENLABS_KEY_ACCOUNT_17,
    };

    let totalVoiceGenerated = 0;
    let totalGeneratedToday = 0;
    const today = new Date().toDateString();

    // Fetch history from each account
    for (const [profileKey, apiKey] of Object.entries(API_KEY_MAP)) {
      if (!apiKey) continue;

      try {
        const response = await fetch('https://api.elevenlabs.io/v1/history?page_size=100', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'xi-api-key': apiKey
          }
        });

        if (response.ok) {
          const data = await response.json();
          const historyItems = data.history || [];
          
          totalVoiceGenerated += historyItems.length;
          
          // Count today's generations
          const todayCount = historyItems.filter((item: any) => {
            const itemDate = new Date(item.date_unix * 1000).toDateString();
            return itemDate === today;
          }).length;
          
          totalGeneratedToday += todayCount;
        }
      } catch (error) {
        console.error(`Error fetching history from ${profileKey}:`, error);
      }
    }

    return NextResponse.json({
      totalVoiceGenerated,
      newVoicesToday: totalGeneratedToday
    });

  } catch (error: any) {
    console.error("Error fetching total voice history:", error);
    return NextResponse.json(
      { error: "Failed to fetch voice history stats" },
      { status: 500 }
    );
  }
}
