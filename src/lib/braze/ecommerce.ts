import { CartItem, Product } from '@/types';

/**
 * Braze eCommerce recommended events.
 *
 * Names are exact, case-sensitive, and dot-delimited. They must match these
 * canonical values exactly or Braze treats them as ordinary custom events and
 * skips eCommerce post-processing (revenue, cart state, abandoned-cart triggers).
 *
 * @see https://www.braze.com/docs/user_guide/data/activation/events/recommended_events/
 */
export const ECOMMERCE_EVENTS = {
  PRODUCT_VIEWED: 'ecommerce.product_viewed',
  CART_UPDATED: 'ecommerce.cart_updated',
  CHECKOUT_STARTED: 'ecommerce.checkout_started',
  ORDER_PLACED: 'ecommerce.order_placed',
  ORDER_CANCELLED: 'ecommerce.order_cancelled',
  ORDER_REFUNDED: 'ecommerce.order_refunded',
} as const;

export type EcommerceEventName =
  (typeof ECOMMERCE_EVENTS)[keyof typeof ECOMMERCE_EVENTS];

/** This storefront prices everything in Korean won. KRW is a valid ISO 4217 code. */
export const ECOMMERCE_CURRENCY = 'KRW';

/** Identifies where the event originated, per the Braze `source` requirement. */
export const ECOMMERCE_SOURCE = 'web';

/**
 * Recommended events use a strict schema: extra top-level properties fail
 * validation. Any custom dimensions must live inside a `metadata` object, so
 * the value type allows nested objects and arrays.
 */
export type EcommercePropertyValue =
  | string
  | number
  | boolean
  | null
  | EcommercePropertyValue[]
  | { [key: string]: EcommercePropertyValue };

export type EcommerceProperties = Record<string, EcommercePropertyValue>;

export interface BrazeLineItem extends EcommerceProperties {
  product_id: string;
  product_name: string;
  variant_id: string;
  image_url: string;
  product_url: string;
  quantity: number;
  price: number;
  metadata: { category: string };
}

/**
 * Maps the storefront's `Product` to a Braze `products[]` line item.
 *
 * The catalog has no per-variant SKUs, so `variant_id` reuses the product id.
 * Anything outside the strict schema (category) goes inside `metadata`.
 */
export function buildLineItem(product: Product, quantity: number): BrazeLineItem {
  return {
    product_id: product.id,
    product_name: product.name,
    variant_id: product.id,
    image_url: product.image,
    product_url: `/product/${product.id}`,
    quantity,
    price: product.price,
    metadata: { category: product.category },
  };
}

export function buildLineItems(cart: CartItem[]): BrazeLineItem[] {
  return cart.map((item) => buildLineItem(item.product, item.quantity));
}

export function cartTotalValue(cart: CartItem[]): number {
  return cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
}

/** `ecommerce.product_viewed` — fire when a product detail page is viewed. */
export function buildProductViewedProperties(product: Product): EcommerceProperties {
  return {
    product_id: product.id,
    product_name: product.name,
    variant_id: product.id,
    image_url: product.image,
    product_url: `/product/${product.id}`,
    price: product.price,
    currency: ECOMMERCE_CURRENCY,
    source: ECOMMERCE_SOURCE,
    metadata: { category: product.category },
  };
}

/**
 * `ecommerce.cart_updated` — full cart replacement.
 *
 * We always send the complete cart (`action: replace`) because the storefront
 * holds the full cart state, which keeps the Braze cart object consistent and
 * always satisfies the `total_value` requirement.
 */
export function buildCartUpdatedProperties(params: {
  cartId: string;
  cart: CartItem[];
}): EcommerceProperties {
  return {
    cart_id: params.cartId,
    action: 'replace',
    total_value: cartTotalValue(params.cart),
    currency: ECOMMERCE_CURRENCY,
    source: ECOMMERCE_SOURCE,
    products: buildLineItems(params.cart),
  };
}

/** `ecommerce.checkout_started` — fire when the user enters the checkout flow. */
export function buildCheckoutStartedProperties(params: {
  checkoutId: string;
  cartId: string;
  cart: CartItem[];
}): EcommerceProperties {
  return {
    checkout_id: params.checkoutId,
    cart_id: params.cartId,
    total_value: cartTotalValue(params.cart),
    currency: ECOMMERCE_CURRENCY,
    source: ECOMMERCE_SOURCE,
    products: buildLineItems(params.cart),
  };
}

/** `ecommerce.order_placed` — primary revenue event; increments Total Revenue/Orders. */
export function buildOrderPlacedProperties(params: {
  orderId: string;
  cartId: string;
  cart: CartItem[];
}): EcommerceProperties {
  return {
    order_id: params.orderId,
    cart_id: params.cartId,
    total_value: cartTotalValue(params.cart),
    currency: ECOMMERCE_CURRENCY,
    source: ECOMMERCE_SOURCE,
    products: buildLineItems(params.cart),
  };
}

/** `ecommerce.order_cancelled` — decrements Total Orders. `cancel_reason` is required. */
export function buildOrderCancelledProperties(params: {
  orderId: string;
  items: CartItem[];
  totalValue: number;
  cancelReason: string;
}): EcommerceProperties {
  return {
    order_id: params.orderId,
    total_value: params.totalValue,
    currency: ECOMMERCE_CURRENCY,
    cancel_reason: params.cancelReason,
    source: ECOMMERCE_SOURCE,
    products: buildLineItems(params.items),
  };
}

/**
 * `ecommerce.order_refunded` — decrements Total Revenue, increments Total Refunds.
 * `total_value` must be the refunded amount (the full order total for a full refund).
 */
export function buildOrderRefundedProperties(params: {
  orderId: string;
  items: CartItem[];
  totalValue: number;
}): EcommerceProperties {
  return {
    order_id: params.orderId,
    total_value: params.totalValue,
    currency: ECOMMERCE_CURRENCY,
    source: ECOMMERCE_SOURCE,
    products: buildLineItems(params.items),
  };
}
