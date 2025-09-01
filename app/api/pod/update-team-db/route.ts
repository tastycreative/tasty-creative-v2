import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { rowId, newTeamName, newSheetUrl, newCreators } = await request.json();

    if (!rowId || (!newTeamName && !newSheetUrl && newCreators === undefined)) {
      return NextResponse.json(
        { error: 'Row ID and at least one update field (team name, sheet URL, or creators) are required' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      last_updated: new Date()
    };
    let message = '';
    let updatedData: any = {};

    // Update team name if provided
    if (newTeamName) {
      updateData.pod_name = newTeamName;
      updatedData.teamName = newTeamName;
      message += 'Team name updated. ';
    }

    // Update sheet URL if provided
    if (newSheetUrl) {
      updateData.link_to_team_sheet = newSheetUrl;
      updatedData.sheetUrl = newSheetUrl;
      message += 'Sheet URL updated. ';
    }

    // Update creators if provided
    if (newCreators !== undefined) {
      const creatorsString = Array.isArray(newCreators) ? newCreators.join(', ') : newCreators;
      updateData.creators_assigned = creatorsString;
      updatedData.creators = newCreators;
      message += 'Creators updated. ';
    }

    // Update team in database
    const updatedTeam = await prisma.podTeam.update({
      where: {
        row_id: rowId
      },
      data: updateData
    });

    console.log(`Updated team data for row_id ${rowId}:`, updatedData);

    return NextResponse.json({
      success: true,
      message: message.trim() || 'Team updated successfully',
      updatedData,
      rowId,
      team: updatedTeam
    });

  } catch (error) {
    console.error('Error updating team in database:', error);
    return NextResponse.json(
      { error: 'Failed to update team in database' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}