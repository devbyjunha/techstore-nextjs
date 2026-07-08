'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ensureBrazeBannerSubscription,
  getPdpBenefitsPlacementId,
  normalizeBrazeBannerIframeAsync,
  refreshBrazeBanner,
  type BrazeBannerStatus,
} from '@/lib/braze/banners';
import { getBrazeModule, isBrazeClientEnabled } from '@/lib/braze/client';

interface UseBrazeBannerOptions {
  placementId?: string;
}

interface UseBrazeBannerResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  status: BrazeBannerStatus;
  placementId: string;
}

export function useBrazeBanner(
  options: UseBrazeBannerOptions = {}
): UseBrazeBannerResult {
  const placementId = options.placementId ?? getPdpBenefitsPlacementId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<BrazeBannerStatus>('idle');
  const subscriptionIdRef = useRef<string | undefined>(undefined);
  const lastInsertedKeyRef = useRef<string | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const normalizeGenerationRef = useRef(0);

  useEffect(() => {
    if (!isBrazeClientEnabled()) {
      setStatus('hidden');
      return;
    }

    let cancelled = false;
    lastInsertedKeyRef.current = null;

    async function settleBannerLayout(container: HTMLElement) {
      const generation = ++normalizeGenerationRef.current;
      await normalizeBrazeBannerIframeAsync(container);
      if (cancelled || generation !== normalizeGenerationRef.current) {
        return;
      }
      setStatus('live');
    }

    async function mountBanner() {
      setStatus('loading');

      const ready = await ensureBrazeBannerSubscription();
      if (cancelled || !ready) {
        setStatus('hidden');
        return;
      }

      const braze = await getBrazeModule();
      if (!braze || cancelled) {
        setStatus('hidden');
        return;
      }

      const renderBanner = () => {
        const container = containerRef.current;
        if (!container || cancelled) {
          return;
        }

        const banner = braze.getBanner(placementId);
        const renderKey = banner && !banner.isControl ? banner.id : '__none__';

        if (!banner || banner.isControl) {
          container.replaceChildren();
          lastInsertedKeyRef.current = null;
          setStatus('hidden');
          return;
        }

        if (lastInsertedKeyRef.current !== renderKey) {
          lastInsertedKeyRef.current = renderKey;
          setStatus('loading');
          braze.insertBanner(banner, container);
        }

        void settleBannerLayout(container);
      };

      mutationObserverRef.current?.disconnect();
      mutationObserverRef.current = new MutationObserver(() => {
        const container = containerRef.current;
        if (!container || cancelled) {
          return;
        }
        if (container.querySelector('iframe')) {
          void settleBannerLayout(container);
        }
      });

      const container = containerRef.current;
      if (container) {
        mutationObserverRef.current.observe(container, {
          childList: true,
          subtree: true,
        });
      }

      subscriptionIdRef.current = braze.subscribeToBannersUpdates(() => {
        renderBanner();
      });

      renderBanner();
      refreshBrazeBanner(placementId);
    }

    void mountBanner();

    return () => {
      cancelled = true;
      normalizeGenerationRef.current += 1;
      lastInsertedKeyRef.current = null;
      mutationObserverRef.current?.disconnect();
      if (subscriptionIdRef.current) {
        void getBrazeModule().then((braze) => {
          braze?.removeSubscription(subscriptionIdRef.current!);
        });
      }
    };
  }, [placementId]);

  return {
    containerRef,
    status,
    placementId,
  };
}
