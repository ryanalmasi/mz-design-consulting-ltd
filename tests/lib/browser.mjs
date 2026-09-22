import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

// playwright-core deliberately ships no browser. This machine already has one
// cached from a previous Playwright install; reusing it keeps the devDependency
// small and avoids a 150 MB download on every clone.
const CACHE = join(homedir(), 'Library/Caches/ms-playwright');
const REL = 'chrome-mac/Chromium.app/Contents/MacOS/Chromium';

export function chromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;

  let dirs = [];
  try {
    dirs = readdirSync(CACHE).filter((d) => d.startsWith('chromium-')).sort().reverse();
  } catch {
    throw new Error(
      `No Playwright browser cache at ${CACHE}.\n` +
        'Set CHROMIUM_PATH to a Chromium binary, or run: npx playwright install chromium'
    );
  }

  for (const dir of dirs) {
    const candidate = join(CACHE, dir, REL);
    if (existsSync(candidate)) return candidate;
  }

  throw new Error(
    `Found ${dirs.length} cached Playwright dir(s) under ${CACHE} but no Chromium binary.\n` +
      'Set CHROMIUM_PATH, or run: npx playwright install chromium'
  );
}

export function launch() {
  return chromium.launch({ executablePath: chromiumPath() });
}
