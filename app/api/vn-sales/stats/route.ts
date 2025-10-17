import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated session
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Optional: Add role-based access control
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    console.log('📊 Fetching VN Sales stats from database...');

    // Fetch all sales from database
    // @ts-ignore - Prisma Client type generation issue
    const allSales = await prisma.voiceNoteSale.findMany({
      orderBy: {
        soldDate: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(`📋 Found ${allSales.length} sales records`);

    let totalSales = 0;
    let totalSalesToday = 0;
    const salesByModel: {
      [key: string]: { sales: number; revenue: number; loyaltyPoints: number };
    } = {};

    // Array to store individual sales records
    const recentSales: Array<{
      id: string;
      userId: string;
      userName: string;
      userEmail: string;
      model: string;
      voiceNote: string;
      sale: number;
      soldDate: string;
      status: string;
      generatedDate: string;
      source?: string;
    }> = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    console.log('📅 Today range:', { todayStart, todayEnd });

    // Process all sales
    for (const sale of allSales) {
      const saleAmount = sale.saleAmount;
      const modelName = sale.modelName;

      totalSales++;

      // Add to sales by model
      if (!salesByModel[modelName]) {
        salesByModel[modelName] = {
          sales: 0,
          revenue: 0,
          loyaltyPoints: 0,
        };
      }

      salesByModel[modelName].sales++;
      salesByModel[modelName].revenue += saleAmount;
      salesByModel[modelName].loyaltyPoints = Math.floor(salesByModel[modelName].revenue * 0.8);

      // Add to recent sales array
      recentSales.push({
        id: sale.id,
        userId: sale.userId,
        userName: sale.userName,
        userEmail: sale.userEmail,
        model: sale.modelName,
        voiceNote: sale.voiceNote,
        sale: saleAmount,
        soldDate: sale.soldDate.toISOString(),
        status: sale.status,
        generatedDate: sale.generatedDate?.toISOString() || sale.createdAt.toISOString(),
        source: sale.source || undefined,
      });

      // Check if this sale was today
      const saleDate = new Date(sale.soldDate);
      const isToday = saleDate >= todayStart && saleDate < todayEnd;

      console.log(`📅 Sale date: ${sale.soldDate} -> ${saleDate} (isToday: ${isToday})`);

      if (isToday) {
        totalSalesToday += saleAmount;
      }
    }

    // Calculate totals
    let totalRevenue = 0;
    for (const model of Object.values(salesByModel)) {
      totalRevenue += model.revenue;
    }
    const averageVnPrice = totalSales > 0 ? totalRevenue / totalSales : 0;

    const result = {
      vnSalesToday: totalSalesToday,
      totalVnCount: totalSales,
      totalRevenue,
      averageVnPrice: Math.round(averageVnPrice * 100) / 100,
      salesByModel: Object.entries(salesByModel).map(([name, data]) => ({
        name,
        ...data,
      })),
      recentSales: recentSales.slice(0, 100), // Limit to last 100 sales for performance
      timestamp: new Date().toISOString(),
      debug: {
        totalSalesProcessed: totalSales,
        recentSalesCount: recentSales.length,
        todayDateRange: { todayStart, todayEnd }
      }
    };

    console.log('📊 Final VN Sales stats:', {
      ...result,
      recentSales: `${result.recentSales.length} sales loaded`
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("❌ Error fetching VN sales stats:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch VN sales stats",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}