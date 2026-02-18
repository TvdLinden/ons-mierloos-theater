import { rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

// Brand color: teal from the logo (#00a098)
export const brandTeal = rgb(0, 0.627, 0.596);

let cachedLogoBytes: Buffer | null = null;

export function loadLogoBytes(): Buffer | null {
  if (cachedLogoBytes) return cachedLogoBytes;
  try {
    const logoPath = path.join(__dirname, '../assets/logo.png');
    cachedLogoBytes = fs.readFileSync(logoPath);
    return cachedLogoBytes;
  } catch {
    return null;
  }
}
