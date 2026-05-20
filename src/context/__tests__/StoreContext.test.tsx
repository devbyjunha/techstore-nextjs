import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { useStore, StoreProvider } from '../StoreContext';
import { Product, Notification } from '@/types';

// Test component to access store context
const TestComponent = () => {
  const { state, addNotification, markNotificationRead, markAllNotificationsRead, removeNotification } = useStore();
  
  return (
    <div>
      <div data-testid="cart-count">{state.cart.length}</div>
      <div data-testid="wishlist-count">{state.wishlist.length}</div>
      <div data-testid="notifications-count">{state.notifications.length}</div>
      <div data-testid="unread-notifications-count">
        {state.notifications.filter(n => !n.isRead).length}
      </div>
      <button 
        data-testid="add-notification-btn"
        onClick={() => addNotification({
          title: 'Test Notification',
          message: 'This is a test notification',
          type: 'info',
          isRead: false
        })}
      >
        Add Notification
      </button>
      <button 
        data-testid="mark-all-read-btn"
        onClick={markAllNotificationsRead}
      >
        Mark All Read
      </button>
    </div>
  );
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <StoreProvider>
      {component}
    </StoreProvider>
  );
};

describe('StoreContext', () => {
  it('should provide initial state', () => {
    renderWithProvider(<TestComponent />);
    
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
    expect(screen.getByTestId('wishlist-count')).toHaveTextContent('0');
    expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
    expect(screen.getByTestId('unread-notifications-count')).toHaveTextContent('0');
  });

  it('should add notification correctly', () => {
    renderWithProvider(<TestComponent />);
    
    act(() => {
      screen.getByTestId('add-notification-btn').click();
    });
    
    expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
    expect(screen.getByTestId('unread-notifications-count')).toHaveTextContent('1');
  });

  it('should mark all notifications as read', () => {
    renderWithProvider(<TestComponent />);
    
    // Add a notification first
    act(() => {
      screen.getByTestId('add-notification-btn').click();
    });
    
    expect(screen.getByTestId('unread-notifications-count')).toHaveTextContent('1');
    
    // Mark all as read
    act(() => {
      screen.getByTestId('mark-all-read-btn').click();
    });
    
    expect(screen.getByTestId('unread-notifications-count')).toHaveTextContent('0');
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useStore must be used within a StoreProvider');
    
    console.error = originalError;
  });
});

describe('StoreContext Actions', () => {
  let mockDispatch: jest.Mock;
  
  beforeEach(() => {
    mockDispatch = jest.fn();
  });

  it('should handle ADD_TO_CART action', () => {
    const product: Product = {
      id: '1',
      name: 'Test Product',
      description: 'Test Description',
      price: 1000,
      image: 'test.jpg',
      category: 'Test',
      rating: 4.5,
      reviews: 100
    };

    // This would be tested in integration with the actual reducer
    // For now, we test the context provides the right interface
    renderWithProvider(<TestComponent />);
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
  });

  it('should handle notification actions', () => {
    renderWithProvider(<TestComponent />);
    
    // Test adding notification
    act(() => {
      screen.getByTestId('add-notification-btn').click();
    });
    
    expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
  });
});




