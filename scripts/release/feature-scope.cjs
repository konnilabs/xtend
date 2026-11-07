'use strict';
const fs = require('node:fs');
const path = require('node:path');
const REQUIRED = ['rmtx', 'xtensions-2'];
const covered = version => /^0\.9\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u.test(version);

function evaluateFeatureScope(rootDir = path.resolve(__dirname, '../..'), options = {}) {
  const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json')));
  const plan = JSON.parse(fs.readFileSync(path.join(rootDir, 'scripts/release/feature-scope.json')));
  const errors = [], blockers = [];
  const version = options.version || manifest.version;
  if (plan.schema !== 'xtend.release.feature-scope.v1' || plan.targetVersion !== '0.9.0' || plan.releaseTrain !== '0.9' || !['preparing', 'ready'].includes(plan.state)) errors.push('Invalid 0.9 release feature scope.');
  const features = Array.isArray(plan.features) ? plan.features : [];
  if (features.length !== REQUIRED.length || REQUIRED.some(id => features.filter(feature => feature.id === id).length !== 1)) errors.push('Release 0.9 requires exactly RMTX and XTensions 2.0.');
  if (covered(manifest.version) && manifest.version !== plan.targetVersion) errors.push('Package version and release target differ.');
  for (const feature of features) {
    if (feature.required !== true || feature.targetVersion !== plan.targetVersion || !Array.isArray(feature.acceptance) || !feature.acceptance.length || feature.acceptance.some(item => typeof item !== 'string' || !item.trim())
      || !['preparing', 'implemented', 'ready'].includes(feature.status)) errors.push(`Invalid required feature: ${feature.id}.`);
    if (feature.status !== 'ready') { blockers.push(`${feature.name}: ${feature.status}; implementation and acceptance evidence pending.`); continue; }
    if (!feature.testProfile || !feature.executionEvidence) { blockers.push(`${feature.name}: a release test profile and bound execution evidence are required.`); continue; }
    try {
      const file = path.resolve(rootDir, feature.executionEvidence);
      if (!file.startsWith(path.resolve(rootDir) + path.sep)) throw new Error('Execution evidence must belong to this checkout.');
      const report = JSON.parse(fs.readFileSync(file));
      if (options.sourceSha && report.commit !== options.sourceSha) throw new Error('Execution source commit differs from release source.');
      const result = require('../test-runner/executor').verifyExecution({ verify: feature.testProfile, from: file, project: false });
      if (result.status !== 'passed') throw new Error('Feature execution failed provenance/profile verification.');
    } catch (error) { blockers.push(`${feature.name}: ${error.message}`); }
  }
  return { schema: 'xtend.release.feature-readiness.v1', targetVersion: plan.targetVersion, applicable: covered(version),
    state: plan.state, planValid: errors.length === 0, ready: errors.length === 0 && blockers.length === 0,
    errors, blockers, features: features.map(({ id, name, status, required, targetVersion }) => ({ id, name, status, required, targetVersion })) };
}
function assertReleaseFeaturePlan(rootDir, options = {}) {
  const version = options.version || JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'))).version;
  if (!covered(version)) return { applicable: false, ready: true, planValid: true, errors: [], blockers: [] };
  const report = evaluateFeatureScope(rootDir, options);
  if (!report.planValid) throw Object.assign(new Error(`Invalid release feature scope: ${report.errors.join(' ')}`),
    { code: 'xtend.release.feature_plan_invalid', report });
  return report;
}
function assertReleaseFeatureReadiness(rootDir, options = {}) {
  const report = assertReleaseFeaturePlan(rootDir, options);
  if (report.applicable && !report.ready) throw Object.assign(new Error(`Release 0.9 feature scope is not ready: ${report.errors.concat(report.blockers).join(' ')}`),
    { code: 'xtend.release.features_pending', report });
  return report;
}
if (require.main === module) {
  const report = evaluateFeatureScope();
  console.log(JSON.stringify(report, null, 2));
  if (!report.planValid || process.argv.includes('--check-ready') && !report.ready) process.exitCode = 1;
}
module.exports = { evaluateFeatureScope, assertReleaseFeaturePlan, assertReleaseFeatureReadiness };
