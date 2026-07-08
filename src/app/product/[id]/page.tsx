'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Heart, Star, ShoppingCart, CreditCard, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { useProducts } from '@/context/ProductsContext';
import { useAmplitude } from '@/hooks/useAmplitude';
import { useBraze } from '@/hooks/useBraze';
import ProductAdditionalBenefits from '@/components/product/ProductAdditionalBenefits';

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const { products } = useProducts();
  const { state, dispatch } = useStore();
  const { trackProductView: trackBrazeProductView } = useBraze();
  const { trackProductView: trackAmplitudeProductView } = useAmplitude();
  const [quantity, setQuantity] = useState(1);
  
  const product = products.find(p => p.id === params.id);

  useEffect(() => {
    if (product) {
      void trackBrazeProductView(product);
      void trackAmplitudeProductView(product);
    }
  }, [product, trackBrazeProductView, trackAmplitudeProductView]);
  
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">상품을 찾을 수 없습니다</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const isInWishlist = state.wishlist.some(item => item.product.id === product.id);
  const isInCart = state.cart.some(item => item.product.id === product.id);

  const handleAddToWishlist = () => {
    if (isInWishlist) {
      dispatch({ type: 'REMOVE_FROM_WISHLIST', payload: product.id });
    } else {
      dispatch({ type: 'ADD_TO_WISHLIST', payload: product });
    }
  };

  const handleAddToCart = () => {
    dispatch({ type: 'ADD_TO_CART', payload: product });
  };

  const handleBuyNow = () => {
    // 장바구니에 추가 후 주문 페이지로 이동
    dispatch({ type: 'ADD_TO_CART', payload: product });
    router.push('/checkout');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 뒤로가기 버튼 */}
        <Link 
          href="/" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          상품 목록으로 돌아가기
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* 상품 이미지 */}
            <div className="relative aspect-square">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover rounded-lg"
              />
            </div>

            {/* 상품 정보 */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <p className="text-gray-600 text-lg">{product.description}</p>
              </div>

              {/* 평점 */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <Star size={20} className="text-yellow-400 fill-current" />
                  <span className="ml-1 text-lg font-semibold">{product.rating}</span>
                </div>
                <span className="text-gray-500">({product.reviews}개의 리뷰)</span>
              </div>

              {/* 가격 */}
              <div className="text-3xl font-bold text-blue-600">
                {formatPrice(product.price)}원
              </div>

              {/* 카테고리 */}
              <div className="text-sm text-gray-500">
                카테고리: <span className="font-medium">{product.category}</span>
              </div>

              {/* 수량 선택 */}
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">수량:</label>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>

              {/* 액션 버튼들 */}
              <div className="space-y-3">
                <button
                  onClick={handleAddToWishlist}
                  className={`w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-lg border-2 transition-colors ${
                    isInWishlist
                      ? 'border-red-500 bg-red-500 text-white hover:bg-red-600'
                      : 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
                  }`}
                >
                  <Heart size={20} fill={isInWishlist ? 'currentColor' : 'none'} />
                  <span>{isInWishlist ? '찜한 상품' : '찜하기'}</span>
                </button>

                <button
                  onClick={handleAddToCart}
                  className={`w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-lg border-2 transition-colors ${
                    isInCart
                      ? 'border-green-500 bg-green-500 text-white hover:bg-green-600'
                      : 'border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white'
                  }`}
                >
                  <ShoppingCart size={20} />
                  <span>{isInCart ? '장바구니에 추가됨' : '장바구니에 담기'}</span>
                </button>

                <button
                  onClick={handleBuyNow}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  <CreditCard size={20} />
                  <span>바로 주문하기</span>
                </button>
              </div>

              {/* 상품 특징 */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">상품 특징</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• 최신 기술 적용</li>
                  <li>• 품질 보증</li>
                  <li>• 무료 배송</li>
                  <li>• 30일 환불 보장</li>
                </ul>
              </div>

              <ProductAdditionalBenefits />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
