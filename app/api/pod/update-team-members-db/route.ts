import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { rowId, members } = await request.json();

    if (!rowId || !Array.isArray(members)) {
      return NextResponse.json(
        { error: 'Row ID and members array are required' },
        { status: 400 }
      );
    }

    // Convert members array to comma-separated string
    // members should be an array of objects with name and role properties
    const membersString = members
      .map(member => member.name && member.role ? `${member.name} - ${member.role}` : member.name)
      .filter(memberStr => memberStr && memberStr.trim())
      .join(', ');

    // Update team members in database
    const updatedTeam = await prisma.podTeam.update({
      where: {
        row_id: rowId
      },
      data: {
        team_members: membersString,
        last_updated: new Date()
      }
    });

    console.log(`Updated team members for row_id ${rowId}: ${membersString}`);

    return NextResponse.json({
      success: true,
      message: 'Team members updated successfully',
      updatedData: {
        members: membersString,
        rowId,
        team: updatedTeam
      }
    });

  } catch (error) {
    console.error('Error updating team members in database:', error);
    return NextResponse.json(
      { error: 'Failed to update team members in database' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}