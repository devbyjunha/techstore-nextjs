'use client';

import { ReactNode, useEffect } from 'react';
import {
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

      await openBrazeSession();
    }

    void setupBraze();

    return () => {
      cancelled = true;
    };
  }, []);

  return <>{children}</>;
}
