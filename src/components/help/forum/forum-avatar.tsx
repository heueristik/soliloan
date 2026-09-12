import { cn } from '@/lib/utils';

type ForumAvatarProps = {
  name: string;
  size?: 'sm' | 'md';
};

export function ForumAvatar({ name, size = 'sm' }: ForumAvatarProps) {
  const hue = authorHue(name);
  return (
    <div
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-medium',
        size === 'md' ? 'size-11 text-sm' : 'size-8 text-xs',
      )}
      style={{
        backgroundColor: `oklch(0.93 0.05 ${hue})`,
        color: `oklch(0.38 0.08 ${hue})`,
      }}
    >
      {authorInitials(name)}
    </div>
  );
}

function authorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function authorHue(name: string): number {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) % 360;
  }
  return hash;
}
