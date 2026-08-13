import { NextRequest, NextResponse } from 'next/server';
import { updateCustomerSession } from '@/lib/talon/client';
import { getTalonServerConfig } from '@/lib/talon/config';
import { mapTalonEffects } from '@/lib/talon/map-effects';
import type { EvaluateSessionRequest, TalonSessionState } from '@/lib/talon/types';

interface SessionBody {
  sessionId?: string;
  profileId?: string;
  state?: TalonSessionState;
  cartItems?: EvaluateSessionRequest['cartItems'];
  couponCodes?: string[];
  membershipTier?: string;
  subtotal?: number;
}

function parseBody(body: SessionBody): EvaluateSessionRequest | string {
  const sessionId = body.sessionId?.trim();
  const profileId = body.profileId?.trim();
  if (!sessionId) return 'sessionId is required';
  if (!profileId) return 'profileId is required';
  if (!Array.isArray(body.cartItems)) return 'cartItems must be an array';

  for (const item of body.cartItems) {
    if (!item?.sku || !item?.name || !(item.quantity > 0) || !(item.price >= 0)) {
      return 'Each cartItem needs sku, name, quantity > 0, and price >= 0';
    }
  }

  return {
    sessionId,
    profileId,
    state: body.state ?? 'open',
    cartItems: body.cartItems,
    couponCodes: (body.couponCodes ?? [])
      .map((c) => c.trim())
      .filter(Boolean),
    membershipTier: body.membershipTier?.trim() || undefined,
  };
}

/**
 * POST /api/v1/talon/session
 * Open/update Talon customer session and return normalized discounts.
 */
export async function POST(request: NextRequest) {
  const config = getTalonServerConfig();
  if (!config.enabled) {
    return NextResponse.json(
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

  let body: SessionBody;
  try {
    body = (await request.json()) as SessionBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = parseBody(body);
  if (typeof parsed === 'string') {
    return NextResponse.json({ error: parsed }, { status: 400 });
  }

  const subtotal =
    typeof body.subtotal === 'number'
      ? body.subtotal
      : parsed.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const result = await updateCustomerSession(parsed);
  if (!result.ok || !result.data) {
    return NextResponse.json(
      {
        configured: true,
        sessionId: parsed.sessionId,
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
  });

  return NextResponse.json(normalized);
}
