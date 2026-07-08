'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  ReactNode,
} from 'react';
// NOTE: useRef is retained for the cart-hydration guard only (cartHydrated).
import { Product, CartItem, WishlistItem, Notification, Order, OrderRefund } from '@/types';
import { Toast } from '@/components/Toast';
import { trackAmplitudeStoreAction } from '@/lib/amplitude/analytics';
import { trackStoreAction } from '@/lib/braze/analytics';
import {
  logBrazeCartUpdated,
  logBrazeCheckoutStarted,
  logBrazeOrderCancelled,
  logBrazeOrderPlaced,
  logBrazeOrderRefunded,
} from '@/lib/braze/client';
import { generateOrderNumber } from '@/lib/orders/order-number';
import {
  findOrderByNumber,
  loadOrdersFromStorage,
  saveOrdersToStorage,
} from '@/lib/orders/storage';
import { getRemainingItems, lineItemsTotal } from '@/lib/orders/refund';

export interface PlaceOrderParams {
  guestName?: string;
  guestPhone?: string;
}

interface StoreState {
  cart: CartItem[];
  cartId: string;
  checkoutId: string;
  orders: Order[];
  wishlist: WishlistItem[];
  user: {
    isLoggedIn: boolean;
    name: string;
    email: string;
  };
  toasts: Toast[];
  notifications: Notification[];
}

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 11)}`;
}

function cartTotal(cart: CartItem[]): number {
  return cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
}

type StoreAction =
  | { type: 'ADD_TO_CART'; payload: Product }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'ADD_TO_WISHLIST'; payload: Product }
  | { type: 'REMOVE_FROM_WISHLIST'; payload: string }
  | { type: 'LOGIN'; payload: { name: string; email: string; membershipTier?: string } }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_CART' }
  | { type: 'START_CHECKOUT'; payload: { checkoutId: string } }
  | { type: 'PLACE_ORDER'; payload: Order }
  | { type: 'CANCEL_ORDER'; payload: { orderId: string } }
  | { type: 'REFUND_ORDER'; payload: { orderId: string; refund: OrderRefund } }
  | { type: 'HYDRATE_ORDERS'; payload: Order[] }
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }
  | { type: 'REMOVE_NOTIFICATION'; payload: string };

const initialState: StoreState = {
  cart: [],
  cartId: '',
  checkoutId: '',
  orders: [],
  wishlist: [],
  user: {
    isLoggedIn: false,
    name: '',
    email: ''
  },
  toasts: [],
  notifications: []
};

function storeReducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case 'ADD_TO_CART': {
      // A cart_id is shared across cart, checkout, and order events. Create one
      // lazily when the cart goes from empty to non-empty.
      const cartId = state.cartId || generateId('cart');
      const existingItem = state.cart.find(item => item.product.id === action.payload.id);
      if (existingItem) {
        return {
          ...state,
          cartId,
          cart: state.cart.map(item =>
            item.product.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        };
      }
      return {
        ...state,
        cartId,
        cart: [...state.cart, { product: action.payload, quantity: 1 }]
      };
    }
    
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.product.id !== action.payload)
      };
    
    case 'UPDATE_CART_QUANTITY':
      return {
        ...state,
        cart: state.cart.map(item =>
          item.product.id === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ).filter(item => item.quantity > 0)
      };
    
    case 'ADD_TO_WISHLIST': {
      const existingItem = state.wishlist.find(item => item.product.id === action.payload.id);
      if (existingItem) return state;
      return {
        ...state,
        wishlist: [...state.wishlist, { product: action.payload, addedAt: new Date() }]
      };
    }
    
    case 'REMOVE_FROM_WISHLIST':
      return {
        ...state,
        wishlist: state.wishlist.filter(item => item.product.id !== action.payload)
      };
    
    case 'LOGIN':
      return {
        ...state,
        user: {
          isLoggedIn: true,
          name: action.payload.name,
          email: action.payload.email
        }
      };
    
    case 'LOGOUT':
      return {
        ...state,
        user: {
          isLoggedIn: false,
          name: '',
          email: ''
        }
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        cart: [],
        cartId: '',
        checkoutId: ''
      };

    case 'START_CHECKOUT':
      return {
        ...state,
        checkoutId: action.payload.checkoutId
      };

    case 'PLACE_ORDER':
      return {
        ...state,
        orders: [action.payload, ...state.orders],
        cart: [],
        cartId: '',
        checkoutId: ''
      };

    case 'CANCEL_ORDER':
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.payload.orderId
            ? { ...order, status: 'cancelled' }
            : order
        )
      };

    case 'REFUND_ORDER': {
      const { orderId, refund } = action.payload;
      return {
        ...state,
        orders: state.orders.map((order) => {
          if (order.id !== orderId) {
            return order;
          }
          const refunds = [...(order.refunds ?? []), refund];
          const withRefunds = { ...order, refunds };
          const remaining = getRemainingItems(withRefunds);
          const status = remaining.length === 0 ? 'refunded' : 'partially_refunded';
          return { ...withRefunds, status };
        }),
      };
    }

    case 'HYDRATE_ORDERS':
      return {
        ...state,
        orders: action.payload,
      };
    
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, action.payload]
      };
    
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.payload)
      };
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications]
      };
    
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, isRead: true }
            : notification
        )
      };
    
    case 'MARK_ALL_NOTIFICATIONS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification => ({
          ...notification,
          isRead: true
        }))
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(notification => notification.id !== action.payload)
      };
    
    default:
      return state;
  }
}

interface StoreContextType {
  state: StoreState;
  dispatch: React.Dispatch<StoreAction>;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  removeNotification: (notificationId: string) => void;
  startCheckout: () => string;
  placeOrder: (params?: PlaceOrderParams) => Order | null;
  findOrder: (orderNumber: string) => Order | undefined;
  cancelOrder: (orderId: string, cancelReason?: string) => void;
  refundOrder: (orderId: string, refundItems: CartItem[]) => boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, baseDispatch] = useReducer(storeReducer, initialState);
  const skipNextOrdersSave = useRef(true);

  useEffect(() => {
    const stored = loadOrdersFromStorage();
    baseDispatch({ type: 'HYDRATE_ORDERS', payload: stored });
  }, []);

  useEffect(() => {
    if (skipNextOrdersSave.current) {
      skipNextOrdersSave.current = false;
      return;
    }
    saveOrdersToStorage(state.orders);
  }, [state.orders]);

  const dispatch = useCallback((action: StoreAction) => {
    if (action.type === 'CLEAR_CART' && state.cartId) {
      void logBrazeCartUpdated({ cartId: state.cartId, cart: [] });
    }
    baseDispatch(action);
    void trackStoreAction(action);
    void trackAmplitudeStoreAction(action);
  }, [state.cartId]);

  // Fire `ecommerce.cart_updated` whenever cart contents change (including empty cart).
  const cartHydrated = useRef(false);
  useEffect(() => {
    if (!cartHydrated.current) {
      cartHydrated.current = true;
      return;
    }
    if (!state.cartId) {
      return;
    }
    void logBrazeCartUpdated({ cartId: state.cartId, cart: state.cart });
  }, [state.cart, state.cartId]);

  const startCheckout = useCallback((): string => {
    const checkoutId = generateId('chk');
    baseDispatch({ type: 'START_CHECKOUT', payload: { checkoutId } });
    void logBrazeCheckoutStarted({
      checkoutId,
      cartId: state.cartId,
      cart: state.cart,
    });
    return checkoutId;
  }, [state.cartId, state.cart]);

  const placeOrder = useCallback((params?: PlaceOrderParams): Order | null => {
    if (state.cart.length === 0) {
      return null;
    }
    const createdAt = new Date();
    const existingIds = state.orders.map((o) => o.id);
    const isGuest = !state.user.isLoggedIn;

    const order: Order = {
      id: generateOrderNumber(createdAt, existingIds),
      cartId: state.cartId,
      checkoutId: state.checkoutId,
      items: state.cart,
      totalValue: cartTotal(state.cart),
      status: 'completed',
      createdAt,
      isGuest,
      guestName: isGuest ? params?.guestName?.trim() || undefined : undefined,
      guestPhone: isGuest ? params?.guestPhone?.trim() || undefined : undefined,
      userEmail: state.user.isLoggedIn ? state.user.email : undefined,
      refunds: [],
    };
    // Fire before dispatch so the event captures the cart prior to clearing.
    void logBrazeOrderPlaced({
      orderId: order.id,
      cartId: order.cartId,
      cart: order.items,
    });
    baseDispatch({ type: 'PLACE_ORDER', payload: order });
    return order;
  }, [state.cart, state.cartId, state.checkoutId, state.orders, state.user]);

  const findOrder = useCallback(
    (orderNumber: string): Order | undefined => {
      return (
        state.orders.find(
          (o) => o.id.toUpperCase() === orderNumber.trim().toUpperCase().replace(/\s+/g, '')
        ) ?? findOrderByNumber(orderNumber, state.orders)
      );
    },
    [state.orders]
  );

  const cancelOrder = useCallback(
    (orderId: string, cancelReason = 'customer_request') => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) {
        return;
      }
      void logBrazeOrderCancelled({
        orderId: order.id,
        items: order.items,
        totalValue: order.totalValue,
        cancelReason,
      });
      baseDispatch({ type: 'CANCEL_ORDER', payload: { orderId } });
    },
    [state.orders]
  );

  const refundOrder = useCallback((orderId: string, refundItems: CartItem[]): boolean => {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order || refundItems.length === 0) {
      return false;
    }

    const remaining = getRemainingItems(order);
    const valid = refundItems.every((refundLine) => {
      const available = remaining.find((r) => r.product.id === refundLine.product.id);
      return available && refundLine.quantity > 0 && refundLine.quantity <= available.quantity;
    });
    if (!valid) {
      return false;
    }

    const refundValue = lineItemsTotal(refundItems);
    const refund: OrderRefund = {
      id: generateId('rfnd'),
      items: refundItems,
      totalValue: refundValue,
      createdAt: new Date(),
    };

    void logBrazeOrderRefunded({
      orderId: order.id,
      items: refundItems,
      totalValue: refundValue,
    });
    baseDispatch({ type: 'REFUND_ORDER', payload: { orderId, refund } });
    return true;
  }, [state.orders]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    dispatch({ type: 'ADD_TOAST', payload: { ...toast, id } });
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    dispatch({ 
      type: 'ADD_NOTIFICATION', 
      payload: { 
        ...notification, 
        id, 
        createdAt: new Date() 
      } 
    });
  };

  const markNotificationRead = (notificationId: string) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notificationId });
  };

  const markAllNotificationsRead = () => {
    dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' });
  };

  const removeNotification = (notificationId: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: notificationId });
  };

  return (
    <StoreContext.Provider value={{ 
      state, 
      dispatch, 
      addToast, 
      addNotification, 
      markNotificationRead, 
      markAllNotificationsRead, 
      removeNotification,
      startCheckout,
      placeOrder,
      findOrder,
      cancelOrder,
      refundOrder
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
