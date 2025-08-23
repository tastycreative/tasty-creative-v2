import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getApiKey } from '@/app/services/elevenlabs-implementation';

export async function POST(request: NextRequest) {
  try {
    const { apiKeyProfileKey, historyItemId } = await request.json();
    
    // Use the new dynamic API key function
    const apiKey = await getApiKey(apiKeyProfileKey);
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Invalid API key profile or no API key found' },
        { status: 400 }
      );
    }
    
    const url = `https://api.elevenlabs.io/v1/history/${historyItemId}/audio`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch history audio: ${response.status}`);
    }

    // Get binary audio data
    const audioArrayBuffer = await response.arrayBuffer();
    
    // Return the audio directly
    return new NextResponse(audioArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error: any) {
    console.error('Error fetching history audio from ElevenLabs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch history audio' },
      { status: 500 }
    );
  }
}