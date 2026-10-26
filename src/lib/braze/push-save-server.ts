import { promises as fs } from 'fs';
import path from 'path';
import {
  mimeTypeForPushSavePath,
  sanitizePushSaveFileName,
  toPushSavePublicPathname,
} from './push-save';

export type PushSaveDownloadResult =
  | { ok: true; file: Buffer; fileName: string; contentType: string }
  | { ok: false; status: 400 | 404; error: string; message: string };

/**
 * Maps an allowlisted `/poc/push-save/...` URL to a file under `public/`.
 * Server-only — do not import from client components.
 */
export function resolvePushSaveFileOnDisk(
  imageUrl: string,
  cwd = process.cwd(),
  pageOrigin?: string
): string | null {
  const publicPath = toPushSavePublicPathname(imageUrl, pageOrigin);
  if (!publicPath) {
    return null;
  }

  const absolute = path.resolve(cwd, 'public', publicPath.slice(1));
  const root = path.resolve(cwd, 'public', 'poc', 'push-save');
  const prefix = root.endsWith(path.sep) ? root : root + path.sep;
  if (absolute !== root && !absolute.startsWith(prefix)) {
    return null;
  }
  return absolute;
}

export async function loadPushSaveDownload(params: {
  imageUrl: string;
  fileName?: string;
  origin?: string;
  cwd?: string;
  readFile?: (filePath: string) => Promise<Buffer>;
}): Promise<PushSaveDownloadResult> {
  const absolute = resolvePushSaveFileOnDisk(
    params.imageUrl,
    params.cwd ?? process.cwd(),
    params.origin
  );

  if (!absolute) {
    return {
      ok: false,
      status: 400,
      error: 'Bad Request',
      message: 'image_url must be an allowlisted /poc/push-save/ asset.',
    };
  }

  try {
    const readFile = params.readFile ?? fs.readFile;
    const file = await readFile(absolute);
    const fileName = sanitizePushSaveFileName(params.fileName, params.imageUrl);
    return {
      ok: true,
      file,
      fileName,
      contentType: mimeTypeForPushSavePath(absolute),
    };
  } catch {
    return {
      ok: false,
      status: 404,
      error: 'Not Found',
      message: 'The requested PoC asset was not found.',
    };
  }
}
