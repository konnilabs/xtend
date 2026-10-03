'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { createHash } = require('crypto');
const { pathToFileURL } = require('url');
const { executeToolingBridgeOperation: execute } = require('../../../tools/tooling-bridge');
const rootDir = path.resolve(__dirname, '../../..');
const filePath = 'docs/rmt-playground-source.rmt';
const options = { documentId: 'docs.rmt.playground', source: 'docs-rmt-playground' };
const maraca = { profile: 'debug', lazy: 'component', css: 'external', stack: 'runtime', components: 'document', orchestration: 'auto', kernel: 'auto', hydration: 'auto', validation: 'auto', transitions: 'auto' };
const safePreview = { options: { componentRegistry: JSON.parse(fs.readFileSync(path.join(rootDir, 'components/manifest.json'))), limits: { maxDepth: 32, maxNodes: 1000, maxTextBytes: 65536, maxAttributes: 32 } }, project: { baseUrl: 'https://xtend.invalid/' } };
const fixturePaths = ['tests/rmt-language/fixtures/vnext-valid-minimal.rmt', 'products/rmt-maraca-kernel-orchestration/kernel-orchestration-app.rmt', 'tests/rmt-language/fixtures/maraca-orchestration-app.rmt', 'tests/rmt-language/fixtures/maraca-validation-app.rmt', 'tests/rmt-language/fixtures/maraca-transitions-app.rmt'];
const fixtures = fixturePaths.map(file => ({ name: path.basename(file), source: fs.readFileSync(path.join(rootDir, file), 'utf8') }));
fixtures.push({ name: 'incomplete', source: 'template broken {' }, { name: 'import', source: 'import "./missing.rmt";\n' + fixtures[0].source }, { name: 'near-limit', source: fixtures[0].source + '\n//' + 'x'.repeat(65000 - Buffer.byteLength(fixtures[0].source)) });
function digest(value) {
  // Source locations are part of the contract; the checkout directory is not.
  const uriRoot = pathToFileURL(rootDir + path.sep).href;
  const json = JSON.stringify(value, (key, entry) => {
    if (key === 'file' && typeof entry === 'string' && entry.startsWith(rootDir + path.sep)) {
      return path.relative(rootDir, entry).split(path.sep).join('/');
    }
    if (key === 'uri' && typeof entry === 'string' && entry.startsWith(uriRoot)) {
      return 'rmt:///' + entry.slice(uriRoot.length);
    }
    return entry;
  });
  return createHash('sha256').update(json).digest('hex');
}
function compact(result) { return { ok: result.ok, status: result.status, diagnostics: result.diagnostics || result.compilerDiagnostics || [], coreDocument: result.coreDocument || null, coreJson: result.coreJson || null }; }
async function legacy(source) {
  const compile = await execute({ operation: 'compile', payload: { source, filePath, options } }, { rootDir });
  const preview = compile.ok ? await execute({ operation: 'safe-preview', payload: { ...safePreview, coreDocument: compile.result.coreDocument } }, { rootDir }) : null;
  const plan = compile.ok ? await execute({ operation: 'maraca-plan', payload: { source, filePath, options: maraca } }, { rootDir }) : null;
  return { compile: compact(compile.result), safePreview: preview && preview.result, maraca: plan && plan.result };
}
async function main() {
  const capture = process.argv.includes('--capture');
  const expectedPath = path.join(__dirname, 'evidence/contracts.json');
  const expected = capture ? {} : JSON.parse(fs.readFileSync(expectedPath));
  for (const fixture of fixtures) {
    const old = await legacy(fixture.source);
    const hashes = Object.fromEntries(Object.entries(old).map(([key, value]) => [key, digest(value)]));
    if (capture) expected[fixture.name] = hashes;
    else {
      assert.deepStrictEqual(hashes, expected[fixture.name], fixture.name + ': legacy contract changed');
      const assembler = require('../../../xtend-builder/generators/rmt-kernel-lab');
      const assembleOne = assembler.createRmtKernelSourceArtifact;
      let unsharedAssemblies = 0;
      assembler.createRmtKernelSourceArtifact = (...args) => { unsharedAssemblies++; return assembleOne(...args); };
      let response;
      try { response = await execute({ operation: 'jit-compile', payload: { source: fixture.source, filePath, options, safePreview, maraca } }, { rootDir }); }
      finally { assembler.createRmtKernelSourceArtifact = assembleOne; }
      assert.strictEqual(unsharedAssemblies, 0, fixture.name + ': JIT must use only the shared validated generation');
      assert.deepStrictEqual(response.result.compile, old.compile, fixture.name + ': compile');
      assert.deepStrictEqual(response.result.safePreview && response.result.safePreview.result, old.safePreview, fixture.name + ': preview');
      assert.strictEqual(digest(response.result.maraca && response.result.maraca.result), digest(old.maraca), fixture.name + ': maraca');
      assert(Buffer.byteLength(JSON.stringify(response)) <= 1.5 * 1024 * 1024, fixture.name + ': compact bridge budget');
    }
    console.log((capture ? 'captured ' : 'passed ') + fixture.name);
  }
  if (capture) fs.writeFileSync(expectedPath, JSON.stringify(expected, null, 2) + '\n');
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { fixtures, filePath, options, maraca, safePreview, rootDir, compact };
