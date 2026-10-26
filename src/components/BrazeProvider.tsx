'use client';

import { ReactNode, useEffect } from 'react';
import {
  clearBrazeUser,
  getBrazeExternalUserId,
  getBrazeModule,
  initializeBraze,
  isBrazeClientEnabled,
  openBrazeSession,
} from '@/lib/braze/client';
import { loadAppSession } from '@/lib/auth/session';
import { WEB_PUSH_LIQUID_PROBE_SOURCE } from '@/lib/braze/push-save';

interface BrazeProviderProps {
  children: ReactNode;
}

function isLocalhostBrowser(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

export default function BrazeProvider({ children }: BrazeProviderProps) {
  useEffect(() => {
    if (!isLocalhostBrowser() || !('serviceWorker' in navigator)) {
      return;
    }

    function onServiceWorkerMessage(event: MessageEvent) {
      if (event.data?.source !== WEB_PUSH_LIQUID_PROBE_SOURCE) {
        return;
      }
      console.log('[Web Push extra]', event.data.extra);
      console.log('[client_only_value]', event.data.client_only_value);
      console.log('[Web Push liquid probe]', {
        liquid_render_probe: event.data.liquid_render_probe,
        message_extras_probe: event.data.message_extras_probe,
      });
    }

    navigator.serviceWorker.addEventListener('message', onServiceWorkerMessage);
    return () => {
      navigator.serviceWorker.removeEventListener(
        'message',
        onServiceWorkerMessage
      );
    };
  }, []);

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

      const session = loadAppSession();
      if (session) {
        await openBrazeSession(session.email);
        return;
      }

      // 앱 세션이 없는데 Braze localStorage에 식별 사용자가 남아 있으면 로그아웃합니다.
      const leftoverUserId = await getBrazeExternalUserId();
      if (leftoverUserId) {
        await clearBrazeUser();
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
