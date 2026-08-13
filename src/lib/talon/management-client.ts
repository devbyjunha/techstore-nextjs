import { getTalonManagementConfig } from './config';

export interface TalonManagementResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

function campaignPath(suffix: string): string {
  const { applicationId, couponCampaignId } = getTalonManagementConfig();
  return `/v1/applications/${applicationId}/campaigns/${couponCampaignId}${suffix}`;
}

async function managementFetch<T>(
  path: string,
  init: RequestInit
): Promise<TalonManagementResult<T>> {
  const config = getTalonManagementConfig();
  if (!config.enabled) {
    return {
      ok: false,
      status: 503,
      error:
        'Talon Management API is not configured. Set TALON_ONE_MANAGEMENT_API_KEY and TALON_ONE_COUPON_CAMPAIGN_ID.',
    };
  }

  try {
    const headers = new Headers(init.headers);
    if (!headers.has('Authorization')) {
      headers.set(
        'Authorization',
        `ManagementKey-v1 ${config.managementApiKey}`
      );
    }

    const response = await fetch(`${config.baseUrl}${path}`, {
      ...init,
      headers,
      cache: 'no-store',
    });

    const contentType = response.headers.get('content-type') ?? '';
    const data = contentType.includes('application/json')
      ? ((await response.json().catch(() => ({}))) as T & {
          message?: string;
          Description?: string;
        })
      : ((await response.text().catch(() => '')) as T);

    if (!response.ok) {
      const message =
        (typeof data === 'object' &&
        data &&
        'message' in data &&
        (data as { message?: string }).message
          ? String((data as { message?: string }).message)
          : '') ||
        (typeof data === 'object' &&
        data &&
        'Description' in data &&
        (data as { Description?: string }).Description
          ? String((data as { Description?: string }).Description)
          : '') ||
        (typeof data === 'string' && data) ||
        `Talon Management API error (${response.status})`;

      return { ok: false, status: response.status, data, error: message };
    }

    return { ok: true, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 502,
      error: 'Failed to reach Talon.One Management API',
    };
  }
}

function extractCouponCodes(data: unknown): string[] {
  if (!data || typeof data !== 'object') return [];

  const root = data as Record<string, unknown>;
  const list = Array.isArray(root.data)
    ? root.data
    : Array.isArray(data)
      ? data
      : root.coupon
        ? [root.coupon]
        : [];

  const codes = list
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const value = (item as { value?: unknown }).value;
      return typeof value === 'string' ? value : null;
    })
    .filter((code): code is string => Boolean(code));

  if (codes.length === 0 && typeof root.value === 'string') {
    codes.push(root.value);
  }

  return codes;
}

/** Braze-style: create one new single-use coupon via Management API. */
export async function createManagementCoupon(params?: {
  recipientIntegrationId?: string;
}): Promise<TalonManagementResult<{ codes: string[]; raw: unknown }>> {
  const body: Record<string, unknown> = {
    usageLimit: 1,
    numberOfCoupons: 1,
    couponPattern: 'BRAZE-######',
    validCharacters: [
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
    ],
  };

  if (params?.recipientIntegrationId?.trim()) {
    body.recipientIntegrationId = params.recipientIntegrationId.trim();
  }

  const result = await managementFetch<unknown>(campaignPath('/coupons'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!result.ok) {
    return {
      ok: false,
      status: result.status,
      error: result.error,
      data: result.data
        ? { codes: [], raw: result.data }
        : undefined,
    };
  }

  return {
    ok: true,
    status: result.status,
    data: {
      codes: extractCouponCodes(result.data),
      raw: result.data,
    },
  };
}

/** PoC bulk import cap — keeps admin demos small; Talon allows much larger CSVs. */
export const POC_BULK_IMPORT_MAX = 100;

function buildImportStamp(): string {
  return new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 14);
}

async function postImportCsv(params: {
  csv: string;
  filename: string;
  codes: string[];
}): Promise<
  TalonManagementResult<{ amount: number; codes: string[]; raw: unknown }>
> {
  const form = new FormData();
  form.append(
    'file',
    new Blob([params.csv], { type: 'text/csv' }),
    params.filename
  );

  const result = await managementFetch<{ amount?: number }>(
    campaignPath('/import_coupons'),
    {
      method: 'POST',
      body: form,
    }
  );

  if (!result.ok) {
    return {
      ok: false,
      status: result.status,
      error: result.error,
      data: result.data
        ? { amount: 0, codes: [], raw: result.data }
        : undefined,
    };
  }

  const amount =
    typeof result.data === 'object' &&
    result.data &&
    typeof result.data.amount === 'number'
      ? result.data.amount
      : params.codes.length;

  return {
    ok: true,
    status: result.status,
    data: { amount, codes: params.codes, raw: result.data },
  };
}

/**
 * Migration-style: import a small mixed CSV batch via Management API.
 * Codes are unique per call so the admin button can be clicked repeatedly.
 */
export async function importManagementCouponsSample(): Promise<
  TalonManagementResult<{ amount: number; codes: string[]; raw: unknown }>
> {
  const stamp = buildImportStamp();
  const start = '2026-08-13T00:00:00+09:00';
  const end = '2026-12-31T23:59:59+09:00';

  const codes = [
    `MAPI-${stamp}-OK`,
    `MAPI-${stamp}-MULTI`,
    `MAPI-${stamp}-USER`,
  ];

  const csv = [
    '"value","startdate","expirydate","recipientintegrationid","limitval","discountlimit"',
    `${codes[0]},${start},${end},,1,`,
    `${codes[1]},${start},${end},,5,`,
    `${codes[2]},${start},${end},demo_user_001,1,`,
  ].join('\n');

  return postImportCsv({
    csv,
    filename: `admin-import-${stamp}.csv`,
    codes,
  });
}

/**
 * Bulk migration-style import: N unique open coupons in one CSV.
 * Demonstrates Management API import_coupons with a larger payload.
 */
export async function importManagementCouponsBulk(params: {
  count: number;
}): Promise<
  TalonManagementResult<{ amount: number; codes: string[]; raw: unknown }>
> {
  const count = Math.min(
    Math.max(Math.floor(params.count) || 1, 1),
    POC_BULK_IMPORT_MAX
  );
  const stamp = buildImportStamp();
  const start = '2026-08-13T00:00:00+09:00';
  const end = '2026-12-31T23:59:59+09:00';

  const codes = Array.from(
    { length: count },
    (_, i) => `BULK-${stamp}-${String(i + 1).padStart(3, '0')}`
  );

  const rows = [
    '"value","startdate","expirydate","recipientintegrationid","limitval","discountlimit"',
    ...codes.map((code) => `${code},${start},${end},,1,`),
  ];

  return postImportCsv({
    csv: rows.join('\n'),
    filename: `admin-bulk-import-${stamp}-${count}.csv`,
    codes,
  });
}

export function getManagementPoCMeta() {
  const config = getTalonManagementConfig();
  return {
    configured: config.enabled,
    applicationId: config.applicationId || null,
    couponCampaignId: config.couponCampaignId || null,
  };
}
