'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), { createHash } = require('node:crypto');
const reference = require('./two-host-reference.cjs');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function inspect({ write = false, check = false } = {}) {
  const root = path.resolve(__dirname, '../..'), ts = require('typescript'), checks = [];
  const verify = async (name, fn) => { await fn(); checks.push(name); };
  const { lowered, capture } = await reference.prepareCase(), contract = reference.readContract(), records = capture.providers;
  const lower = value => reference.lowerContract(value, capture.catalog);
  const typePath = path.join(__dirname, 'two-host.types.d.ts'), types = reference.renderTypes(capture.catalog);
  if (write) fs.writeFileSync(typePath, types);
  await verify('generated component types exactly match the versioned data contract', () => assert.equal(fs.readFileSync(typePath, 'utf8'), types));
  await verify('two compiled target surfaces map to one explicit common owner', () => {
    assert.equal(lowered.bindings.bindings.length, 2); assert.notEqual(lowered.hosts[0].targetSurface, lowered.hosts[1].targetSurface);
    assert(lowered.hosts.every(host => host.ownerSurface === lowered.ownerSurface)); assert.equal(lowered.automaticCompositionSupported, false);
  });
  await verify('candidate identity and lane literals match contract; TSX syntax is valid', () => reference.checkCandidate(fs.readFileSync(path.join(__dirname, 'two-host.candidate.tsx'), 'utf8'), lowered, ts));
  for (const [name, before, after] of [
    ['wrong Model reference', 'model.product.images', 'model.product.id'],
    ['wrong Action', 'action: "product.selectImage"', 'action: "product.changeSort"'],
    ['source callback', 'model.product.selectedImageId', 'readSelection()'],
    ['unknown attribute', 'lane="visible"', 'lane="visible" scheduler={kernel}']
  ]) await verify('candidate rejects ' + name, () => {
    const text = fs.readFileSync(path.join(__dirname, 'two-host.candidate.tsx'), 'utf8');
    assert.throws(() => reference.checkCandidate(text.replace(before, after), lowered, ts));
  });
  await verify('both actual provider components typecheck against generated props and intents', () => {
    const program = ts.createProgram(records.map(row => path.join(root, row.entry.module)), { noEmit: true, allowJs: true, checkJs: true, strict: true,
      module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, target: ts.ScriptTarget.ES2022, types: [], skipLibCheck: true });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCanonicalFileName: file => file, getCurrentDirectory: () => root, getNewLine: () => '\n' }));
  });
  const { GRAPH_MANIFEST_SCHEMA, MANIFEST_SCHEMA, normalizeManifest } = await import('../../xtend-maraca/xtension-composition-contract.mjs');
  const manifest = { schema: GRAPH_MANIFEST_SCHEMA, providers: records, modules: records.map(row => ({ module: row.entry.module, sha256: row.integrity.sha256 })), hosts: [] };
  await verify('both provider source graphs pass actual pinned-byte capture', async () => {
    const graph = await require('../../xtend-maraca/xtension-provider-graph').captureProviderGraph(root, manifest);
    assert.equal(graph.providers.length, 2); assert.equal(graph.files.length, 2);
  });
  await verify('legacy automatic composition rejects the shared owner; no silent fallback', () => {
    assert.throws(() => normalizeManifest({ schema: MANIFEST_SCHEMA, providers: records, hosts: lowered.hosts.map(host => ({
      declarationId: host.declarationId, providerId: host.providerId, ownerSurface: lowered.ownerSurface,
      capabilityRequirements: { schema: 'xtend.xtensions.host-capability-requirements.v1', required: {} }
    })) }, { bindings: lowered.bindings }), /exact declared owning Surface/);
  });
  for (const [name, mutate] of [
    ['unknown contract version', value => { value.version = '3.0.0'; }],
    ['unknown contract field', value => { value.scheduler = {}; }],
    ['duplicate declaration', value => { value.hosts[1].declarationId = value.hosts[0].declarationId; }],
    ['duplicate target', value => { value.hosts[1].targetSurface = value.hosts[0].targetSurface; }],
    ['undeclared owner', value => { value.ownerSurface = 'missing'; }],
    ['unsupported call-site framework override', value => { value.hosts[0].framework = 'angular'; }],
    ['unpinned peer', value => { value.hosts[0].peers = { react: '^18' }; }],
    ['provider path escape', value => { value.hosts[0].providerModule = './../escape.mjs'; }],
    ['source grant', value => { value.hosts[0].scheduler = {}; }],
    ['unknown lane', value => { value.hosts[0].lane = 'invented'; }],
    ['missing Model path', value => { value.hosts[0].props.selectedImageId.path = ['missing']; }],
    ['wrong prop type', value => { value.hosts[0].props.selectedImageId.type = 'number'; }],
    ['unknown Action', value => { value.hosts[0].intents.selectImage.command = 'missing'; }],
    ['mismatched Action input', value => { value.hosts[0].intents.selectImage.payload = { imageId: 'unknown' }; }],
    ['extra intent payload field', value => { value.hosts[0].intents.selectImage.fields = { command: { type: 'string' } }; }]
  ]) await verify('reject ' + name, () => { const value = structuredClone(contract); mutate(value); assert.throws(() => lower(value)); });
  await verify('contract accessors are rejected without execution', () => {
    let calls = 0; const value = structuredClone(contract); Object.defineProperty(value, 'ownerSurface', { enumerable: true, get() { calls++; return contract.ownerSurface; } });
    assert.throws(() => lower(value)); assert.equal(calls, 0);
  });
  const files = ['two-host.contract.json', 'two-host.rmt', 'two-host.candidate.tsx', 'two-host.types.d.ts', 'two-host-reference.cjs', 'two-host-runtime.mjs', 'two-host-acceptance.mjs', 'two-host-inspect.cjs', 'two-host-test.cjs', 'providers/react-gallery.mjs', 'providers/vue-reviews.mjs', 'providers/catalog.json', 'providers/react.interface.json', 'providers/vue.interface.json'].map(file => 'development/rmtx-a06/' + file).concat([
    'tools/xtensions/component-interface.js', 'tools/xtensions/component-interface.d.ts', 'tools/xtensions/component-interface.v1.schema.json', 'tools/xtensions/component-interface-build.js',
    'tests/xtensions/component-interface.test.cjs', 'tests/types/xtensions_component_interface.tsx', 'tests/types/xtensions_component_candidate.d.ts', 'scripts/check_release_preparation.cjs', 'tests/release/preparation-gates.test.cjs'
  ]);
  const result = { format: 2, version: '2.0.0', stage: 'A06.1b-provider-component-interface', contractVersion: contract.version,
    checks: checks.length, names: checks, automaticCompositionSupported: false, syntaxDecisionStatus: 'open',
    runtimeExecutionInContractCheck: false, acceptedForRelease: false,
    sources: Object.fromEntries(files.map(file => [file, hash(fs.readFileSync(path.join(root, file)))])) };
  const text = JSON.stringify(result, null, 2) + '\n', output = path.join(__dirname, 'two-host-evidence.json');
  if (write) fs.writeFileSync(output, text); if (check) assert.equal(fs.readFileSync(output, 'utf8'), text, 'A06 case contract/source drift');
  console.log(`A06.1b: ${checks.length} contract/compiler/provider checks; automatic shared-owner composition remains open.`);
  return result;
}
if (require.main === module) inspect({ write: process.argv.includes('--write'), check: process.argv.includes('--check') }).catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { inspect };
