'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star, ShoppingCart, ImageIcon, Zap } from 'lucide-react';
import { Product } from '@/types';
import { useStore } from '@/context/StoreContext';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { state, dispatch, addToast } = useStore();
  const [imageError, setImageError] = useState(false);

  const isInWishlist = state.wishlist.some((item) => item.product.id === product.id);
  const isInCart = state.cart.some((item) => item.product.id === product.id);

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isInWishlist) {
      dispatch({ type: 'REMOVE_FROM_WISHLIST', payload: product.id });
      addToast({
        type: 'info',
        message: '찜 목록에서 제거되었습니다.',
        duration: 2000,
      });
    } else {
      dispatch({ type: 'ADD_TO_WISHLIST', payload: product });
      addToast({
        type: 'success',
        message: '찜 목록에 추가되었습니다.',
        duration: 2000,
      });
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch({ type: 'ADD_TO_CART', payload: product });
    addToast({
      type: 'success',
      message: '장바구니에 추가되었습니다.',
      duration: 2000,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  return (
    <Link href={`/product/${product.id}`} className="group block">
      <article className="card-hover overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
          {product.isOnSale && (
            <span className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
              <Zap size={12} fill="currentColor" />
              SALE
            </span>
          )}
          {!imageError ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImageError(true)}
              priority={false}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-100">
              <ImageIcon size={48} className="text-slate-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <button
            type="button"
            onClick={handleAddToWishlist}
            className={`absolute right-3 top-3 z-10 rounded-full p-2.5 shadow-lg backdrop-blur-sm transition-all ${
              isInWishlist
                ? 'bg-rose-500 text-white'
                : 'bg-white/90 text-slate-600 hover:bg-rose-500 hover:text-white'
            }`}
            title={isInWishlist ? '찜 목록에서 제거' : '찜 목록에 추가'}
          >
            <Heart size={18} fill={isInWishlist ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-indigo-600">
            {product.category}
          </p>
          <h3 className="mb-2 line-clamp-2 font-semibold text-slate-900 transition-colors group-hover:text-indigo-600">
            {product.name}
          </h3>

          <div className="mb-3 flex items-center gap-1.5">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            <span className="text-sm font-medium text-slate-700">{product.rating}</span>
            <span className="text-sm text-slate-400">({product.reviews.toLocaleString()})</span>
          </div>

          <div className="flex items-end justify-between gap-2">
            <div>
              {product.isOnSale && product.originalPrice ? (
                <div className="space-y-0.5">
                  <p className="text-xs text-slate-400 line-through">
                    {formatPrice(product.originalPrice)}원
                  </p>
                  <p className="text-lg font-bold text-rose-600">
                    {formatPrice(product.price)}
                    <span className="text-sm font-normal text-slate-500">원</span>
                  </p>
                </div>
              ) : (
                <p className="text-lg font-bold text-slate-900">
                  {formatPrice(product.price)}
                  <span className="text-sm font-normal text-slate-500">원</span>
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className={`rounded-xl p-2.5 shadow-md transition-all ${
                isInCart
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/30'
              }`}
              title={isInCart ? '장바구니에 추가됨' : '장바구니에 추가'}
            >
              <ShoppingCart size={18} />
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}
