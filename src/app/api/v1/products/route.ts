import { NextRequest, NextResponse } from 'next/server';
import { requireTechStoreApiKey } from '@/lib/api/auth';
import { listProducts } from '@/lib/api/products';

/**
 * GET /api/v1/products — 상품 목록
 * Query: category (slug), sale_only (true), limit (number)
 */
export async function GET(request: NextRequest) {
  const unauthorized = requireTechStoreApiKey(request);
  if (unauthorized) return unauthorized;

  const { searchParams } = request.nextUrl;
  const category = searchParams.get('category');
  const saleOnly = searchParams.get('sale_only') === 'true';
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

  const data = listProducts({
    categorySlug: category,
    saleOnly,
    limit: Number.isFinite(limit) ? limit : undefined,
  });

  return NextResponse.json({
    data,
    meta: {
      count: data.length,
      category: category ?? null,
      sale_only: saleOnly,
    },
  });
}
