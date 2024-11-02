// app/api/dashboard/charts/product-performance/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'month';
    const category = searchParams.get('category');
    const metric = searchParams.get('metric') || 'revenue';

    // Calculate date ranges
    const endDate = new Date();
    const startDate = new Date();
    const previousStartDate = new Date();
    
    switch (timeframe) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        previousStartDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        previousStartDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        previousStartDate.setMonth(startDate.getMonth() - 3);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 1);
        previousStartDate.setMonth(startDate.getMonth() - 1);
    }

    // Base query conditions
    const whereConditions = {
      isActive: true,
      ...(category && category !== 'all' ? { categoryId: parseInt(category) } : {})
    };

    // Fetch performance data
    const [currentPeriod, previousPeriod, categories] = await Promise.all([
      // Current period analysis
      prisma.$queryRaw`
        WITH ProductMetrics AS (
          SELECT 
            p.id,
            p.name,
            p.categoryId,
            COUNT(DISTINCT it.id) as transaction_count,
            SUM(CASE 
              WHEN it.transactionType = 'OUT' 
              THEN it.quantity 
              ELSE 0 
            END) as units_sold,
            SUM(CASE 
              WHEN it.transactionType = 'OUT' 
              THEN it.quantity * p.unitPrice 
              ELSE 0 
            END) as revenue,
            AVG(p.quantity) as avg_inventory,
            DATEDIFF(${endDate}, ${startDate}) as days_in_period
          FROM product p
          LEFT JOIN inventoryTransaction it ON p.id = it.productId
          WHERE 
            p.isActive = true
            ${category && category !== 'all' 
              ? sql`AND p.categoryId = ${parseInt(category)}` 
              : sql``}
            AND it.createdAt BETWEEN ${startDate} AND ${endDate}
          GROUP BY p.id, p.name, p.categoryId
        )
        SELECT 
          *,
          units_sold / days_in_period as velocity,
          CASE 
            WHEN avg_inventory > 0 
            THEN (units_sold / avg_inventory) * (365 / days_in_period)
            ELSE 0 
          END as turnover,
          CASE
            WHEN transaction_count > 0 AND avg_inventory > 0
            THEN (
              (units_sold / days_in_period) * 0.4 +
              (revenue / (avg_inventory * p.costPrice)) * 0.4 +
              (transaction_count / days_in_period) * 0.2
            ) * 100
            ELSE 0
          END as performance_score
        FROM ProductMetrics
        ORDER BY 
          CASE '${metric}'
            WHEN 'revenue' THEN revenue
            WHEN 'turnover' THEN turnover
            ELSE velocity
          END DESC
        LIMIT 20
      `, prisma.$queryRaw`
      SELECT 
        p.id,
        SUM(CASE 
          WHEN it.transactionType = 'OUT' 
          THEN it.quantity 
          ELSE 0 
        END) / DATEDIFF(${startDate}, ${previousStartDate}) as prev_velocity,
        CASE 
          WHEN AVG(p.quantity) > 0 
          THEN SUM(CASE 
            WHEN it.transactionType = 'OUT' 
            THEN it.quantity 
            ELSE 0 
          END) / AVG(p.quantity) * (365 / DATEDIFF(${startDate}, ${previousStartDate}))
          ELSE 0 
        END as prev_turnover
      FROM product p
      LEFT JOIN inventoryTransaction it ON p.id = it.productId
      WHERE 
        p.isActive = true
        ${category && category !== 'all' 
          ? sql`AND p.categoryId = ${parseInt(category)}` 
          : sql``}
        AND it.createdAt BETWEEN ${previousStartDate} AND ${startDate}
      GROUP BY p.id
    `,

    // Get categories for filter
    prisma.category.findMany({
      select: {
        id: true,
        name: true
      },
      where: {
        products: {
          some: {
            isActive: true
          }
        }
      }
    })
  ]);

  // Process and transform the data
  const performance = currentPeriod.map(product => {
    const previous = previousPeriod.find(p => p.id === product.id) || {};
    const velocityTrend = previous.prev_velocity 
      ? ((product.velocity - previous.prev_velocity) / previous.prev_velocity) * 100 
      : 0;
    const turnoverTrend = previous.prev_turnover
      ? ((product.turnover - previous.prev_turnover) / previous.prev_turnover) * 100
      : 0;

    return {
      name: product.name,
      revenue: product.revenue,
      velocity: product.velocity,
      turnover: product.turnover,
      score: product.performance_score,
      velocityTrend,
      turnoverTrend,
      insights: generateInsights(product, velocityTrend, turnoverTrend)
    };
  });

  // Calculate summary metrics
  const summary = {
    averageVelocity: performance.reduce((sum, p) => sum + p.velocity, 0) / performance.length,
    velocityTrend: performance.reduce((sum, p) => sum + p.velocityTrend, 0) / performance.length,
    turnoverRate: performance.reduce((sum, p) => sum + p.turnover, 0) / performance.length,
    turnoverTrend: performance.reduce((sum, p) => sum + p.turnoverTrend, 0) / performance.length,
    performanceScore: performance.reduce((sum, p) => sum + p.score, 0) / performance.length,
    performanceLabel: getPerformanceLabel(
      performance.reduce((sum, p) => sum + p.score, 0) / performance.length
    )
  };

  return NextResponse.json({
    performance,
    summary,
    categories,
    insights: generateGlobalInsights(summary)
  });
} catch (error) {
  console.error('Product Performance Error:', error);
  return NextResponse.json(
    { error: 'Failed to fetch product performance data' },
    { status: 500 }
  );
}
}

function generateInsights(product, velocityTrend, turnoverTrend) {
const insights = [];
if (velocityTrend > 20) insights.push('High velocity growth');
if (velocityTrend < -20) insights.push('Declining velocity');
if (turnoverTrend > 20) insights.push('Improving turnover');
if (turnoverTrend < -20) insights.push('Decreasing turnover');
return insights;
}

function generateGlobalInsights(summary) {
const insights = [];
if (summary.velocityTrend > 0) {
  insights.push(`Sales velocity up by ${formatPercentage(summary.velocityTrend)}`);
} else {
  insights.push(`Sales velocity down by ${formatPercentage(Math.abs(summary.velocityTrend))}`);
}
if (summary.turnoverRate > 4) {
  insights.push('Healthy inventory turnover');
} else {
  insights.push('Low inventory turnover');
}
return insights;
}

function getPerformanceLabel(score) {
if (score >= 90) return 'Excellent';
if (score >= 70) return 'Good';
if (score >= 50) return 'Average';
return 'Needs Improvement';
}