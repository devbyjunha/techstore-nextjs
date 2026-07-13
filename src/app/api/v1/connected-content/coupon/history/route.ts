import { NextRequest, NextResponse } from 'next/server';
import { requireTechStoreApiKey } from '@/lib/api/auth';
import { searchCouponIssuanceRecords } from '@/lib/braze/coupon-idempotency';
import { toCouponHistoryItem } from '@/lib/braze/coupon-response';

/**
 * GET /api/v1/connected-content/coupon/history
 * Campaign Connected Content 쿠폰 발급 이력 조회 (PoC).
 */
export async function GET(request: NextRequest) {
  const unauthorized = requireTechStoreApiKey(request);
  if (unauthorized) return unauthorized;

  const params = request.nextUrl.searchParams;
  const limitRaw = Number(params.get('limit') ?? '100');
  const limit = Number.isFinite(limitRaw) ? limitRaw : 100;

  const records = searchCouponIssuanceRecords({
    campaignApiId: params.get('campaign_api_id')?.trim() || undefined,
    dispatchId: params.get('dispatch_id')?.trim() || undefined,
    promotionId: params.get('promotion_id')?.trim() || undefined,
    userId: params.get('user_id')?.trim() || undefined,
    limit,
  });

  return NextResponse.json({
    data: records.map(toCouponHistoryItem),
    meta: {
      count: records.length,
      limit: Math.min(Math.max(limit, 1), 500),
      filters: {
        campaign_api_id: params.get('campaign_api_id'),
        dispatch_id: params.get('dispatch_id'),
        promotion_id: params.get('promotion_id'),
        user_id: params.get('user_id'),
      },
    },
  });
}
