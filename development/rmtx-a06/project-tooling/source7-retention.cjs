'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const root = path.resolve(__dirname, '../../..');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const REPORT_SCHEMA = 'xtend.rmtx.project-source7-retention.v1';
const ceilings = Object.freeze({ frameworkBytes: 2200000, componentRuntimeBytes: 280000, nativeViewRuntimeBytes: 240000 });

// Reviewed capability fields from the immutable incoming commit. Actual module
// fingerprints are separately captured, not replaced with these historic ones.
const catalog1Baseline = Object.freeze({
  head: '6a123f9657b533554a455a8ee44d853b6b77bf6d',
  path: 'tools/xtensions/native-component-catalog.js',
  sha256: '5a9ec040fe98e17fc75fdd9081976f2f8b7ff7c825e8318dbb67c52d995e6936',
  fields: Object.freeze(['tag', 'module', 'ownership', 'attributes', 'properties', 'slots']),
  components: [
    { tag: 'x-button', module: 'components/xbutton.js', ownership: 'shadow', attributes: ['disabled', 'label', 'text'], properties: ['title'], slots: ['default'] },
    { tag: 'x-header', module: 'components/xheader.js', ownership: 'shadow', attributes: ['title'], properties: ['title'], slots: ['actions', 'logo', 'nav', 'search', 'title', 'utility'] }
  ]
});

function sourceFiles() {
  return [...new Set([
    ...require('../native-component-catalog/source-files.cjs').sourceFiles(),
    ...require('../native-orchestration-profile/inspect.cjs').sourceFiles,
    'development/rmtx-a06/project-tooling/source7-retention.cjs'
  ])].sort();
}

function sourceHashes() {
  return Object.fromEntries(sourceFiles().map(file => [file, hash(fs.readFileSync(path.join(root, file)))]));
}

function captureDelivery(build, buildDir) {
  assert.equal(build.ok, true);
  assert.equal(build.plan.schema, 'xtend.maraca.build-plan.v11');
  assert.equal(build.sizeBudgetReport.ok, true, JSON.stringify(build.sizeBudgetReport));
  const files = build.bundleReport.bundleFiles.map(file => {
    assert.equal(typeof file.fileName, 'string');
    const absolute = path.resolve(buildDir, file.fileName), relative = path.relative(buildDir, absolute);
    assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative), 'Bundle file must belong to its actual build directory.');
    const bytes = fs.readFileSync(absolute);
    assert.equal(file.bytes, bytes.length, file.fileName);
    return { fileName: file.fileName, bytes: bytes.length, sha256: hash(bytes) };
  });
  assert.equal(new Set(files.map(file => file.fileName)).size, files.length, 'Actual delivery files must be distinct.');
  const nativeView = files.find(file => file.fileName === 'runtime/xtend-maraca-native-view.mjs');
  assert.ok(nativeView, 'Actual NativePort3 output must be included in the delivery.');
  const frameworkBytes = build.sizeBudgetReport.framework.bytes;
  const componentRuntimeBytes = build.sizeBudgetReport.xtensions.runtimeBytes;
  assert.ok(Number.isSafeInteger(frameworkBytes) && frameworkBytes >= 0);
  assert.ok(Number.isSafeInteger(componentRuntimeBytes) && componentRuntimeBytes >= 0);
  assert.ok(frameworkBytes <= ceilings.frameworkBytes, 'Source7 framework exceeds the unchanged comparison ceiling.');
  assert.ok(componentRuntimeBytes <= ceilings.componentRuntimeBytes, 'Source7 component runtime exceeds the unchanged comparison ceiling.');
  assert.ok(nativeView.bytes <= ceilings.nativeViewRuntimeBytes, 'Source7 NativePort3 exceeds the unchanged runtime comparison ceiling.');
  return {
    files, totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
    frameworkBytes, componentRuntimeBytes, nativeViewRuntimeBytes: nativeView.bytes,
    ceilings, budgets: build.sizeBudgetReport.budgets, xtensions: build.sizeBudgetReport.xtensions,
    scope: 'Actual regular Source7 mixed Native/React/Vue build and its unchanged accounting membership.',
    comparisonLimitsAreHistoricalSource7Promise: false,
    legacyDeliveryAcceptancePerformed: false
  };
}

function verifyCatalog1() {
  const { NATIVE_COMPONENT_CATALOG } = require('../../../tools/xtensions/native-component-catalog');
  for (const component of NATIVE_COMPONENT_CATALOG) {
    assert.deepEqual(Object.keys(component).sort(), [...catalog1Baseline.fields, 'sha256'].sort(), 'Source7 metadata must not acquire an unreviewed field.');
    assert.match(component.sha256, /^[a-f0-9]{64}$/u, 'Actual component fingerprints remain explicit.');
  }
  const fields = NATIVE_COMPONENT_CATALOG.map(component => Object.fromEntries(catalog1Baseline.fields.map(name => [name, component[name]])));
  assert.deepEqual(fields, catalog1Baseline.components, 'The exact reviewed Source7 capability subset must remain unchanged.');
  return { ...catalog1Baseline, currentSourceSha256: hash(fs.readFileSync(path.join(root, catalog1Baseline.path))), capabilityFieldsUnchanged: true };
}

function verifySource8Rejected() {
  const reference = require('../native-component-catalog/reference.cjs');
  const compiled = reference.compiler().compileSource({
    text: fs.readFileSync(path.join(root, reference.source), 'utf8'), filePath: reference.source
  }, { componentInterfaceCatalog: reference.catalog() });
  assert.equal(compiled.ok, true, JSON.stringify(compiled.diagnostics));
  const program = compiled.orchestrationArtifacts;
  assert.equal(program.schema, 'xtend.rmt.app-orchestration.v6');
  assert.equal(program.render.nativeView.schema, 'xtend.rmt.native-view.v3');
  assert.equal(program.lifecycle.schema, 'xtend.rmt.native-lifecycle-plan.v3');
  require('../../../tools/xtensions/native-managed-view-projection').NATIVE_MANAGED_VIEW_RUNTIME.validateNativeViewProgram(program);
  require('../../../tools/xtensions/native-managed-orchestration-lifecycle').validateNativeOrchestrationLifecyclePlan(program);
  const native = require('../../../tools/xtensions/native-surface-projection').NATIVE_ORCHESTRATION_VIEW_RUNTIME;
  const lifecycle = require('../../../tools/xtensions/native-orchestration-lifecycle');
  assert.equal(typeof native.validateNativeViewProgram, 'function');
  assert.equal(typeof lifecycle.validateNativeOrchestrationLifecyclePlan, 'function');
  assert.throws(() => native.validateNativeViewProgram(program), TypeError, 'Source7 NativePort3 must reject genuine Program6/Header3.');
  assert.throws(() => lifecycle.validateNativeOrchestrationLifecyclePlan(program), TypeError, 'Source7 LifecyclePlan2 must reject genuine Source8 lifecycle3.');
  return { passed: true, checks: 2, names: ['Source7 NativePort3 rejects genuine Source8 Program6/Header3', 'Source7 lifecycle2 rejects genuine Source8 lifecycle3'] };
}

async function run({ output, retainBuild } = {}) {
  assert.ok(!process.argv.includes('--output'), 'Use --report for the retention report; --output belongs to the unchanged raw runner.');
  const sources = sourceHashes(), catalog = verifyCatalog1();
  let delivery, buildsObserved = 0;
  // The existing runner owns the build, DOM/browser, sealed deployment, actual
  // React/Vue providers and runtime cases. It is invoked exactly once.
  const runtime = await require('../native-orchestration-profile/runtime-test.cjs').run({
    async buildObserver({ build, buildDir }) {
      assert.equal(++buildsObserved, 1, 'The retention witness must observe exactly one actual productive build.');
      delivery = captureDelivery(build, buildDir);
      if (retainBuild) {
        const target = path.resolve(retainBuild);
        assert.ok(!fs.existsSync(target), 'A retained build must use a new output path.');
        fs.cpSync(buildDir, target, { recursive: true, errorOnExist: true });
      }
    }
  });
  assert.equal(buildsObserved, 1);
  assert.ok(delivery, 'The actual productive build must have been measured.');
  assert.equal(runtime.passed, true);
  assert.equal(runtime.cases, 10, 'Every retained Source7 runtime case must execute.');
  assert.equal(runtime.compileChecks.passed, true);
  assert.equal(runtime.compileChecks.checks, 10);
  assert.deepEqual(runtime.pageErrors, []);
  const source8Rejections = verifySource8Rejected();
  assert.deepEqual(sourceHashes(), sources, 'Captured Source7 retention inputs changed during execution.');
  const report = {
    schema: REPORT_SCHEMA, format: 1, stage: 'A06.5-project-tooling-source7-retention',
    node: process.version, mode: runtime.mode, browserVersion: runtime.browserVersion, passed: true,
    runtimeCases: runtime.cases, compilerNegativeCases: runtime.compileChecks.checks,
    source8ProfileNegatives: source8Rejections.checks, source8Rejections,
    catalog1FieldsUnchanged: true, catalog1Baseline: catalog,
    harness: { file: 'development/rmtx-a06/project-tooling/source7-retention.cjs', sha256: sources['development/rmtx-a06/project-tooling/source7-retention.cjs'] },
    observedProductiveBuilds: buildsObserved, sources, actualSourceFilesUnchanged: true,
    delivery, runtime, acceptedForRelease: false, ssrAcceptancePerformed: false,
    projectFixtureExecutionPerformed: false
  };
  if (output) {
    const target = path.resolve(output);
    assert.ok(!fs.existsSync(target), 'Do not overwrite an earlier execution report.');
    fs.writeFileSync(target, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  }
  console.log(JSON.stringify(report));
  return report;
}

if (require.main === module) {
  const option = name => { const index = process.argv.indexOf(name); return index < 0 ? undefined : process.argv[index + 1]; };
  run({ output: option('--report'), retainBuild: option('--retain-build') }).catch(error => { console.error(error); process.exitCode = 1; });
}
module.exports = { REPORT_SCHEMA, run, sourceFiles };
