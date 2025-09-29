import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Test-only endpoint to: (a) optionally mark all onboarding steps required,
// (b) reset onboarding progress for a specific clientModelDetailsId (mark not completed),
// (c) set clientModelDetails.onboardingCompleted = false
export async function POST(request: NextRequest) {
  try {
    let body: any = {}
    try {
      const text = await request.text()
      body = text ? JSON.parse(text) : {}
    } catch (e) {
      body = {}
    }

    const url = new URL(request.url)
    const urlParams = url.searchParams
    const clientModelDetailsId = body.clientModelDetailsId || urlParams.get('clientModelDetailsId')
    const setRequired = typeof body.setRequired !== 'undefined' ? !!body.setRequired : urlParams.get('setRequired') === 'true'

    if (!clientModelDetailsId) {
      return NextResponse.json({ error: 'Missing clientModelDetailsId' }, { status: 400 })
    }

    const result: any = { updatedOnboardingList: 0, resetProgressCount: 0 }

    if (setRequired) {
      const r = await (prisma as any).onboardingList.updateMany({ data: { required: true } })
      result.updatedOnboardingList = r.count ?? 0
    }

    // Mark all existing progress rows for this client as not completed
    const reset = await (prisma as any).onboardingProgress.updateMany({ where: { clientModelDetailsId }, data: { completed: false, completedAt: null } })
    result.resetProgressCount = reset.count ?? 0

    // Ensure the clientModelDetails is marked not completed
    await (prisma as any).clientModelDetails.update({ where: { id: clientModelDetailsId }, data: { onboardingCompleted: false } })

    return NextResponse.json({ success: true, result })
  } catch (err) {
    console.error('test-onboarding reset error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
