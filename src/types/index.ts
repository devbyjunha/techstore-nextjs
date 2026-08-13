export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number; // 원가 (할인이 있는 경우)
  discount?: number; // 할인율 (0-100)
  isOnSale?: boolean; // 특가 상품 여부
  image: string;
  category: string;
  rating: number;
  reviews: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface WishlistItem {
  product: Product;
  addedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export type OrderStatus = 'completed' | 'cancelled' | 'refunded' | 'partially_refunded';

export interface OrderRefund {
  id: string;
  items: CartItem[];
  totalValue: number;
  createdAt: Date;
}

export interface Order {
  id: string;
  cartId: string;
  checkoutId: string;
  items: CartItem[];
  totalValue: number;
  /** 할인 전 상품 합계 (Talon 연동 시) */
  subtotalValue?: number;
  /** Talon 할인 합계 */
  discountTotal?: number;
  /** 적용된 쿠폰 코드 */
  couponCodes?: string[];
  /** Talon customer session id (= cartId) */
  talonSessionId?: string;
  status: OrderStatus;
  createdAt: Date;
  /** 누적 부분·전체 환불 내역 */
  refunds?: OrderRefund[];
  /** 비회원 주문 여부 */
  isGuest: boolean;
  guestName?: string;
  guestPhone?: string;
  /** 회원 주문 시 연결 이메일 */
  userEmail?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}
