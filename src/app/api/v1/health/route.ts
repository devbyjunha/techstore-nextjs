import { NextRequest, NextResponse } from 'next/server';
import { requireTechStoreApiKey } from '@/lib/api/auth';

/**
 * GET /api/v1/health — 연결·Webhook 캠페인 동작 확인용
 */
export async function GET(request: NextRequest) {
  const unauthorized = requireTechStoreApiKey(request);
  if (unauthorized) return unauthorized;

  return NextResponse.json({
    status: 'ok',
    service: 'techstore',
    version: 'v1',
    timestamp: new Date().toISOString(),
  });
}
