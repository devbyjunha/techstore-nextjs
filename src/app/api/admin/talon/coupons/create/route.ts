import { NextResponse } from 'next/server';
import {
  createManagementCoupon,
  getManagementPoCMeta,
} from '@/lib/talon/management-client';

export async function POST(request: Request) {
  let recipientIntegrationId: string | undefined;
  try {
    const body = (await request.json().catch(() => ({}))) as {
      recipientIntegrationId?: string;
    };
    recipientIntegrationId = body.recipientIntegrationId?.trim() || undefined;
  } catch {
    recipientIntegrationId = undefined;
  }

  const result = await createManagementCoupon({ recipientIntegrationId });
  const meta = getManagementPoCMeta();

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        meta,
        raw: result.data?.raw,
      },
      { status: result.status || 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    codes: result.data?.codes ?? [],
    meta,
    raw: result.data?.raw,
  });
}
