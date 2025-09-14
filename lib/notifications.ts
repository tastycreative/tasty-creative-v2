import { prisma } from './prisma';
import { 
  sendColumnAssignmentNotificationEmail,
  sendMentionNotificationEmail,
  sendSheetLinkNotificationEmail,
  sendRoleElevationEmail,
  sendFormSubmissionEmail,
  sendCommentNotificationEmail,
  sendSubmissionConfirmationEmail
} from './email';
import { broadcastToUser } from '@/app/api/notifications/stream/route';

// Detect if we're in production or development
const isProduction = typeof process !== 'undefined' && !(
  process.env.NODE_ENV === 'development'
);

export interface NotificationData {
  userId: string;
  type: 'TASK_ASSIGNED' | 'TASK_STATUS_CHANGED' | 'TASK_COMMENT_ADDED' | 'TASK_DUE_DATE_APPROACHING' | 'POD_TEAM_ADDED' | 'POD_TEAM_CLIENT_ASSIGNED' | 'POD_TEAM_MEMBER_JOINED' | 'CONTENT_SUBMISSION_STATUS_CHANGED' | 'CLIENT_SHEET_LINK_ADDED' | 'SYSTEM_NOTIFICATION';
  title: string;
  message: string;
  data?: Record<string, any>;
  taskId?: string;
  podTeamId?: string;
  contentSubmissionId?: string;
  clientModelId?: string;
}

export interface EmailNotificationData {
  to: string;
  userName: string;
  emailType: 'columnAssignment' | 'mention' | 'sheetLink' | 'roleElevation' | 'formSubmission' | 'commentNotification' | 'submissionConfirmation';
  emailData: Record<string, any>;
}

export async function createInAppNotification(notificationData: NotificationData) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || {},
        taskId: notificationData.taskId,
        podTeamId: notificationData.podTeamId,
        contentSubmissionId: notificationData.contentSubmissionId,
        clientModelId: notificationData.clientModelId,
      },
    });

    return notification;
  } catch (error) {
    console.error('Error creating in-app notification:', error);
    throw error;
  }
}

export async function getUnreadNotifications(userId: string) {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        isRead: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        podTeam: {
          select: {
            id: true,
            name: true,
          },
        },
        contentSubmission: {
          select: {
            id: true,
            submissionType: true,
            modelName: true,
          },
        },
        clientModel: {
          select: {
            id: true,
            clientName: true,
          },
        },
      },
    });

    return notifications;
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    throw error;
  }
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId, // Ensure user can only mark their own notifications as read
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    const notifications = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return notifications;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

export async function getNotificationCount(userId: string) {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return count;
  } catch (error) {
    console.error('Error getting notification count:', error);
    throw error;
  }
}

// Comprehensive dual notification functions
export async function sendDualNotification(
  inAppNotification: NotificationData,
  emailNotification?: EmailNotificationData
) {
  try {
    // Create in-app notification
    const notification = await createInAppNotification(inAppNotification);

    // Send email notification if provided
    if (emailNotification) {
      await sendEmailNotification(emailNotification);
    }

    // Trigger real-time notification
    await triggerRealTimeNotification(notification);

    return notification;
  } catch (error) {
    console.error('Error sending dual notification:', error);
    throw error;
  }
}

export async function sendEmailNotification(emailData: EmailNotificationData) {
  try {
    switch (emailData.emailType) {
      case 'columnAssignment':
        await sendColumnAssignmentNotificationEmail({
          to: emailData.to,
          userName: emailData.userName,
          taskTitle: emailData.emailData.taskTitle,
          taskDescription: emailData.emailData.taskDescription,
          columnName: emailData.emailData.columnName,
          teamName: emailData.emailData.teamName,
          movedBy: emailData.emailData.movedBy,
          priority: emailData.emailData.priority,
          taskUrl: emailData.emailData.taskUrl,
        });
        break;

      case 'mention':
        await sendMentionNotificationEmail({
          to: emailData.to,
          mentionedUserName: emailData.userName,
          mentionerName: emailData.emailData.mentionerName,
          taskTitle: emailData.emailData.taskTitle,
          taskDescription: emailData.emailData.taskDescription,
          commentContent: emailData.emailData.commentContent,
          teamName: emailData.emailData.teamName,
          taskUrl: emailData.emailData.taskUrl,
        });
        break;

      case 'sheetLink':
        await sendSheetLinkNotificationEmail({
          to: emailData.to,
          modelName: emailData.emailData.modelName,
          sheetName: emailData.emailData.sheetName,
          sheetUrl: emailData.emailData.sheetUrl,
          addedBy: emailData.emailData.addedBy,
          timestamp: emailData.emailData.timestamp,
        });
        break;

      case 'roleElevation':
        await sendRoleElevationEmail({
          to: emailData.to,
          userName: emailData.userName,
          oldRole: emailData.emailData.oldRole,
          newRole: emailData.emailData.newRole,
          elevatedBy: emailData.emailData.elevatedBy,
        });
        break;

      case 'formSubmission':
        await sendFormSubmissionEmail({
          to: emailData.to,
          formTitle: emailData.emailData.formTitle,
          submitterName: emailData.emailData.submitterName,
          submitterEmail: emailData.emailData.submitterEmail,
          submissionData: emailData.emailData.submissionData,
          formUrl: emailData.emailData.formUrl,
        });
        break;

      case 'commentNotification':
        await sendCommentNotificationEmail({
          to: emailData.to,
          postOwnerName: emailData.userName,
          commenterName: emailData.emailData.commenterName,
          commentContent: emailData.emailData.commentContent,
          postTitle: emailData.emailData.postTitle,
          postUrl: emailData.emailData.postUrl,
        });
        break;

      case 'submissionConfirmation':
        await sendSubmissionConfirmationEmail({
          to: emailData.to,
          formTitle: emailData.emailData.formTitle,
          submissionData: emailData.emailData.submissionData,
          confirmationUrl: emailData.emailData.confirmationUrl,
        });
        break;

      default:
        console.warn(`Unknown email type: ${emailData.emailType}`);
    }
  } catch (error) {
    console.error('Error sending email notification:', error);
    throw error;
  }
}

export async function triggerRealTimeNotification(notification: any) {
  try {
    console.log('📡 Triggering real-time notification via SSE:', notification.id);
    
    // Use SSE for all environments (App Router compatible)
    await broadcastToUser(notification.userId, notification);
    
    console.log('✅ Real-time notification sent successfully via SSE');
  } catch (error) {
    console.error('Error triggering real-time notification:', error);
  }
}

// Specific notification helpers for common scenarios
export async function sendMentionNotification(
  mentionedUserId: string,
  mentionerName: string,
  taskId: string,
  taskTitle: string,
  commentContent: string,
  teamName?: string,
  podTeamId?: string
) {
  const mentionedUser = await prisma.user.findUnique({
    where: { id: mentionedUserId },
    select: { id: true, name: true, email: true }
  });

  if (!mentionedUser?.email) return;

  const taskUrl = `${process.env.NEXTAUTH_URL}/apps/pod/board?team=${podTeamId}&task=${taskId}`;

  await sendDualNotification(
    {
      userId: mentionedUserId,
      type: 'TASK_COMMENT_ADDED',
      title: 'You were mentioned in a comment',
      message: `${mentionerName} mentioned you in "${taskTitle}"`,
      data: {
        taskId,
        taskTitle,
        commentContent,
        mentionerName,
        teamName,
        taskUrl,
      },
      taskId,
      podTeamId,
    },
    {
      to: mentionedUser.email,
      userName: mentionedUser.name || mentionedUser.email.split('@')[0],
      emailType: 'mention',
      emailData: {
        mentionerName,
        taskTitle,
        commentContent,
        teamName,
        taskUrl,
      },
    }
  );
}

export async function sendSheetLinkNotification(
  userId: string,
  modelName: string,
  sheetName: string,
  sheetUrl: string,
  addedBy: string,
  clientModelId?: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true }
  });

  if (!user?.email) return;

  await sendDualNotification(
    {
      userId,
      type: 'CLIENT_SHEET_LINK_ADDED',
      title: 'New sheet link added',
      message: `${addedBy} added a new sheet link for ${modelName}`,
      data: {
        modelName,
        sheetName,
        sheetUrl,
        addedBy,
        timestamp: new Date().toISOString(),
      },
      clientModelId,
    },
    {
      to: user.email,
      userName: user.name || user.email.split('@')[0],
      emailType: 'sheetLink',
      emailData: {
        modelName,
        sheetName,
        sheetUrl,
        addedBy,
        timestamp: new Date().toISOString(),
      },
    }
  );
}

export async function sendTaskAssignmentNotification(
  taskId: string,
  assignedUserId: string,
  assignedByUserId: string,
  taskTitle: string,
  podTeamId?: string
) {
  const [assignedUser, assignedByUser] = await Promise.all([
    prisma.user.findUnique({ 
      where: { id: assignedUserId },
      select: { id: true, name: true, email: true }
    }),
    prisma.user.findUnique({ 
      where: { id: assignedByUserId },
      select: { id: true, name: true, email: true }
    })
  ]);

  if (!assignedUser?.email || !assignedByUser) return;

  const taskUrl = `${process.env.NEXTAUTH_URL}/apps/pod/board?team=${podTeamId}&task=${taskId}`;
  const assignerName = assignedByUser.name || assignedByUser.email?.split('@')[0] || 'Someone';

  await sendDualNotification(
    {
      userId: assignedUserId,
      type: 'TASK_ASSIGNED',
      title: 'Task assigned to you',
      message: `${assignerName} assigned you to "${taskTitle}"`,
      data: {
        taskId,
        taskTitle,
        assignedBy: assignerName,
        taskUrl,
      },
      taskId,
      podTeamId,
    }
    // No email for task assignment in this case, but could be added
  );
}