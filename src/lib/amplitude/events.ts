import { Product } from '@/types';

export const AMPLITUDE_EVENTS = {
  ADDED_TO_CART: 'Added to Cart',
  REMOVED_FROM_CART: 'Removed from Cart',
  ADDED_TO_WISHLIST: 'Added to Wishlist',
  REMOVED_FROM_WISHLIST: 'Removed from Wishlist',
  PRODUCT_VIEWED: 'Product Viewed',
  USER_LOGIN: 'User Login',
  USER_LOGOUT: 'User Logout',
  CART_CLEARED: 'Cart Cleared',
} as const;

export type AmplitudeEventName =
  (typeof AMPLITUDE_EVENTS)[keyof typeof AMPLITUDE_EVENTS];

export function productEventProperties(product: Product) {
  return {
    product_id: product.id,
    product_name: product.name,
    product_category: product.category,
    product_price: product.price,
    currency: 'KRW',
  };
}
