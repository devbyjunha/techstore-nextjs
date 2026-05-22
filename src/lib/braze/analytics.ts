'use client';

import { Product } from '@/types';
import { BRAZE_EVENTS, productEventProperties } from './events';
import {
  logBrazeAddToCart,
  logBrazeAddToWishlist,
  logBrazeCustomEvent,
  logBrazeLogin,
  logBrazeLogout,
} from './client';

type BrazeStoreAction =
  | { type: 'ADD_TO_CART'; payload: Product }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'ADD_TO_WISHLIST'; payload: Product }
  | { type: 'REMOVE_FROM_WISHLIST'; payload: string }
  | { type: 'LOGIN'; payload: { name: string; email: string } }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_CART' };

export async function trackStoreAction(
  action: { type: string; payload?: unknown }
): Promise<void> {
  switch (action.type) {
    case 'ADD_TO_CART':
      await logBrazeAddToCart((action as BrazeStoreAction & { type: 'ADD_TO_CART' }).payload);
      break;
    case 'REMOVE_FROM_CART':
      await logBrazeCustomEvent(BRAZE_EVENTS.REMOVED_FROM_CART, {
        product_id: (action as BrazeStoreAction & { type: 'REMOVE_FROM_CART' }).payload,
      });
      break;
    case 'ADD_TO_WISHLIST':
      await logBrazeAddToWishlist((action as BrazeStoreAction & { type: 'ADD_TO_WISHLIST' }).payload);
      break;
    case 'REMOVE_FROM_WISHLIST':
      await logBrazeCustomEvent(BRAZE_EVENTS.REMOVED_FROM_WISHLIST, {
        product_id: (action as BrazeStoreAction & { type: 'REMOVE_FROM_WISHLIST' }).payload,
      });
      break;
    case 'LOGIN': {
      const { email, name } = (action as BrazeStoreAction & { type: 'LOGIN' }).payload;
      await logBrazeLogin(email, name);
      break;
    }
    case 'LOGOUT':
      await logBrazeLogout();
      break;
    case 'CLEAR_CART':
      await logBrazeCustomEvent(BRAZE_EVENTS.CART_CLEARED, {});
      break;
    default:
      break;
  }
}

export async function syncUserViaBrazeApi(params: {
  externalId: string;
  email: string;
  name: string;
  eventName?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/users/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attributes: [
          {
            external_id: params.externalId,
            email: params.email,
            first_name: params.name,
          },
        ],
        events: params.eventName
          ? [
              {
                external_id: params.externalId,
                name: params.eventName,
                properties: {
                  email: params.email,
                  name: params.name,
                },
              },
            ]
          : undefined,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error ?? 'Braze API sync failed' };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Braze API sync failed',
    };
  }
}

export { productEventProperties };
