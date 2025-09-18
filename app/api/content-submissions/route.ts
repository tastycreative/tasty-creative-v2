import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { publishNotification } from '@/lib/upstash';
import { sendOTPPTRTaskNotificationEmail } from '@/lib/email';
import { generateTaskUrl } from '@/lib/taskUtils';

interface SubmissionData {
  submissionType: 'otp' | 'ptr';
  modelName: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  driveLink: string;
  contentDescription: string;
  screenshotAttachments?: any[];
  releaseDate?: string;
  releaseTime?: string;
  minimumPrice?: string;
}

// Function to send notifications to PG team column assigned members and OTP-PTR team members
async function sendPGTeamNotifications({
  task,
  taskDescription,
  submissionType,
  modelName,
  teamId,
  teamName,
  createdById,
  createdByName
}: {
  task: any;
  taskDescription: string;
  submissionType: string;
  modelName: string;
  teamId: string;
  teamName: string;
  createdById: string;
  createdByName: string;
}) {
  try {
    console.log('🔔 Starting PG team notifications for task:', task.id);
    
    // Fetch the creator's user profile first
    const createdByUser = await (prisma as any).user.findUnique({
      where: { id: createdById },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    });
    
    if (!createdByUser) {
      console.error('❌ Creator user not found:', createdById);
      return { success: false, error: 'Creator user not found' };
    }
    
    console.log('👤 Creator user found:', createdByUser);
    
    // Find members assigned to the PG team column (CUSTOM_PG_TEAM_1757256153984)
    const pgColumnMembers = await (prisma as any).boardColumnMemberAssignment.findMany({
      where: {
        isActive: true,
        column: {
          teamId: teamId,
          status: 'CUSTOM_PG_TEAM_1757256153984',
          isActive: true
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        column: {
          select: {
            label: true,
            status: true
          }
        }
      }
    });

    // Get OTP-PTR team members
    const otpPtrTeamMembers = await (prisma as any).podTeamMember.findMany({
      where: {
        podTeamId: teamId,
        podTeam: {
          isActive: true
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    console.log('🔍 Found PG column members:', pgColumnMembers.length);
    console.log('🔍 Found OTP-PTR team members:', otpPtrTeamMembers.length);

    // Combine both sets of users (deduplicate by user ID)
    const allNotificationUsers = new Map();
    
    // Add PG column members
    pgColumnMembers.forEach((member: any) => {
      allNotificationUsers.set(member.user.id, {
        ...member.user,
        reason: 'PG Column Assignment',
        columnLabel: member.column.label
      });
    });
    
    // Add OTP-PTR team members
    otpPtrTeamMembers.forEach((member: any) => {
      if (!allNotificationUsers.has(member.user.id)) {
        allNotificationUsers.set(member.user.id, {
          ...member.user,
          reason: 'OTP-PTR Team Member'
        });
      }
    });

    const usersToNotify = Array.from(allNotificationUsers.values());
    console.log('🔔 Total unique users to notify:', usersToNotify.length);

    // Create task URL for notifications
    const taskUrl = await generateTaskUrl(task.id, teamId);

    // Send in-app notifications
    const notificationPromises = usersToNotify.map(async (user) => {
      // Create in-app notification
      const notification = await (prisma as any).notification.create({
        data: {
          userId: user.id,
          type: 'TASK_ASSIGNED',
          title: `New ${submissionType} Content Task`,
          message: `A new ${submissionType.toUpperCase()} content task for ${modelName} has been created and assigned to your team.`,
          isRead: false,
          data: {
            taskId: task.id,
            taskTitle: task.title,
            taskDescription: taskDescription,
            taskUrl: taskUrl,
            teamId: teamId,
            teamName: teamName,
            submissionType: submissionType,
            modelName: modelName,
            priority: task.priority,
            createdBy: createdByUser.name || createdByUser.email || 'Unknown User',
            createdByUser: {
              id: createdByUser.id,
              name: createdByUser.name,
              email: createdByUser.email,
              image: createdByUser.image
            },
            reason: user.reason,
            columnLabel: user.columnLabel || null
          },
          taskId: task.id,
          podTeamId: teamId
        }
      });

      // Publish real-time notification via Redis
      await publishNotification({
        id: notification.id,
        type: 'TASK_ASSIGNED',
        title: `New ${submissionType} Content Task`,
        message: `A new ${submissionType.toUpperCase()} content task for ${modelName} has been created and assigned to your team.`,
        userId: user.id,
        teamId: teamId,
        timestamp: Date.now(),
        data: {
          taskId: task.id,
          taskTitle: task.title,
          taskDescription: taskDescription,
          taskUrl: taskUrl,
          teamId: teamId,
          teamName: teamName,
          submissionType: submissionType,
          modelName: modelName,
          priority: task.priority,
          createdBy: createdByUser.name || createdByUser.email || 'Unknown User',
          createdByUser: {
            id: createdByUser.id,
            name: createdByUser.name,
            email: createdByUser.email,
            image: createdByUser.image
          },
          reason: user.reason,
          columnLabel: user.columnLabel || null
        }
      });

      return { user, notification };
    });

    const notificationResults = await Promise.allSettled(notificationPromises);
    const successfulNotifications = notificationResults.filter(result => result.status === 'fulfilled').length;
    
    console.log('✅ In-app notifications created:', successfulNotifications);

    // Send email notifications
    const emailPromises = usersToNotify.map(async (user) => {
      return sendOTPPTRTaskNotificationEmail({
        to: user.email,
        userName: user.name || user.email.split('@')[0],
        taskTitle: task.title,
        taskDescription: taskDescription,
        submissionType: submissionType,
        modelName: modelName,
        priority: task.priority,
        teamName: teamName,
        taskUrl: taskUrl,
        createdByName: createdByName,
        reason: user.reason,
        columnLabel: user.columnLabel
      });
    });

    const emailResults = await Promise.allSettled(emailPromises);
    const successfulEmails = emailResults.filter(result => result.status === 'fulfilled').length;
    const failedEmails = emailResults.filter(result => result.status === 'rejected').length;

    console.log('📧 Email notifications:', successfulEmails, 'sent,', failedEmails, 'failed');

    if (failedEmails > 0) {
      console.warn('❌ Some email notifications failed:', 
        emailResults
          .filter(result => result.status === 'rejected')
          .map(result => (result as any).reason)
      );
    }

    return {
      success: true,
      inAppNotifications: successfulNotifications,
      emailNotifications: successfulEmails,
      totalUsers: usersToNotify.length
    };

  } catch (error) {
    console.error('❌ Error sending PG team notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function POST(request: NextRequest) {
  console.log('🔥 API Route called: /api/content-submissions');
  
  try {
    console.log('🔐 Checking authentication...');
    const session = await auth();

    if (!session || !session.user) {
      console.log('❌ Not authenticated');
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log('✅ User authenticated:', session.user.id);

    console.log('📥 Reading request data...');
    const data: SubmissionData = await request.json();
    console.log('📊 Received data:', data);

    // Validate required fields
    if (!data.submissionType || !data.modelName || !data.priority || !data.driveLink || !data.contentDescription) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log('📝 Processing content submission:', data);

    // Convert priority to enum format
    const priorityMap = {
      'low': 'LOW',
      'normal': 'NORMAL', 
      'high': 'HIGH',
      'urgent': 'URGENT'
    };

    const submissionPriority = priorityMap[data.priority as keyof typeof priorityMap];
    const submissionType = data.submissionType.toUpperCase() as 'OTP' | 'PTR';

    // First, verify the OTP-PTR team exists before creating the submission
    const allTeams = await prisma.podTeam.findMany({
      select: {
        id: true,
        name: true,
        projectPrefix: true
      }
    });
    console.log('🔍 Available teams:', allTeams.map(t => ({ id: t.id, name: t.name })));
    const otpPtrTeam = allTeams.find(team => team.name === 'OTP-PTR');

    if (!otpPtrTeam) {
      console.error('❌ OTP-PTR team not found in database');
      return NextResponse.json(
        { error: 'OTP-PTR team not found in database' },
        { status: 500 }
      );
    }

    console.log('✅ Found OTP-PTR team:', otpPtrTeam.id, otpPtrTeam.name);

    // Use custom status for OTP-PTR tasks
    const initialStatus = 'CUSTOM_PG_TEAM_1757256153984';
    console.log('📋 Using custom status for task:', initialStatus);

    // Create content submission record
    const submission = await (prisma as any).contentSubmission.create({
      data: {
        id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        submissionType: submissionType,
        modelName: data.modelName,
        priority: submissionPriority as any,
        driveLink: data.driveLink,
        contentDescription: data.contentDescription,
        screenshotAttachments: data.screenshotAttachments || [],
        status: 'PENDING',
        createdById: session.user.id!,
        updatedAt: new Date(),
        // PTR-specific fields (only included if submissionType is PTR)
        ...(submissionType === 'PTR' && {
          releaseDate: data.releaseDate,
          releaseTime: data.releaseTime,
          minimumPrice: data.minimumPrice,
        }),
      }
    });

    console.log('✅ Content submission created:', submission.id);

    // Convert submission priority to task priority
    const taskPriorityMap = {
      'LOW': 'LOW',
      'NORMAL': 'MEDIUM',
      'HIGH': 'HIGH', 
      'URGENT': 'URGENT'
    };

    const taskPriority = taskPriorityMap[submissionPriority as keyof typeof taskPriorityMap];

    // Build task description with PTR-specific details
    let taskDescription = `Content submission for ${data.modelName}\n\n${data.contentDescription}\n\nGoogle Drive: ${data.driveLink}`;
    
    if (submissionType === 'PTR' && data.releaseDate && data.releaseTime && data.minimumPrice) {
      taskDescription += `\n\n--- PTR Details ---`;
      taskDescription += `\nRelease Date: ${data.releaseDate}`;
      taskDescription += `\nRelease Time: ${data.releaseTime}`;
      taskDescription += `\nMinimum Price: $${data.minimumPrice}`;
    }

    // Create the task automatically
    const task = await prisma.task.create({
      data: {
        title: `${submissionType} Content - ${data.modelName}`,
        description: taskDescription,
        status: initialStatus,
        priority: taskPriority as any,
        podTeamId: otpPtrTeam.id, // Use the OTP-PTR team ID
        assignedTo: null, // Individual assignment (null means assigned to team)
        createdById: session.user.id!,
        contentSubmissionId: submission.id,
        attachments: data.screenshotAttachments || [],
        // taskNumber will be auto-incremented by the database
      }
    } as any);

    console.log('📋 Task created:', task.id, 'for team:', otpPtrTeam.name);

    // Create task activity history for automatic task creation
    await (prisma as any).taskActivityHistory.create({
      data: {
        taskId: task.id,
        userId: session.user.id!,
        actionType: 'CREATED',
        description: `Task automatically created from ${submissionType} content submission: ${data.modelName}`,
        fieldName: null,
        oldValue: null,
        newValue: 'Task created'
      }
    });

    console.log('📝 Task activity history created for task:', task.id);

    // Send notifications to PG team column assigned members and OTP-PTR team members
    await sendPGTeamNotifications({
      task,
      taskDescription,
      submissionType,
      modelName: data.modelName,
      teamId: otpPtrTeam.id,
      teamName: otpPtrTeam.name,
      createdById: session.user.id!,
      createdByName: session.user.name || session.user.email || 'Unknown User'
    });

    // Update submission status
    const updatedSubmission = await (prisma as any).contentSubmission.update({
      where: { id: submission.id },
      data: { 
        status: 'TASK_CREATED',
        processedAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        status: submission.status,
        createdAt: submission.createdAt
      },
      task: {
        id: task.id,
        title: task.title,
        teamName: otpPtrTeam.name,
        priority: task.priority
      },
      message: 'Content submission processed and task created successfully'
    });

  } catch (error) {
    console.error('❌ Error processing content submission:', error);
    return NextResponse.json(
      { error: 'Failed to process content submission' },
      { status: 500 }
    );
  }
}