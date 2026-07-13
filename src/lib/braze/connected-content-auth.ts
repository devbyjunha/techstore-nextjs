import { NextRequest, NextResponse } from 'next/server';

/**
 * Connected Content / Braze Webhook 공통 인증.
 * Braze Connected Content GET은 헤더 대신 쿼리 파라미터를 쓰는 경우가 많아 query도 지원합니다.
 */
export function verifyConnectedContentAuth(
  request: NextRequest
): NextResponse | null {
  const webhookSecret = process.env.BRAZE_WEBHOOK_SECRET?.trim();
  if (webhookSecret) {
    const provided =
      request.headers.get('x-braze-webhook-secret') ??
      request.headers.get('x-webhook-secret') ??
      request.nextUrl.searchParams.get('webhook_secret');

    if (provided === webhookSecret) return null;

    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid webhook secret.' },
      { status: 401 }
    );
  }

  const expectedApiKey = process.env.TECHSTORE_API_KEY?.trim();
  if (expectedApiKey) {
    const authorization = request.headers.get('authorization');
    const headerKey = request.headers.get('x-api-key');
    const queryKey = request.nextUrl.searchParams.get('api_key');
    const bearer =
      authorization?.startsWith('Bearer ')
        ? authorization.slice(7).trim()
        : null;

    if (
      bearer === expectedApiKey ||
      headerKey === expectedApiKey ||
      queryKey === expectedApiKey
    ) {
      return null;
    }

    return NextResponse.json(
      {
        error: 'Unauthorized',
        message:
          'Provide Authorization: Bearer <TECHSTORE_API_KEY>, X-Api-Key, or api_key query param.',
      },
      { status: 401 }
    );
  }

  return null;
}
