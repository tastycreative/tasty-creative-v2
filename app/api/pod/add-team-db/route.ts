import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { teamName, sheetUrl, rowNumber, creators } = await request.json();

    if (!teamName || !sheetUrl || !rowNumber) {
      return NextResponse.json(
        { error: 'Team name, sheet URL, and row number are required' },
        { status: 400 }
      );
    }

    // Validate Google Sheets URL format for the team sheet
    const isValidGoogleSheetsUrl = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+/.test(sheetUrl);
    if (!isValidGoogleSheetsUrl) {
      return NextResponse.json(
        { error: 'Invalid Google Sheets URL format for team sheet' },
        { status: 400 }
      );
    }

    // Create the new team in the database
    const creatorsString = Array.isArray(creators) ? creators.join(', ') : '';
    
    const newTeam = await prisma.podTeam.create({
      data: {
        row_id: rowNumber.toString(),
        pod_name: teamName.trim(),
        link_to_team_sheet: sheetUrl.trim(),
        team_members: '', // Initialize empty members
        creators_assigned: creatorsString,
        current_week_schedule_status: null,
        issues_notes: null
      }
    });

    console.log(`Added new team "${teamName}" with row_id ${rowNumber}`);

    return NextResponse.json({
      success: true,
      message: 'Team added successfully',
      data: {
        teamName: teamName.trim(),
        sheetUrl: sheetUrl.trim(),
        rowNumber,
        creators: creatorsString,
        team: newTeam
      }
    });

  } catch (error) {
    console.error('Error adding team to database:', error);
    
    // Handle unique constraint errors (if team with same row_id already exists)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { 
          error: 'Team with this row number already exists',
          message: 'A team with this row number already exists. Please choose a different row number.'
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to add team to database' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}