import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { EFFECTS } from '../src/shared/testbench-data.mjs';
import { startServer } from '../server/index.mjs';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(productRoot, '../..');
const sourcePath = path.join(productRoot, 'src', 'rmt', 'animation-testbench.rmt');
const require = createRequire(import.meta.url);
const { compileRmtVNextSource } = require(path.join(repoRoot, 'tools', 'rmt-language', 'vnext-compiler.js'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertNoErrors(diagnostics, prefix) {
  const errors = (diagnostics || []).filter((diagnostic) => diagnostic && diagnostic.severity === 'error');
  assert(errors.length === 0, `${prefix} has errors: ${JSON.stringify(errors.slice(0, 5), null, 2)}`);
}

const source = await readFile(sourcePath, 'utf8');
const compiled = compileRmtVNextSource({
  text: source,
  filePath: path.relative(repoRoot, sourcePath)
});

assert(compiled.ok === true, 'RMT source does not compile.');
assertNoErrors(compiled.diagnostics, 'RMT compile');
const artifacts = compiled.orchestrationArtifacts || {};
const animationEngine = artifacts.animationEngine || {};
const transitions = artifacts.transitions || {};
assert(animationEngine.schema === 'xtend.rmt.animation-engine.v1', 'AnimationEngine artifact is missing.');
assert(transitions.schema === 'xtend.rmt.surface-transitions.v1', 'Surface transition compatibility artifact is missing.');
assert(Array.isArray(animationEngine.animations), 'AnimationEngine animations are missing.');
assert(Array.isArray(animationEngine.transitions), 'AnimationEngine transitions are missing.');
assert(animationEngine.transitions.length >= 5, 'AnimationEngine transition baseline is too small.');
for (const effect of EFFECTS) {
  assert(animationEngine.animations.some((animation) => animation.effect === effect), `Missing animation preset: ${effect}`);
}
assert(animationEngine.transitions.some((transition) => transition.effect === 'crossfade' && transition.phasing === 'overlap'), 'Crossfade is not lowered as overlap.');
assert(animationEngine.transitions.some((transition) => transition.effect === 'layout-flip' && transition.layoutKey), 'Layout FLIP transition lacks layoutKey.');
assert(animationEngine.transitions.some((transition) => transition.effect === 'fade-blur' && transition.keyframes.length >= 2), 'Fade-blur transition lacks filter keyframes.');
assert(transitions.schedulerTargets.every((target) => target.kind === 'surface-transition' && target.lane === 'transition'), 'Transition scheduler targets are incomplete.');

[
  'dist/maraca/xtend.maraca.mjs',
  'dist/maraca/xtend.maraca.report.json',
  'dist/maraca/xtend.maraca.css',
  'dist/testbench-build.json'
].forEach((relative) => {
  assert(existsSync(path.join(productRoot, relative)), `Missing build artifact: ${relative}`);
});

const report = JSON.parse(await readFile(path.join(productRoot, 'dist', 'maraca', 'xtend.maraca.report.json'), 'utf8'));
assert(report.ok === true, 'Maraca report is not ok.');
assert(report.transitions && report.transitions.summary && report.transitions.summary.animationEngineSchema === 'xtend.rmt.animation-engine.v1', 'Maraca report does not summarize AnimationEngine.');
assert(report.kernel && report.kernel.enabled === true, 'Maraca kernel is not enabled.');
assert(report.hydration && report.hydration.enabled === true, 'Maraca hydration is not enabled.');

const ignore = spawnSync('git', ['check-ignore', '-q', 'products/rmt-animation-testbench/package.json'], {
  cwd: repoRoot,
  stdio: 'ignore'
});
assert(ignore.status === 1, 'Product source is unexpectedly git-ignored.');

const runtime = await startServer({ port: 0, host: '127.0.0.1', silent: true });
try {
  const baseUrl = `http://127.0.0.1:${runtime.port}`;
  const htmlResponse = await fetch(`${baseUrl}/?seed=verify-seed`);
  const csp = htmlResponse.headers.get('content-security-policy') || '';
  const html = await htmlResponse.text();
  assert(htmlResponse.status === 200, 'SSR page did not return 200.');
  assert(csp.includes("default-src 'self'"), 'CSP default-src is missing.');
  assert(csp.includes("script-src 'self'"), 'CSP script-src is missing.');
  assert(csp.includes("connect-src 'self'"), 'CSP connect-src is missing.');
  assert(html.includes('id="xtend-maraca-root"'), 'HTML lacks Maraca root.');
  assert(html.includes('data-rmt-ssr-hydration'), 'HTML lacks hydration payload.');
  assert(html.includes('data-rmt-ssr-surface="rmt.animation.testbench.dashboard"'), 'HTML lacks initial SSR surface.');
  assert(html.includes('id="rmt-motion-controls"'), 'HTML lacks footer controls.');
  assert(html.includes('id="control-effect"'), 'HTML lacks effect select.');
  assert(html.includes('data-lazy-state="unloaded"'), 'HTML lacks lazy placeholders.');
  assert(html.includes('xtend.rmt.animation-engine.v1'), 'Boot payload lacks AnimationEngine schema.');
  assert(!html.includes('<script>alert'), 'HTML contains suspicious script sink content.');

  const health = await (await fetch(`${baseUrl}/health`)).json();
  assert(health.ok === true, 'Health endpoint is not ok.');
  assert(health.animationEngineSchema === 'xtend.rmt.animation-engine.v1', 'Health endpoint lacks animation schema.');

  const preflight = await (await fetch(`${baseUrl}/api/xscaler/preflight?surface=media&reason=verify`)).json();
  assert(preflight.ok === true, 'XScaler preflight is not ok.');
  assert(preflight.protocol === 'xscaler' && typeof preflight.requestId === 'string', 'XScaler preflight does not use the canonical public protocol envelope.');
  assert(preflight.networkDuringRender === false, 'XScaler preflight allows network during render.');
  assert(preflight.remoteSurfacePlan && preflight.remoteSurfacePlan.protocol === 'xscaler' && preflight.remoteSurfacePlan.ssr.networkDuringRender === false, 'XScaler remote surface plan is missing or non-canonical.');
  assert(preflight.atc && preflight.atc.protocol === 'xscaler' && preflight.atc.accepted === true && preflight.atc.ok === true && preflight.atc.mode === 'protocol-lazy', 'XScaler ATC shape is missing or non-canonical.');

  const lazy = await (await fetch(`${baseUrl}/api/lazy-surface/media`)).json();
  assert(lazy.ok === true, 'Lazy surface endpoint is not ok.');
  assert(lazy.surface && lazy.surface.id === 'media', 'Lazy surface endpoint returned the wrong surface.');
  assert(lazy.preflight && lazy.preflight.networkDuringRender === false, 'Lazy surface does not include XScaler preflight evidence.');

  const resume = await (await fetch(`${baseUrl}/api/resume`)).json();
  assert(resume.ok === true, 'Resume endpoint is not ok.');
  assert(resume.payload && resume.payload.schema === 'xtend.product.rmt-animation-testbench.resume-payload.v1', 'Resume payload schema is missing.');

  const telemetry = await (await fetch(`${baseUrl}/api/telemetry`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ schema: 'xtend.product.rmt-animation-testbench.telemetry-test.v1', event: 'verify' })
  })).json();
  assert(telemetry.ok === true, 'Telemetry endpoint is not ok.');

  for (const staticPath of [
    '/src/client/testbench-controller.mjs',
    '/src/styles/testbench.css',
    '/src/assets/motion-map.svg',
    '/components/xselect.js',
    '/components/xbutton.js',
    '/components/xutils.js',
    '/xtendrmt/rmt-animation-engine-runtime.js',
    '/dist/maraca/xtend.maraca.mjs'
  ]) {
    const staticResponse = await fetch(`${baseUrl}${staticPath}`);
    assert(staticResponse.status === 200, `Static route is not available: ${staticPath}`);
  }
} finally {
  await runtime.close();
}

process.stdout.write('rmt-animation-testbench verify ok\n');
