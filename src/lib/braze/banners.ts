'use client';

import {
  getBrazeModule,
  initializeBraze,
  isBrazeClientEnabled,
  isBrazeInitialized,
} from './client';
import { getBrazeClientConfig } from './config';

export type BrazeBannerStatus = 'idle' | 'loading' | 'live' | 'hidden';

/** 추가혜택 리스트 한 행 높이 — BenefitRow와 동일 */
export const BRAZE_BANNER_ROW_HEIGHT_PX = 44;

export function getPdpBenefitsPlacementId(): string {
  return getBrazeClientConfig().pdpBenefitsPlacementId;
}

function applyIframeDocumentStyles(
  iframe: HTMLIFrameElement,
  height: number
): void {
  const doc = iframe.contentDocument;
  if (!doc?.body) {
    return;
  }

  const heightPx = `${height}px`;
  let styleEl = doc.getElementById('techstore-banner-normalize');
  if (!styleEl) {
    styleEl = doc.createElement('style');
    styleEl.id = 'techstore-banner-normalize';
    doc.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: ${height}px !important;
      overflow: hidden !important;
      background: transparent !important;
    }
    body {
      display: flex !important;
      align-items: center !important;
    }
    a {
      box-sizing: border-box !important;
      width: 100% !important;
      height: ${height}px !important;
      margin: 0 !important;
      padding: 0 !important;
      display: flex !important;
      align-items: center !important;
    }
  `;

  const bridge = iframe.contentWindow as Window & {
    brazeBridge?: { setBannerHeight?: (h: number) => void };
  };
  bridge.brazeBridge?.setBannerHeight?.(height);
}

function applyIframeElementStyles(
  iframe: HTMLIFrameElement,
  height: number
): void {
  const heightPx = `${height}px`;
  iframe.style.setProperty('height', heightPx, 'important');
  iframe.style.setProperty('max-height', heightPx, 'important');
  iframe.style.setProperty('min-height', heightPx, 'important');
  iframe.style.setProperty('width', '100%', 'important');
  iframe.style.setProperty('border', '0', 'important');
  iframe.style.setProperty('display', 'block', 'important');
  iframe.style.setProperty('margin', '0', 'important');
  iframe.style.setProperty('padding', '0', 'important');
}

/** iframe 삽입 직후·load·SDK 교체 후 모두 동일 높이로 맞춤 */
export function normalizeBrazeBannerIframe(container: HTMLElement): void {
  const iframe = container.querySelector('iframe');
  if (!iframe) {
    return;
  }

  const height = BRAZE_BANNER_ROW_HEIGHT_PX;
  applyIframeElementStyles(iframe, height);

  try {
    if (iframe.contentDocument?.readyState === 'complete') {
      applyIframeDocumentStyles(iframe, height);
    }
  } catch {
    // ignore
  }
}

/** iframe 문서 로드까지 기다린 뒤 정규화 (레이아웃 표시 전 호출) */
export function normalizeBrazeBannerIframeAsync(
  container: HTMLElement
): Promise<void> {
  const iframe = container.querySelector('iframe');
  if (!iframe) {
    return Promise.resolve();
  }

  const height = BRAZE_BANNER_ROW_HEIGHT_PX;

  const settle = () =>
    new Promise<void>((resolve) => {
      const run = () => {
        normalizeBrazeBannerIframe(container);
        requestAnimationFrame(() => {
          normalizeBrazeBannerIframe(container);
          resolve();
        });
      };

      try {
        if (iframe.contentDocument?.readyState === 'complete') {
          run();
        } else {
          iframe.addEventListener('load', run, { once: true });
        }
      } catch {
        resolve();
      }
    });

  applyIframeElementStyles(iframe, height);
  return settle();
}

export async function ensureBrazeBannerSubscription(): Promise<boolean> {
  if (!isBrazeClientEnabled()) {
    return false;
  }

  const initialized = await initializeBraze();
  if (!initialized) {
    return false;
  }

  const braze = await getBrazeModule();
  if (!braze) {
    return false;
  }

  return true;
}

export async function refreshBrazeBanner(
  placementId: string
): Promise<void> {
  if (!isBrazeInitialized()) {
    return;
  }

  const braze = await getBrazeModule();
  if (!braze) {
    return;
  }

  braze.requestBannersRefresh([placementId]);
}
