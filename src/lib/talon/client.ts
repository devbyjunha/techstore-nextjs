import { getTalonServerConfig } from './config';
import type {
  EvaluateSessionRequest,
  TalonIntegrationState,
  TalonSessionState,
} from './types';

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

export async function updateCustomerSession(
  request: EvaluateSessionRequest
): Promise<TalonApiResult<TalonIntegrationState>> {
  const state: TalonSessionState = request.state ?? 'open';

  const customerSession: Record<string, unknown> = {
    profileId: request.profileId,
    state,
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

  return talonFetch<TalonIntegrationState>(
    `/v2/customer_sessions/${encodeURIComponent(request.sessionId)}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        customerSession,
        responseContent: ['customerSession', 'customerProfile', 'coupons'],
      }),
    }
  );
}
