import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { teamId, members } = await request.json();

    if (!teamId || !Array.isArray(members)) {
      return NextResponse.json(
        { error: 'Team ID and members array are required' },
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

    // Update team members using the relational schema
    // First, remove all existing members for this team
    await prisma.podTeamMember.deleteMany({
      where: { podTeamId: teamId }
    });

    // Then add the new members
    const memberPromises = members.map(async (member) => {
      console.log('🔍 API - Processing member:', member);
      
      // Find the user by ID first (most reliable), then by email, then by name
      let user = null;
      
      // Try to find by ID first if available
      if (member.id) {
        user = await prisma.user.findUnique({
          where: { id: member.id }
        });
        console.log('🔍 API - Found user by ID:', user ? { id: user.id, email: user.email, name: user.name } : null);
      }
      
      // If not found by ID, try by email
      if (!user && member.email) {
        user = await prisma.user.findFirst({
          where: { email: member.email }
        });
        console.log('🔍 API - Found user by email:', user ? { id: user.id, email: user.email, name: user.name } : null);
      }
      
      // If still not found, try by name as fallback
      if (!user && member.name) {
        user = await prisma.user.findFirst({
          where: { name: member.name }
        });
        console.log('🔍 API - Found user by name:', user ? { id: user.id, email: user.email, name: user.name } : null);
      }

      if (user) {
        console.log('🔍 API - Successfully found user:', { id: user.id, email: user.email, name: user.name });
        
        // Map role string to enum value
        let roleEnum = 'MEMBER';
        if (member.role) {
          const roleUpper = member.role.toUpperCase();
          if (['LEADER', 'MEMBER', 'ADMIN'].includes(roleUpper)) {
            roleEnum = roleUpper;
          }
        }

        return prisma.podTeamMember.create({
          data: {
            podTeamId: teamId,
            userId: user.id,
            role: roleEnum as any
          }
        });
      } else {
        console.error('🔍 API - User not found for member:', member);
        return null;
      }
    });

    const createdMembers = await Promise.all(memberPromises);
    const validMembers = createdMembers.filter(Boolean);

    console.log(`Updated team members for team ${teamId}: ${validMembers.length} members`);

    return NextResponse.json({
      success: true,
      message: 'Team members updated successfully',
      updatedData: {
        teamId,
        membersCount: validMembers.length,
        members: validMembers
      }
    });

  } catch (error) {
    console.error('Error updating team members in database:', error);
    return NextResponse.json(
      { error: 'Failed to update team members in database' },
      { status: 500 }
    );
  }
}