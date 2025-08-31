import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { rowId } = await request.json();

    if (!rowId) {
      return NextResponse.json(
        { error: "Row ID is required" },
        { status: 400 }
      );
    }

    // Fetch specific pod team from database
    const podTeam = await prisma.podTeam.findUnique({
      where: {
        row_id: rowId.toString()
      },
      include: {
        podTeamSheets: true
      }
    });

    if (!podTeam) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Parse team members from comma-separated string
    const membersString = podTeam.team_members || '';
    const teamMembers = membersString
      .split(',')
      .map((memberStr: string, index: number) => {
        const trimmed = memberStr.trim();
        
        // Check if the member string contains " - " to separate email and role
        if (trimmed.includes(' - ')) {
          const [email, role] = trimmed.split(' - ');
          return {
            id: `${podTeam.id}-${index}`,
            name: email.split('@')[0] || email, // Use part before @ as name
            email: email.trim(),
            role: role.trim(),
          };
        } else {
          // Fallback for format without roles
          return {
            id: `${podTeam.id}-${index}`,
            name: trimmed,
            email: trimmed.includes('@') ? trimmed : '',
            role: index === 0 ? 'Team Lead' : index === 1 ? 'Designer' : 'Developer',
          };
        }
      })
      .filter((member) => member.name !== '');

    // Parse creators from comma-separated string  
    const creatorsString = podTeam.creators_assigned || '';
    const creators = creatorsString
      .split(',')
      .map((name: string, index: number) => {
        const trimmedName = name.trim();
        
        return {
          id: `${podTeam.id}-creator-${index}`,
          name: trimmedName,
          rowNumber: parseInt(podTeam.row_id) // Use row_id as rowNumber
        };
      })
      .filter((creator) => creator.name !== '');

    // Transform sheet data from PodTeamSheets relation
    const sheetLinks = podTeam.podTeamSheets.map(sheet => ({
      name: sheet.spreadsheet_name || 'Unnamed Sheet',
      url: sheet.sheet_link || '',
      id: sheet.id
    }));

    // Return the parsed data in the same format as the Google Sheets API
    return NextResponse.json({
      success: true,
      data: {
        teamName: podTeam.pod_name,
        teamMembers,
        creators,
        schedulerSpreadsheetUrl: podTeam.link_to_team_sheet || '',
        sheetLinks,
        rowNumber: parseInt(podTeam.row_id),
        lastUpdated: podTeam.last_updated.toISOString(),
        status: podTeam.current_week_schedule_status || '',
        notes: podTeam.issues_notes || ''
      },
    });

  } catch (error) {
    console.error("Error fetching team from database:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}