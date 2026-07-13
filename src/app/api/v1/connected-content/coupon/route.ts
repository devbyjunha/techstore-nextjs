import { NextRequest, NextResponse } from 'next/server';
import { verifyConnectedContentAuth } from '@/lib/braze/connected-content-auth';
import { issueCouponWithIdempotency } from '@/lib/braze/coupon-idempotency';
import { toCouponApiResponse } from '@/lib/braze/coupon-response';
import { parseCouponRequest } from '@/lib/braze/parse-coupon-request';

/**
 * POST /api/v1/connected-content/coupon
 * Braze Campaign Connected Content 쿠폰 발급 PoC.
 *
 * 멱등성 키: campaign_api_id + dispatch_id + promotion_id + user_id
 * 동일 조합 재호출 시 duplicate로 거부 (Braze Connected Content 중복 호출 대응).
 */
export async function POST(request: NextRequest) {
  return handleCouponIssue(request);
}

/**
 * GET — 로컬 테스트용. Braze Connected Content에서는 POST 권장 (GET은 Braze 캐시 대상).
 */
export async function GET(request: NextRequest) {
  return handleCouponIssue(request);
}

async function handleCouponIssue(request: NextRequest) {
  const unauthorized = verifyConnectedContentAuth(request);
  if (unauthorized) return unauthorized;

  const parsed = await parseCouponRequest(request);
  if (!parsed.ok) {
    return NextResponse.json(
      { success: false, error: 'Bad Request', message: parsed.message },
      { status: 400 }
    );
  }

  const result = issueCouponWithIdempotency(parsed.params);
  const response = toCouponApiResponse(result);

  console.info(
    '[Connected Content Coupon]',
    JSON.stringify({
      status: response.status,
      idempotency_key: response.idempotency_key,
      request_count: response.request_count,
      method: request.method,
    })
  );

  return NextResponse.json(response);
}
