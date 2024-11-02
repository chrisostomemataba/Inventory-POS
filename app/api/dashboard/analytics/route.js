// app/api/dashboard/analytics/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get('period') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const [
      inventoryAnalytics,
      financialAnalytics,
      productAnalytics,
      supplierAnalytics,
      forecastAnalytics
    ] = await Promise.all([
      // Inventory Analytics
      prisma.$queryRaw`
        WITH InventoryMetrics AS (
          SELECT
            DATE(it.createdAt) as date,
            SUM(CASE WHEN it.transactionType = 'IN' THEN it.quantity ELSE -it.quantity END) as netChange,
            COUNT(DISTINCT p.id) as productsAffected,
            SUM(CASE WHEN it.transactionType = 'IN' THEN it.quantity * p.costPrice ELSE 0 END) as inboundValue,
            SUM(CASE WHEN it.transactionType = 'OUT' THEN it.quantity * p.unitPrice ELSE 0 END) as outboundValue
          FROM inventoryTransaction it
          JOIN product p ON it.productId = p.id
          WHERE it.createdAt >= DATE_SUB(NOW(), INTERVAL ${period} DAY)
          GROUP BY DATE(it.createdAt)
        )
        SELECT
          date,
          netChange,
          productsAffected,
          inboundValue,
          outboundValue,
          (outboundValue - inboundValue) as dailyProfit,
          AVG(netChange) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as movingAvgChange,
          SUM(netChange) OVER (ORDER BY date) as cumulativeChange
        FROM InventoryMetrics
        ORDER BY date
      `,

      // Financial Analytics
      prisma.$queryRaw`
        WITH ProductFinancials AS (
          SELECT
            p.id,
            p.name,
            p.quantity * p.costPrice as inventoryCost,
            p.quantity * p.unitPrice as potentialRevenue,
            ((p.quantity * p.unitPrice) - (p.quantity * p.costPrice)) as potentialProfit,
            (SELECT SUM(CASE 
              WHEN it.transactionType = 'OUT' 
              THEN it.quantity * p.unitPrice 
              ELSE 0 
            END)
            FROM inventoryTransaction it
            WHERE it.productId = p.id
            AND it.createdAt >= DATE_SUB(NOW(), INTERVAL ${period} DAY)) as actualRevenue
          FROM product p
          WHERE p.isActive = true
        )
        SELECT
          SUM(inventoryCost) as totalInventoryCost,
          SUM(potentialRevenue) as totalPotentialRevenue,
          SUM(potentialProfit) as totalPotentialProfit,
          SUM(actualRevenue) as periodRevenue,
          AVG(potentialProfit / NULLIF(inventoryCost, 0)) * 100 as averageMargin,
          SUM(actualRevenue) / ${period} as dailyAverageRevenue
        FROM ProductFinancials
      `,

      // Product Analytics
      prisma.$queryRaw`
        WITH ProductMetrics AS (
          SELECT
            p.id,
            p.name,
            p.quantity,
            p.minimumQuantity,
            p.unitPrice,
            p.costPrice,
            COUNT(it.id) as transactionCount,
            SUM(CASE WHEN it.transactionType = 'OUT' THEN it.quantity ELSE 0 END) as totalSold,
            AVG(CASE WHEN it.transactionType = 'OUT' THEN it.quantity ELSE NULL END) as avgOrderSize,
            MAX(it.createdAt) as lastTransaction,
            (SELECT AVG(quantity)
             FROM inventoryTransaction
             WHERE productId = p.id
             AND transactionType = 'OUT'
             AND createdAt >= DATE_SUB(NOW(), INTERVAL ${period} DAY)) as avgDailyDemand
          FROM product p
          LEFT JOIN inventoryTransaction it ON p.id = it.productId
          WHERE p.isActive = true
          AND (it.createdAt IS NULL OR it.createdAt >= DATE_SUB(NOW(), INTERVAL ${period} DAY))
          GROUP BY p.id
        )
        SELECT
          *,
          CASE
            WHEN avgDailyDemand > 0 THEN quantity / avgDailyDemand
            ELSE NULL
          END as daysOfStock,
          CASE
            WHEN quantity <= minimumQuantity THEN 'LOW'
            WHEN quantity <= minimumQuantity * 1.5 THEN 'MEDIUM'
            ELSE 'GOOD'
          END as stockStatus,
          CASE
            WHEN totalSold > 0 THEN (quantity * costPrice) / totalSold * ${period}
            ELSE NULL
          END as holdingCostPerUnit
        FROM ProductMetrics
        ORDER BY totalSold DESC
      `,

      // Supplier Analytics
      prisma.$queryRaw`
        WITH SupplierMetrics AS (
          SELECT
            s.id,
            s.name,
            COUNT(DISTINCT p.id) as productCount,
            SUM(p.quantity * p.costPrice) as inventoryValue,
            AVG(CASE 
              WHEN p.quantity <= p.minimumQuantity THEN 0
              ELSE 1
            END) as stockAvailabilityRate,
            (SELECT COUNT(DISTINCT pit.id)
             FROM inventoryTransaction pit
             JOIN product pp ON pit.productId = pp.id
             WHERE pp.supplierId = s.id
             AND pit.transactionType = 'IN'
             AND pit.createdAt >= DATE_SUB(NOW(), INTERVAL ${period} DAY)) as deliveryCount
          FROM supplier s
          LEFT JOIN product p ON s.id = p.supplierId
          WHERE p.isActive = true
          GROUP BY s.id
        )
        SELECT
          *,
          inventoryValue / NULLIF(productCount, 0) as avgProductValue,
          deliveryCount / ${period} * 30 as monthlyDeliveryRate
        FROM SupplierMetrics
        ORDER BY inventoryValue DESC
      `,

      // Forecast Analytics
      prisma.$queryRaw`
        WITH DailyDemand AS (
          SELECT
            p.id,
            p.name,
            DATE(it.createdAt) as date,
            SUM(CASE WHEN it.transactionType = 'OUT' THEN it.quantity ELSE 0 END) as demand
          FROM product p
          LEFT JOIN inventoryTransaction it ON p.id = it.productId
          WHERE p.isActive = true
          AND it.createdAt >= DATE_SUB(NOW(), INTERVAL ${period} DAY)
          GROUP BY p.id, DATE(it.createdAt)
        ),
        ProductForecasts AS (
          SELECT
            id,
            name,
            AVG(demand) as avgDailyDemand,
            STDDEV(demand) as stdDevDemand,
            COUNT(DISTINCT date) as daysWithDemand,
            MAX(demand) as peakDemand
          FROM DailyDemand
          GROUP BY id, name
        )
        SELECT
          pf.*,
          p.quantity as currentStock,
          p.minimumQuantity,
          p.costPrice,
          CASE
            WHEN avgDailyDemand > 0 
            THEN p.quantity / avgDailyDemand
            ELSE NULL
          END as daysOfStockLeft,
          CASE
            WHEN avgDailyDemand > 0 
            THEN GREATEST(0, p.minimumQuantity - p.quantity + (avgDailyDemand * 30))
            ELSE 0
          END as suggestedOrderQuantity,
          CASE
            WHEN stdDevDemand > 0
            THEN avgDailyDemand + (2 * stdDevDemand)
            ELSE avgDailyDemand
          END * 1.1 as safetyStockLevel
        FROM ProductForecasts pf
        JOIN product p ON pf.id = p.id
        WHERE daysWithDemand > 0
        ORDER BY avgDailyDemand DESC
      `
    ]);

    // Transform and structure analytics data
    const analytics = {
      inventory: {
        metrics: transformInventoryMetrics(inventoryAnalytics),
        trends: calculateTrends(inventoryAnalytics),
        efficiency: calculateEfficiencyMetrics(inventoryAnalytics)
      },
      financial: {
        summary: transformFinancialSummary(financialAnalytics[0]),
        performance: calculateFinancialPerformance(financialAnalytics[0]),
        projections: calculateFinancialProjections(financialAnalytics[0])
      },
      products: {
        metrics: transformProductMetrics(productAnalytics),
        categories: groupProductsByCategory(productAnalytics),
        recommendations: generateProductRecommendations(productAnalytics)
      },
      suppliers: {
        performance: transformSupplierMetrics(supplierAnalytics),
        rankings: rankSuppliers(supplierAnalytics),
        recommendations: generateSupplierRecommendations(supplierAnalytics)
      },
      forecasting: {
        predictions: transformForecastData(forecastAnalytics),
        recommendations: generateOrderRecommendations(forecastAnalytics),
        risks: assessInventoryRisks(forecastAnalytics)
      }
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Dashboard Analytics Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

// Helper functions for data transformation and analysis

function transformInventoryMetrics(data) {
  return {
    totalMovements: data.length,
    netChange: data.reduce((sum, day) => sum + day.netChange, 0),
    averageDaily: {
      movements: data.reduce((sum, day) => sum + day.productsAffected, 0) / data.length,
      value: data.reduce((sum, day) => sum + day.outboundValue, 0) / data.length
    },
    efficiency: calculateEfficiencyScore(data)
  };
}

function calculateTrends(data) {
  return {
    movement: calculateMovingAverage(data.map(d => d.netChange)),
    value: calculateMovingAverage(data.map(d => d.outboundValue)),
    growth: calculateGrowthRate(data.map(d => d.netChange))
  };
}

function transformFinancialSummary(data) {
  return {
    inventoryValue: {
      cost: data.totalInventoryCost,
      retail: data.totalPotentialRevenue,
      potential: data.totalPotentialProfit
    },
    performance: {
      periodRevenue: data.periodRevenue,
      averageMargin: data.averageMargin,
      dailyAverage: data.dailyAverageRevenue
    }
  };
}

function transformProductMetrics(data) {
  return data.map(product => ({
    id: product.id,
    name: product.name,
    metrics: {
      turnover: calculateTurnoverRate(product),
      profitability: calculateProfitability(product),
      efficiency: calculateProductEfficiency(product)
    },
    status: {
      stock: product.stockStatus,
      demand: assessDemand(product),
      risk: assessRisk(product)
    },
    recommendations: generateProductStrategy(product)
  }));
}

function generateOrderRecommendations(data) {
  return data.map(product => ({
    id: product.id,
    name: product.name,
    recommendations: {
      orderQuantity: Math.ceil(product.suggestedOrderQuantity),
      safetyStock: Math.ceil(product.safetyStockLevel),
      timingRecommendation: recommendOrderTiming(product),
      urgency: calculateOrderUrgency(product)
    },
    justification: {
      currentStock: product.currentStock,
      daysOfStock: Math.floor(product.daysOfStockLeft),
      averageDemand: product.avgDailyDemand,
      variability: product.stdDevDemand
    }
  }));
}