// app/api/inventory/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id);
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
        inventory: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const id = parseInt(params.id);
    const data = await request.json();
    
    const product = await prisma.$transaction(async (tx) => {
      // Get current product state for comparison
      const currentProduct = await tx.product.findUnique({
        where: { id }
      });

      // Update product
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          barcode: data.barcode,
          unitPrice: parseFloat(data.unitPrice),
          costPrice: parseFloat(data.costPrice),
          quantity: parseInt(data.quantity),
          minimumQuantity: parseInt(data.minimumQuantity),
          maximumQuantity: data.maximumQuantity ? parseInt(data.maximumQuantity) : null,
          categoryId: parseInt(data.categoryId),
          supplierId: data.supplierId ? parseInt(data.supplierId) : null
        },
        include: {
          category: true,
          supplier: true
        }
      });

      // Create inventory transaction if quantity changed
      const quantityDifference = parseInt(data.quantity) - currentProduct.quantity;
      if (quantityDifference !== 0) {
        await tx.inventoryTransaction.create({
          data: {
            productId: id,
            transactionType: quantityDifference > 0 ? 'IN' : 'OUT',
            quantity: Math.abs(quantityDifference),
            userId: 1, // Replace with actual user ID
            notes: `Quantity adjusted from ${currentProduct.quantity} to ${data.quantity}`
          }
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: 1, // Replace with actual user ID
          action: 'UPDATE',
          tableName: 'products',
          recordId: id,
          oldValues: currentProduct,
          newValues: data,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        }
      });

      return updatedProduct;
    });

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id);
    
    await prisma.$transaction(async (tx) => {
      // Soft delete the product
      await tx.product.update({
        where: { id },
        data: {
          isActive: false,
          quantity: 0
        }
      });

      // Create final inventory transaction
      await tx.inventoryTransaction.create({
        data: {
          productId: id,
          transactionType: 'OUT',
          quantity: 0,
          userId: 1, // Replace with actual user ID
          notes: 'Product deleted'
        }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: 1, // Replace with actual user ID
          action: 'DELETE',
          tableName: 'products',
          recordId: id,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}