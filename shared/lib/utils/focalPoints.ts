import type { FocalPointContext, FocalPoints } from '../db';
import type { CSSProperties } from 'react';

export function getFocalPointStyle(
  focalPoints: FocalPoints | null | undefined,
  context: FocalPointContext,
): CSSProperties {
  const fp = focalPoints?.[context];
  if (!fp) return {}; // no override → CSS default center crop (existing behavior)
  return { objectPosition: `${fp.x}% ${fp.y}%` };
}
