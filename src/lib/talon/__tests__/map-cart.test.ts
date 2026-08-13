import { resolveTalonProfileId } from '../map-cart';

describe('resolveTalonProfileId', () => {
  it('prefers Braze external_id over email', () => {
    expect(
      resolveTalonProfileId({
        isLoggedIn: true,
        email: 'user@example.com',
        sessionId: 'cart_1',
        brazeExternalId: 'bluejunha',
      })
    ).toBe('bluejunha');
  });

  it('falls back to login email when Braze id is missing', () => {
    expect(
      resolveTalonProfileId({
        isLoggedIn: true,
        email: 'user@example.com',
        sessionId: 'cart_1',
      })
    ).toBe('user@example.com');
  });

  it('uses guest session id when anonymous', () => {
    expect(
      resolveTalonProfileId({
        isLoggedIn: false,
        sessionId: 'cart_abc',
      })
    ).toBe('guest_cart_abc');
  });
});
