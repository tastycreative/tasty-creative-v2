import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    let clientModelDetailsId = url.searchParams.get('clientModelDetailsId')
    const clientModelId = url.searchParams.get('clientModelId')

    // If clientModelDetailsId not provided, but a clientModelId is, try to map via clientName
    if (!clientModelDetailsId && clientModelId) {
      const cm: any = await (prisma as any).clientModel.findUnique({ where: { id: clientModelId }, select: { clientName: true } })
      if (cm && cm.clientName) {
        const cmdRec: any = await (prisma as any).clientModelDetails.findFirst({ where: { client_name: cm.clientName } })
        if (cmdRec) {
          clientModelDetailsId = cmdRec.id
        }
      }
    }

    if (!clientModelDetailsId) {
      return NextResponse.json({ error: 'Missing clientModelDetailsId (or clientModelId that maps to details)' }, { status: 400 })
    }

    // Defensive: ensure Prisma client has our models (Prisma client may need regenerating after schema changes)
    if (!((prisma as any).onboardingProgress && typeof (prisma as any).onboardingProgress.findMany === 'function')) {
      console.error('Prisma client missing onboardingProgress model. prisma keys:', Object.keys(prisma as any))
      return NextResponse.json({ error: 'Prisma client missing onboardingProgress model; please run `npx prisma generate` and redeploy' }, { status: 500 })
    }

    // Return the full onboarding master list and merge in this client's progress (default completed=false)
    const steps: any[] = await (prisma as any).onboardingList.findMany({ orderBy: { stepNumber: 'asc' } })
    const progress: any[] = await (prisma as any).onboardingProgress.findMany({ where: { clientModelDetailsId } })
    const cmd = await (prisma as any).clientModelDetails.findUnique({ where: { id: clientModelDetailsId } })

    const progressMap = new Map(progress.map(p => [p.onboardingListId, p]))
    const merged = steps.map(s => {
      const p = progressMap.get(s.id)
      return { onboardingList: s, progress: p ?? { onboardingListId: s.id, clientModelDetailsId, completed: false, completedAt: null, notes: null } }
    })

    return NextResponse.json({ steps: merged, clientModelDetails: cmd })
  } catch (err) {
    console.error('test-onboarding status error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
