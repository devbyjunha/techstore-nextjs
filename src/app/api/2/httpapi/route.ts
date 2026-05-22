import { NextRequest, NextResponse } from 'next/server';
import {
  amplitudeTrackEvents,
  AmplitudeServerEvent,
} from '@/lib/amplitude/server';

/**
 * Amplitude HTTP V2 API equivalent: POST /2/httpapi
 * @see https://amplitude.com/docs/apis/analytics/http-v2
 */
function isValidPayload(
  body: unknown
): body is { api_key?: string; events: AmplitudeServerEvent[] } {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const payload = body as { events?: unknown };
  return Array.isArray(payload.events) && payload.events.length > 0;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!isValidPayload(body)) {
      return NextResponse.json(
        { error: 'Invalid payload. Provide a non-empty events array.' },
        { status: 400 }
      );
    }

    const result = await amplitudeTrackEvents(body.events);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, data: result.data },
        { status: result.status ?? 503 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch {
    return NextResponse.json(
      { error: 'Failed to process 2/httpapi request' },
      { status: 500 }
    );
  }
}
