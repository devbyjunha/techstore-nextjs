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

export function issueCouponWithIdempotency(
  params: CouponIssueParams
): CouponIssueResult {
  const discountPercent = params.discountPercent ?? 10;
  const idempotencyKey = buildIdempotencyKey(
    params.campaignApiId,
    params.dispatchId,
    params.promotionId,
    params.userId
  );
  const duplicateRequestAt = new Date().toISOString();

  const existing = issuanceStore.get(idempotencyKey);
  if (existing) {
    existing.requestCount += 1;
    issuanceStore.set(idempotencyKey, existing);
    return {
      status: 'duplicate',
      record: existing,
      duplicateRequestAt,
    };
  }

  const record: CouponIssuanceRecord = {
    idempotencyKey,
    campaignApiId: params.campaignApiId,
    dispatchId: params.dispatchId,
    promotionId: params.promotionId,
    userId: params.userId,
    couponCode: generateCouponCode(),
    discountPercent,
    issuedAt: duplicateRequestAt,
    requestCount: 1,
  };

  issuanceStore.set(idempotencyKey, record);
  return { status: 'issued', record };
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
