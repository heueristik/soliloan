const AUTH_PATHS = new Set(['/auth/login', '/auth/forgot-password', '/auth/register', '/auth/set-password']);

function pathWithoutLocale(pathname: string) {
  const stripped = pathname.replace(/^\/de(?=\/|$)/, '');
  return stripped.length > 0 ? stripped : '/';
}

/** Same-origin relative path only. Rejects protocol-relative and auth-page loops. */
export function sanitizeLoginCallbackUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (value.length === 0 || value.length > 2048) return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  if (value.includes('://') || value.includes('\\')) return null;

  const pathOnly = value.split('?')[0] ?? value;
  const normalized = pathWithoutLocale(pathOnly).replace(/\/+$/, '') || '/';
  if (AUTH_PATHS.has(normalized)) return null;
  return value;
}
