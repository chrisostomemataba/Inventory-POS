// app/api/dashboard/summary/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    // Get current date for date-based calculations
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Fetch all summary metrics in parallel
    const [
      inventoryMetrics,
      valueMetrics,
      categoryMetrics,
      transactionMetrics
    ] = await Promise.all([
      // Inventory Status Metrics
      prisma.$transaction([
        prisma.product.count({
          where: { isActive: true }
        }),
        prisma.product.count({
          where: {
            isActive: true,
            quantity: { lte: prisma.raw('minimumQuantity') }
          }
        }),
        prisma.product.count({
          where: {
            isActive: true,
            quantity: 0
          }
        })
      ]),

      // Value Metrics
      prisma.product.aggregate({
        where: { isActive: true },
        _sum: {
          quantity: true,
          unitPrice: true,
          costPrice: true
        }
      }),

      // Category Metrics
      prisma.category.findMany({
        include: {
          _count: {
            select: { products: true }
          },
          products: {
            where: { isActive: true },
            select: {
              quantity: true,
              unitPrice: true
            }
          }
        }
      }),

      // Transaction Metrics
      prisma.inventoryTransaction.groupBy({
        by: ['transactionType'],
        where: {
          createdAt: {
            gte: startOfDay
          }
        },
        _sum: {
          quantity: true
        }
      })
    ]);

    // Calculate derived metrics
    const [totalProducts, lowStockProducts, outOfStockProducts] = inventoryMetrics;
    
    const totalInventoryValue = valueMetrics._sum.quantity * valueMetrics._sum.unitPrice || 0;
    const totalCostValue = valueMetrics._sum.quantity * valueMetrics._sum.costPrice || 0;
    const grossProfitMargin = ((totalInventoryValue - totalCostValue) / totalInventoryValue * 100) || 0;

    const categoryAnalysis = categoryMetrics.map(category => ({
      name: category.name,
      productCount: category._count.products,
      totalValue: category.products.reduce((sum, product) => 
        sum + (product.quantity * product.unitPrice), 0
      )
    }));

    const dailyTransactions = transactionMetrics.reduce((acc, curr) => {
      acc[curr.transactionType] = curr._sum.quantity;
      return acc;
    }, { IN: 0, OUT: 0 });

    return NextResponse.json({
      inventory: {
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        stockHealth: ((totalProducts - lowStockProducts - outOfStockProducts) / totalProducts * 100) || 0
      },
      value: {
        totalInventoryValue,
        totalCostValue,
        grossProfitMargin,
        averageItemValue: totalInventoryValue / totalProducts || 0
      },
      categories: {
        totalCategories: categoryMetrics.length,
        categoryAnalysis,
        topCategory: categoryAnalysis.sort((a, b) => b.totalValue - a.totalValue)[0]
      },
      transactions: {
        daily: dailyTransactions,
        netChange: (dailyTransactions.IN - dailyTransactions.OUT) || 0
      }
    });
  } catch (error) {
    console.error('Dashboard Summary Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard summary' },
      { status: 500 }
    );
  }
}