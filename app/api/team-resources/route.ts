import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET all resources for a team
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
    }

    const resources = await prisma.teamResource.findMany({
      where: { podTeamId: teamId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(resources);
  } catch (error) {
    console.error("Error fetching team resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}

// POST create a new resource
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { teamId, name, link } = body;

    if (!teamId || !name || !link) {
      return NextResponse.json(
        { error: "Team ID, name, and link are required" },
        { status: 400 }
      );
    }

    const resource = await prisma.teamResource.create({
      data: {
        podTeamId: teamId,
        name,
        link,
      },
    });

    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    console.error("Error creating team resource:", error);
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 }
    );
  }
}
