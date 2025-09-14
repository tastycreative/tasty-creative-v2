import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendMentionNotificationEmail } from '@/lib/email';
import { createInAppNotification } from '@/lib/notifications';
import { broadcastToUser } from '../stream/route';
import { broadcastNotification } from '@/lib/socket';

// Detect if we're in production or development
const isProduction = typeof process !== 'undefined' && !(
  process.env.NODE_ENV === 'development'
);

interface EmailResult {
  userId: string;
  email: string;
  status: 'sent' | 'failed';
  message: string;
}

interface Notification {
  activityId: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  type: 'mention';
}

// Utility function to clean mentions for email display
function cleanMentionsForEmail(text: string): string {
  if (!text) return '';
  
  // Convert @[Name](id) to just Name
  const mentionRegex = /@\[([^\]]+)\]\([^)]+\)/g;
  return text.replace(mentionRegex, '$1');
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      mentionedUserIds,
      taskId,
      commentContent,
      taskTitle,
      teamId,
    } = await req.json();

    // Validate required fields
    if (!mentionedUserIds || !Array.isArray(mentionedUserIds) || !taskId || !commentContent) {
      return NextResponse.json({ 
        error: 'Missing required fields: mentionedUserIds, taskId, commentContent' 
      }, { status: 400 });
    }

    // Get task details
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        title: true,
        description: true,
        podTeamId: true,
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Get team details if teamId provided
    let team = null;
    if (teamId) {
      team = await prisma.podTeam.findUnique({
        where: { id: teamId },
        select: {
          id: true,
          name: true,
        },
      });
    }

    // Get mentioned users
    const mentionedUsers = await prisma.user.findMany({
      where: {
        id: {
          in: mentionedUserIds,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Create notifications and send emails
    const notifications: Notification[] = [];
    const emailResults: EmailResult[] = [];

    for (const user of mentionedUsers) {
      // Don't notify the person who made the comment
      if (user.id === session.user.id) {
        continue;
      }

      try {
        // Create activity log for notification record
        const activityLog = await prisma.taskActivityHistory.create({
          data: {
            taskId,
            userId: user.id,
            actionType: 'COMMENT_ADDED',
            fieldName: 'mention_notification',
            oldValue: null,
            newValue: 'mentioned',
            description: `User mentioned in comment: "${cleanMentionsForEmail(commentContent).substring(0, 100)}${cleanMentionsForEmail(commentContent).length > 100 ? '...' : ''}" by ${session.user.name || session.user.email}`,
          },
        });

        notifications.push({
          activityId: activityLog.id,
          userId: user.id,
          userEmail: user.email!,
          userName: user.name,
          type: 'mention',
        });

        // Send email notification if user has email
        if (user.email) {
          try {
            await sendMentionNotificationEmail({
              to: user.email,
              mentionedUserName: user.name || user.email.split('@')[0],
              mentionerName: session.user.name || session.user.email?.split('@')[0] || 'Someone',
              taskTitle: task.title,
              taskDescription: task.description,
              commentContent: cleanMentionsForEmail(commentContent),
              teamName: team?.name,
              taskUrl: `${process.env.NEXTAUTH_URL}/apps/pod/board?team=${teamId}&task=${taskId}`,
            });

            emailResults.push({
              userId: user.id,
              email: user.email,
              status: 'sent',
              message: 'Mention notification sent successfully',
            });

            console.log(`📧 Mention notification sent to ${user.name} (${user.email})`);
          } catch (emailError) {
            emailResults.push({
              userId: user.id,
              email: user.email,
              status: 'failed',
              message: emailError instanceof Error ? emailError.message : 'Unknown email error',
            });
            console.error(`❌ Failed to send mention email to ${user.email}:`, emailError);
          }
        }

        // Create in-app notification
        try {
          const inAppNotification = await createInAppNotification({
            userId: user.id,
            type: 'TASK_COMMENT_ADDED',
            title: 'You were mentioned in a comment',
            message: `${session.user.name || session.user.email || 'Someone'} mentioned you in "${task.title}"`,
            data: {
              taskId,
              taskTitle: task.title,
              commentContent: cleanMentionsForEmail(commentContent),
              mentionerName: session.user.name || session.user.email || 'Someone',
              teamName: team?.name,
              taskUrl: `${process.env.NEXTAUTH_URL}/apps/pod/board?team=${teamId}&task=${taskId}`,
            },
            taskId,
            podTeamId: teamId,
          });

          // Broadcast real-time notification based on environment
          try {
            if (isProduction) {
              // Production: Use SSE
              await broadcastToUser(user.id, inAppNotification);
            } else {
              // Development: Use Socket.IO
              await broadcastNotification(inAppNotification);
            }
          } catch (broadcastError) {
            console.error(`❌ Failed to broadcast mention notification:`, broadcastError);
          }

          console.log(`📱 In-app mention notification created for ${user.name} (${user.email})`);
        } catch (inAppError) {
          console.error(`❌ Failed to create in-app mention notification for ${user.email}:`, inAppError);
        }
      } catch (error) {
        console.error(`❌ Failed to create mention notification for user ${user.id}:`, error);
      }
    }

    // Enhanced logging
    console.log(`💬 MENTION NOTIFICATIONS:`);
    console.log(`   └─ Task: "${task.title}" (ID: ${taskId})`);
    console.log(`   └─ Comment by: ${session.user.name || session.user.email}`);
    console.log(`   └─ Mentioned users: ${mentionedUsers.length}`);
    console.log(`   └─ Notifications created: ${notifications.length}`);
    console.log(`   └─ Emails sent: ${emailResults.filter(r => r.status === 'sent').length}`);

    notifications.forEach((notif, index) => {
      const emailStatus = emailResults.find(e => e.userId === notif.userId);
      console.log(`   ${index + 1}. ${notif.userName} (${notif.userEmail}) - ${emailStatus?.status || 'no email'}`);
    });

    return NextResponse.json({
      success: true,
      message: `Mention notifications processed for ${notifications.length} users`,
      notifications,
      emailResults,
      summary: {
        taskId,
        taskTitle: task.title,
        mentionedCount: notifications.length,
        emailsSent: emailResults.filter(r => r.status === 'sent').length,
        emailsFailed: emailResults.filter(r => r.status === 'failed').length,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('❌ Error processing mention notifications:', error);
    return NextResponse.json(
      { error: 'Failed to process mention notifications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
