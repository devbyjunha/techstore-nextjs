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
 * 신규 발급 시 Talon Management API Create coupons 호출
 * (TALON_ONE_MANAGEMENT_API_KEY 미설정 시 local 코드로 fallback).
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

  const result = await issueCouponWithIdempotency(parsed.params);

  if (result.status === 'error') {
    console.error(
      '[Connected Content Coupon] Talon Create failed',
      result.error
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Coupon issuance failed',
        message: result.error,
      },
      { status: result.httpStatus >= 400 ? result.httpStatus : 502 }
    );
  }

  const response = toCouponApiResponse(result);

  console.info(
    '[Connected Content Coupon]',
    JSON.stringify({
      status: response.status,
      source: response.source,
      idempotency_key: response.idempotency_key,
      request_count: response.request_count,
      method: request.method,
    })
  );

  return NextResponse.json(response);
}
