import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    // Use a raw query to get sheet links for the team's assigned clients
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
      WHERE ptca."podTeamId" = ${teamId}
        AND ptca."isActive" = true
      ORDER BY cmsl."createdAt" DESC
    `;

    // Transform the raw results
    const transformedSheetLinks = (sheetLinksRaw as any[]).map(link => ({
      id: link.id,
      name: link.sheetName || link.clientName,
      url: link.sheetUrl,
      clientName: link.clientName,
      sheetType: link.sheetType,
      createdAt: link.createdAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      sheetLinks: transformedSheetLinks
    });

  } catch (error) {
    console.error("Error fetching sheet links:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
