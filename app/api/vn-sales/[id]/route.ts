import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PUT - Update a voice note sale
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const saleId = params.id;

    // Parse request body
    const body = await request.json();
    const { saleAmount, status } = body;

    // Validate input
    if (saleAmount !== undefined) {
      const amount = parseFloat(saleAmount);
      if (isNaN(amount) || amount <= 0) {
        return NextResponse.json(
          { error: "Invalid sale amount" },
          { status: 400 }
        );
      }
    }

    if (status && !["Completed", "Pending", "Refunded"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be Completed, Pending, or Refunded" },
        { status: 400 }
      );
    }

    // Check if sale exists and belongs to user
    // @ts-ignore - Prisma Client type generation issue
    const existingSale = await prisma.voiceNoteSale.findUnique({
      where: { id: saleId },
      select: { userId: true },
    });

    if (!existingSale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    if (existingSale.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden - You can only edit your own sales" },
        { status: 403 }
      );
    }

    // Update the sale
    // @ts-ignore - Prisma Client type generation issue
    const updatedSale = await prisma.voiceNoteSale.update({
      where: { id: saleId },
      data: {
        ...(saleAmount !== undefined && { saleAmount: parseFloat(saleAmount) }),
        ...(status && { status }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Sale updated successfully",
      sale: updatedSale,
    });
  } catch (error: any) {
    console.error("Error updating sale:", error);
    return NextResponse.json(
      { error: "Failed to update sale", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a voice note sale
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const saleId = params.id;

    // Check if sale exists and belongs to user
    // @ts-ignore - Prisma Client type generation issue
    const existingSale = await prisma.voiceNoteSale.findUnique({
      where: { id: saleId },
      select: { userId: true },
    });

    if (!existingSale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    if (existingSale.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden - You can only delete your own sales" },
        { status: 403 }
      );
    }

    // Delete the sale
    // @ts-ignore - Prisma Client type generation issue
    await prisma.voiceNoteSale.delete({
      where: { id: saleId },
    });

    return NextResponse.json({
      success: true,
      message: "Sale deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting sale:", error);
    return NextResponse.json(
      { error: "Failed to delete sale", details: error.message },
      { status: 500 }
    );
  }
}
