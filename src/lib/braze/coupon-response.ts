import type {
  CouponIssueResult,
  CouponIssuanceRecord,
} from './coupon-idempotency';

export interface CouponApiResponse {
  success: boolean;
  status: 'issued' | 'duplicate';
  coupon_code: string;
  discount_percent: number;
  message: string;
  campaign_api_id: string;
  dispatch_id: string;
  promotion_id: string;
  user_id: string;
  idempotency_key: string;
  issued_at: string;
  request_count: number;
  /** talon = Management Create, local = fallback generator */
  source: 'talon' | 'local';
  duplicate_request_at?: string;
}

export interface CouponHistoryItem {
  coupon_code: string;
  discount_percent: number;
  campaign_api_id: string;
  dispatch_id: string;
  promotion_id: string;
  user_id: string;
  idempotency_key: string;
  issued_at: string;
  request_count: number;
  source: 'talon' | 'local';
}

export function toCouponApiResponse(
  result: Extract<CouponIssueResult, { status: 'issued' | 'duplicate' }>
): CouponApiResponse {
  const { record } = result;
  const base = toCouponHistoryItem(record);

  if (result.status === 'issued') {
    return {
      success: true,
      status: 'issued',
      ...base,
      message:
        record.source === 'talon'
          ? `${record.discountPercent}% 할인 쿠폰이 Talon.One에서 발급되었습니다.`
          : `${record.discountPercent}% 할인 쿠폰이 발급되었습니다. (local fallback)`,
    };
  }

  return {
    success: true,
    status: 'duplicate',
    ...base,
    message:
      '동일한 캠페인 발송에 대한 쿠폰이 이미 발급되었습니다. 중복 발급이 거부되었습니다.',
    duplicate_request_at: result.duplicateRequestAt,
  };
}

export function toCouponHistoryItem(
  record: CouponIssuanceRecord
): CouponHistoryItem {
  return {
    coupon_code: record.couponCode,
    discount_percent: record.discountPercent,
    campaign_api_id: record.campaignApiId,
    dispatch_id: record.dispatchId,
    promotion_id: record.promotionId,
    user_id: record.userId,
    idempotency_key: record.idempotencyKey,
    issued_at: record.issuedAt,
    request_count: record.requestCount,
    source: record.source,
  };
}
