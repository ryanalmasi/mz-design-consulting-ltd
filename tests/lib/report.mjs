let checks = 0;
let failures = 0;

export function section(name) {
  console.log(`\n── ${name}`);
}

export function ok(cond, label, detail = '') {
  checks += 1;
  if (cond) return;
  failures += 1;
  console.error(`  ✗ ${label}${detail ? `\n      ${detail}` : ''}`);
}

export function finish(name) {
  console.log(`\n${name}: ${checks - failures}/${checks} checks passed`);
  if (failures > 0) {
    console.error(`${name}: ${failures} FAILURE(S)`);
    process.exit(1);
  }
}
