import { createAvatar } from '@dicebear/core';
import { thumbs } from '@dicebear/collection';

export const AVATAR_STYLE = thumbs;

export const AVATAR_SEEDS = [
  'sunrise',
  'mango',
  'nile',
  'coin',
  'spark',
  'river',
  'dawn',
  'kampala',
] as const;

export type AvatarSeed = (typeof AVATAR_SEEDS)[number];

// Cache generated SVGs in memory to prevent repeated recalculations
const avatarCache = new Map<string, string>();

export function getAvatarSvg(seed: string): string {
  const effectiveSeed = seed || 'sunrise';
  if (avatarCache.has(effectiveSeed)) {
    return avatarCache.get(effectiveSeed)!;
  }
  const avatar = createAvatar(AVATAR_STYLE, {
    seed: effectiveSeed,
  });
  const svg = avatar.toString();
  avatarCache.set(effectiveSeed, svg);
  return svg;
}

export function getAvatarDataUri(seed: string): string {
  const svg = getAvatarSvg(seed);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
