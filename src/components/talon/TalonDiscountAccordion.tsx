'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { TalonDiscountEffect } from '@/lib/talon/types';

interface TalonDiscountAccordionProps {
  totalDiscount: number;
  effects?: TalonDiscountEffect[];
  couponCode?: string;
  formatPrice: (price: number) => string;
}

export default function TalonDiscountAccordion({
  totalDiscount,
  effects = [],
  couponCode,
  formatPrice,
}: TalonDiscountAccordionProps) {
  const [open, setOpen] = useState(false);
  const hasDiscount = totalDiscount > 0;

  return (
    <div
      className={`overflow-hidden rounded-lg border ${
        hasDiscount ? 'border-rose-200 bg-rose-50/40' : 'border-slate-200 bg-slate-50/50'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
        aria-expanded={open}
      >
        <span
          className={`text-sm font-semibold ${
            hasDiscount ? 'text-rose-600' : 'text-slate-600'
          }`}
        >
          {hasDiscount ? `-${formatPrice(totalDiscount)}원` : '0원'}{' '}
          <span className="font-medium">할인</span>
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-400 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="space-y-2 border-t border-slate-200/80 bg-white px-3 py-3">
          {hasDiscount && effects.length > 0 ? (
            effects.map((effect) => (
              <div
                key={`${effect.campaignId ?? 'x'}-${effect.name}-${effect.value}`}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <div className="min-w-0 text-slate-700">
                  <p className="font-medium text-slate-900">{effect.name || '할인'}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Talon.One
                    {typeof effect.campaignId === 'number'
                      ? ` [${effect.campaignId}]`
                      : ''}{' '}
                    캠페인 적용
                  </p>
                </div>
                <span className="shrink-0 font-medium text-rose-600">
                  -{formatPrice(effect.value)}원
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">적용된 Talon.One 할인이 없습니다.</p>
          )}

          {hasDiscount && couponCode ? (
            <p className="border-t border-slate-100 pt-2 text-xs text-slate-500">
              쿠폰 코드: {couponCode}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
