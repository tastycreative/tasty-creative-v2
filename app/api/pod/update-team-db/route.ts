import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { teamId, newTeamName, newCreators } = await request.json();

    if (!teamId || (!newTeamName && newCreators === undefined)) {
      return NextResponse.json(
        { error: 'Team ID and at least one update field (team name or creators) are required' },
        { status: 400 }
      );
    }

    // Verify team exists
    const existingTeam = await prisma.podTeam.findUnique({
      where: { id: teamId }
    });

    if (!existingTeam) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };
    let message = '';
    let updatedData: any = {};

    // Update team name if provided
    if (newTeamName) {
      updateData.name = newTeamName;
      updatedData.teamName = newTeamName;
      message += 'Team name updated. ';
    }

    // Update team in database
    const updatedTeam = await prisma.podTeam.update({
      where: { id: teamId },
      data: updateData
    });

    console.log(`Updated team data for team ${teamId}:`, updatedData);

    return NextResponse.json({
      success: true,
      message: message.trim() || 'Team updated successfully',
      updatedData,
      teamId,
      team: updatedTeam
    });

  } catch (error) {
    console.error('Error updating team in database:', error);
    return NextResponse.json(
      { error: 'Failed to update team in database' },
      { status: 500 }
    );
  }
}