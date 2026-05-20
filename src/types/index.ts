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

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}
