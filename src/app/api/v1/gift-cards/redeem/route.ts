import { NextRequest, NextResponse } from 'next/server';
import { assertGiftCardCode, deductGiftCardBalance } from '@/lib/talon/gift-cards';

const PROFILE_PATTERN = /^[A-Za-z0-9._@+-]{1,128}$/;

function readProfileId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const profileId = value.trim();
  if (!PROFILE_PATTERN.test(profileId)) return null;
  return profileId;
}

export async function POST(request: NextRequest) {
  let body: { profileId?: unknown; code?: unknown; amount?: unknown; orderId?: unknown };
  try {
    body = (await request.json()) as {
      profileId?: unknown;
      code?: unknown;
      amount?: unknown;
      orderId?: unknown;
    };
  } catch {
    return NextResponse.json({ error: 'JSON 본문이 필요합니다.' }, { status: 400 });
  }

  const profileId = readProfileId(body.profileId);
  const code = typeof body.code === 'string' ? assertGiftCardCode(body.code) : null;
  const amount = typeof body.amount === 'number' ? Math.floor(body.amount) : 0;
  const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : undefined;

  if (!profileId || !code) {
    return NextResponse.json(
      { error: 'profileId와 기프트카드 코드가 올바르지 않습니다.' },
      { status: 400 }
    );
  }

  if (amount <= 0) {
    return NextResponse.json(
      { error: '차감할 금액은 0원보다 커야 합니다.' },
      { status: 400 }
    );
  }

  const result = await deductGiftCardBalance({
    profileId,
    code,
    amount,
    orderId,
  });

  if (!result.ok || !result.data) {
    return NextResponse.json(
      { error: result.error ?? '기프트카드 잔액을 차감하지 못했습니다.' },
      { status: result.status }
    );
  }

  return NextResponse.json({
    card: result.data,
    deductedAmount: amount,
  });
}

