import { NextRequest, NextResponse } from 'next/server';
import { getAllowedCorsOrigins } from './cors-origins';

export { getAllowedCorsOrigins } from './cors-origins';

export function corsHeadersForOrigin(origin: string | null): HeadersInit {
  const allowed = getAllowedCorsOrigins();
  if (!origin || !allowed.includes(origin)) {
    return {};
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

export function jsonWithCors(
  request: NextRequest,
  body: unknown,
  init?: { status?: number }
): NextResponse {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: corsHeadersForOrigin(request.headers.get('origin')),
  });
}

export function emptyCorsPreflight(request: NextRequest): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeadersForOrigin(request.headers.get('origin')),
  });
}
