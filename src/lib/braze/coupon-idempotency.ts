import { createManagementCoupon } from '@/lib/talon/management-client';
import { getTalonManagementConfig } from '@/lib/talon/config';

export interface CouponIssuanceRecord {
  idempotencyKey: string;
  campaignApiId: string;
  dispatchId: string;
  promotionId: string;
  userId: string;
  couponCode: string;
  discountPercent: number;
  issuedAt: string;
  requestCount: number;
  /** Where the code was minted: Talon Management Create, or local fallback. */
  source: 'talon' | 'local';
}

export interface CouponIssueParams {
  campaignApiId: string;
  dispatchId: string;
  promotionId: string;
  userId: string;
  discountPercent?: number;
}

export interface CouponHistoryFilter {
  campaignApiId?: string;
  dispatchId?: string;
  promotionId?: string;
  userId?: string;
  limit?: number;
}

export type CouponIssueResult =
  | {
      status: 'issued';
      record: CouponIssuanceRecord;
    }
  | {
      status: 'duplicate';
      record: CouponIssuanceRecord;
      duplicateRequestAt: string;
    }
  | {
      status: 'error';
      error: string;
      httpStatus: number;
    };

const issuanceStore = new Map<string, CouponIssuanceRecord>();

export function buildIdempotencyKey(
  campaignApiId: string,
  dispatchId: string,
  promotionId: string,
  userId: string
): string {
  return `${campaignApiId}:${dispatchId}:${promotionId}:${userId}`;
}

/**
 * Braze Connected Content 쿠폰 발급.
 * 1) 멱등 키로 중복이면 기존 코드 반환 (Talon 재호출 없음)
 * 2) 신규면 Talon Management Create → 실패/미설정 시 정책에 따라 처리
 */
export async function issueCouponWithIdempotency(
  params: CouponIssueParams
): Promise<CouponIssueResult> {
  const discountPercent = params.discountPercent ?? 10;
  const idempotencyKey = buildIdempotencyKey(
    params.campaignApiId,
    params.dispatchId,
    params.promotionId,
    params.userId
  );
  const now = new Date().toISOString();

  const existing = issuanceStore.get(idempotencyKey);
  if (existing) {
    existing.requestCount += 1;
    issuanceStore.set(idempotencyKey, existing);
    return {
      status: 'duplicate',
      record: existing,
      duplicateRequestAt: now,
    };
  }

  const minted = await mintCouponCode(params.userId);
  if (!minted.ok) {
    return {
      status: 'error',
      error: minted.error,
      httpStatus: minted.httpStatus,
    };
  }

  const record: CouponIssuanceRecord = {
    idempotencyKey,
    campaignApiId: params.campaignApiId,
    dispatchId: params.dispatchId,
    promotionId: params.promotionId,
    userId: params.userId,
    couponCode: minted.code,
    discountPercent,
    issuedAt: now,
    requestCount: 1,
    source: minted.source,
  };

  issuanceStore.set(idempotencyKey, record);
  return { status: 'issued', record };
}

async function mintCouponCode(
  userId: string
): Promise<
  | { ok: true; code: string; source: 'talon' | 'local' }
  | { ok: false; error: string; httpStatus: number }
> {
  const management = getTalonManagementConfig();

  // Management 미설정: 로컬 PoC 코드 (단위 테스트·오프라인용)
  if (!management.enabled) {
    return { ok: true, code: generateCouponCode(), source: 'local' };
  }

  const result = await createManagementCoupon({
    recipientIntegrationId: userId,
  });

  const code = result.data?.codes?.[0];
  if (!result.ok || !code) {
    return {
      ok: false,
      error:
        result.error ||
        'Talon.One Management API Create coupons failed (no code returned).',
      httpStatus: result.status || 502,
    };
  }

  return { ok: true, code, source: 'talon' };
}

export function getCouponIssuanceRecord(
  campaignApiId: string,
  dispatchId: string,
  promotionId: string,
  userId: string
): CouponIssuanceRecord | undefined {
  return issuanceStore.get(
    buildIdempotencyKey(campaignApiId, dispatchId, promotionId, userId)
  );
}

export function searchCouponIssuanceRecords(
  filter: CouponHistoryFilter = {}
): CouponIssuanceRecord[] {
  const limit = Math.min(Math.max(filter.limit ?? 100, 1), 500);
  let records = Array.from(issuanceStore.values());

  if (filter.campaignApiId) {
    records = records.filter((r) => r.campaignApiId === filter.campaignApiId);
  }
  if (filter.dispatchId) {
    records = records.filter((r) => r.dispatchId === filter.dispatchId);
  }
  if (filter.promotionId) {
    records = records.filter((r) => r.promotionId === filter.promotionId);
  }
  if (filter.userId) {
    records = records.filter((r) => r.userId === filter.userId);
  }

  records.sort(
    (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
  );

  return records.slice(0, limit);
}

/** PoC 디버그용 — 메모리 스토어 초기화 */
export function resetCouponIssuanceStore(): void {
  issuanceStore.clear();
}

/** PoC 디버그용 — 발급 이력 전체 조회 */
export function listCouponIssuanceRecords(): CouponIssuanceRecord[] {
  return searchCouponIssuanceRecords({ limit: 500 });
}

function generateCouponCode(): string {
  const segment = () =>
    Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, '0');
  return `TS-${segment()}-${segment()}`;
}
