import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

/**
 * Serves an existing `dist/` with `astro preview`. It does NOT build — the
 * caller builds once, then every script reuses the same output, so a sweep
 * cannot accidentally test a stale or half-written directory.
 */
export async function startPreview({ port = 4321 } = {}) {
  const proc = spawn('npx', ['astro', 'preview', '--port', String(port)], {
    cwd: ROOT,
    stdio: ['ignore', 'ignore', 'pipe'],
  });

  let stderr = '';
  proc.stderr.on('data', (d) => (stderr += d.toString()));

  const base = `http://localhost:${port}`;
  const deadline = Date.now() + 30_000;

  for (;;) {
    try {
      const res = await fetch(`${base}/index.html`);
      if (res.ok) break;
    } catch {
      /* not up yet */
    }
    if (Date.now() > deadline) {
      proc.kill('SIGKILL');
      throw new Error(`astro preview did not start within 30s.\n${stderr}`);
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  return { base, stop: () => proc.kill('SIGTERM') };
}
