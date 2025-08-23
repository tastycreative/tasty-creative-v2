// app/api/voice-models/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { addVoiceModel, getAllVoiceModels, updateVoiceModel, deleteVoiceModel } from '@/app/services/elevenlabs-implementation';

// GET - Fetch all voice models
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

    const models = await getAllVoiceModels();
    
    // Don't send encrypted API keys to frontend
    const sanitizedModels = models.map((model: any) => ({
      ...model,
      apiKey: model.apiKey ? '***ENCRYPTED***' : null
    }));

    return NextResponse.json({ 
      success: true,
      models: sanitizedModels 
    });
  } catch (error: any) {
    console.error('Error fetching voice models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice models' },
      { status: 500 }
    );
  }
}

// POST - Add new voice model
export async function POST(request: Request) {
  try {
    // Check authentication using NextAuth v5
    const session = await auth();
    
    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'MODERATOR')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const modelData = await request.json();
    
    // Check if this is a migration request (has accountKey field)
    const isMigration = modelData.accountKey && modelData.accountKey.startsWith('account_');
    
    // Validate required fields
    const required = ['accountName', 'voiceName', 'voiceId', 'apiKey'];
    for (const field of required) {
      if (!modelData[field] || modelData[field].trim() === '') {
        return NextResponse.json(
          { error: `${field} is required and cannot be empty` },
          { status: 400 }
        );
      }
    }

    // Validate API key format (basic check)
    if (!modelData.apiKey.startsWith('sk_')) {
      return NextResponse.json(
        { error: 'Invalid API key format. ElevenLabs API keys should start with "sk_"' },
        { status: 400 }
      );
    }

    // Validate voice ID format (basic check)
    if (modelData.voiceId.length < 10) {
      return NextResponse.json(
        { error: 'Invalid voice ID format. Voice IDs should be longer than 10 characters' },
        { status: 400 }
      );
    }

    // Test API key by making a simple request to ElevenLabs
    try {
      const testResponse = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': modelData.apiKey,
        },
      });

      if (!testResponse.ok) {
        return NextResponse.json(
          { error: 'Invalid API key - unable to authenticate with ElevenLabs' },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Unable to validate API key - network error' },
        { status: 400 }
      );
    }

    // Use migration function if this is a legacy account migration
    let result;
    if (isMigration) {
      const { migrateLegacyAccount } = await import('@/app/services/elevenlabs-implementation');
      result = await migrateLegacyAccount(modelData.accountKey, modelData.apiKey);
    } else {
      const { addVoiceModel } = await import('@/app/services/elevenlabs-implementation');
      result = await addVoiceModel(modelData);
    }
    
    if (result.success) {
      // Don't send encrypted API key back
      const sanitizedModel = result.model ? {
        ...result.model,
        apiKey: '***ENCRYPTED***'
      } : null;

      return NextResponse.json({ 
        success: true, 
        model: sanitizedModel,
        message: isMigration 
          ? `Legacy account ${modelData.accountKey} migrated successfully`
          : 'Voice model added successfully'
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error adding voice model:', error);
    return NextResponse.json(
      { error: 'Failed to add voice model' },
      { status: 500 }
    );
  }
}

// PUT - Update existing voice model
export async function PUT(request: Request) {
  try {
    // Check authentication using NextAuth v5
    const session = await auth();
    
    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'MODERATOR')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id, ...updateData } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Model ID is required' },
        { status: 400 }
      );
    }

    // If updating API key, validate it
    if (updateData.apiKey && updateData.apiKey !== '***ENCRYPTED***') {
      if (!updateData.apiKey.startsWith('sk_')) {
        return NextResponse.json(
          { error: 'Invalid API key format. ElevenLabs API keys should start with "sk_"' },
          { status: 400 }
        );
      }

      // Test new API key
      try {
        const testResponse = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'xi-api-key': updateData.apiKey,
          },
        });

        if (!testResponse.ok) {
          return NextResponse.json(
            { error: 'Invalid API key - unable to authenticate with ElevenLabs' },
            { status: 400 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Unable to validate API key - network error' },
          { status: 400 }
        );
      }
    }

    // Remove apiKey from update if it's the placeholder
    if (updateData.apiKey === '***ENCRYPTED***') {
      delete updateData.apiKey;
    }

    const result = await updateVoiceModel(id, updateData);
    
    if (result.success) {
      // Don't send encrypted API key back
      const sanitizedModel = result.model
        ? {
            ...result.model,
            apiKey: result.model.apiKey ? '***ENCRYPTED***' : null
          }
        : null;

      return NextResponse.json({ 
        success: true, 
        model: sanitizedModel,
        message: 'Voice model updated successfully'
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error updating voice model:', error);
    return NextResponse.json(
      { error: 'Failed to update voice model' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete voice model
export async function DELETE(request: Request) {
  try {
    // Check authentication using NextAuth v5
    const session = await auth();
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Model ID is required' },
        { status: 400 }
      );
    }

    const result = await deleteVoiceModel(id);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true,
        message: 'Voice model deleted successfully'
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error deleting voice model:', error);
    return NextResponse.json(
      { error: 'Failed to delete voice model' },
      { status: 500 }
    );
  }
}