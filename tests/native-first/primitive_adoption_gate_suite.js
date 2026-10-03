'use strict';

const fs = require('fs');
const path = require('path');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
const { readJson, readText, resolveRepoPath, resolveRootDir } = require('../utils/files');
const { mergeEvidence, validateEvidence } = require('../../tools/browser-hypervisor');

const SUITE_ID = 'primitive-adoption-gate';
const SUITE_LABEL = 'Native Primitive Adoption Gate';
const REPORT_SCHEMA = 'xtend.native-first.primitive-adoption-gate-report.v2';
const DECISION_SCHEMA = 'xtend.native-first.observatory-adoption-decisions.v2';
const TERMINAL_OUTCOMES = new Set(['adopt-native', 'wrap-as-xtend-primitive', 'reject-for-now']);
const TERMINAL_PARENT_STATUSES = new Set(['accepted-existing', 'resolved', 'closed']);
const FORBIDDEN_ACTIVE_STATES = new Set(['watch', 'defer-with-watch', 'needs-browser-lab', 'insufficient-evidence']);
const REJECTED_PRODUCT_TOKENS = Object.freeze([
  'scheduler.yield',
  'new URLPattern',
  'window.navigation',
  'navigation.addEventListener',
  'indexedDB.',
  'navigator.mediaSession',
  'new BroadcastChannel',
  'new CustomElementRegistry',
  'new DisposableStack',
  'Symbol.dispose',
  'shadowrootslotassignment',
  'WebAssembly.Suspending',
  'new Sanitizer',
  'startViewTransition',
  "duplex: 'half'",
  'duplex: "half"'
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function listProductJavaScript(rootDir) {
  const roots = ['components', 'xtendrmt', 'xtend-fabric', 'xtend-core', 'xtend-maraca'];
  const files = [];
  function visit(directory) {
    if (!fs.existsSync(directory)) return;
    fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(target);
      else if (/\.(?:js|mjs|cjs)$/u.test(entry.name)) files.push(target);
    });
  }
  roots.forEach((root) => visit(path.join(rootDir, root)));
  return files;
}

function validateDecisionSet(decisionSet, radarMatrix, browserEvidence, options = {}) {
  const errors = [];
  if (!decisionSet || decisionSet.schema !== DECISION_SCHEMA) errors.push('invalid decision set schema');
  if (!radarMatrix || radarMatrix.schema !== 'xtend.native-first.browser-primitive-radar.v2') errors.push('invalid Radar v2 schema');
  const entries = radarMatrix && Array.isArray(radarMatrix.entries) ? radarMatrix.entries : [];
  const decisions = decisionSet && Array.isArray(decisionSet.decisions) ? decisionSet.decisions : [];
  const expectedIds = Array.from({ length: 24 }, (_, index) => `NFM-BPR-${String(index + 1).padStart(3, '0')}`);
  if (entries.length !== 24 || entries.map((entry) => entry.id).join('|') !== expectedIds.join('|')) errors.push('Radar must contain exactly the 24 stable parent IDs');
  if (decisions.length !== 24 || decisionSet.decisionCount !== 24) errors.push('decision set must contain exactly 24 decisions');
  if (new Set(decisions.map((decision) => decision.decisionId)).size !== decisions.length) errors.push('decision IDs must be unique');
  if (new Set(decisions.map((decision) => decision.radarRef)).size !== decisions.length) errors.push('each Radar parent must have exactly one decision');
  if (decisionSet.runId !== 'NFM-OBS-2026-09-03' || decisionSet.reviewRef !== 'NFM-OBS-REVIEW-2026-09-03') errors.push('decision set is not bound to the September run');
  if (!Array.isArray(decisionSet.supersedes) || decisionSet.supersedes.length !== 6) errors.push('six historical Observatory decisions must be superseded');
  if (!Array.isArray(decisionSet.runtimeDependencies) || decisionSet.runtimeDependencies.length !== 0) errors.push('runtime dependencies are not permitted');
  if (decisionSet.publicExportsAdded !== false) errors.push('public exports must remain unchanged');
  if (decisionSet.rmtBoundary !== 'rmt-kernel-remains-host-neutral') errors.push('RMT kernel boundary must remain host-neutral');

  const decisionsByRadar = new Map(decisions.map((decision) => [decision.radarRef, decision]));
  entries.forEach((entry) => {
    const decision = decisionsByRadar.get(entry.id);
    if (!TERMINAL_PARENT_STATUSES.has(entry.status)) errors.push(`${entry.id}: parent status is not terminal`);
    if (FORBIDDEN_ACTIVE_STATES.has(entry.status) || FORBIDDEN_ACTIVE_STATES.has(entry.decisionOutcome) || FORBIDDEN_ACTIVE_STATES.has(entry.evidenceStatus)) errors.push(`${entry.id}: active residual state is forbidden`);
    if (!Array.isArray(entry.members) || entry.members.length === 0 || entry.members.some((member) => !TERMINAL_OUTCOMES.has(member.outcome))) errors.push(`${entry.id}: member outcome is not terminal`);
    if (!decision) {
      errors.push(`${entry.id}: missing decision`);
      return;
    }
    const expectedDecisionId = `ADR-${entry.id}-2026-09-03`;
    if (decision.decisionId !== expectedDecisionId) errors.push(`${entry.id}: incorrect September ADR ID`);
    if (!['accepted', 'rejected'].includes(decision.status)) errors.push(`${entry.id}: decision status is not terminal`);
    if (![...TERMINAL_OUTCOMES, 'resolved'].includes(decision.decisionOutcome)) errors.push(`${entry.id}: decision outcome is invalid`);
    if (JSON.stringify(decision.members) !== JSON.stringify(entry.members.map(({ id, outcome }) => ({ id, outcome })))) errors.push(`${entry.id}: ADR members do not match Radar members`);
    const rejected = entry.members.filter((member) => member.outcome === 'reject-for-now');
    const accepted = entry.members.filter((member) => member.outcome !== 'reject-for-now');
    rejected.forEach((member) => {
      if (!member.checks.includes('negative-product-usage') || !member.checks.includes('owned-path-regression')) errors.push(`${entry.id}/${member.id}: rejected member lacks negative usage or regression evidence`);
    });
    accepted.forEach((member) => {
      ['capability-present', 'capability-absent-fallback', 'product-regression'].forEach((check) => {
        if (!member.checks.includes(check)) errors.push(`${entry.id}/${member.id}: accepted member lacks ${check}`);
      });
    });
    if (entry.followUp !== 'none') errors.push(`${entry.id}: terminal parent still has a follow-up`);
    if (entry.status === 'closed' && entry.nextReview !== 'none') errors.push(`${entry.id}: closed parent still has a next review`);
    if (entry.status !== 'closed' && entry.nextReview !== '2026-12-03') errors.push(`${entry.id}: accepted parent has a stale hygiene review`);
  });

  const engineItems = browserEvidence && Array.isArray(browserEvidence.engines) ? browserEvidence.engines : [];
  engineItems.forEach((entry) => validateEvidence(entry, { runId: 'NFM-OBS-2026-09-03', harnessSha256: browserEvidence.harnessSha256 }).forEach((error) => errors.push(`${entry.engine}: ${error}`)));
  const merged = mergeEvidence(engineItems, { runId: 'NFM-OBS-2026-09-03', harnessSha256: browserEvidence && browserEvidence.harnessSha256 });
  if (merged.status !== 'passed' || !merged.noInfrastructureResiduals) errors.push(...merged.errors);
  if (engineItems.some((entry) => FORBIDDEN_ACTIVE_STATES.has(entry.status))) errors.push('browser matrix contains an active residual state');

  if (options.productSources) {
    REJECTED_PRODUCT_TOKENS.forEach((token) => {
      if (options.productSources.includes(token)) errors.push(`rejected member is used by product source: ${token}`);
    });
  }
  return errors;
}

function assertRejected(context, label, mutate, base) {
  const candidate = clone(base.decisionSet);
  const matrix = clone(base.radarMatrix);
  const evidence = clone(base.browserEvidence);
  mutate({ decisionSet: candidate, radarMatrix: matrix, browserEvidence: evidence });
  context.assert(validateDecisionSet(candidate, matrix, evidence).length > 0, `Gate rejects ${label}`);
}

function runPrimitiveAdoptionGateSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({ id: SUITE_ID, label: SUITE_LABEL });
  const decisionSet = readJson('development/observatory/observatory-adoption-decisions-2026-09-03.json', rootDir);
  const historicalDecisionSet = readJson('development/observatory/observatory-adoption-decisions.json', rootDir);
  const radarMatrix = readJson('tests/fixtures/native-first/browser-primitive-radar-v2.json', rootDir);
  const generatedEvidencePath = process.env.XTEND_BROWSER_HYPERVISOR_MATRIX
    || '.xtend-test-results/browser-hypervisor/matrix.json';
  const resolvedGeneratedEvidencePath = resolveRepoPath(generatedEvidencePath, rootDir);
  const usesGeneratedEvidence = fs.existsSync(resolvedGeneratedEvidencePath);
  const browserEvidence = usesGeneratedEvidence
    ? JSON.parse(fs.readFileSync(resolvedGeneratedEvidencePath, 'utf8'))
    : readJson('tests/fixtures/native-first/observatory-browser-evidence-2026-09-03.json', rootDir);
  const oldAdr = readText('development/ADR-XTend-Observatory-Adoption-2026-08-17.md', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const productSources = listProductJavaScript(rootDir).map((file) => fs.readFileSync(file, 'utf8')).join('\n');
  const errors = validateDecisionSet(decisionSet, radarMatrix, browserEvidence, { productSources });
  errors.forEach((error) => context.fail(error));
  if (errors.length === 0) context.pass('All 24 Radar parents and 49 members have terminal September decisions');

  decisionSet.decisions.forEach((decision) => {
    const adrPath = `development/observatory/adrs/${decision.decisionId}.md`;
    const adr = readText(adrPath, rootDir);
    context.assertIncludes(adr, decision.decisionId, `${decision.decisionId} has one materialized ADR`);
  });
  context.assert(historicalDecisionSet.decisions.length === 6 && historicalDecisionSet.decisions.every((decision) => decision.decisionOutcome === 'defer-with-watch'), 'Six August lab decisions remain preserved as historical input');
  context.assertIncludes(oldAdr, 'Status: `superseded`', 'Historical August ADR is superseded');
  context.assert(browserEvidence.engines.length === 3 && browserEvidence.engines.every((entry) => ['passed', 'unsupported-with-valid-fallback'].includes(entry.status)), 'Chromium, Firefox and WebKit have terminal native-or-fallback evidence');
  context.assert(usesGeneratedEvidence || browserEvidence.evidenceKind === 'acceptance-contract-fixture', 'Local fallback evidence is explicitly a contract fixture, never a captured browser artifact');
  context.assert(!browserEvidence.summary || browserEvidence.summary.resolved === 24 && Object.entries(browserEvidence.summary).filter(([key]) => key !== 'resolved').every(([, value]) => value === 0), 'Combined evidence summary has no open ends, failures or warnings');
  context.assert(packageManifest.xtend.nativeFirstFeatureAdoptionObservatory.decisions === 'development/observatory/observatory-adoption-decisions-2026-09-03.json', 'Package metadata points at the September decision set');
  context.assert(!Object.keys(packageManifest.exports || {}).some((key) => key.includes('observatory') || key.includes('adoption-lab')), 'Labs are not public package APIs');

  const base = { decisionSet, radarMatrix, browserEvidence };
  assertRejected(context, 'a missing decision', ({ decisionSet: candidate }) => { candidate.decisions.pop(); }, base);
  assertRejected(context, 'an unknown Radar ID', ({ decisionSet: candidate }) => { candidate.decisions[0].radarRef = 'NFM-BPR-999'; }, base);
  assertRejected(context, 'an unresolved member', ({ radarMatrix: candidate }) => { candidate.entries[0].members[0].outcome = 'defer-with-watch'; }, base);
  assertRejected(context, 'a missing fallback check', ({ radarMatrix: candidate }) => { candidate.entries[0].members[0].checks = ['capability-present', 'product-regression']; }, base);
  assertRejected(context, 'a rejected member without negative usage evidence', ({ radarMatrix: candidate }) => { candidate.entries[5].members[0].checks = ['owned-path-regression']; }, base);
  assertRejected(context, 'a missing engine', ({ browserEvidence: candidate }) => { candidate.engines.pop(); }, base);
  assertRejected(context, 'a mismatched harness SHA', ({ browserEvidence: candidate }) => { candidate.engines[1].harnessSha256 = '0'.repeat(64); }, base);
  assertRejected(context, 'runtime dependencies', ({ decisionSet: candidate }) => { candidate.runtimeDependencies = ['imaginary-polyfill']; }, base);

  return context.result({ report: {
    schema: REPORT_SCHEMA,
    resolved: 24,
    members: radarMatrix.entries.reduce((sum, entry) => sum + entry.members.length, 0),
    watch: 0,
    deferred: 0,
    insufficientEvidence: 0,
    unownedResiduals: 0,
    failures: 0,
    warnings: 0,
    engines: browserEvidence.engines.map((entry) => entry.engine),
    evidenceMode: usesGeneratedEvidence ? 'captured-matrix' : 'acceptance-contract-fixture',
    noRuntimeDependencies: true,
    noPublicExports: true,
    rmtKernelHostNeutral: true
  } });
}

function printPrimitiveAdoptionGateReport(result) {
  printSuiteReport(result, {
    successTitle: 'Native Primitive Adoption Gate erfolgreich.',
    failureTitle: 'Native Primitive Adoption Gate fehlgeschlagen:'
  });
}

module.exports = { printPrimitiveAdoptionGateReport, runPrimitiveAdoptionGateSuite, validateDecisionSet };
