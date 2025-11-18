import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role || Role.USER;

    // Get user's team assignments
    const userTeams = await prisma.podTeamMember.findMany({
      where: { userId },
      select: { podTeamId: true }
    });

    const teamIds = userTeams.map(t => t.podTeamId);

    // 1. QUICK STATS
    const now = new Date();

    // Active tasks (not completed or cancelled)
    const activeTasks = await prisma.task.count({
      where: {
        podTeamId: { in: teamIds.length > 0 ? teamIds : undefined },
        status: { notIn: ["COMPLETED", "CANCELLED"] }
      }
    });

    // Tasks created today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tasksCreatedToday = await prisma.task.count({
      where: {
        podTeamId: { in: teamIds.length > 0 ? teamIds : undefined },
        createdAt: { gte: todayStart }
      }
    });

    // Overdue tasks
    const overdueTasks = await prisma.task.count({
      where: {
        podTeamId: { in: teamIds.length > 0 ? teamIds : undefined },
        dueDate: { lt: now },
        status: { notIn: ["COMPLETED", "CANCELLED"] }
      }
    });

    // Model stats (global)
    const [activeModels, totalModels] = await Promise.all([
      prisma.clientModel.count({
        where: { status: "active" }
      }),
      prisma.clientModel.count()
    ]);

    // Calculate total revenue manually since 'guaranteed' is a string field
    const allActiveModels = await prisma.clientModel.findMany({
      where: { status: "active" },
      select: { guaranteed: true }
    });

    const totalRevenue = allActiveModels.reduce((sum, model) => {
      if (!model.guaranteed || model.guaranteed.trim() === "" || model.guaranteed.trim() === "-") {
        return sum;
      }
      const cleanValue = model.guaranteed.replace(/[^0-9.-]/g, "");
      const guaranteed = parseFloat(cleanValue);
      if (!isNaN(guaranteed) && guaranteed > 0) {
        return sum + guaranteed;
      }
      return sum;
    }, 0);

    const quickStats = {
      activeTasks,
      tasksCreatedToday,
      overdueTasks,
      activeModels,
      totalModels,
      totalRevenue
    };

    // 2. TASK PIPELINE
    const tasksByStatus = await prisma.task.groupBy({
      by: ['status'],
      where: {
        podTeamId: { in: teamIds.length > 0 ? teamIds : undefined }
      },
      _count: true
    });

    const tasksByPriority = await prisma.task.groupBy({
      by: ['priority'],
      where: {
        podTeamId: { in: teamIds.length > 0 ? teamIds : undefined },
        status: { notIn: ["COMPLETED", "CANCELLED"] }
      },
      _count: true
    });

    const unassignedCount = await prisma.task.count({
      where: {
        podTeamId: { in: teamIds.length > 0 ? teamIds : undefined },
        assignedTo: null,
        status: { notIn: ["COMPLETED", "CANCELLED"] }
      }
    });

    // Get column colors for status visualization
    const columns = teamIds.length > 0 ? await prisma.boardColumn.findMany({
      where: { podTeamId: { in: teamIds } },
      select: { status: true, color: true, label: true }
    }) : [];

    const columnColorMap = columns.reduce((acc, col) => {
      acc[col.status] = { color: col.color, label: col.label };
      return acc;
    }, {} as Record<string, { color: string; label: string }>);

    const taskPipeline = {
      byStatus: tasksByStatus.map(item => ({
        status: item.status,
        count: item._count,
        label: columnColorMap[item.status]?.label || item.status,
        color: columnColorMap[item.status]?.color || '#6B7280'
      })),
      byPriority: tasksByPriority.map(item => ({
        priority: item.priority,
        count: item._count
      })),
      unassignedCount
    };

    // 3. CONTENT PRODUCTION
    const [otpCount, ptrCount, styleDistribution, recentSubmissions] = await Promise.all([
      prisma.modularWorkflow.count({
        where: { submissionType: "OTP" }
      }),
      prisma.modularWorkflow.count({
        where: { submissionType: "PTR" }
      }),
      prisma.modularWorkflow.groupBy({
        by: ['contentStyle'],
        _count: true
      }),
      prisma.modularWorkflow.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          modelName: true,
          submissionType: true,
          contentStyle: true,
          createdAt: true,
          task: {
            select: {
              id: true,
              title: true,
              status: true
            }
          }
        }
      })
    ]);

    const contentProduction = {
      otpCount,
      ptrCount,
      styleDistribution: styleDistribution
        .filter(item => item.contentStyle !== null)
        .map(item => ({
          style: item.contentStyle || 'UNKNOWN',
          count: item._count
        })),
      recentSubmissions: recentSubmissions.map(sub => ({
        id: sub.id,
        modelName: sub.modelName,
        type: sub.submissionType,
        style: sub.contentStyle,
        createdAt: sub.createdAt,
        taskId: sub.task?.id,
        taskTitle: sub.task?.title,
        taskStatus: sub.task?.status
      }))
    };

    // 4. TEAM PERFORMANCE
    const teams = teamIds.length > 0 ? await prisma.podTeam.findMany({
      where: {
        id: { in: teamIds },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            members: true,
            tasks: {
              where: {
                status: { notIn: ["COMPLETED", "CANCELLED"] }
              }
            }
          }
        }
      }
    }) : [];

    const activeTeamsCount = await prisma.podTeam.count({
      where: { isActive: true }
    });

    const totalMembersCount = await prisma.podTeamMember.count();

    // Top contributors (users who created most tasks this week)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const topContributorsData = await prisma.task.groupBy({
      by: ['createdById'],
      where: {
        podTeamId: { in: teamIds.length > 0 ? teamIds : undefined },
        createdAt: { gte: weekAgo }
      },
      _count: true,
      orderBy: {
        _count: {
          createdById: 'desc'
        }
      },
      take: 10 // Get more to filter out nulls
    });

    // Get user details for top contributors (filter out nulls and take top 5)
    const topContributorIds = topContributorsData
      .map(t => t.createdById)
      .filter(id => id !== null)
      .slice(0, 5) as string[];

    const contributorUsers = await prisma.user.findMany({
      where: { id: { in: topContributorIds } },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    });

    const userMap = contributorUsers.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<string, typeof contributorUsers[0]>);

    const topContributors = topContributorsData
      .map(item => ({
        userId: item.createdById!,
        name: userMap[item.createdById!]?.name || 'Unknown',
        email: userMap[item.createdById!]?.email || '',
        image: userMap[item.createdById!]?.image || null,
        taskCount: item._count
      }))
      .filter(c => c.userId);

    const teamPerformance = {
      teamWorkload: teams.map(team => ({
        podTeamId: team.id,
        teamName: team.name,
        taskCount: team._count.tasks,
        memberCount: team._count.members,
        tasksPerMember: team._count.members > 0
          ? Number((team._count.tasks / team._count.members).toFixed(1))
          : 0
      })),
      topContributors,
      activeTeams: activeTeamsCount,
      totalMembers: totalMembersCount
    };

    // 5. ROLE-SPECIFIC DATA
    let roleSpecific: any = {};

    if (userRole === Role.ADMIN) {
      // Admin: User stats, strikes, recent activity
      const [totalUsers, recentSignups, activeStrikes, unverifiedUsers] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: {
            createdAt: { gte: weekAgo }
          }
        }),
        prisma.strike.count({
          where: { isActive: true }
        }),
        prisma.user.count({
          where: {
            emailVerified: null
          }
        })
      ]);

      roleSpecific = {
        type: 'admin',
        totalUsers,
        recentSignups,
        activeStrikes,
        unverifiedUsers
      };
    } else if (userRole === Role.MODERATOR) {
      // Manager: Team-specific stats
      const myTeamTasks = await prisma.task.groupBy({
        by: ['status'],
        where: {
          podTeamId: { in: teamIds }
        },
        _count: true
      });

      const completedCount = myTeamTasks.find(t => t.status === 'COMPLETED')?._count || 0;
      const totalCount = myTeamTasks.reduce((sum, t) => sum + t._count, 0);
      const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      roleSpecific = {
        type: 'manager',
        myTeamTasksByStatus: myTeamTasks.map(t => ({
          status: t.status,
          count: t._count
        })),
        completionRate
      };
    } else {
      // Regular user: Personal stats
      const myTasks = await prisma.task.groupBy({
        by: ['status'],
        where: {
          assignedTo: userId
        },
        _count: true
      });

      const unreadNotifications = await prisma.notification.count({
        where: {
          userId,
          read: false
        }
      });

      roleSpecific = {
        type: 'user',
        myTasksByStatus: myTasks.map(t => ({
          status: t.status,
          count: t._count
        })),
        unreadNotifications
      };
    }

    // Return aggregated dashboard metrics
    return NextResponse.json({
      quickStats,
      taskPipeline,
      contentProduction,
      teamPerformance,
      roleSpecific
    });

  } catch (error) {
    console.error("Dashboard metrics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard metrics" },
      { status: 500 }
    );
  }
}
