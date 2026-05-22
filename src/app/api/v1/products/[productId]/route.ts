import { NextRequest, NextResponse } from 'next/server';
import { requireTechStoreApiKey } from '@/lib/api/auth';
import { getProductById } from '@/lib/api/products';

/**
 * GET /api/v1/products/:productId — 상품 단건
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  const unauthorized = requireTechStoreApiKey(request);
  if (unauthorized) return unauthorized;

  const { productId } = await context.params;
  const product = getProductById(productId);

  if (!product) {
    return NextResponse.json(
      { error: 'Not Found', message: `Product ${productId} not found.` },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: product });
}
