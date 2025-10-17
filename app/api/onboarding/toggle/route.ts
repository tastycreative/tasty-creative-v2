import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    const params = url.searchParams
    const clientModelDetailsId = body.clientModelDetailsId || params.get('clientModelDetailsId')
    const onboardingListId = body.onboardingListId || params.get('onboardingListId')
    const completed = typeof body.completed !== 'undefined' ? !!body.completed : (params.get('completed') === 'true')

    if (!clientModelDetailsId || !onboardingListId) {
      return NextResponse.json({ error: 'Missing clientModelDetailsId or onboardingListId' }, { status: 400 })
    }

    const now = new Date()
    const upsert = await (prisma as any).onboardingProgress.upsert({
      where: { onboardingListId_clientModelDetailsId: { onboardingListId, clientModelDetailsId } },
      update: { completed, completedAt: completed ? now : null },
      create: { onboardingListId, clientModelDetailsId, completed, completedAt: completed ? now : null }
    })

    // recompute overall completion
    const requiredSteps: any[] = await (prisma as any).onboardingList.findMany({ where: { required: true }, select: { id: true } })
    const requiredIds = requiredSteps.map((s: any) => s.id)
    let completedCount = 0
    if (requiredIds.length > 0) {
      completedCount = await (prisma as any).onboardingProgress.count({ where: { clientModelDetailsId, onboardingListId: { in: requiredIds }, completed: true } })
    }
    const allDone = requiredIds.length > 0 ? completedCount >= requiredIds.length : false

    await (prisma as any).clientModelDetails.update({ where: { id: clientModelDetailsId }, data: { onboardingCompleted: allDone } })

    return NextResponse.json({ success: true, upsert, onboardingCompleted: allDone })
  } catch (err) {
    console.error('onboarding toggle error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
