'use client';

import { useCallback } from 'react';
import {
  isAmplitudeClientEnabled,
  setAmplitudeUserId,
  trackAmplitudeEvent,
  trackAmplitudeProductView,
} from '@/lib/amplitude/client';
import { AmplitudeEventName } from '@/lib/amplitude/events';
import { syncUserViaAmplitudeApi } from '@/lib/amplitude/analytics';
import type { Product } from '@/types';

export function useAmplitude() {
  const isEnabled = isAmplitudeClientEnabled();

  const trackEvent = useCallback(
    async (
      eventName: AmplitudeEventName,
      properties?: Record<string, string | number | boolean>
    ) => {
      await trackAmplitudeEvent(eventName, properties);
    },
    []
  );

  const trackProductView = useCallback(async (product: Product) => {
    await trackAmplitudeProductView(product);
  }, []);

  const identifyUser = useCallback(async (userId: string) => {
    await setAmplitudeUserId(userId);
  }, []);

  const syncUserProfile = useCallback(
    async (params: {
      userId: string;
      email: string;
      name: string;
      eventName?: string;
    }) => {
      return syncUserViaAmplitudeApi(params);
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
