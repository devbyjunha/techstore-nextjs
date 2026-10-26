import { NextResponse } from 'next/server';
import { getCustomerInventory } from '@/lib/talon/client';
import { getTalonServerConfig } from '@/lib/talon/config';
import { PROFILE_ID_PATTERN } from '@/lib/talon/profile-migration';

export async function GET(
  _request: Request,
  context: { params: Promise<{ profileId: string }> }
) {
  const config = getTalonServerConfig();
  if (!config.enabled) {
    return NextResponse.json(
      { ok: false, error: 'Talon.One is not configured' },
      { status: 503 }
    );
  }

  const { profileId: rawId } = await context.params;
  const profileId = decodeURIComponent(rawId).trim();
  if (!PROFILE_ID_PATTERN.test(profileId)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid profileId' },
      { status: 400 }
    );
  }

  const result = await getCustomerInventory(profileId);
  if (!result.ok || !result.data) {
    return NextResponse.json(
      { ok: false, error: result.error ?? 'Profile lookup failed', profileId },
      { status: result.status || 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    profileId: result.data.profileId,
    membershipTier: result.data.membershipTier ?? null,
    attributeKeys: result.data.attributeKeys,
  });
}
