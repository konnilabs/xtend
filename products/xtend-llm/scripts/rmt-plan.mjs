import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(productRoot, '..', '..');
const source = path.join(productRoot, 'xtend-llm.rmt');
const require = createRequire(import.meta.url);
const { createMaracaBuildPlan } = require(path.join(repoRoot, 'xtend-maraca'));

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

function readBooleanArg(name, fallback = false) {
  const value = readArg(name, '');
  if (!value) return process.argv.includes(name) ? true : fallback;
  if (['1', 'true', 'yes', 'on'].includes(value)) return true;
  if (['0', 'false', 'no', 'off'].includes(value)) return false;
  return fallback;
}

function createBuildInput() {
  const requestedProfile = process.argv.includes('--debug')
    ? 'debug'
    : readArg('--profile', process.env.XTEND_LLM_RMT_PROFILE || 'production');
  const profile = ['debug', 'production', 'max'].includes(requestedProfile) ? requestedProfile : 'production';
  const debug = profile === 'debug';
  return {
    source,
    out: path.join(productRoot, 'site', 'build'),
    profile,
    lazy: readArg('--lazy', 'component'),
    css: readArg('--css', 'external'),
    orchestration: readArg('--orchestration', 'strict'),
    kernel: readArg('--kernel', 'strict'),
    kernelBootMode: readArg('--kernel-boot-mode', debug ? 'direct' : 'productSurface'),
    hydration: readArg('--hydration', debug ? 'strict' : 'prewarm'),
    validation: readArg('--validation', 'strict'),
    transitions: readArg('--transitions', 'strict'),
    enablePrewarmWorker: readBooleanArg('--enable-prewarm-worker', !debug),
    json: true
  };
}

const result = createMaracaBuildPlan({
  ...createBuildInput()
}, { rootDir: repoRoot });

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = result.ok ? 0 : 1;
