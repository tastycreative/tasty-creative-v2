import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Only allow users to fetch their own assignments (unless admin/moderator)
    if (session.user.id !== userId && session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Find all pod teams the user is a member of
    const userTeamMemberships = await prisma.podTeamMember.findMany({
      where: {
        userId: userId,
      },
      include: {
        podTeam: {
          include: {
            assignedClients: {
              where: {
                isActive: true, // Only active assignments
              },
              include: {
                clientModel: true,
              },
            },
          },
        },
      },
    });

    // Extract all assigned client model names
    const assignedCreators: string[] = [];
    
    userTeamMemberships.forEach(membership => {
      membership.podTeam.assignedClients.forEach(assignment => {
        if (assignment.clientModel.clientName) {
          assignedCreators.push(assignment.clientModel.clientName);
        }
      });
    });

    // Remove duplicates
    const uniqueAssignedCreators = [...new Set(assignedCreators)];

    return NextResponse.json({
      assignedCreators: uniqueAssignedCreators,
      teamCount: userTeamMemberships.length,
    });

  } catch (error) {
    console.error('Error fetching user assigned creators:', error);
    return NextResponse.json(
      { error: "Failed to fetch user assigned creators" },
      { status: 500 }
    );
  }
}