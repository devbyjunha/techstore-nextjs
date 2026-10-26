import type {
  EvaluateSessionResponse,
  TalonCouponResult,
  TalonDiscountEffect,
  TalonRawEffect,
  TalonCustomerNotification,
  TalonCampaignEligibility,
  TalonRuleFailureReason,
} from './types';
import {
  buildCartThresholdDiagnosticNotification,
  CART_THRESHOLD_CAMPAIGN_ID,
} from './notifications';

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function mapTalonEffects(
  effects: TalonRawEffect[] | undefined,
  params: {
    sessionId: string;
    subtotal: number;
    requestedCoupons: string[];
    ruleFailureReasons?: TalonRuleFailureReason[];
    campaignEligibility?: TalonCampaignEligibility[];
  }
): EvaluateSessionResponse {
  const list = effects ?? [];
  const discountEffects: TalonDiscountEffect[] = [];
  let totalDiscount = 0;
  let willEarn = 0;

  const accepted = new Set<string>();
  const rejected = new Map<string, string>();
  const notifications: TalonCustomerNotification[] = [];

  for (const effect of list) {
    const props = effect.props ?? {};
    switch (effect.effectType) {
      case 'setDiscount':
      case 'setDiscountPerItem':
      case 'setDiscountPerAdditionalCost': {
        const value = asNumber(props.value);
        const name = asString(props.name) || effect.effectType;
        discountEffects.push({
          type: effect.effectType,
          campaignId: effect.campaignId,
          name,
          value,
        });
        totalDiscount += value;
        break;
      }
      case 'acceptCoupon': {
        const code = asString(props.value);
        if (code) accepted.add(code);
        break;
      }
      case 'rejectCoupon': {
        const code = asString(props.value);
        if (code) {
          const reason = asString(props.rejectionReason) || 'rejected';
          rejected.set(code, reason);
          if (reason === 'CouponLimitReached' || reason === 'EffectCouldNotBeApplied') {
            const reasonDetails = asString(props.details);
            notifications.push({
              type: 'error',
              title: reason === 'EffectCouldNotBeApplied'
                ? '할인 effect 한도 도달'
                : '쿠폰 사용 한도 도달',
              body: reasonDetails || reason,
              kind: 'budget',
              campaignId: effect.campaignId,
              ruleName: effect.ruleName,
              details: [
                { label: 'Campaign name', value: 'Not returned by Talon.One' },
                { label: 'Campaign ID', value: valueOrUnavailable(effect.campaignId) },
                { label: 'Rule Name', value: valueOrUnavailable(effect.ruleName) },
              ],
            });
          }
        }
        break;
      }
      case 'showNotification': {
        const notificationType = asString(props.notificationType).toLowerCase();
        notifications.push({
          type: notificationType === 'error' ? 'error' : notificationType === 'offer' ? 'success' : 'info',
          title: asString(props.title) || 'Talon.One 프로모션 안내',
          body: asString(props.body),
          kind: /budget|예산|limit|한도/i.test(`${asString(props.title)} ${asString(props.body)}`)
            ? 'budget'
            : 'promotion',
          campaignId: effect.campaignId,
          ruleName: effect.ruleName,
          details: [
            { label: 'Campaign name', value: 'Not returned by Talon.One' },
            { label: 'Campaign ID', value: valueOrUnavailable(effect.campaignId) },
            { label: 'Rule Name', value: valueOrUnavailable(effect.ruleName) },
          ],
        });
        break;
      }
      case 'addLoyaltyPoints': {
        willEarn += asNumber(props.value);
        break;
      }
      default:
        break;
    }
  }

  // Guard against floating noise / over-discount
  totalDiscount = Math.min(Math.max(0, totalDiscount), params.subtotal);
  const total = Math.max(0, params.subtotal - totalDiscount);

  const coupons: TalonCouponResult[] = params.requestedCoupons.map((code) => {
    if (accepted.has(code)) {
      return { code, accepted: true, rejectionReason: null };
    }
    if (rejected.has(code)) {
      return {
        code,
        accepted: false,
        rejectionReason: rejected.get(code) ?? 'rejected',
      };
    }
    // Requested but neither accept nor reject — treat as not applied
    return {
      code,
      accepted: false,
      rejectionReason: 'not_applied',
    };
  });

  for (const reason of params.ruleFailureReasons ?? []) {
    const campaignId = reason.campaignId ?? reason.campaignID;
    const details = reason.details?.trim();
    const identity = `${reason.campaignName ?? ''} ${reason.ruleName ?? ''}`.toLowerCase();
    const isCartThresholdCampaign =
      Number(campaignId) === CART_THRESHOLD_CAMPAIGN_ID ||
      /cart\s*threshold|5\s*만원|50[, ]?000/.test(identity);
    const isEffectLimit = /EffectCouldNotBeApplied/i.test(details ?? '');
    const notification: TalonCustomerNotification = isCartThresholdCampaign
      ? buildCartThresholdDiagnosticNotification({
          failureReason: reason,
          rawReason: details,
        })
      : {
          type: 'error',
          title: isEffectLimit
            ? '할인 effect 한도 도달'
            : 'Talon.One 캠페인 effect 적용 실패',
          body: details || 'Not returned by Talon.One',
          kind: isEffectLimit ? 'budget' : 'promotion',
          campaignId,
          ruleName: reason.ruleName,
          details: [
            { label: 'Campaign name', value: valueOrUnavailable(reason.campaignName) },
            { label: 'Campaign ID', value: valueOrUnavailable(campaignId) },
            { label: 'Rule Name', value: valueOrUnavailable(reason.ruleName) },
          ],
        };
    const existingIndex = campaignId === undefined
      ? -1
      : notifications.findIndex((item) => item.campaignId === campaignId);
    if (existingIndex >= 0) {
      notifications[existingIndex] = notification;
    } else {
      notifications.push(notification);
    }
  }

  return {
    sessionId: params.sessionId,
    subtotal: params.subtotal,
    totalDiscount,
    total,
    coupons,
    effects: discountEffects,
    loyalty: { willEarn },
    configured: true,
    notifications,
    ruleFailureReasons: params.ruleFailureReasons ?? [],
    campaignEligibility: params.campaignEligibility ?? [],
  };
}

function valueOrUnavailable(value: unknown): string {
  return value === undefined || value === null || value === ''
    ? 'Not returned by Talon.One'
    : String(value);
}
