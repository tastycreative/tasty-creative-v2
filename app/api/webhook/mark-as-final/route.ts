import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

// n8n webhook endpoint - production URL
const N8N_WEBHOOK_URL = process.env.N8N_MARK_FINAL_WEBHOOK_URL ||
  "https://n8n.tastycreative.xyz/webhook/gallery-data"

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get n8n payload from request
    const payload = await request.json()

    console.log('Sending to n8n webhook:', {
      url: N8N_WEBHOOK_URL,
      videoTitle: payload.videoTitle
    })

    // Send to n8n webhook
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TastyCreative-POD/1.0'
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`n8n webhook failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    console.log('n8n webhook success:', data)

    return NextResponse.json({
      success: true,
      message: 'Google Sheets sync triggered successfully',
      n8nResponse: data
    })

  } catch (error) {
    console.error('n8n webhook error:', error)

    // Return error but don't block the operation
    return NextResponse.json(
      {
        error: 'Webhook failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
