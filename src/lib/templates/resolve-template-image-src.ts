/**
 * Template images are rendered server-side (PDF) and rewritten for email.
 * Only inline data URLs and same-app relative paths are allowed so a design
 * cannot make the server request arbitrary addresses.
 */
export function resolveTemplateImageSrc(src: string, assetBaseUrl?: string): string {
  if (!src) return src;
  if (src.startsWith('data:')) return src;

  if (src.startsWith('/')) {
    const baseUrl = (assetBaseUrl || process.env.SOLILOAN_URL || process.env.NEXTAUTH_URL || '').replace(/\/+$/, '');
    return baseUrl ? `${baseUrl}${src}` : src;
  }

  return '';
}
