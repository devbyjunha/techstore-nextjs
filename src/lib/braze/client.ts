'use client';

import { getBrazeClientConfig } from './config';
import { isLocalEnv } from '@/lib/app-env';
import { BRAZE_EVENTS, BrazeEventName } from './events';
import {
  ECOMMERCE_EVENTS,
  EcommerceEventName,
  EcommerceProperties,
  buildCartUpdatedProperties,
  buildCheckoutStartedProperties,
  buildOrderCancelledProperties,
  buildOrderPlacedProperties,
  buildOrderRefundedProperties,
  buildProductViewedProperties,
} from './ecommerce';
import type { CartItem, Product } from '@/types';
import { installIamExperimentWrapper } from './iam-experiment';

type BrazeModule = typeof import('@braze/web-sdk');

let brazeModule: BrazeModule | null = null;
let isInitialized = false;
let initPromise: Promise<boolean> | null = null;

export function isBrazeInitialized(): boolean {
  return isInitialized;
}

export async function getBrazeModule(): Promise<BrazeModule | null> {
  return loadBrazeModule();
}

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
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
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
      allowUserSuppliedJavascript: true,
      serviceWorkerLocation: '/service-worker.js',
    });

    // 기본 Control Group 대신 Extra `experiment_group=cg` Variant를 대조군으로 사용.
    // automaticallyShowInAppMessages()는 호출하지 않고, openSession 전에 Wrapper를 설치합니다.
    installIamExperimentWrapper(braze);
    isInitialized = true;

    if (isLocalEnv()) {
      (window as Window & { braze?: BrazeModule }).braze = braze;
    }

    return true;
  })();

  return initPromise;
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

export async function setBrazeUser(
  externalUserId: string,
  membershipTier?: string
): Promise<void> {
  if (!isInitialized) {
    return;
  }

  const braze = await loadBrazeModule();
  if (!braze) {
    return;
  }

  braze.changeUser(externalUserId);

  if (membershipTier) {
    braze.getUser()?.setCustomUserAttribute('membership_tier', membershipTier);
  }

  braze.requestImmediateDataFlush();

  braze.requestBannersRefresh([getBrazeClientConfig().pdpBenefitsPlacementId]);
}

/**
 * Braze `external_id` currently identified by the SDK (`changeUser` 이후).
 * Talon.One `profileId`와 동일 키로 맞출 때 사용합니다.
 */
export async function getBrazeExternalUserId(): Promise<string | null> {
  if (typeof window === 'undefined' || !isInitialized) {
    return null;
  }

  const braze = await loadBrazeModule();
  if (!braze) {
    return null;
  }

  const userId = braze.getUser()?.getUserId();
  if (typeof userId !== 'string') {
    return null;
  }

  const trimmed = userId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resetBrazeInitState(): void {
  isInitialized = false;
  initPromise = null;
}

/**
 * 로그아웃: 현재 사용자의 푸시 토큰을 해제한 뒤 SDK를 비활성화하고 로컬 데이터를 지웁니다.
 * 성공하면 enableSDK + initialize + openSession으로 새 비회원(anonymous) 프로필 세션을 엽니다.
 * logout 실패 시에는 기존 식별 사용자를 유지합니다.
 */
export async function clearBrazeUser(): Promise<void> {
  if (!isInitialized) {
    return;
  }

  const braze = await loadBrazeModule();
  if (!braze) {
    return;
  }

  await new Promise<void>((resolve) => {
    braze.requestImmediateDataFlush(() => resolve());
  });

  const loggedOut = await new Promise<boolean>((resolve) => {
    braze.logout(
      () => resolve(true),
      () => resolve(false)
    );
  });

  if (!loggedOut) {
    return;
  }

  resetBrazeInitState();
  braze.enableSDK();

  const ready = await initializeBraze();
  if (!ready) {
    return;
  }

  braze.subscribeToBannersUpdates(() => {});
  await openBrazeSession();
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

/**
 * Logs a Braze eCommerce recommended event.
 *
 * Unlike `logBrazeCustomEvent`, this accepts nested objects and arrays
 * (`products[]`, `metadata`) required by the recommended event schemas.
 */
export async function logBrazeEcommerceEvent(
  eventName: EcommerceEventName,
  properties: EcommerceProperties
): Promise<void> {
  if (!isInitialized) {
    return;
  }

  const braze = await loadBrazeModule();
  if (!braze) {
    return;
  }

  braze.logCustomEvent(
    eventName,
    properties as unknown as Parameters<typeof braze.logCustomEvent>[1]
  );
}

export async function logBrazeProductViewed(product: Product): Promise<void> {
  await logBrazeEcommerceEvent(
    ECOMMERCE_EVENTS.PRODUCT_VIEWED,
    buildProductViewedProperties(product)
  );
}

export async function logBrazeCartUpdated(params: {
  cartId: string;
  cart: CartItem[];
}): Promise<void> {
  await logBrazeEcommerceEvent(
    ECOMMERCE_EVENTS.CART_UPDATED,
    buildCartUpdatedProperties(params)
  );
}

export async function logBrazeCheckoutStarted(params: {
  checkoutId: string;
  cartId: string;
  cart: CartItem[];
}): Promise<void> {
  await logBrazeEcommerceEvent(
    ECOMMERCE_EVENTS.CHECKOUT_STARTED,
    buildCheckoutStartedProperties(params)
  );
}

export async function logBrazeOrderPlaced(params: {
  orderId: string;
  cartId: string;
  cart: CartItem[];
}): Promise<void> {
  await logBrazeEcommerceEvent(
    ECOMMERCE_EVENTS.ORDER_PLACED,
    buildOrderPlacedProperties(params)
  );
}

export async function logBrazeOrderCancelled(params: {
  orderId: string;
  items: CartItem[];
  totalValue: number;
  cancelReason: string;
}): Promise<void> {
  await logBrazeEcommerceEvent(
    ECOMMERCE_EVENTS.ORDER_CANCELLED,
    buildOrderCancelledProperties(params)
  );
}

export async function logBrazeOrderRefunded(params: {
  orderId: string;
  items: CartItem[];
  totalValue: number;
}): Promise<void> {
  await logBrazeEcommerceEvent(
    ECOMMERCE_EVENTS.ORDER_REFUNDED,
    buildOrderRefundedProperties(params)
  );
}

export async function logBrazeLogin(
  email: string,
  name: string,
  membershipTier?: string
): Promise<void> {
  await setBrazeUser(email, membershipTier);
  await logBrazeCustomEvent(BRAZE_EVENTS.USER_LOGIN, {
    email,
    name,
    ...(membershipTier ? { membership_tier: membershipTier } : {}),
  });
}

export async function logBrazeLogout(): Promise<void> {
  await logBrazeCustomEvent(BRAZE_EVENTS.USER_LOGOUT, {});
  await clearBrazeUser();
}
