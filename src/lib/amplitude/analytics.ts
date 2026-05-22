'use client';

import { Product } from '@/types';
import { AMPLITUDE_EVENTS } from './events';
import {
  trackAmplitudeAddToCart,
  trackAmplitudeAddToWishlist,
  trackAmplitudeEvent,
  trackAmplitudeLogin,
  trackAmplitudeLogout,
} from './client';

type AmplitudeStoreAction =
  | { type: 'ADD_TO_CART'; payload: Product }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'ADD_TO_WISHLIST'; payload: Product }
  | { type: 'REMOVE_FROM_WISHLIST'; payload: string }
  | { type: 'LOGIN'; payload: { name: string; email: string } }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_CART' };

export async function trackAmplitudeStoreAction(action: {
  type: string;
  payload?: unknown;
}): Promise<void> {
  switch (action.type) {
    case 'ADD_TO_CART':
      await trackAmplitudeAddToCart(
        (action as AmplitudeStoreAction & { type: 'ADD_TO_CART' }).payload
      );
      break;
    case 'REMOVE_FROM_CART':
      await trackAmplitudeEvent(AMPLITUDE_EVENTS.REMOVED_FROM_CART, {
        product_id: (action as AmplitudeStoreAction & { type: 'REMOVE_FROM_CART' })
          .payload,
      });
      break;
    case 'ADD_TO_WISHLIST':
      await trackAmplitudeAddToWishlist(
        (action as AmplitudeStoreAction & { type: 'ADD_TO_WISHLIST' }).payload
      );
      break;
    case 'REMOVE_FROM_WISHLIST':
      await trackAmplitudeEvent(AMPLITUDE_EVENTS.REMOVED_FROM_WISHLIST, {
        product_id: (action as AmplitudeStoreAction & { type: 'REMOVE_FROM_WISHLIST' })
          .payload,
      });
      break;
    case 'LOGIN': {
      const { email, name } = (action as AmplitudeStoreAction & { type: 'LOGIN' })
        .payload;
      await trackAmplitudeLogin(email, name);
      break;
    }
    case 'LOGOUT':
      await trackAmplitudeLogout();
      break;
    case 'CLEAR_CART':
      await trackAmplitudeEvent(AMPLITUDE_EVENTS.CART_CLEARED, {});
      break;
    default:
      break;
  }
}

export async function syncUserViaAmplitudeApi(params: {
  userId: string;
  email: string;
  name: string;
  eventName?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/2/httpapi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events: [
          {
            user_id: params.userId,
            event_type: params.eventName ?? AMPLITUDE_EVENTS.USER_LOGIN,
            event_properties: {
              email: params.email,
              name: params.name,
            },
            user_properties: {
              email: params.email,
              name: params.name,
            },
          },
        ],
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error ?? 'Amplitude API sync failed',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Amplitude API sync failed',
    };
  }
}
