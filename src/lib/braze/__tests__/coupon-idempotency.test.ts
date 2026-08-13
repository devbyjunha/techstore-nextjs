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

  it('issues a coupon on the first request', async () => {
    const result = await issueCouponWithIdempotency(baseParams);

    expect(result.status).toBe('issued');
    if (result.status !== 'issued') return;
    expect(result.record.couponCode).toMatch(/^TS-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(result.record.requestCount).toBe(1);
    expect(result.record.source).toBe('local');
  });

  it('rejects duplicate requests with the same idempotency key', async () => {
    const first = await issueCouponWithIdempotency(baseParams);
    const second = await issueCouponWithIdempotency(baseParams);

    expect(first.status).toBe('issued');
    expect(second.status).toBe('duplicate');
    if (first.status !== 'issued' || second.status !== 'duplicate') return;
    expect(second.record.couponCode).toBe(first.record.couponCode);
    expect(second.record.requestCount).toBe(2);
  });

  it('issues separate coupons for different promotion ids', async () => {
    const first = await issueCouponWithIdempotency(baseParams);
    const second = await issueCouponWithIdempotency({
      ...baseParams,
      promotionId: 'promo-winter',
    });

    expect(first.status).toBe('issued');
    expect(second.status).toBe('issued');
    if (first.status !== 'issued' || second.status !== 'issued') return;
    expect(second.record.couponCode).not.toBe(first.record.couponCode);
  });

  it('filters issuance history by promotion id', async () => {
    await issueCouponWithIdempotency(baseParams);
    await issueCouponWithIdempotency({
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
