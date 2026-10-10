const { mkdtempSync, rmSync, readFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const directory = mkdtempSync(join(tmpdir(), 'ibuki-recovery-tests-'));
try {
  execFileSync(process.execPath, [resolve('node_modules/typescript/bin/tsc'), 'src/api/recovery.ts', '--target', 'ES2020', '--module', 'commonjs', '--lib', 'ES2020,DOM', '--skipLibCheck', '--outDir', directory], { stdio: 'inherit' });
  const result = spawnSync(process.execPath, ['--test', 'tests/recovery.test.cjs'], {
    stdio: 'inherit', env: { ...process.env, RECOVERY_TEST_MODULE: join(directory, 'recovery.js'), RECOVERY_TEST_MARKER: join(directory, 'completed') },
  });
  process.exitCode = result.status ?? 1;
  try {
    if (readFileSync(join(directory, 'completed'), 'utf8') !== '5') throw new Error('Incomplete tests');
  } catch {
    console.error('Recovery tests did not complete. Run them in an environment supporting Node test runner and WebCrypto.');
    process.exitCode = 1;
  }
} finally {
  rmSync(directory, { recursive: true, force: true });
}
