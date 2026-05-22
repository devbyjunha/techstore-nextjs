import { NextRequest, NextResponse } from 'next/server';
import type { ApiProxyRequest } from '@/lib/admin/api-tester-types';
import { normalizeRequestBody } from '@/lib/admin/json-body';
import { proxyFetch } from '@/lib/admin/proxy-fetch';

const ALLOWED_HOST_SUFFIXES = [
  'braze.com',
  'amplitude.com',
];

function isAllowedUrl(urlString: string): boolean {
  try {
    const { protocol, hostname } = new URL(urlString);
    if (protocol !== 'https:') return false;
    return ALLOWED_HOST_SUFFIXES.some(
      (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`)
    );
  } catch {
    return false;
  }
}

const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ApiProxyRequest;
    const { url, method, bearerToken, headers = {}, body: requestBody } = body;

    if (!url || !method) {
      return NextResponse.json(
        { error: 'url and method are required' },
        { status: 400 }
      );
    }

    if (!ALLOWED_METHODS.has(method)) {
      return NextResponse.json({ error: 'Unsupported HTTP method' }, { status: 400 });
    }

    if (!isAllowedUrl(url)) {
      return NextResponse.json(
        {
          error:
            'URL not allowed. Only braze.com and amplitude.com HTTPS endpoints are permitted.',
        },
        { status: 403 }
      );
    }

    const fetchHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...headers,
    };

    if (bearerToken?.trim()) {
      fetchHeaders.Authorization = `Bearer ${bearerToken.trim()}`;
    }

    const hasBody = requestBody && method !== 'GET' && method !== 'DELETE';
    let bodyToForward: string | undefined;

    if (hasBody && requestBody) {
      const normalized = normalizeRequestBody(requestBody);
      if (!normalized.ok) {
        return NextResponse.json({ error: normalized.error }, { status: 400 });
      }
      bodyToForward = normalized.body || undefined;
    }

    if (bodyToForward && !fetchHeaders['Content-Type']) {
      fetchHeaders['Content-Type'] = 'application/json';
    }

    const start = Date.now();
    const response = await proxyFetch(url, {
      method,
      headers: fetchHeaders,
      body: bodyToForward,
    });
    const durationMs = Date.now() - start;

    const rawBody = await response.text();
    let data: unknown = rawBody;
    try {
      data = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      // keep raw string
    }

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return NextResponse.json({
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      durationMs,
      headers: responseHeaders,
      data,
      rawBody: typeof data === 'string' ? rawBody : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Proxy request failed',
      },
      { status: 500 }
    );
  }
}
