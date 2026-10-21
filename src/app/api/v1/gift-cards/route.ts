import { NextRequest, NextResponse } from 'next/server';
import {
  assertGiftCardCode,
  listGiftCardsForProfile,
  registerGiftCard,
} from '@/lib/talon/gift-cards';

const PROFILE_PATTERN = /^[A-Za-z0-9._@+-]{1,128}$/;

function readProfileId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const profileId = value.trim();
  if (!PROFILE_PATTERN.test(profileId)) return null;
  return profileId;
}

export async function GET(request: NextRequest) {
  const profileId = readProfileId(request.nextUrl.searchParams.get('profileId'));
  if (!profileId) {
    return NextResponse.json({ error: 'profileId가 필요합니다.' }, { status: 400 });
  }

  const result = await listGiftCardsForProfile(profileId);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? '기프트카드를 조회하지 못했습니다.', cards: [] },
      { status: result.status }
    );
  }

  return NextResponse.json({ cards: result.data ?? [] });
}

export async function POST(request: NextRequest) {
  let body: { profileId?: unknown; code?: unknown };
  try {
    body = (await request.json()) as { profileId?: unknown; code?: unknown };
  } catch {
    return NextResponse.json({ error: 'JSON 본문이 필요합니다.' }, { status: 400 });
  }

  const profileId = readProfileId(body.profileId);
  const code = typeof body.code === 'string' ? assertGiftCardCode(body.code) : null;
  if (!profileId || !code) {
    return NextResponse.json(
      { error: 'profileId와 기프트카드 코드가 올바르지 않습니다.' },
      { status: 400 }
    );
  }

  const result = await registerGiftCard({ profileId, code });
  if (!result.ok || !result.data) {
    return NextResponse.json(
      { error: result.error ?? '기프트카드를 등록하지 못했습니다.' },
      { status: result.status }
    );
  }

  return NextResponse.json({ card: result.data });
}
