import { NextResponse } from 'next/server';
import { updateCustomerProfilesBulk } from '@/lib/talon/client';
import { getTalonServerConfig } from '@/lib/talon/config';
import {
  parseSampleLegacyMembers,
  parseSampleTierChange,
} from '@/lib/talon/profile-migration';

export async function POST(request: Request) {
  const config = getTalonServerConfig();
  if (!config.enabled) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Talon.One is not configured. Set TALON_ONE_BASE_URL and TALON_ONE_API_KEY.',
      },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    variant?: string;
  };
  const variant = body.variant === 'tier-change' ? 'tier-change' : 'initial';
  const parsed =
    variant === 'tier-change'
      ? parseSampleTierChange()
      : parseSampleLegacyMembers();

  if (parsed.errors.length > 0) {
    return NextResponse.json(
      { ok: false, error: parsed.errors.join('; '), droppedColumns: parsed.droppedColumns },
      { status: 400 }
    );
  }

  const result = await updateCustomerProfilesBulk({
    profiles: parsed.payloads.map((p) => ({
      integrationId: p.integrationId,
      attributes: p.attributes,
    })),
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        variant,
        droppedColumns: parsed.droppedColumns,
        payloads: parsed.payloads,
        raw: result.data,
      },
      { status: result.status || 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    variant,
    amount: parsed.payloads.length,
    profileIds: parsed.payloads.map((p) => p.integrationId),
    droppedColumns: parsed.droppedColumns,
    payloads: parsed.payloads,
    raw: result.data,
  });
}
