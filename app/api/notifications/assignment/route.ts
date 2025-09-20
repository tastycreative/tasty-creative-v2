import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendTaskAssignmentNotificationEmail } from '@/lib/email';
import { generateTaskUrl } from '@/lib/taskUtils';
import { createInAppNotification } from '@/lib/notifications';
import { publishNotification } from '@/lib/ably';

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
      assignedToEmail,
      assignedToUserId,
      priority,
      teamId,
      teamName,
      assignedBy,
      assignedById,
      dueDate,
      previousAssigneeId // Optional: to handle reassignment
    } = await req.json();

    // Validate required fields
    if (!taskId || !taskTitle || !assignedToUserId || !teamId || !assignedBy) {
      return NextResponse.json({ 
        error: 'Missing required fields: taskId, taskTitle, assignedToUserId, teamId, assignedBy' 
      }, { status: 400 });
    }

    // Get the assigned user details
    const assignedUser = await prisma.user.findUnique({
      where: { id: assignedToUserId },
      select: { id: true, name: true, email: true, image: true }
    });

    if (!assignedUser) {
      return NextResponse.json({ error: 'Assigned user not found' }, { status: 404 });
    }

    // Don't notify if user is assigning to themselves
    if (assignedToUserId === assignedById) {
      return NextResponse.json({
        success: true,
        message: 'Task assigned to self - no notification sent',
        assignedToUserId,
        taskId
      });
    }

    try {
      // Log this as a task activity for notification record
      const activityLog = await prisma.taskActivityHistory.create({
        data: {
          taskId,
          userId: assignedToUserId,
          actionType: 'ASSIGNED',
          fieldName: 'assignedTo',
          oldValue: previousAssigneeId || null,
          newValue: assignedToUserId,
          description: `Task "${taskTitle}" assigned to ${assignedUser.name || assignedUser.email} by ${assignedBy}`
        }
      });

      // Generate task URL
      const taskUrl = await generateTaskUrl(taskId, teamId);

      // Send email notification
      try {
        await sendTaskAssignmentNotificationEmail({
          to: assignedUser.email!,
          assigneeName: assignedUser.name || assignedUser.email!.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          taskTitle,
          taskDescription,
          assignedBy,
          priority: priority || 'MEDIUM',
          teamName: teamName || 'Team',
          taskUrl,
          dueDate
        });

        console.log(`📧 Task assignment email sent to ${assignedUser.email}`);
      } catch (emailError) {
        console.error(`❌ Failed to send assignment email to ${assignedUser.email}:`, emailError);
        // Continue with in-app notification even if email fails
      }

      // Create in-app notification
      const inAppNotification = await createInAppNotification({
        userId: assignedToUserId,
        type: 'TASK_ASSIGNED',
        title: 'Task assigned to you',
        message: `${assignedBy} assigned "${taskTitle}" to you`,
        data: {
          taskId,
          taskTitle,
          taskDescription,
          assignedBy,
          assignedById,
          priority: priority || 'MEDIUM',
          teamId,
          teamName,
          taskUrl,
          dueDate,
          activityId: activityLog.id
        },
        taskId
      });

      // Send real-time notification via Redis
      const realtimeNotification = {
        id: `task_assignment_${taskId}_${assignedToUserId}_${Date.now()}`,
        type: 'TASK_ASSIGNED',
        title: 'Task assigned to you',
        message: `${assignedBy} assigned "${taskTitle}" to you`,
        data: {
          taskId,
          taskTitle,
          taskDescription,
          assignedBy,
          assignedById,
          priority: priority || 'MEDIUM',
          teamId,
          teamName,
          taskUrl,
          dueDate,
          notificationId: inAppNotification?.id || null,
          activityId: activityLog.id
        },
        userId: assignedToUserId,
        teamId: teamId,
        timestamp: Date.now()
      };

      await publishNotification(realtimeNotification);

      console.log(`✅ TASK ASSIGNMENT NOTIFICATION:`);
      console.log(`   └─ Task: "${taskTitle}" (ID: ${taskId})`);
      console.log(`   └─ Assigned to: ${assignedUser.name || assignedUser.email} (ID: ${assignedToUserId})`);
      console.log(`   └─ Assigned by: ${assignedBy} (ID: ${assignedById})`);
      console.log(`   └─ Team: ${teamName} (ID: ${teamId})`);

      return NextResponse.json({
        success: true,
        message: 'Task assignment notification sent successfully',
        assignedToUserId,
        assignedToEmail: assignedUser.email,
        assignedToName: assignedUser.name,
        taskId,
        taskTitle,
        activityId: activityLog.id,
        notificationId: inAppNotification?.id
      });

    } catch (notificationError) {
      console.error(`❌ Failed to create assignment notification for ${assignedUser.email}:`, notificationError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create notification',
        details: notificationError instanceof Error ? notificationError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error processing task assignment notification:', error);
    return NextResponse.json(
      { error: 'Failed to process task assignment notification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
