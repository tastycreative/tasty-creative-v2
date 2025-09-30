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
    // robust createTask parsing: accept boolean, numeric, and common truthy strings
    const rawCreateTask = typeof body.createTask !== 'undefined' ? body.createTask : urlParams.get('createTask')
    function parseCreateTask(v: any) {
      if (v === true || v === 1) return true
      if (v === false || v === 0) return false
      if (typeof v === 'string') {
        const s = v.trim().toLowerCase()
        return ['1', 'true', 'yes', 'y', 'on'].includes(s)
      }
      return Boolean(v)
    }
    const createTask = parseCreateTask(rawCreateTask)
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

    // Prefer a specific system user id when available, otherwise fall back to system@app.com.
    // Use the provided id so tasks are consistently created by the same system account.
    const SYSTEM_USER_ID = 'cmg4sw3ai0000l204y0ltt8lx'
    let creator: any = await prisma.user.findUnique({ where: { id: SYSTEM_USER_ID } })
    if (!creator) {
      creator = await prisma.user.findUnique({ where: { email: 'system@app.com' } })
    }
    if (!creator) {
      // Create a minimal system user record with the provided id if missing.
      // Note: explicitly setting the id relies on Prisma allowing client-specified ids (cuid strings are allowed).
      creator = await prisma.user.create({
        data: {
          id: SYSTEM_USER_ID,
          email: 'system@app.com',
          name: 'System',
          role: 'GUEST'
        }
      })
    }

  const baseName = clientDetails?.full_name || clientDetails?.client_name || clientModelDetailsId
  const modelName = (clientDetails as any)?.model_name
  // Default title: full_name + ( model_name if existing) - ONBOARDING - clientModelDetailsId
  const title = taskTitle || `${baseName}${modelName ? ` (${modelName})` : ''} - ONBOARDING - ${clientModelDetailsId}`
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
  // No attachments for onboarding tasks
      } as any
    })

    await createTaskActivity({ taskId: task.id, userId: creator.id, actionType: 'CREATED', description: `Automatic onboarding task created for clientModelDetailsId=${clientModelDetailsId}` })

    return NextResponse.json({ success: true, task: { id: task.id, title: task.title, taskNumber: task.taskNumber } })
  } catch (err) {
    console.error('Onboarding webhook error', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
