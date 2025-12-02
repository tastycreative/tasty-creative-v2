import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

const N8N_GALLERY_SHEET_WEBHOOK_URL = process.env.N8N_GALLERY_SHEET_WEBHOOK_URL || 'https://n8n.tastycreative.xyz/webhook-test/gallery-data-otm-otp-gen'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await request.json()

    console.log('Sending to gallery sheet n8n webhook:', {
      url: N8N_GALLERY_SHEET_WEBHOOK_URL,
      model: payload.model
    })

    const response = await fetch(N8N_GALLERY_SHEET_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TastyCreative-POD/1.0'
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gallery sheet webhook error:', errorText)
      return NextResponse.json({ error: 'Webhook failed', details: errorText }, { status: response.status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Gallery sheet webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
