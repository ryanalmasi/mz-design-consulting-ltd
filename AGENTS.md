# AGENTS.md

The full agent guide for this repository lives in **[`CLAUDE.md`](CLAUDE.md)** —
repository context, environment setup, commands, gotchas and verification
expectations. It applies to any coding agent, not just Claude Code.

The session log is **[`MEMORY.md`](MEMORY.md)**. Read it before starting work and
append your own entry before you finish.

Two things that will stop you immediately if you skip them:

- Run `nvm use` first. Astro 7 needs Node >= 22.12 and the machine default is
  22.11, which hard-exits.
- `npm run verify` must stay at 0 errors, 0 warnings, 0 hints.
