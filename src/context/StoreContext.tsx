'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
  ReactNode,
} from 'react';
import { Product, CartItem, WishlistItem, Notification } from '@/types';
import { Toast } from '@/components/Toast';
import { trackAmplitudeStoreAction } from '@/lib/amplitude/analytics';
import { trackStoreAction } from '@/lib/braze/analytics';

interface StoreState {
  cart: CartItem[];
  wishlist: WishlistItem[];
  user: {
    isLoggedIn: boolean;
    name: string;
    email: string;
  };
  toasts: Toast[];
  notifications: Notification[];
}

type StoreAction =
  | { type: 'ADD_TO_CART'; payload: Product }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'ADD_TO_WISHLIST'; payload: Product }
  | { type: 'REMOVE_FROM_WISHLIST'; payload: string }
  | { type: 'LOGIN'; payload: { name: string; email: string } }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_CART' }
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }
  | { type: 'REMOVE_NOTIFICATION'; payload: string };

const initialState: StoreState = {
  cart: [],
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
      const existingItem = state.cart.find(item => item.product.id === action.payload.id);
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.product.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        };
      }
      return {
        ...state,
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
        cart: []
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
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, baseDispatch] = useReducer(storeReducer, initialState);

  const dispatch = useCallback((action: StoreAction) => {
    baseDispatch(action);
    void trackStoreAction(action);
    void trackAmplitudeStoreAction(action);
  }, []);

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
      removeNotification 
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
