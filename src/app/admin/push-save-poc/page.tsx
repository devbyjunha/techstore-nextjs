'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Check,
  Copy,
  Download,
  ExternalLink,
  Info,
  Loader2,
  Smartphone,
} from 'lucide-react';
import BrazePushSettings from '@/components/BrazePushSettings';
import { useBrazePush } from '@/hooks/useBrazePush';
import { sendLocalPushSaveNotification } from '@/lib/braze/push';
import {
  PUSH_SAVE_SAMPLES,
  WEB_PUSH_LIQUID_RENDERED_VALUE,
  buildBrazeWebPushLiquidProbeMessage,
  buildBrazeWebPushMessage,
  buildPushSaveDownloadApiPath,
  buildPushSavePagePath,
  type PushSaveSample,
} from '@/lib/braze/push-save';

export default function AdminPushSavePocPage() {
  const { pushState } = useBrazePush();
  const [sampleId, setSampleId] = useState(PUSH_SAVE_SAMPLES[0].id);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const sample =
    PUSH_SAVE_SAMPLES.find((item) => item.id === sampleId) ?? PUSH_SAVE_SAMPLES[0];
  const [origin, setOrigin] = useState('');
  const pagePath = buildPushSavePagePath(sample);
  const downloadPath = buildPushSaveDownloadApiPath(sample);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const restPayload = useMemo(
    () =>
      JSON.stringify(
        {
          external_user_ids: ['YOUR_EXTERNAL_ID'],
          messages: {
            web_push: buildBrazeWebPushMessage({
              origin: origin || 'https://YOUR_PUBLIC_HOST',
              sample,
            }),
          },
        },
        null,
        2
      ),
    [origin, sample]
  );

  const extrasJson = useMemo(
    () =>
      JSON.stringify(
        buildBrazeWebPushMessage({
          origin: origin || 'https://YOUR_PUBLIC_HOST',
          sample,
        }).extra,
        null,
        2
      ),
    [origin, sample]
  );

  const liquidProbePayload = useMemo(
    () =>
      JSON.stringify(
        buildBrazeWebPushLiquidProbeMessage({
          origin: origin || 'http://localhost:3000',
        }),
        null,
        2
      ),
    [origin]
  );

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3500);
  };

  const copyText = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1500);
  };

  const sendLocal = async (target: PushSaveSample) => {
    setSending(true);
    try {
      const result = await sendLocalPushSaveNotification(target);
      if (!result.ok) {
        showToast(
          result.error === 'permission'
            ? '먼저 아래 「알림 받기」로 웹 푸시를 허용해 주세요.'
            : '이 브라우저는 웹 푸시 테스트 알림을 지원하지 않습니다.'
        );
        return;
      }
      showToast('테스트 알림을 보냈습니다. 알림을 클릭해 다운로드를 확인하세요.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          Braze PoC
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          웹 푸시 클릭 → 파일 다운로드
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          모바일 앱 없이, Braze Extra Keys(Key-Value)로 유저별 이미지 URL을 넘기고
          알림 클릭 시 노트북 다운로드 폴더에 저장하는 흐름을 검증합니다.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <div className="flex gap-2">
          <Info className="mt-0.5 shrink-0" size={16} />
          <div>
            <p className="font-medium">이 PoC가 증명하는 것 / 증명하지 않는 것</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>
                <strong>가능:</strong> Extra Key로 <code>action</code> + 유저별{' '}
                <code>image_url</code> 전달 → 클릭 시 클라이언트가 명령 수행
              </li>
              <li>
                <strong>웹 한계:</strong> 브라우저 다운로드만 가능. iOS/Android 카메라
                롤 자동 저장은 네이티브 앱 커스텀 코드가 필요합니다.
              </li>
              <li>
                <strong>OS 한계:</strong> 푸시를 <em>받기만</em> 하고 클릭하지 않으면
                저장할 수 없습니다. 클릭(또는 앱 오픈)이 사용자 제스처입니다.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">1. 웹 푸시 허용</h2>
        <p className="mt-1 text-sm text-slate-500">
          Chrome / Edge, localhost 또는 HTTPS. 마이페이지 설정과 동일한 SDK 권한입니다.
        </p>
        <div className="mt-4">
          <BrazePushSettings onToast={(message) => showToast(message)} />
        </div>
      </section>

      <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Extra Liquid 렌더링 검증 (localhost)
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          로컬 알림 시뮬레이션은 Braze Liquid를 거치지 않습니다. 아래 JSON을{' '}
          <Link href="/admin/braze-api" className="text-indigo-700 hover:underline">
            Braze API 테스트
          </Link>
          의 <code>messages.send</code>에 넣고,{' '}
          <code>YOUR_EXTERNAL_ID</code>를 이 브라우저에 로그인한 유저 ID로 바꾼 뒤
          발송하세요.
        </p>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-700">
          <li>이 페이지에서 웹 푸시를 허용합니다.</li>
          <li>
            Chrome DevTools → Application → Service Workers에서{' '}
            <code>/service-worker.js</code>가 활성화됐는지 확인합니다. Update on
            reload를 켜면 워커가 바로 갱신됩니다.
          </li>
          <li>
            페이지 콘솔 또는 워커 Inspect 콘솔에서{' '}
            <code>[Web Push extra]</code>를 확인합니다. Braze 수신 payload는{' '}
            <code>extra</code>가 아니라 <code>e</code>에 Key-Value를 넣습니다.
          </li>
          <li>
            <code>e.liquid_render_probe</code>가{' '}
            <code>{WEB_PUSH_LIQUID_RENDERED_VALUE}</code>이면 extra 안 일반
            Liquid가 기기로 렌더링된 것입니다. 빈 문자열이면 출력 없이
            처리된 것이고, Liquid 원문이면 렌더링되지 않은 채 전달된 것입니다.
            키가 <code>undefined</code>이면 이번 발송 payload에 해당 extra가
            없는 것이므로 아래 JSON으로 다시 보내세요.
          </li>
          <li>
            <code>message_extras</code>는 Currents 기록용입니다. 기기 extra
            값(<code>e</code>)으로 쓰지 마세요. 빈 문자열이 정상일 수 있습니다.
          </li>
        </ol>
        <div className="mt-4">
          <PayloadCard
            title="POST /messages/send (extra Liquid probe)"
            value={liquidProbePayload}
            copied={copied === 'liquid-probe'}
            onCopy={() => void copyText('liquid-probe', liquidProbePayload)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          2. 유저별 이미지 URL (로컬 시뮬레이션)
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Braze 캠페인 없이도 Extra Key 페이로드를 서비스 워커가 읽는지 확인할 수
          있습니다. 실제 캠페인은 같은 키를 Liquid로 넣으면 됩니다.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {PUSH_SAVE_SAMPLES.map((item) => {
            const selected = item.id === sample.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSampleId(item.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  selected
                    ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="font-medium text-slate-900">
                  {item.label} · {item.description}
                </p>
                <p className="mt-1 font-mono text-xs break-all text-slate-500">
                  {item.imageUrl}
                </p>
                <img
                  src={item.imageUrl}
                  alt={item.label}
                  className="mt-3 w-full rounded-lg border border-slate-200"
                />
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void sendLocal(sample)}
            disabled={sending || pushState.status !== 'granted'}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Bell size={16} />
            )}
            테스트 알림 보내기 ({sample.label})
          </button>
          <Link
            href={pagePath}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            <Download size={16} />
            랜딩 페이지 바로 열기
          </Link>
          <a
            href={downloadPath}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            <ExternalLink size={16} />
            API로 바로 받기
          </a>
        </div>
        {pushState.status !== 'granted' && (
          <p className="mt-3 text-xs text-slate-500">
            테스트 알림은 웹 푸시가 「활성화됨」일 때만 보낼 수 있습니다.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          3. Braze 대시보드 / REST Extra Keys
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Web Push 캠페인 Compose → Extra Keys에 아래 값을 넣습니다. 유저마다 다른
          이미지는 Custom Attribute 또는 Connected Content Liquid로{' '}
          <code>image_url</code>만 바꾸면 됩니다.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <PayloadCard
            title="Dashboard Extra Keys"
            value={extrasJson}
            copied={copied === 'extras'}
            onCopy={() => void copyText('extras', extrasJson)}
          />
          <PayloadCard
            title="POST /messages/send (web_push)"
            value={restPayload}
            copied={copied === 'rest'}
            onCopy={() => void copyText('rest', restPayload)}
          />
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-medium">대시보드 권장 형식</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Campaign → Web Push → Extra Keys: <code>action=save_image</code></li>
            <li>
              <code>image_url={'{{custom_attribute.${ticket_image_url}}}'}</code>
            </li>
            <li>
              <code>file_name={'{{custom_attribute.${ticket_file_name}}}'}</code>
            </li>
            <li>
              On-click behavior: Redirect to web URL ={' '}
              <code>
                {`${origin || 'https://YOUR_PUBLIC_HOST'}/push-save?action=save_image&image_url={{custom_attribute.\${ticket_image_url}}}`}
              </code>
            </li>
          </ol>
          <p className="mt-3">
            REST 테스트는{' '}
            <Link href="/admin/braze-api" className="text-indigo-700 hover:underline">
              Braze API 테스트
            </Link>
            의 <code>messages.send</code>에 오른쪽 JSON을 붙여 넣으면 됩니다.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Smartphone size={18} />
          고객 문의에 대한 기술 답 (네이티브)
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4 font-medium">질문</th>
                <th className="py-2 font-medium">답</th>
              </tr>
            </thead>
            <tbody className="align-top text-slate-700">
              <tr className="border-b border-slate-100">
                <td className="py-3 pr-4">Extra Keys로 이미지 URL·명령 전달?</td>
                <td className="py-3">
                  가능합니다. iOS <code>apple_push.extra</code> / Android{' '}
                  <code>android_push.extra</code> / Web <code>web_push.extra</code>.
                  Braze는 값을 앱에 전달만 하고, 저장 로직은 SDK에 없습니다.
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-3 pr-4">클릭 시 휴대폰에 자동 저장?</td>
                <td className="py-3">
                  앱이 Extra를 읽고 다운로드 + 갤러리 저장을 구현하면 가능합니다.
                  사진 라이브러리 권한(iOS) / MediaStore(Android)가 필요합니다.
                  클릭 없는 백그라운드 강제 저장은 OS가 막습니다.
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4">유저마다 다른 URL?</td>
                <td className="py-3">
                  가능합니다. Custom Attribute, Catalog+Liquid, Connected Content,
                  API-triggered <code>trigger_properties</code> 중 하나로{' '}
                  <code>image_url</code>을 개인화합니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          상세 가이드:{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
            docs/BRAZE-PUSH-SAVE-POC.md
          </code>
        </p>
      </section>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function PayloadCard({
  title,
  value,
  copied,
  onCopy,
}: {
  title: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-800">{title}</p>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1 text-xs text-indigo-700 hover:underline"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? '복사됨' : '복사'}
        </button>
      </div>
      <pre className="max-h-72 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-100">
        {value}
      </pre>
    </div>
  );
}
