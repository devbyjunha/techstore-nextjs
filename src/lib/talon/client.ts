import { getTalonServerConfig } from './config';
import type {
  EvaluateSessionRequest,
  TalonIntegrationState,
  TalonSessionState,
} from './types';
import { CART_THRESHOLD_CAMPAIGN_ID } from './notifications';

export interface TalonApiResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

async function talonFetch<T>(
  path: string,
  init: RequestInit
): Promise<TalonApiResult<T>> {
  const config = getTalonServerConfig();
  if (!config.enabled) {
    return {
      ok: false,
      status: 503,
      error:
        'Talon.One is not configured. Set TALON_ONE_BASE_URL and TALON_ONE_API_KEY.',
    };
  }

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `ApiKey-v1 ${config.apiKey}`,
        ...(init.headers ?? {}),
      },
      cache: 'no-store',
    });

    const data = (await response.json().catch(() => ({}))) as T & {
      message?: string;
      Description?: string;
    };

    if (!response.ok) {
      const message =
        (typeof data === 'object' && data && 'message' in data
          ? String((data as { message?: string }).message ?? '')
          : '') ||
        (typeof data === 'object' && data && 'Description' in data
          ? String((data as { Description?: string }).Description ?? '')
          : '') ||
        `Talon.One API error (${response.status})`;

      return { ok: false, status: response.status, data, error: message };
    }

    return { ok: true, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 502,
      error: 'Failed to reach Talon.One API',
    };
  }
}

export async function updateCustomerProfileAttributes(params: {
  profileId: string;
  attributes: Record<string, string | number | boolean>;
}): Promise<TalonApiResult<unknown>> {
  return talonFetch(`/v2/customer_profiles/${encodeURIComponent(params.profileId)}`, {
    method: 'PUT',
    body: JSON.stringify({
      attributes: params.attributes,
    }),
  });
}

export interface TalonCustomerProfileUpsert {
  integrationId: string;
  attributes: Record<string, string | number | boolean>;
}

/**
 * Bulk upsert (max 1000 / request). `silent=true` skips the rule engine —
 * use this for Go-live import, not for cart evaluation.
 */
export async function updateCustomerProfilesBulk(params: {
  profiles: TalonCustomerProfileUpsert[];
}): Promise<TalonApiResult<unknown>> {
  return talonFetch('/v2/customer_profiles?silent=true', {
    method: 'PUT',
    body: JSON.stringify({
      customerProfiles: params.profiles.map((profile) => ({
        integrationId: profile.integrationId,
        attributes: profile.attributes,
      })),
    }),
  });
}

export interface TalonCustomerInventoryProfile {
  profileId: string;
  membershipTier?: string;
  attributeKeys: string[];
}

/** Lookup migrated attributes. Query `profile=true` returns the Customer Profile. */
export async function getCustomerInventory(
  profileId: string
): Promise<TalonApiResult<TalonCustomerInventoryProfile>> {
  const result = await talonFetch<{
    profile?: {
      integrationId?: string;
      attributes?: Record<string, unknown>;
    };
  }>(
    `/v1/customer_profiles/${encodeURIComponent(profileId)}/inventory?profile=true`,
    { method: 'GET' }
  );

  if (!result.ok) {
    return {
      ok: false,
      status: result.status,
      error: result.error,
      data: result.data
        ? { profileId, attributeKeys: [] }
        : undefined,
    };
  }

  const attributes = result.data?.profile?.attributes ?? {};
  const membershipTier =
    typeof attributes.MembershipTier === 'string'
      ? attributes.MembershipTier
      : undefined;

  return {
    ok: true,
    status: result.status,
    data: {
      profileId: result.data?.profile?.integrationId ?? profileId,
      membershipTier,
      attributeKeys: Object.keys(attributes),
    },
  };
}

export async function updateCustomerSession(
  request: EvaluateSessionRequest
): Promise<TalonApiResult<TalonIntegrationState>> {
  const state: TalonSessionState = request.state ?? 'open';

  const customerSession: Record<string, unknown> = {
    profileId: request.profileId,
    state,
    ...(request.storeIntegrationId ? { storeIntegrationId: request.storeIntegrationId } : {}),
    cartItems: request.cartItems.map((item) => ({
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      price: item.price,
      ...(item.category ? { category: item.category } : {}),
    })),
    // Always send the array so clearing coupons ( [] ) removes them from the session.
    // Omitting the field leaves previously applied codes on the open session.
    couponCodes: request.couponCodes ?? [],
  };

  if (request.membershipTier) {
    const profileResult = await updateCustomerProfileAttributes({
      profileId: request.profileId,
      attributes: { MembershipTier: request.membershipTier },
    });
    // Profile update failure should not block session evaluation in PoC,
    // but surface the error when session also fails.
    if (!profileResult.ok && profileResult.status === 401) {
      return {
        ok: false,
        status: profileResult.status,
        error: profileResult.error,
      };
    }
  }

  const sessionPath = `/v2/customer_sessions/${encodeURIComponent(request.sessionId)}`;
  const result = await talonFetch<TalonIntegrationState>(sessionPath, {
    method: 'PUT',
    body: JSON.stringify({
      customerSession,
      responseContent: [
        'customerSession',
        'customerProfile',
        'coupons',
        'ruleFailureReasons',
      ],
    }),
  });

  // campaignEligibility is available on dry requests. Keep the regular session
  // write above intact, then make a non-persisting diagnostic evaluation only
  // when the known cart campaign did not return a discount effect.
  const subtotal = request.cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const thresholdDiscountReturned = (result.data?.effects ?? []).some((effect) =>
    Number(effect.campaignId) === CART_THRESHOLD_CAMPAIGN_ID &&
    effect.effectType.startsWith('setDiscount') &&
    Number(effect.props?.value) > 0
  );
  if (
    result.ok &&
    result.data &&
    state === 'open' &&
    subtotal >= 50_000 &&
    !thresholdDiscountReturned
  ) {
    const diagnosticResult = await talonFetch<TalonIntegrationState>(`${sessionPath}?dry=true`, {
      method: 'PUT',
      body: JSON.stringify({
        customerSession,
        responseContent: ['campaignEligibility'],
      }),
    });
    if (diagnosticResult.ok && diagnosticResult.data?.campaignEligibility) {
      result.data = {
        ...result.data,
        campaignEligibility: diagnosticResult.data.campaignEligibility,
      };
    }
  }

  return result;
}
