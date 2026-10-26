import { NextResponse } from 'next/server';
import {
  getManagementPoCMeta,
  importMemberBoundCouponsSample,
} from '@/lib/talon/management-client';

export async function POST() {
  const result = await importMemberBoundCouponsSample();
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
    amount: result.data?.amount ?? 0,
    codes: result.data?.codes ?? [],
    recipients: {
      [result.data?.codes[0] ?? '']: 'mig_gold_001',
      [result.data?.codes[1] ?? '']: 'mig_silver_001',
    },
    meta,
    raw: result.data?.raw,
  });
}
