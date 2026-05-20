'use client';

import { getBrazeClientConfig } from './config';
import { BRAZE_EVENTS, BrazeEventName, productEventProperties } from './events';
import type { Product } from '@/types';

type BrazeModule = typeof import('@braze/web-sdk');

let brazeModule: BrazeModule | null = null;
let isInitialized = false;

async function loadBrazeModule(): Promise<BrazeModule | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!brazeModule) {
    brazeModule = await import('@braze/web-sdk');
  }

  return brazeModule;
}

export function isBrazeClientEnabled(): boolean {
  return getBrazeClientConfig().enabled;
}

export async function initializeBraze(): Promise<boolean> {
  const config = getBrazeClientConfig();
  if (!config.enabled || isInitialized) {
    return isInitialized;
  }

  const braze = await loadBrazeModule();
  if (!braze) {
    return false;
  }

  braze.initialize(config.apiKey, {
    baseUrl: config.sdkEndpoint,
    enableLogging: config.enableLogging,
  });

  braze.automaticallyShowInAppMessages();
  isInitialized = true;

  if (process.env.NODE_ENV === 'development') {
    (window as Window & { braze?: BrazeModule }).braze = braze;
  }

  return true;
}

export async function openBrazeSession(externalUserId?: string): Promise<void> {
  if (!isInitialized) {
    return;
  }

  const braze = await loadBrazeModule();
  if (!braze) {
    return;
  }

  if (externalUserId) {
    braze.changeUser(externalUserId);
  }

  braze.openSession();
}

export async function setBrazeUser(externalUserId: string): Promise<void> {
  if (!isInitialized) {
    return;
  }

  const braze = await loadBrazeModule();
  if (!braze) {
    return;
  }

  braze.changeUser(externalUserId);
  braze.requestImmediateDataFlush();
}

export async function clearBrazeUser(): Promise<void> {
  if (!isInitialized) {
    return;
  }

  const braze = await loadBrazeModule();
  if (!braze) {
    return;
  }

  braze.wipeData();
  braze.openSession();
}

export async function logBrazeCustomEvent(
  eventName: BrazeEventName,
  properties?: Record<string, string | number | boolean>
): Promise<void> {
  if (!isInitialized) {
    return;
  }

  const braze = await loadBrazeModule();
  if (!braze) {
    return;
  }

  braze.logCustomEvent(eventName, properties);
}

export async function logBrazeProductView(product: Product): Promise<void> {
  await logBrazeCustomEvent(BRAZE_EVENTS.PRODUCT_VIEWED, productEventProperties(product));
}

export async function logBrazeAddToCart(product: Product): Promise<void> {
  await logBrazeCustomEvent(BRAZE_EVENTS.ADDED_TO_CART, productEventProperties(product));
}

export async function logBrazeAddToWishlist(product: Product): Promise<void> {
  await logBrazeCustomEvent(
    BRAZE_EVENTS.ADDED_TO_WISHLIST,
    productEventProperties(product)
  );
}

export async function logBrazeLogin(email: string, name: string): Promise<void> {
  await setBrazeUser(email);
  await logBrazeCustomEvent(BRAZE_EVENTS.USER_LOGIN, {
    email,
    name,
  });
}

export async function logBrazeLogout(): Promise<void> {
  await logBrazeCustomEvent(BRAZE_EVENTS.USER_LOGOUT, {});
  await clearBrazeUser();
}
