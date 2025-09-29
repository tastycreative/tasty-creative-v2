import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createTaskActivity } from '@/lib/taskActivityHelper'

// Minimal onboarding webhook: only creates an automatic task assigned to the "Onboarding" team.
export async function POST(request: NextRequest) {
  try {
    let body: any = {}
    try {
      const raw = await request.text()
      body = raw && raw.trim().length > 0 ? JSON.parse(raw) : {}
    } catch (e) {
      body = {}
    }

    const urlParams = new URL(request.url).searchParams
    const clientModelDetailsId = body.clientModelDetailsId || urlParams.get('clientModelDetailsId') || urlParams.get('client_id')
    const createTask = typeof body.createTask !== 'undefined' ? body.createTask : (urlParams.get('createTask') === 'true')
    const taskTitle = body.taskTitle || urlParams.get('taskTitle') || null
    const taskDescription = body.taskDescription || urlParams.get('taskDescription') || null

    if (!clientModelDetailsId) {
      return NextResponse.json({ error: 'Missing clientModelDetailsId (body or query)' }, { status: 400 })
    }

    if (!createTask) {
      return NextResponse.json({ success: true, message: 'createTask not set; webhook is no-op' })
    }

    const onboardingTeam = await prisma.podTeam.findFirst({ where: { name: 'Onboarding' }, select: { id: true } })
    if (!onboardingTeam) {
      return NextResponse.json({ success: false, error: 'Onboarding team not found' }, { status: 500 })
    }

    const clientDetails: any = await prisma.clientModelDetails.findUnique({ where: { id: clientModelDetailsId } })

    // createdBy fallback: system@app.com -> ADMIN -> any user
    let creator: any = await prisma.user.findUnique({ where: { email: 'system@app.com' } })
    if (!creator) creator = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
    if (!creator) creator = await prisma.user.findFirst({})
    if (!creator || !creator.id) {
      return NextResponse.json({ success: false, error: 'No user available to create task' }, { status: 500 })
    }

    const title = taskTitle || `Onboarding task for ${clientDetails?.full_name || clientDetails?.client_name || clientModelDetailsId}`
    let description = taskDescription || `Automatic onboarding task created for clientModelDetailsId=${clientModelDetailsId}`
    if (!taskDescription && clientDetails) {
      description += `\n\nClient: ${clientDetails.full_name || clientDetails.client_name || ''}`
      if ((clientDetails as any).model_name) description += ` (${(clientDetails as any).model_name})`
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: 'NOT_STARTED',
        priority: 'MEDIUM',
        podTeamId: onboardingTeam.id,
        assignedTo: null,
        createdById: creator.id,
        attachments: [{ clientModelDetailsId }]
      } as any
    })

    await createTaskActivity({ taskId: task.id, userId: creator.id, actionType: 'CREATED', description: `Automatic onboarding task created for clientModelDetailsId=${clientModelDetailsId}` })

    return NextResponse.json({ success: true, task: { id: task.id, title: task.title } })
  } catch (err) {
    console.error('Onboarding webhook error', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
