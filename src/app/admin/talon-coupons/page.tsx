'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Download,
  Info,
  Loader2,
  TicketPlus,
  Upload,
} from 'lucide-react';

type ActionResult = {
  ok: boolean;
  title: string;
  codes: string[];
  detail?: string;
  error?: string;
};

const BULK_COUNT_OPTIONS = [20, 50, 100] as const;

export default function AdminTalonCouponsPage() {
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [bulkCount, setBulkCount] = useState<(typeof BULK_COUNT_OPTIONS)[number]>(20);
  const [result, setResult] = useState<ActionResult | null>(null);

  const busy = creating || importing || bulkImporting;

  const runCreate = async () => {
    setCreating(true);
    setResult(null);
    try {
      const response = await fetch('/api/admin/talon/coupons/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientIntegrationId: recipientId.trim() || undefined,
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        codes?: string[];
        error?: string;
        meta?: { couponCampaignId?: string | null };
      };

      if (!response.ok || !data.ok) {
        setResult({
          ok: false,
          title: '쿠폰 발급 실패 (Create)',
          codes: [],
          error: data.error ?? `HTTP ${response.status}`,
        });
        return;
      }

      setResult({
        ok: true,
        title: 'Management API · Create coupons',
        codes: data.codes ?? [],
        detail: `캠페인 ${data.meta?.couponCampaignId ?? '?'}에 1회용 코드가 생성되었습니다. 장바구니에서 적용해 보세요.`,
      });
    } catch {
      setResult({
        ok: false,
        title: '쿠폰 발급 실패 (Create)',
        codes: [],
        error: '요청 중 오류가 발생했습니다.',
      });
    } finally {
      setCreating(false);
    }
  };

  const runImport = async () => {
    setImporting(true);
    setResult(null);
    try {
      const response = await fetch('/api/admin/talon/coupons/import', {
        method: 'POST',
      });
      const data = (await response.json()) as {
        ok?: boolean;
        amount?: number;
        codes?: string[];
        error?: string;
        meta?: { couponCampaignId?: string | null };
      };

      if (!response.ok || !data.ok) {
        setResult({
          ok: false,
          title: 'CSV Import 실패',
          codes: [],
          error: data.error ?? `HTTP ${response.status}`,
        });
        return;
      }

      setResult({
        ok: true,
        title: 'Management API · Import coupons (샘플 3건)',
        codes: data.codes ?? [],
        detail: `캠페인 ${data.meta?.couponCampaignId ?? '?'}에 ${data.amount ?? 0}건이 Import되었습니다.`,
      });
    } catch {
      setResult({
        ok: false,
        title: 'CSV Import 실패',
        codes: [],
        error: '요청 중 오류가 발생했습니다.',
      });
    } finally {
      setImporting(false);
    }
  };

  const runBulkImport = async () => {
    setBulkImporting(true);
    setResult(null);
    try {
      const response = await fetch('/api/admin/talon/coupons/import-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: bulkCount }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        amount?: number;
        codes?: string[];
        error?: string;
        meta?: { couponCampaignId?: string | null };
      };

      if (!response.ok || !data.ok) {
        setResult({
          ok: false,
          title: 'Bulk CSV Import 실패',
          codes: [],
          error: data.error ?? `HTTP ${response.status}`,
        });
        return;
      }

      const codes = data.codes ?? [];
      const preview =
        codes.length > 8
          ? [...codes.slice(0, 5), `… 외 ${codes.length - 5}건`]
          : codes;

      setResult({
        ok: true,
        title: `Management API · Bulk Import (${data.amount ?? codes.length}건)`,
        codes: preview,
        detail: `캠페인 ${data.meta?.couponCampaignId ?? '?'}에 BULK-* 코드 ${data.amount ?? 0}건이 한 번의 import_coupons 호출로 적재되었습니다.`,
      });
    } catch {
      setResult({
        ok: false,
        title: 'Bulk CSV Import 실패',
        codes: [],
        error: '요청 중 오류가 발생했습니다.',
      });
    } finally {
      setBulkImporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Talon 쿠폰 (Management API)</h1>
        <p className="mt-1 text-slate-600">
          백오피스에서 Management API로 쿠폰을 넣고, 쇼핑몰 장바구니(Integration API)로
          적용하는 PoC입니다. 카트/체크아웃 경로에서는 이 API를 호출하지 않습니다.
        </p>
      </div>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-amber-900">
          <AlertTriangle size={18} />
          <h2 className="text-base font-semibold">Bulk / Import 제약 (공식 문서 기준)</h2>
        </div>
        <div className="space-y-4 text-sm text-amber-950">
          <div>
            <p className="font-medium">Import coupons (`…/import_coupons`)</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>CSV multipart 업로드. 필수 컬럼은 <code>value</code> (코드 최소 3자).</li>
              <li>파일 크기: 공식 권장 <strong>최대 약 500MB</strong>.</li>
              <li>코드는 캠페인 내 유니크. 중복 시 실패(또는 <code>skipDuplicates=true</code>).</li>
              <li>
                <code>expirydate</code>는 <strong>미래</strong>여야 함 (과거 만료일 Import 거부).
              </li>
              <li>날짜는 RFC3339 / ISO-8601 (예: <code>2026-12-31T23:59:59+09:00</code>).</li>
              <li>UI 가독성: 코드 길이 <strong>30자 이하</strong> 권장.</li>
              <li>Management API 일반 RPS: 엔드포인트당 약 <strong>3 req/s</strong> (실시간 경로 아님).</li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Create coupons (`…/coupons` / async)</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>동기 Create: prefix 없으면 최대 <strong>20,000</strong>장 / unique prefix 있으면 최대 <strong>200,000</strong>장.</li>
              <li>
                그 이상(권장 20,001+)은 <code>…/coupons_async</code> — 최대 약 <strong>5,000,000</strong>장,
                완료 시 이메일 알림.
              </li>
              <li>수신자별 생성(<code>coupons_with_recipients</code>): 최대 <strong>1,000</strong> recipients / 요청.</li>
            </ul>
          </div>
          <div>
            <p className="font-medium">이 PoC 화면의 추가 제한</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>Bulk Import 버튼은 데모용으로 <strong>최대 100건/클릭</strong>으로 캡.</li>
              <li>
                클릭마다 유니크 prefix(
                <code>{'BULK-{timestamp}-…'}</code>
                )를 써서 중복 Import를 피함.
              </li>
            </ul>
          </div>
          <p className="flex items-start gap-2 text-xs text-amber-800">
            <Info size={14} className="mt-0.5 shrink-0" />
            레거시 수백만 건 이관은 CSV를 쪼개거나 Create async를 검토하고, 카트 트래픽과 분리된
            배치 잡에서 실행하세요.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <TicketPlus size={20} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              1. 쿠폰 1장 발급 (Create)
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Braze/CRM이 회원에게 새 코드를 만들 때와 같은 흐름입니다.
              <code className="mx-1 rounded bg-slate-100 px-1 text-xs">
                POST .../coupons
              </code>
            </p>
          </div>
        </div>

        <label className="mb-3 block text-sm text-slate-700">
          수신자 profileId (선택)
          <input
            type="text"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            placeholder="비우면 범용 코드 · 예: demo_user_001"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </label>

        <button
          type="button"
          onClick={() => void runCreate()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {creating ? <Loader2 className="animate-spin" size={16} /> : <TicketPlus size={16} />}
          쿠폰 발급하기
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Upload size={20} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              2. 레거시 CSV 이관 (Import · 샘플 3건)
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Dashboard CSV Import와 동일 목적의 작은 샘플입니다.
              <code className="mx-1 rounded bg-slate-100 px-1 text-xs">
                POST .../import_coupons
              </code>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void runImport()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {importing ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
          샘플 CSV Import 실행
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Upload size={20} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              3. Bulk CSV Import
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              한 번의 <code className="rounded bg-slate-100 px-1 text-xs">import_coupons</code> 호출로
              N건을 적재합니다. 운영의 “레거시 쿠폰 대량 이관”을 축소한 데모입니다.
            </p>
          </div>
        </div>

        <label className="mb-3 block text-sm text-slate-700">
          Import 건수
          <select
            value={bulkCount}
            onChange={(e) =>
              setBulkCount(Number(e.target.value) as (typeof BULK_COUNT_OPTIONS)[number])
            }
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
          >
            {BULK_COUNT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}건 (BULK-…-001 ~ {String(n).padStart(3, '0')})
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => void runBulkImport()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
        >
          {bulkImporting ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Upload size={16} />
          )}
          Bulk Import {bulkCount}건 실행
        </button>
      </section>

      {result && (
        <section
          className={`rounded-2xl border p-6 shadow-sm ${
            result.ok
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-rose-200 bg-rose-50'
          }`}
        >
          <h3
            className={`text-base font-semibold ${
              result.ok ? 'text-emerald-900' : 'text-rose-900'
            }`}
          >
            {result.title}
          </h3>
          {result.detail && (
            <p className="mt-1 text-sm text-emerald-800">{result.detail}</p>
          )}
          {result.error && (
            <p className="mt-1 text-sm text-rose-800">{result.error}</p>
          )}
          {result.codes.length > 0 && (
            <ul className="mt-4 space-y-2">
              {result.codes.map((code) => (
                <li
                  key={code}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-3 text-sm shadow-sm"
                >
                  <code className="font-mono text-base font-semibold text-slate-900">
                    {code}
                  </code>
                  {!code.startsWith('…') && (
                    <Link href="/cart" className="text-indigo-600 hover:underline">
                      장바구니에서 적용 →
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
