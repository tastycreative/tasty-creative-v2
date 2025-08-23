// app/api/voice-profiles/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAllApiKeyProfiles } from '@/app/services/elevenlabs-implementation';

// GET - Fetch all API key profiles
export async function GET() {
  try {
    // Check authentication using NextAuth v5
    const session = await auth();
    
    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'MODERATOR')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const profiles = await getAllApiKeyProfiles();
    
    return NextResponse.json({ 
      success: true,
      profiles 
    });
  } catch (error: any) {
    console.error('Error fetching voice profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice profiles' },
      { status: 500 }
    );
  }
}
