import { NextResponse } from 'next/server';
import {
  getManagementPoCMeta,
  importManagementCouponsSample,
} from '@/lib/talon/management-client';

export async function POST() {
  const result = await importManagementCouponsSample();
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
    meta,
    raw: result.data?.raw,
  });
}
