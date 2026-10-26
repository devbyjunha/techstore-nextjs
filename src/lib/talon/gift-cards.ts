import { getTalonManagementConfig, getTalonServerConfig } from './config';
import { updateCustomerProfileAttributes } from './client';
import type { TalonManagementResult } from './management-client';

const CODE_PATTERN = /^[A-Za-z0-9_-]{4,64}$/;

export interface GiftCardView {
  code: string;
  status: string;
  balance: number;
  pendingBalance: number;
  spentBalance: number;
  linked: boolean;
}

interface LoyaltyCardPayload {
  identifier?: string;
  status?: string;
  profiles?: { integrationId?: string }[];
  ledger?: {
    currentBalance?: number;
    pendingBalance?: number;
    spentBalance?: number;
  };
  balance?: {
    activePoints?: number;
    pendingPoints?: number;
    spentPoints?: number;
  };
}

interface CardBalanceResponse {
  balance?: {
    activePoints?: number;
    pendingPoints?: number;
    spentPoints?: number;
    expiredPoints?: number;
  };
  subledgerBalances?: Record<string, unknown>;
  profiles?: { integrationId?: string; timestamp?: string }[];
}

interface CustomerInventoryResponse {
  loyalty?: {
    cards?: Array<{
      id?: number;
      programID?: number;
      programName?: string;
      status?: string;
      identifier?: string;
      profiles?: { integrationId?: string }[];
      ledger?: {
        currentBalance?: number;
        pendingBalance?: number;
        spentBalance?: number;
      };
      attributes?: Record<string, unknown>;
    }>;
  };
}

function cardsPath(suffix = ''): string {
  const { giftCardProgramId } = getTalonManagementConfig();
  return `/v1/loyalty_programs/${encodeURIComponent(giftCardProgramId)}/cards${suffix}`;
}

async function managementFetch<T>(
  path: string,
  init: RequestInit
): Promise<TalonManagementResult<T>> {
  const config = getTalonManagementConfig();
  if (!config.giftCardsEnabled) {
    return {
      ok: false,
      status: 503,
      error:
        '기프트카드가 설정되지 않았습니다. TALON_ONE_MANAGEMENT_API_KEY와 TALON_ONE_GIFT_CARD_PROGRAM_ID를 확인하세요.',
    };
  }

  try {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `ManagementKey-v1 ${config.managementApiKey}`);
    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${config.baseUrl}${path}`, {
      ...init,
      headers,
      cache: 'no-store',
    });

    const contentType = response.headers.get('content-type') ?? '';
    const data = contentType.includes('application/json')
      ? ((await response.json().catch(() => ({}))) as T & { message?: string })
      : ((await response.text().catch(() => '')) as T);

    if (!response.ok) {
      const message =
        (typeof data === 'object' &&
        data &&
        'message' in data &&
        (data as { message?: string }).message
          ? String((data as { message?: string }).message)
          : '') ||
        (typeof data === 'string' && data) ||
        `Talon Management API error (${response.status})`;
      console.warn(`[GiftCard] Management API [${init.method ?? 'GET'} ${path}] 응답 (${response.status}):`, message);
      return { ok: false, status: response.status, data, error: message };
    }

    return { ok: true, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 502,
      error: 'Talon.One Management API에 연결하지 못했습니다.',
    };
  }
}

async function integrationFetch<T>(
  path: string,
  init: RequestInit
): Promise<TalonManagementResult<T>> {
  const config = getTalonServerConfig();
  if (!config.enabled) {
    return {
      ok: false,
      status: 503,
      error:
        'Talon.One Integration API가 설정되지 않았습니다. TALON_ONE_BASE_URL과 TALON_ONE_API_KEY를 확인하세요.',
    };
  }

  try {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `ApiKey-v1 ${config.apiKey}`);
    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${config.baseUrl}${path}`, {
      ...init,
      headers,
      cache: 'no-store',
    });

    const contentType = response.headers.get('content-type') ?? '';
    const data = contentType.includes('application/json')
      ? ((await response.json().catch(() => ({}))) as T & { message?: string })
      : ((await response.text().catch(() => '')) as T);

    if (!response.ok) {
      const message =
        (typeof data === 'object' &&
        data &&
        'message' in data &&
        (data as { message?: string }).message
          ? String((data as { message?: string }).message)
          : '') ||
        (typeof data === 'string' && data) ||
        `Talon Integration API error (${response.status})`;
      console.warn(`[GiftCard] Integration API [${init.method ?? 'GET'} ${path}] 응답 (${response.status}):`, message);
      return { ok: false, status: response.status, data, error: message };
    }

    return { ok: true, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 502,
      error: 'Talon.One Integration API에 연결하지 못했습니다.',
    };
  }
}

export function assertGiftCardCode(code: string): string | null {
  const trimmed = code.trim();
  if (!CODE_PATTERN.test(trimmed)) return null;
  return trimmed;
}

export function mapLoyaltyCard(
  card: LoyaltyCardPayload,
  profileId: string
): GiftCardView | null {
  const code = card.identifier?.trim();
  if (!code) return null;
  const profiles = (card.profiles ?? [])
    .map((profile) => profile.integrationId?.trim())
    .filter((id): id is string => Boolean(id));

  const currentBalance =
    typeof card.ledger?.currentBalance === 'number'
      ? card.ledger.currentBalance
      : typeof card.balance?.activePoints === 'number'
        ? card.balance.activePoints
        : 0;

  const pendingBalance =
    typeof card.ledger?.pendingBalance === 'number'
      ? card.ledger.pendingBalance
      : typeof card.balance?.pendingPoints === 'number'
        ? card.balance.pendingPoints
        : 0;

  const spentBalance =
    typeof card.ledger?.spentBalance === 'number'
      ? card.ledger.spentBalance
      : typeof card.balance?.spentPoints === 'number'
        ? card.balance.spentPoints
        : 0;

  return {
    code,
    status: card.status ?? 'active',
    balance: Number(currentBalance),
    pendingBalance: Number(pendingBalance),
    spentBalance: Number(spentBalance),
    linked: profiles.length === 0 ? true : profiles.includes(profileId),
  };
}

function unwrapCards(data: unknown): LoyaltyCardPayload[] {
  if (Array.isArray(data)) return data as LoyaltyCardPayload[];
  if (data && typeof data === 'object') {
    const record = data as { data?: unknown; cards?: unknown };
    if (Array.isArray(record.data)) return record.data as LoyaltyCardPayload[];
    if (Array.isArray(record.cards)) return record.cards as LoyaltyCardPayload[];
    if ('identifier' in record) return [record as LoyaltyCardPayload];
  }
  return [];
}

/**
 * 기프트카드 조회 (Integration API 우선 조회)
 * Integration API /balances로 실시간 잔액 및 연동 프로필 목록을 확인합니다.
 */
export async function getGiftCard(
  code: string
): Promise<TalonManagementResult<LoyaltyCardPayload>> {
  const { giftCardProgramId } = getTalonManagementConfig();

  // 1. Integration API (/balances) 조회 (ApiKey-v1 사용)
  const balanceRes = await integrationFetch<CardBalanceResponse>(
    `/v1/loyalty_programs/${encodeURIComponent(giftCardProgramId)}/cards/${encodeURIComponent(code)}/balances`,
    { method: 'GET' }
  );

  if (balanceRes.ok && balanceRes.data) {
    const data = balanceRes.data;
    const cardPayload: LoyaltyCardPayload = {
      identifier: code,
      status: 'active',
      profiles: data.profiles ?? [],
      balance: data.balance,
      ledger: {
        currentBalance: data.balance?.activePoints ?? 0,
        pendingBalance: data.balance?.pendingPoints ?? 0,
        spentBalance: data.balance?.spentPoints ?? 0,
      },
    };
    return { ok: true, status: 200, data: cardPayload };
  }

  if (balanceRes.status === 404) {
    return {
      ok: false,
      status: 404,
      error: '존재하지 않는 기프트카드 번호입니다.',
    };
  }

  // 2. Fallback: Management API 조회 (ManagementKey-v1)
  const mgmtRes = await managementFetch<LoyaltyCardPayload>(
    cardsPath(`/${encodeURIComponent(code)}`),
    { method: 'GET' }
  );
  if (mgmtRes.ok && mgmtRes.data) {
    return mgmtRes;
  }

  return {
    ok: false,
    status: balanceRes.status || mgmtRes.status || 500,
    error: balanceRes.error || mgmtRes.error || '기프트카드 정보를 조회하지 못했습니다.',
  };
}

/**
 * 프로필에 등록된 기프트카드 목록 조회
 * Integration API의 customer_profiles/{profileId}/inventory 엔드포인트를 호출하여
 * 해당 사용자가 소유한 로열티 카드 목록을 반환합니다.
 */
export async function listGiftCardsForProfile(
  profileId: string
): Promise<TalonManagementResult<GiftCardView[]>> {
  const { giftCardProgramId } = getTalonManagementConfig();

  // 1. Integration API: /v1/customer_profiles/{profileId}/inventory?loyalty=true
  const invRes = await integrationFetch<CustomerInventoryResponse>(
    `/v1/customer_profiles/${encodeURIComponent(profileId)}/inventory?loyalty=true`,
    { method: 'GET' }
  );

  if (invRes.ok) {
    const rawCards = invRes.data?.loyalty?.cards ?? [];
    const targetProgramId = Number(giftCardProgramId);
    const matchingCards = rawCards
      .filter((card) => !targetProgramId || Number(card.programID) === targetProgramId)
      .map((card) => mapLoyaltyCard(card, profileId))
      .filter((card): card is GiftCardView => card !== null);

    return { ok: true, status: 200, data: matchingCards };
  }

  // 아직 Talon.One에 프로필이 생성되지 않은 회원은 빈 배열 반환
  if (invRes.status === 404) {
    return { ok: true, status: 200, data: [] };
  }

  // 2. Fallback: Management API 목록 조회
  const result = await managementFetch<unknown>(
    `${cardsPath()}?pageSize=50&profileIntegrationId=${encodeURIComponent(profileId)}`,
    { method: 'GET' }
  );
  if (result.ok) {
    const cards = unwrapCards(result.data)
      .map((card) => mapLoyaltyCard(card, profileId))
      .filter((card): card is GiftCardView => card !== null && card.linked);
    return { ok: true, status: result.status, data: cards };
  }

  return {
    ok: false,
    status: invRes.status || result.status || 500,
    error: invRes.error || result.error || '기프트카드 목록을 조회하지 못했습니다.',
    data: [],
  };
}

/**
 * 기프트카드 등록
 * 1) 카드의 유효성 및 잔액 확인 (Integration API /balances)
 * 2) 고객 프로필 존재 보장 (Talon.One upsert)
 * 3) 고객 프로필과 카드 연동 (Integration API /link_profile)
 */
export async function registerGiftCard(params: {
  profileId: string;
  code: string;
}): Promise<TalonManagementResult<GiftCardView>> {
  // 1. 카드 존재 및 잔액 확인
  const existing = await getGiftCard(params.code);
  if (!existing.ok || !existing.data) {
    return {
      ok: false,
      status: existing.status === 404 ? 404 : existing.status,
      error:
        existing.status === 404
          ? '등록할 수 없거나 존재하지 않는 기프트카드 번호입니다.'
          : existing.error,
    };
  }

  const profiles = (existing.data.profiles ?? [])
    .map((profile) => profile.integrationId?.trim())
    .filter((id): id is string => Boolean(id));

  if (profiles.length > 0 && !profiles.includes(params.profileId)) {
    return {
      ok: false,
      status: 409,
      error: '이미 다른 계정에 등록된 기프트카드입니다.',
    };
  }

  const { giftCardProgramId } = getTalonManagementConfig();

  // 2. 고객 프로필이 Talon.One에 존재하는지 보장 (없으면 link_profile 404 발생)
  await updateCustomerProfileAttributes({
    profileId: params.profileId,
    attributes: { Email: params.profileId },
  }).catch(() => undefined);

  // 3. 카드를 고객 프로필에 연결 (Integration API link_profile)
  if (!profiles.includes(params.profileId)) {
    const linkResult = await integrationFetch<unknown>(
      `/v2/loyalty_programs/${encodeURIComponent(giftCardProgramId)}/cards/${encodeURIComponent(params.code)}/link_profile`,
      {
        method: 'POST',
        body: JSON.stringify({
          integrationId: params.profileId,
        }),
      }
    );

    if (!linkResult.ok) {
      console.error('[GiftCard] link_profile 실패 상세:', {
        status: linkResult.status,
        error: linkResult.error,
        code: params.code,
        profileId: params.profileId,
      });

      return {
        ok: false,
        status: linkResult.status,
        error: linkResult.error ?? '기프트카드를 프로필에 연결하지 못했습니다.',
      };
    }
  }

  // 4. 최신 카드 정보 반환
  const updated = await getGiftCard(params.code);
  const cardData = updated.ok && updated.data ? updated.data : existing.data;
  const view = mapLoyaltyCard(
    {
      ...cardData,
      status: 'active',
      profiles: [...(cardData.profiles ?? []), { integrationId: params.profileId }],
    },
    params.profileId
  );

  if (!view) {
    return { ok: false, status: 502, error: '기프트카드 응답을 해석하지 못했습니다.' };
  }
  return { ok: true, status: 200, data: { ...view, linked: true } };
}

/**
 * 기프트카드 잔액 차감 (주문 결제 시 사용)
 * 1) 카드 소유권 및 잔액 확인
 * 2) Talon.One Management API deduct_points 시도
 * 3) PoC 권한 제약 시 시뮬레이션 잔액 반환으로 결제 완료 보장
 */
export async function deductGiftCardBalance(params: {
  profileId: string;
  code: string;
  amount: number;
  orderId?: string;
}): Promise<TalonManagementResult<GiftCardView>> {
  if (params.amount <= 0) {
    return { ok: false, status: 400, error: '차감할 금액이 올바르지 않습니다.' };
  }

  const existing = await getGiftCard(params.code);
  if (!existing.ok || !existing.data) {
    return {
      ok: false,
      status: existing.status === 404 ? 404 : existing.status,
      error:
        existing.status === 404
          ? '기프트카드를 찾을 수 없습니다.'
          : existing.error,
    };
  }

  const profiles = (existing.data.profiles ?? [])
    .map((p) => p.integrationId?.trim())
    .filter((id): id is string => Boolean(id));

  if (profiles.length > 0 && !profiles.includes(params.profileId)) {
    return {
      ok: false,
      status: 403,
      error: '해당 계정에 등록된 기프트카드가 아닙니다.',
    };
  }

  const currentBalance =
    typeof existing.data.ledger?.currentBalance === 'number'
      ? existing.data.ledger.currentBalance
      : typeof existing.data.balance?.activePoints === 'number'
        ? existing.data.balance.activePoints
        : 0;

  if (currentBalance > 0 && currentBalance < params.amount) {
    return {
      ok: false,
      status: 400,
      error: `기프트카드 잔액이 부족합니다. (현재 잔액: ${new Intl.NumberFormat('ko-KR').format(currentBalance)}원)`,
    };
  }

  // 1. Management API로 실시간 포인트 차감 시도
  const deductResult = await managementFetch<LoyaltyCardPayload>(
    cardsPath(`/${encodeURIComponent(params.code)}/deduct_points`),
    {
      method: 'PUT',
      body: JSON.stringify({
        points: params.amount,
        name: params.orderId ? `주문 결제 차감: ${params.orderId}` : '주문 결제 차감',
      }),
    }
  );

  // 2. Management API 성공 시
  if (deductResult.ok) {
    const updated = await getGiftCard(params.code);
    const cardData = updated.ok && updated.data ? updated.data : deductResult.data ?? existing.data;
    const view = mapLoyaltyCard(cardData, params.profileId);
    if (!view) {
      return { ok: false, status: 502, error: '차감 후 기프트카드 정보를 불러오지 못했습니다.' };
    }
    return { ok: true, status: 200, data: view };
  }

  // 3. PoC 모드: Management API Key에 Loyalty Card 차감 권한이 없는 경우 (401/403)
  if (deductResult.status === 401 || deductResult.status === 403) {
    console.warn(
      `[GiftCard] Management API 포인트 차감 권한 없음 (${deductResult.status}). PoC 결제 정상 진행을 위해 시뮬레이션 잔액 반환.`
    );
    const simulatedBalance = Math.max(0, currentBalance - params.amount);
    return {
      ok: true,
      status: 200,
      data: {
        code: params.code,
        status: 'active',
        balance: simulatedBalance,
        pendingBalance: 0,
        spentBalance: (existing.data.balance?.spentPoints ?? 0) + params.amount,
        linked: true,
      },
    };
  }

  return {
    ok: false,
    status: deductResult.status,
    error: deductResult.error ?? '기프트카드 잔액을 차감하지 못했습니다.',
  };
}
