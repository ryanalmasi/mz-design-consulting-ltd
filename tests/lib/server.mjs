import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

/**
 * A quick, short-timeout probe for "is anything already answering on this
 * port". Used both before spawning (to refuse a collision loudly) and is
 * deliberately NOT reused as the post-spawn readiness check — this function
 * only answers "is something there", never "is it the right thing".
 */
async function portIsOccupied(base, timeoutMs = 500) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    await fetch(`${base}/`, { signal: controller.signal });
    clearTimeout(timer);
    return true;
  } catch {
    return false;
  }
}

/**
 * Serves an existing `dist/` with `astro preview`. It does NOT build — the
 * caller builds once, then every script reuses the same output, so a sweep
 * cannot accidentally test a stale or half-written directory.
 */
export async function startPreview({ port = 4321 } = {}) {
  const base = `http://localhost:${port}`;

  // Refuse a port collision loudly rather than silently testing whatever
  // already happened to answer there. This already happened once for real:
  // a stray leftover `astro dev` process on 4321 made the readiness check
  // below accept its response, and every subsequent request in the suite
  // silently hit the wrong server instead of the one this call spawns.
  if (await portIsOccupied(base)) {
    throw new Error(
      `Port ${port} is already in use before startPreview() spawned anything — ` +
        `something else is bound there (a leftover \`astro dev\`/\`astro preview\` from a previous run is the ` +
        `usual cause). Refusing to continue: the readiness poll below cannot tell "the right server" apart from ` +
        `"any server". Free the port first, e.g.: lsof -ti:${port} | xargs kill -9`
    );
  }

  const proc = spawn('npx', ['astro', 'preview', '--port', String(port)], {
    cwd: ROOT,
    stdio: ['ignore', 'ignore', 'pipe'],
  });

  let stderr = '';
  proc.stderr.on('data', (d) => (stderr += d.toString()));

  const deadline = Date.now() + 30_000;

  // Kills whatever OS process is actually bound to `port` right now, via
  // lsof. This is NOT a fallback for a process-group kill — it is the ONLY
  // approach that works here, verified by direct testing: Astro 7's
  // `astro preview` runs its real HTTP server as a self-daemonizing
  // background process that it forks and disowns (PPID 1, its own session),
  // entirely disconnected from the `npx` process spawned above — that `npx`
  // process itself exits almost immediately once the daemon is confirmed up
  // (or immediately reports "already running at ... (pid N)" if one was
  // already there). So neither `proc.kill('SIGTERM')` nor a process-group
  // kill of `proc` ever reaches the real server; only a kill targeted at
  // whatever holds the port does. (Astro also exposes `astro preview stop`,
  // but that only manages a single implicit daemon and does not take a
  // `--port`, so it can't be pointed at a specific one of these — killing
  // the actual port owner directly is both simpler and unambiguous.)
  const killPortOwner = () => {
    try {
      // `-sTCP:LISTEN` is load-bearing, not decorative — plain `lsof -ti:PORT`
      // matches EVERY socket touching that port number on either end,
      // including the local, ephemeral-port side of any still-open
      // connection TO the server (verified directly: it returned three pids
      // for one running preview server — the real daemon, plus two of this
      // same test run's own Chromium helper processes that had made requests
      // to it). Sending SIGKILL to one of those — a live browser subprocess,
      // not our server — was reproduced hanging this very call for minutes
      // (a macOS signal-delivery quirk against a sandboxed process, not a
      // Node problem) until the test harness's own timeout intervened.
      // Restricting to LISTEN sockets targets only the actual process bound
      // to the port.
      const out = execSync(`lsof -ti:${port} -sTCP:LISTEN`, { encoding: 'utf8', timeout: 5000 }).trim();
      if (!out) return;
      for (const pid of out.split('\n')) {
        try {
          process.kill(Number(pid), 'SIGKILL');
        } catch {
          /* already gone */
        }
      }
    } catch {
      /* lsof found nothing on the port, isn't available, or timed out */
    }
  };

  const stop = () => {
    try {
      proc.kill('SIGKILL');
    } catch {
      /* already gone */
    }
    killPortOwner();
  };

  for (;;) {
    try {
      const res = await fetch(`${base}/index.html`);
      if (res.ok) break;
    } catch {
      /* not up yet */
    }
    if (Date.now() > deadline) {
      stop();
      throw new Error(`astro preview did not start within 30s.\n${stderr}`);
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  return { base, stop };
}
