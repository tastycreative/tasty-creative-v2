import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow non-guest users to access global stats
    if (session.user.role === "GUEST") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get global stats - no user filtering applied
    const [totalModels, activeModels] = await Promise.all([
      // Total count of all models
      prisma.clientModel.count(),
      
      // Count of active models
      prisma.clientModel.count({
        where: {
          status: { contains: "active", mode: "insensitive" }
        }
      })
    ]);

    // Calculate total revenue (if you have revenue data in your schema)
    // For now, using a placeholder calculation
    const allModels = await prisma.clientModel.findMany({
      select: {
        percentTaken: true,
        guaranteed: true,
      }
    });

    // Calculate estimated total revenue based on percentTaken and guaranteed fields
    // This is a simplified calculation - adjust based on your actual revenue calculation
    const totalRevenue = allModels.reduce((sum, model) => {
      const percent = parseFloat(model.percentTaken || "0");
      const guaranteed = parseFloat(model.guaranteed || "0");
      // Simple estimation - you may want to adjust this calculation
      return sum + guaranteed + (percent * 1000); // Assuming some base calculation
    }, 0);

    return NextResponse.json({
      totalModels,
      activeModels,
      droppedModels: totalModels - activeModels,
      totalRevenue,
      activePercentage: totalModels > 0 ? (activeModels / totalModels) * 100 : 0,
    });
  } catch (error) {
    console.error("Error fetching global stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch global stats" },
      { status: 500 }
    );
  }
}