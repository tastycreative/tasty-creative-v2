import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

const API_KEY = process.env.ONBOARD_API_KEY

export async function POST(request: NextRequest) {
  try {
    let body: any = {}
    let rawBody = ''
    try {
      rawBody = await request.text()
      if (rawBody && rawBody.trim().length > 0) {
        try {
          body = JSON.parse(rawBody)
        } catch (e) {
          console.error('Failed to parse JSON body, rawBody:', rawBody)
          body = {}
        }
      } else {
        body = {}
      }
    } catch (e) {
      console.error('Error reading request body:', e)
      body = {}
    }
  // Authentication disabled for now (accept unauthenticated requests).
  // If you want API key or session auth, re-enable the checks here.
  const headerKey = request.headers.get('x-api-key')
  const url = new URL(request.url)
  const queryKey = url.searchParams.get('key') || url.searchParams.get('api_key')
  let sessionUserId: string | null = null

    // allow passing params either in JSON body or as query params
    const urlParams = new URL(request.url).searchParams
    const clientModelDetailsId = body.clientModelDetailsId || urlParams.get('clientModelDetailsId') || urlParams.get('client_id')
    const onboardingListId = body.onboardingListId || urlParams.get('onboardingListId') || urlParams.get('step_id') || urlParams.get('onboardingListId')
    const completed = typeof body.completed !== 'undefined' ? body.completed : (urlParams.get('completed') ? urlParams.get('completed') === 'true' : true)
    const notes = body.notes || urlParams.get('notes') || null
    const createTask = typeof body.createTask !== 'undefined' ? body.createTask : (urlParams.get('createTask') === 'true')
    const taskTeamId = body.taskTeamId || urlParams.get('taskTeamId') || urlParams.get('teamId') || null
    const taskTitle = body.taskTitle || urlParams.get('taskTitle') || null
    const taskDescription = body.taskDescription || urlParams.get('taskDescription') || null
    const createdById = body.createdById || urlParams.get('createdById') || null

    if (!clientModelDetailsId || !onboardingListId) {
      return NextResponse.json({ error: 'Missing clientModelDetailsId or onboardingListId (body or query)' }, { status: 400 })
    }

    const now = new Date()

    const upsert = await (prisma as any).onboardingProgress.upsert({
      where: { onboardingListId_clientModelDetailsId: { onboardingListId, clientModelDetailsId } },
      update: { completed, completedAt: completed ? now : null, notes },
      create: { onboardingListId, clientModelDetailsId, completed, completedAt: completed ? now : null, notes }
    })

    const requiredSteps: any[] = await (prisma as any).onboardingList.findMany({ where: { required: true }, select: { id: true } })
    const requiredIds = requiredSteps.map((s: any) => s.id)
    let completedCount = 0
    if (requiredIds.length > 0) {
      completedCount = await (prisma as any).onboardingProgress.count({ where: { clientModelDetailsId, onboardingListId: { in: requiredIds }, completed: true } })
    }
    const allDone = requiredIds.length > 0 ? completedCount >= requiredIds.length : false

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
