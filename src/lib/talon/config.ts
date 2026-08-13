export interface TalonServerConfig {
  baseUrl: string;
  apiKey: string;
  applicationId: string;
  loyaltyProgramId: string;
  enabled: boolean;
}

/** Management API — admin/backoffice only. Never use on cart/checkout. */
export interface TalonManagementConfig {
  baseUrl: string;
  managementApiKey: string;
  applicationId: string;
  couponCampaignId: string;
  enabled: boolean;
}

export function getTalonServerConfig(): TalonServerConfig {
  const baseUrl = (process.env.TALON_ONE_BASE_URL ?? '').replace(/\/$/, '');
  const apiKey = process.env.TALON_ONE_API_KEY ?? '';
  const applicationId = process.env.TALON_ONE_APPLICATION_ID ?? '';
  const loyaltyProgramId = process.env.TALON_ONE_LOYALTY_PROGRAM_ID ?? '';

  return {
    baseUrl,
    apiKey,
    applicationId,
    loyaltyProgramId,
    enabled: Boolean(baseUrl && apiKey),
  };
}

export function getTalonManagementConfig(): TalonManagementConfig {
  const baseUrl = (process.env.TALON_ONE_BASE_URL ?? '').replace(/\/$/, '');
  const managementApiKey = process.env.TALON_ONE_MANAGEMENT_API_KEY ?? '';
  const applicationId = process.env.TALON_ONE_APPLICATION_ID ?? '';
  const couponCampaignId = process.env.TALON_ONE_COUPON_CAMPAIGN_ID ?? '';

  return {
    baseUrl,
    managementApiKey,
    applicationId,
    couponCampaignId,
    enabled: Boolean(
      baseUrl && managementApiKey && applicationId && couponCampaignId
    ),
  };
}
