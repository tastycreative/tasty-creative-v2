import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
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

    // Fetch all sales for the current user
    // @ts-ignore - Prisma Client type generation issue
    const sales = await prisma.voiceNoteSale.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        soldDate: "desc",
      },
      select: {
        id: true,
        modelName: true,
        voiceNote: true,
        saleAmount: true,
        soldDate: true,
        status: true,
        generatedDate: true,
        source: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      sales,
      count: sales.length,
    });
  } catch (error: any) {
    console.error("Error fetching user sales:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales", details: error.message },
      { status: 500 }
    );
  }
}
