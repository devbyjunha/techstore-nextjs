import type {
  EvaluateSessionResponse,
  TalonCampaignEligibility,
  TalonCustomerNotification,
  TalonRuleFailureReason,
} from './types';

export const CART_THRESHOLD_CAMPAIGN_ID = 15;
const CART_THRESHOLD_CAMPAIGN_NAME = '(2주차) Cart Threshold 10%';
const CART_THRESHOLD_MINIMUM = 50_000;

type DiagnosticInput = {
  failureReason?: TalonRuleFailureReason;
  campaignEligibility?: TalonCampaignEligibility;
  rawReason?: string;
  reasonCode?: string;
};

const NOT_RETURNED = 'Not returned by Talon.One';

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object'
    ? value as Record<string, unknown>
    : undefined;
}

function getReasonCode(reason: string): string | undefined {
  const trimmed = reason.trim();
  if (/^EffectCouldNotBeApplied$/i.test(trimmed)) return trimmed;

  try {
    const parsed: unknown = JSON.parse(trimmed);
    const findCode = (value: unknown): string | undefined => {
      if (Array.isArray(value)) {
        for (const item of value) {
          const code = findCode(item);
          if (code) return code;
        }
        return undefined;
      }
      const record = asRecord(value);
      if (!record) return undefined;

      for (const key of ['failureCode', 'reasonCode', 'rejectionReason', 'code']) {
        if (typeof record[key] === 'string' && String(record[key]).trim()) {
          return String(record[key]).trim();
        }
      }
      for (const nested of Object.values(record)) {
        const code = findCode(nested);
        if (code) return code;
      }
      return undefined;
    };
    return findCode(parsed);
  } catch {
    return undefined;
  }
}

function getFailedEligibility(campaign?: TalonCampaignEligibility): {
  reasonCode?: string;
  description?: string;
  ruleName?: string;
} | undefined {
  if (!campaign) return undefined;

  for (const rule of campaign.rules ?? []) {
    for (const result of rule.eligibility ?? []) {
      if (result.passed !== false) continue;
      const details = asRecord(result.details);
      return {
        reasonCode: typeof details?.failureCode === 'string' ? details.failureCode : undefined,
        description: typeof details?.details === 'string'
          ? details.details
          : typeof result.details === 'string'
            ? result.details
            : undefined,
        ruleName: rule.displayName || rule.title,
      };
    }
  }

  for (const result of campaign.eligibility ?? []) {
    if (result.passed !== false) continue;
    const details = asRecord(result.details);
    return {
      reasonCode: typeof details?.failureCode === 'string' ? details.failureCode : undefined,
      description: typeof details?.details === 'string'
        ? details.details
        : typeof result.details === 'string'
          ? result.details
          : undefined,
    };
  }

  return undefined;
}

/** Build the compact cart-threshold failure card for the PoC. */
export function buildCartThresholdDiagnosticNotification({
  failureReason,
  campaignEligibility,
  rawReason,
  reasonCode,
}: DiagnosticInput): TalonCustomerNotification {
  const eligibilityFailure = getFailedEligibility(campaignEligibility);
  const description = String(
    eligibilityFailure?.description ?? rawReason ?? failureReason?.details ?? ''
  ).trim();
  const code = reasonCode ?? eligibilityFailure?.reasonCode ?? getReasonCode(description);
  const isEffectLimit = /^EffectCouldNotBeApplied$/i.test(code ?? '');
  const campaignName = campaignEligibility?.name?.trim() || failureReason?.campaignName?.trim();
  const campaignId = failureReason?.campaignId ?? failureReason?.campaignID ?? campaignEligibility?.id;
  const ruleName = failureReason?.ruleName || eligibilityFailure?.ruleName;

  return {
    type: 'error',
    kind: isEffectLimit ? 'budget' : 'promotion',
    campaignId: campaignId ?? CART_THRESHOLD_CAMPAIGN_ID,
    ruleName,
    title: isEffectLimit
      ? '할인 effect 한도 도달'
      : 'Talon.One 캠페인 effect 적용 실패',
    body: description || code || NOT_RETURNED,
    details: [
      {
        label: 'Campaign name',
        value: campaignName
          ? `${campaignName} (Talon.One 진단 응답)`
          : `${CART_THRESHOLD_CAMPAIGN_NAME} (PoC 매핑; Talon.One 이름 미반환)`,
      },
      {
        label: 'Campaign ID',
        value: campaignId === undefined ? `${CART_THRESHOLD_CAMPAIGN_ID} (PoC 매핑)` : String(campaignId),
      },
      { label: 'Rule Name', value: ruleName || NOT_RETURNED },
    ],
  };
}

/** Add a compact diagnostic when a qualifying cart receives no campaign discount. */
export function getTalonSessionNotifications(
  response: EvaluateSessionResponse,
  subtotal: number
): TalonCustomerNotification[] {
  const notifications = [...(response.notifications ?? [])];
  if (!response.configured || response.error || subtotal < CART_THRESHOLD_MINIMUM) {
    return notifications;
  }

  const campaignDiscountApplied = response.effects.some(
    (effect) =>
      Number(effect.campaignId) === CART_THRESHOLD_CAMPAIGN_ID && effect.value > 0
  );
  if (campaignDiscountApplied) return notifications;

  const campaignFailure = (response.ruleFailureReasons ?? []).find(
    (reason) => Number(reason.campaignId ?? reason.campaignID) === CART_THRESHOLD_CAMPAIGN_ID
  );
  const campaignEligibility = response.campaignEligibility?.find(
    (campaign) => Number(campaign.id) === CART_THRESHOLD_CAMPAIGN_ID
  );
  const eligibilityFailure = getFailedEligibility(campaignEligibility);
  const diagnostic = buildCartThresholdDiagnosticNotification({
    failureReason: campaignFailure,
    campaignEligibility,
    rawReason: campaignFailure?.details,
    reasonCode: eligibilityFailure?.reasonCode,
  });

  const existingIndex = notifications.findIndex(
    (notification) => Number(notification.campaignId) === CART_THRESHOLD_CAMPAIGN_ID
  );
  if (existingIndex >= 0) {
    notifications[existingIndex] = diagnostic;
  } else {
    notifications.push(diagnostic);
  }

  return notifications;
}
