'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  IdCard,
  Info,
  Loader2,
  Search,
  Ticket,
  Upload,
} from 'lucide-react';
import {
  PROFILE_MIGRATION_DEMO_ACCOUNTS,
  SOURCE_PII_COLUMNS,
} from '@/lib/talon/profile-migration';

type ImportResult = {
  ok: boolean;
  title: string;
  detail?: string;
  error?: string;
  profileIds?: string[];
  droppedColumns?: string[];
  payloads?: { integrationId: string; attributes: Record<string, string> }[];
  codes?: string[];
};

export default function AdminTalonProfilesPage() {
  const [importing, setImporting] = useState(false);
  const [changingTier, setChangingTier] = useState(false);
  const [importingCoupons, setImportingCoupons] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupId, setLookupId] = useState('mig_gold_001');
  const [result, setResult] = useState<ImportResult | null>(null);

  const busy = importing || changingTier || importingCoupons || lookingUp;

  const runImport = async (variant: 'initial' | 'tier-change') => {
    if (variant === 'initial') setImporting(true);
    else setChangingTier(true);
    setResult(null);
    try {
      const response = await fetch('/api/admin/talon/profiles/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variant }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        amount?: number;
        profileIds?: string[];
        droppedColumns?: string[];
        payloads?: ImportResult['payloads'];
        error?: string;
      };

      if (!response.ok || !data.ok) {
        setResult({
          ok: false,
          title:
            variant === 'initial' ? '프로필 이관 실패' : '등급 변경 재이관 실패',
          error: data.error ?? `HTTP ${response.status}`,
        });
        return;
      }

      setResult({
        ok: true,
        title:
          variant === 'initial'
            ? `Integration API · 프로필 이관 (${data.amount ?? 0}건)`
            : 'Integration API · 등급 덮어쓰기 (GOLD → SILVER)',
        detail:
          variant === 'initial'
            ? 'Talon에는 profileId + MembershipTier만 전송했습니다. 아래 droppedColumns는 자사 추출본에만 있고 이관하지 않은 컬럼입니다.'
            : '같은 profileId(mig_gold_001)를 SILVER로 덮었습니다. 장바구니를 다시 평가하면 C3가 빠져야 합니다.',
        profileIds: data.profileIds,
        droppedColumns: data.droppedColumns,
        payloads: data.payloads,
      });
    } catch {
      setResult({
        ok: false,
        title: '프로필 이관 실패',
        error: '요청 중 오류가 발생했습니다.',
      });
    } finally {
      setImporting(false);
      setChangingTier(false);
    }
  };

  const runLookup = async () => {
    setLookingUp(true);
    setResult(null);
    try {
      const response = await fetch(
        `/api/admin/talon/profiles/${encodeURIComponent(lookupId.trim())}`
      );
      const data = (await response.json()) as {
        ok?: boolean;
        profileId?: string;
        membershipTier?: string | null;
        attributeKeys?: string[];
        error?: string;
      };
      if (!response.ok || !data.ok) {
        setResult({
          ok: false,
          title: '프로필 조회 실패',
          error: data.error ?? `HTTP ${response.status}`,
        });
        return;
      }
      setResult({
        ok: true,
        title: `조회 · ${data.profileId}`,
        detail: `MembershipTier=${data.membershipTier ?? '(없음)'} · attribute keys: ${(data.attributeKeys ?? []).join(', ') || '(없음)'}`,
        profileIds: data.profileId ? [data.profileId] : [],
      });
    } catch {
      setResult({
        ok: false,
        title: '프로필 조회 실패',
        error: '요청 중 오류가 발생했습니다.',
      });
    } finally {
      setLookingUp(false);
    }
  };

  const runBoundCoupons = async () => {
    setImportingCoupons(true);
    setResult(null);
    try {
      const response = await fetch('/api/admin/talon/profiles/bound-coupons', {
        method: 'POST',
      });
      const data = (await response.json()) as {
        ok?: boolean;
        codes?: string[];
        error?: string;
      };
      if (!response.ok || !data.ok) {
        setResult({
          ok: false,
          title: '수신자 한정 쿠폰 Import 실패',
          error: data.error ?? `HTTP ${response.status}`,
        });
        return;
      }
      setResult({
        ok: true,
        title: 'Management API · 수신자 한정 쿠폰',
        detail:
          'GOLD 코드는 mig_gold_001만, SILVER 코드는 mig_silver_001만 사용할 수 있습니다.',
        codes: data.codes ?? [],
      });
    } catch {
      setResult({
        ok: false,
        title: '수신자 한정 쿠폰 Import 실패',
        error: '요청 중 오류가 발생했습니다.',
      });
    } finally {
      setImportingCoupons(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Talon 회원 프로필 이관
        </h1>
        <p className="mt-1 text-slate-600">
          자사 회원 원장 전체가 아니라 <strong>profileId + MembershipTier</strong>만
          Integration API로 적재합니다. 장바구니 할인은 기존 세션 API가 평가합니다.
        </p>
      </div>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-amber-900">
          <AlertTriangle size={18} />
          <h2 className="text-base font-semibold">이관하는 것 / 안 하는 것</h2>
        </div>
        <ul className="list-disc space-y-1 pl-5 text-sm text-amber-950">
          <li>
            이관: <code>profileId</code> (Talon integrationId) ·{' '}
            <code>MembershipTier</code> (GOLD / SILVER)
          </li>
          <li>
            제외:{' '}
            {SOURCE_PII_COLUMNS.map((col) => (
              <code key={col} className="mr-1">
                {col}
              </code>
            ))}
          </li>
          <li>
            전제: Dashboard Tools → Attributes에 Customer Profile{' '}
            <code>MembershipTier</code> (picklist GOLD, SILVER)와 캠페인 C3가 Running
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Upload size={20} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              1. 레거시 회원 샘플 이관
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              <code className="rounded bg-slate-100 px-1 text-xs">
                PUT /v2/customer_profiles?silent=true
              </code>
              · 7명 (GOLD 3 / SILVER 3 / 등급 없음 1)
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void runImport('initial')}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {importing ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
          샘플 회원 이관 실행
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Search size={20} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">2. 이관 결과 조회</h2>
            <p className="mt-1 text-sm text-slate-600">
              <code className="rounded bg-slate-100 px-1 text-xs">
                GET /v1/customer_profiles/&#123;id&#125;/inventory?profile=true
              </code>
            </p>
          </div>
        </div>
        <label className="mb-3 block text-sm text-slate-700">
          profileId
          <input
            type="text"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </label>
        <button
          type="button"
          onClick={() => void runLookup()}
          disabled={busy || !lookupId.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {lookingUp ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
          프로필 조회
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Ticket size={20} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              3. 수신자 한정 쿠폰 (선택)
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Management API로 <code>recipientintegrationid</code>를 이관된 profileId에
              묶습니다. 다른 회원이 쓰면 CouponRecipientDoesNotMatch.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void runBoundCoupons()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
        >
          {importingCoupons ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Ticket size={16} />
          )}
          GOLD/SILVER 전용 쿠폰 Import
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <IdCard size={20} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              4. 등급 변경 재이관 (S7)
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              <code>mig_gold_001</code>을 SILVER로 덮어씁니다. 로그인 폼에서 등급을 보내지
              않아도 장바구니 C3가 사라져야 합니다.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void runImport('tier-change')}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {changingTier ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
          GOLD → SILVER 덮어쓰기
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-base font-semibold text-slate-900">데모 시나리오</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
          <li>위에서 샘플 회원 이관 → <code>mig_gold_001</code> 조회</li>
          <li>
            <Link href="/login" className="text-indigo-600 hover:underline">
              로그인
            </Link>
            에서 이관 계정 원클릭 (클라이언트는 MembershipTier를 보내지 않음)
          </li>
          <li>
            5만원 이상{' '}
            <Link href="/cart" className="text-indigo-600 hover:underline">
              장바구니
            </Link>
            : GOLD는 C1+C3, SILVER/등급없음은 C1만
          </li>
          <li>수신자 한정 쿠폰: GOLD 코드는 GOLD 계정만 적용</li>
        </ol>
        <ul className="mt-4 space-y-1 text-sm text-slate-600">
          {PROFILE_MIGRATION_DEMO_ACCOUNTS.map((account) => (
            <li key={account.profileId}>
              <code className="rounded bg-white px-1">{account.profileId}</code>
              {' — '}
              {account.label}
              {account.membershipTierOnTalon
                ? ` (Talon=${account.membershipTierOnTalon})`
                : ' (Talon 등급 없음)'}
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-start gap-2 text-xs text-slate-500">
          <Info size={14} className="mt-0.5 shrink-0" />
          대조군: 로그인 폼에 임의 이메일을 넣고 등급을 고르면, 예전처럼 세션마다 등급을
          PUT 합니다. 이관 PoC와 런타임 동기화를 비교할 때 사용하세요.
        </p>
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
          {result.droppedColumns && result.droppedColumns.length > 0 && (
            <p className="mt-2 text-xs text-emerald-800">
              미이관 컬럼: {result.droppedColumns.join(', ')}
            </p>
          )}
          {result.payloads && result.payloads.length > 0 && (
            <pre className="mt-3 overflow-x-auto rounded-xl bg-white p-3 text-xs text-slate-800">
              {JSON.stringify(result.payloads, null, 2)}
            </pre>
          )}
          {result.profileIds && result.profileIds.length > 0 && !result.payloads && (
            <ul className="mt-3 space-y-1 text-sm">
              {result.profileIds.map((id) => (
                <li key={id}>
                  <code>{id}</code>
                </li>
              ))}
            </ul>
          )}
          {result.codes && result.codes.length > 0 && (
            <ul className="mt-4 space-y-2">
              {result.codes.map((code) => (
                <li
                  key={code}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-3 text-sm shadow-sm"
                >
                  <code className="font-mono font-semibold text-slate-900">{code}</code>
                  <Link href="/cart" className="text-indigo-600 hover:underline">
                    장바구니에서 적용 →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
