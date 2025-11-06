import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createInAppNotification } from '@/lib/notifications';
import { publishNotification } from '@/lib/ably';
import { generateTaskUrl } from '@/lib/taskUtils';

// Notify the task creator when an OFTV editor status changes
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      taskId,
      teamId,
      teamName,
      editorType, // 'video' | 'thumbnail'
      newStatus,
    } = await req.json();

    if (!taskId || !editorType || !newStatus) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Load task with creator and OFTV details
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        title: true,
        description: true,
        createdById: true,
        podTeamId: true,
        podTeam: { select: { id: true, name: true } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Get creator user and ensure exists
    const creator = await prisma.user.findUnique({
      where: { id: task.createdById },
      select: { id: true, name: true, email: true, image: true },
    });

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const actorName = session.user.name || session.user.email || 'A teammate';
    const roleLabel = editorType === 'video' ? 'Video Editor' : 'Thumbnail Editor';
    const taskUrl = await generateTaskUrl(task.id, teamId || task.podTeamId || undefined);

    // Create activity history record for auditing
    const activity = await prisma.taskActivityHistory.create({
      data: {
        taskId: task.id,
        userId: session.user.id,
        actionType: 'STATUS_CHANGED',
        fieldName: `${editorType}EditorStatus`,
        oldValue: null, // not tracked here; this API is called only when changed
        newValue: newStatus,
        description: `${actorName} set ${roleLabel} status to ${newStatus}`,
      },
    });

    // Create in-app notification for the creator
    const inApp = await createInAppNotification({
      userId: creator.id,
      type: 'TASK_STATUS_CHANGED',
      title: `${roleLabel} status updated`,
      message: `${actorName} updated ${roleLabel} status to ${newStatus} for "${task.title}"`,
      data: {
        taskId: task.id,
        taskTitle: task.title,
        editorType,
        newStatus,
        teamName: teamName || task.podTeam?.name,
        taskUrl,
        activityId: activity.id,
      },
      taskId: task.id,
      podTeamId: teamId || task.podTeamId || undefined,
    });

    // Real-time notification
    await publishNotification({
      id: `oftv_status_${task.id}_${Date.now()}`,
      type: 'TASK_STATUS_CHANGED',
      title: `${roleLabel} status updated`,
      message: `${actorName} updated ${roleLabel} status to ${newStatus} for "${task.title}"`,
      data: {
        taskId: task.id,
        taskTitle: task.title,
        editorType,
        newStatus,
        teamId: teamId || task.podTeamId || undefined,
        teamName: teamName || task.podTeam?.name,
        taskUrl,
        notificationId: inApp?.id || null,
        activityId: activity.id,
      },
      userId: creator.id,
      teamId: teamId || task.podTeamId || undefined,
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ OFTV status notification error:', err);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
