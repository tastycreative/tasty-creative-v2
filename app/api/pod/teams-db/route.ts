import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch all pod teams from database
    const podTeams = await prisma.podTeam.findMany({
      include: {
        podTeamSheets: true
      },
      orderBy: {
        row_id: 'asc'
      }
    });

    // Transform the data to match the expected format
    const teams = podTeams.map((team) => {
      // Parse team members from comma-separated string
      const membersString = team.team_members || '';
      const members = membersString
        .split(',')
        .map((memberStr: string, index: number) => {
          const trimmed = memberStr.trim();
          
          // Check if the member string contains " - " to separate email and role
          if (trimmed.includes(' - ')) {
            const [email, role] = trimmed.split(' - ');
            return {
              id: `${team.id}-${index}`,
              name: email.split('@')[0] || email, // Use part before @ as name
              email: email.trim(),
              role: role.trim(),
            };
          } else {
            // Fallback for format without roles
            return {
              id: `${team.id}-${index}`,
              name: trimmed,
              email: trimmed.includes('@') ? trimmed : '',
              role: index === 0 ? 'Team Lead' : index === 1 ? 'Designer' : 'Developer',
            };
          }
        })
        .filter((member) => member.name !== '');

      // Parse creators from comma-separated string
      const creatorsString = team.creators_assigned || '';
      const creators = creatorsString
        .split(',')
        .map((name: string, index: number) => {
          const trimmedName = name.trim();
          
          return {
            id: `${team.id}-creator-${index}`,
            name: trimmedName,
            rowNumber: parseInt(team.row_id) // Use row_id as rowNumber
          };
        })
        .filter((creator) => creator.name !== '');

      return {
        row: parseInt(team.row_id),
        name: team.pod_name,
        label: team.pod_name || `Team ${team.row_id}`,
        sheetUrl: team.link_to_team_sheet || '',
        members: members,
        creators: creators,
        status: team.current_week_schedule_status || '',
        notes: team.issues_notes || '',
        sheets: team.podTeamSheets.map(sheet => ({
          id: sheet.id,
          name: sheet.spreadsheet_name || 'Unnamed Sheet',
          url: sheet.sheet_link || '',
          lastModified: team.last_updated.toISOString()
        }))
      };
    });

    return NextResponse.json({
      success: true,
      teams: teams
    });

  } catch (error) {
    console.error('Error fetching teams from database:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams from database' },
      { status: 500 }
    );
  }
}