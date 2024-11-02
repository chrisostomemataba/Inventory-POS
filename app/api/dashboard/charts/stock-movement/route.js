// app/api/dashboard/charts/stock-movement/route.js
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

    // Fetch movement data
    const movementData = await prisma.$queryRaw`
      WITH RECURSIVE DateSeries AS (
        SELECT DATE(${startDate}) as date
        UNION ALL
        SELECT DATE_ADD(date, INTERVAL 1 DAY)
        FROM DateSeries
        WHERE date < DATE(${endDate})
      ),
      MovementStats AS (
        SELECT 
          DATE(it.createdAt) as date,
          SUM(CASE 
            WHEN it.transactionType = 'IN' THEN it.quantity 
            ELSE 0 
          END) as inbound,
          SUM(CASE 
            WHEN it.transactionType = 'OUT' THEN it.quantity 
            ELSE 0 
          END) as outbound,
          COUNT(DISTINCT p.id) as products_affected,
          SUM(CASE 
            WHEN it.transactionType = 'IN' THEN it.quantity * p.costPrice
            WHEN it.transactionType = 'OUT' THEN it.quantity * p.unitPrice
            ELSE 0 
          END) as transaction_value
        FROM inventoryTransaction it
        JOIN product p ON it.productId = p.id
        WHERE it.createdAt BETWEEN ${startDate} AND ${endDate}
        GROUP BY DATE(it.createdAt)
      )
      SELECT 
        d.date,
        COALESCE(m.inbound, 0) as inbound,
        COALESCE(m.outbound, 0) as outbound,
        COALESCE(m.products_affected, 0) as products_affected,
        COALESCE(m.transaction_value, 0) as transaction_value
      FROM DateSeries d
      LEFT JOIN MovementStats m ON d.date = m.date
      ORDER BY d.date
    `;

    // Calculate movement patterns
    const patterns = await prisma.$queryRaw`
      WITH MovementPatterns AS (
        SELECT 
          HOUR(createdAt) as hour,
          transactionType,
          COUNT(*) as transaction_count,
          AVG(quantity) as avg_quantity
        FROM inventoryTransaction
        WHERE createdAt BETWEEN ${startDate} AND ${endDate}
        GROUP BY HOUR(createdAt), transactionType
      )
      SELECT 
        hour,
        transactionType,
        transaction_count,
        avg_quantity,
        transaction_count * 100.0 / SUM(transaction_count) OVER (
          PARTITION BY transactionType
        ) as percentage
      FROM MovementPatterns
      ORDER BY hour, transactionType
    `;

    return NextResponse.json({
      movements: movementData.map(day => ({
        date: day.date,
        inbound: parseInt(day.inbound),
        outbound: parseInt(day.outbound),
        productsAffected: parseInt(day.products_affected),
        transactionValue: parseFloat(day.transaction_value)
      })),
      patterns: patterns.map(pattern => ({
        hour: pattern.hour,
        type: pattern.transactionType,
        count: parseInt(pattern.transaction_count),
        averageQuantity: parseFloat(pattern.avg_quantity),
        percentage: parseFloat(pattern.percentage)
      })),
      summary: {
        totalInbound: movementData.reduce((sum, day) => 
          sum + parseInt(day.inbound), 0
        ),
        totalOutbound: movementData.reduce((sum, day) => 
          sum + parseInt(day.outbound), 0
        ),
        totalValue: movementData.reduce((sum, day) => 
          sum + parseFloat(day.transaction_value), 0
        )
      }
    });
  } catch (error) {
    console.error('Stock Movement Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock movement data' },
      { status: 500 }
    );
  }
}