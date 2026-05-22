import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useParams } from 'next/navigation';
import CategoryPage from '../page';
import { StoreProvider } from '@/context/StoreContext';
import { ProductsProvider } from '@/context/ProductsContext';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}));

// Mock products data
jest.mock('@/data/products', () => ({
  products: [
    {
      id: '1',
      name: 'MacBook Pro 14"',
      description: 'Apple M3 Pro 칩을 탑재한 최신 MacBook Pro.',
      price: 2990000,
      image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&h=500&fit=crop&crop=center',
      category: '노트북',
      rating: 4.8,
      reviews: 1247
    },
    {
      id: '2',
      name: 'iPhone 15 Pro',
      description: 'A17 Pro 칩과 티타늄 디자인으로 완벽한 성능을 제공하는 최신 iPhone.',
      price: 1550000,
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&h=500&fit=crop&crop=center',
      category: '스마트폰',
      rating: 4.7,
      reviews: 892
    },
    {
      id: '3',
      name: 'iPad Air 5세대',
      description: 'M1 칩을 탑재한 가벼운 태블릿으로 창작 작업에 최적화.',
      price: 799000,
      originalPrice: 899000,
      discount: 11,
      isOnSale: true,
      image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop&crop=center',
      category: '태블릿',
      rating: 4.5,
      reviews: 423
    },
    {
      id: '4',
      name: 'Magic Keyboard',
      description: '정밀한 키감과 편안한 타이핑을 제공하는 무선 키보드.',
      price: 119000,
      originalPrice: 159000,
      discount: 25,
      isOnSale: true,
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&h=500&fit=crop&crop=center',
      category: '액세서리',
      rating: 4.2,
      reviews: 189
    }
  ]
}));

const mockParams = {
  category: 'laptop'
};

(useParams as jest.Mock).mockReturnValue(mockParams);

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <ProductsProvider>
      <StoreProvider>{component}</StoreProvider>
    </ProductsProvider>
  );
};

describe('CategoryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ category: 'laptop' });
  });

  it('should render category page with correct title', () => {
    renderWithProvider(<CategoryPage />);

    expect(screen.getByRole('heading', { level: 1, name: '노트북' })).toBeInTheDocument();
    expect(screen.getByText(/1개의 상품을 찾았습니다/)).toBeInTheDocument();
  });

  it('should display products for the category', () => {
    renderWithProvider(<CategoryPage />);
    
    expect(screen.getByText('MacBook Pro 14"')).toBeInTheDocument();
  });

  it('should show empty state when no products found', () => {
    (useParams as jest.Mock).mockReturnValue({ category: 'nonexistent' });
    
    renderWithProvider(<CategoryPage />);
    
    expect(screen.getByText('상품을 찾을 수 없습니다')).toBeInTheDocument();
    expect(screen.getByText('다른 카테고리를 확인해보세요.')).toBeInTheDocument();
  });

  it('should handle sort by name', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryPage />);
    
    await user.click(screen.getByRole('button', { name: /가격/ }));
    await user.click(screen.getByRole('button', { name: /상품명/ }));

    expect(screen.getByRole('button', { name: '상품명 ↑' })).toBeInTheDocument();
  });

  it('should handle sort by price', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryPage />);
    
    await user.click(screen.getByRole('button', { name: /가격/ }));

    expect(screen.getByRole('button', { name: '가격 ↑' })).toBeInTheDocument();
  });

  it('should handle sort by rating', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryPage />);
    
    await user.click(screen.getByRole('button', { name: /평점/ }));

    expect(screen.getByRole('button', { name: '평점 ↑' })).toBeInTheDocument();
  });

  it('should toggle sort order when clicking same sort button', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryPage />);
    
    const nameSortButton = screen.getByRole('button', { name: '상품명 ↑' });

    await user.click(nameSortButton);
    expect(screen.getByRole('button', { name: '상품명 ↓' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '상품명 ↓' }));
    expect(screen.getByRole('button', { name: '상품명 ↑' })).toBeInTheDocument();
  });

  it('should handle sale filter toggle', async () => {
    const user = userEvent.setup();
    (useParams as jest.Mock).mockReturnValue({ category: 'tablet' });
    
    renderWithProvider(<CategoryPage />);
    
    const saleFilterButton = screen.getByText('전체 상품');
    await user.click(saleFilterButton);
    
    expect(screen.getByText('특가 상품만')).toBeInTheDocument();
  });

  it('should show sale products only when filter is active', async () => {
    const user = userEvent.setup();
    (useParams as jest.Mock).mockReturnValue({ category: 'tablet' });
    
    renderWithProvider(<CategoryPage />);
    
    // Toggle sale filter
    const saleFilterButton = screen.getByText('전체 상품');
    await user.click(saleFilterButton);
    
    // Should show only sale products
    expect(screen.getByText('iPad Air 5세대')).toBeInTheDocument();
  });

  it('should show empty state when no sale products', async () => {
    const user = userEvent.setup();
    (useParams as jest.Mock).mockReturnValue({ category: 'laptop' });
    
    renderWithProvider(<CategoryPage />);
    
    // Toggle sale filter
    const saleFilterButton = screen.getByText('전체 상품');
    await user.click(saleFilterButton);
    
    expect(screen.getByText('특가 상품이 없습니다')).toBeInTheDocument();
    expect(screen.getByText('이 카테고리에는 현재 특가 상품이 없습니다.')).toBeInTheDocument();
  });

  it('should handle different category mappings', () => {
    (useParams as jest.Mock).mockReturnValue({ category: 'smartphone' });
    
    renderWithProvider(<CategoryPage />);
    
    expect(screen.getByRole('heading', { level: 1, name: '스마트폰' })).toBeInTheDocument();
  });

  it('should display correct product count', () => {
    renderWithProvider(<CategoryPage />);
    
    expect(screen.getByText(/1개의 상품을 찾았습니다/)).toBeInTheDocument();
  });

  it('should render sort options correctly', () => {
    renderWithProvider(<CategoryPage />);
    
    expect(screen.getByText('정렬:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /상품명/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /가격/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /평점/ })).toBeInTheDocument();
  });

  it('should render filter button', () => {
    renderWithProvider(<CategoryPage />);
    
    expect(screen.getByText('전체 상품')).toBeInTheDocument();
  });
});




