import https from 'node:https';
import { URL } from 'node:url';

function formatFetchError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Proxy request failed';
  }

  const cause = error.cause;
  if (cause instanceof Error && cause.message) {
    return `${error.message}: ${cause.message}`;
  }

  return error.message;
}

function certificateHelpMessage(base: string): string {
  return (
    `${base}\n\n` +
    'Node.js가 HTTPS 인증서를 신뢰하지 못해 Braze/Amplitude에 연결하지 못했습니다. ' +
    '회사 VPN·보안 프록시 환경에서 자주 발생합니다.\n' +
    '· 터미널 curl은 되지만 Send는 실패하는 경우가 많습니다.\n' +
    '· 개발 환경에서만 .env.local에 ADMIN_PROXY_INSECURE_TLS=true 를 추가한 뒤 dev 서버를 재시작하세요.\n' +
    '· 또는 IT팀 CA 인증서를 NODE_EXTRA_CA_CERTS 환경 변수로 등록하세요.'
  );
}

function httpsRequest(
  urlString: string,
  init: RequestInit,
  rejectUnauthorized: boolean
): Promise<Response> {
  const url = new URL(urlString);
  const method = init.method ?? 'GET';
  const headers = init.headers as Record<string, string> | undefined;
  const body = init.body as string | undefined;

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method,
        headers,
        rejectUnauthorized,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk as Buffer));
        res.on('end', () => {
          const responseBody = Buffer.concat(chunks).toString('utf-8');
          const responseHeaders = new Headers();
          Object.entries(res.headers).forEach(([key, value]) => {
            if (value) {
              responseHeaders.set(
                key,
                Array.isArray(value) ? value.join(', ') : value
              );
            }
          });

          resolve(
            new Response(responseBody, {
              status: res.statusCode ?? 500,
              statusText: res.statusMessage ?? '',
              headers: responseHeaders,
            })
          );
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

export async function proxyFetch(
  url: string,
  init: RequestInit
): Promise<Response> {
  const allowInsecureTls = process.env.ADMIN_PROXY_INSECURE_TLS === 'true';

  try {
    if (allowInsecureTls) {
      return await httpsRequest(url, init, false);
    }

    return await fetch(url, init);
  } catch (error) {
    const message = formatFetchError(error);

    if (
      message.includes('SELF_SIGNED_CERT') ||
      message.includes('certificate') ||
      message.includes('UNABLE_TO_VERIFY')
    ) {
      throw new Error(certificateHelpMessage(message));
    }

    if (message.includes('fetch failed')) {
      throw new Error(certificateHelpMessage(message));
    }

    throw new Error(message);
  }
}
