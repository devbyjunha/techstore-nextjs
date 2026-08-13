import { mapTalonEffects } from '../map-effects';

describe('mapTalonEffects', () => {
  it('sums setDiscount effects and maps coupon accept/reject', () => {
    const result = mapTalonEffects(
      [
        {
          campaignId: 1,
          effectType: 'setDiscount',
          props: { name: '10% off', value: 10000 },
        },
        {
          campaignId: 2,
          effectType: 'setDiscount',
          props: { name: 'welcome10', value: 5000 },
        },
        {
          effectType: 'acceptCoupon',
          props: { value: 'WELCOME10' },
        },
        {
          effectType: 'rejectCoupon',
          props: { value: 'BADCODE', rejectionReason: 'CouponNotFound' },
        },
        {
          effectType: 'addLoyaltyPoints',
          props: { value: 150 },
        },
      ],
      {
        sessionId: 'cart_1',
        subtotal: 100000,
        requestedCoupons: ['WELCOME10', 'BADCODE'],
      }
    );

    expect(result.totalDiscount).toBe(15000);
    expect(result.total).toBe(85000);
    expect(result.loyalty.willEarn).toBe(150);
    expect(result.coupons).toEqual([
      { code: 'WELCOME10', accepted: true, rejectionReason: null },
      {
        code: 'BADCODE',
        accepted: false,
        rejectionReason: 'CouponNotFound',
      },
    ]);
  });

  it('caps discount at subtotal', () => {
    const result = mapTalonEffects(
      [
        {
          effectType: 'setDiscount',
          props: { name: 'too much', value: 999999 },
        },
      ],
      { sessionId: 'cart_1', subtotal: 1000, requestedCoupons: [] }
    );
    expect(result.totalDiscount).toBe(1000);
    expect(result.total).toBe(0);
  });
});
