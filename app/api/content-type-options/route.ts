import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const contentTypeOptions = await prisma.contentTypeOption.findMany({
      where: {
        isActive: true,
        ...(category && { category }),
      },
      orderBy: {
        order: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      contentTypeOptions,
      category,
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
      priceType,
      priceFixed,
      priceMin,
      priceMax,
      description,
      order,
    } = body;

    // Validate required fields
    if (!value || !label) {
      return NextResponse.json(
        {
          success: false,
          error: "Value and label are required",
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

    const contentTypeOption = await prisma.contentTypeOption.create({
      data: {
        value,
        label,
        priceType,
        priceFixed,
        priceMin,
        priceMax,
        description,
        order: order || 0,
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
