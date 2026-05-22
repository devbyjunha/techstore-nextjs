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
        if (process.env.NODE_ENV === 'development') {
          console.info(
            '[Amplitude] 비활성화됨 — NEXT_PUBLIC_AMPLITUDE_API_KEY를 설정하거나, ' +
              '오류 시 NEXT_PUBLIC_AMPLITUDE_DISABLED=true 로 끌 수 있습니다.'
          );
        }
        return;
      }

      const ok = await initializeAmplitude();
      if (!ok && process.env.NODE_ENV === 'development' && !cancelled) {
        console.warn(
          '[Amplitude] api2.amplitude.com 연결 실패 가능 — VPN/프록시·API 키·SERVER_ZONE(EU/US)를 확인하세요.'
        );
      }
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
