'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { products as defaultProducts } from '@/data/products';
import type { Product } from '@/types';

const STORAGE_KEY = 'techstore-products';

type ProductInput = Omit<Product, 'id'> & { id?: string };

interface ProductsContextType {
  products: Product[];
  isHydrated: boolean;
  addProduct: (product: ProductInput) => Product;
  updateProduct: (id: string, updates: Partial<ProductInput>) => void;
  deleteProduct: (id: string) => void;
  resetProducts: () => void;
  getProductById: (id: string) => Product | undefined;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

function loadFromStorage(): Product[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Product[];
  } catch {
    return null;
  }
}

function saveToStorage(products: Product[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = loadFromStorage();
    if (stored?.length) {
      setProducts(stored);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      saveToStorage(products);
    }
  }, [products, isHydrated]);

  const addProduct = useCallback((input: ProductInput): Product => {
    const newProduct: Product = {
      id: input.id ?? String(Date.now()),
      name: input.name,
      description: input.description,
      price: input.price,
      image: input.image,
      category: input.category,
      rating: input.rating,
      reviews: input.reviews,
      originalPrice: input.originalPrice,
      discount: input.discount,
      isOnSale: input.isOnSale,
    };
    setProducts((prev) => [...prev, newProduct]);
    return newProduct;
  }, []);

  const updateProduct = useCallback((id: string, updates: Partial<ProductInput>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, id: p.id } : p))
    );
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const resetProducts = useCallback(() => {
    setProducts(defaultProducts);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const getProductById = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products]
  );

  const value = useMemo(
    () => ({
      products,
      isHydrated,
      addProduct,
      updateProduct,
      deleteProduct,
      resetProducts,
      getProductById,
    }),
    [products, isHydrated, addProduct, updateProduct, deleteProduct, resetProducts, getProductById]
  );

  return (
    <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
}
