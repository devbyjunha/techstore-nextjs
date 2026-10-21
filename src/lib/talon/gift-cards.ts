import { getTalonManagementConfig, getTalonServerConfig } from './config';
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
  return {
    code,
    status: card.status ?? 'unknown',
    balance: Number(card.ledger?.currentBalance ?? 0),
    pendingBalance: Number(card.ledger?.pendingBalance ?? 0),
    spentBalance: Number(card.ledger?.spentBalance ?? 0),
    linked: profiles.includes(profileId),
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

export async function getGiftCard(
  code: string
): Promise<TalonManagementResult<LoyaltyCardPayload>> {
  return managementFetch<LoyaltyCardPayload>(
    cardsPath(`/${encodeURIComponent(code)}`),
    { method: 'GET' }
  );
}

export async function listGiftCardsForProfile(
  profileId: string
): Promise<TalonManagementResult<GiftCardView[]>> {
  const result = await managementFetch<unknown>(
    `${cardsPath()}?pageSize=50&profileIntegrationId=${encodeURIComponent(profileId)}`,
    { method: 'GET' }
  );
  if (!result.ok) return { ...result, data: undefined };
  const cards = unwrapCards(result.data)
    .map((card) => mapLoyaltyCard(card, profileId))
    .filter((card): card is GiftCardView => card !== null && card.linked);
  return { ok: true, status: result.status, data: cards };
}

export async function registerGiftCard(params: {
  profileId: string;
  code: string;
}): Promise<TalonManagementResult<GiftCardView>> {
  const existing = await getGiftCard(params.code);
  if (!existing.ok || !existing.data) {
    return {
      ok: false,
      status: existing.status === 404 ? 404 : existing.status,
      error:
        existing.status === 404
          ? '등록할 수 없는 기프트카드입니다.'
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

  // 1. 카드 상태를 active로 보장 (Management API 공식 규격)
  if (existing.data.status !== 'active') {
    await managementFetch<LoyaltyCardPayload>(
      cardsPath(`/${encodeURIComponent(params.code)}`),
      {
        method: 'PUT',
        body: JSON.stringify({ status: 'active' }),
      }
    );
  }

  // 2. 카드를 고객 프로필에 연결 (Integration API link_profile 공식 규격)
  if (!profiles.includes(params.profileId)) {
    const linkResult = await integrationFetch<unknown>(
      `/v2/loyalty_programs/${encodeURIComponent(giftCardProgramId)}/cards/${encodeURIComponent(params.code)}/link_profile`,
      {
        method: 'POST',
        body: JSON.stringify({
          customerProfileId: params.profileId,
        }),
      }
    );

    if (!linkResult.ok) {
      return {
        ok: false,
        status: linkResult.status,
        error: linkResult.error ?? '기프트카드를 프로필에 연결하지 못했습니다.',
      };
    }
  }

  // 3. 최신 카드 정보 조회 후 반환
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
 * Talon.One Management API deduct_points 엔드포인트를 호출하여 카드의 포인트를 차감합니다.
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

  if (!profiles.includes(params.profileId)) {
    return {
      ok: false,
      status: 403,
      error: '해당 계정에 등록된 기프트카드가 아닙니다.',
    };
  }

  if (existing.data.status !== 'active') {
    return {
      ok: false,
      status: 400,
      error: '사용할 수 없는 상태의 기프트카드입니다.',
    };
  }

  const currentBalance = Number(existing.data.ledger?.currentBalance ?? 0);
  if (currentBalance < params.amount) {
    return {
      ok: false,
      status: 400,
      error: `기프트카드 잔액이 부족합니다. (현재 잔액: ${new Intl.NumberFormat('ko-KR').format(currentBalance)}원)`,
    };
  }

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

  if (!deductResult.ok) {
    return {
      ok: false,
      status: deductResult.status,
      error: deductResult.error ?? '기프트카드 잔액을 차감하지 못했습니다.',
    };
  }

  const updated = await getGiftCard(params.code);
  const cardData = updated.ok && updated.data ? updated.data : deductResult.data ?? existing.data;
  const view = mapLoyaltyCard(cardData, params.profileId);
  if (!view) {
    return { ok: false, status: 502, error: '차감 후 기프트카드 정보를 불러오지 못했습니다.' };
  }

  return { ok: true, status: 200, data: view };
}
