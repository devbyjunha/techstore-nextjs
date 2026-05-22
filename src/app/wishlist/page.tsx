'use client';


import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Trash2, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useProducts } from '@/context/ProductsContext';
import { Product } from '@/types';

export default function WishlistPage() {
  const { products } = useProducts();
  const { state, dispatch, addToast } = useStore();

  const handleRemoveFromWishlist = (productId: string) => {
    dispatch({ type: 'REMOVE_FROM_WISHLIST', payload: productId });
    addToast({
      type: 'info',
      message: '찜 목록에서 제거되었습니다.',
      duration: 2000
    });
  };

  const handleAddToCart = (product: Product) => {
    dispatch({ type: 'ADD_TO_CART', payload: product });
    addToast({
      type: 'success',
      message: '장바구니에 추가되었습니다.',
      duration: 2000
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  if (state.wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            홈으로 돌아가기
          </Link>

          <div className="text-center py-16">
            <div className="relative mb-6">
              <Heart size={80} className="mx-auto text-gray-300" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-500 text-sm">0</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">찜한 상품이 없습니다</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              아직 찜한 상품이 없어요.<br />
              마음에 드는 상품을 찜해보세요!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-lg hover:shadow-xl"
              >
                상품 둘러보기
              </Link>
              <Link
                href="/search"
                className="px-8 py-3 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors font-semibold"
              >
                상품 검색하기
              </Link>
            </div>
            
            {/* 추천 상품 섹션 */}
            <div className="mt-16">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">인기 상품을 확인해보세요</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {products.slice(0, 3).map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                    <div className="text-lg font-bold text-blue-600 mb-3">
                      {new Intl.NumberFormat('ko-KR').format(product.price)}원
                    </div>
                    <Link
                      href={`/product/${product.id}`}
                      className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      상품 보기
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link 
          href="/" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          홈으로 돌아가기
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">찜한 상품</h1>
          <p className="text-gray-600">
            총 {state.wishlist.length}개의 상품을 찜했습니다
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {state.wishlist.map((item) => (
            <div key={item.product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* 상품 이미지 */}
              <div className="relative aspect-square">
                <Image
                  src={item.product.image}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => handleRemoveFromWishlist(item.product.id)}
                  className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  title="찜 목록에서 제거"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* 상품 정보 */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {item.product.name}
                </h3>
                
                <div className="flex items-center mb-2">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600">★ {item.product.rating}</span>
                  </div>
                  <span className="ml-2 text-sm text-gray-500">({item.product.reviews})</span>
                </div>

                <div className="text-lg font-bold text-blue-600 mb-3">
                  {formatPrice(item.product.price)}원
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAddToCart(item.product)}
                    className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    <ShoppingCart size={16} />
                    <span>장바구니</span>
                  </button>
                  
                  <Link
                    href={`/product/${item.product.id}`}
                    className="flex-1 flex items-center justify-center py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    상세보기
                  </Link>
                </div>

                <div className="text-xs text-gray-500 mt-2">
                  찜한 날짜: {item.addedAt.toLocaleDateString('ko-KR')}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 액션 버튼 */}
        <div className="mt-12 text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                // 모든 찜한 상품을 장바구니에 추가
                state.wishlist.forEach(item => {
                  dispatch({ type: 'ADD_TO_CART', payload: item.product });
                });
              }}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              모든 상품 장바구니에 추가
            </button>
            
            <Link
              href="/cart"
              className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors font-semibold"
            >
              장바구니 보기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
