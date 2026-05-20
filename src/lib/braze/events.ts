import { Product } from '@/types';

export const BRAZE_EVENTS = {
  ADDED_TO_CART: 'added_to_cart',
  REMOVED_FROM_CART: 'removed_from_cart',
  ADDED_TO_WISHLIST: 'added_to_wishlist',
  REMOVED_FROM_WISHLIST: 'removed_from_wishlist',
  PRODUCT_VIEWED: 'product_viewed',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  CART_CLEARED: 'cart_cleared',
} as const;

export type BrazeEventName =
  (typeof BRAZE_EVENTS)[keyof typeof BRAZE_EVENTS];

export function productEventProperties(product: Product) {
  return {
    product_id: product.id,
    product_name: product.name,
    product_category: product.category,
    product_price: product.price,
    currency: 'KRW',
  };
}
