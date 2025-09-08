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
        id: rowId.toString() // Using ID directly now instead of row_id
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        assignedClients: {
          include: {
            clientModel: {
              select: {
                id: true,
                clientName: true,
                row_id: true,
                guaranteed: true,
                sheetLinks: {
                  select: {
                    id: true,
                    sheetUrl: true,
                    sheetName: true,
                    sheetType: true,
                    createdAt: true
                  }
                }
              }
            },
            assignedBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!podTeam) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Transform team members from relational data
    const teamMembers = podTeam.members.map((member) => ({
      id: member.id,
      name: member.user.name || member.user.email?.split('@')[0] || 'Unknown',
      email: member.user.email || '',
      role: member.role,
      joinedAt: member.joinedAt.toISOString(),
      userId: member.user.id,
      image: member.user.image
    }));

    // Transform assigned creators from relational data
    const creators = podTeam.assignedClients.map((assignment) => ({
      id: assignment.clientModel.id,
      name: assignment.clientModel.clientName,
      rowNumber: assignment.clientModel.row_id ? parseInt(assignment.clientModel.row_id) : null,
      row_id: assignment.clientModel.row_id,
      guaranteed: assignment.clientModel.guaranteed,
      assignedAt: assignment.assignedAt.toISOString(),
      assignedBy: assignment.assignedBy,
      isActive: assignment.isActive,
      notes: assignment.notes
    }));

    // Transform sheet links from ClientModelSheetLinks data
    // Fetch sheet links from the new API endpoint
    let sheetLinks: any[] = [];
    try {
      const sheetLinksResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/pod/sheet-links?teamId=${podTeam.id}`, {
        method: 'GET',
        headers: {
          'Cookie': request.headers.get('Cookie') || ''
        }
      });
      if (sheetLinksResponse.ok) {
        const sheetLinksResult = await sheetLinksResponse.json();
        if (sheetLinksResult.success) {
          sheetLinks = sheetLinksResult.sheetLinks;
        }
      }
    } catch (error) {
      console.error('Error fetching sheet links:', error);
      // Continue without sheet links rather than failing
    }

    // Return the parsed data with the new relational structure
    return NextResponse.json({
      success: true,
      data: {
        id: podTeam.id,
        teamName: podTeam.name,
        description: podTeam.description,
        teamMembers,
        creators,
        sheetLinks,
        isActive: podTeam.isActive,
        createdAt: podTeam.createdAt.toISOString(),
        lastUpdated: podTeam.updatedAt.toISOString(),
        createdBy: podTeam.createdBy
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