/**
 * Talon.One Management API helpers (PoC only).
 * Do not call from cart/checkout — Integration API stays in src/lib/talon/.
 */

export function getManagementConfig() {
  const baseUrl = (process.env.TALON_ONE_BASE_URL ?? '').replace(/\/$/, '');
  const managementKey = process.env.TALON_ONE_MANAGEMENT_API_KEY ?? '';
  const applicationId = process.env.TALON_ONE_APPLICATION_ID ?? '';
  const campaignId = process.env.TALON_ONE_COUPON_CAMPAIGN_ID ?? '';

  const missing = [];
  if (!baseUrl) missing.push('TALON_ONE_BASE_URL');
  if (!managementKey) missing.push('TALON_ONE_MANAGEMENT_API_KEY');
  if (!applicationId) missing.push('TALON_ONE_APPLICATION_ID');
  if (!campaignId) missing.push('TALON_ONE_COUPON_CAMPAIGN_ID');

  if (missing.length > 0) {
    throw new Error(
      `Missing env: ${missing.join(', ')}. Copy keys into .env.local (see .env.example).`
    );
  }

  return { baseUrl, managementKey, applicationId, campaignId };
}

export async function managementFetch(path, init = {}) {
  const { baseUrl, managementKey } = getManagementConfig();
  const headers = new Headers(init.headers ?? {});

  if (!headers.has('Authorization')) {
    headers.set('Authorization', `ManagementKey-v1 ${managementKey}`);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const body = isJson
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => '');

  if (!response.ok) {
    const message =
      (typeof body === 'object' && body && (body.message || body.Description)) ||
      (typeof body === 'string' && body) ||
      `Management API error (${response.status})`;
    const err = new Error(String(message));
    err.status = response.status;
    err.body = body;
    throw err;
  }

  return { status: response.status, data: body };
}

export function campaignCouponsPath(suffix = '') {
  const { applicationId, campaignId } = getManagementConfig();
  return `/v1/applications/${applicationId}/campaigns/${campaignId}${suffix}`;
}

export function printJson(label, value) {
  console.log(`\n=== ${label} ===`);
  console.log(typeof value === 'string' ? value : JSON.stringify(value, null, 2));
}
