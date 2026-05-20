import { getBrazeServerConfig } from './config';

export interface BrazeUserAttribute {
  external_id: string;
  email?: string;
  first_name?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface BrazeTrackEvent {
  external_id: string;
  name: string;
  time?: string;
  properties?: Record<string, string | number | boolean>;
}

export interface BrazeTrackUsersPayload {
  attributes?: BrazeUserAttribute[];
  events?: BrazeTrackEvent[];
  purchases?: Array<{
    external_id: string;
    product_id: string;
    currency: string;
    price: number;
    quantity?: number;
    time?: string;
    properties?: Record<string, string | number | boolean>;
  }>;
}

export interface BrazeTrackResult {
  success: boolean;
  status?: number;
  data?: unknown;
  error?: string;
}

export async function brazeTrackUsers(
  payload: BrazeTrackUsersPayload
): Promise<BrazeTrackResult> {
  const config = getBrazeServerConfig();

  if (!config.enabled) {
    return {
      success: false,
      error: 'Braze REST API is not configured. Set BRAZE_REST_API_KEY and BRAZE_REST_API_URL.',
    };
  }

  const hasPayload =
    (payload.attributes?.length ?? 0) > 0 ||
    (payload.events?.length ?? 0) > 0 ||
    (payload.purchases?.length ?? 0) > 0;

  if (!hasPayload) {
    return { success: false, error: 'At least one attribute, event, or purchase is required.' };
  }

  try {
    const response = await fetch(`${config.restEndpoint}/users/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        data,
        error: `Braze API error (${response.status})`,
      };
    }

    return { success: true, status: response.status, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown Braze API error',
    };
  }
}

export async function syncBrazeUserProfile(params: {
  externalId: string;
  email: string;
  name: string;
}): Promise<BrazeTrackResult> {
  return brazeTrackUsers({
    attributes: [
      {
        external_id: params.externalId,
        email: params.email,
        first_name: params.name,
      },
    ],
  });
}
