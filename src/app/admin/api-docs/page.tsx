'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Search } from 'lucide-react';
import ApiDocCard from '@/components/admin/ApiDocCard';
import { API_DOC_SECTIONS } from '@/lib/admin/api-docs';

export default function AdminApiDocsPage() {
  const [baseUrl, setBaseUrl] = useState('http://localhost:3000');
  const [search, setSearch] = useState('');
  const [demoApiKey, setDemoApiKey] = useState('YOUR_API_KEY');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const filteredSections = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return API_DOC_SECTIONS;

    return API_DOC_SECTIONS.map((section) => ({
      ...section,
      endpoints: section.endpoints.filter(
        (ep) =>
          ep.title.toLowerCase().includes(q) ||
          ep.path.toLowerCase().includes(q) ||
          ep.description.toLowerCase().includes(q) ||
          ep.method.toLowerCase().includes(q)
      ),
    })).filter((section) => section.endpoints.length > 0);
  }, [search]);

  const totalCount = API_DOC_SECTIONS.reduce(
    (sum, s) => sum + s.endpoints.length,
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <BookOpen size={22} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">API 문서</h1>
            <p className="mt-0.5 text-slate-600">
              외부 연동용 Public API {totalCount}개 · 용법 및 cURL 예시
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">기본 설정</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Base URL (문서·cURL에 사용)
            </label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              cURL 예시용 API Key (플레이스홀더)
            </label>
            <input
              type="text"
              value={demoApiKey}
              onChange={(e) => setDemoApiKey(e.target.value)}
              placeholder="YOUR_API_KEY"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <p className="mt-1 text-xs text-slate-500">
              .env의 TECHSTORE_API_KEY / BRAZE_WEBHOOK_SECRET 값을 넣으면 cURL에 반영됩니다.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-sm text-indigo-900">
          <p className="font-medium">환경 변수 (.env.local)</p>
          <ul className="mt-2 space-y-1 font-mono text-xs text-indigo-800">
            <li>TECHSTORE_API_KEY — /api/v1/* 인증 (미설정 시 생략 가능)</li>
            <li>BRAZE_WEBHOOK_SECRET — /api/v1/webhooks/braze 검증 (선택)</li>
          </ul>
        </div>
      </section>

      <div className="relative max-w-md">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="API 이름, 경로, 메서드 검색..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      {filteredSections.map((section) => (
        <section key={section.id} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{section.description}</p>
          </div>
          <div className="space-y-3">
            {section.endpoints.map((endpoint) => (
              <ApiDocCard
                key={endpoint.id}
                endpoint={endpoint}
                baseUrl={baseUrl.replace(/\/$/, '')}
                demoApiKey={demoApiKey}
              />
            ))}
          </div>
        </section>
      ))}

      {filteredSections.length === 0 && (
        <p className="py-12 text-center text-slate-500">검색 결과가 없습니다.</p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        <h2 className="font-semibold text-slate-900">Braze Webhook Campaign 빠른 설정</h2>
        <ol className="mt-3 list-inside list-decimal space-y-2">
          <li>
            Webhook URL:{' '}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-indigo-700">
              {baseUrl.replace(/\/$/, '')}/api/v1/webhooks/braze
            </code>
          </li>
          <li>HTTP Method: POST, Content-Type: application/json</li>
          <li>
            상품 데이터가 필요하면 Connected Content 또는 별도 HTTP:{' '}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-indigo-700">
              GET {baseUrl.replace(/\/$/, '')}/api/v1/products?limit=5
            </code>
          </li>
        </ol>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        <h2 className="font-semibold text-slate-900">이 문서에 포함하지 않는 것</h2>
        <p className="mt-2">
          아래는 TechStore가 외부에 제공하는 Public API가 아니라, 쇼핑몰·관리자 도구 내부에서
          쓰는 경로입니다.
        </p>
        <ul className="mt-3 list-inside list-disc space-y-2 text-slate-600">
          <li>
            <code className="font-mono text-slate-800">/api/users/track</code>,{' '}
            <code className="font-mono text-slate-800">/api/2/httpapi</code> — Braze·Amplitude
            공식 API로 전달하는 <strong className="text-slate-800">내부 연동용</strong> 프록시
            (로그인 동기화 등)
          </li>
          <li>
            <code className="font-mono text-slate-800">/api/admin/proxy</code> — 관리자{' '}
            <strong className="text-slate-800">Braze / Amplitude API 테스트</strong> 메뉴 전용
            (Postman 대체, TechStore 비즈니스 API 아님)
          </li>
        </ul>
        <p className="mt-3 text-slate-500">
          Braze·Amplitude REST API 직접 호출은 사이드바의{' '}
          <strong className="text-slate-700">Braze / Amplitude API 테스트</strong> 메뉴를
          사용하세요.
        </p>
        <p className="mt-3">
          <Link
            href="/admin/proxy-guide"
            className="font-medium text-indigo-600 hover:text-indigo-800"
          >
            /api/admin/proxy 상세 가이드 보기 →
          </Link>
          <span className="mt-1 block text-xs text-slate-500">
            CORS, 프록시가 필요한 이유, 다른 API와의 차이 (docs/ADMIN-PROXY.md)
          </span>
        </p>
      </section>
    </div>
  );
}
