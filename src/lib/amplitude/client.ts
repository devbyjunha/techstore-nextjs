'use client';

import { getAmplitudeClientConfig } from './config';
import {
  AMPLITUDE_EVENTS,
  AmplitudeEventName,
  productEventProperties,
} from './events';
import type { Product } from '@/types';

type AmplitudeBrowser = typeof import('@amplitude/analytics-browser');

let amplitudeModule: AmplitudeBrowser | null = null;
let isInitialized = false;

async function loadAmplitudeModule(): Promise<AmplitudeBrowser | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!amplitudeModule) {
    amplitudeModule = await import('@amplitude/analytics-browser');
  }

  return amplitudeModule;
}

export function isAmplitudeClientEnabled(): boolean {
  return getAmplitudeClientConfig().enabled;
}

export async function initializeAmplitude(): Promise<boolean> {
  const config = getAmplitudeClientConfig();
  if (!config.enabled || isInitialized) {
    return isInitialized;
  }

  const amplitude = await loadAmplitudeModule();
  if (!amplitude) {
    return false;
  }

  const { LogLevel } = await import('@amplitude/analytics-core');

  amplitude.init(config.apiKey, undefined, {
    serverZone: config.serverZone,
    logLevel: config.enableLogging ? LogLevel.Debug : LogLevel.Warn,
    defaultTracking: {
      sessions: true,
      pageViews: true,
      formInteractions: false,
      fileDownloads: false,
    },
  });

  isInitialized = true;

  if (process.env.NODE_ENV === 'development') {
    (window as Window & { amplitude?: AmplitudeBrowser }).amplitude = amplitude;
  }

  return true;
}

export async function setAmplitudeUserId(userId: string): Promise<void> {
  if (!isInitialized) {
    return;
  }

  const amplitude = await loadAmplitudeModule();
  if (!amplitude) {
    return;
  }

  amplitude.setUserId(userId);
}

export async function clearAmplitudeUser(): Promise<void> {
  if (!isInitialized) {
    return;
  }

  const amplitude = await loadAmplitudeModule();
  if (!amplitude) {
    return;
  }

  amplitude.reset();
}

export async function trackAmplitudeEvent(
  eventName: AmplitudeEventName,
  properties?: Record<string, string | number | boolean>
): Promise<void> {
  if (!isInitialized) {
    return;
  }

  const amplitude = await loadAmplitudeModule();
  if (!amplitude) {
    return;
  }

  amplitude.track(eventName, properties);
}

export async function trackAmplitudeProductView(product: Product): Promise<void> {
  await trackAmplitudeEvent(
    AMPLITUDE_EVENTS.PRODUCT_VIEWED,
    productEventProperties(product)
  );
}

export async function trackAmplitudeAddToCart(product: Product): Promise<void> {
  await trackAmplitudeEvent(
    AMPLITUDE_EVENTS.ADDED_TO_CART,
    productEventProperties(product)
  );
}

export async function trackAmplitudeAddToWishlist(product: Product): Promise<void> {
  await trackAmplitudeEvent(
    AMPLITUDE_EVENTS.ADDED_TO_WISHLIST,
    productEventProperties(product)
  );
}

export async function trackAmplitudeLogin(
  email: string,
  name: string
): Promise<void> {
  await setAmplitudeUserId(email);
  await trackAmplitudeEvent(AMPLITUDE_EVENTS.USER_LOGIN, { email, name });
}

export async function trackAmplitudeLogout(): Promise<void> {
  await trackAmplitudeEvent(AMPLITUDE_EVENTS.USER_LOGOUT, {});
  await clearAmplitudeUser();
}
