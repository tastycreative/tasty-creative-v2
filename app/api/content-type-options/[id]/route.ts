import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// PUT - Update content type option
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const {
      label,
      priceType,
      priceFixed,
      priceMin,
      priceMax,
      description,
    } = body;

    // Validate required fields
    if (!label) {
      return NextResponse.json(
        {
          success: false,
          error: "Label is required",
        },
        { status: 400 }
      );
    }

    // Validate price data based on priceType
    if (priceType === "FIXED" && !priceFixed) {
      return NextResponse.json(
        {
          success: false,
          error: "Fixed price is required for FIXED price type",
        },
        { status: 400 }
      );
    }

    if (priceType === "RANGE" && (!priceMin || !priceMax)) {
      return NextResponse.json(
        {
          success: false,
          error: "Min and max prices are required for RANGE price type",
        },
        { status: 400 }
      );
    }

    if (priceType === "MINIMUM" && !priceMin) {
      return NextResponse.json(
        {
          success: false,
          error: "Minimum price is required for MINIMUM price type",
        },
        { status: 400 }
      );
    }

    // Check if content type option exists
    const existingOption = await prisma.contentTypeOption.findUnique({
      where: { id },
    });

    if (!existingOption) {
      return NextResponse.json(
        {
          success: false,
          error: "Content type option not found",
        },
        { status: 404 }
      );
    }

    // Update content type option
    const updatedOption = await prisma.contentTypeOption.update({
      where: { id },
      data: {
        label,
        priceType,
        priceFixed,
        priceMin,
        priceMax,
        description,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      contentTypeOption: updatedOption,
      message: "Content type option updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating content type option:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update content type option",
      },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete content type option (set isActive to false)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if content type option exists
    const existingOption = await prisma.contentTypeOption.findUnique({
      where: { id },
      include: {
        workflows: {
          take: 1, // Just check if any workflows exist
        },
      },
    });

    if (!existingOption) {
      return NextResponse.json(
        {
          success: false,
          error: "Content type option not found",
        },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    // This preserves existing workflows that reference this content type
    const updatedOption = await prisma.contentTypeOption.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      contentTypeOption: updatedOption,
      message: "Content type option deactivated successfully",
      workflowsAffected: existingOption.workflows.length > 0,
    });
  } catch (error: any) {
    console.error("Error deleting content type option:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete content type option",
      },
      { status: 500 }
    );
  }
}

// GET - Get single content type option by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const contentTypeOption = await prisma.contentTypeOption.findUnique({
      where: { id },
      include: {
        workflows: {
          take: 10, // Include up to 10 workflows using this content type
          select: {
            id: true,
            modelName: true,
            createdAt: true,
            status: true,
          },
        },
      },
    });

    if (!contentTypeOption) {
      return NextResponse.json(
        {
          success: false,
          error: "Content type option not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      contentTypeOption,
    });
  } catch (error) {
    console.error("Error fetching content type option:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch content type option",
      },
      { status: 500 }
    );
  }
}
