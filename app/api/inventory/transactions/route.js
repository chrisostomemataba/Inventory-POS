// app/api/inventory/transactions/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');
    const productId = searchParams.get('productId');

    const skip = (page - 1) * limit;

    const where = {
      ...(type && { transactionType: type }),
      ...(productId && { productId: parseInt(productId) })
    };

    const [transactions, total] = await Promise.all([
      prisma.inventoryTransaction.findMany({
        where,
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
        skip,
        take: limit
      }),
      prisma.inventoryTransaction.count({ where })
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
    try {
      const data = await request.json();
      
      const transaction = await prisma.$transaction(async (tx) => {
        // Get current product state
        const product = await tx.product.findUnique({
          where: { id: data.productId }
        });
   
        if (!product) {
          throw new Error('Product not found');
        }
   
        // Calculate new quantity
        const newQuantity = data.transactionType === 'IN'
          ? product.quantity + parseInt(data.quantity)
          : product.quantity - parseInt(data.quantity);
   
        // Validate new quantity
        if (newQuantity < 0) {
          throw new Error('Insufficient stock for this transaction');
        }
   
        // Update product quantity
        await tx.product.update({
          where: { id: data.productId },
          data: {
            quantity: newQuantity,
            updatedAt: new Date()
          }
        });
   
        // Create transaction record
        const inventoryTransaction = await tx.inventoryTransaction.create({
          data: {
            productId: data.productId,
            transactionType: data.transactionType,
            quantity: parseInt(data.quantity),
            userId: 1, // Replace with actual user ID from session
            notes: data.notes || '',
            referenceId: data.referenceId,
            referenceType: data.referenceType
          },
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
          }
        });
   
        // Create audit log
        await tx.auditLog.create({
          data: {
            userId: 1, // Replace with actual user ID
            action: 'INVENTORY_TRANSACTION',
            tableName: 'inventory_transactions',
            recordId: inventoryTransaction.id,
            newValues: {
              ...data,
              previousQuantity: product.quantity,
              newQuantity: newQuantity
            },
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
          }
        });
   
        return inventoryTransaction;
      });
   
      // Send notification if stock is low after transaction
      const product = await prisma.product.findUnique({
        where: { id: data.productId }
      });
   
      if (product.quantity <= product.minimumQuantity) {
        // Here you would implement your notification logic
        // For example, sending an email or creating a notification record
        console.log(`Low stock alert for product ${product.name}`);
      }
   
      return NextResponse.json(transaction, { status: 201 });
    } catch (error) {
      console.error('Transaction error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create transaction' },
        { status: 500 }
      );
    }
   }
   
   // Helper function to get transaction history for a product
   export async function getProductTransactionHistory(productId, limit = 10) {
    return await prisma.inventoryTransaction.findMany({
      where: {
        productId: parseInt(productId)
      },
      include: {
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
   }