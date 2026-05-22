'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/types';
import { useProducts } from '@/context/ProductsContext';

export default function CategoryPage() {
  const { products } = useProducts();
  const params = useParams();
  const category = params.category as string;
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'rating'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showSaleOnly, setShowSaleOnly] = useState(false);

  // 카테고리명 매핑
  const categoryMap: { [key: string]: string } = {
    'laptop': '노트북',
    'smartphone': '스마트폰',
    'tablet': '태블릿',
    'accessory': '액세서리',
    'earphone': '이어폰',
    'smartwatch': '스마트워치',
    'desktop': '데스크톱',
    'smarthome': '스마트홈'
  };

  const koreanCategory = categoryMap[category] || category;

  useEffect(() => {
    let filtered = products.filter(product => product.category === koreanCategory);
    
    // 특가 상품만 보기 필터
    if (showSaleOnly) {
      filtered = filtered.filter(product => product.isOnSale);
    }

    // 정렬
    const getSortValue = (product: Product): string | number => {
      switch (sortBy) {
        case 'name':
          return product.name;
        case 'price':
          return product.price;
        case 'rating':
          return product.rating;
        default:
          return product.name;
      }
    };

    filtered.sort((a, b) => {
      const aValue = getSortValue(a);
      const bValue = getSortValue(b);

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

    setFilteredProducts(filtered);
  }, [category, koreanCategory, sortBy, sortOrder, showSaleOnly, products]);

  const handleSortChange = (newSortBy: 'name' | 'price' | 'rating') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: 'name' | 'price' | 'rating') => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 섹션 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {koreanCategory}
              </h1>
              <p className="text-gray-600">
                {filteredProducts.length}개의 상품을 찾았습니다
              </p>
            </div>
            
            {/* 필터 및 정렬 */}
            <div className="mt-4 sm:mt-0 flex flex-wrap gap-4">
              <button
                onClick={() => setShowSaleOnly(!showSaleOnly)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  showSaleOnly
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {showSaleOnly ? '특가 상품만' : '전체 상품'}
              </button>
            </div>
          </div>

          {/* 정렬 옵션 */}
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 mr-2">정렬:</span>
            {[
              { key: 'name', label: '상품명' },
              { key: 'price', label: '가격' },
              { key: 'rating', label: '평점' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleSortChange(key as 'name' | 'price' | 'rating')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  sortBy === key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {label} {getSortIcon(key as 'name' | 'price' | 'rating')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 상품 목록 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {showSaleOnly ? '특가 상품이 없습니다' : '상품을 찾을 수 없습니다'}
            </h3>
            <p className="text-gray-600 mb-6">
              {showSaleOnly 
                ? '이 카테고리에는 현재 특가 상품이 없습니다.'
                : '다른 카테고리를 확인해보세요.'
              }
            </p>
            {showSaleOnly && (
              <button
                onClick={() => setShowSaleOnly(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                전체 상품 보기
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
