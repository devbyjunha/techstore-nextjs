'use client';

import ApiTester from '@/components/admin/ApiTester';
import {
  BRAZE_API_CATALOG,
  DEFAULT_BRAZE_REST_ENDPOINT,
} from '@/lib/admin/braze-api-catalog';

export default function BrazeApiTestPage() {
  return (
    <ApiTester
      title="Braze API 테스트"
      description="Postman처럼 Braze REST API를 직접 호출해 테스트합니다. Bearer API Key와 Endpoint를 입력한 뒤 API를 선택하고 Send를 누르세요."
      provider="braze"
      catalog={BRAZE_API_CATALOG}
      defaultEndpoint={DEFAULT_BRAZE_REST_ENDPOINT}
      endpointPlaceholder="https://rest.iad-01.braze.com"
      bearerLabel="Bearer API Key (REST API Key)"
      bearerPlaceholder="BRAZE REST API Key"
    />
  );
}
