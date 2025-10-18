import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
        id: rowId.toString(), // Using ID directly now instead of row_id
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
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
                    createdAt: true,
                  },
                },
              },
            },
            assignedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!podTeam) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Transform team members from relational data
    const teamMembers = podTeam.members.map((member) => ({
      id: member.id,
      name: member.user.name || member.user.email?.split("@")[0] || "Unknown",
      email: member.user.email || "",
      role: member.role,
      joinedAt: member.joinedAt.toISOString(),
      userId: member.user.id,
      image: member.user.image,
    }));

    // Transform assigned creators from relational data
    const creators = podTeam.assignedClients.map((assignment) => ({
      id: assignment.clientModel.id,
      name: assignment.clientModel.clientName,
      rowNumber: assignment.clientModel.row_id
        ? parseInt(assignment.clientModel.row_id)
        : null,
      row_id: assignment.clientModel.row_id,
      guaranteed: assignment.clientModel.guaranteed,
      assignedAt: assignment.assignedAt.toISOString(),
      assignedBy: assignment.assignedBy,
      isActive: assignment.isActive,
      notes: assignment.notes,
    }));

    // Fetch sheet links directly from database instead of internal API call
    let sheetLinks: any[] = [];
    try {
      const sheetLinksRaw = await prisma.$queryRaw`
        SELECT
          cmsl.id,
          cmsl."sheetUrl",
          cmsl."sheetName",
          cmsl."sheetType",
          cmsl."createdAt",
          cm."clientName"
        FROM "ClientModelSheetLinks" cmsl
        JOIN "ClientModel" cm ON cmsl."clientModelId" = cm.id
        JOIN "PodTeamClientAssignment" ptca ON cm.id = ptca."clientModelId"
        WHERE ptca."podTeamId" = ${podTeam.id}
          AND ptca."isActive" = true
        ORDER BY cmsl."createdAt" DESC
      `;

      // Transform the raw results
      sheetLinks = (sheetLinksRaw as any[]).map(link => ({
        id: link.id,
        name: link.sheetName || link.clientName,
        url: link.sheetUrl,
        clientName: link.clientName,
        sheetType: link.sheetType,
        createdAt: link.createdAt.toISOString()
      }));
    } catch (error) {
      console.error("Error fetching sheet links:", error);
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
        createdBy: podTeam.createdBy,
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
