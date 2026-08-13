export type TalonSessionState = 'open' | 'closed' | 'cancelled';

export interface TalonCartItemInput {
  sku: string;
  name: string;
  quantity: number;
  price: number;
  category?: string;
}

export interface EvaluateSessionRequest {
  sessionId: string;
  profileId: string;
  state?: TalonSessionState;
  cartItems: TalonCartItemInput[];
  couponCodes?: string[];
  membershipTier?: string;
}

export interface TalonCouponResult {
  code: string;
  accepted: boolean;
  rejectionReason: string | null;
}

export interface TalonDiscountEffect {
  type: string;
  campaignId?: number;
  name: string;
  value: number;
}

export interface TalonLoyaltyPreview {
  willEarn: number;
}

export interface EvaluateSessionResponse {
  sessionId: string;
  subtotal: number;
  totalDiscount: number;
  total: number;
  coupons: TalonCouponResult[];
  effects: TalonDiscountEffect[];
  loyalty: TalonLoyaltyPreview;
  configured: boolean;
  error?: string;
}

/** Raw effect shape from Talon Integration API (subset). */
export interface TalonRawEffect {
  campaignId?: number;
  rulesetId?: number;
  ruleIndex?: number;
  ruleName?: string;
  effectType: string;
  props?: Record<string, unknown>;
}

export interface TalonIntegrationState {
  effects?: TalonRawEffect[];
  customerSession?: {
    cartItemTotal?: number;
    total?: number;
    discount?: number;
  };
}
