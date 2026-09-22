import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../../dist/', import.meta.url));

/**
 * Every built page, requested by its real filename.
 *
 * `build.format: 'file'` means the homepage is /index.html and services is
 * /services.html. Requesting the file directly sidesteps the whole
 * extensionless-vs-.html question (gotcha #1) — that normalisation is the
 * site's job, not the harness's.
 *
 * Derived from dist/ rather than hard-coded, so a new project or article
 * enters the sweep the moment it builds.
 */
export function pageUrls() {
  const out = [];

  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith('.html')) out.push('/' + relative(DIST, full).split(sep).join('/'));
    }
  };

  walk(DIST);
  return out.sort();
}
