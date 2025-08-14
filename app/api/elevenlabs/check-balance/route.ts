import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  let apiKeyProfileKey: string | undefined;
  
  try {
    const requestBody = await request.json();
    apiKeyProfileKey = requestBody.apiKeyProfileKey;
    
    // Validate that apiKeyProfileKey is provided
    if (!apiKeyProfileKey) {
      return NextResponse.json(
        { 
          error: 'API key profile key is required',
          errorType: 'missing_profile_key',
          character: { limit: 0, remaining: 0, used: 0 },
          status: 'error'
        },
        { status: 400 }
      );
    }
    
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
      account_18: process.env.ELEVENLABS_KEY_ACCOUNT_18,
      account_19: process.env.ELEVENLABS_KEY_ACCOUNT_19,
      account_20: process.env.ELEVENLABS_KEY_ACCOUNT_20,
      account_21: process.env.ELEVENLABS_KEY_ACCOUNT_21,
      account_22: process.env.ELEVENLABS_KEY_ACCOUNT_22,
      account_23: process.env.ELEVENLABS_KEY_ACCOUNT_23,
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
    
    // ENHANCED DEBUGGING: Log the complete raw response to debug field mapping issues
    console.log(`=== RAW ELEVENLABS RESPONSE FOR ${apiKeyProfileKey} ===`);
    console.log(JSON.stringify(data, null, 2));
    console.log(`=== END RAW RESPONSE ===`);
    
    // ENHANCED DEBUGGING: Log all available fields
    console.log(`Available fields in response:`, Object.keys(data));
    
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
    
    // ENHANCED BILLING DATA MAPPING with more comprehensive field checking
    
    // Check for tier/plan with more options
    const tier = data.tier || 
                data.plan || 
                data.subscription_tier || 
                data.subscription_plan || 
                data.plan_name ||
                data.subscription?.tier ||
                data.subscription?.plan ||
                'unknown';
    
    // Check for status with more options  
    const status = data.status || 
                  data.subscription_status || 
                  data.state || 
                  data.subscription?.status ||
                  data.subscription?.state ||
                  'unknown';
    
    // Check for currency
    const currency = data.currency || 
                    data.invoice_currency || 
                    data.subscription?.currency ||
                    'USD';
    
    // Check for billing period - ElevenLabs returns "monthly_period"
    const billing_period = data.billing_period || 
                          data.period || 
                          data.interval || 
                          data.subscription?.billing_period ||
                          data.subscription?.period ||
                          'monthly';
    
    // Normalize billing period (ElevenLabs uses "monthly_period", we want "monthly")
    const normalizedBillingPeriod = billing_period.replace('_period', '');
    
    // ENHANCED: Check for next billing time - ElevenLabs returns it in next_invoice.next_payment_attempt_unix
    const next_invoice_time_unix = 
      // ElevenLabs API returns next billing in next_invoice.next_payment_attempt_unix
      data.next_invoice?.next_payment_attempt_unix || 
      // Fallback options for other possible field locations
      data.next_invoice_time_unix || 
      data.next_billing_time || 
      data.next_payment_time ||
      data.renewal_time ||
      data.next_invoice_at ||
      data.next_billing_at ||
      data.subscription?.next_invoice_time_unix ||
      data.subscription?.next_billing_time ||
      data.subscription?.renewal_time ||
      // Sometimes it's a string date that needs conversion
      (data.next_invoice_date ? new Date(data.next_invoice_date).getTime() / 1000 : null) ||
      (data.next_billing_date ? new Date(data.next_billing_date).getTime() / 1000 : null) ||
      // Also check for character count reset as potential billing cycle indicator
      data.next_character_count_reset_unix ||
      null;
    
    // ENHANCED: Check for monthly price - ElevenLabs returns it in next_invoice.amount_due_cents
    let monthly_price = 0;
    
    // ElevenLabs API returns billing amount in next_invoice.amount_due_cents (in cents)
    if (data.next_invoice?.amount_due_cents !== undefined && data.next_invoice?.amount_due_cents !== null) {
      monthly_price = data.next_invoice.amount_due_cents / 100; // Convert from cents to dollars
    }
    // Fallback options for other possible field locations
    else if (data.monthly_price !== undefined && data.monthly_price !== null) {
      monthly_price = data.monthly_price;
    } else if (data.price_monthly !== undefined && data.price_monthly !== null) {
      monthly_price = data.price_monthly;
    } else if (data.subscription?.monthly_price !== undefined && data.subscription?.monthly_price !== null) {
      monthly_price = data.subscription.monthly_price;
    } else if (data.invoice_amount_cents !== undefined && data.invoice_amount_cents !== null) {
      monthly_price = data.invoice_amount_cents / 100;
    }
    
    // ENHANCED: Log what we found for debugging
    console.log(`=== MAPPED BILLING DATA FOR ${apiKeyProfileKey} ===`);
    console.log(`Tier: ${tier}`);
    console.log(`Status: ${status}`);
    console.log(`Monthly Price: ${monthly_price} (from next_invoice.amount_due_cents: ${data.next_invoice?.amount_due_cents})`);
    console.log(`Next Invoice Time Unix: ${next_invoice_time_unix} (from next_invoice.next_payment_attempt_unix: ${data.next_invoice?.next_payment_attempt_unix})`);
    console.log(`Billing Period: ${normalizedBillingPeriod} (raw: ${billing_period})`);
    console.log(`Currency: ${currency}`);
    console.log(`Character Limit: ${characterLimit}, Used: ${charactersUsed}, Remaining: ${charactersRemaining}`);
    console.log(`=== END MAPPED DATA ===`);
    
    // Map subscription fields from ElevenLabs API response to our expected format
    const mappedSubscription = {
      tier,
      status,
      currency,
      billing_period: normalizedBillingPeriod,
      next_invoice_time_unix,
      monthly_price,
      
      // Map annual price if available
      annual_price:
        data.annual_price ||
        data.price_annual ||
        data.yearly_price ||
        data.subscription?.annual_price ||
        (data.price && normalizedBillingPeriod === 'annual' ? data.price : null) ||
        0,
      
      // Map invoice amount (in cents) - ElevenLabs returns this in next_invoice.amount_due_cents
      invoice_amount_cents:
        data.next_invoice?.amount_due_cents ||
        data.invoice_amount_cents ||
        data.next_invoice_amount ||
        data.amount_due ||
        data.subscription?.invoice_amount_cents ||
        (monthly_price ? monthly_price * 100 : 0),
      
      // Include raw data for debugging
      _raw: data
    };
    
    console.log(`Processed subscription data for ${apiKeyProfileKey}:`, {
      character: {
        limit: characterLimit,
        remaining: charactersRemaining,
        used: charactersUsed
      },
      subscription: mappedSubscription
    });

    // Return the data in the expected format
    return NextResponse.json({
      character: {
        limit: characterLimit,
        remaining: charactersRemaining,
        used: charactersUsed
      },
      status: 'success',
      subscription: mappedSubscription,
      debug: {
        rawResponse: data,
        processedFields: {
          limit: characterLimit,
          remaining: charactersRemaining,
          used: charactersUsed,
          monthly_price,
          next_invoice_time_unix,
          tier,
          status
        },
        fieldMapping: {
          monthly_price_source: 'next_invoice.amount_due_cents',
          monthly_price_raw: data.next_invoice?.amount_due_cents,
          next_billing_source: 'next_invoice.next_payment_attempt_unix',
          next_billing_raw: data.next_invoice?.next_payment_attempt_unix,
          billing_period_source: 'billing_period',
          billing_period_raw: billing_period,
          billing_period_normalized: normalizedBillingPeriod
        }
      }
    });

  } catch (error: any) {
    const profileKey = apiKeyProfileKey || 'unknown';
    console.error(`Unexpected error checking balance for ${profileKey}:`, error);
    
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