import { Suspense } from 'react';
import type { Metadata } from 'next';
import PushSaveLanding from '@/components/push-save/PushSaveLanding';

export const metadata: Metadata = {
  title: '이미지 저장 | TechStore',
  description: 'Braze 웹 푸시 Extra Key 클릭 시 이미지를 다운로드합니다.',
};

export default function PushSavePage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-16 text-center text-sm text-gray-500">
          다운로드 정보를 읽는 중…
        </div>
      }
    >
      <PushSaveLanding />
    </Suspense>
  );
}
