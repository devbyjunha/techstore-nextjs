import { NextRequest } from 'next/server';

export interface ParsedCouponRequest {
  campaignApiId: string;
  dispatchId: string;
  promotionId: string;
  userId: string;
  discountPercent?: number;
}

type ParseResult =
  | { ok: true; params: ParsedCouponRequest }
  | { ok: false; message: string };

export async function parseCouponRequest(
  request: NextRequest
): Promise<ParseResult> {
  const fromQuery = extractFromSearchParams(request.nextUrl.searchParams);
  const contentType = request.headers.get('content-type') ?? '';
  let fromBody: Partial<ParsedCouponRequest> = {};

  if (request.method === 'POST') {
    try {
      if (contentType.includes('application/json')) {
        const json = (await request.json()) as Record<string, unknown>;
        fromBody = extractFromRecord(json);
      } else {
        const text = await request.text();
        if (text.trim()) {
          if (contentType.includes('application/x-www-form-urlencoded')) {
            fromBody = extractFromSearchParams(new URLSearchParams(text));
          } else {
            try {
              const json = JSON.parse(text) as Record<string, unknown>;
              fromBody = extractFromRecord(json);
            } catch {
              fromBody = extractFromSearchParams(new URLSearchParams(text));
            }
          }
        }
      }
    } catch {
      return { ok: false, message: 'Could not parse request body.' };
    }
  }

  const merged = {
    campaignApiId: fromBody.campaignApiId ?? fromQuery.campaignApiId,
    dispatchId: fromBody.dispatchId ?? fromQuery.dispatchId,
    promotionId: fromBody.promotionId ?? fromQuery.promotionId,
    userId: fromBody.userId ?? fromQuery.userId,
    discountPercent: fromBody.discountPercent ?? fromQuery.discountPercent,
  };

  const missing: string[] = [];
  if (!merged.campaignApiId) missing.push('campaign_api_id');
  if (!merged.dispatchId) missing.push('dispatch_id');
  if (!merged.promotionId) missing.push('promotion_id');
  if (!merged.userId) missing.push('user_id');

  if (missing.length > 0) {
    return {
      ok: false,
      message: `Missing required parameters: ${missing.join(', ')}`,
    };
  }

  return {
    ok: true,
    params: {
      campaignApiId: merged.campaignApiId!,
      dispatchId: merged.dispatchId!,
      promotionId: merged.promotionId!,
      userId: merged.userId!,
      discountPercent: merged.discountPercent,
    },
  };
}

function extractFromSearchParams(
  params: URLSearchParams
): Partial<ParsedCouponRequest> {
  return extractFromRecord(Object.fromEntries(params.entries()));
}

function extractFromRecord(
  record: Record<string, unknown>
): Partial<ParsedCouponRequest> {
  const campaignApiId = pickString(record, [
    'campaign_api_id',
    'campaign_id',
    'api_id',
  ]);
  const dispatchId = pickString(record, [
    'dispatch_id',
    'campaign_dispatch_id',
  ]);
  const promotionId = pickString(record, ['promotion_id', 'promo_id']);
  const userId = pickString(record, [
    'user_id',
    'external_id',
    'unique_user_id',
  ]);
  const discountPercent = pickNumber(record, ['discount_percent']);

  return {
    campaignApiId,
    dispatchId,
    promotionId,
    userId,
    discountPercent,
  };
}

function pickString(
  record: Record<string, unknown>,
  keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }
  return undefined;
}

function pickNumber(
  record: Record<string, unknown>,
  keys: string[]
): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}
