export interface AmplitudeClientConfig {
  apiKey: string;
  enableLogging: boolean;
  serverZone: 'US' | 'EU';
  enabled: boolean;
}

export interface AmplitudeServerConfig {
  apiKey: string;
  apiBaseUrl: string;
  enabled: boolean;
}

export function getAmplitudeClientConfig(): AmplitudeClientConfig {
  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY ?? '';
  const enableLogging =
    process.env.NEXT_PUBLIC_AMPLITUDE_ENABLE_LOGGING === 'true';
  const serverZone =
    process.env.NEXT_PUBLIC_AMPLITUDE_SERVER_ZONE === 'EU' ? 'EU' : 'US';

  return {
    apiKey,
    enableLogging,
    serverZone,
    enabled: Boolean(apiKey),
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
