import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('../..', import.meta.url));
const scenarios = ['core-runtime', 'runtime-core', 'parallel'];

const childSource = String.raw`
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const scenario = process.argv[1];
const rootDir = process.cwd();
const moduleUrls = {
  core: pathToFileURL(resolve(rootDir, 'xtendrmt/rmt-core.esm.js')).href,
  runtime: pathToFileURL(resolve(rootDir, 'xtendrmt/rmt-runtime.esm.js')).href
};

delete globalThis.AppModules;

async function load(kind, position) {
  return import(moduleUrls[kind] + '?xtend-esm-snapshot=' + scenario + '-' + position);
}

let core;
let runtime;
if (scenario === 'core-runtime') {
  core = await load('core', 1);
  runtime = await load('runtime', 2);
} else if (scenario === 'runtime-core') {
  runtime = await load('runtime', 1);
  core = await load('core', 2);
} else {
  [core, runtime] = await Promise.all([load('core', 1), load('runtime', 2)]);
}

const exportNames = (moduleNamespace) => Object.keys(moduleNamespace).sort();
const beforeMutation = {
  coreVersion: core.getRmtApiVersion(),
  runtimeVersion: runtime.getRmtApiVersion()
};
const compatibilityMirror = {
  exists: Boolean(globalThis.AppModules && typeof globalThis.AppModules === 'object'),
  getRmtApiVersion: typeof globalThis.AppModules?.getRmtApiVersion,
  createRmtProductSurface: typeof globalThis.AppModules?.createRmtProductSurface
};

globalThis.AppModules.getRmtApiVersion = () => 'xtend.rmt.test.global-mutation';

process.stdout.write(JSON.stringify({
  scenario,
  coreExports: exportNames(core),
  runtimeExports: exportNames(runtime),
  beforeMutation,
  afterMutation: {
    coreVersion: core.getRmtApiVersion(),
    runtimeVersion: runtime.getRmtApiVersion(),
    compatibilityMirrorVersion: globalThis.AppModules.getRmtApiVersion()
  },
  compatibilityMirror
}));
`;

function runScenario(scenario) {
  const result = spawnSync(process.execPath, [
    '--input-type=module',
    '--eval',
    childSource,
    scenario
  ], {
    cwd: rootDir,
    encoding: 'utf8'
  });

  assert.equal(
    result.status,
    0,
    `XTendRMT ESM ${scenario} subprocess failed:\n${result.stderr || result.stdout}`
  );
  return JSON.parse(result.stdout);
}

const reports = scenarios.map(runScenario);
const reference = reports[0];

reports.forEach((report) => {
  assert.deepEqual(
    report.coreExports,
    reference.coreExports,
    `${report.scenario}: Core named exports are import-order independent`
  );
  assert.deepEqual(
    report.runtimeExports,
    reference.runtimeExports,
    `${report.scenario}: Runtime named exports are import-order independent`
  );
  assert.deepEqual(
    report.coreExports,
    report.runtimeExports,
    `${report.scenario}: Core and Runtime expose the same named export surface`
  );
  assert.equal(
    report.beforeMutation.coreVersion,
    report.beforeMutation.runtimeVersion,
    `${report.scenario}: Core and Runtime resolve the same API version`
  );
  assert.deepEqual(
    report.compatibilityMirror,
    {
      exists: true,
      getRmtApiVersion: 'function',
      createRmtProductSurface: 'function'
    },
    `${report.scenario}: the 0.6/0.7 AppModules compatibility mirror remains populated`
  );
  assert.equal(
    report.afterMutation.compatibilityMirrorVersion,
    'xtend.rmt.test.global-mutation',
    `${report.scenario}: the compatibility mirror remains independently writable`
  );
});

const liveGlobalLeaks = reports.flatMap((report) => [
  ['core', report.afterMutation.coreVersion, report.beforeMutation.coreVersion],
  ['runtime', report.afterMutation.runtimeVersion, report.beforeMutation.runtimeVersion]
].filter(([, actual, expected]) => actual !== expected)
  .map(([entryPoint, actual, expected]) => ({
    scenario: report.scenario,
    entryPoint,
    actual,
    expected
  })));

assert.deepEqual(
  liveGlobalLeaks,
  [],
  'Core and Runtime named exports must use module-local factory snapshots in every import order'
);

console.log('XTendRMT ESM factory snapshot contract passed.');
