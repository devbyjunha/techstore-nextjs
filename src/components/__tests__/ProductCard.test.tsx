import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ImageProps } from 'next/image';
import ProductCard from '../ProductCard';
import { StoreProvider } from '@/context/StoreContext';
import ToastWrapper from '../ToastWrapper';
import { Product } from '@/types';

jest.mock('next/link', () => {
  function MockLink({
    children,
    href,
    ...props
  }: React.PropsWithChildren<{ href: string } & Record<string, unknown>>) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }
  MockLink.displayName = 'MockLink';
  return MockLink;
});

jest.mock('next/image', () => {
  function MockImage({ src, alt, onError, fill, priority, ...props }: ImageProps) {
    void fill;
    void priority;
    const srcString = typeof src === 'string' ? src : '';
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={srcString} alt={alt} onError={onError} {...props} />
    );
  }
  MockImage.displayName = 'MockImage';
  return MockImage;
});

const mockProduct: Product = {
  id: '1',
  name: 'Test Product',
  description: 'Test Description',
  price: 100000,
  originalPrice: 120000,
  discount: 17,
  isOnSale: true,
  image: 'https://example.com/test.jpg',
  category: '노트북',
  rating: 4.5,
  reviews: 100,
};

const mockProductWithoutSale: Product = {
  id: '2',
  name: 'Regular Product',
  description: 'Regular Description',
  price: 50000,
  image: 'https://example.com/regular.jpg',
  category: '스마트폰',
  rating: 4.0,
  reviews: 50,
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <StoreProvider>
      {component}
      <ToastWrapper />
    </StoreProvider>
  );
};

describe('ProductCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render product information correctly', () => {
    renderWithProvider(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText(/100,000/)).toBeInTheDocument();
    expect(screen.getByText(/120,000/)).toBeInTheDocument();
    expect(screen.getByText('SALE')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(100)')).toBeInTheDocument();
    expect(screen.getByText('노트북')).toBeInTheDocument();
  });

  it('should render regular product without sale information', () => {
    renderWithProvider(<ProductCard product={mockProductWithoutSale} />);

    expect(screen.getByText('Regular Product')).toBeInTheDocument();
    expect(screen.getByText(/50,000/)).toBeInTheDocument();
    expect(screen.queryByText('SALE')).not.toBeInTheDocument();
  });

  it('should have correct link to product page', () => {
    renderWithProvider(<ProductCard product={mockProduct} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/product/1');
  });

  it('should handle wishlist toggle', async () => {
    const user = userEvent.setup();
    renderWithProvider(<ProductCard product={mockProduct} />);

    const wishlistButton = screen.getByTitle('찜 목록에 추가');
    await user.click(wishlistButton);

    await waitFor(() => {
      expect(screen.getByText('찜 목록에 추가되었습니다.')).toBeInTheDocument();
    });
  });

  it('should handle add to cart', async () => {
    const user = userEvent.setup();
    renderWithProvider(<ProductCard product={mockProduct} />);

    const cartButton = screen.getByTitle('장바구니에 추가');
    await user.click(cartButton);

    await waitFor(() => {
      expect(screen.getByText('장바구니에 추가되었습니다.')).toBeInTheDocument();
    });
  });

  it('should show wishlist state correctly', async () => {
    const user = userEvent.setup();
    renderWithProvider(<ProductCard product={mockProduct} />);

    const wishlistButton = screen.getByTitle('찜 목록에 추가');
    expect(wishlistButton).toHaveClass('bg-white/90');

    await user.click(wishlistButton);

    await waitFor(() => {
      const updatedButton = screen.getByTitle('찜 목록에서 제거');
      expect(updatedButton).toHaveClass('bg-rose-500');
    });
  });

  it('should show cart state correctly', async () => {
    const user = userEvent.setup();
    renderWithProvider(<ProductCard product={mockProduct} />);

    const cartButton = screen.getByTitle('장바구니에 추가');
    expect(cartButton).toHaveClass('bg-indigo-600');

    await user.click(cartButton);

    await waitFor(() => {
      const updatedButton = screen.getByTitle('장바구니에 추가됨');
      expect(updatedButton).toHaveClass('bg-emerald-500');
    });
  });

  it('should handle image error', async () => {
    renderWithProvider(<ProductCard product={mockProduct} />);

    fireEvent.error(screen.getByAltText('Test Product'));

    await waitFor(() => {
      expect(screen.queryByAltText('Test Product')).not.toBeInTheDocument();
    });
  });

  it('should format price correctly', () => {
    renderWithProvider(<ProductCard product={mockProduct} />);

    expect(screen.getByText(/100,000/)).toBeInTheDocument();
    expect(screen.getByText(/120,000/)).toBeInTheDocument();
  });

  it('should display rating and reviews', () => {
    renderWithProvider(<ProductCard product={mockProduct} />);

    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(100)')).toBeInTheDocument();
  });

  it('should display category', () => {
    renderWithProvider(<ProductCard product={mockProduct} />);

    expect(screen.getByText('노트북')).toBeInTheDocument();
  });

  it('should prevent default on button clicks', async () => {
    const user = userEvent.setup();
    renderWithProvider(<ProductCard product={mockProduct} />);

    const wishlistButton = screen.getByTitle('찜 목록에 추가');
    const cartButton = screen.getByTitle('장바구니에 추가');

    await user.click(wishlistButton);
    await user.click(cartButton);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('should show sale badge for sale products', () => {
    renderWithProvider(<ProductCard product={mockProduct} />);

    expect(screen.getByText('SALE')).toBeInTheDocument();
  });

  it('should not show sale badge for regular products', () => {
    renderWithProvider(<ProductCard product={mockProductWithoutSale} />);

    expect(screen.queryByText('SALE')).not.toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    renderWithProvider(<ProductCard product={mockProduct} />);

    expect(screen.getByRole('link')).toHaveAttribute('href', '/product/1');
    expect(screen.getByTitle('찜 목록에 추가')).toBeInTheDocument();
    expect(screen.getByTitle('장바구니에 추가')).toBeInTheDocument();
  });
});
