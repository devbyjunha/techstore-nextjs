'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  Heart,
  User,
  ShoppingCart,
  LogOut,
  X,
  Bell,
  Trash2,
  Sparkles,
  Laptop,
  Smartphone,
  Tablet,
  Headphones,
  Shield,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useProducts } from '@/context/ProductsContext';
import type { Product } from '@/types';

const CATEGORIES = [
  { name: '노트북', slug: 'laptop', icon: Laptop },
  { name: '스마트폰', slug: 'smartphone', icon: Smartphone },
  { name: '태블릿', slug: 'tablet', icon: Tablet },
  { name: '액세서리', slug: 'accessory', icon: Headphones },
] as const;

export default function GNB() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { products } = useProducts();
  const {
    state,
    dispatch,
    markNotificationRead,
    markAllNotificationsRead,
    removeNotification,
  } = useStore();

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const filtered = products
        .filter(
          (product) =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideSearch =
        desktopSearchRef.current?.contains(target) ||
        mobileSearchRef.current?.contains(target);
      if (!insideSearch) {
        setShowSuggestions(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (product: Product) => {
    setSearchQuery(product.name);
    setShowSuggestions(false);
    router.push(`/product/${product.id}`);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    router.push('/');
  };

  const handleNotificationClick = (notification: {
    id: string;
    isRead: boolean;
    actionUrl?: string;
  }) => {
    if (!notification.isRead) {
      markNotificationRead(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
    setShowNotifications(false);
  };

  const handleRemoveNotification = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeNotification(notificationId);
  };

  const formatNotificationTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;

    return date.toLocaleDateString('ko-KR');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const cartItemCount = state.cart.reduce((total, item) => total + item.quantity, 0);
  const wishlistCount = state.wishlist.length;
  const unreadNotificationCount = state.notifications.filter((n) => !n.isRead).length;

  const searchBar = (
    <form onSubmit={handleSearch} className="relative w-full">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setShowSuggestions(searchQuery.trim().length > 0)}
        placeholder="상품명, 브랜드, 카테고리로 검색..."
        className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 py-3 pl-11 pr-11 text-sm text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
      />
      <button
        type="submit"
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-indigo-600"
        title="검색하기 (Enter)"
      >
        <Search size={18} />
      </button>
      {searchQuery && (
        <button
          type="button"
          onClick={clearSearch}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
          title="검색어 지우기"
        >
          <X size={16} />
        </button>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-50 max-h-80 overflow-hidden overflow-y-auto rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50">
          {suggestions.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleSuggestionClick(product)}
              className="w-full border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-indigo-50/50"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-slate-900">
                    {product.name}
                  </div>
                  <div className="text-sm text-slate-500">{product.category}</div>
                </div>
                <div className="text-sm font-semibold text-indigo-600">
                  {new Intl.NumberFormat('ko-KR').format(product.price)}원
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </form>
  );

  const iconButtonClass =
    'relative inline-flex rounded-xl p-2.5 text-slate-500 transition-all hover:bg-slate-100 hover:text-indigo-600';

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 glass-panel">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Row 1: Logo + Actions */}
        <div className="relative flex min-h-[4.5rem] items-center justify-between gap-4 py-3 lg:py-0">
          <Link href="/" className="group flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 transition-transform group-hover:scale-105">
              <Sparkles className="h-5 w-5 text-white" />
            </span>
            <span className="text-xl font-bold tracking-tight gradient-text">TechStore</span>
          </Link>

          {/* Desktop search — centered in header row */}
          <div className="hidden min-w-0 flex-1 px-4 lg:block lg:max-w-xl lg:px-8 xl:max-w-2xl" ref={desktopSearchRef}>
            {searchBar}
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className={iconButtonClass}
                title="알림"
              >
                <Bell size={22} />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 max-h-96 w-80 overflow-hidden overflow-y-auto rounded-2xl border border-slate-200/80 bg-white shadow-xl">
                  <div className="border-b border-slate-100 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">알림</h3>
                      {state.notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={markAllNotificationsRead}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          모두 읽음
                        </button>
                      )}
                    </div>
                  </div>

                  {state.notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      <Bell size={40} className="mx-auto mb-3 text-slate-300" />
                      <p className="text-sm">새로운 알림이 없습니다</p>
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {state.notifications.map((notification) => (
                        <div
                          key={notification.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleNotificationClick(notification)}
                          onKeyDown={(e) =>
                            e.key === 'Enter' && handleNotificationClick(notification)
                          }
                          className={`cursor-pointer border-b border-slate-100 p-4 transition-colors hover:bg-slate-50 ${
                            !notification.isRead ? 'bg-indigo-50/40' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <h4
                                  className={`truncate text-sm font-medium ${
                                    !notification.isRead ? 'text-slate-900' : 'text-slate-600'
                                  }`}
                                >
                                  {notification.title}
                                </h4>
                                <button
                                  type="button"
                                  onClick={(e) =>
                                    handleRemoveNotification(notification.id, e)
                                  }
                                  className="shrink-0 p-1 text-slate-400 hover:text-red-500"
                                  title="알림 삭제"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                              <p className="mt-1 text-sm text-slate-500">{notification.message}</p>
                              <p className="mt-2 text-xs text-slate-400">
                                {formatNotificationTime(notification.createdAt)}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Link href="/wishlist" className={iconButtonClass} title="찜 목록">
              <Heart size={22} />
              {wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link href="/cart" className={iconButtonClass} title="장바구니">
              <ShoppingCart size={22} />
              {cartItemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white ring-2 ring-white">
                  {cartItemCount}
                </span>
              )}
            </Link>

            <Link href="/mypage" className={iconButtonClass} title="마이페이지">
              <User size={22} />
            </Link>

            <Link
              href="/admin"
              className="hidden items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 sm:inline-flex"
              title="관리자 페이지"
            >
              <Shield size={18} />
              <span className="hidden md:inline">관리자</span>
            </Link>

            {state.user.isLoggedIn ? (
              <div className="ml-1 hidden items-center gap-2 sm:flex">
                <span className="max-w-[120px] truncate text-sm text-slate-600">
                  {state.user.name}님
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={iconButtonClass}
                  title="로그아웃"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="ml-1 rounded-xl px-4 py-2.5 text-sm font-semibold btn-primary"
              >
                로그인
              </Link>
            )}
          </div>
        </div>

        {/* Row 2: Mobile / tablet search — spaced below logo row */}
        <div className="border-t border-slate-100 pb-5 pt-4 lg:hidden" ref={mobileSearchRef}>
          {searchBar}
        </div>

        {/* Row 3: Category quick links */}
        <nav
          className="hidden items-center gap-1 overflow-x-auto border-t border-slate-100 py-3 md:flex"
          aria-label="카테고리"
        >
          {CATEGORIES.map(({ name, slug, icon: Icon }) => {
            const href = `/category/${slug}`;
            const isActive = pathname === href;
            return (
              <Link
                key={slug}
                href={href}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-600'
                }`}
              >
                <Icon size={16} />
                {name}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
