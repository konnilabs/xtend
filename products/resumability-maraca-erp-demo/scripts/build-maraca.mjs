import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(productRoot, '../..');
const productRel = 'products/resumability-maraca-erp-demo';

const args = [
  'xtend-builder/scaffold.js',
  'maraca',
  'build',
  `${productRel}/src/rmt/erp-shell.rmt`,
  '--out',
  `${productRel}/dist/maraca`,
  '--orchestration',
  'strict',
  '--kernel',
  'strict',
  '--hydration',
  'strict',
  '--validation',
  'strict',
  '--transitions',
  'strict',
  '--lazy',
  'component',
  '--css',
  'external',
  '--json'
];

const result = spawnSync(process.execPath, args, {
  cwd: repoRoot,
  stdio: 'inherit'
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
