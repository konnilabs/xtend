'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { evaluateFeatureScope, assertReleaseFeaturePlan, assertReleaseFeatureReadiness } = require('../../scripts/release/feature-scope.cjs');
const root = path.resolve(__dirname, '../..');
test('0.9 plan includes both mandatory features and blocks preparation until they are ready', () => {
  const report = evaluateFeatureScope(root);
  assert(report.planValid); assert.equal(report.ready, false);
  assert.equal(assertReleaseFeaturePlan(root).ready, false, 'pending features permit technical CI candidate builds');
  assert.deepEqual(report.features.map(feature => feature.id), ['rmtx', 'xtensions-2']);
  assert.throws(() => assertReleaseFeatureReadiness(root), error => error.code === 'xtend.release.features_pending');
  assert.equal(assertReleaseFeatureReadiness(root, { version: '0.8.0' }).applicable, false);
});
test('a smaller scope or a ready flag without evidence cannot satisfy the release contract', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-feature-scope-'));
  try {
    fs.mkdirSync(path.join(temporary, 'scripts/release'), { recursive: true });
    fs.writeFileSync(path.join(temporary, 'package.json'), JSON.stringify({ version: '0.9.0' }));
    const plan = JSON.parse(fs.readFileSync(path.join(root, 'scripts/release/feature-scope.json')));
    const file = path.join(temporary, 'scripts/release/feature-scope.json');
    fs.writeFileSync(file, JSON.stringify({ ...plan, features: plan.features.slice(0, 1) }));
    assert.equal(evaluateFeatureScope(temporary).planValid, false);
    assert.throws(() => assertReleaseFeaturePlan(temporary), error => error.code === 'xtend.release.feature_plan_invalid');
    fs.writeFileSync(file, JSON.stringify({ ...plan, features: plan.features.map(feature => ({ ...feature, status: 'ready' })) }));
    assert.equal(evaluateFeatureScope(temporary).ready, false);
    assert.throws(() => assertReleaseFeatureReadiness(temporary), /evidence/);
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
});
test('0.9 cannot omit productive native catalog entries, tooling or the joint target acceptance', () => {
  const plan = JSON.parse(fs.readFileSync(path.join(root,'scripts/release/feature-scope.json')));
  assert.equal(plan.schema,'xtend.release.feature-scope.v2');
  assert.equal(plan.nativeCatalog.productiveEntries,46);assert.equal(plan.nativeCatalog.demoEntries,1);
  assert.deepEqual(plan.milestones.map(row=>row.id),['A06.5','A06.6']);
  const report=evaluateFeatureScope(root);
  assert.ok(report.blockers.some(row=>row.includes('complete native functional acceptance')));
  assert.ok(report.blockers.some(row=>row.startsWith('A06.5:')));
  assert.ok(report.blockers.some(row=>row.startsWith('A06.6:')));
});
