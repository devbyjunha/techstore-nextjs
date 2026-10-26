import path from 'path';
import { loadPushSaveDownload, resolvePushSaveFileOnDisk } from '../push-save-server';
import {
  PUSH_SAVE_ACTION,
  PUSH_SAVE_SAMPLES,
  WEB_PUSH_LIQUID_RENDERED_VALUE,
  buildBrazeWebPushLiquidProbeMessage,
  buildBrazeWebPushMessage,
  buildPushSaveDownloadApiPath,
  buildPushSavePagePath,
  buildWebPushExtraPayload,
  downloadPushSaveFile,
  getPushSaveSample,
  isAllowedPushSaveImageUrl,
  mimeTypeForPushSavePath,
  parsePushSaveExtras,
  parsePushSaveSearchParams,
  sanitizePushSaveFileName,
  toPushSavePublicPathname,
} from '../push-save';

const ORIGIN = 'https://techstore.example.com';

describe('parsePushSaveExtras', () => {
  it('reads flattened extra keys', () => {
    expect(
      parsePushSaveExtras({
        action: PUSH_SAVE_ACTION,
        image_url: '/poc/push-save/ticket-a.svg',
        file_name: 'ticket-a.svg',
      })
    ).toEqual({
      action: PUSH_SAVE_ACTION,
      imageUrl: '/poc/push-save/ticket-a.svg',
      fileName: 'ticket-a.svg',
    });
  });

  it('reads nested extra objects used by web push payloads', () => {
    expect(
      parsePushSaveExtras({
        extra: {
          action: PUSH_SAVE_ACTION,
          image_url: '/poc/push-save/ticket-b.svg',
          file_name: 'ticket-b.svg',
        },
      })
    ).toEqual({
      action: PUSH_SAVE_ACTION,
      imageUrl: '/poc/push-save/ticket-b.svg',
      fileName: 'ticket-b.svg',
    });
  });

  it('reads Braze abbreviated web push extra field e', () => {
    expect(
      parsePushSaveExtras({
        _ab: 'true',
        a: 'alert body',
        t: 'title',
        e: {
          action: PUSH_SAVE_ACTION,
          image_url: '/poc/push-save/ticket-a.svg',
          file_name: 'ticket-a.svg',
        },
      })
    ).toEqual({
      action: PUSH_SAVE_ACTION,
      imageUrl: '/poc/push-save/ticket-a.svg',
      fileName: 'ticket-a.svg',
    });
  });

  it('parses extra when Braze serializes it as JSON', () => {
    const parsed = parsePushSaveExtras({
      extras: JSON.stringify({
        action: PUSH_SAVE_ACTION,
        imageUrl: '/poc/push-save/ticket-a.svg',
      }),
    });
    expect(parsed?.imageUrl).toBe('/poc/push-save/ticket-a.svg');
    expect(parsed?.fileName).toBe('ticket-a.svg');
  });

  it('returns null when action is missing or not save_image', () => {
    expect(
      parsePushSaveExtras({
        action: 'open_url',
        image_url: '/poc/push-save/ticket-a.svg',
      })
    ).toBeNull();
    expect(parsePushSaveExtras({ image_url: '/poc/push-save/ticket-a.svg' })).toBeNull();
    expect(parsePushSaveExtras(null)).toBeNull();
    expect(
      parsePushSaveExtras({ extra: '{not-json', image_url: '/poc/push-save/ticket-a.svg' })
    ).toBeNull();
    expect(getPushSaveSample('missing')).toBeUndefined();
  });
});

describe('URL allowlist', () => {
  it('allows same-origin /poc/push-save paths', () => {
    expect(toPushSavePublicPathname('/poc/push-save/ticket-a.svg')).toBe(
      '/poc/push-save/ticket-a.svg'
    );
    expect(
      isAllowedPushSaveImageUrl(
        `${ORIGIN}/poc/push-save/ticket-b.svg`,
        ORIGIN
      )
    ).toBe(true);
  });

  it('rejects path traversal, other hosts, and disallowed extensions', () => {
    expect(toPushSavePublicPathname('/poc/push-save/../secret.svg')).toBeNull();
    expect(toPushSavePublicPathname('/poc/other/ticket-a.svg')).toBeNull();
    expect(toPushSavePublicPathname('/poc/push-save/ticket.exe')).toBeNull();
    expect(
      isAllowedPushSaveImageUrl('https://evil.example/poc/push-save/ticket-a.svg', ORIGIN)
    ).toBe(false);
    expect(toPushSavePublicPathname('javascript:alert(1)')).toBeNull();
    expect(isAllowedPushSaveImageUrl('/poc/push-save/ticket-a.svg', 'not-a-url')).toBe(
      true
    );
    expect(
      isAllowedPushSaveImageUrl('https://techstore.example.com/poc/push-save/a.svg', 'not-a-url')
    ).toBe(false);
  });

  it('resolves files only under public/poc/push-save', () => {
    const cwd = '/tmp/techstore-nextjs';
    expect(resolvePushSaveFileOnDisk('/poc/push-save/ticket-a.svg', cwd)).toBe(
      path.resolve(cwd, 'public/poc/push-save/ticket-a.svg')
    );
    expect(resolvePushSaveFileOnDisk('/poc/push-save/../ticket-a.svg', cwd)).toBeNull();
    expect(resolvePushSaveFileOnDisk('https://evil.example/poc/push-save/a.svg', cwd)).toBeNull();
  });

  it('loads allowlisted files and rejects missing or unsafe URLs', async () => {
    const sample = PUSH_SAVE_SAMPLES[0];
    const loaded = await loadPushSaveDownload({
      imageUrl: sample.imageUrl,
      fileName: sample.fileName,
    });
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.contentType).toBe('image/svg+xml');
    expect(loaded.fileName).toBe(sample.fileName);
    expect(loaded.file.toString('utf8')).toContain('USER A');

    await expect(
      loadPushSaveDownload({ imageUrl: '/poc/push-save/../secret.svg' })
    ).resolves.toMatchObject({ ok: false, status: 400 });

    await expect(
      loadPushSaveDownload({
        imageUrl: '/poc/push-save/missing.svg',
        readFile: async () => {
          throw new Error('ENOENT');
        },
      })
    ).resolves.toMatchObject({ ok: false, status: 404 });
  });
});

describe('file name and mime', () => {
  it('sanitizes unsafe file names', () => {
    expect(sanitizePushSaveFileName('../x.png', '/poc/push-save/ticket-a.svg')).toBe(
      'techstore-ticket.svg'
    );
    expect(sanitizePushSaveFileName('gold ticket!.svg', '/a')).toBe('gold-ticket-.svg');
    expect(sanitizePushSaveFileName(undefined, '/poc/push-save/ticket-a.svg')).toBe(
      'ticket-a.svg'
    );
  });

  it('maps extensions to mime types', () => {
    expect(mimeTypeForPushSavePath('/poc/push-save/ticket-a.svg')).toBe('image/svg+xml');
    expect(mimeTypeForPushSavePath('file.PNG')).toBe('image/png');
  });
});

describe('payload builders', () => {
  it('builds extra keys, page path, download API, and REST web_push body', () => {
    const sample = getPushSaveSample('user-a');
    expect(sample).toBeDefined();
    if (!sample) return;

    expect(buildWebPushExtraPayload(sample)).toEqual({
      action: 'save_image',
      image_url: sample.imageUrl,
      file_name: sample.fileName,
    });

    expect(buildPushSavePagePath(sample)).toContain('/push-save?');
    expect(buildPushSaveDownloadApiPath(sample)).toContain('/api/v1/push-save?');

    const message = buildBrazeWebPushMessage({ origin: ORIGIN, sample });
    expect(message.extra.action).toBe('save_image');
    expect(message.custom_uri).toContain(ORIGIN);
    expect(message.custom_uri).toContain(encodeURIComponent(sample.imageUrl));
  });

  it('builds a localhost Liquid probe payload without rendering the tags', () => {
    const payload = buildBrazeWebPushLiquidProbeMessage({
      origin: 'http://localhost:3000',
      externalUserId: 'shopper-a@example.com',
    });

    expect(payload.external_user_ids).toEqual(['shopper-a@example.com']);
    expect(payload.messages.web_push.custom_uri).toBe('http://localhost:3000/');
    expect(payload.messages.web_push.extra.liquid_render_probe).toContain(
      WEB_PUSH_LIQUID_RENDERED_VALUE
    );
    expect(payload.messages.web_push.extra.liquid_render_probe).toContain(
      '{% assign probe'
    );
    expect(payload.messages.web_push.extra.message_extras_probe).toContain(
      'message_extras'
    );
  });

  it('parses landing-page query params', () => {
    const sample = PUSH_SAVE_SAMPLES[1];
    const parsed = parsePushSaveSearchParams(
      new URLSearchParams({
        image_url: sample.imageUrl,
        file_name: sample.fileName,
      })
    );
    expect(parsed).toEqual({
      action: PUSH_SAVE_ACTION,
      imageUrl: sample.imageUrl,
      fileName: sample.fileName,
    });
  });
});

describe('downloadPushSaveFile', () => {
  it('creates an object URL and clicks a download anchor', async () => {
    const click = jest.fn();
    const remove = jest.fn();
    const appendChild = jest.fn();
    const anchor = {
      href: '',
      download: '',
      click,
      remove,
    };
    const documentRef = {
      createElement: jest.fn(() => anchor),
      body: { appendChild },
    } as unknown as Document;

    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = jest.fn(() => 'blob:ticket');
    URL.revokeObjectURL = jest.fn();

    const fetchImpl = jest.fn(async () => ({
      ok: true,
      status: 200,
      blob: async () => new Blob(['svg'], { type: 'image/svg+xml' }),
    })) as unknown as typeof fetch;

    const result = await downloadPushSaveFile({
      downloadUrl: '/api/v1/push-save?image_url=%2Fpoc%2Fpush-save%2Fticket-a.svg',
      fileName: 'ticket-a.svg',
      fetchImpl,
      documentRef,
    });

    expect(result).toEqual({ ok: true });
    expect(anchor.download).toBe('ticket-a.svg');
    expect(click).toHaveBeenCalled();
    expect(appendChild).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:ticket');

    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  });

  it('returns document_unavailable without a document', async () => {
    const fetchImpl = jest.fn() as unknown as typeof fetch;
    await expect(
      downloadPushSaveFile({
        downloadUrl: '/api/v1/push-save',
        fileName: 'ticket-a.svg',
        fetchImpl,
        documentRef: null,
      })
    ).resolves.toEqual({ ok: false, error: 'document_unavailable' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns an error when the download endpoint fails', async () => {
    const documentRef = {
      createElement: jest.fn(),
      body: { appendChild: jest.fn() },
    } as unknown as Document;
    const fetchImpl = jest.fn(async () => ({
      ok: false,
      status: 404,
      blob: async () => new Blob([]),
    })) as unknown as typeof fetch;

    await expect(
      downloadPushSaveFile({
        downloadUrl: '/api/v1/push-save?image_url=%2Fmissing.svg',
        fileName: 'missing.svg',
        fetchImpl,
        documentRef,
      })
    ).resolves.toEqual({ ok: false, error: 'http_404' });
  });

  it('returns fetch_failed when fetch throws', async () => {
    const documentRef = {
      createElement: jest.fn(),
      body: { appendChild: jest.fn() },
    } as unknown as Document;
    const fetchImpl = jest.fn(async () => {
      throw new Error('network');
    }) as unknown as typeof fetch;

    await expect(
      downloadPushSaveFile({
        downloadUrl: '/api/v1/push-save',
        fileName: 'ticket-a.svg',
        fetchImpl,
        documentRef,
      })
    ).resolves.toEqual({ ok: false, error: 'fetch_failed' });
  });
});
