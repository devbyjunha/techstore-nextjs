import type { CartItem } from '@/types';
import type { TalonCartItemInput } from './types';

export function mapCartItemsToTalon(cart: CartItem[]): TalonCartItemInput[] {
  return cart.map((item) => ({
    sku: item.product.id,
    name: item.product.name,
    quantity: item.quantity,
    price: item.product.price,
    category: item.product.category,
  }));
}

export function cartSubtotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
}

/**
 * Talon profileId 우선순위:
 * 1) Braze external_id (`changeUser` / getUserId)
 * 2) 로그인 email (changeUser에 넣는 값과 동일 — fallback)
 * 3) guest_{sessionId}
 */
export function resolveTalonProfileId(params: {
  isLoggedIn: boolean;
  email?: string;
  sessionId: string;
  brazeExternalId?: string | null;
}): string {
  const brazeId = params.brazeExternalId?.trim();
  if (brazeId) {
    return brazeId;
  }

  if (params.isLoggedIn && params.email?.trim()) {
    return params.email.trim();
  }

  return `guest_${params.sessionId}`;
}
