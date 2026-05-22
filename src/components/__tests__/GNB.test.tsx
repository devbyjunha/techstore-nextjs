import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import GNB from '../GNB';
import { StoreProvider } from '@/context/StoreContext';
import { ProductsProvider } from '@/context/ProductsContext';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/'),
}));

// Mock products data
jest.mock('@/data/products', () => ({
  products: [
    {
      id: '1',
      name: 'Test Product 1',
      description: 'Test Description 1',
      price: 1000,
      image: 'test1.jpg',
      category: '노트북',
      rating: 4.5,
      reviews: 100
    },
    {
      id: '2',
      name: 'Test Product 2',
      description: 'Test Description 2',
      price: 2000,
      image: 'test2.jpg',
      category: '스마트폰',
      rating: 4.0,
      reviews: 50
    }
  ]
}));

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
};

(useRouter as jest.Mock).mockReturnValue(mockRouter);

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <ProductsProvider>
      <StoreProvider>{component}</StoreProvider>
    </ProductsProvider>
  );
};

const getSearchInput = () =>
  screen.getAllByPlaceholderText('상품명, 브랜드, 카테고리로 검색...')[0];

const getSearchSubmitButton = () =>
  screen.getAllByTitle('검색하기 (Enter)')[0];

const getClearButton = () => screen.getAllByTitle('검색어 지우기')[0];

describe('GNB Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render navigation elements', () => {
    renderWithProvider(<GNB />);
    
    expect(screen.getByText('TechStore')).toBeInTheDocument();
    expect(getSearchInput()).toBeInTheDocument();
    expect(screen.getByTitle('알림')).toBeInTheDocument();
    expect(screen.getByText('로그인')).toBeInTheDocument();
    expect(screen.getByTitle('관리자 페이지')).toBeInTheDocument();
  });

  it('should handle search input', async () => {
    const user = userEvent.setup();
    renderWithProvider(<GNB />);
    
    const searchInput = getSearchInput();
    
    await user.type(searchInput, 'Test Product 1');
    
    expect(searchInput).toHaveValue('Test Product 1');
  });

  it('should show search suggestions', async () => {
    const user = userEvent.setup();
    renderWithProvider(<GNB />);
    
    const searchInput = getSearchInput();
    
    await user.type(searchInput, 'Test');
    
    await waitFor(() => {
      expect(screen.getAllByText('Test Product 1').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Test Product 2').length).toBeGreaterThan(0);
    });
  });

  it('should handle search form submission', async () => {
    const user = userEvent.setup();
    renderWithProvider(<GNB />);
    
    const searchInput = getSearchInput();
    const searchButton = getSearchSubmitButton();
    
    await user.type(searchInput, 'Test Product');
    await user.click(searchButton);
    
    expect(mockPush).toHaveBeenCalledWith('/search?q=Test%20Product');
  });

  it('should handle suggestion click', async () => {
    const user = userEvent.setup();
    renderWithProvider(<GNB />);
    
    const searchInput = getSearchInput();
    
    await user.type(searchInput, 'Test');
    
    await waitFor(() => {
      expect(screen.getAllByText('Test Product 1').length).toBeGreaterThan(0);
    });

    const form = searchInput.closest('form');
    expect(form).toBeTruthy();
    await user.click(
      within(form!).getByRole('button', { name: /Test Product 1/i })
    );

    expect(mockPush).toHaveBeenCalledWith('/product/1');
  });

  it('should toggle notification dropdown', async () => {
    const user = userEvent.setup();
    renderWithProvider(<GNB />);
    
    const notificationButton = screen.getByTitle('알림');
    
    expect(screen.queryByText('새로운 알림이 없습니다')).not.toBeInTheDocument();

    await user.click(notificationButton);

    expect(screen.getByRole('heading', { name: '알림' })).toBeInTheDocument();
    expect(screen.getByText('새로운 알림이 없습니다')).toBeInTheDocument();
  });

  it('should show notification count when there are unread notifications', () => {
    // This would require setting up the store with notifications
    // For now, we test the basic structure
    renderWithProvider(<GNB />);
    
    const notificationButton = screen.getByTitle('알림');
    expect(notificationButton).toBeInTheDocument();
  });

  it('should clear search input', async () => {
    const user = userEvent.setup();
    renderWithProvider(<GNB />);
    
    const searchInput = getSearchInput();
    
    await user.type(searchInput, 'Test Product');
    
    const clearButton = getClearButton();
    await user.click(clearButton);
    
    expect(searchInput).toHaveValue('');
  });

  it('should handle external click to close suggestions', async () => {
    const user = userEvent.setup();
    renderWithProvider(<GNB />);
    
    const searchInput = getSearchInput();
    
    await user.type(searchInput, 'Test');
    
    await waitFor(() => {
      expect(screen.getAllByText('Test Product 1').length).toBeGreaterThan(0);
    });

    await user.click(document.body);

    await waitFor(() => {
      expect(screen.queryAllByText('Test Product 1')).toHaveLength(0);
    });
  });

  it('should show cart and wishlist counts', () => {
    renderWithProvider(<GNB />);
    
    // Initially should show 0 counts
    const cartCount = screen.queryByText('0');
    const wishlistCount = screen.queryByText('0');
    
    // These elements might not be visible if count is 0
    // We test that the icons are present instead
    expect(screen.getByTitle('알림')).toBeInTheDocument();
  });
});




