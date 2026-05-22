import { NextRequest, NextResponse } from 'next/server';
import {
  brazeTrackUsers,
  BrazeTrackUsersPayload,
} from '@/lib/braze/server';

/**
 * Braze REST API equivalent: POST /users/track
 * @see https://www.braze.com/docs/api/endpoints/user_data/post_user_track/
 */
function isValidTrackPayload(body: unknown): body is BrazeTrackUsersPayload {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const payload = body as BrazeTrackUsersPayload;
  const hasAttributes =
    Array.isArray(payload.attributes) && payload.attributes.length > 0;
  const hasEvents = Array.isArray(payload.events) && payload.events.length > 0;
  const hasPurchases =
    Array.isArray(payload.purchases) && payload.purchases.length > 0;

  return hasAttributes || hasEvents || hasPurchases;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!isValidTrackPayload(body)) {
      return NextResponse.json(
        {
          error: 'Invalid payload. Provide attributes, events, or purchases.',
        },
        { status: 400 }
      );
    }

    const result = await brazeTrackUsers(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, data: result.data },
        { status: result.status ?? 503 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch {
    return NextResponse.json(
      { error: 'Failed to process users/track request' },
      { status: 500 }
    );
  }
}
