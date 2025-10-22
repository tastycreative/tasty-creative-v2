import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = await params;

    // Fetch team members
    const teamMembers = await prisma.podTeamMember.findMany({
      where: {
        podTeamId: teamId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
    });

    // Fetch global admins (exclude those already in team)
    const teamMemberUserIds = teamMembers.map(member => member.user.id);
    const globalAdmins = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        id: {
          notIn: teamMemberUserIds,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });

    // Transform team members data
    const members = teamMembers.map(member => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      image: member.user.image,
      role: member.role,
      isTeamMember: true,
      isGlobalAdmin: member.user.role === 'ADMIN',
    }));

    // Transform global admins data
    const admins = globalAdmins.map(admin => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      image: admin.image,
      role: 'ADMIN' as const,
      isTeamMember: false,
      isGlobalAdmin: true,
    }));

    return NextResponse.json({
      success: true,
      members,
      admins,
    });

  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

// POST - Add member to team
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR') {
      return NextResponse.json({ error: 'Admin or Moderator role required' }, { status: 403 });
    }

    const { teamId } = await params;
    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      );
    }

    // Verify team exists
    const team = await prisma.podTeam.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is already a team member
    const existingMember = await prisma.podTeamMember.findFirst({
      where: {
        podTeamId: teamId,
        userId: userId
      }
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a team member' },
        { status: 409 }
      );
    }

    // Add user to team
    const teamMember = await prisma.podTeamMember.create({
      data: {
        podTeamId: teamId,
        userId: userId,
        role: role
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          }
        }
      }
    });

    // Fetch updated team with all members
    const updatedTeam = await prisma.podTeam.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      member: {
        id: teamMember.id,
        userId: teamMember.user.id,
        name: teamMember.user.name,
        email: teamMember.user.email,
        image: teamMember.user.image,
        role: teamMember.role
      },
      members: updatedTeam?.members.map(member => ({
        id: member.id,
        userId: member.user.id,
        name: member.user.name,
        email: member.user.email,
        image: member.user.image,
        role: member.role
      })) || []
    });

  } catch (error) {
    console.error('Error adding team member:', error);
    return NextResponse.json(
      { error: 'Failed to add team member' },
      { status: 500 }
    );
  }
}

// DELETE - Remove member from team
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR') {
      return NextResponse.json({ error: 'Admin or Moderator role required' }, { status: 403 });
    }

    const { teamId } = await params;
    const body = await req.json();
    const { memberId } = body;

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    // Verify team exists
    const team = await prisma.podTeam.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Find the team member
    const teamMember = await prisma.podTeamMember.findFirst({
      where: {
        id: memberId,
        podTeamId: teamId
      }
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // Prevent users from removing themselves (optional safety check)
    if (teamMember.userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot remove yourself from the team' },
        { status: 400 }
      );
    }

    // Remove member from team
    await prisma.podTeamMember.delete({
      where: {
        id: memberId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Team member removed successfully'
    });

  } catch (error) {
    console.error('Error removing team member:', error);
    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 }
    );
  }
}
