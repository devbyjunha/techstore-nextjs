export interface TalonServerConfig {
  baseUrl: string;
  apiKey: string;
  applicationId: string;
  loyaltyProgramId: string;
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
