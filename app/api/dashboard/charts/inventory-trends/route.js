// app/api/dashboard/charts/inventory-trends/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'week';

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    switch (timeframe) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    // Get stock movements and levels
    const stockData = await prisma.$queryRaw`
      WITH RECURSIVE DateSeries AS (
        SELECT DATE(${startDate}) as date
        UNION ALL
        SELECT DATE_ADD(date, INTERVAL 1 DAY)
        FROM DateSeries
        WHERE date < DATE(${endDate})
      ),
      DailyMovements AS (
        SELECT 
          DATE(createdAt) as date,
          SUM(CASE WHEN transactionType = 'IN' THEN quantity ELSE 0 END) as inbound,
          SUM(CASE WHEN transactionType = 'OUT' THEN quantity ELSE 0 END) as outbound
        FROM inventoryTransaction
        WHERE createdAt BETWEEN ${startDate} AND ${endDate}
        GROUP BY DATE(createdAt)
      ),
      RunningStock AS (
        SELECT
          d.date,
          COALESCE(dm.inbound, 0) as inbound,
          COALESCE(dm.outbound, 0) as outbound,
          SUM(COALESCE(dm.inbound, 0) - COALESCE(dm.outbound, 0)) 
            OVER (ORDER BY d.date) as stockLevel
        FROM DateSeries d
        LEFT JOIN DailyMovements dm ON d.date = dm.date
      )
      SELECT *
      FROM RunningStock
      ORDER BY date
    `;

    // Calculate reorder points
    const reorderPoints = await prisma.$queryRaw`
      SELECT 
        AVG(p.minimumQuantity) as level
      FROM product p
      WHERE p.isActive = true
      GROUP BY p.categoryId
    `;

    return NextResponse.json({
      trends: stockData.map(day => ({
        date: day.date,
        stockLevel: parseInt(day.stockLevel),
        inbound: parseInt(day.inbound),
        outbound: parseInt(day.outbound)
      })),
      reorderPoints: reorderPoints.map(point => ({
        level: parseInt(point.level)
      }))
    });
  } catch (error) {
    console.error('Inventory Trends Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory trends' },
      { status: 500 }
    );
  }
}