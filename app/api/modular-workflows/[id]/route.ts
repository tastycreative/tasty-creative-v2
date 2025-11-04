import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/modular-workflows/[id] - Update workflow pricing fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { caption, pricing, basePriceDescription, gifUrl, notes, isFinal, contentTags } = body;

    // Update the workflow
    const workflow = await prisma.modularWorkflow.update({
      where: { id },
      data: {
        caption: caption ?? undefined,
        pricing: pricing ?? undefined,
        basePriceDescription: basePriceDescription ?? undefined,
        gifUrl: gifUrl ?? undefined,
        notes: notes ?? undefined,
        isFinal: isFinal !== undefined ? isFinal : undefined,
        contentTags: contentTags ?? undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("Error updating workflow:", error);
    return NextResponse.json(
      {
        error: "Failed to update workflow",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
