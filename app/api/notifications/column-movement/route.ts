import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendColumnAssignmentNotificationEmail } from '@/lib/email';
import { generateTaskUrl } from '@/lib/taskUtils';
import { createInAppNotification } from '@/lib/notifications';
import { publishNotification } from '@/lib/ably';

// Force SSE for App Router (Socket.IO not properly supported)
const isProduction = true; // Always use SSE

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      taskId,
      taskTitle,
      taskDescription,
      assignedTo,
      priority,
      oldColumn,
      newColumn,
      teamId,
      teamName,
      movedBy,
      movedById,
      assignedMembers
    } = await req.json();

    // Validate required fields
    if (!taskId || !taskTitle || !newColumn || !teamId || !assignedMembers || !Array.isArray(assignedMembers)) {
      return NextResponse.json({ 
        error: 'Missing required fields: taskId, taskTitle, newColumn, teamId, assignedMembers' 
      }, { status: 400 });
    }

    // Process notifications for each assigned member
    const notifications = [];
    const emailResults: Array<{
      userId: string;
      email: string;
      status: 'sent' | 'failed';
      message: string;
    }> = [];
    
    for (const member of assignedMembers) {
      // Don't notify the person who moved the task
      if (member.userId === movedById) {
        continue;
      }

      try {
        // Log this as a task activity for notification record
        const activityLog = await prisma.taskActivityHistory.create({
          data: {
            taskId,
            userId: member.userId,
            actionType: 'STATUS_CHANGED',
            fieldName: 'column_assignment_notification',
            oldValue: oldColumn,
            newValue: newColumn,
            description: `Task "${taskTitle}" moved to assigned column "${newColumn}" by ${movedBy} - notification sent`
          }
        });

        notifications.push({
          activityId: activityLog.id,
          userId: member.userId,
          userEmail: member.userEmail,
          userName: member.userName,
          notificationMessage: `Task "${taskTitle}" moved to your assigned column "${newColumn}" by ${movedBy}`
        });

        // Send email notification
        try {
          await sendColumnAssignmentNotificationEmail({
            to: member.userEmail,
            userName: member.userName,
            taskTitle,
            taskDescription,
            columnName: newColumn,
            teamName,
            movedBy,
            priority,
            taskUrl: await generateTaskUrl(taskId)
          });

          emailResults.push({
            userId: member.userId,
            email: member.userEmail,
            status: 'sent',
            message: 'Email notification sent successfully'
          });

          // email sent
        } catch (emailError) {
          emailResults.push({
            userId: member.userId,
            email: member.userEmail,
            status: 'failed',
            message: emailError instanceof Error ? emailError.message : 'Unknown email error'
          });
          console.error(`❌ Failed to send email to ${member.userEmail}:`, emailError);
        }

        // Create in-app notification
        try {
          // Get the user who moved the task for profile data
          const movedByUser = await prisma.user.findUnique({
            where: { id: movedById },
            select: { id: true, name: true, email: true, image: true }
          });

          const inAppNotification = await createInAppNotification({
            userId: member.userId,
            type: 'TASK_STATUS_CHANGED',
            title: 'Task moved to your column',
            message: `${movedBy} moved "${taskTitle}" to ${newColumn}`,
            data: {
              taskId,
              taskTitle,
              oldColumn,
              newColumn,
              columnName: newColumn,
              teamName,
              movedBy,
              movedByUser: movedByUser ? {
                id: movedByUser.id,
                name: movedByUser.name,
                email: movedByUser.email,
                image: movedByUser.image
              } : null,
              priority,
              taskUrl: await generateTaskUrl(taskId, teamId)
            },
            taskId
          });


          // in-app notification created

          // Send real-time notification via unified Redis system
          const realtimeNotification = {
            id: `column_move_${taskId}_${member.userId}_${Date.now()}`,
            type: 'TASK_STATUS_CHANGED',
            title: 'Task moved to your column',
            message: `${movedBy} moved "${taskTitle}" to ${newColumn}`,
            data: {
              taskId,
              taskTitle,
              oldColumn,
              newColumn,
              columnName: newColumn,
              teamId,
              teamName,
              movedBy,
              movedByUser: movedByUser ? {
                id: movedByUser.id,
                name: movedByUser.name,
                email: movedByUser.email,
                image: movedByUser.image
              } : null,
              priority,
              taskUrl: await generateTaskUrl(taskId, teamId),
              notificationId: inAppNotification?.id || null,
            },
            userId: member.userId,
            teamId: teamId,
            timestamp: Date.now()
          };

          await publishNotification(realtimeNotification);
        } catch (inAppError) {
          console.error(`❌ Failed to create in-app notification for ${member.userEmail}:`, inAppError);
        }

          // notification logged
      } catch (error) {
        console.error(`❌ Failed to create notification for user ${member.userId}:`, error);
        // Continue with other notifications even if one fails
      }
    }

    // Enhanced logging
  // summary logged

    return NextResponse.json({
      success: true,
      message: `Column movement notifications processed for ${notifications.length} members`,
      notifications,
      emailResults,
      summary: {
        taskId,
        taskTitle,
        fromColumn: oldColumn,
        toColumn: newColumn,
        movedBy,
        notifiedCount: notifications.length,
        emailsSent: emailResults.filter(r => r.status === 'sent').length,
        emailsFailed: emailResults.filter(r => r.status === 'failed').length,
        teamName,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error processing column movement notifications:', error);
    return NextResponse.json(
      { error: 'Failed to process notifications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
