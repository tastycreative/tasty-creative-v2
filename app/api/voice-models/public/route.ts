// app/api/voice-models/public/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAllVoiceModels } from '@/app/services/elevenlabs-implementation';

// GET - Fetch voice models for public use (authenticated users only, no admin requirement)
export async function GET() {
  try {
    // Check authentication - any authenticated user can access
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const models = await getAllVoiceModels();
    
    // Return only public-safe data - no API keys, no sensitive info
    const publicModels = models.map((model: any) => ({
      id: model.id,
      accountKey: model.accountKey,
      accountName: model.accountName,
      voiceName: model.voiceName,
      voiceId: model.voiceId,
      category: model.category,
      description: model.description,
      // Don't include apiKey, createdAt, updatedAt, or other sensitive fields
    }));

    return NextResponse.json({ 
      success: true,
      models: publicModels 
    });
  } catch (error: any) {
    console.error('Error fetching public voice models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice models' },
      { status: 500 }
    );
  }
}
