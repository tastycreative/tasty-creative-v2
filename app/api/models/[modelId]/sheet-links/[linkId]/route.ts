import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string; linkId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin or moderator
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR') {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { linkId } = await params;
    
    if (!linkId) {
      return NextResponse.json(
        { error: "Link ID is required" },
        { status: 400 }
      );
    }

    // Delete the sheet link
    await prisma.clientModelSheetLinks.delete({
      where: {
        id: linkId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting sheet link:", error);
    return NextResponse.json(
      { error: "Failed to delete sheet link" },
      { status: 500 }
    );
  }
}
