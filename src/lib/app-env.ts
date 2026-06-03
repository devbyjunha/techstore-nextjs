/** 앱 실행 환경 — local(로컬 개발) | prod(Vercel Production 등) */
export type AppEnv = 'local' | 'prod';

/**
 * NEXT_PUBLIC_APP_ENV 로 구분합니다.
 * - local: .env.local (기본값)
 * - prod: Vercel Environment Variables + Redeploy
 *
 * NODE_ENV(Next.js 빌드 모드)와는 별개입니다.
 */
export function getAppEnv(): AppEnv {
  const raw = (process.env.NEXT_PUBLIC_APP_ENV ?? '').trim().toLowerCase();
  return raw === 'prod' ? 'prod' : 'local';
}

export function isLocalEnv(): boolean {
  return getAppEnv() === 'local';
}

export function isProdEnv(): boolean {
  return getAppEnv() === 'prod';
}
