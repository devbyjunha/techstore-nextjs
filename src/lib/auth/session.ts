const SESSION_KEY = 'techstore.session';

export interface AppSessionUser {
  name: string;
  email: string;
  membershipTier?: string;
}

export function loadAppSession(): AppSessionUser | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<AppSessionUser>;
    if (typeof parsed.email !== 'string' || parsed.email.trim().length === 0) {
      return null;
    }
    if (typeof parsed.name !== 'string' || parsed.name.trim().length === 0) {
      return null;
    }
    return {
      name: parsed.name,
      email: parsed.email,
      ...(typeof parsed.membershipTier === 'string' && parsed.membershipTier
        ? { membershipTier: parsed.membershipTier }
        : {}),
    };
  } catch {
    return null;
  }
}

export function saveAppSession(user: AppSessionUser): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearAppSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
