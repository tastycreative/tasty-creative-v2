import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const clientModelId = searchParams.get("clientModelId");

    const contentTypeOptions = await prisma.contentTypeOption.findMany({
      where: {
        isActive: true,
        ...(category && { category }),
        // If clientModelId is provided, get both model-specific and global options
        // If not provided, get only global options (clientModelId is null)
        ...(clientModelId ? {
          OR: [
            { clientModelId: clientModelId },
            { clientModelId: null }
          ]
        } : { clientModelId: null }),
      },
      include: {
        clientModel: {
          select: {
            id: true,
            clientName: true,
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      contentTypeOptions,
      category,
      clientModelId,
    });
  } catch (error) {
    console.error("Error fetching content type options:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch content type options",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      value,
      label,
      category,
      priceType,
      priceFixed,
      priceMin,
      priceMax,
      description,
      order,
      isFree,
      clientModelId,
    } = body;

    // Validate required fields
    if (!value || !label || !category) {
      return NextResponse.json(
        {
          success: false,
          error: "Value, label, and category are required",
        },
        { status: 400 }
      );
    }

    // Validate clientModelId if provided
    if (clientModelId) {
      const modelExists = await prisma.clientModel.findUnique({
        where: { id: clientModelId },
      });

      if (!modelExists) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid clientModelId - model not found",
          },
          { status: 400 }
        );
      }
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

    // Get current user session for audit
    const session = await auth();
    const userId = session?.user?.id || null;

    // Create content type option and history record in a transaction
    const [contentTypeOption] = await prisma.$transaction([
      prisma.contentTypeOption.create({
        data: {
          value,
          label,
          category,
          priceType: isFree ? null : priceType,
          priceFixed: isFree ? null : priceFixed,
          priceMin: isFree ? null : priceMin,
          priceMax: isFree ? null : priceMax,
          description,
          order: order || 0,
          isFree: isFree || false,
          clientModelId: clientModelId || null,
        },
      }),
    ]);

    // Create initial history record after getting the ID
    await prisma.contentTypePricingHistory.create({
      data: {
        contentTypeOptionId: contentTypeOption.id,
        changeType: "CREATED",
        oldPriceType: null,
        oldPriceFixed: null,
        oldPriceMin: null,
        oldPriceMax: null,
        oldLabel: null,
        oldIsFree: null,
        newPriceType: isFree ? null : priceType,
        newPriceFixed: isFree ? null : (priceFixed ?? null),
        newPriceMin: isFree ? null : (priceMin ?? null),
        newPriceMax: isFree ? null : (priceMax ?? null),
        newLabel: label,
        newIsFree: isFree || false,
        changedById: userId,
        reason: "Initial creation",
      },
    });

    return NextResponse.json({
      success: true,
      contentTypeOption,
    });
  } catch (error: any) {
    console.error("Error creating content type option:", error);

    // Handle unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error: "A content type option with this value already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create content type option",
      },
      { status: 500 }
    );
  }
}
