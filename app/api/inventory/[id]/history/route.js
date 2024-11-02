
<antArtifact identifier="product-history-route" type="application/vnd.ant.code" language="javascript" title="Product History Route"></antArtifact>

// app/api/inventory/[id]/history/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id);
    
    const history = await prisma.inventoryTransaction.findMany({
      where: {
        productId: id
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
      }
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching inventory history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory history' },
      { status: 500 }
    );
  }
}