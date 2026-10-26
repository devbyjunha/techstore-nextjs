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
  /** Talon.One storeIntegrationId — identifies the sales channel (online/offline POS) */
  storeIntegrationId?: string;
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
  notifications?: TalonCustomerNotification[];
  ruleFailureReasons?: TalonRuleFailureReason[];
  campaignEligibility?: TalonCampaignEligibility[];
}

export interface TalonCustomerNotification {
  type: 'error' | 'info' | 'success';
  title: string;
  body: string;
  kind?: 'budget' | 'promotion';
  campaignId?: number;
  ruleName?: string;
  details?: Array<{ label: string; value: string }>;
}

export interface TalonRuleFailureReason {
  campaignId?: number;
  campaignID?: number;
  campaignName?: string;
  rulesetId?: number;
  rulesetID?: number;
  ruleIndex?: number;
  ruleName?: string;
  couponId?: number;
  couponID?: number;
  couponValue?: string;
  referralId?: number;
  referralID?: number;
  referralValue?: string;
  details?: string;
  conditionIndex?: number;
  effectIndex?: number;
  evaluationGroupId?: number;
  evaluationGroupID?: number;
}

export interface TalonCampaignEligibility {
  id?: number;
  name?: string;
  state?: string;
  eligibility?: Array<{
    passed?: boolean;
    couponCode?: string;
    details?: unknown;
  }>;
  rules?: Array<{
    title?: string;
    displayName?: string;
    displayDescription?: string;
    eligibility?: Array<{
      passed?: boolean;
      details?: unknown;
    }>;
  }>;
  [key: string]: unknown;
}

/** Raw effect shape from Talon Integration API (subset). */
export interface TalonRawEffect {
  campaignId?: number;
  rulesetId?: number;
  ruleIndex?: number;
  ruleName?: string;
  conditionIndex?: number;
  effectType: string;
  props?: Record<string, unknown>;
}

export interface TalonIntegrationState {
  effects?: TalonRawEffect[];
  ruleFailureReasons?: TalonRuleFailureReason[];
  campaignEligibility?: TalonCampaignEligibility[];
  customerSession?: {
    cartItemTotal?: number;
    total?: number;
    discount?: number;
  };
}
