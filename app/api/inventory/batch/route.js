<antArtifact identifier="batch-upload-route" type="application/vnd.ant.code" language="javascript" title="Batch Upload Route"></antArtifact>
// app/api/inventory/batch/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const { product, existingProductId, action } = await request.json();

    if (action === 'update' && existingProductId) {
      // Update existing product
      const updatedProduct = await prisma.product.update({
        where: { id: existingProductId },
        data: {
          quantity: {
            increment: parseInt(product.quantity) || 0
          },
          unitPrice: parseFloat(product.unitPrice) || undefined,
          // Add other fields as needed
        }
      });

      // Create inventory transaction
      await prisma.inventoryTransaction.create({
        data: {
          productId: existingProductId,
          transactionType: 'IN',
          quantity: parseInt(product.quantity) || 0,
          userId: 1, // Replace with actual user ID
          notes: 'Bulk upload update'
        }
      });

      return NextResponse.json(updatedProduct);
    } else {
      // Create new product
      const category = await prisma.category.findFirst({
        where: {
          name: {
            contains: product.category,
            mode: 'insensitive'
          }
        }
      });

      const newProduct = await prisma.product.create({
        data: {
          name: product.name,
          quantity: parseInt(product.quantity) || 0,
          unitPrice: parseFloat(product.unitPrice) || 0,
          categoryId: category?.id || 1, // Default category if not found
          // Add other fields as needed
          isActive: true
        }
      });

      // Create inventory transaction
      await prisma.inventoryTransaction.create({
        data: {
          productId: newProduct.id,
          transactionType: 'IN',
          quantity: parseInt(product.quantity) || 0,
          userId: 1, // Replace with actual user ID
          notes: 'Bulk upload creation'
        }
      });

      return NextResponse.json(newProduct);
    }
  } catch (error) {
    console.error('Batch processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process product' },
      { status: 500 }
    );
  }
}