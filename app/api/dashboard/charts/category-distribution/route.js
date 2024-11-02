// app/api/dashboard/charts/category-distribution/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get category distributions
    const categoryData = await prisma.$queryRaw`
      WITH CategoryMetrics AS (
        SELECT 
          c.id,
          c.name,
          COUNT(p.id) as product_count,
          SUM(p.quantity) as total_quantity,
          SUM(p.quantity * p.unitPrice) as total_value,
          SUM(
            CASE 
              WHEN p.quantity <= p.minimumQuantity THEN 1 
              ELSE 0 
            END
          ) as low_stock_count
        FROM category c
        LEFT JOIN product p ON c.id = p.categoryId
        WHERE p.isActive = true
        GROUP BY c.id, c.name
      )
      SELECT 
        *,
        total_quantity * 100.0 / (SELECT SUM(total_quantity) FROM CategoryMetrics) as quantity_percentage,
        total_value * 100.0 / (SELECT SUM(total_value) FROM CategoryMetrics) as value_percentage
      FROM CategoryMetrics
      ORDER BY total_value DESC
    `;

    // Transform data for the chart
    const transformedData = {
      valueDistribution: categoryData.map(category => ({
        name: category.name,
        value: parseFloat(category.total_value),
        percent: parseFloat(category.value_percentage),
        productCount: parseInt(category.product_count),
        lowStockCount: parseInt(category.low_stock_count)
      })),
      quantityDistribution: categoryData.map(category => ({
        name: category.name,
        value: parseInt(category.total_quantity),
        percent: parseFloat(category.quantity_percentage),
        productCount: parseInt(category.product_count),
        lowStockCount: parseInt(category.low_stock_count)
      })),
      summary: {
        totalCategories: categoryData.length,
        totalValue: categoryData.reduce((sum, cat) => 
          sum + parseFloat(cat.total_value), 0
        ),
        totalQuantity: categoryData.reduce((sum, cat) => 
          sum + parseInt(cat.total_quantity), 0
        ),
        categoriesWithLowStock: categoryData.filter(cat => 
          parseInt(cat.low_stock_count) > 0
        ).length
      }
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Category Distribution Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category distribution' },
      { status: 500 }
    );
  }
}