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
