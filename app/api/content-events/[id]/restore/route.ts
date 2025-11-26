import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Restore a soft-deleted event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    // Restore by clearing deletedAt timestamp
    const event = await prisma.contentEvent.update({
      where: { id },
      data: {
        deletedAt: null,
      },
      include: {
        creator: {
          select: {
            clientName: true,
            profilePicture: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, event }, { status: 200 });
  } catch (error) {
    console.error("Error restoring content event:", error);
    return NextResponse.json(
      { error: "Failed to restore content event" },
      { status: 500 }
    );
  }
}
