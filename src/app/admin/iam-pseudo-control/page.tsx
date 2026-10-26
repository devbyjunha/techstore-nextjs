'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Eye,
  EyeOff,
  FlaskConical,
  Info,
  Loader2,
  Trash2,
  Zap,
} from 'lucide-react';
import { useIamExperimentLogs } from '@/hooks/useIamExperimentLogs';
import { getBrazeModule, isBrazeClientEnabled } from '@/lib/braze/client';
import {
  IAM_CONTROL_GROUP_VALUE,
  IAM_EXPERIMENT_GROUP_KEY,
  IAM_EXPERIMENT_TEST_EVENT,
  clearIamExperimentLogs,
  getIamExperimentWrapper,
  recordIamExperimentLog,
  resolveIamExperimentDecision,
} from '@/lib/braze/iam-experiment';

type VariantId = 'cg' | 'tg_a' | 'tg_b' | 'none';

const VARIANTS: Array<{
  id: VariantId;
  extraValue?: string;
  label: string;
  role: string;
}> = [
  {
    id: 'tg_a',
    extraValue: 'tg_a',
    label: '실행군 A',
    role: 'IAM UI 노출 · impression은 SDK 자동 기록',
  },
  {
    id: 'tg_b',
    extraValue: 'tg_b',
    label: '실행군 B',
    role: 'IAM UI 노출 · impression은 SDK 자동 기록',
  },
  {
    id: 'cg',
    extraValue: IAM_CONTROL_GROUP_VALUE,
    label: '대조군 역할',
    role: 'UI 미노출 · impression만 수동 기록',
  },
  {
    id: 'none',
    label: 'Extra 없음',
    role: '일반 IAM과 동일하게 표시',
  },
];

interface LocalPreview {
  header: string;
  body: string;
  experimentGroup?: string;
}

export default function AdminIamPseudoControlPage() {
  const logs = useIamExperimentLogs();
  const [variantId, setVariantId] = useState<VariantId>('cg');
  const [sdkReady, setSdkReady] = useState(false);
  const [wrapperReady, setWrapperReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<LocalPreview | null>(null);

  const variant = VARIANTS.find((item) => item.id === variantId) ?? VARIANTS[0];
  const extras = variant.extraValue
    ? { [IAM_EXPERIMENT_GROUP_KEY]: variant.extraValue }
    : undefined;
  const decision = resolveIamExperimentDecision(extras);

  useEffect(() => {
    let cancelled = false;

    async function refreshStatus() {
      if (!isBrazeClientEnabled()) {
        return;
      }

      const braze = await getBrazeModule();
      if (cancelled) {
        return;
      }

      setSdkReady(Boolean(braze));
      setWrapperReady(Boolean(getIamExperimentWrapper()?.isInstalled()));
    }

    void refreshStatus();
    const timer = window.setInterval(() => {
      void refreshStatus();
    }, 800);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3500);
  };

  const previewCopy = (id: VariantId) => {
    if (id === 'cg') {
      return {
        header: '대조군 Variant',
        body: '이 문구가 화면에 보이면 Wrapper가 실패한 것입니다. 정상 경로에서는 impression만 기록합니다.',
      };
    }
    if (id === 'none') {
      return {
        header: '일반 IAM',
        body: 'experiment_group Extra가 없는 IAM은 기존처럼 표시됩니다.',
      };
    }
    return {
      header: id === 'tg_a' ? '실행군 A' : '실행군 B',
      body: `${id} Variant입니다. 이 모달이 보이면 showInAppMessage() 경로가 동작한 것입니다.`,
    };
  };

  const runLocalSimulation = () => {
    const copy = previewCopy(variant.id);
    const resolved = resolveIamExperimentDecision(extras);

    recordIamExperimentLog({
      ...resolved,
      source: 'simulation',
      impressionLogged: resolved.impressionManual,
      messagePreview: copy.body,
    });

    if (resolved.action === 'show') {
      setLocalPreview({
        ...copy,
        experimentGroup: resolved.experimentGroup,
      });
      showToast('로컬 시뮬레이션: IAM UI를 표시했습니다.');
      return;
    }

    setLocalPreview(null);
    showToast('로컬 시뮬레이션: UI를 숨기고 impression만 기록했습니다.');
  };

  const runSdkPath = async () => {
    setRunning(true);
    try {
      const braze = await getBrazeModule();
      const wrapper = getIamExperimentWrapper();
      if (!braze || !wrapper) {
        showToast('Braze SDK 또는 Wrapper가 아직 준비되지 않았습니다. 로컬 시뮬레이션을 사용하세요.');
        return;
      }

      const copy = previewCopy(variant.id);
      const message = new braze.ModalMessage(
        copy.body,
        braze.InAppMessage.TextAlignment.CENTER,
        extras ?? {}
      );
      message.header = copy.header;

      const result = wrapper.handle(message, 'simulation');

      if (result.action === 'show' && !result.uiShown) {
        setLocalPreview({
          ...copy,
          experimentGroup: result.experimentGroup,
        });
        showToast('SDK showInAppMessage가 false를 반환해 로컬 미리보기로 대체했습니다.');
        return;
      }

      setLocalPreview(null);
      showToast(
        result.action === 'hide_and_log_impression'
          ? `SDK 경로: UI 미노출, impression=${result.impressionLogged ? '기록됨' : '미기록(로컬 메시지)'}`
          : 'SDK 경로: Braze IAM UI를 표시했습니다.'
      );
    } finally {
      setRunning(false);
    }
  };

  const triggerCampaignEvent = async () => {
    setTriggering(true);
    try {
      const braze = await getBrazeModule();
      if (!braze) {
        showToast('Braze SDK가 초기화되지 않았습니다.');
        return;
      }

      braze.logCustomEvent(IAM_EXPERIMENT_TEST_EVENT, {
        source: 'admin_poc',
      });
      braze.requestImmediateDataFlush();
      showToast(
        `커스텀 이벤트 ${IAM_EXPERIMENT_TEST_EVENT}를 전송했습니다. 대시보드 캠페인 트리거를 이 이벤트로 맞추세요.`
      );
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          Braze PoC
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          IAM Pseudo Control Group
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          실제 Braze Control Group 대신 일반 IAM Variant를 대조군으로 사용합니다.
          실행군은 UI를 보여주고, 대조군(<code>experiment_group=cg</code>)은
          impression만 기록합니다.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatusCard
          label="Braze 클라이언트"
          ok={isBrazeClientEnabled() && sdkReady}
          detail={
            isBrazeClientEnabled()
              ? sdkReady
                ? 'SDK 로드됨'
                : '초기화 대기'
              : 'API Key / Endpoint 없음'
          }
        />
        <StatusCard
          label="IamExperimentWrapper"
          ok={wrapperReady}
          detail={
            wrapperReady
              ? 'openSession 전 설치됨'
              : 'automaticallyShowInAppMessages 대체 구독 대기'
          }
        />
        <StatusCard
          label="현재 분기"
          ok={decision.action === 'show'}
          okLabel={decision.action === 'show' ? 'UI 노출' : 'UI 숨김'}
          detail={
            decision.experimentGroup
              ? `${IAM_EXPERIMENT_GROUP_KEY}=${decision.experimentGroup}`
              : 'experiment_group 없음'
          }
        />
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <div className="flex gap-2">
          <Info className="mt-0.5 shrink-0" size={16} />
          <div>
            <p className="font-medium">Campaign 설정</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Braze 기본 Control Group은 사용하지 않습니다.</li>
              <li>
                Extra key는 <code>{IAM_EXPERIMENT_GROUP_KEY}</code>, 대조군 값은{' '}
                <code>{IAM_CONTROL_GROUP_VALUE}</code> 입니다.
              </li>
              <li>
                대조군 Variant에는 <code>{'{% abort_message %}'}</code>를 넣지
                마세요. Abort되면 브라우저가 IAM을 받지 못해 수동 impression을
                기록할 수 없습니다.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          1. Variant Extra 시뮬레이션
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          캠페인 없이도 Wrapper 분기를 확인합니다. 로컬 미리보기는 Braze 없이
          동작하고, SDK 경로는 설치된 Wrapper의 <code>handle()</code>을 그대로
          탑니다.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {VARIANTS.map((item) => {
            const selected = item.id === variant.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setVariantId(item.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  selected
                    ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="font-medium text-slate-900">{item.label}</p>
                <p className="mt-1 font-mono text-xs text-slate-500">
                  {item.extraValue
                    ? `${IAM_EXPERIMENT_GROUP_KEY}=${item.extraValue}`
                    : 'extras 없음'}
                </p>
                <p className="mt-2 text-sm text-slate-600">{item.role}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={runLocalSimulation}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {decision.action === 'show' ? <Eye size={16} /> : <EyeOff size={16} />}
            로컬 분기 확인
          </button>
          <button
            type="button"
            onClick={() => void runSdkPath()}
            disabled={running || !wrapperReady}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          >
            {running ? <Loader2 className="animate-spin" size={16} /> : <FlaskConical size={16} />}
            SDK handle() 실행
          </button>
        </div>
        {!wrapperReady && (
          <p className="mt-3 text-xs text-slate-500">
            SDK 경로는 Braze 초기화 후 Wrapper가 설치된 뒤에 사용할 수 있습니다.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          2. 실제 캠페인 트리거
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          대시보드 IAM 캠페인 트리거를 커스텀 이벤트{' '}
          <code>{IAM_EXPERIMENT_TEST_EVENT}</code>로 맞춘 뒤 아래 버튼을
          누르면, 수신한 IAM이 Wrapper를 거칩니다. 로그인된 Braze 유저가
          캠페인 오디언스에 포함되어야 합니다.
        </p>
        <button
          type="button"
          onClick={() => void triggerCampaignEvent()}
          disabled={triggering || !sdkReady}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {triggering ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
          {IAM_EXPERIMENT_TEST_EVENT} 이벤트 전송
        </button>
        <p className="mt-3 text-xs text-slate-500">
          로그인/유저 식별은{' '}
          <Link href="/login" className="text-indigo-700 hover:underline">
            로그인 페이지
          </Link>
          에서 맞출 수 있습니다.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">처리 로그</h2>
          <button
            type="button"
            onClick={clearIamExperimentLogs}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
          >
            <Trash2 size={12} />
            비우기
          </button>
        </div>
        {logs.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            아직 기록이 없습니다. 시뮬레이션 또는 실제 IAM 수신 후 여기에
            분기가 남습니다.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {logs.map((entry) => (
              <li key={`${entry.at}-${entry.experimentGroup ?? 'none'}`} className="py-3 first:pt-0">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      entry.action === 'show'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {entry.action === 'show' ? 'UI 노출' : 'UI 숨김'}
                  </span>
                  <span className="font-mono text-xs text-slate-500">
                    {entry.experimentGroup
                      ? `${IAM_EXPERIMENT_GROUP_KEY}=${entry.experimentGroup}`
                      : 'no extra'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {entry.source === 'sdk' ? 'SDK 구독' : '시뮬레이션'}
                  </span>
                  <span className="text-xs text-slate-400">
                    impression {entry.impressionLogged ? '기록' : '없음'}
                  </span>
                </div>
                {entry.messagePreview && (
                  <p className="mt-1 truncate text-sm text-slate-600">
                    {entry.messagePreview}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(entry.at).toLocaleString('ko-KR')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">처리 결과</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4 font-medium">IAM 유형</th>
                <th className="py-2 pr-4 font-medium">처리</th>
                <th className="py-2 pr-4 font-medium">UI</th>
                <th className="py-2 font-medium">Impression</th>
              </tr>
            </thead>
            <tbody className="align-top text-slate-700">
              <tr className="border-b border-slate-100">
                <td className="py-3 pr-4 font-mono text-xs">experiment_group: &quot;cg&quot;</td>
                <td className="py-3 pr-4">logInAppMessageImpression 후 종료</td>
                <td className="py-3 pr-4">아니요</td>
                <td className="py-3">수동 기록</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-3 pr-4 font-mono text-xs">experiment_group: &quot;tg_a&quot;</td>
                <td className="py-3 pr-4">showInAppMessage()</td>
                <td className="py-3 pr-4">예</td>
                <td className="py-3">SDK 자동 기록</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono text-xs">experiment_group 없음</td>
                <td className="py-3 pr-4">showInAppMessage()</td>
                <td className="py-3 pr-4">예</td>
                <td className="py-3">SDK 자동 기록</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          구현 문서:{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
            docs/iam_pseudo_control_web_sdk.md
          </code>
        </p>
      </section>

      {localPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              로컬 IAM 미리보기
              {localPreview.experimentGroup
                ? ` · ${localPreview.experimentGroup}`
                : ''}
            </p>
            <h3 className="mt-2 text-xl font-bold text-slate-900">
              {localPreview.header}
            </h3>
            <p className="mt-2 text-sm text-slate-600">{localPreview.body}</p>
            <button
              type="button"
              onClick={() => setLocalPreview(null)}
              className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function StatusCard({
  label,
  ok,
  detail,
  okLabel,
}: {
  label: string;
  ok: boolean;
  detail: string;
  okLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-900">
        <Check size={14} className={ok ? 'text-emerald-600' : 'text-slate-300'} />
        {okLabel ?? (ok ? '준비됨' : '대기 중')}
      </p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}
