import { NextRequest, NextResponse } from 'next/server';
import { requireTechStoreApiKey } from '@/lib/api/auth';
import { listCategories } from '@/lib/api/products';

/**
 * GET /api/v1/categories — 카테고리 목록
 */
export async function GET(request: NextRequest) {
  const unauthorized = requireTechStoreApiKey(request);
  if (unauthorized) return unauthorized;

  const data = listCategories();

  return NextResponse.json({
    data,
    meta: { count: data.length },
  });
}
