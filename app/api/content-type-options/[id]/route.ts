import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// Helper function to determine what changed
function getChangeType(
  existingOption: any,
  newData: { label: string; priceType: string | null; priceFixed: number | null; priceMin: number | null; priceMax: number | null; isFree: boolean }
): string {
  const priceChanged =
    existingOption.priceType !== newData.priceType ||
    existingOption.priceFixed !== newData.priceFixed ||
    existingOption.priceMin !== newData.priceMin ||
    existingOption.priceMax !== newData.priceMax ||
    existingOption.isFree !== newData.isFree;

  const labelChanged = existingOption.label !== newData.label;

  if (priceChanged && labelChanged) {
    return "PRICE_AND_LABEL_UPDATE";
  } else if (priceChanged) {
    return "PRICE_UPDATE";
  } else if (labelChanged) {
    return "LABEL_UPDATE";
  }
  return "UPDATE";
}

// PUT - Update content type option
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      value,
      label,
      pageType,
      priceType,
      priceFixed,
      priceMin,
      priceMax,
      description,
      reason, // Optional reason for the change
      isFree,
    } = body;

    // Get current user session for audit
    const session = await auth();
    const userId = session?.user?.id || null;

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

    if (!value) {
      return NextResponse.json(
        {
          success: false,
          error: "Value (content type code) is required",
        },
        { status: 400 }
      );
    }

    // Validate price data based on priceType (skip validation if isFree or priceType is null)
    if (!isFree && priceType) {
      if (priceType === "FIXED" && !priceFixed && priceFixed !== 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Fixed price is required for FIXED price type",
          },
          { status: 400 }
        );
      }

      if (priceType === "RANGE" && ((!priceMin && priceMin !== 0) || (!priceMax && priceMax !== 0))) {
        return NextResponse.json(
          {
            success: false,
            error: "Min and max prices are required for RANGE price type",
          },
          { status: 400 }
        );
      }

      if (priceType === "MINIMUM" && !priceMin && priceMin !== 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Minimum price is required for MINIMUM price type",
          },
          { status: 400 }
        );
      }
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

    // Check for duplicate value (if value or other unique fields are being changed)
    const effectivePageType = pageType || existingOption.pageType || 'ALL_PAGES';
    const category = existingOption.category; // Category cannot be changed
    const clientModelId = existingOption.clientModelId;

    // Only check for duplicates if the value, pageType, category, or clientModelId would change
    if (value !== existingOption.value || effectivePageType !== existingOption.pageType) {
      const duplicate = await prisma.contentTypeOption.findFirst({
        where: {
          id: { not: id }, // Exclude current record
          value: value,
          category: category,
          clientModelId: clientModelId,
          pageType: effectivePageType,
        },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            error: `A content type with code "${value}" already exists for this tier, model, and page type combination.`,
          },
          { status: 409 }
        );
      }
    }

    // Determine effective values based on isFree
    const effectivePriceType = isFree ? null : priceType;
    const effectivePriceFixed = isFree ? null : (priceFixed ?? null);
    const effectivePriceMin = isFree ? null : (priceMin ?? null);
    const effectivePriceMax = isFree ? null : (priceMax ?? null);

    // Determine what changed
    const changeType = getChangeType(existingOption, {
      label,
      priceType: effectivePriceType,
      priceFixed: effectivePriceFixed,
      priceMin: effectivePriceMin,
      priceMax: effectivePriceMax,
      isFree: isFree || false,
    });

    // Update content type option and create history record in a transaction
    const [updatedOption, historyRecord] = await prisma.$transaction([
      prisma.contentTypeOption.update({
        where: { id },
        data: {
          value,
          label,
          pageType: effectivePageType,
          priceType: effectivePriceType,
          priceFixed: effectivePriceFixed,
          priceMin: effectivePriceMin,
          priceMax: effectivePriceMax,
          description,
          isFree: isFree || false,
          updatedAt: new Date(),
        },
      }),
      prisma.contentTypePricingHistory.create({
        data: {
          contentTypeOptionId: id,
          changeType,
          // Old values
          oldPriceType: existingOption.priceType,
          oldPriceFixed: existingOption.priceFixed,
          oldPriceMin: existingOption.priceMin,
          oldPriceMax: existingOption.priceMax,
          oldLabel: existingOption.label,
          oldIsFree: existingOption.isFree,
          // New values
          newPriceType: effectivePriceType,
          newPriceFixed: effectivePriceFixed,
          newPriceMin: effectivePriceMin,
          newPriceMax: effectivePriceMax,
          newLabel: label,
          newIsFree: isFree || false,
          // Audit info - linked to User
          changedById: userId,
          reason: reason || null,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      contentTypeOption: updatedOption,
      historyRecord,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get current user session for audit
    const session = await auth();
    const userId = session?.user?.id || null;

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

    // Soft delete and create history record in a transaction
    const [updatedOption] = await prisma.$transaction([
      prisma.contentTypeOption.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      }),
      prisma.contentTypePricingHistory.create({
        data: {
          contentTypeOptionId: id,
          changeType: "DEACTIVATED",
          oldPriceType: existingOption.priceType,
          oldPriceFixed: existingOption.priceFixed,
          oldPriceMin: existingOption.priceMin,
          oldPriceMax: existingOption.priceMax,
          oldLabel: existingOption.label,
          oldIsFree: existingOption.isFree,
          newPriceType: existingOption.priceType,
          newPriceFixed: existingOption.priceFixed,
          newPriceMin: existingOption.priceMin,
          newPriceMax: existingOption.priceMax,
          newLabel: existingOption.label,
          newIsFree: existingOption.isFree,
          changedById: userId,
          reason: "Content type deactivated",
        },
      }),
    ]);

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

// GET - Get single content type option by ID (with price history)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
        pricingHistory: {
          orderBy: { createdAt: 'desc' },
          take: 50, // Last 50 history records
          include: {
            changedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
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
