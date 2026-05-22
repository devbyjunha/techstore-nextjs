'use client';

import ApiTester from '@/components/admin/ApiTester';
import {
  AMPLITUDE_API_CATALOG,
  AMPLITUDE_BASE_URL_OPTIONS,
  DEFAULT_AMPLITUDE_ENDPOINT,
} from '@/lib/admin/amplitude-api-catalog';

export default function AmplitudeApiTestPage() {
  return (
    <ApiTester
      title="Amplitude API 테스트"
      description="Postman처럼 Amplitude HTTP API를 직접 호출해 테스트합니다. API Key는 요청 본문에 포함하거나 아래 필드에 입력하면 자동 병합됩니다."
      provider="amplitude"
      catalog={AMPLITUDE_API_CATALOG}
      defaultEndpoint={DEFAULT_AMPLITUDE_ENDPOINT}
      endpointPlaceholder="https://api2.amplitude.com"
      bearerLabel="Authorization Bearer (선택)"
      bearerPlaceholder="Dashboard/Export API용 Secret Key (선택)"
      apiKeyLabel="Project API Key"
      apiKeyHint="HTTP V2 / Identify / Batch API는 본문의 api_key 필드가 필요합니다. 위 필드에 입력하면 Send 시 자동으로 병합됩니다."
      baseUrlOptions={AMPLITUDE_BASE_URL_OPTIONS}
    />
  );
}
