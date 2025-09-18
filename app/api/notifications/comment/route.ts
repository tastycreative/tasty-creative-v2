import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createInAppNotification } from '@/lib/notifications';
import { publishNotification } from '@/lib/upstash';
import { prisma } from '@/lib/prisma';
import { generateTaskUrl } from '@/lib/taskUtils';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, commentId, action = 'ADDED' } = await req.json();

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Get task details
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        podTeam: {
          select: {
            id: true,
            name: true,
            projectPrefix: true,
            members: {
              include: { user: true }
            }
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Generate proper task URL using prefix-taskNumber format
    const taskUrl = await generateTaskUrl(taskId, task.podTeamId || undefined);

    const notificationType = 'TASK_COMMENT_ADDED';
    const actionText = action.toLowerCase();

    // Create notifications for all team members except the commenter
    const teamMembers = task.podTeam?.members || [];
    const notifications = [];

    for (const member of teamMembers) {
      if (member.userId === session.user.id) continue; // Skip the person who made the comment

      try {
        // Create in-app notification for persistence
        const notification = await createInAppNotification({
          userId: member.userId,
          type: notificationType,
          title: `Comment ${actionText} on task`,
          message: `${session.user.name || session.user.email} ${actionText} a comment on "${task.title}"`,
          data: {
            taskId: task.id,
            taskTitle: task.title,
            taskUrl: taskUrl,
            commentId,
            commenterName: session.user.name || session.user.email,
            commenterUser: {
              id: session.user.id,
              name: session.user.name,
              email: session.user.email,
              image: session.user.image
            },
            teamId: task.podTeamId
          },
          taskId: task.id,
          podTeamId: task.podTeamId || undefined,
        });

        notifications.push(notification);

        // Send real-time notification via Redis
        const realtimeNotification = {
          id: `comment_${task.id}_${member.userId}_${Date.now()}`,
          type: 'TASK_COMMENT_ADDED',
          title: `Comment ${actionText} on task`,
          message: `${session.user.name || session.user.email} ${actionText} a comment on "${task.title}"`,
          data: {
            taskId: task.id,
            taskTitle: task.title,
            taskUrl: taskUrl,
            commentId,
            commenterName: session.user.name || session.user.email,
            commenterUser: {
              id: session.user.id,
              name: session.user.name,
              email: session.user.email,
              image: session.user.image
            },
            teamId: task.podTeamId,
            notificationType: notificationType,
            action: actionText,
            priority: 'normal'
          },
          userId: member.userId,
          teamId: task.podTeamId || undefined,
          timestamp: Date.now()
        };

        await publishNotification(realtimeNotification);
        console.log('✅ Published comment notification to Redis stream for user:', member.userId);

      } catch (error) {
        console.error(`❌ Failed to create comment notification for user ${member.userId}:`, error);
      }
    }

    console.log(`💬 COMMENT NOTIFICATIONS (${action}):`);
    console.log(`   └─ Task: "${task.title}" (ID: ${taskId})`);
    console.log(`   └─ Comment by: ${session.user.name || session.user.email}`);
    console.log(`   └─ Commenter user data:`, {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image
    });
    console.log(`   └─ Team members notified: ${notifications.length}`);

    return NextResponse.json({
      success: true,
      message: `Comment ${actionText} notifications sent`,
      notificationCount: notifications.length,
      taskId,
      taskTitle: task.title
    });

  } catch (error) {
    console.error('❌ Error processing comment notifications:', error);
    return NextResponse.json(
      { error: 'Failed to process comment notifications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
