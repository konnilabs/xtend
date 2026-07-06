import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { startServer } from '../server/index.mjs';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function commandExists(command) {
  const result = spawnSync(command, ['--version'], { stdio: 'ignore' });
  return result.status === 0;
}

function findChromium() {
  const candidates = ['chromium', 'chromium-browser', '/usr/bin/chromium-browser', '/usr/bin/chromium'];
  return candidates.find((candidate) => commandExists(candidate)) || null;
}

function stopProcessGroup(child, signal) {
  if (!child || !child.pid) return;
  try {
    process.kill(-child.pid, signal);
  } catch {
    try {
      child.kill(signal);
    } catch {
      // Browser process already exited.
    }
  }
}

function runChromiumDump(chromium, url) {
  return new Promise((resolve) => {
    const child = spawn(chromium, [
      '--headless=new',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--run-all-compositor-stages-before-draw',
      '--virtual-time-budget=24000',
      '--dump-dom',
      url
    ], {
      cwd: productRoot,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    let error = null;
    const timeout = setTimeout(() => {
      error = new Error('Chromium smoke timed out.');
      stopProcessGroup(child, 'SIGTERM');
      setTimeout(() => stopProcessGroup(child, 'SIGKILL'), 1200).unref();
    }, 30000);
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      if (stdout.length > 1024 * 1024 * 16 && !error) {
        error = new Error('Chromium DOM output exceeded buffer.');
        stopProcessGroup(child, 'SIGTERM');
      }
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', (spawnError) => {
      error = spawnError;
    });
    child.on('close', (status, signal) => {
      clearTimeout(timeout);
      resolve({ status, signal, stdout, stderr, error });
    });
  });
}

function assertSmokeDom(dom, reduced = false) {
  assert(dom.includes('id="rmt-testbench-smoke-result"'), 'Smoke marker is missing.');
  assert(dom.includes('data-smoke-complete="true"'), 'Smoke did not complete.');
  assert(dom.includes('data-animation-engine-ready="true"'), 'AnimationEngine did not boot.');
  assert(dom.includes('data-footer-visible="true"'), 'Footer was not observed as visible.');
  assert(dom.includes('data-pixel-change="true"'), 'Pixel-change evidence marker is missing.');
  assert(dom.includes('data-cls-budget-ok="true"'), 'CLS budget marker is not ok.');
  assert(dom.includes('data-html-sink-diagnostics="0"'), 'HTML sink diagnostics were reported.');
  assert(dom.includes('data-console-errors="0"'), 'Console errors were reported.');
  assert(dom.includes('data-route-history="dashboard&gt;settings&gt;grid&gt;detail&gt;media&gt;dashboard&gt;settings"'), 'Smoke route history skipped or reordered surfaces.');
  for (const effect of ['crossfade', 'slide-left', 'pop', 'flip', 'fade-blur', 'layout-flip']) {
    assert(dom.includes(effect), `Smoke did not exercise ${effect}.`);
  }
  const configuredDuration = dom.match(/data-last-transition-duration-ms="([0-9]+)"/u);
  if (!reduced) {
    assert(configuredDuration && Number(configuredDuration[1]) >= 120, 'Transition duration marker indicates an instant transition.');
  }
  assert(/data-lazy-loaded-count="[4-9][0-9]*"|data-lazy-loaded-count="[4-9]"/u.test(dom), 'Lazy surfaces were not loaded.');
  assert(/data-xscaler-preflight-count="[4-9][0-9]*"|data-xscaler-preflight-count="[4-9]"/u.test(dom), 'XScaler preflight was not observed.');
  if (reduced) {
    assert(dom.includes('data-reduced-motion-observed="true"'), 'Reduced motion smoke was not observed.');
    assert(dom.includes('data-reduced-motion-policy="fade"') || dom.includes('data-reduced-motion-policy="instant"'), 'Reduced motion policy marker is missing.');
  }
}

const chromium = findChromium();
if (!chromium) {
  process.stdout.write('rmt-animation-testbench browser smoke skipped: chromium not found\n');
  process.exit(0);
}

const runtime = await startServer({ port: 0, host: '127.0.0.1', silent: true });
try {
  const baseUrl = `http://127.0.0.1:${runtime.port}`;
  const normal = await runChromiumDump(chromium, `${baseUrl}/?smoke=1`);
  assert(!normal.error, `Chromium normal smoke failed: ${normal.error ? normal.error.message : 'unknown error'}`);
  assert(normal.status === 0, `Chromium normal smoke exited with ${normal.status}.`);
  assertSmokeDom(normal.stdout, false);

  const reduced = await runChromiumDump(chromium, `${baseUrl}/?smoke=1&reduced=1`);
  assert(!reduced.error, `Chromium reduced-motion smoke failed: ${reduced.error ? reduced.error.message : 'unknown error'}`);
  assert(reduced.status === 0, `Chromium reduced-motion smoke exited with ${reduced.status}.`);
  assertSmokeDom(reduced.stdout, true);
} finally {
  await runtime.close();
}

process.stdout.write('rmt-animation-testbench browser smoke ok\n');
