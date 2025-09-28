import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

const API_KEY = process.env.ONBOARD_API_KEY

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const headerKey = request.headers.get('x-api-key')
    const url = new URL(request.url)
    const queryKey = url.searchParams.get('key') || url.searchParams.get('api_key')
    let sessionUserId: string | null = null

    // Accept key via query param or header (fallback to session auth)
    if ((headerKey && headerKey === API_KEY) || (queryKey && queryKey === API_KEY)) {
      // authorized via key
    } else {
      const session = await auth()
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      sessionUserId = session.user.id
    }

    const {
      clientModelDetailsId,
      onboardingListId,
      completed = true,
      notes,
      createTask = false,
      taskTeamId,
      taskTitle,
      taskDescription,
      createdById
    } = body

    if (!clientModelDetailsId || !onboardingListId) {
      return NextResponse.json({ error: 'Missing ids' }, { status: 400 })
    }

    const now = new Date()

    const upsert = await (prisma as any).onboardingProgress.upsert({
      where: { onboardingListId_clientModelDetailsId: { onboardingListId, clientModelDetailsId } },
      update: { completed, completedAt: completed ? now : null, notes },
      create: { onboardingListId, clientModelDetailsId, completed, completedAt: completed ? now : null, notes }
    })

    const requiredSteps: any[] = await (prisma as any).onboardingList.findMany({ where: { required: true }, select: { id: true } })
    const requiredIds = requiredSteps.map((s: any) => s.id)
    const completedCount = await (prisma as any).onboardingProgress.count({ where: { clientModelDetailsId, onboardingListId: { in: requiredIds }, completed: true } })
    const allDone = completedCount >= requiredIds.length

    await (prisma as any).clientModelDetails.update({ where: { id: clientModelDetailsId }, data: { onboardingCompleted: allDone } })

    let task: any = null
    if (createTask && taskTeamId && (createdById || sessionUserId)) {
      const creatorId = createdById || sessionUserId!
      const title = taskTitle || `Onboarding step: ${onboardingListId}`
      const description = taskDescription || `Automatic task for onboarding step ${onboardingListId}`

      task = await (prisma as any).task.create({
        data: {
          title,
          description,
          status: 'NOT_STARTED',
          priority: 'MEDIUM',
          podTeamId: taskTeamId,
          assignedTo: null,
          createdById: creatorId,
          attachments: null
        }
      } as any)

      await (prisma as any).taskActivityHistory.create({
        data: {
          taskId: task.id,
          userId: creatorId,
          actionType: 'CREATED',
          description: `Task automatically created from onboarding webhook for client ${clientModelDetailsId}`
        }
      })
    }

    return NextResponse.json({ success: true, upsert, onboardingCompleted: allDone, task })
  } catch (error) {
    console.error('Onboarding webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
