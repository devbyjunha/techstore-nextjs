'use client';

import { ReactNode, useEffect } from 'react';
import {
  initializeAmplitude,
  isAmplitudeClientEnabled,
} from '@/lib/amplitude/client';
import { isLocalEnv } from '@/lib/app-env';

interface AmplitudeProviderProps {
  children: ReactNode;
}

export default function AmplitudeProvider({ children }: AmplitudeProviderProps) {
  useEffect(() => {
    let cancelled = false;

    async function setupAmplitude() {
      if (!isAmplitudeClientEnabled()) {
        if (isLocalEnv()) {
          console.info(
            '[Amplitude] 비활성화됨 — NEXT_PUBLIC_AMPLITUDE_API_KEY를 설정하거나, ' +
              '오류 시 NEXT_PUBLIC_AMPLITUDE_DISABLED=true 로 끌 수 있습니다.'
          );
        }
        return;
      }

      const ok = await initializeAmplitude();
      if (!ok && isLocalEnv() && !cancelled) {
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
