import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { publishNotification } from '@/lib/upstash';
import { sendOTPPTRTaskNotificationEmail } from '@/lib/email';
import { generateTaskUrl } from '@/lib/taskUtils';

interface ModularWorkflowData {
  submissionType: 'otp' | 'ptr';
  contentStyle: 'normal' | 'game' | 'poll' | 'livestream';
  selectedComponents: string[];
  componentData?: Record<string, any>;
  workflowTemplate?: string;

  // Base fields
  modelName: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  driveLink: string;
  contentDescription: string;
  attachments?: any[];

  // Team assignment
  teamId?: string;
  estimatedDuration?: number;
}

// Workflow column definitions for different content types (matches old board approach)
interface WorkflowColumn {
  label: string;
  status: string;
  position: number;
  color: string;
  description: string;
}

const WORKFLOW_COLUMNS: Record<string, WorkflowColumn[]> = {
  'normal': [
    { label: 'Wall Post Team', status: 'wall_post', position: 0, color: '#3B82F6', description: 'Content sourcing and initial processing' },
    { label: 'PG Team', status: 'pg_team', position: 1, color: '#8B5CF6', description: 'Caption creation and content enhancement' },
    { label: 'QA', status: 'qa', position: 2, color: '#F59E0B', description: 'Quality assurance and final approval' },
    { label: 'Ready to Deploy', status: 'ready_deploy', position: 3, color: '#10B981', description: 'Publication ready' },
    { label: 'Deployed', status: 'deployed', position: 4, color: '#6B7280', description: 'Content published' }
  ],
  'poll': [
    { label: 'Wall Post Team', status: 'wall_post', position: 0, color: '#3B82F6', description: 'Content sourcing and initial processing' },
    { label: 'PG Team', status: 'pg_team', position: 1, color: '#8B5CF6', description: 'Caption creation and content enhancement' },
    { label: 'QA', status: 'qa', position: 2, color: '#F59E0B', description: 'Quality assurance and final approval' },
    { label: 'Ready to Deploy', status: 'ready_deploy', position: 3, color: '#10B981', description: 'Publication ready' },
    { label: 'Deployed', status: 'deployed', position: 4, color: '#6B7280', description: 'Content published' }
  ],
  'game': [
    { label: 'Wall Post Team', status: 'wall_post', position: 0, color: '#3B82F6', description: 'Content sourcing and initial processing' },
    { label: 'PG Team', status: 'pg_team', position: 1, color: '#8B5CF6', description: 'Caption creation and content enhancement' },
    { label: 'Flyer Team', status: 'flyer_team', position: 2, color: '#EF4444', description: 'Visual design and promotional materials' },
    { label: 'QA', status: 'qa', position: 3, color: '#F59E0B', description: 'Quality assurance and final approval' },
    { label: 'Ready to Deploy', status: 'ready_deploy', position: 4, color: '#10B981', description: 'Publication ready' },
    { label: 'Deployed', status: 'deployed', position: 5, color: '#6B7280', description: 'Content published' }
  ],
  'livestream': [
    { label: 'Wall Post Team', status: 'wall_post', position: 0, color: '#3B82F6', description: 'Content sourcing and initial processing' },
    { label: 'PG Team', status: 'pg_team', position: 1, color: '#8B5CF6', description: 'Caption creation and content enhancement' },
    { label: 'Flyer Team', status: 'flyer_team', position: 2, color: '#EF4444', description: 'Visual design and promotional materials' },
    { label: 'QA', status: 'qa', position: 3, color: '#F59E0B', description: 'Quality assurance and final approval' },
    { label: 'Ready to Deploy', status: 'ready_deploy', position: 4, color: '#10B981', description: 'Publication ready' },
    { label: 'Deployed', status: 'deployed', position: 5, color: '#6B7280', description: 'Content published' }
  ]
};

// Helper function to get workflow columns for content style
function getWorkflowColumns(contentStyle: string): WorkflowColumn[] {
  return WORKFLOW_COLUMNS[contentStyle] || WORKFLOW_COLUMNS['normal'];
}

// Helper function to create workflow columns in database
async function createWorkflowColumns(teamId: string, contentStyle: string): Promise<void> {
  const columns = getWorkflowColumns(contentStyle);

  // Check if columns already exist for this team
  const existingColumns = await prisma.boardColumn.findMany({
    where: {
      teamId: teamId,
      isActive: true
    }
  });

  // If columns already exist, don't create duplicates
  if (existingColumns.length > 0) {
    console.log('✅ Workflow columns already exist for team:', teamId);
    return;
  }

  console.log('📋 Creating workflow columns for team:', teamId, 'style:', contentStyle);

  // Create columns in database
  for (const column of columns) {
    await prisma.boardColumn.create({
      data: {
        id: `${teamId}-${column.status}`,
        teamId,
        label: column.label,
        status: column.status,
        position: column.position,
        color: column.color,
        isDefault: false,
        isActive: true,
        updatedAt: new Date()
      }
    });
  }

  console.log('✅ Created', columns.length, 'workflow columns for team:', teamId);
}

// Helper function to find team by name or create workflow-compatible status
async function findOrCreateWorkflowTeam(teamName: string): Promise<any> {
  // Try to find existing team by name
  const team = await prisma.podTeam.findFirst({
    where: {
      name: {
        contains: teamName.replace(' Team', ''),
        mode: 'insensitive'
      }
    },
    select: { id: true, name: true, projectPrefix: true }
  });

  if (team) return team;

  // If no team found, return a mock team structure for workflow compatibility
  return {
    id: `workflow_${teamName.toLowerCase().replace(/\s+/g, '_')}`,
    name: teamName,
    projectPrefix: teamName.split(' ').map(w => w[0]).join('').toUpperCase()
  };
}

// Function to send notifications for modular workflows
async function sendModularWorkflowNotifications({
  workflow,
  task,
  taskDescription,
  submissionType,
  modelName,
  teamId,
  teamName,
  createdById,
  createdByName,
  contentStyle,
  selectedComponents
}: {
  workflow: any;
  task: any;
  taskDescription: string;
  submissionType: string;
  modelName: string;
  teamId: string;
  teamName: string;
  createdById: string;
  createdByName: string;
  contentStyle: string;
  selectedComponents: string[];
}) {
  try {
    console.log('🔔 Starting modular workflow notifications for task:', task.id);

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

    // Find members assigned to the team
    const teamMembers = await (prisma as any).podTeamMember.findMany({
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

    console.log('🔍 Found team members:', teamMembers.length);

    const usersToNotify = teamMembers.map((member: any) => member.user);
    console.log('🔔 Total users to notify:', usersToNotify.length);

    // Create task URL for notifications
    const taskUrl = await generateTaskUrl(task.id, teamId);

    // Send in-app notifications
    const notificationPromises = usersToNotify.map(async (user) => {
      // Create in-app notification
      const notification = await (prisma as any).notification.create({
        data: {
          userId: user.id,
          type: 'TASK_ASSIGNED',
          title: `New ${contentStyle.toUpperCase()} ${submissionType.toUpperCase()} Workflow`,
          message: `A new modular workflow for ${modelName} has been created with ${selectedComponents.length} components: ${selectedComponents.join(', ')}.`,
          isRead: false,
          data: {
            workflowId: workflow.id,
            taskId: task.id,
            taskTitle: task.title,
            taskDescription: taskDescription,
            taskUrl: taskUrl,
            teamId: teamId,
            teamName: teamName,
            submissionType: submissionType,
            contentStyle: contentStyle,
            selectedComponents: selectedComponents,
            modelName: modelName,
            priority: task.priority,
            createdBy: createdByUser.name || createdByUser.email || 'Unknown User',
            createdByUser: {
              id: createdByUser.id,
              name: createdByUser.name,
              email: createdByUser.email,
              image: createdByUser.image
            }
          },
          taskId: task.id,
          modularWorkflowId: workflow.id,
          podTeamId: teamId
        }
      });

      // Publish real-time notification via Redis
      await publishNotification({
        id: notification.id,
        type: 'TASK_ASSIGNED',
        title: `New ${contentStyle.toUpperCase()} ${submissionType.toUpperCase()} Workflow`,
        message: `A new modular workflow for ${modelName} has been created with ${selectedComponents.length} components.`,
        userId: user.id,
        teamId: teamId,
        timestamp: Date.now(),
        data: {
          workflowId: workflow.id,
          taskId: task.id,
          taskTitle: task.title,
          taskDescription: taskDescription,
          taskUrl: taskUrl,
          teamId: teamId,
          teamName: teamName,
          submissionType: submissionType,
          contentStyle: contentStyle,
          selectedComponents: selectedComponents,
          modelName: modelName,
          priority: task.priority,
          createdBy: createdByUser.name || createdByUser.email || 'Unknown User',
          createdByUser: {
            id: createdByUser.id,
            name: createdByUser.name,
            email: createdByUser.email,
            image: createdByUser.image
          }
        }
      });

      return { user, notification };
    });

    const notificationResults = await Promise.allSettled(notificationPromises);
    const successfulNotifications = notificationResults.filter(result => result.status === 'fulfilled').length;

    console.log('✅ In-app notifications created:', successfulNotifications);

    // Send email notifications with modular workflow context
    const emailPromises = usersToNotify.map(async (user) => {
      return sendOTPPTRTaskNotificationEmail({
        to: user.email,
        userName: user.name || user.email.split('@')[0],
        taskTitle: task.title,
        taskDescription: taskDescription + `\n\nWorkflow Type: ${contentStyle.toUpperCase()}\nComponents: ${selectedComponents.join(', ')}`,
        submissionType: submissionType,
        modelName: modelName,
        priority: task.priority,
        teamName: teamName,
        taskUrl: taskUrl,
        createdByName: createdByName,
        reason: 'Modular Workflow Assignment'
      });
    });

    const emailResults = await Promise.allSettled(emailPromises);
    const successfulEmails = emailResults.filter(result => result.status === 'fulfilled').length;
    const failedEmails = emailResults.filter(result => result.status === 'rejected').length;

    console.log('📧 Email notifications:', successfulEmails, 'sent,', failedEmails, 'failed');

    return {
      success: true,
      inAppNotifications: successfulNotifications,
      emailNotifications: successfulEmails,
      totalUsers: usersToNotify.length
    };

  } catch (error) {
    console.error('❌ Error sending modular workflow notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function POST(request: NextRequest) {
  console.log('🔥 API Route called: /api/modular-workflows');

  try {
    console.log('🔐 Checking authentication...');
    const session = await auth();

    if (!session || !session.user) {
      console.log('❌ Not authenticated');
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log('✅ User authenticated:', session.user.id);

    console.log('📥 Reading request data...');
    const data: ModularWorkflowData = await request.json();
    console.log('📊 Received modular workflow data:', data);

    // Validate required fields
    if (!data.submissionType || !data.contentStyle || !data.selectedComponents ||
        !data.modelName || !data.priority || !data.driveLink || !data.contentDescription) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log('📝 Processing modular workflow:', data);

    // Convert priority to enum format
    const priorityMap = {
      'low': 'LOW',
      'normal': 'NORMAL',
      'high': 'HIGH',
      'urgent': 'URGENT'
    };

    const contentStyleMap = {
      'normal': 'NORMAL',
      'game': 'GAME',
      'poll': 'POLL',
      'livestream': 'LIVESTREAM'
    };

    const workflowPriority = priorityMap[data.priority as keyof typeof priorityMap];
    const workflowSubmissionType = data.submissionType.toUpperCase() as 'OTP' | 'PTR';
    const workflowContentStyle = contentStyleMap[data.contentStyle as keyof typeof contentStyleMap];

    // Get workflow columns for this content style
    const workflowColumns = getWorkflowColumns(data.contentStyle);
    const firstColumn = workflowColumns[0];

    console.log('📋 Workflow columns for', data.contentStyle, ':', workflowColumns.map(col => col.label).join(' → '));

    // Find the team (using provided teamId or fallback to team lookup)
    let assignedTeam;
    if (data.teamId) {
      assignedTeam = await prisma.podTeam.findUnique({
        where: { id: data.teamId }
      });
      if (!assignedTeam) {
        throw new Error(`Team with ID ${data.teamId} not found`);
      }
    } else {
      // Fallback to finding team by name or create one
      assignedTeam = await findOrCreateWorkflowTeam('Default Team');
    }

    // Create workflow columns in database for this team
    await createWorkflowColumns(assignedTeam.id, data.contentStyle);

    // If using provided teamId, try to find that team instead
    if (data.teamId) {
      const specificTeam = await prisma.podTeam.findUnique({
        where: { id: data.teamId },
        select: { id: true, name: true, projectPrefix: true }
      });
      if (specificTeam) {
        assignedTeam = specificTeam;
      }
    }

    console.log('✅ Assigned team for first workflow step:', assignedTeam.name);

    // Create modular workflow record
    const workflow = await (prisma as any).modularWorkflow.create({
      data: {
        id: `mw_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        submissionType: workflowSubmissionType,
        contentStyle: workflowContentStyle,
        selectedComponents: data.selectedComponents,
        componentData: data.componentData || {},
        workflowTemplate: data.workflowTemplate,
        modelName: data.modelName,
        priority: workflowPriority as any,
        driveLink: data.driveLink,
        contentDescription: data.contentDescription,
        attachments: data.attachments || [],
        estimatedDuration: data.estimatedDuration,
        teamAssignments: {
          primary: assignedTeam.id,
          contentStyle: data.contentStyle,
          components: data.selectedComponents,
          workflowColumns: workflowColumns,
          currentStep: 0
        },
        createdById: session.user.id!,
        teamId: assignedTeam.id,
        status: 'PENDING',
        updatedAt: new Date()
      }
    });

    console.log('✅ Modular workflow created:', workflow.id);

    // Convert workflow priority to task priority
    const taskPriorityMap = {
      'LOW': 'LOW',
      'NORMAL': 'MEDIUM',
      'HIGH': 'HIGH',
      'URGENT': 'URGENT'
    };

    const taskPriority = taskPriorityMap[workflowPriority as keyof typeof taskPriorityMap];

    // Build enhanced task description with modular context
    let taskDescription = `Modular Workflow: ${data.contentStyle.toUpperCase()} Content for ${data.modelName}\n\n`;
    taskDescription += `Components: ${data.selectedComponents.join(', ')}\n\n`;
    taskDescription += `${data.contentDescription}\n\n`;
    taskDescription += `Google Drive: ${data.driveLink}`;

    if (data.componentData && Object.keys(data.componentData).length > 0) {
      taskDescription += `\n\n--- Component Data ---`;
      Object.entries(data.componentData).forEach(([key, value]) => {
        taskDescription += `\n${key}: ${value}`;
      });
    }

    // Create the task automatically with modular context and workflow-based status
    const task = await prisma.task.create({
      data: {
        title: `${workflowSubmissionType} ${data.contentStyle.toUpperCase()} - ${data.modelName}`,
        description: taskDescription,
        status: firstColumn.status, // Use first workflow column status
        priority: taskPriority as any,
        podTeamId: assignedTeam.id,
        assignedTo: null,
        createdById: session.user.id!,
        attachments: data.attachments || [],
        // Store modular workflow data
        selectedComponents: data.selectedComponents,
        componentData: data.componentData || {}
      }
    } as any);

    console.log('📋 Task created:', task.id, 'for team:', assignedTeam.name);

    // Link task to workflow
    const updatedWorkflow = await (prisma as any).modularWorkflow.update({
      where: { id: workflow.id },
      data: {
        taskId: task.id,
        status: 'TASK_CREATED',
        processedAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create task activity history
    await (prisma as any).taskActivityHistory.create({
      data: {
        taskId: task.id,
        userId: session.user.id!,
        actionType: 'CREATED',
        description: `Task automatically created from ${workflowSubmissionType} modular workflow: ${data.contentStyle.toUpperCase()} for ${data.modelName}`,
        fieldName: null,
        oldValue: null,
        newValue: 'Task created'
      }
    });

    console.log('📝 Task activity history created for task:', task.id);

    // Send notifications to team members
    await sendModularWorkflowNotifications({
      workflow: updatedWorkflow,
      task,
      taskDescription,
      submissionType: data.submissionType,
      modelName: data.modelName,
      teamId: assignedTeam.id,
      teamName: assignedTeam.name,
      createdById: session.user.id!,
      createdByName: session.user.name || session.user.email || 'Unknown User',
      contentStyle: data.contentStyle,
      selectedComponents: data.selectedComponents
    });

    return NextResponse.json({
      success: true,
      workflow: {
        id: workflow.id,
        contentStyle: data.contentStyle,
        selectedComponents: data.selectedComponents,
        status: updatedWorkflow.status,
        createdAt: workflow.createdAt
      },
      task: {
        id: task.id,
        title: task.title,
        teamName: assignedTeam.name,
        priority: task.priority
      },
      message: 'Modular workflow processed and task created successfully'
    });

  } catch (error) {
    console.error('❌ Error processing modular workflow:', error);
    return NextResponse.json(
      { error: 'Failed to process modular workflow' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user's modular workflows
    const workflows = await (prisma as any).modularWorkflow.findMany({
      where: {
        createdById: session.user.id
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      workflows
    });

  } catch (error) {
    console.error('❌ Error fetching modular workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch modular workflows' },
      { status: 500 }
    );
  }
}