'use client';

import { Bell, BellOff, Loader2 } from 'lucide-react';
import { useBrazePush } from '@/hooks/useBrazePush';

interface BrazePushSettingsProps {
  onToast?: (message: string, type?: 'info' | 'error') => void;
}

export default function BrazePushSettings({ onToast }: BrazePushSettingsProps) {
  const { isEnabled, pushState, isLoading, enablePush, disablePush } =
    useBrazePush();

  if (!isEnabled) {
    return (
      <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-500">
        Braze가 설정되지 않아 웹 푸시를 사용할 수 없습니다. 환경 변수를 확인하세요.
      </div>
    );
  }

  const handleEnable = async () => {
    const result = await enablePush();
    if (result.granted) {
      onToast?.('브라우저 푸시 알림이 활성화되었습니다.', 'info');
      return;
    }

    if (pushState.isBlocked) {
      onToast?.(
        '브라우저에서 알림이 차단되어 있습니다. 브라우저 설정에서 이 사이트의 알림을 허용해 주세요.',
        'error'
      );
      return;
    }

    onToast?.(
      result.temporaryDenial
        ? '알림 권한 요청이 취소되었습니다.'
        : '알림 권한이 거부되었습니다.',
      'error'
    );
  };

  const handleDisable = async () => {
    const ok = await disablePush();
    onToast?.(
      ok
        ? '브라우저 푸시 알림이 해제되었습니다.'
        : '푸시 알림 해제에 실패했습니다.',
      ok ? 'info' : 'error'
    );
  };

  const statusLabel = (() => {
    switch (pushState.status) {
      case 'granted':
        return '활성화됨';
      case 'blocked':
        return '브라우저에서 차단됨';
      case 'unsupported':
        return '이 브라우저에서 지원되지 않음';
      case 'not_initialized':
        return '초기화 중…';
      default:
        return '비활성화됨';
    }
  })();

  const statusColor =
    pushState.status === 'granted'
      ? 'text-green-600 bg-green-50'
      : pushState.status === 'blocked'
        ? 'text-red-600 bg-red-50'
        : 'text-gray-600 bg-gray-50';

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {pushState.status === 'granted' ? (
            <Bell className="mt-0.5 text-green-600" size={20} />
          ) : (
            <BellOff className="mt-0.5 text-gray-400" size={20} />
          )}
          <div>
            <h4 className="font-medium text-gray-900">브라우저 푸시 알림</h4>
            <p className="mt-1 text-sm text-gray-500">
              주문·배송·프로모션 소식을 브라우저 푸시로 받을 수 있습니다.
            </p>
            <span
              className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          {pushState.status === 'granted' ? (
            <button
              type="button"
              onClick={() => void handleDisable()}
              disabled={isLoading}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                '해제'
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleEnable()}
              disabled={
                isLoading ||
                pushState.status === 'unsupported' ||
                pushState.status === 'blocked' ||
                pushState.status === 'not_initialized'
              }
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                '알림 받기'
              )}
            </button>
          )}
        </div>
      </div>

      {pushState.status === 'blocked' && (
        <p className="mt-3 text-xs text-red-600">
          브라우저 주소창 옆 자물쇠(또는 사이트 정보) → 알림 → 허용으로 변경한 뒤
          페이지를 새로고침하세요.
        </p>
      )}
    </div>
  );
}
