import type {
  EvaluateSessionResponse,
  TalonCouponResult,
  TalonDiscountEffect,
  TalonRawEffect,
} from './types';

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
  }
): EvaluateSessionResponse {
  const list = effects ?? [];
  const discountEffects: TalonDiscountEffect[] = [];
  let totalDiscount = 0;
  let willEarn = 0;

  const accepted = new Set<string>();
  const rejected = new Map<string, string>();

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
          rejected.set(code, asString(props.rejectionReason) || 'rejected');
        }
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

  return {
    sessionId: params.sessionId,
    subtotal: params.subtotal,
    totalDiscount,
    total,
    coupons,
    effects: discountEffects,
    loyalty: { willEarn },
    configured: true,
  };
}
