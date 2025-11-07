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

    console.log('Updating workflow with contentTags:', contentTags);

    // Build update data object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (caption !== undefined) updateData.caption = caption;
    if (pricing !== undefined) updateData.pricing = pricing;
    if (basePriceDescription !== undefined) updateData.basePriceDescription = basePriceDescription;
    if (gifUrl !== undefined) updateData.gifUrl = gifUrl;
    if (notes !== undefined) updateData.notes = notes;
    if (isFinal !== undefined) updateData.isFinal = isFinal;
    if (contentTags !== undefined) updateData.contentTags = contentTags;

    // Update the workflow
    const workflow = await prisma.modularWorkflow.update({
      where: { id },
      data: updateData,
    });

    console.log('Updated workflow contentTags:', workflow.contentTags);

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
