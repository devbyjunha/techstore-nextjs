import { NextRequest, NextResponse } from 'next/server';
import { loadPushSaveDownload } from '@/lib/braze/push-save-server';

/**
 * GET /api/v1/push-save
 * PoC-only download of static files under public/poc/push-save/.
 * Public on purpose: notification clicks cannot send auth headers.
 */
export async function GET(request: NextRequest) {
  const result = await loadPushSaveDownload({
    imageUrl: request.nextUrl.searchParams.get('image_url') ?? '',
    fileName: request.nextUrl.searchParams.get('file_name') ?? undefined,
    origin: request.nextUrl.origin,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, message: result.message },
      { status: result.status }
    );
  }

  const asciiName = result.fileName.replace(/[^\x20-\x7E]/g, '_');
  return new NextResponse(Uint8Array.from(result.file), {
    status: 200,
    headers: {
      'Content-Type': result.contentType,
      'Content-Disposition': `attachment; filename="${asciiName}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
