'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Play, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import type {
  ApiEndpointDefinition,
  ApiProxyResponse,
  HttpMethod,
} from '@/lib/admin/api-tester-types';
import { normalizeRequestBody } from '@/lib/admin/json-body';

interface ApiTesterProps {
  title: string;
  description: string;
  provider: 'braze' | 'amplitude';
  catalog: ApiEndpointDefinition[];
  defaultEndpoint: string;
  endpointPlaceholder: string;
  bearerLabel?: string;
  bearerPlaceholder?: string;
  apiKeyLabel?: string;
  apiKeyHint?: string;
  baseUrlOptions?: { label: string; value: string }[];
}

const STORAGE_PREFIX = 'techstore-api-tester';

interface StoredTesterSettings {
  endpoint?: string;
  bearerToken?: string;
  apiKey?: string;
  selectedId?: string;
  /** API id별 마지막 Request Body */
  requestBodies?: Record<string, string>;
}

function readStoredSettings(key: string): StoredTesterSettings {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    return JSON.parse(raw) as StoredTesterSettings;
  } catch {
    return {};
  }
}

function buildUrl(
  base: string,
  path: string,
  query?: Record<string, string>
): string {
  const normalizedBase = base.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${normalizedBase}${normalizedPath}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
  }
  return url.toString();
}

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export default function ApiTester({
  title,
  description,
  provider,
  catalog,
  defaultEndpoint,
  endpointPlaceholder,
  bearerLabel = 'Bearer API Key',
  bearerPlaceholder = 'REST API Key (Bearer token)',
  apiKeyLabel,
  apiKeyHint,
  baseUrlOptions,
}: ApiTesterProps) {
  const storageKey = `${STORAGE_PREFIX}-${provider}`;

  const [endpoint, setEndpoint] = useState(defaultEndpoint);
  const [bearerToken, setBearerToken] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [selectedId, setSelectedId] = useState(catalog[0]?.id ?? '');
  const [method, setMethod] = useState<HttpMethod>(catalog[0]?.method ?? 'POST');
  const [path, setPath] = useState(catalog[0]?.path ?? '/');
  const [requestBody, setRequestBody] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiProxyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const categories = useMemo(
    () => ['all', ...new Set(catalog.map((e) => e.category))],
    [catalog]
  );

  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => {
      const matchCategory =
        categoryFilter === 'all' || item.category === categoryFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.path.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [catalog, categoryFilter, search]);

  const selectedEndpoint = catalog.find((e) => e.id === selectedId);

  const fullUrl = useMemo(() => {
    try {
      return buildUrl(endpoint, path, selectedEndpoint?.sampleQuery);
    } catch {
      return `${endpoint}${path}`;
    }
  }, [endpoint, path, selectedEndpoint?.sampleQuery]);

  const applyEndpointSample = useCallback((item: ApiEndpointDefinition) => {
    setMethod(item.method);
    setPath(item.path);
    if (item.sampleBody) {
      setRequestBody(formatJson(item.sampleBody));
    } else if (item.method === 'GET' || item.method === 'DELETE') {
      setRequestBody('');
    } else {
      setRequestBody('');
    }
  }, []);

  const persistSettings = useCallback(
    (bodyOverride?: string) => {
      const stored = readStoredSettings(storageKey);
      const bodies = { ...stored.requestBodies };
      if (selectedId) {
        bodies[selectedId] = bodyOverride ?? requestBody;
      }
      const next: StoredTesterSettings = {
        endpoint,
        bearerToken,
        apiKey,
        selectedId,
        requestBodies: bodies,
      };
      localStorage.setItem(storageKey, JSON.stringify(next));
    },
    [storageKey, endpoint, bearerToken, apiKey, selectedId, requestBody]
  );

  useEffect(() => {
    if (!catalog.length) return;

    const stored = readStoredSettings(storageKey);
    if (stored.endpoint) setEndpoint(stored.endpoint);
    if (stored.bearerToken) setBearerToken(stored.bearerToken);
    if (stored.apiKey) setApiKey(stored.apiKey);

    const initialId =
      stored.selectedId && catalog.some((e) => e.id === stored.selectedId)
        ? stored.selectedId
        : catalog[0].id;
    setSelectedId(initialId);

    const item = catalog.find((e) => e.id === initialId);
    const savedBody = stored.requestBodies?.[initialId];
    if (item) {
      setMethod(item.method);
      setPath(item.path);
      if (savedBody !== undefined) {
        setRequestBody(savedBody);
      } else {
        applyEndpointSample(item);
      }
    }

    setHydrated(true);
  }, [storageKey, catalog, applyEndpointSample]);

  useEffect(() => {
    if (!hydrated || !catalog.length) return;

    const item = catalog.find((e) => e.id === selectedId);
    if (!item) return;

    const stored = readStoredSettings(storageKey);
    const savedBody = stored.requestBodies?.[selectedId];

    setMethod(item.method);
    setPath(item.path);
    if (savedBody !== undefined) {
      setRequestBody(savedBody);
    } else {
      applyEndpointSample(item);
    }
  }, [selectedId, catalog, hydrated, storageKey, applyEndpointSample]);

  const handleSelectEndpoint = (id: string) => {
    if (hydrated && selectedId) {
      persistSettings();
    }
    setSelectedId(id);
  };

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => persistSettings(), 400);
    return () => window.clearTimeout(timer);
  }, [bearerToken, apiKey, endpoint, requestBody, hydrated, persistSettings]);

  const injectApiKey = (rawBody: string): string => {
    if (!apiKey.trim() || provider !== 'amplitude') return rawBody;
    try {
      const parsed = JSON.parse(rawBody) as Record<string, unknown>;
      if (!parsed.api_key) {
        parsed.api_key = apiKey.trim();
        return formatJson(parsed);
      }
    } catch {
      // not JSON
    }
    return rawBody;
  };

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    persistSettings();

    let bodyToSend: string | undefined;
    if (method !== 'GET' && method !== 'DELETE' && requestBody.trim()) {
      const withKey = injectApiKey(requestBody.trim());
      const normalized = normalizeRequestBody(withKey);
      if (!normalized.ok) {
        setError(normalized.error);
        setLoading(false);
        return;
      }
      bodyToSend = normalized.body || undefined;
    }

    try {
      const res = await fetch('/api/admin/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: fullUrl,
          method,
          bearerToken: bearerToken.trim() || undefined,
          body: bodyToSend,
        }),
      });

      const proxyResult = await res.json();

      if (!res.ok) {
        setError(
          typeof proxyResult.error === 'string'
            ? proxyResult.error
            : `요청 실패 (${res.status})`
        );
        return;
      }

      setResponse(proxyResult as ApiProxyResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResponse = async () => {
    if (!response) return;
    await navigator.clipboard.writeText(formatJson(response));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-slate-600">{description}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Request panel */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Request</h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              REST Endpoint (Base URL)
            </label>
            {baseUrlOptions ? (
              <div className="space-y-2">
                <select
                  value={baseUrlOptions.find((o) => o.value === endpoint)?.value ?? ''}
                  onChange={(e) => e.target.value && setEndpoint(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">— Base URL 프리셋 선택 —</option>
                  {baseUrlOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <input
                  type="url"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder={endpointPlaceholder}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            ) : (
              <input
                type="url"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder={endpointPlaceholder}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {bearerLabel}
            </label>
            <input
              type="password"
              value={bearerToken}
              onChange={(e) => setBearerToken(e.target.value)}
              placeholder={bearerPlaceholder}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {apiKeyLabel && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {apiKeyLabel}
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Amplitude Project API Key"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              {apiKeyHint && (
                <p className="mt-1 text-xs text-slate-500">{apiKeyHint}</p>
              )}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              API 선택
            </label>
            <div className="mb-2 flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? '전체 카테고리' : cat}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="API 검색..."
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <select
              value={selectedId}
              onChange={(e) => handleSelectEndpoint(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              size={6}
            >
              {filteredCatalog.map((item) => (
                <option key={item.id} value={item.id}>
                  [{item.method}] {item.category} — {item.name}
                </option>
              ))}
            </select>
            {selectedEndpoint && (
              <p className="mt-2 text-xs text-slate-500">{selectedEndpoint.description}</p>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as HttpMethod)}
                className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm font-mono"
              >
                {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-3">
              <label className="mb-1 block text-sm font-medium text-slate-700">Path</label>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Full URL (미리보기)
            </label>
            <p className="break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600">
              {fullUrl}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Request Body (JSON)
            </label>
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              rows={24}
              placeholder='{ "key": "value" }'
              className="min-h-[480px] w-full resize-y rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              spellCheck={false}
            />
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !endpoint.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl btn-primary px-4 py-3 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Play size={18} />
                Send
              </>
            )}
          </button>
        </div>

        {/* Response panel */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Response</h2>
            {response && (
              <button
                type="button"
                onClick={handleCopyResponse}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {response && (
            <>
              <div className="flex flex-wrap gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    response.ok
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {response.status} {response.statusText}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                  {response.durationMs}ms
                </span>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">Response Headers</p>
                <pre className="min-h-[320px] max-h-[520px] resize-y overflow-auto rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-700">
                  {formatJson(response.headers)}
                </pre>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">Response Body</p>
                <pre className="min-h-[280px] max-h-[min(640px,70vh)] resize-y overflow-auto rounded-lg bg-slate-950 p-4 font-mono text-xs text-emerald-300">
                  {typeof response.data === 'string'
                    ? response.data
                    : formatJson(response.data)}
                </pre>
              </div>
            </>
          )}

          {!response && !error && !loading && (
            <p className="py-16 text-center text-sm text-slate-400">
              Send 버튼을 눌러 API 응답을 확인하세요.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900">
        <p className="font-medium">Send 시 500 / fetch failed 가 나올 때</p>
        <p className="mt-1 text-amber-800">
          Node.js TLS 인증서 검증 실패(회사 VPN·보안 프록시)일 수 있습니다.{' '}
          <code className="rounded bg-amber-100 px-1">.env.local</code>에{' '}
          <code className="rounded bg-amber-100 px-1">ADMIN_PROXY_INSECURE_TLS=true</code>
          를 넣고 dev 서버를 재시작하세요. Request Body의{' '}
          <code className="rounded bg-amber-100 px-1">//</code> 주석은 Send 시 자동
          제거됩니다. Braze는 Bearer만 사용하며 본문의 <code className="rounded bg-amber-100 px-1">api_key</code>는
          필요 없습니다.
        </p>
      </div>
      <p className="text-xs text-slate-500">
        Bearer API Key·Request Body·Endpoint는 브라우저 localStorage(
        <code className="rounded bg-slate-100 px-1">{storageKey}</code>)에 저장되며,
        새로고침 후 마지막 값이 복원됩니다. 요청은 서버 프록시를 통해 braze.com /
        amplitude.com 도메인으로만 전달됩니다.
      </p>
    </div>
  );
}
