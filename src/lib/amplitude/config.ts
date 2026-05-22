export interface AmplitudeClientConfig {
  apiKey: string;
  enableLogging: boolean;
  serverZone: 'US' | 'EU';
  /** pageViews / sessions 자동 수집 (기본 false — 네트워크 실패 시 콘솔 오류 감소) */
  autotrack: boolean;
  enabled: boolean;
}

export interface AmplitudeServerConfig {
  apiKey: string;
  apiBaseUrl: string;
  enabled: boolean;
}

export function getAmplitudeClientConfig(): AmplitudeClientConfig {
  const apiKey = (process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY ?? '').trim();
  const explicitlyDisabled =
    process.env.NEXT_PUBLIC_AMPLITUDE_DISABLED === 'true';
  const enableLogging =
    process.env.NEXT_PUBLIC_AMPLITUDE_ENABLE_LOGGING === 'true';
  const serverZone =
    process.env.NEXT_PUBLIC_AMPLITUDE_SERVER_ZONE === 'EU' ? 'EU' : 'US';
  const autotrack =
    process.env.NEXT_PUBLIC_AMPLITUDE_AUTOTRACK === 'true';

  return {
    apiKey,
    enableLogging,
    serverZone,
    autotrack,
    enabled: !explicitlyDisabled && apiKey.length >= 8,
  };
}

export function getAmplitudeServerConfig(): AmplitudeServerConfig {
  const apiKey =
    process.env.AMPLITUDE_API_KEY ??
    process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY ??
    '';
  const apiBaseUrl = (
    process.env.AMPLITUDE_API_BASE_URL ?? 'https://api2.amplitude.com'
  ).replace(/\/$/, '');

  return {
    apiKey,
    apiBaseUrl,
    enabled: Boolean(apiKey),
  };
}
