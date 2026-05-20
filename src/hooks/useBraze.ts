'use client';

import { useCallback } from 'react';
import {
  isBrazeClientEnabled,
  logBrazeCustomEvent,
  logBrazeProductView,
  setBrazeUser,
} from '@/lib/braze/client';
import { BrazeEventName } from '@/lib/braze/events';
import { syncUserViaBrazeApi } from '@/lib/braze/analytics';
import type { Product } from '@/types';

export function useBraze() {
  const isEnabled = isBrazeClientEnabled();

  const trackEvent = useCallback(
    async (
      eventName: BrazeEventName,
      properties?: Record<string, string | number | boolean>
    ) => {
      await logBrazeCustomEvent(eventName, properties);
    },
    []
  );

  const trackProductView = useCallback(async (product: Product) => {
    await logBrazeProductView(product);
  }, []);

  const identifyUser = useCallback(async (externalId: string) => {
    await setBrazeUser(externalId);
  }, []);

  const syncUserProfile = useCallback(
    async (params: {
      externalId: string;
      email: string;
      name: string;
      eventName?: string;
    }) => {
      return syncUserViaBrazeApi(params);
    },
    []
  );

  return {
    isEnabled,
    trackEvent,
    trackProductView,
    identifyUser,
    syncUserProfile,
  };
}
