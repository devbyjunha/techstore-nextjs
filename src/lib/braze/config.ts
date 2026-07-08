export interface BrazeClientConfig {
  apiKey: string;
  sdkEndpoint: string;
  enableLogging: boolean;
  enabled: boolean;
  /** PDP 추가혜택 영역 Placement ID — Braze Dashboard에서 동일 ID로 생성 */
  pdpBenefitsPlacementId: string;
}

export interface BrazeServerConfig {
  apiKey: string;
  restEndpoint: string;
  enabled: boolean;
}

export function getBrazeClientConfig(): BrazeClientConfig {
  const apiKey = process.env.NEXT_PUBLIC_BRAZE_API_KEY ?? '';
  const sdkEndpoint = process.env.NEXT_PUBLIC_BRAZE_SDK_ENDPOINT ?? '';
  const enableLogging =
    process.env.NEXT_PUBLIC_BRAZE_ENABLE_LOGGING === 'true';

  if (
    sdkEndpoint &&
    typeof window !== 'undefined' &&
    /rest\./i.test(sdkEndpoint)
  ) {
    console.error(
      '[Braze] NEXT_PUBLIC_BRAZE_SDK_ENDPOINT에 REST URL(rest.*)이 설정되어 있습니다. ' +
        'Web SDK는 sdk.* endpoint를 사용해야 합니다. (예: https://sdk.iad-01.braze.com)'
    );
  }

  const pdpBenefitsPlacementId =
    process.env.NEXT_PUBLIC_BRAZE_BANNER_PDP_BENEFITS_PLACEMENT ??
    'pdp_additional_benefit';

  return {
    apiKey,
    sdkEndpoint,
    enableLogging,
    enabled: Boolean(apiKey && sdkEndpoint),
    pdpBenefitsPlacementId,
  };
}

export function getBrazeServerConfig(): BrazeServerConfig {
  const apiKey = process.env.BRAZE_REST_API_KEY ?? '';
  const restEndpoint = (process.env.BRAZE_REST_API_URL ?? '').replace(
    /\/$/,
    ''
  );

  return {
    apiKey,
    restEndpoint,
    enabled: Boolean(apiKey && restEndpoint),
  };
}
