import { sniffMimeType } from '@/lib/utils/mime';

export const MEDIA_MAX_BYTES = 5 * 1024 * 1024;
export const MEDIA_FORM_FIELD = 'file';

export const MEDIA_ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

export type MediaAllowedMimeType = (typeof MEDIA_ALLOWED_MIME_TYPES)[number];

const MIME_TO_EXTENSION: Record<MediaAllowedMimeType, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

export function mediaUrl(id: string): string {
  return `/api/media/${id}`;
}

export function isAllowedMediaMimeType(value: string): value is MediaAllowedMimeType {
  return (MEDIA_ALLOWED_MIME_TYPES as readonly string[]).includes(value);
}

export function sniffImageMimeType(bytes: Uint8Array): MediaAllowedMimeType | null {
  const mimeType = sniffMimeType(bytes);
  return mimeType && isAllowedMediaMimeType(mimeType) ? mimeType : null;
}

export function sanitizeMediaFileName(originalName: string, mimeType: MediaAllowedMimeType): string {
  const basename = originalName.split(/[/\\]/).pop()?.trim() ?? '';
  const withoutControlChars = [...basename]
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join('');
  const asciiSafe = withoutControlChars.replace(/[^\w.\- ()äöüÄÖÜß]+/g, '_').slice(0, 200);
  const extension = MIME_TO_EXTENSION[mimeType];

  if (!asciiSafe || asciiSafe === '.' || asciiSafe === '..') {
    return `image.${extension}`;
  }

  if (/\.(png|jpe?g|webp)$/i.test(asciiSafe)) {
    return asciiSafe.replace(/\.(png|jpe?g|webp)$/i, `.${extension}`);
  }

  return `${asciiSafe}.${extension}`;
}

export function mediaContentDisposition(name: string): string {
  const ascii = name.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
  return `inline; filename="${ascii || 'image'}"`;
}

export function toPrismaBytes(data: Buffer): Uint8Array<ArrayBuffer> {
  const result = new Uint8Array(data.byteLength);
  result.set(data);
  return result as Uint8Array<ArrayBuffer>;
}
