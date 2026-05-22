import { NextRequest, NextResponse } from 'next/server';

/** Optional API key for /api/v1/* (set TECHSTORE_API_KEY to enable). */
export function requireTechStoreApiKey(
  request: NextRequest
): NextResponse | null {
  const expected = process.env.TECHSTORE_API_KEY?.trim();
  if (!expected) return null;

  const authorization = request.headers.get('authorization');
  const headerKey = request.headers.get('x-api-key');
  const bearer =
    authorization?.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : null;

  if (bearer === expected || headerKey === expected) {
    return null;
  }

  return NextResponse.json(
    {
      error: 'Unauthorized',
      message:
        'Provide Authorization: Bearer <TECHSTORE_API_KEY> or X-Api-Key header.',
    },
    { status: 401 }
  );
}

/** Optional secret for Braze Webhook Campaign POST body verification. */
export function verifyBrazeWebhookSecret(
  request: NextRequest
): NextResponse | null {
  const expected = process.env.BRAZE_WEBHOOK_SECRET?.trim();
  if (!expected) return null;

  const provided =
    request.headers.get('x-braze-webhook-secret') ??
    request.headers.get('x-webhook-secret');

  if (provided === expected) return null;

  return NextResponse.json(
    { error: 'Unauthorized', message: 'Invalid webhook secret.' },
    { status: 401 }
  );
}
