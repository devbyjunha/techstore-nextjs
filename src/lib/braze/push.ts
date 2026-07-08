'use client';

import { getBrazeModule, isBrazeInitialized } from './client';

export type BrazePushStatus =
  | 'unsupported'
  | 'blocked'
  | 'denied'
  | 'granted'
  | 'not_initialized';

export interface BrazePushState {
  status: BrazePushStatus;
  isSupported: boolean;
  isPermissionGranted: boolean;
  isBlocked: boolean;
}

export async function getBrazePushState(): Promise<BrazePushState> {
  if (!isBrazeInitialized()) {
    return {
      status: 'not_initialized',
      isSupported: false,
      isPermissionGranted: false,
      isBlocked: false,
    };
  }

  const braze = await getBrazeModule();
  if (!braze) {
    return {
      status: 'not_initialized',
      isSupported: false,
      isPermissionGranted: false,
      isBlocked: false,
    };
  }

  const isSupported = braze.isPushSupported() === true;
  const isBlocked = braze.isPushBlocked() === true;
  const isPermissionGranted = braze.isPushPermissionGranted() === true;

  let status: BrazePushStatus = 'denied';
  if (!isSupported) {
    status = 'unsupported';
  } else if (isBlocked) {
    status = 'blocked';
  } else if (isPermissionGranted) {
    status = 'granted';
  }

  return {
    status,
    isSupported,
    isPermissionGranted,
    isBlocked,
  };
}

export async function requestBrazePushPermission(): Promise<{
  granted: boolean;
  temporaryDenial: boolean;
}> {
  if (!isBrazeInitialized()) {
    return { granted: false, temporaryDenial: false };
  }

  const braze = await getBrazeModule();
  if (!braze || braze.isPushSupported() !== true) {
    return { granted: false, temporaryDenial: false };
  }

  return new Promise((resolve) => {
    braze.requestPushPermission(
      () => {
        braze
          .getUser()
          ?.setPushNotificationSubscriptionType(
            braze.User.NotificationSubscriptionTypes.OPTED_IN
          );
        braze.requestImmediateDataFlush();
        resolve({ granted: true, temporaryDenial: false });
      },
      (temporaryDenial) => {
        resolve({ granted: false, temporaryDenial });
      }
    );
  });
}

export async function unregisterBrazePush(): Promise<boolean> {
  if (!isBrazeInitialized()) {
    return false;
  }

  const braze = await getBrazeModule();
  if (!braze) {
    return false;
  }

  return new Promise((resolve) => {
    braze.unregisterPush(
      () => {
        braze.requestImmediateDataFlush();
        resolve(true);
      },
      () => resolve(false)
    );
  });
}
