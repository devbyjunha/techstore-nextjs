'use client';

import { ReactNode, useEffect } from 'react';
import {
  initializeAmplitude,
  isAmplitudeClientEnabled,
} from '@/lib/amplitude/client';

interface AmplitudeProviderProps {
  children: ReactNode;
}

export default function AmplitudeProvider({ children }: AmplitudeProviderProps) {
  useEffect(() => {
    let cancelled = false;

    async function setupAmplitude() {
      if (!isAmplitudeClientEnabled()) {
        return;
      }

      await initializeAmplitude();
      if (cancelled) {
        return;
      }
    }

    void setupAmplitude();

    return () => {
      cancelled = true;
    };
  }, []);

  return <>{children}</>;
}
