import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { apiKeyProfileKey } = await request.json();
    
    // Map profile keys to environment variables
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
    
    const apiKey = API_KEY_MAP[apiKeyProfileKey];
    
    // Log for debugging
    console.log(`Checking balance for ${apiKeyProfileKey}...`);
    
    if (!apiKey) {
      console.log(`No API key found for ${apiKeyProfileKey}`);
      return NextResponse.json(
        { 
          error: 'API key not configured for this profile',
          errorType: 'missing_key',
          character: { limit: 0, remaining: 0, used: 0 },
          status: 'error'
        },
        { status: 400 }
      );
    }

    // Check if API key is empty or placeholder
    if (apiKey.trim() === '' || apiKey === 'your_api_key_here') {
      console.log(`Empty or placeholder API key for ${apiKeyProfileKey}`);
      return NextResponse.json(
        { 
          error: 'API key is empty or not set',
          errorType: 'invalid_key',
          character: { limit: 0, remaining: 0, used: 0 },
          status: 'error'
        },
        { status: 400 }
      );
    }
    
    const url = 'https://api.elevenlabs.io/v1/user/subscription';
    
    console.log(`Making request to ElevenLabs for ${apiKeyProfileKey}...`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': apiKey,
      },
    });

    console.log(`ElevenLabs response status for ${apiKeyProfileKey}:`, response.status);

    if (!response.ok) {
      let errorMessage = 'Unknown error';
      let errorType = 'unknown';
      
      // Handle different status codes
      switch (response.status) {
        case 401:
          errorMessage = 'Invalid API key';
          errorType = 'invalid_key';
          break;
        case 403:
          errorMessage = 'Access forbidden - account may be suspended';
          errorType = 'suspended';
          break;
        case 429:
          errorMessage = 'Rate limit exceeded';
          errorType = 'rate_limit';
          break;
        case 500:
          errorMessage = 'ElevenLabs server error';
          errorType = 'server_error';
          break;
        default:
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          errorType = 'http_error';
      }

      // Try to get more details from the response body
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = `${errorMessage} - ${errorData.detail}`;
        }
        console.log(`Error details for ${apiKeyProfileKey}:`, errorData);
      } catch (e) {
        // If we can't parse the error response, that's okay
        console.log(`Could not parse error response for ${apiKeyProfileKey}`);
      }

      console.log(`API Error for ${apiKeyProfileKey}:`, errorMessage);

      return NextResponse.json({
        error: errorMessage,
        errorType: errorType,
        character: { limit: 0, remaining: 0, used: 0 },
        status: 'error'
      }, { status: response.status });
    }

    const data = await response.json();
    
    // Log the complete raw response to debug field mapping issues
    console.log(`Raw ElevenLabs response for ${apiKeyProfileKey}:`, JSON.stringify(data, null, 2));
    
    // ElevenLabs API returns different field structures, let's handle multiple possible formats
    let characterLimit = 0;
    let charactersRemaining = 0;
    let charactersUsed = 0;
    
    // Try different possible field names that ElevenLabs might use
    if (data.character_limit !== undefined) {
      characterLimit = data.character_limit;
    } else if (data.characterLimit !== undefined) {
      characterLimit = data.characterLimit;
    } else if (data.max_characters !== undefined) {
      characterLimit = data.max_characters;
    }
    
    // For remaining characters - this is the tricky one
    if (data.character_count !== undefined) {
      // character_count might be REMAINING or USED - we need to check
      if (data.characters_used !== undefined) {
        // If we have both character_count and characters_used, character_count is likely remaining
        charactersRemaining = data.character_count;
        charactersUsed = data.characters_used;
      } else {
        // If we only have character_count, it might be used characters
        // Let's calculate remaining as limit - character_count
        charactersUsed = data.character_count;
        charactersRemaining = characterLimit - charactersUsed;
      }
    } else if (data.remaining_characters !== undefined) {
      charactersRemaining = data.remaining_characters;
      charactersUsed = characterLimit - charactersRemaining;
    } else if (data.charactersRemaining !== undefined) {
      charactersRemaining = data.charactersRemaining;
      charactersUsed = characterLimit - charactersRemaining;
    }
    
    // Ensure we don't have negative values
    charactersRemaining = Math.max(0, charactersRemaining);
    charactersUsed = Math.max(0, charactersUsed);
    
    console.log(`Processed data for ${apiKeyProfileKey}:`, {
      limit: characterLimit,
      remaining: charactersRemaining,
      used: charactersUsed,
      rawFields: {
        character_limit: data.character_limit,
        character_count: data.character_count,
        characters_used: data.characters_used,
        remaining_characters: data.remaining_characters
      }
    });

    // Return the data in the expected format
    return NextResponse.json({
      character: {
        limit: characterLimit,
        remaining: charactersRemaining,
        used: charactersUsed
      },
      status: 'success',
      subscription: data,
      debug: {
        rawResponse: data,
        processedFields: {
          limit: characterLimit,
          remaining: charactersRemaining,
          used: charactersUsed
        }
      }
    });

  } catch (error: any) {
    console.error(`Unexpected error checking balance for ${apiKeyProfileKey}:`, error);
    
    // Determine error type from the error message
    let errorType = 'network_error';
    let errorMessage = error.message || 'Network or server error';
    
    if (error.message?.includes('fetch')) {
      errorType = 'network_error';
      errorMessage = 'Network connection failed';
    } else if (error.message?.includes('timeout')) {
      errorType = 'timeout';
      errorMessage = 'Request timed out';
    }
    
    // Return error details instead of generic mock data
    return NextResponse.json({
      error: errorMessage,
      errorType: errorType,
      character: { limit: 0, remaining: 0, used: 0 },
      status: 'error'
    }, { status: 500 });
  }
}