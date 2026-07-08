'use client';

import {
  logBrazeLogin,
  logBrazeLogout,
} from './client';

type BrazeStoreAction =
  | { type: 'LOGIN'; payload: { name: string; email: string; membershipTier?: string } }
  | { type: 'LOGOUT' };

/** Braze Web SDK — auth events only. Commerce uses eCommerce recommended events in StoreContext. */
export async function trackStoreAction(
  action: { type: string; payload?: unknown }
): Promise<void> {
  switch (action.type) {
    case 'LOGIN': {
      const { email, name, membershipTier } = (
        action as BrazeStoreAction & { type: 'LOGIN' }
      ).payload;
      await logBrazeLogin(email, name, membershipTier);
      break;
    }
    case 'LOGOUT':
      await logBrazeLogout();
      break;
    default:
      break;
  }
}

export async function syncUserViaBrazeApi(params: {
  externalId: string;
  email: string;
  name: string;
  eventName?: string;
  membershipTier?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/users/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attributes: [
          {
            external_id: params.externalId,
            email: params.email,
            first_name: params.name,
            ...(params.membershipTier
              ? { membership_tier: params.membershipTier }
              : {}),
          },
        ],
        events: params.eventName
          ? [
              {
                external_id: params.externalId,
                name: params.eventName,
                properties: {
                  email: params.email,
                  name: params.name,
                },
              },
            ]
          : undefined,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error ?? 'Braze API sync failed' };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Braze API sync failed',
    };
  }
}
