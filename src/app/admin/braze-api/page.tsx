'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import ApiTester from '@/components/admin/ApiTester';
import type { ApiEndpointDefinition } from '@/lib/admin/api-tester-types';

const FALLBACK_BRAZE_ENDPOINT = 'https://rest.iad-01.braze.com';

interface BrazeCatalogResponse {
  defaultEndpoint?: string;
  catalog?: ApiEndpointDefinition[];
}

export default function BrazeApiTestPage() {
  const [catalog, setCatalog] = useState<ApiEndpointDefinition[] | null>(null);
  const [defaultEndpoint, setDefaultEndpoint] = useState(FALLBACK_BRAZE_ENDPOINT);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      try {
        const res = await fetch('/api/admin/catalog/braze');
        const data = (await res.json()) as BrazeCatalogResponse & { error?: string };

        if (!res.ok) {
          throw new Error(data.error ?? `카탈로그 로드 실패 (${res.status})`);
        }

        if (!cancelled) {
          setCatalog(data.catalog ?? []);
          if (data.defaultEndpoint) setDefaultEndpoint(data.defaultEndpoint);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : 'API 목록을 불러오지 못했습니다.'
          );
        }
      }
    }

    loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        {loadError}
      </div>
    );
  }

  if (!catalog) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-500">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <p className="text-sm">Braze API 목록을 불러오는 중…</p>
      </div>
    );
  }

  return (
    <ApiTester
      title="Braze API 테스트"
      description="Postman처럼 Braze REST API를 직접 호출해 테스트합니다. Bearer API Key와 Endpoint를 입력한 뒤 API를 선택하고 Send를 누르세요."
      provider="braze"
      catalog={catalog}
      defaultEndpoint={defaultEndpoint}
      endpointPlaceholder="https://rest.iad-01.braze.com"
      bearerLabel="Bearer API Key (REST API Key)"
      bearerPlaceholder="BRAZE REST API Key"
    />
  );
}
