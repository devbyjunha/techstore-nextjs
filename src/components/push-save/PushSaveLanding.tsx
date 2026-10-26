'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Download, Loader2, TriangleAlert } from 'lucide-react';
import {
  buildPushSaveDownloadApiPath,
  downloadPushSaveFile,
  isAllowedPushSaveImageUrl,
  parsePushSaveSearchParams,
  toPushSavePublicPathname,
} from '@/lib/braze/push-save';

type DownloadState = 'idle' | 'downloading' | 'done' | 'error';

export default function PushSaveLanding() {
  const searchParams = useSearchParams();
  const extras = useMemo(
    () => parsePushSaveSearchParams(searchParams),
    [searchParams]
  );
  const [pageOrigin, setPageOrigin] = useState('');
  const allowed =
    extras !== null &&
    (toPushSavePublicPathname(extras.imageUrl) !== null ||
      (pageOrigin !== '' &&
        isAllowedPushSaveImageUrl(extras.imageUrl, pageOrigin)));
  const downloadUrl = extras ? buildPushSaveDownloadApiPath(extras) : '';

  const [state, setState] = useState<DownloadState>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPageOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!allowed || !extras) {
      return;
    }

    const fileName = extras.fileName;
    let cancelled = false;

    async function run() {
      setState('downloading');
      const result = await downloadPushSaveFile({
        downloadUrl,
        fileName,
      });
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setState('done');
        setError(null);
        return;
      }
      setState('error');
      setError(result.error);
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [allowed, downloadUrl, extras]);

  const handleRetry = async () => {
    if (!extras) {
      return;
    }
    setState('downloading');
    const result = await downloadPushSaveFile({
      downloadUrl,
      fileName: extras.fileName,
    });
    if (result.ok) {
      setState('done');
      setError(null);
      return;
    }
    setState('error');
    setError(result.error);
  };

  if (!extras || !allowed) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8">
          <TriangleAlert className="text-amber-600" size={28} />
          <h1 className="mt-3 text-xl font-semibold text-gray-900">
            저장할 이미지를 확인하지 못했습니다
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            웹 푸시 Extra Key의 <code>action</code>이 <code>save_image</code>이고,
            <code> image_url</code>이 <code>/poc/push-save/</code> 아래 허용된
            에셋이어야 합니다.
          </p>
          <Link
            href="/admin/push-save-poc"
            className="mt-6 inline-flex text-sm font-medium text-blue-700 hover:underline"
          >
            PoC 안내로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
          Braze Web Push · Extra Keys PoC
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">이미지 저장</h1>
        <p className="mt-2 text-sm text-gray-600">
          푸시 클릭으로 전달된 Extra Key를 읽어 브라우저 다운로드 폴더에 저장합니다.
          모바일 카메라 롤 저장이 아니라, 노트북 웹 푸시 대체 검증입니다.
        </p>

        <img
          src={extras.imageUrl}
          alt={extras.fileName}
          className="mt-6 w-full rounded-xl border border-gray-200"
        />

        <dl className="mt-4 space-y-1 text-sm text-gray-600">
          <div>
            <dt className="inline font-medium text-gray-800">action: </dt>
            <dd className="inline font-mono">{extras.action}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-gray-800">image_url: </dt>
            <dd className="inline font-mono break-all">{extras.imageUrl}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-gray-800">file_name: </dt>
            <dd className="inline font-mono">{extras.fileName}</dd>
          </div>
        </dl>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => void handleRetry()}
            disabled={state === 'downloading'}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {state === 'downloading' ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Download size={16} />
            )}
            {state === 'downloading' ? '저장 중…' : '다시 다운로드'}
          </button>
          {state === 'done' && (
            <span className="inline-flex items-center gap-1 text-sm text-green-700">
              <CheckCircle2 size={16} />
              다운로드를 시작했습니다
            </span>
          )}
          {state === 'error' && (
            <span className="text-sm text-red-600">
              자동 저장이 막혔습니다. 버튼을 눌러 주세요
              {error ? ` (${error})` : ''}.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
