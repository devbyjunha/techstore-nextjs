import { NextResponse } from 'next/server';
import {
  getManagementPoCMeta,
  importManagementCouponsBulk,
  POC_BULK_IMPORT_MAX,
} from '@/lib/talon/management-client';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { count?: number };
  const count = typeof body.count === 'number' ? body.count : 20;

  if (!Number.isFinite(count) || count < 1) {
    return NextResponse.json(
      { ok: false, error: 'count must be a positive number' },
      { status: 400 }
    );
  }

  if (count > POC_BULK_IMPORT_MAX) {
    return NextResponse.json(
      {
        ok: false,
        error: `PoC bulk import is capped at ${POC_BULK_IMPORT_MAX} rows per click.`,
        meta: getManagementPoCMeta(),
      },
      { status: 400 }
    );
  }

  const result = await importManagementCouponsBulk({ count });
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
