export const PUSH_SAVE_ACTION = 'save_image';
export const PUSH_SAVE_PAGE_PATH = '/push-save';
export const PUSH_SAVE_API_PATH = '/api/v1/push-save';
export const PUSH_SAVE_PUBLIC_PREFIX = '/poc/push-save/';
export const WEB_PUSH_LIQUID_PROBE_SOURCE = 'techstore-web-push-probe';
export const WEB_PUSH_LIQUID_RENDERED_VALUE = 'liquid_rendered_20260914';

export const PUSH_SAVE_EXTRA_KEYS = {
  action: 'action',
  imageUrl: 'image_url',
  fileName: 'file_name',
} as const;

const ALLOWED_EXTENSIONS = new Set([
  'svg',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'gif',
  'pdf',
]);

const MIME_BY_EXTENSION: Record<string, string> = {
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  pdf: 'application/pdf',
};

export interface PushSaveExtras {
  action: typeof PUSH_SAVE_ACTION;
  imageUrl: string;
  fileName: string;
}

export interface PushSaveSample {
  id: string;
  label: string;
  description: string;
  imageUrl: string;
  fileName: string;
}

/** Fictional PoC tickets — different URL per "user". */
export const PUSH_SAVE_SAMPLES: PushSaveSample[] = [
  {
    id: 'user-a',
    label: '유저 A',
    description: '골드 멤버 티켓',
    imageUrl: '/poc/push-save/ticket-a.svg',
    fileName: 'techstore-ticket-a.svg',
  },
  {
    id: 'user-b',
    label: '유저 B',
    description: '실버 멤버 티켓',
    imageUrl: '/poc/push-save/ticket-b.svg',
    fileName: 'techstore-ticket-b.svg',
  },
];

export function getPushSaveSample(id: string): PushSaveSample | undefined {
  return PUSH_SAVE_SAMPLES.find((sample) => sample.id === id);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function parseMaybeJsonRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'string') {
    try {
      return asRecord(JSON.parse(value));
    } catch {
      return null;
    }
  }
  return asRecord(value);
}

function readString(
  record: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function extensionOf(fileName: string): string {
  const base = posixBasename(fileName);
  const dot = base.lastIndexOf('.');
  if (dot <= 0 || dot === base.length - 1) {
    return '';
  }
  return base.slice(dot + 1).toLowerCase();
}

export function posixBasename(pathname: string): string {
  const withoutQuery = pathname.split('?')[0] ?? pathname;
  const trimmed = withoutQuery.replace(/\/+$/, '');
  const index = trimmed.lastIndexOf('/');
  return index >= 0 ? trimmed.slice(index + 1) : trimmed;
}

export function posixNormalize(pathname: string): string {
  const parts = pathname.split('/');
  const out: string[] = [];
  for (const part of parts) {
    if (part === '' || part === '.') {
      continue;
    }
    if (part === '..') {
      out.pop();
      continue;
    }
    out.push(part);
  }
  return `/${out.join('/')}`;
}

export function sanitizePushSaveFileName(
  raw: string | undefined,
  fallbackFromUrl: string
): string {
  const candidate = (raw ?? posixBasename(fallbackFromUrl)).trim();
  const cleaned = candidate.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
  const ext = extensionOf(cleaned);
  if (cleaned && ALLOWED_EXTENSIONS.has(ext) && !cleaned.startsWith('.')) {
    return cleaned.slice(0, 120);
  }
  return 'techstore-ticket.svg';
}

export function toPushSavePublicPathname(
  raw: string,
  pageOrigin?: string
): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  let pathname = trimmed;

  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      return null;
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    if (pageOrigin) {
      let origin: URL;
      try {
        origin = new URL(pageOrigin);
      } catch {
        return null;
      }
      if (parsed.origin !== origin.origin) {
        return null;
      }
    } else {
      return null;
    }
    pathname = parsed.pathname;
  }

  const normalized = posixNormalize(pathname);
  if (!normalized.startsWith(PUSH_SAVE_PUBLIC_PREFIX)) {
    return null;
  }
  if (normalized.includes('\0') || normalized.includes('\\')) {
    return null;
  }
  const ext = extensionOf(normalized);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return null;
  }
  return normalized;
}

export function isAllowedPushSaveImageUrl(
  raw: string,
  pageOrigin: string
): boolean {
  return toPushSavePublicPathname(raw, pageOrigin) !== null;
}

export function mimeTypeForPushSavePath(pathname: string): string {
  return MIME_BY_EXTENSION[extensionOf(pathname)] ?? 'application/octet-stream';
}

export function parsePushSaveExtras(data: unknown): PushSaveExtras | null {
  const root = asRecord(data);
  if (!root) {
    return null;
  }

  const nested = {
    ...(parseMaybeJsonRecord(root.e) ?? {}),
    ...(parseMaybeJsonRecord(root.extras) ?? {}),
    ...(parseMaybeJsonRecord(root.extra) ?? {}),
  };
  const merged: Record<string, unknown> = { ...root, ...nested };

  const action = readString(merged, 'action', 'ab_action');
  const imageUrl = readString(merged, 'image_url', 'imageUrl');
  if (action !== PUSH_SAVE_ACTION || !imageUrl) {
    return null;
  }

  return {
    action: PUSH_SAVE_ACTION,
    imageUrl,
    fileName: sanitizePushSaveFileName(
      readString(merged, 'file_name', 'fileName'),
      imageUrl
    ),
  };
}

export function parsePushSaveSearchParams(
  searchParams: URLSearchParams
): PushSaveExtras | null {
  return parsePushSaveExtras({
    action: searchParams.get('action') ?? PUSH_SAVE_ACTION,
    image_url: searchParams.get('image_url') ?? '',
    file_name: searchParams.get('file_name') ?? '',
  });
}

export function buildWebPushExtraPayload(
  sample: Pick<PushSaveSample, 'imageUrl' | 'fileName'>
): Record<string, string> {
  return {
    [PUSH_SAVE_EXTRA_KEYS.action]: PUSH_SAVE_ACTION,
    [PUSH_SAVE_EXTRA_KEYS.imageUrl]: sample.imageUrl,
    [PUSH_SAVE_EXTRA_KEYS.fileName]: sample.fileName,
  };
}

export function buildPushSavePagePath(
  extras: Pick<PushSaveExtras, 'imageUrl' | 'fileName'>
): string {
  const params = new URLSearchParams({
    action: PUSH_SAVE_ACTION,
    image_url: extras.imageUrl,
    file_name: extras.fileName,
  });
  return `${PUSH_SAVE_PAGE_PATH}?${params.toString()}`;
}

export function buildPushSaveDownloadApiPath(
  extras: Pick<PushSaveExtras, 'imageUrl' | 'fileName'>
): string {
  const params = new URLSearchParams({
    image_url: extras.imageUrl,
    file_name: extras.fileName,
  });
  return `${PUSH_SAVE_API_PATH}?${params.toString()}`;
}

export function buildBrazeWebPushMessage(params: {
  origin: string;
  sample: PushSaveSample;
  title?: string;
  alert?: string;
}): {
  title: string;
  alert: string;
  custom_uri: string;
  extra: Record<string, string>;
} {
  const extras = {
    imageUrl: params.sample.imageUrl,
    fileName: params.sample.fileName,
  };
  return {
    title: params.title ?? 'TechStore 티켓이 도착했습니다',
    alert: params.alert ?? '알림을 클릭하면 이미지가 노트북에 저장됩니다.',
    custom_uri: `${params.origin}${buildPushSavePagePath(extras)}`,
    extra: buildWebPushExtraPayload(params.sample),
  };
}

export function buildBrazeWebPushLiquidProbeMessage(params: {
  origin: string;
  externalUserId?: string;
}): {
  external_user_ids: string[];
  messages: {
    web_push: {
      title: string;
      alert: string;
      custom_uri: string;
      extra: Record<string, string>;
    };
  };
} {
  return {
    external_user_ids: [params.externalUserId ?? 'YOUR_EXTERNAL_ID'],
    messages: {
      web_push: {
        title: 'Web Push extra Liquid 렌더링 테스트',
        alert: '기기 수신 payload를 확인하는 테스트입니다.',
        custom_uri: `${params.origin}/`,
        extra: {
          liquid_render_probe: `{% assign probe = '${WEB_PUSH_LIQUID_RENDERED_VALUE}' %}{{probe}}`,
          message_extras_probe:
            '{% message_extras :key test_location :value extra_client_only_value %}',
        },
      },
    },
  };
}

export async function downloadPushSaveFile(params: {
  downloadUrl: string;
  fileName: string;
  fetchImpl?: typeof fetch;
  documentRef?: Document | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const fetchImpl = params.fetchImpl ?? fetch;
  const documentRef =
    params.documentRef === null
      ? undefined
      : (params.documentRef ??
        (typeof document !== 'undefined' ? document : undefined));

  if (!documentRef) {
    return { ok: false, error: 'document_unavailable' };
  }

  try {
    const response = await fetchImpl(params.downloadUrl);
    if (!response.ok) {
      return { ok: false, error: `http_${response.status}` };
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = documentRef.createElement('a');
    anchor.href = objectUrl;
    anchor.download = params.fileName;
    documentRef.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    return { ok: true };
  } catch {
    return { ok: false, error: 'fetch_failed' };
  }
}
