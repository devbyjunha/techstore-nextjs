import { NextRequest, NextResponse } from 'next/server';
import { verifyBrazeWebhookSecret } from '@/lib/api/auth';

/**
 * POST /api/v1/webhooks/braze
 * Braze Webhook Campaign · Canvas webhook 등에서 호출하는 수신 엔드포인트.
 * 요청 본문을 그대로 수신하고 확인 응답을 반환합니다.
 */
export async function POST(request: NextRequest) {
  const unauthorized = verifyBrazeWebhookSecret(request);
  if (unauthorized) return unauthorized;

  let payload: unknown = null;
  const contentType = request.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('application/json')) {
      payload = await request.json();
    } else {
      const text = await request.text();
      payload = text ? { raw: text } : null;
    }
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Could not parse request body.' },
      { status: 400 }
    );
  }

  const receivedAt = new Date().toISOString();
  const summary = summarizeBrazeWebhook(payload);

  console.info('[Braze Webhook]', receivedAt, JSON.stringify(summary));

  return NextResponse.json({
    success: true,
    received_at: receivedAt,
    summary,
    payload,
  });
}

/** Webhook 연결 테스트용 (Braze에서 GET 허용 시) */
export async function GET(request: NextRequest) {
  const unauthorized = verifyBrazeWebhookSecret(request);
  if (unauthorized) return unauthorized;

  return NextResponse.json({
    success: true,
    message: 'TechStore Braze webhook endpoint is ready.',
    method: 'POST',
    hint: 'Configure this URL in Braze Webhook Campaign with POST and JSON body.',
  });
}

function summarizeBrazeWebhook(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') {
    return { type: typeof payload };
  }

  const body = payload as Record<string, unknown>;
  return {
    external_id: body.external_id ?? body.user_id ?? null,
    email: body.email ?? null,
    campaign_id: body.campaign_id ?? null,
    canvas_id: body.canvas_id ?? null,
    canvas_step_id: body.canvas_step_id ?? null,
    keys: Object.keys(body).slice(0, 20),
  };
}
