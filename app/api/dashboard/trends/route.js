// app/api/dashboard/trends/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const interval = searchParams.get('interval') || 'daily';
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get trends data based on interval
    const [stockTrends, transactionTrends, valueTrends] = await Promise.all([
      // Stock Level Trends
      prisma.$queryRaw`
        WITH RECURSIVE DateSeries AS (
          SELECT DATE(DATE_SUB(CURRENT_DATE, INTERVAL ${parseInt(period)} DAY)) as date
          UNION ALL
          SELECT DATE_ADD(date, INTERVAL 1 DAY)
          FROM DateSeries
          WHERE date < CURRENT_DATE
        ),
        DailyStock AS (
          SELECT 
            DATE(it.createdAt) as date,
            SUM(CASE 
              WHEN it.transactionType = 'IN' THEN it.quantity
              ELSE -it.quantity
            END) as stockChange
          FROM inventoryTransaction it 
          WHERE it.createdAt >= DATE_SUB(CURRENT_DATE, INTERVAL ${parseInt(period)} DAY)
          GROUP BY DATE(it.createdAt)
        )
        SELECT 
          ds.date,
          COALESCE(ds2.stockChange, 0) as stockChange,
          SUM(COALESCE(ds2.stockChange, 0)) OVER (ORDER BY ds.date) as runningTotal
        FROM DateSeries ds
        LEFT JOIN DailyStock ds2 ON ds.date = ds2.date
        ORDER BY ds.date
      `,

      // Transaction Trends
      prisma.inventoryTransaction.groupBy({
        by: ['transactionType', 'createdAt'],
        where: {
          createdAt: {
            gte: startDate
          }
        },
        _sum: {
          quantity: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      }),

      // Value Trends
      prisma.$queryRaw`
        WITH RECURSIVE DateSeries AS (
          SELECT DATE(DATE_SUB(CURRENT_DATE, INTERVAL ${parseInt(period)} DAY)) as date
          UNION ALL
          SELECT DATE_ADD(date, INTERVAL 1 DAY)
          FROM DateSeries
          WHERE date < CURRENT_DATE
        )
        SELECT 
          ds.date,
          COALESCE(
            SUM(p.quantity * p.unitPrice),
            0
          ) as totalValue
        FROM DateSeries ds
        CROSS JOIN product p
        WHERE p.isActive = true
        GROUP BY ds.date
        ORDER BY ds.date
      `
    ]);

    // Calculate moving averages and trends
    const movingAverageWindow = interval === 'daily' ? 7 : (interval === 'weekly' ? 4 : 3);
    
    const calculateMovingAverage = (data, window) => {
      return data.map((item, index, array) => {
        const start = Math.max(0, index - window + 1);
        const values = array.slice(start, index + 1);
        const average = values.reduce((sum, curr) => sum + curr, 0) / values.length;
        return { ...item, movingAverage: average };
      });
    };

    // Transform raw data into usable format
    const transformedData = {
      stock: {
        daily: stockTrends.map(day => ({
          date: day.date,
          change: day.stockChange,
          total: day.runningTotal
        })),
        movingAverage: calculateMovingAverage(stockTrends.map(day => day.runningTotal), movingAverageWindow)
      },
      transactions: {
        daily: transactionTrends.reduce((acc, curr) => {
          const date = curr.createdAt.toISOString().split('T')[0];
          if (!acc[date]) acc[date] = { IN: 0, OUT: 0 };
          acc[date][curr.transactionType] = curr._sum.quantity;
          return acc;
        }, {}),
        total: transactionTrends.reduce((acc, curr) => {
          acc[curr.transactionType] = (acc[curr.transactionType] || 0) + curr._sum.quantity;
          return acc;
        }, {})
      },
      value: {
        daily: valueTrends.map(day => ({
          date: day.date,
          value: parseFloat(day.totalValue)
        })),
        movingAverage: calculateMovingAverage(valueTrends.map(day => day.totalValue), movingAverageWindow)
      }
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Dashboard Trends Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trend data' },
      { status: 500 }
    );
  }
}