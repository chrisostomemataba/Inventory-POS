// app/api/inventory/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all products
export async function GET(request) {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        supplier: true,
        inventory: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST new product
export async function POST(request) {
  try {
    const data = await request.json();
    
    // Start a transaction
    const product = await prisma.$transaction(async (prisma) => {
      // Create the product
      const newProduct = await prisma.product.create({
        data: {
          name: data.name,
          description: data.description,
          barcode: data.barcode,
          sku: generateSKU(data.name),
          unitPrice: parseFloat(data.unitPrice),
          costPrice: parseFloat(data.costPrice),
          quantity: parseInt(data.quantity),
          minimumQuantity: parseInt(data.minimumQuantity),
          maximumQuantity: data.maximumQuantity ? parseInt(data.maximumQuantity) : null,
          categoryId: parseInt(data.categoryId),
          supplierId: data.supplierId ? parseInt(data.supplierId) : null,
          isActive: true
        }
      });

      // Create inventory transaction record
      await prisma.inventoryTransaction.create({
        data: {
          productId: newProduct.id,
          transactionType: 'IN',
          quantity: parseInt(data.quantity),
          userId: 1, // Replace with actual user ID from session
          notes: 'Initial stock entry'
        }
      });

      return newProduct;
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

// app/api/inventory/[id]/route.js
export async function PUT(request, { params }) {
  try {
    const id = parseInt(params.id);
    const data = await request.json();
    
    // Get current product to compare quantities
    const currentProduct = await prisma.product.findUnique({
      where: { id }
    });

    const updatedProduct = await prisma.$transaction(async (prisma) => {
      // Update the product
      const product = await prisma.product.update({
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
        }
      });

      // Create inventory transaction if quantity changed
      const quantityDifference = parseInt(data.quantity) - currentProduct.quantity;
      if (quantityDifference !== 0) {
        await prisma.inventoryTransaction.create({
          data: {
            productId: id,
            transactionType: quantityDifference > 0 ? 'IN' : 'OUT',
            quantity: Math.abs(quantityDifference),
            userId: 1, // Replace with actual user ID from session
            notes: `Quantity adjusted from ${currentProduct.quantity} to ${data.quantity}`
          }
        });
      }

      return product;
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id);
    
    await prisma.$transaction(async (prisma) => {
      // Create final inventory transaction
      await prisma.inventoryTransaction.create({
        data: {
          productId: id,
          transactionType: 'OUT',
          quantity: 0,
          userId: 1, // Replace with actual user ID from session
          notes: 'Product deleted'
        }
      });

      // Soft delete the product
      await prisma.product.update({
        where: { id },
        data: {
          isActive: false,
          quantity: 0
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

function generateSKU(productName) {
  const prefix = productName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${timestamp}`;
}