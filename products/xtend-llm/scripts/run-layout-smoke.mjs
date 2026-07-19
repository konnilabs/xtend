import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resultDir = path.join(productRoot, '.xtend-llm-results');
const require = createRequire(import.meta.url);
let electronExecutable;

fs.mkdirSync(resultDir, { recursive: true });
for (const artifact of ['layout-smoke.json', 'layout-smoke.png', 'app-services-catfood.json']) {
  fs.rmSync(path.join(resultDir, artifact), { force: true });
}

try {
  electronExecutable = require('electron');
} catch (error) {
  throw new Error('XTend LLM browser catfood requires its pinned Electron dev dependency. Run npm ci --prefix products/xtend-llm.', { cause: error });
}

const environment = { ...process.env };
delete environment.ELECTRON_RUN_AS_NODE;
const headless = process.platform === 'linux' && !environment.DISPLAY && !environment.WAYLAND_DISPLAY;
const electronArgs = [];
if (headless) electronArgs.push('--headless=new', '--ozone-platform=headless');
electronArgs.push('--disable-gpu', '--disable-dev-shm-usage');
if (typeof process.getuid === 'function' && process.getuid() === 0) electronArgs.push('--no-sandbox');
electronArgs.push('.', '--', '--layout-smoke');

const xvfb = ['/usr/bin/xvfb-run', '/usr/local/bin/xvfb-run'].find((candidate) => fs.existsSync(candidate));
const command = headless && xvfb ? xvfb : electronExecutable;
const args = headless && xvfb ? ['-a', electronExecutable, ...electronArgs.filter((entry) => !entry.startsWith('--headless') && entry !== '--ozone-platform=headless')] : electronArgs;
const result = spawnSync(command, args, {
  cwd: productRoot,
  env: environment,
  stdio: 'inherit'
});

if (result.error) throw result.error;
if (result.status !== 0) process.exitCode = Number.isInteger(result.status) ? result.status : 1;
