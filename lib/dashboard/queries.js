// lib/dashboard/queries.js

// Import Prisma client
import { prisma } from '@/lib/prisma';

export const dashboardQueries = {
  // Summary Metrics Queries
  async getSummaryMetrics() {
    const [
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalValue
    ] = await Promise.all([
      // Total Active Products
      prisma.product.count({
        where: {
          isActive: true
        }
      }),
      // Low Stock Products
      prisma.product.count({
        where: {
          isActive: true,
          quantity: {
            gt: 0,
            lte: prisma.raw('minimumQuantity')
          }
        }
      }),
      // Out of Stock Products
      prisma.product.count({
        where: {
          isActive: true,
          quantity: 0
        }
      }),
      // Total Inventory Value
      prisma.product.aggregate({
        _sum: {
          quantity: true,
          unitPrice: true
        },
        where: {
          isActive: true
        }
      }).then(result => 
        (result._sum.quantity || 0) * (result._sum.unitPrice || 0)
      )
    ]);

    return {
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalValue
    };
  },

  // Inventory Trends Query
  async getInventoryTrends(dateRange = 30) {
    const trends = await prisma.inventoryTransaction.groupBy({
      by: ['transactionType', 'createdAt'],
      _sum: {
        quantity: true
      },
      where: {
        createdAt: {
          gte: new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return trends;
  },

  // Category Distribution Query
  async getCategoryDistribution() {
    const distribution = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        },
        products: {
          select: {
            quantity: true,
            unitPrice: true
          },
          where: {
            isActive: true
          }
        }
      }
    });

    return distribution.map(category => ({
      categoryName: category.name,
      productCount: category._count.products,
      totalValue: category.products.reduce(
        (sum, product) => sum + (product.quantity * product.unitPrice),
        0
      )
    }));
  },

  // Stock Movement Analysis
  async getStockMovements(timeframe = 'daily') {
    const groupByFormat = timeframe === 'daily' 
      ? 'DATE(createdAt)'
      : timeframe === 'weekly'
        ? 'WEEK(createdAt)'
        : 'MONTH(createdAt)';

    return await prisma.$queryRaw`
      SELECT 
        ${prisma.raw(groupByFormat)} as timeUnit,
        transactionType,
        SUM(quantity) as totalQuantity
      FROM inventoryTransaction
      GROUP BY timeUnit, transactionType
      ORDER BY timeUnit DESC
      LIMIT 12
    `;
  },

  // Top Performers Query
  async getTopPerformers() {
    const topProducts = await prisma.product.findMany({
      where: {
        isActive: true
      },
      include: {
        inventory: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        }
      },
      orderBy: {
        inventory: {
          _count: 'desc'
        }
      },
      take: 10
    });

    return topProducts;
  },

  // Inventory Health Analysis
  async getInventoryHealth() {
    const health = await prisma.$queryRaw`
      WITH ProductMovement AS (
        SELECT 
          p.id,
          p.name,
          p.quantity,
          p.minimumQuantity,
          p.unitPrice,
          COUNT(it.id) as transactionCount,
          SUM(CASE WHEN it.transactionType = 'OUT' THEN it.quantity ELSE 0 END) as totalOut,
          DATEDIFF(NOW(), MAX(it.createdAt)) as daysSinceLastMovement
        FROM product p
        LEFT JOIN inventoryTransaction it ON p.id = it.productId
        WHERE p.isActive = true
        GROUP BY p.id
      )
      SELECT 
        id,
        name,
        quantity,
        minimumQuantity,
        unitPrice,
        transactionCount,
        totalOut,
        daysSinceLastMovement,
        CASE 
          WHEN quantity = 0 THEN 'OUT_OF_STOCK'
          WHEN quantity <= minimumQuantity THEN 'LOW_STOCK'
          WHEN daysSinceLastMovement > 90 THEN 'SLOW_MOVING'
          WHEN totalOut > 0 THEN 'ACTIVE'
          ELSE 'INACTIVE'
        END as status
      FROM ProductMovement
      ORDER BY status, quantity DESC
    `;

    return health;
  },

  // Supplier Performance Query
  async getSupplierPerformance(timeframe = 30) {
    return await prisma.supplier.findMany({
      include: {
        products: {
          where: {
            isActive: true
          },
          include: {
            inventory: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000)
                }
              }
            }
          }
        },
        _count: {
          select: { products: true }
        }
      }
    });
  },

  // Stock Aging Analysis
  async getStockAging() {
    const aging = await prisma.$queryRaw`
      WITH LastMovement AS (
        SELECT 
          productId,
          MAX(createdAt) as lastMovementDate
        FROM inventoryTransaction
        WHERE transactionType = 'OUT'
        GROUP BY productId
      )
      SELECT 
        p.id,
        p.name,
        p.quantity,
        p.unitPrice,
        p.minimumQuantity,
        DATEDIFF(NOW(), COALESCE(lm.lastMovementDate, p.createdAt)) as daysInStock,
        (p.quantity * p.unitPrice) as stockValue,
        CASE 
          WHEN DATEDIFF(NOW(), COALESCE(lm.lastMovementDate, p.createdAt)) <= 30 THEN 'FRESH'
          WHEN DATEDIFF(NOW(), COALESCE(lm.lastMovementDate, p.createdAt)) <= 90 THEN 'NORMAL'
          WHEN DATEDIFF(NOW(), COALESCE(lm.lastMovementDate, p.createdAt)) <= 180 THEN 'AGING'
          ELSE 'DEAD_STOCK'
        END as agingStatus
      FROM product p
      LEFT JOIN LastMovement lm ON p.id = lm.productId
      WHERE p.isActive = true AND p.quantity > 0
      ORDER BY daysInStock DESC
    `;

    return aging;
  },

  // Recent Transactions Query
  async getRecentTransactions(limit = 10) {
    return await prisma.inventoryTransaction.findMany({
      include: {
        product: {
          select: {
            name: true,
            sku: true
          }
        },
        user: {
          select: {
            fullName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });
  },

  // Alert Generation Query
  async generateAlerts() {
    const [lowStock, deadStock, noMovement] = await Promise.all([
      // Low Stock Alerts
      prisma.product.findMany({
        where: {
          isActive: true,
          quantity: {
            lte: prisma.raw('minimumQuantity')
          }
        },
        select: {
          id: true,
          name: true,
          quantity: true,
          minimumQuantity: true
        }
      }),

      // Dead Stock Alerts
      prisma.$queryRaw`
        SELECT 
          p.id,
          p.name,
          p.quantity,
          p.unitPrice,
          MAX(it.createdAt) as lastMovement
        FROM product p
        LEFT JOIN inventoryTransaction it ON p.id = it.productId
        WHERE p.isActive = true
          AND p.quantity > 0
        GROUP BY p.id
        HAVING DATEDIFF(NOW(), COALESCE(lastMovement, p.createdAt)) > 180
      `,

      // No Movement Alerts
      prisma.$queryRaw`
        SELECT 
          p.id,
          p.name,
          p.quantity,
          COUNT(it.id) as movementCount
        FROM product p
        LEFT JOIN inventoryTransaction it ON p.id = it.productId
        WHERE p.isActive = true
          AND p.quantity > 0
        GROUP BY p.id
        HAVING movementCount = 0
      `
    ]);

    return {
      lowStock,
      deadStock,
      noMovement
    };
  }
};