'use client';

import { ChevronRight } from 'lucide-react';
import BrazeBannerRow from './BrazeBannerRow';

interface BenefitRowProps {
  children: React.ReactNode;
  onClick?: () => void;
}

function BenefitRow({ children, onClick }: BenefitRowProps) {
  const className =
    'flex h-11 w-full items-center gap-2 text-left text-sm text-gray-800 transition-colors hover:bg-gray-50';

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        <span className="flex-1">{children}</span>
        <ChevronRight size={16} className="shrink-0 text-gray-400" />
      </button>
    );
  }

  return (
    <div className={className}>
      <span className="flex-1">{children}</span>
      <ChevronRight size={16} className="shrink-0 text-gray-400" />
    </div>
  );
}

export default function ProductAdditionalBenefits() {
  return (
    <section className="border-t pt-6" aria-label="추가혜택">
      <div className="flex gap-4">
        <div className="flex h-11 w-16 shrink-0 items-center">
          <h3 className="text-sm font-medium text-gray-500">추가혜택</h3>
        </div>

        <div className="min-w-0 flex-1 divide-y divide-gray-100">
          <BrazeBannerRow />

          <BenefitRow>회원 최대 1.09% L.POINT 적립</BenefitRow>
          <BenefitRow>앱에서 최초 구매 시 3만원</BenefitRow>
          <BenefitRow>카드할인: 최대 6%</BenefitRow>
          <BenefitRow>구매 시 1,000원 할인</BenefitRow>
        </div>
      </div>
    </section>
  );
}
