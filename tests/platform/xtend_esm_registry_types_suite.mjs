import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const fixtureRoot = resolve(root, 'tests/platform/fixtures/esm-registry-types');
const temporaryRoot = mkdtempSync(resolve(tmpdir(), 'xtend-registry-types-'));
const packageLink = resolve(temporaryRoot, 'node_modules/@ccslabs/xtend');
const tsc = resolve(root, 'node_modules/typescript/bin/tsc');

function compile(configName) {
  const result = spawnSync(process.execPath, [tsc, '-p', resolve(temporaryRoot, configName), '--pretty', 'false'], {
    cwd: temporaryRoot,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, `${configName} compiles:\n${result.stdout}${result.stderr}`);
}

try {
  mkdirSync(dirname(packageLink), { recursive: true });
  symlinkSync(root, packageLink, 'dir');
  cpSync(resolve(fixtureRoot, 'browser-consumer.ts'), resolve(temporaryRoot, 'browser-consumer.ts'));
  cpSync(resolve(fixtureRoot, 'ssr-consumer.ts'), resolve(temporaryRoot, 'ssr-consumer.ts'));
  writeFileSync(resolve(temporaryRoot, 'package.json'), '{"type":"module"}\n');
  writeFileSync(resolve(temporaryRoot, 'tsconfig.browser.json'), JSON.stringify({
    compilerOptions: { target: 'ES2022', module: 'ESNext', moduleResolution: 'Bundler', lib: ['ES2022', 'DOM'], strict: true, noEmit: true, skipLibCheck: false },
    files: ['browser-consumer.ts']
  }));
  writeFileSync(resolve(temporaryRoot, 'tsconfig.ssr.json'), JSON.stringify({
    compilerOptions: { target: 'ES2022', module: 'NodeNext', moduleResolution: 'NodeNext', lib: ['ES2022'], strict: true, noEmit: true, skipLibCheck: false },
    files: ['ssr-consumer.ts']
  }));

  compile('tsconfig.browser.json');
  compile('tsconfig.ssr.json');

  const browserTypes = readFileSync(resolve(root, 'xtend.d.ts'), 'utf8');
  const ssrTypes = readFileSync(resolve(root, 'xtend.ssr.d.ts'), 'utf8');
  const runtimeExports = ['schedule', 'afterPaint', 'render', 'renderNode', 'renderKeyed', 'patchElement', 'loadComponent', 'hydrate', 'boot', 'createApp', 'createStore', 'createEffects', 'createRouter', 'createAnimator', 'createValidator', 'createTransitions', 'createResources', 'createFabric', 'configureXTend', 'getXTendConfiguration', 'readyXTend', 'getXTendHost', 'getXTendSnapshot', 'createXTendKernelArtifact', 'disposeXTend'];
  runtimeExports.forEach((name) => {
    assert.match(browserTypes, new RegExp(`(?:function|const) ${name}\\b`), `${name} exists in browser types`);
    assert.match(ssrTypes, new RegExp(`(?:function|const) ${name}\\b`), `${name} exists in SSR types`);
  });
  assert.doesNotMatch(ssrTypes, /\b(?:Window|Document|Element|Node|ShadowRoot|HTMLElement|CustomEvent)\s*(?:\[|\||;|,|\)|>)/, 'SSR types contain no DOM globals');
  assert.doesNotMatch(ssrTypes, /from\s+['"]\.\/xtend-loader/, 'SSR types do not import loader declarations');
  assert.ok(existsSync(resolve(root, 'demos/ts-app/src/main.ts')), 'TypeScript demo source exists');
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

console.log('XTend ESM registry TypeScript contract passed.');
