import {
  buildIdempotencyKey,
  issueCouponWithIdempotency,
  resetCouponIssuanceStore,
  searchCouponIssuanceRecords,
} from '@/lib/braze/coupon-idempotency';

const baseParams = {
  campaignApiId: 'camp-1',
  dispatchId: 'disp-9',
  promotionId: 'promo-summer',
  userId: 'user-42',
};

describe('coupon idempotency', () => {
  beforeEach(() => {
    resetCouponIssuanceStore();
  });

  it('builds a stable idempotency key with four parts', () => {
    expect(
      buildIdempotencyKey('camp-1', 'disp-9', 'promo-summer', 'user-42')
    ).toBe('camp-1:disp-9:promo-summer:user-42');
  });

  it('issues a coupon on the first request', () => {
    const result = issueCouponWithIdempotency(baseParams);

    expect(result.status).toBe('issued');
    expect(result.record.couponCode).toMatch(/^TS-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(result.record.requestCount).toBe(1);
  });

  it('rejects duplicate requests with the same idempotency key', () => {
    const first = issueCouponWithIdempotency(baseParams);
    const second = issueCouponWithIdempotency(baseParams);

    expect(first.status).toBe('issued');
    expect(second.status).toBe('duplicate');
    expect(second.record.couponCode).toBe(first.record.couponCode);
    expect(second.record.requestCount).toBe(2);
  });

  it('issues separate coupons for different promotion ids', () => {
    const first = issueCouponWithIdempotency(baseParams);
    const second = issueCouponWithIdempotency({
      ...baseParams,
      promotionId: 'promo-winter',
    });

    expect(first.status).toBe('issued');
    expect(second.status).toBe('issued');
    expect(second.record.couponCode).not.toBe(first.record.couponCode);
  });

  it('filters issuance history by promotion id', () => {
    issueCouponWithIdempotency(baseParams);
    issueCouponWithIdempotency({
      ...baseParams,
      promotionId: 'promo-winter',
      userId: 'user-99',
    });

    const filtered = searchCouponIssuanceRecords({
      promotionId: 'promo-summer',
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.promotionId).toBe('promo-summer');
  });
});
