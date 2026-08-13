import type { CartItem } from '@/types';
import { getBrazeExternalUserId } from '@/lib/braze/client';
import { cartSubtotal, mapCartItemsToTalon, resolveTalonProfileId } from './map-cart';
import type { EvaluateSessionResponse, TalonSessionState } from './types';

const COUPON_STORAGE_KEY = 'techstore-talon-coupon';

export function loadStoredCouponCode(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem(COUPON_STORAGE_KEY) ?? '';
}

export function saveStoredCouponCode(code: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = code.trim();
  if (trimmed) {
    sessionStorage.setItem(COUPON_STORAGE_KEY, trimmed);
  } else {
    sessionStorage.removeItem(COUPON_STORAGE_KEY);
  }
}

export function clearStoredCouponCode(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(COUPON_STORAGE_KEY);
}

export async function requestTalonSession(params: {
  sessionId: string;
  cart: CartItem[];
  isLoggedIn: boolean;
  email?: string;
  membershipTier?: string;
  couponCodes?: string[];
  state?: TalonSessionState;
}): Promise<EvaluateSessionResponse> {
  const subtotal = cartSubtotal(params.cart);
  const brazeExternalId = await getBrazeExternalUserId();
  const profileId = resolveTalonProfileId({
    isLoggedIn: params.isLoggedIn,
    email: params.email,
    sessionId: params.sessionId,
    brazeExternalId,
  });

  const response = await fetch('/api/v1/talon/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: params.sessionId,
      profileId,
      state: params.state ?? 'open',
      cartItems: mapCartItemsToTalon(params.cart),
      couponCodes: params.couponCodes?.filter(Boolean),
      membershipTier: params.membershipTier,
      subtotal,
    }),
  });

  const data = (await response.json()) as EvaluateSessionResponse;
  if (!response.ok) {
    return {
      sessionId: params.sessionId,
      subtotal,
      totalDiscount: 0,
      total: subtotal,
      coupons: [],
      effects: [],
      loyalty: { willEarn: 0 },
      configured: data.configured ?? false,
      error: data.error ?? `Talon session failed (${response.status})`,
    };
  }
  return data;
}

/** Close or cancel a Talon session (best-effort; does not throw). */
export async function finalizeTalonSession(params: {
  sessionId: string;
  cart: CartItem[];
  isLoggedIn: boolean;
  email?: string;
  membershipTier?: string;
  couponCodes?: string[];
  state: 'closed' | 'cancelled';
}): Promise<EvaluateSessionResponse | null> {
  if (!params.sessionId || params.cart.length === 0) {
    return null;
  }
  try {
    return await requestTalonSession(params);
  } catch {
    return null;
  }
}
