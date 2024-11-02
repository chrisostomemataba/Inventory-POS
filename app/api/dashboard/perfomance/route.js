// app/api/dashboard/performance/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get('period') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    // Fetch all performance metrics in parallel
    const [
      productPerformance,
      categoryPerformance,
      supplierPerformance,
      stockTurnover
    ] = await Promise.all([
      // Product Performance
      prisma.$queryRaw`
        WITH ProductStats AS (
          SELECT 
            p.id,
            p.name,
            p.quantity,
            p.unitPrice,
            p.minimumQuantity,
            COUNT(DISTINCT it.id) as transactionCount,
            SUM(CASE WHEN it.transactionType = 'OUT' THEN it.quantity ELSE 0 END) as totalOut,
            SUM(CASE WHEN it.transactionType = 'IN' THEN it.quantity ELSE 0 END) as totalIn,
            DATEDIFF(NOW(), MAX(it.createdAt)) as daysSinceLastMovement
          FROM product p
          LEFT JOIN inventoryTransaction it ON p.id = it.productId
          WHERE p.isActive = true 
            AND it.createdAt >= DATE_SUB(NOW(), INTERVAL ${period} DAY)
          GROUP BY p.id
        )
        SELECT 
          id,
          name,
          quantity,
          unitPrice,
          transactionCount,
          totalOut,
          totalIn,
          daysSinceLastMovement,
          CASE 
            WHEN quantity = 0 THEN 0
            WHEN totalOut = 0 THEN 0
            ELSE (totalOut / quantity) * (${period} / daysSinceLastMovement)
          END as turnoverRate,
          (quantity * unitPrice) as currentValue
        FROM ProductStats
        ORDER BY turnoverRate DESC
      `,

      // Category Performance
      prisma.category.findMany({
        include: {
          products: {
            where: {
              isActive: true,
              inventory: {
                some: {
                  createdAt: {
                    gte: startDate
                  }
                }
              }
            },
            include: {
              inventory: {
                where: {
                  createdAt: {
                    gte: startDate
                  }
                }
              }
            }
          },
          _count: {
            select: { products: true }
          }
        }
      }),

      // Supplier Performance
      prisma.$queryRaw`
        SELECT 
          s.id,
          s.name,
          COUNT(DISTINCT p.id) as productCount,
          SUM(p.quantity) as totalStock,
          SUM(p.quantity * p.unitPrice) as totalValue,
          AVG(CASE 
            WHEN p.quantity <= p.minimumQuantity THEN 0
            ELSE 1
          END) as stockAvailabilityRate
        FROM supplier s
        LEFT JOIN product p ON s.id = p.supplierId
        WHERE p.isActive = true
        GROUP BY s.id
        ORDER BY totalValue DESC
      `,

      // Stock Turnover Analysis
      prisma.$queryRaw`
        WITH StockMovement AS (
          SELECT 
            p.id,
            p.name,
            p.quantity as currentStock,
            AVG(p.quantity) as averageStock,
            SUM(CASE WHEN it.transactionType = 'OUT' THEN it.quantity ELSE 0 END) as totalSold,
            COUNT(DISTINCT CASE WHEN it.transactionType = 'OUT' THEN it.id END) as salesCount,
            MIN(CASE WHEN it.transactionType = 'OUT' THEN it.createdAt END) as firstSale,
            MAX(CASE WHEN it.transactionType = 'OUT' THEN it.createdAt END) as lastSale
          FROM product p
          LEFT JOIN inventoryTransaction it ON p.id = it.productId
          WHERE p.isActive = true 
            AND it.createdAt >= DATE_SUB(NOW(), INTERVAL ${period} DAY)
          GROUP BY p.id
        )
        SELECT 
          id,
          name,
          currentStock,
          averageStock,
          totalSold,
          salesCount,
          CASE 
            WHEN totalSold = 0 OR averageStock = 0 THEN 0
            ELSE (totalSold / averageStock) * (${period} / DATEDIFF(lastSale, firstSale))
          END as turnoverRatio
        FROM StockMovement
        WHERE totalSold > 0
        ORDER BY turnoverRatio DESC
      `
    ]);

    // Transform and calculate additional metrics
    const performance = {
      products: {
        items: productPerformance.map(product => ({
          ...product,
          performanceScore: calculateProductScore(product)
        })),
        topPerformers: productPerformance
          .sort((a, b) => b.turnoverRate - a.turnoverRate)
          .slice(0, 5),
        underperformers: productPerformance
          .filter(p => p.quantity > 0 && p.turnoverRate === 0)
          .slice(0, 5)
      },
      categories: categoryPerformance.map(category => ({
        id: category.id,
        name: category.name,
        productCount: category._count.products,
        activeProducts: category.products.length,
        totalValue: category.products.reduce((sum, product) => 
          sum + (product.quantity * product.unitPrice), 0
        ),
        transactionCount: category.products.reduce((sum, product) => 
          sum + product.inventory.length, 0
        ),
        performance: calculateCategoryScore(category)
      })),
      suppliers: supplierPerformance.map(supplier => ({
        ...supplier,
        performanceScore: calculateSupplierScore(supplier)
      })),
      turnover: {
        analysis: stockTurnover,
        averageTurnover: calculateAverageTurnover(stockTurnover)
      }
    };

    return NextResponse.json(performance);
  } catch (error) {
    console.error('Dashboard Performance Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
}

// Helper functions for score calculations
function calculateProductScore(product) {
  const turnoverWeight = 0.4;
  const valueWeight = 0.3;
  const transactionWeight = 0.3;

  const turnoverScore = Math.min(product.turnoverRate / 2, 1);
  const valueScore = Math.min(product.currentValue / 10000, 1);
  const transactionScore = Math.min(product.transactionCount / 100, 1);

  return (
    turnoverScore * turnoverWeight +
    valueScore * valueWeight +
    transactionScore * transactionWeight
  );
}

function calculateCategoryScore(category) {
  const activeRatio = category.products.length / category._count.products;
  const transactionVolume = category.products.reduce((sum, product) => 
    sum + product.inventory.length, 0
  );
  return (activeRatio * 0.5 + Math.min(transactionVolume / 100, 1) * 0.5);
}

function calculateSupplierScore(supplier) {
  return supplier.stockAvailabilityRate * 0.7 + 
         Math.min(supplier.productCount / 20, 1) * 0.3;
}

function calculateAverageTurnover(turnover) {
  if (!turnover.length) return 0;
  return turnover.reduce((sum, item) => 
    sum + item.turnoverRatio, 0
  ) / turnover.length;
}