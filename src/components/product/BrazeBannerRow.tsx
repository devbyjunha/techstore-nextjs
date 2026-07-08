'use client';

import { useBrazeBanner } from '@/hooks/useBrazeBanner';

interface BrazeBannerRowProps {
  placementId?: string;
}

export default function BrazeBannerRow({ placementId }: BrazeBannerRowProps) {
  const { containerRef, status, placementId: resolvedPlacementId } =
    useBrazeBanner({ placementId });

  if (status === 'hidden') {
    return null;
  }

  return (
    <div
      ref={containerRef}
      data-braze-placement={resolvedPlacementId}
      className={`braze-banner-row h-11 w-full shrink-0 overflow-hidden ${
        status === 'live' ? '' : 'invisible'
      }`}
      aria-hidden={status !== 'live'}
    />
  );
}
