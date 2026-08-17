'use strict';

const path = require('path');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
const { readJson, readText, resolveRootDir } = require('../utils/files');

const SUITE_ID = 'primitive-adoption-gate';
const SUITE_LABEL = 'Native Primitive Adoption Gate';
const REPORT_SCHEMA = 'xtend.native-first.primitive-adoption-gate-report.v1';
const ADR_SCHEMA = 'xtend.native-first.primitive-adoption-adr.v1';
const OBSERVATORY_OUTCOMES = new Set(['adopt-native', 'wrap-as-xtend-primitive', 'defer-with-watch', 'reject-for-now']);
const ALLOWED_STATUSES = new Set(['draft', 'accepted', 'accepted-with-residuals', 'rejected', 'superseded']);
const ALLOWED_CATEGORIES = new Set(['dom', 'component', 'form', 'layout', 'navigation', 'animation', 'scheduling', 'lifecycle', 'observability', 'storage', 'security', 'network', 'media', 'accessibility', 'compute', 'other']);
const ALLOWED_SURFACES = new Set(['runtime', 'component', 'rmt', 'fabric', 'docs', 'tooling', 'security']);
const REQUIRED_EVIDENCE = Object.freeze(['browserSupport', 'performanceImpact', 'complexityImpact', 'a11yImpact', 'securityImpact', 'rmtImpact', 'contractParity', 'fallbackAndDegradation', 'migrationImpact']);
const REQUIRED_DECISIONS = Object.freeze([
  'ADR-NFM-OBS-OVERLAY-ANCHOR-2026-08-17',
  'ADR-NFM-OBS-SCHEDULER-YIELD-2026-08-17',
  'ADR-NFM-OBS-SCOPED-REGISTRIES-2026-08-17',
  'ADR-NFM-OBS-NAVIGATION-API-2026-08-17',
  'ADR-NFM-OBS-CROSS-DOCUMENT-VT-2026-08-17',
  'ADR-NFM-OBS-EXPLICIT-RESOURCE-MANAGEMENT-2026-08-17'
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function validateDecisionSet(decisionSet, radar, browserEvidence) {
  const errors = [];
  if (!decisionSet || decisionSet.schema !== 'xtend.native-first.observatory-adoption-decisions.v1') errors.push('invalid decision set schema');
  const reviewRefs = decisionSet && Array.isArray(decisionSet.reviewRefs) ? decisionSet.reviewRefs : [];
  if (reviewRefs.length === 0 || new Set(reviewRefs).size !== reviewRefs.length) errors.push('decision set review refs must be present and unique');
  const decisions = decisionSet && Array.isArray(decisionSet.decisions) ? decisionSet.decisions : [];
  const ids = decisions.map((decision) => decision.decisionId);
  if (new Set(ids).size !== ids.length) errors.push('decision IDs must be unique');
  decisions.forEach((decision) => {
    const label = decision.decisionId || 'unknown';
    if (decision.schema !== ADR_SCHEMA) errors.push(`${label}: invalid ADR schema`);
    if (!ALLOWED_STATUSES.has(decision.status)) errors.push(`${label}: invalid status`);
    if (!decision.decisionId || !decision.primitiveName || !decision.owner || !decision.reviewDate) errors.push(`${label}: missing identity, owner or review date`);
    if (!decision.reviewRef || !reviewRefs.includes(decision.reviewRef)) errors.push(`${label}: missing or unknown review ref`);
    if (!OBSERVATORY_OUTCOMES.has(decision.decisionOutcome)) errors.push(`${label}: invalid Observatory prototype outcome`);
    const categories = Array.isArray(decision.primitiveCategory) ? decision.primitiveCategory : [decision.primitiveCategory];
    if (categories.length === 0 || categories.some((category) => !ALLOWED_CATEGORIES.has(category))) errors.push(`${label}: invalid primitive category`);
    const surfaces = Array.isArray(decision.targetSurface) ? decision.targetSurface : [decision.targetSurface];
    if (surfaces.length === 0 || surfaces.some((surface) => !ALLOWED_SURFACES.has(surface))) errors.push(`${label}: invalid target surface`);
    if (!Array.isArray(decision.primitiveRadarRef) || decision.primitiveRadarRef.length === 0) errors.push(`${label}: missing radar refs`);
    (decision.primitiveRadarRef || []).forEach((radarRef) => {
      if (!radar.includes(`\`${radarRef}\``)) errors.push(`${label}: unknown radar ref ${radarRef}`);
    });
    if (!decision.evidence || REQUIRED_EVIDENCE.some((key) => typeof decision.evidence[key] !== 'string' || decision.evidence[key].length === 0)) errors.push(`${label}: incomplete evidence matrix`);
    ['fallbackPolicy', 'contractParity', 'securityReview', 'rmtBoundary', 'prototypeStatus'].forEach((key) => {
      if (typeof decision[key] !== 'string' || decision[key].length === 0) errors.push(`${label}: missing ${key}`);
    });
    if (decision.rmtBoundary !== 'rmt-kernel-remains-host-neutral') errors.push(`${label}: RMT kernel boundary is not neutral`);
    if (!Array.isArray(decision.runtimeDependencies) || decision.runtimeDependencies.length !== 0) errors.push(`${label}: runtime dependencies are not permitted`);
    if (['adopt-native', 'wrap-as-xtend-primitive'].includes(decision.decisionOutcome)) {
      const insufficient = (browserEvidence.engines || []).some((entry) => entry.status === 'insufficient-evidence');
      if (insufficient) errors.push(`${label}: productive adoption is blocked by insufficient engine evidence`);
    }
  });
  return errors;
}

function assertRejected(context, label, mutate, base) {
  const candidate = clone(base.decisionSet);
  mutate(candidate);
  context.assert(validateDecisionSet(candidate, base.radar, base.browserEvidence).length > 0, `Gate rejects ${label}`);
}

function runPrimitiveAdoptionGateSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({ id: SUITE_ID, label: SUITE_LABEL });
  const decisionSet = readJson('development/observatory/observatory-adoption-decisions.json', rootDir);
  const browserEvidence = readJson('tests/fixtures/native-first/observatory-adoption-lab-fixtures.json', rootDir);
  const ermBrowserEvidence = readJson('tests/fixtures/native-first/observatory-erm-browser-evidence-chromium-151.json', rootDir);
  const adr = readText('development/ADR-XTend-Observatory-Adoption-2026-08-17.md', rootDir);
  const adoptionContract = readText('development/XTend-Native-Primitive-Adoption-Gate-Contract.md', rootDir);
  const observatoryContract = readText('development/XTend-Native-First-Feature-Adoption-Observatory-Contract.md', rootDir);
  const radar = readText('development/XTend-Native-First-Browser-Primitive-Radar.md', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);

  const errors = validateDecisionSet(decisionSet, radar, browserEvidence);
  errors.forEach((error) => context.fail(error));
  if (errors.length === 0) context.pass('All Observatory adoption decisions satisfy the gate');
  context.assert(decisionSet.decisions.length === REQUIRED_DECISIONS.length, 'Every implemented prototype path has exactly one decision');
  REQUIRED_DECISIONS.forEach((decisionId) => {
    context.assert(decisionSet.decisions.filter((decision) => decision.decisionId === decisionId).length === 1, `${decisionId} occurs exactly once`);
    context.assertIncludes(adr, `\`${decisionId}\``, `ADR documents ${decisionId}`);
  });
  context.assert(decisionSet.decisions.every((decision) => decision.decisionOutcome === 'defer-with-watch'), 'Insufficient browser evidence keeps all current labs deferred');
  context.assert((browserEvidence.engines || []).filter((engine) => engine.status === 'insufficient-evidence').length === 2, 'Firefox and WebKit remain explicitly insufficient and block adoption');
  const ermDecision = decisionSet.decisions.find((decision) => decision.decisionId === 'ADR-NFM-OBS-EXPLICIT-RESOURCE-MANAGEMENT-2026-08-17');
  context.assert(ermDecision.browserEvidenceArtifacts.includes('tests/fixtures/native-first/observatory-erm-browser-evidence-chromium-151.json'), 'ERM ADR references its engine-specific browser evidence');
  context.assert(ermBrowserEvidence.engines.filter((engine) => engine.status === 'insufficient-evidence').length === 2 && ermBrowserEvidence.adoptionBlocked, 'ERM ADR remains blocked by missing Firefox and WebKit artifacts');
  context.assertIncludes(adoptionContract, '`compute`', 'Adoption contract accepts compute category');
  context.assertIncludes(adoptionContract, '`lifecycle`', 'Adoption contract accepts lifecycle category');
  context.assert(decisionSet.reviewRefs.length === 2 && decisionSet.decisions.every((decision) => decisionSet.reviewRefs.includes(decision.reviewRef)), 'Each adoption decision is bound to one of the two reviewed runs');
  context.assertIncludes(observatoryContract, '`adopt-native`, `wrap-as-xtend-primitive`, `defer-with-watch` oder `reject-for-now`', 'Observatory contract limits post-prototype outcomes');
  context.assertIncludes(runner, "id: 'primitive-adoption-gate'", 'Runner registers primitive adoption gate');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:primitive-adoption-gate'] === 'node scripts/run_xtend_tests.js primitive-adoption-gate', 'Package exposes primitive adoption gate');
  context.assert(!Object.keys(packageManifest.exports || {}).some((key) => key.includes('observatory') || key.includes('adoption-lab')), 'Labs are not exposed as public package APIs');

  const base = { decisionSet, radar, browserEvidence };
  assertRejected(context, 'missing ADR fields', (candidate) => { delete candidate.decisions[0].owner; }, base);
  assertRejected(context, 'missing per-decision review ref', (candidate) => { delete candidate.decisions[0].reviewRef; }, base);
  assertRejected(context, 'invalid outcomes', (candidate) => { candidate.decisions[0].decisionOutcome = 'prototype-now'; }, base);
  assertRejected(context, 'missing radar IDs', (candidate) => { candidate.decisions[0].primitiveRadarRef = ['NFM-BPR-999']; }, base);
  assertRejected(context, 'incomplete evidence', (candidate) => { delete candidate.decisions[0].evidence.securityImpact; }, base);
  assertRejected(context, 'runtime dependencies', (candidate) => { candidate.decisions[0].runtimeDependencies = ['imaginary-polyfill']; }, base);
  assertRejected(context, 'adoption with insufficient engine evidence', (candidate) => { candidate.decisions[0].decisionOutcome = 'adopt-native'; }, base);

  return context.result({
    report: {
      schema: REPORT_SCHEMA,
      decisions: decisionSet.decisions.length,
      outcomes: { 'defer-with-watch': decisionSet.decisions.length },
      insufficientEngines: browserEvidence.engines.filter((entry) => entry.status === 'insufficient-evidence').map((entry) => entry.engine),
      noRuntimeDependencies: true,
      noPublicExports: true
    }
  });
}

function printPrimitiveAdoptionGateReport(result) {
  printSuiteReport(result, {
    successTitle: 'Native Primitive Adoption Gate erfolgreich.',
    failureTitle: 'Native Primitive Adoption Gate fehlgeschlagen:'
  });
}

module.exports = {
  printPrimitiveAdoptionGateReport,
  runPrimitiveAdoptionGateSuite,
  validateDecisionSet
};
