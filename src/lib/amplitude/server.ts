import { getAmplitudeServerConfig } from './config';

export interface AmplitudeServerEvent {
  user_id?: string;
  device_id?: string;
  event_type: string;
  time?: number;
  event_properties?: Record<string, string | number | boolean>;
  user_properties?: Record<string, string | number | boolean>;
}

export interface AmplitudeTrackPayload {
  events: AmplitudeServerEvent[];
}

export interface AmplitudeTrackResult {
  success: boolean;
  status?: number;
  data?: unknown;
  error?: string;
}

export async function amplitudeTrackEvents(
  events: AmplitudeServerEvent[]
): Promise<AmplitudeTrackResult> {
  const config = getAmplitudeServerConfig();

  if (!config.enabled) {
    return {
      success: false,
      error:
        'Amplitude API is not configured. Set AMPLITUDE_API_KEY or NEXT_PUBLIC_AMPLITUDE_API_KEY.',
    };
  }

  if (events.length === 0) {
    return { success: false, error: 'At least one event is required.' };
  }

  try {
    const response = await fetch(`${config.apiBaseUrl}/2/httpapi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: config.apiKey,
        events: events.map((event) => ({
          ...event,
          time: event.time ?? Date.now(),
        })),
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        data,
        error: `Amplitude API error (${response.status})`,
      };
    }

    return { success: true, status: response.status, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown Amplitude API error',
    };
  }
}
