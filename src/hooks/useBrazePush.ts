'use client';

import { useCallback, useEffect, useState } from 'react';
import { isBrazeClientEnabled } from '@/lib/braze/client';
import {
  BrazePushState,
  getBrazePushState,
  requestBrazePushPermission,
  unregisterBrazePush,
} from '@/lib/braze/push';

export function useBrazePush() {
  const isEnabled = isBrazeClientEnabled();
  const [pushState, setPushState] = useState<BrazePushState>({
    status: 'not_initialized',
    isSupported: false,
    isPermissionGranted: false,
    isBlocked: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isEnabled) {
      return;
    }
    setPushState(await getBrazePushState());
  }, [isEnabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enablePush = useCallback(async () => {
    if (!isEnabled) {
      return { granted: false, temporaryDenial: false };
    }

    setIsLoading(true);
    try {
      const result = await requestBrazePushPermission();
      await refresh();
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled, refresh]);

  const disablePush = useCallback(async () => {
    if (!isEnabled) {
      return false;
    }

    setIsLoading(true);
    try {
      const ok = await unregisterBrazePush();
      await refresh();
      return ok;
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled, refresh]);

  return {
    isEnabled,
    pushState,
    isLoading,
    refresh,
    enablePush,
    disablePush,
  };
}
