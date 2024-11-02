// app/api/dashboard/alerts/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const [
      lowStockAlerts,
      deadStockAlerts,
      valuationAlerts,
      categoryAlerts,
      transactionAlerts
    ] = await Promise.all([
      // Low Stock Alerts
      prisma.product.findMany({
        where: {
          isActive: true,
          quantity: {
            lte: prisma.raw('minimumQuantity')
          }
        },
        include: {
          category: true,
          supplier: true
        },
        orderBy: {
          quantity: 'asc'
        }
      }),

      // Dead Stock Alerts
      prisma.$queryRaw`
        SELECT 
          p.id,
          p.name,
          p.quantity,
          p.unitPrice,
          (p.quantity * p.unitPrice) as stockValue,
          MAX(it.createdAt) as lastMovement,
          DATEDIFF(NOW(), MAX(it.createdAt)) as daysSinceMovement
        FROM product p
        LEFT JOIN inventoryTransaction it ON p.id = it.productId
        WHERE p.isActive = true 
          AND p.quantity > 0
        GROUP BY p.id
        HAVING daysSinceMovement > 90
        ORDER BY stockValue DESC
      `,

      // Valuation Alerts
      prisma.$queryRaw`
        WITH ProductValueChange AS (
          SELECT 
            p.id,
            p.name,
            p.quantity * p.unitPrice as currentValue,
            p.quantity * p.costPrice as costValue,
            ((p.quantity * p.unitPrice) - (p.quantity * p.costPrice)) / 
              NULLIF((p.quantity * p.costPrice), 0) * 100 as marginPercentage
          FROM product p
          WHERE p.isActive = true
        )
        SELECT *
        FROM ProductValueChange
        WHERE marginPercentage < 15 
           OR marginPercentage > 100
        ORDER BY marginPercentage
      `,

      // Category Alerts
      prisma.$queryRaw`
        WITH CategoryStats AS (
          SELECT 
            c.id,
            c.name,
            COUNT(p.id) as productCount,
            SUM(CASE WHEN p.quantity <= p.minimumQuantity THEN 1 ELSE 0 END) as lowStockCount,
            SUM(p.quantity * p.unitPrice) as totalValue
          FROM category c
          LEFT JOIN product p ON c.id = p.categoryId
          WHERE p.isActive = true
          GROUP BY c.id
        )
        SELECT *,
          (lowStockCount::FLOAT / NULLIF(productCount, 0) * 100) as lowStockPercentage
        FROM CategoryStats
        WHERE lowStockCount > 0
          OR productCount = 0
        ORDER BY lowStockPercentage DESC
      `,

      // Transaction Alerts
      prisma.$queryRaw`
        WITH UnusualTransactions AS (
          SELECT 
            it.id,
            it.productId,
            p.name as productName,
            it.quantity,
            it.transactionType,
            it.createdAt,
            AVG(it2.quantity) as avgQuantity,
            STDDEV(it2.quantity) as stdDevQuantity
          FROM inventoryTransaction it
          JOIN product p ON it.productId = p.id
          JOIN inventoryTransaction it2 ON it.productId = it2.productId
          WHERE it.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          GROUP BY it.id
          HAVING it.quantity > avgQuantity + (2 * stdDevQuantity)
        )
        SELECT *
        FROM UnusualTransactions
        ORDER BY createdAt DESC
      `
    ]);

    // Transform and categorize alerts
    const alerts = {
      critical: [],
      warning: [],
      info: [],
      statistics: {
        totalAlerts: 0,
        criticalCount: 0,
        warningCount: 0,
        infoCount: 0
      }
    };

    // Process Low Stock Alerts
    lowStockAlerts.forEach(product => {
      const alert = {
        type: 'LOW_STOCK',
        severity: product.quantity === 0 ? 'critical' : 'warning',
        message: `${product.name} is ${product.quantity === 0 ? 'out of stock' : 'running low'}`,
        details: {
          product: {
            id: product.id,
            name: product.name,
            quantity: product.quantity,
            minimum: product.minimumQuantity
          },
          category: product.category.name,
          supplier: product.supplier?.name
        },
        action: 'REORDER'
      };
      alerts[alert.severity].push(alert);
    });

    // Process Dead Stock Alerts
    deadStockAlerts.forEach(stock => {
      const alert = {
        type: 'DEAD_STOCK',
        severity: stock.daysSinceMovement > 180 ? 'warning' : 'info',
        message: `${stock.name} hasn't moved in ${stock.daysSinceMovement} days`,
        details: {
          product: {
            id: stock.id,
            name: stock.name,
            value: stock.stockValue,
            lastMovement: stock.lastMovement
          }
        },
        action: 'REVIEW'
      };
      alerts[alert.severity].push(alert);
    });

    // Process Valuation Alerts
    valuationAlerts.forEach(item => {
      const alert = {
        type: 'VALUATION',
        severity: item.marginPercentage < 15 ? 'warning' : 'info',
        message: `${item.name} has unusual margin of ${Math.round(item.marginPercentage)}%`,
        details: {
          product: {
            id: item.id,
            name: item.name,
            currentValue: item.currentValue,
            costValue: item.costValue,
            margin: item.marginPercentage
          }
        },
        action: 'REVIEW_PRICING'
      };
      alerts[alert.severity].push(alert);
    });

    // Process Category Alerts
    categoryAlerts.forEach(category => {
      const alert = {
        type: 'CATEGORY',
        severity: category.lowStockPercentage > 50 ? 'warning' : 'info',
        message: `${category.name} has ${category.lowStockCount} products low in stock`,
        details: {
          category: {
            id: category.id,
            name: category.name,
            lowStockCount: category.lowStockCount,
            totalProducts: category.productCount,
            percentage: category.lowStockPercentage
          }
        },
        action: 'REVIEW_CATEGORY'
      };
      alerts[alert.severity].push(alert);
    });

    // Process Transaction Alerts
    transactionAlerts.forEach(transaction => {
      const alert = {
        type: 'UNUSUAL_TRANSACTION',
        severity: 'info',
        message: `Unusual ${transaction.transactionType} quantity for ${transaction.productName}`,
        details: {
          transaction: {
            id: transaction.id,
            productId: transaction.productId,
            quantity: transaction.quantity,
            average: transaction.avgQuantity,
            deviation: transaction.stdDevQuantity,
            timestamp: transaction.createdAt
          }
        },
        action: 'REVIEW_TRANSACTION'
    };
    alerts.info.push(alert);
  });
 
  // Update statistics
  alerts.statistics = {
    totalAlerts: alerts.critical.length + alerts.warning.length + alerts.info.length,
    criticalCount: alerts.critical.length,
    warningCount: alerts.warning.length,
    infoCount: alerts.info.length,
    timestamp: new Date()
  };
 
  return NextResponse.json(alerts);
 } catch (error) {
  console.error('Dashboard Alerts Error:', error);
  return NextResponse.json(
    { error: 'Failed to fetch alerts' },
    { status: 500 }
  );
 }
 }