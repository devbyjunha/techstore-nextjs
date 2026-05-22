export type ApiDocMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiDocEndpoint {
  id: string;
  method: ApiDocMethod;
  path: string;
  title: string;
  description: string;
  auth?: string;
  queryParams?: { name: string; description: string; example?: string }[];
  requestBody?: string;
  responseExample?: string;
  curlExample?: string;
  notes?: string[];
  links?: { label: string; href: string }[];
}

export interface ApiDocSection {
  id: string;
  title: string;
  description: string;
  endpoints: ApiDocEndpoint[];
}

export const API_DOC_SECTIONS: ApiDocSection[] = [
  {
    id: 'v1',
    title: 'TechStore Public API (v1)',
    description:
      'Braze Webhook Campaign, Connected Content, 외부 서비스에서 TechStore 데이터를 조회하거나 웹훅을 수신할 때 사용합니다.',
    endpoints: [
      {
        id: 'health',
        method: 'GET',
        path: '/api/v1/health',
        title: 'Health Check',
        description: '서비스 연결 및 Webhook URL 동작 확인용입니다.',
        auth: 'TECHSTORE_API_KEY 설정 시 Bearer 또는 X-Api-Key',
        responseExample: JSON.stringify(
          {
            status: 'ok',
            service: 'techstore',
            version: 'v1',
            timestamp: '2024-05-21T12:00:00.000Z',
          },
          null,
          2
        ),
      },
      {
        id: 'products-list',
        method: 'GET',
        path: '/api/v1/products',
        title: '상품 목록',
        description: '등록된 상품 목록을 JSON으로 반환합니다.',
        auth: 'TECHSTORE_API_KEY 설정 시 Bearer 또는 X-Api-Key',
        queryParams: [
          { name: 'category', description: '카테고리 slug', example: 'laptop' },
          { name: 'sale_only', description: '특가만 (true)', example: 'true' },
          { name: 'limit', description: '최대 개수', example: '10' },
        ],
        responseExample: JSON.stringify(
          {
            data: [
              {
                id: '1',
                name: 'MacBook Pro 14"',
                price: 2990000,
                category: '노트북',
              },
            ],
            meta: { count: 1, category: 'laptop', sale_only: false },
          },
          null,
          2
        ),
        notes: ['category slug: laptop, smartphone, tablet, accessory'],
      },
      {
        id: 'products-one',
        method: 'GET',
        path: '/api/v1/products/{productId}',
        title: '상품 단건',
        description: 'productId에 해당하는 상품 한 건을 반환합니다.',
        auth: 'TECHSTORE_API_KEY 설정 시 Bearer 또는 X-Api-Key',
        responseExample: JSON.stringify(
          {
            data: {
              id: '1',
              name: 'MacBook Pro 14"',
              description: '...',
              price: 2990000,
              category: '노트북',
              rating: 4.8,
              review_count: 1247,
            },
          },
          null,
          2
        ),
      },
      {
        id: 'categories',
        method: 'GET',
        path: '/api/v1/categories',
        title: '카테고리 목록',
        description: '카테고리 slug, 한글명, 상품 수를 반환합니다.',
        auth: 'TECHSTORE_API_KEY 설정 시 Bearer 또는 X-Api-Key',
        responseExample: JSON.stringify(
          {
            data: [{ slug: 'laptop', name: '노트북', product_count: 5 }],
            meta: { count: 4 },
          },
          null,
          2
        ),
      },
      {
        id: 'webhook-braze',
        method: 'POST',
        path: '/api/v1/webhooks/braze',
        title: 'Braze Webhook 수신',
        description:
          'Braze Webhook Campaign / Canvas Webhook에서 호출하는 수신 엔드포인트입니다. 요청 본문을 그대로 받아 summary와 함께 200을 반환합니다.',
        auth: 'BRAZE_WEBHOOK_SECRET 설정 시 X-Braze-Webhook-Secret 헤더',
        requestBody: JSON.stringify(
          {
            external_id: '{{${user_id}}}',
            email: '{{${email_address}}}',
            campaign_id: '{{campaign.${api_id}}}',
          },
          null,
          2
        ),
        responseExample: JSON.stringify(
          {
            success: true,
            received_at: '2024-05-21T12:00:00.000Z',
            summary: { external_id: 'user_123', email: 'user@example.com' },
            payload: {},
          },
          null,
          2
        ),
        notes: [
          'Braze 대시보드 Webhook URL에 배포 도메인 + 이 path를 설정하세요.',
          'GET으로 동일 URL 호출 시 엔드포인트 준비 여부만 확인합니다.',
        ],
      },
      {
        id: 'webhook-braze-get',
        method: 'GET',
        path: '/api/v1/webhooks/braze',
        title: 'Braze Webhook (연결 확인)',
        description: 'Webhook URL이 살아 있는지 확인할 때 사용합니다.',
        auth: 'BRAZE_WEBHOOK_SECRET 설정 시 X-Braze-Webhook-Secret 헤더',
      },
    ],
  },
];

export function buildCurlExample(
  baseUrl: string,
  endpoint: ApiDocEndpoint,
  apiKey?: string
): string {
  const path = endpoint.path.replace('{productId}', '1');
  const url = `${baseUrl}${path}`;

  const headers: string[] = ["-H 'Content-Type: application/json'"];
  if (apiKey && endpoint.path.startsWith('/api/v1')) {
    headers.push(`-H 'Authorization: Bearer ${apiKey}'`);
  }
  if (endpoint.path.includes('webhooks/braze') && apiKey) {
    headers.push(`-H 'X-Braze-Webhook-Secret: ${apiKey}'`);
  }

  const headerStr = headers.join(' \\\n  ');

  if (endpoint.method === 'GET') {
    const query =
      endpoint.id === 'products-list'
        ? '?category=laptop&limit=5'
        : '';
    return `curl -X GET '${url}${query}' \\\n  ${headerStr}`;
  }

  const body = endpoint.requestBody ?? '{}';
  const escapedBody = body.replace(/'/g, "'\\''");
  return `curl -X ${endpoint.method} '${url}' \\\n  ${headerStr} \\\n  -d '${escapedBody}'`;
}
