import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendMentionNotificationEmail } from '@/lib/email';
import { generateTaskUrl } from '@/lib/taskUtils';
import { createInAppNotification } from '@/lib/notifications';
import { upstashPublish } from '@/lib/upstash';

// Force SSE for App Router (Socket.IO not properly supported)
const isProduction = true; // Always use SSE

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
        // Note: Removed activity log creation for comments per user request
        // Comments should not create activity history entries

        notifications.push({
          activityId: 'no-activity', // No activity log created
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
              taskUrl: await generateTaskUrl(taskId, teamId),
            });

            emailResults.push({
              userId: user.id,
              email: user.email,
              status: 'sent',
              message: 'Mention notification sent successfully',
            });

            // mention email sent
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
          // Get the user who made the mention for profile data
          const mentionerUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, name: true, email: true, image: true }
          });

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
              mentionerUser: mentionerUser ? {
                id: mentionerUser.id,
                name: mentionerUser.name,
                email: mentionerUser.email,
                image: mentionerUser.image
              } : null,
              // Also add commenterUser for consistency with comment notifications
              commenterUser: mentionerUser ? {
                id: mentionerUser.id,
                name: mentionerUser.name,
                email: mentionerUser.email,
                image: mentionerUser.image
              } : null,
              teamName: team?.name,
              taskUrl: await generateTaskUrl(taskId, teamId),
            },
            taskId,
            podTeamId: teamId,
          });



          // in-app mention notification created

          // Publish to Upstash channels: user and optional team
          try {
            const payload = {
              type: 'TASK_COMMENT_ADDED',
              title: 'You were mentioned in a comment',
              message: `${session.user.name || session.user.email || 'Someone'} mentioned you in "${task.title}"`,
              data: {
                taskId,
                taskTitle: task.title,
                commentContent: cleanMentionsForEmail(commentContent),
                mentionerName: session.user.name || session.user.email || 'Someone',
                mentionerUser: mentionerUser ? {
                  id: mentionerUser.id,
                  name: mentionerUser.name,
                  email: mentionerUser.email,
                  image: mentionerUser.image
                } : null,
                // Also add commenterUser for consistency
                commenterUser: mentionerUser ? {
                  id: mentionerUser.id,
                  name: mentionerUser.name,
                  email: mentionerUser.email,
                  image: mentionerUser.image
                } : null,
                teamId,
                taskUrl: await generateTaskUrl(taskId, teamId),
                notificationId: inAppNotification?.id || null,
              },
              createdAt: new Date().toISOString(),
            };

            const userChannel = `user:${user.id}`;
            await upstashPublish(userChannel, payload);

            if (teamId) {
              const teamChannel = `team:${teamId}`;
              await upstashPublish(teamChannel, payload);
            }
          } catch (pubErr) {
            console.error('❌ Upstash publish failed for mention:', pubErr);
          }
        } catch (inAppError) {
          console.error(`❌ Failed to create in-app mention notification for ${user.email}:`, inAppError);
        }
      } catch (error) {
        console.error(`❌ Failed to create mention notification for user ${user.id}:`, error);
      }
    }

    // Enhanced logging
  // mention notifications processed

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
