import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/content-type-analytics?teamId=xxx
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
    }

    // Get date range for this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get all ModularWorkflows for this team with content type info
    const workflows = await prisma.modularWorkflow.findMany({
      where: {
        teamId: teamId,
      },
      include: {
        contentTypeOption: true,
      },
    });

    // Filter workflows for this month
    const thisMonthWorkflows = workflows.filter(
      (w) => w.createdAt >= startOfMonth && w.createdAt <= endOfMonth
    );

    // Content type usage count (all time)
    const contentTypeUsage: Record<string, { count: number; label: string; category: string }> = {};
    
    // Content type usage for this month
    const thisMonthContentTypeUsage: Record<string, { count: number; label: string; category: string }> = {};

    // Calculate pricing totals
    let totalRevenueThisMonth = 0;
    let totalRevenueAllTime = 0;

    // Category breakdown
    const categoryBreakdown: Record<string, { count: number; revenue: number }> = {
      CHEAP_PORN: { count: 0, revenue: 0 },
      EXPENSIVE_PORN: { count: 0, revenue: 0 },
      GF_ACCURATE: { count: 0, revenue: 0 },
    };

    // Process all workflows
    workflows.forEach((workflow) => {
      const contentTypeLabel = workflow.contentTypeOption?.label || workflow.contentType || "Unknown";
      const contentTypeKey = workflow.contentTypeOptionId || workflow.contentType || "unknown";
      const category = workflow.contentTypeOption?.category || workflow.pricingCategory || "UNKNOWN";

      // All-time usage count
      if (!contentTypeUsage[contentTypeKey]) {
        contentTypeUsage[contentTypeKey] = {
          count: 0,
          label: contentTypeLabel,
          category: category,
        };
      }
      contentTypeUsage[contentTypeKey].count++;

      // Calculate price
      let price = 0;
      if (workflow.contentTypeOption) {
        // Cast to any to handle isFree field (may need prisma generate)
        const contentTypeData = workflow.contentTypeOption as typeof workflow.contentTypeOption & { isFree?: boolean };
        const isFree = contentTypeData.isFree === true;
        
        if (!isFree) {
          if (workflow.contentTypeOption.priceFixed) {
            price = workflow.contentTypeOption.priceFixed;
          } else if (workflow.contentTypeOption.priceMin) {
            // Use minimum price for calculations
            price = workflow.contentTypeOption.priceMin;
          }
        }
      } else if (workflow.pricing) {
        // Try to parse legacy pricing string
        const priceMatch = workflow.pricing.match(/\$?([\d.]+)/);
        if (priceMatch) {
          price = parseFloat(priceMatch[1]);
        }
      }

      totalRevenueAllTime += price;

      // Category breakdown (all time)
      if (categoryBreakdown[category]) {
        categoryBreakdown[category].count++;
        categoryBreakdown[category].revenue += price;
      }
    });

    // Process this month's workflows
    thisMonthWorkflows.forEach((workflow) => {
      const contentTypeLabel = workflow.contentTypeOption?.label || workflow.contentType || "Unknown";
      const contentTypeKey = workflow.contentTypeOptionId || workflow.contentType || "unknown";
      const category = workflow.contentTypeOption?.category || workflow.pricingCategory || "UNKNOWN";

      // This month usage count
      if (!thisMonthContentTypeUsage[contentTypeKey]) {
        thisMonthContentTypeUsage[contentTypeKey] = {
          count: 0,
          label: contentTypeLabel,
          category: category,
        };
      }
      thisMonthContentTypeUsage[contentTypeKey].count++;

      // Calculate price for this month
      let price = 0;
      if (workflow.contentTypeOption) {
        // Cast to any to handle isFree field (may need prisma generate)
        const contentTypeData = workflow.contentTypeOption as typeof workflow.contentTypeOption & { isFree?: boolean };
        const isFree = contentTypeData.isFree === true;
        
        if (!isFree) {
          if (workflow.contentTypeOption.priceFixed) {
            price = workflow.contentTypeOption.priceFixed;
          } else if (workflow.contentTypeOption.priceMin) {
            price = workflow.contentTypeOption.priceMin;
          }
        }
      } else if (workflow.pricing) {
        const priceMatch = workflow.pricing.match(/\$?([\d.]+)/);
        if (priceMatch) {
          price = parseFloat(priceMatch[1]);
        }
      }

      totalRevenueThisMonth += price;
    });

    // Sort content types by usage (most used first)
    const topContentTypesAllTime = Object.entries(contentTypeUsage)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([key, data]) => ({
        id: key,
        label: data.label,
        category: data.category,
        count: data.count,
      }));

    const topContentTypesThisMonth = Object.entries(thisMonthContentTypeUsage)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([key, data]) => ({
        id: key,
        label: data.label,
        category: data.category,
        count: data.count,
      }));

    // Get unique models this month
    const modelsThisMonth = [...new Set(thisMonthWorkflows.map((w) => w.modelName))];

    return NextResponse.json({
      success: true,
      data: {
        // Summary stats
        totalWorkflowsAllTime: workflows.length,
        totalWorkflowsThisMonth: thisMonthWorkflows.length,
        totalRevenueAllTime: Math.round(totalRevenueAllTime * 100) / 100,
        totalRevenueThisMonth: Math.round(totalRevenueThisMonth * 100) / 100,
        
        // Top content types
        topContentTypesAllTime,
        topContentTypesThisMonth,
        
        // Category breakdown
        categoryBreakdown,
        
        // Models active this month
        modelsThisMonth,
        modelsCountThisMonth: modelsThisMonth.length,
        
        // Date range info
        monthName: startOfMonth.toLocaleString("default", { month: "long", year: "numeric" }),
        startOfMonth: startOfMonth.toISOString(),
        endOfMonth: endOfMonth.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching content type analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch content type analytics" },
      { status: 500 }
    );
  }
}
