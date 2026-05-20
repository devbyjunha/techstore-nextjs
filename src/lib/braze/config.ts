export interface BrazeClientConfig {
  apiKey: string;
  sdkEndpoint: string;
  enableLogging: boolean;
  enabled: boolean;
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

  return {
    apiKey,
    sdkEndpoint,
    enableLogging,
    enabled: Boolean(apiKey && sdkEndpoint),
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
