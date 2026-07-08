'use client';

import { ReactNode, useEffect } from 'react';
import {
  getBrazeModule,
  initializeBraze,
  isBrazeClientEnabled,
  openBrazeSession,
} from '@/lib/braze/client';

interface BrazeProviderProps {
  children: ReactNode;
}

export default function BrazeProvider({ children }: BrazeProviderProps) {
  useEffect(() => {
    let cancelled = false;

    async function setupBraze() {
      if (!isBrazeClientEnabled()) {
        return;
      }

      const initialized = await initializeBraze();
      if (cancelled || !initialized) {
        return;
      }

      const braze = await getBrazeModule();
      if (!braze || cancelled) {
        return;
      }

      // Banner 구독은 openSession 이전에 등록해야 합니다.
      braze.subscribeToBannersUpdates(() => {});

      await openBrazeSession();
    }

    void setupBraze();

    return () => {
      cancelled = true;
    };
  }, []);

  return <>{children}</>;
}
