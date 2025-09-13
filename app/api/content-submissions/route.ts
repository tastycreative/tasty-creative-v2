import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import nodemailer from 'nodemailer';

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

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
    const allTeams = await prisma.podTeam.findMany();
    console.log('🔍 Available teams:', allTeams.map(t => ({ id: t.id, name: (t as any).name || (t as any).pod_name })));
    const otpPtrTeam = allTeams.find(team => (team as any).name === 'OTP-PTR');

    if (!otpPtrTeam) {
      console.error('❌ OTP-PTR team not found in database');
      return NextResponse.json(
        { error: 'OTP-PTR team not found in database' },
        { status: 500 }
      );
    }

    console.log('✅ Found OTP-PTR team:', otpPtrTeam.id, (otpPtrTeam as any).name);

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
      }
    } as any);

    console.log('📋 Task created:', task.id, 'for team:', (otpPtrTeam as any).name);

    // Create task activity history for automatic task creation
    await (prisma as any).taskActivityHistory.create({
      data: {
        taskId: task.id,
        userId: session.user.id!,
        actionType: 'CREATED',
        description: `Task automatically created from ${submissionType} content submission`,
        fieldName: null,
        oldValue: null,
        newValue: 'Task created'
      }
    });

    console.log('📝 Task activity history created for task:', task.id);
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

    // Update submission status
    const updatedSubmission = await (prisma as any).contentSubmission.update({
      where: { id: submission.id },
      data: { 
        status: 'TASK_CREATED',
        processedAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Send email notifications to team members
    if ((otpPtrTeam as any).team_members) {
      try {
        const teamMembers = (otpPtrTeam as any).team_members
          .split(',')
          .map((member: string) => member.trim())
          .filter((member: string) => member.includes('@'))
          .map((member: string) => {
            // Extract email if format is "email - role"
            return member.includes(' - ') ? member.split(' - ')[0] : member;
          });

        console.log('📧 Sending notifications to team members:', teamMembers);

        if (teamMembers.length > 0) {
          const emailResults = await Promise.allSettled(
            teamMembers.map(async (email: string) => {
              return transporter.sendMail({
                from: process.env.SMTP_FROM || 'Tasty Creative <noreply@tastycreative.com>',
                to: email,
                subject: `New ${submissionType} Content Task - ${data.modelName}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(90deg, #3B82F6, #8B5CF6); padding: 20px; border-radius: 8px 8px 0 0;">
                      <h1 style="color: white; margin: 0; font-size: 24px;">New Content Task Assigned</h1>
                    </div>
                    
                    <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
                      <h2 style="color: #374151; margin-top: 0;">${submissionType} Content - ${data.modelName}</h2>
                      
                      <div style="background: white; padding: 16px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #3B82F6;">
                        <p style="margin: 0; color: #6B7280; font-weight: 600;">Content Description:</p>
                        <p style="margin: 8px 0 0 0; color: #374151;">${data.contentDescription}</p>
                      </div>
                      
                      <div style="display: flex; gap: 16px; margin: 16px 0;">
                        <div style="background: white; padding: 12px; border-radius: 6px; flex: 1;">
                          <p style="margin: 0; color: #6B7280; font-size: 12px; font-weight: 600;">PRIORITY</p>
                          <p style="margin: 4px 0 0 0; color: #374151; font-weight: 600;">${data.priority.toUpperCase()}</p>
                        </div>
                        <div style="background: white; padding: 12px; border-radius: 6px; flex: 1;">
                          <p style="margin: 0; color: #6B7280; font-size: 12px; font-weight: 600;">TEAM</p>
                          <p style="margin: 4px 0 0 0; color: #374151; font-weight: 600;">${task.teamName}</p>
                        </div>
                      </div>
                      
                      <div style="margin: 20px 0;">
                        <a href="${data.driveLink}" style="display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                          View Google Drive
                        </a>
                      </div>
                      
                      <p style="color: #6B7280; font-size: 14px; margin-top: 20px;">
                        This task has been automatically created from a content submission. Please check the task board for more details.
                      </p>
                    </div>
                  </div>
                `
              });
            })
          );

          const successCount = emailResults.filter(result => result.status === 'fulfilled').length;
          const failureCount = emailResults.filter(result => result.status === 'rejected').length;

          console.log(`📧 Email notifications: ${successCount} sent, ${failureCount} failed`);

          if (failureCount > 0) {
            console.warn('❌ Some email notifications failed:', 
              emailResults
                .filter(result => result.status === 'rejected')
                .map(result => (result as any).reason)
            );
          }
        }
      } catch (emailError) {
        console.error('❌ Error sending email notifications:', emailError);
        // Don't fail the entire request if emails fail
      }
    }

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
        teamName: task.teamName,
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