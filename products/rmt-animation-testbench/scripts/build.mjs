import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(productRoot, '../..');
const source = path.join(productRoot, 'src', 'rmt', 'animation-testbench.rmt');
const out = path.join(productRoot, 'dist', 'maraca');
const require = createRequire(import.meta.url);
const { buildMaracaBundleAsync } = require(path.join(repoRoot, 'xtend-maraca'));

function readArg(name, fallback = '') {
  const prefix = `${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1] && !process.argv[index + 1].startsWith('--')) {
    return process.argv[index + 1];
  }
  return fallback;
}

const profile = readArg('--profile', process.env.RMT_ANIMATION_TESTBENCH_PROFILE || 'production');
const result = await buildMaracaBundleAsync({
  source,
  out,
  profile,
  lazy: readArg('--lazy', 'route'),
  css: readArg('--css', 'external'),
  orchestration: readArg('--orchestration', 'strict'),
  kernel: readArg('--kernel', 'strict'),
  kernelBootMode: readArg('--kernel-boot-mode', 'productSurface'),
  hydration: readArg('--hydration', 'prewarm'),
  validation: readArg('--validation', 'auto'),
  transitions: readArg('--transitions', 'strict'),
  json: true
}, { rootDir: repoRoot });

await mkdir(path.join(productRoot, 'dist'), { recursive: true });
await writeFile(
  path.join(productRoot, 'dist', 'testbench-build.json'),
  `${JSON.stringify({
    schema: 'xtend.product.rmt-animation-testbench.build.v1',
    ok: result.ok === true,
    source: path.relative(repoRoot, source),
    out: path.relative(repoRoot, out),
    profile,
    generatedAt: new Date().toISOString(),
    report: result.report || null,
    diagnostics: result.diagnostics || []
  }, null, 2)}\n`,
  'utf8'
);

process.stdout.write(`${JSON.stringify({
  schema: 'xtend.product.rmt-animation-testbench.build-summary.v1',
  ok: result.ok === true,
  status: result.status,
  source: path.relative(repoRoot, source),
  out: path.relative(repoRoot, out),
  diagnostics: result.diagnostics || result.plan && result.plan.diagnostics || [],
  report: 'products/rmt-animation-testbench/dist/maraca/xtend.maraca.report.json'
}, null, 2)}\n`);
process.exitCode = result.ok ? 0 : 1;
