import {
  assertGiftCardCode,
  deductGiftCardBalance,
  mapLoyaltyCard,
} from '../gift-cards';

describe('gift cards', () => {
  it('maps Talon loyalty card balance and profile link', () => {
    const view = mapLoyaltyCard(
      {
        identifier: 'GIFT-1000',
        status: 'active',
        profiles: [{ integrationId: 'member@example.com' }],
        ledger: { currentBalance: 15000, pendingBalance: 0, spentBalance: 5000 },
      },
      'member@example.com'
    );

    expect(view).toEqual({
      code: 'GIFT-1000',
      status: 'active',
      balance: 15000,
      pendingBalance: 0,
      spentBalance: 5000,
      linked: true,
    });
  });

  it('detects unlinked profile correctly', () => {
    const view = mapLoyaltyCard(
      {
        identifier: 'GIFT-2000',
        status: 'active',
        profiles: [{ integrationId: 'other@example.com' }],
        ledger: { currentBalance: 10000, pendingBalance: 0, spentBalance: 0 },
      },
      'member@example.com'
    );

    expect(view?.linked).toBe(false);
  });

  it('rejects codes outside the allowed pattern', () => {
    expect(assertGiftCardCode('AB')).toBeNull();
    expect(assertGiftCardCode('GIFT-1000')).toBe('GIFT-1000');
    expect(assertGiftCardCode('   GIFT-1000   ')).toBe('GIFT-1000');
    expect(assertGiftCardCode('invalid code with spaces')).toBeNull();
  });

  it('rejects deduction with zero or negative amount', async () => {
    const zeroResult = await deductGiftCardBalance({
      profileId: 'member@example.com',
      code: 'GIFT-1000',
      amount: 0,
    });
    expect(zeroResult.ok).toBe(false);
    expect(zeroResult.status).toBe(400);

    const negResult = await deductGiftCardBalance({
      profileId: 'member@example.com',
      code: 'GIFT-1000',
      amount: -5000,
    });
    expect(negResult.ok).toBe(false);
    expect(negResult.status).toBe(400);
  });
});
