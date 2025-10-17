import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getApiKey } from '@/app/services/elevenlabs-implementation';

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { apiKeyProfileKey, voiceId, text, modelId, settings } = requestData;
    
    // Use the new dynamic API key function
    const apiKey = await getApiKey(apiKeyProfileKey);
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Invalid API key profile or no API key found' },
        { status: 400 }
      );
    }
    
    const elevenlabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: modelId,
          voice_settings: {
            stability: settings.stability,
            similarity_boost: settings.clarity,
            style: settings.styleExaggeration,
            speaker_boost: settings.speakerBoost || true,
            speed: settings.speed,
          },
        }),
      }
    );

    if (!elevenlabsResponse.ok) {
      const errorData = await elevenlabsResponse.json();
      console.error('ElevenLabs API error:', errorData);
      const errorMessage = errorData.detail?.message || errorData.detail || errorData.error || 'Failed to generate voice';
      throw new Error(errorMessage);
    }

    // Get the history_item_id from response headers
    const historyItemId = elevenlabsResponse.headers.get('history-item-id');
    console.log('ElevenLabs history_item_id:', historyItemId);

    // Get binary audio data
    const audioArrayBuffer = await elevenlabsResponse.arrayBuffer();
    
    // Return the audio with the history_item_id in headers
    return new NextResponse(audioArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'X-History-Item-Id': historyItemId || '',
      },
    });
  } catch (error: any) {
    console.error('Error generating voice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate voice' },
      { status: 500 }
    );
  }
}