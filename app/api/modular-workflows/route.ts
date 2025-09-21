import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { publishNotification } from '@/lib/ably';
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

  // Enhanced team assignment with manual overrides
  teamId?: string;
  teamAssignments?: {
    primaryTeamId: string;
    additionalTeamIds: string[];
    assignmentMethod: 'manual' | 'automatic';
    assignedAt: string;
  };
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
  // Normal WP & Poll Posts Workflow: Wall Post → PG → QA → Deploy
  'normal': [
    { label: 'Wall Post Team', status: 'wall_post', position: 0, color: '#3B82F6', description: 'Content sourcing and initial processing' },
    { label: 'PG Team', status: 'pg_team', position: 1, color: '#8B5CF6', description: 'Caption creation and content enhancement' },
    { label: 'QA Team', status: 'qa', position: 2, color: '#F59E0B', description: 'Quality assurance and final approval' },
    { label: 'Deploy', status: 'deploy', position: 3, color: '#10B981', description: 'Content published' }
  ],
  'poll': [
    { label: 'Wall Post Team', status: 'wall_post', position: 0, color: '#3B82F6', description: 'Content sourcing and initial processing' },
    { label: 'PG Team', status: 'pg_team', position: 1, color: '#8B5CF6', description: 'Caption creation and content enhancement' },
    { label: 'QA Team', status: 'qa', position: 2, color: '#F59E0B', description: 'Quality assurance and final approval' },
    { label: 'Deploy', status: 'deploy', position: 3, color: '#10B981', description: 'Content published' }
  ],
  // PPV/Bundle Posts Workflow: Wall Post → PG → Flyer → QA → Deploy
  'ppv': [
    { label: 'Wall Post Team', status: 'wall_post', position: 0, color: '#3B82F6', description: 'Poll analysis and PPV setup' },
    { label: 'PG Team', status: 'pg_team', position: 1, color: '#8B5CF6', description: 'Content linking and captions' },
    { label: 'Flyer Team', status: 'flyer_team', position: 2, color: '#EC4899', description: 'Promotional graphics with pricing' },
    { label: 'QA Team', status: 'qa', position: 3, color: '#F59E0B', description: 'Content & pricing review' },
    { label: 'Deploy', status: 'deploy', position: 4, color: '#10B981', description: 'PPV publication' }
  ],
  // Game Posts Workflow: Flyer → PG → QA → Deploy
  'game': [
    { label: 'Flyer Team', status: 'flyer_team', position: 0, color: '#EC4899', description: 'Game setup and pricing tiers' },
    { label: 'PG Team', status: 'pg_team', position: 1, color: '#8B5CF6', description: 'Game content and instructions' },
    { label: 'QA Team', status: 'qa', position: 2, color: '#F59E0B', description: 'Functionality testing' },
    { label: 'Deploy', status: 'deploy', position: 3, color: '#10B981', description: 'Interactive publication' }
  ],
  // Livestream follows similar pattern to PPV
  'livestream': [
    { label: 'Wall Post Team', status: 'wall_post', position: 0, color: '#3B82F6', description: 'Content sourcing and initial processing' },
    { label: 'PG Team', status: 'pg_team', position: 1, color: '#8B5CF6', description: 'Caption creation and content enhancement' },
    { label: 'Flyer Team', status: 'flyer_team', position: 2, color: '#EC4899', description: 'Visual design and promotional materials' },
    { label: 'QA Team', status: 'qa', position: 3, color: '#F59E0B', description: 'Quality assurance and final approval' },
    { label: 'Deploy', status: 'deploy', position: 4, color: '#10B981', description: 'Content published' }
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

// Function to send notifications for modular workflows with enhanced team support
async function sendModularWorkflowNotifications({
  workflow,
  task,
  taskDescription,
  submissionType,
  modelName,
  primaryTeam,
  additionalTeams = [],
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
  primaryTeam: { id: string; name: string };
  additionalTeams?: { id: string; name: string }[];
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

    // Collect all teams to notify (primary + additional)
    const allTeams = [primaryTeam, ...additionalTeams];
    const allTeamIds = allTeams.map(t => t.id);

    console.log('🔍 Notifying teams:', allTeams.map(t => t.name).join(', '));

    // Find members assigned to all teams
    const teamMembers = await (prisma as any).podTeamMember.findMany({
      where: {
        podTeamId: { in: allTeamIds },
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
        },
        podTeam: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log('🔍 Found team members across all teams:', teamMembers.length);

    const usersToNotify = teamMembers.map((member: any) => member.user);
    console.log('🔔 Total users to notify:', usersToNotify.length);

    // Create task URL for notifications
    const taskUrl = await generateTaskUrl(task.id, primaryTeam.id);

    // Get unique users (remove duplicates if user is in multiple teams)
    const uniqueUsers = usersToNotify.filter((user, index, array) =>
      array.findIndex(u => u.id === user.id) === index
    );

    // Send in-app notifications
    const notificationPromises = uniqueUsers.map(async (user) => {
      // Find which teams this user belongs to for this workflow
      const userTeams = teamMembers
        .filter(member => member.user.id === user.id)
        .map(member => member.podTeam);

      const isPrimaryTeam = userTeams.some(team => team.id === primaryTeam.id);
      const teamNames = userTeams.map(team => team.name).join(', ');

      // Create enhanced notification message
      const notificationTitle = `${isPrimaryTeam ? 'Primary' : 'Collaborative'} ${contentStyle.toUpperCase()} ${submissionType.toUpperCase()} Workflow`;
      const notificationMessage = `A new modular workflow for ${modelName} has been created with ${selectedComponents.length} components: ${selectedComponents.join(', ')}. ${isPrimaryTeam ? 'You are the primary assignee.' : 'You are part of the collaborative team.'}`;

      // Create in-app notification
      const notification = await (prisma as any).notification.create({
        data: {
          userId: user.id,
          type: 'TASK_ASSIGNED',
          title: notificationTitle,
          message: notificationMessage,
          isRead: false,
          data: {
            workflowId: workflow.id,
            taskId: task.id,
            taskTitle: task.title,
            taskDescription: taskDescription,
            taskUrl: taskUrl,
            primaryTeamId: primaryTeam.id,
            primaryTeamName: primaryTeam.name,
            additionalTeams: additionalTeams.map(t => ({ id: t.id, name: t.name })),
            userTeams: userTeams,
            isPrimaryAssignee: isPrimaryTeam,
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
          podTeamId: primaryTeam.id
        }
      });

      // Publish real-time notification via Redis
      await publishNotification({
        id: notification.id,
        type: 'TASK_ASSIGNED',
        title: notificationTitle,
        message: notificationMessage,
        userId: user.id,
        teamId: primaryTeam.id,
        timestamp: Date.now(),
        data: {
          workflowId: workflow.id,
          taskId: task.id,
          taskTitle: task.title,
          taskDescription: taskDescription,
          taskUrl: taskUrl,
          primaryTeamId: primaryTeam.id,
          primaryTeamName: primaryTeam.name,
          additionalTeams: additionalTeams.map(t => ({ id: t.id, name: t.name })),
          userTeams: userTeams,
          isPrimaryAssignee: isPrimaryTeam,
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

    // Send email notifications with enhanced team context
    const emailPromises = uniqueUsers.map(async (user) => {
      // Find which teams this user belongs to for this workflow
      const userTeams = teamMembers
        .filter(member => member.user.id === user.id)
        .map(member => member.podTeam);

      const isPrimaryTeam = userTeams.some(team => team.id === primaryTeam.id);
      const teamNames = userTeams.map(team => team.name).join(', ');

      const enhancedDescription = `${taskDescription}\n\nWorkflow Type: ${contentStyle.toUpperCase()}\nComponents: ${selectedComponents.join(', ')}\n\nTeam Assignment: ${isPrimaryTeam ? 'Primary Assignee' : 'Collaborative Team'}\nYour Teams: ${teamNames}`;

      return sendOTPPTRTaskNotificationEmail({
        to: user.email,
        userName: user.name || user.email.split('@')[0],
        taskTitle: task.title,
        taskDescription: enhancedDescription,
        submissionType: submissionType,
        modelName: modelName,
        priority: task.priority,
        teamName: primaryTeam.name,
        taskUrl: taskUrl,
        createdByName: createdByName,
        reason: `Modular Workflow ${isPrimaryTeam ? 'Primary' : 'Collaborative'} Assignment`
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
      totalUsers: uniqueUsers.length,
      teamsNotified: allTeams.map(t => t.name),
      primaryTeam: primaryTeam.name,
      additionalTeams: additionalTeams.map(t => t.name)
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

    // Determine primary team from manual assignments or fallback
    let primaryTeamId = data.teamAssignments?.primaryTeamId || data.teamId;

    // Find the primary team
    let assignedTeam;
    if (primaryTeamId) {
      assignedTeam = await prisma.podTeam.findUnique({
        where: { id: primaryTeamId }
      });
      if (!assignedTeam) {
        throw new Error(`Primary team with ID ${primaryTeamId} not found`);
      }
    } else {
      // Fallback to finding team by name or create one
      assignedTeam = await findOrCreateWorkflowTeam('Default Team');
      primaryTeamId = assignedTeam.id;
    }

    // Validate additional teams if provided
    let additionalTeams: any[] = [];
    if (data.teamAssignments?.additionalTeamIds?.length) {
      additionalTeams = await prisma.podTeam.findMany({
        where: {
          id: { in: data.teamAssignments.additionalTeamIds },
          isActive: true
        }
      });

      if (additionalTeams.length !== data.teamAssignments.additionalTeamIds.length) {
        const foundIds = additionalTeams.map(t => t.id);
        const missingIds = data.teamAssignments.additionalTeamIds.filter(id => !foundIds.includes(id));
        throw new Error(`Additional teams not found: ${missingIds.join(', ')}`);
      }
    }

    // Create workflow columns in database for this team
    await createWorkflowColumns(assignedTeam.id, data.contentStyle);

    console.log('✅ Primary team for workflow:', assignedTeam.name);
    if (additionalTeams.length > 0) {
      console.log('✅ Additional teams:', additionalTeams.map(t => t.name).join(', '));
    }

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
          primaryTeamId: assignedTeam.id,
          additionalTeamIds: data.teamAssignments?.additionalTeamIds || [],
          assignmentMethod: data.teamAssignments?.assignmentMethod || 'automatic',
          assignedAt: data.teamAssignments?.assignedAt || new Date().toISOString(),
          // Legacy fields for backward compatibility
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

    // Send notifications to team members with enhanced team support
    await sendModularWorkflowNotifications({
      workflow: updatedWorkflow,
      task,
      taskDescription,
      submissionType: data.submissionType,
      modelName: data.modelName,
      primaryTeam: { id: assignedTeam.id, name: assignedTeam.name },
      additionalTeams: additionalTeams.map(team => ({ id: team.id, name: team.name })),
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