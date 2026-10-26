import { NextRequest } from 'next/server';
import { emptyCorsPreflight, jsonWithCors } from '@/lib/http/cors';
import { updateCustomerSession } from '@/lib/talon/client';
import { getTalonServerConfig } from '@/lib/talon/config';
import { mapTalonEffects } from '@/lib/talon/map-effects';
import { POS_STORES, findStoreById, DEFAULT_POS_STORE } from '@/lib/talon/stores';
import type { EvaluateSessionRequest, TalonCartItemInput, TalonSessionState } from '@/lib/talon/types';

interface PosSessionBody {
  /** POS terminal identifier, e.g. "term-01" */
  terminalId?: string;
  /** Customer profileId (membership card scan). Null/omitted = anonymous walk-in. */
  profileId?: string | null;
  /** storeIntegrationId — must match a configured POS store */
  storeIntegrationId?: string;
  /** Cart items from barcode scans */
  cartItems?: TalonCartItemInput[];
  /** Session state */
  state?: TalonSessionState;
  /** Coupon codes (manual entry or scanned) */
  couponCodes?: string[];
  /** Membership tier override (if identified at POS) */
  membershipTier?: string;
}

function generateAnonymousProfileId(terminalId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `pos-anon-${terminalId}-${timestamp}-${random}`;
}

function generateSessionId(terminalId: string, storeId: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seq = Math.random().toString(36).substring(2, 8);
  return `POS-${storeId}-${date}-${terminalId}-${seq}`;
}

function parseBody(body: PosSessionBody): EvaluateSessionRequest | string {
  const terminalId = body.terminalId?.trim() || 'term-01';

  // Resolve store
  const storeIntegrationId = body.storeIntegrationId?.trim() || DEFAULT_POS_STORE.storeIntegrationId;
  const store = findStoreById(storeIntegrationId);
  if (!store || store.channel !== 'offline') {
    const validIds = POS_STORES.map((s) => s.storeIntegrationId).join(', ');
    return `Invalid POS storeIntegrationId: "${storeIntegrationId}". Valid: ${validIds}`;
  }

  // Resolve profile (anonymous or identified)
  const profileId = body.profileId?.trim() || generateAnonymousProfileId(terminalId);

  // Validate cart items
  if (!Array.isArray(body.cartItems) || body.cartItems.length === 0) {
    return 'cartItems must be a non-empty array';
  }
  for (const item of body.cartItems) {
    if (!item?.sku || !item?.name || !(item.quantity > 0) || !(item.price >= 0)) {
      return 'Each cartItem needs sku, name, quantity > 0, and price >= 0';
    }
  }

  const sessionId = generateSessionId(terminalId, storeIntegrationId);

  return {
    sessionId,
    profileId,
    state: body.state ?? 'open',
    storeIntegrationId,
    cartItems: body.cartItems,
    couponCodes: (body.couponCodes ?? []).map((c) => c.trim()).filter(Boolean),
    membershipTier: body.membershipTier?.trim() || undefined,
  };
}

export async function OPTIONS(request: NextRequest) {
  return emptyCorsPreflight(request);
}

/**
 * POST /api/v1/talon/pos/session
 * Evaluate a POS terminal session against Talon.One campaigns.
 */
export async function POST(request: NextRequest) {
  const config = getTalonServerConfig();
  if (!config.enabled) {
    return jsonWithCors(
      request,
      {
        configured: false,
        error: 'Talon.One is not configured',
        sessionId: '',
        subtotal: 0,
        totalDiscount: 0,
        total: 0,
        coupons: [],
        effects: [],
        loyalty: { willEarn: 0 },
      },
      { status: 503 }
    );
  }

  let body: PosSessionBody;
  try {
    body = (await request.json()) as PosSessionBody;
  } catch {
    return jsonWithCors(request, { error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = parseBody(body);
  if (typeof parsed === 'string') {
    return jsonWithCors(request, { error: parsed }, { status: 400 });
  }

  const subtotal = parsed.cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const result = await updateCustomerSession(parsed);
  if (!result.ok || !result.data) {
    return jsonWithCors(
      request,
      {
        configured: true,
        sessionId: parsed.sessionId,
        storeIntegrationId: parsed.storeIntegrationId,
        profileId: parsed.profileId,
        subtotal,
        totalDiscount: 0,
        total: subtotal,
        coupons: [],
        effects: [],
        loyalty: { willEarn: 0 },
        error: result.error ?? 'Talon.One session update failed',
      },
      { status: result.status >= 400 ? result.status : 502 }
    );
  }

  const normalized = mapTalonEffects(result.data.effects, {
    sessionId: parsed.sessionId,
    subtotal,
    requestedCoupons: parsed.couponCodes ?? [],
    ruleFailureReasons: result.data.ruleFailureReasons,
    campaignEligibility: result.data.campaignEligibility,
  });

  return jsonWithCors(request, {
    ...normalized,
    storeIntegrationId: parsed.storeIntegrationId,
    profileId: parsed.profileId,
    isAnonymous: parsed.profileId.startsWith('pos-anon-'),
  });
}
