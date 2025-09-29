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
  let onboardingListId = body.onboardingListId || urlParams.get('onboardingListId') || urlParams.get('step_id') || urlParams.get('onboardingListId')
  // Default to false when caller omits `completed` to avoid accidental auto-completion
  const completed = typeof body.completed !== 'undefined' ? body.completed : (urlParams.get('completed') ? urlParams.get('completed') === 'true' : false)
    const notes = body.notes || urlParams.get('notes') || null
    const createTask = typeof body.createTask !== 'undefined' ? body.createTask : (urlParams.get('createTask') === 'true')
    const taskTeamId = body.taskTeamId || urlParams.get('taskTeamId') || urlParams.get('teamId') || null
    const taskTitle = body.taskTitle || urlParams.get('taskTitle') || null
    const taskDescription = body.taskDescription || urlParams.get('taskDescription') || null
    const createdById = body.createdById || urlParams.get('createdById') || null

    if (!clientModelDetailsId) {
      return NextResponse.json({ error: 'Missing clientModelDetailsId (body or query)' }, { status: 400 })
    }

    // If onboardingListId is not provided, pick the next required step for this client
    let onboardingStep: any = null
    if (!onboardingListId) {
      const requiredSteps: any[] = await (prisma as any).onboardingList.findMany({ where: { required: true }, orderBy: { stepNumber: 'asc' } })
      if (!requiredSteps || requiredSteps.length === 0) {
        // No onboarding steps defined; mark onboardingCompleted = false and return
        await (prisma as any).clientModelDetails.update({ where: { id: clientModelDetailsId }, data: { onboardingCompleted: false } })
        return NextResponse.json({ error: 'No onboarding steps defined' }, { status: 400 })
      }

      // find completed progress for this client
      const progressForClient: any[] = await (prisma as any).onboardingProgress.findMany({ where: { clientModelDetailsId }, select: { onboardingListId: true, completed: true } })
      const completedSet = new Set(progressForClient.filter(p => p.completed).map(p => p.onboardingListId))

      const nextStep = requiredSteps.find(s => !completedSet.has(s.id))
      if (!nextStep) {
        // all required steps already completed
        await (prisma as any).clientModelDetails.update({ where: { id: clientModelDetailsId }, data: { onboardingCompleted: true } })
        return NextResponse.json({ success: true, message: 'Onboarding already completed' })
      }

      onboardingStep = nextStep
      onboardingListId = onboardingStep.id
    } else {
      onboardingStep = await (prisma as any).onboardingList.findUnique({ where: { id: onboardingListId } })
    }

    // Note: webhook no longer creates or updates OnboardingProgress rows.
    // It will only compute the next required step and current completion status.
    const requiredSteps: any[] = await (prisma as any).onboardingList.findMany({ where: { required: true }, select: { id: true } })
    const requiredIds = requiredSteps.map((s: any) => s.id)
    let completedCount = 0
    if (requiredIds.length > 0) {
      completedCount = await (prisma as any).onboardingProgress.count({ where: { clientModelDetailsId, onboardingListId: { in: requiredIds }, completed: true } })
    }
    const allDone = requiredIds.length > 0 ? completedCount >= requiredIds.length : false

    // update client flag based on existing progress rows
    await (prisma as any).clientModelDetails.update({ where: { id: clientModelDetailsId }, data: { onboardingCompleted: allDone } })

    return NextResponse.json({ success: true, onboardingStep, onboardingCompleted: allDone })
  } catch (error) {
    console.error('Onboarding webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
