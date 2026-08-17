'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
const { readJson, readText, resolveRepoPath, resolveRootDir } = require('../utils/files');

const SUITE_ID = 'browser-primitive-radar';
const SUITE_LABEL = 'Browser Primitive Radar and Observatory Intake';
const REPORT_SCHEMA = 'xtend.native-first.browser-primitive-radar-report.v1';
const INTAKE_SCHEMA = 'xtend.native-first.observatory-intake.v1';
const REVIEW_SCHEMA = 'xtend.native-first.observatory-review.v1';
const RUN_INDEX_SCHEMA = 'xtend.native-first.observatory-run-index.v1';
const RUN_INDEX_PATH = 'development/observatory/observatory-run-index.json';
const ALLOWED_OUTCOMES = new Set(['corroborates-existing', 'corrected-candidate', 'new-radar-candidate', 'investigation-only', 'rejected']);
const ALLOWED_SOURCE_KINDS = new Set([
  'compat-docs',
  'engine-docs',
  'engine-issue',
  'engine-release',
  'standards-program',
  'standards-recommendation',
  'standards-spec',
  'technology-preview'
]);
const SHIPPING_SOURCE_KINDS = new Set(['engine-release', 'engine-docs']);
const PREVIEW_SOURCE_KINDS = new Set(['engine-release', 'engine-docs', 'technology-preview']);
const DEVELOPMENT_SOURCE_KINDS = new Set(['engine-issue', 'engine-docs']);
const STANDARD_SOURCE_KINDS = new Set(['standards-recommendation', 'standards-spec']);
const ALLOWED_EVIDENCE_STATUSES = new Set([
  'baseline',
  'behind-flag',
  'beta',
  'in-development',
  'insufficient-evidence',
  'investigation',
  'shipping',
  'technology-preview'
]);
const ALLOWED_HOSTS = new Set([
  'bugzilla.mozilla.org',
  'developer.chrome.com',
  'developer.mozilla.org',
  'github.com',
  'hacks.mozilla.org',
  'tc39.es',
  'v8.dev',
  'webkit.org',
  'www.w3.org'
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/u.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function sourceUrlError(value) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:') return 'source URL must use HTTPS';
    if (parsed.username || parsed.password) return 'source URL must not contain credentials';
    if (!ALLOWED_HOSTS.has(parsed.hostname)) return `source host is not allowlisted: ${parsed.hostname}`;
    return null;
  } catch (error) {
    return 'source URL is invalid';
  }
}

function topLevelDiffKeys(previousFinding, currentFinding) {
  const keys = new Set([
    ...Object.keys(previousFinding || {}),
    ...Object.keys(currentFinding || {})
  ]);
  return Array.from(keys)
    .filter((key) => JSON.stringify(previousFinding && previousFinding[key]) !== JSON.stringify(currentFinding && currentFinding[key]))
    .sort();
}

function validateObservatoryDocuments(options) {
  const {
    rootDir,
    raw,
    intake,
    review,
    radar,
    previousRun = null
  } = options;
  const errors = [];
  if (!intake || intake.schema !== INTAKE_SCHEMA) errors.push('invalid intake schema');
  if (!review || review.schema !== REVIEW_SCHEMA) errors.push('invalid review schema');
  if (!intake || review && review.intakeRef !== intake.intakeId) errors.push('review must reference its intake');
  const findings = raw && Array.isArray(raw.findings) ? raw.findings : [];
  const records = review && Array.isArray(review.records) ? review.records : [];
  const findingIds = findings.map((finding) => finding.id);
  const recordIds = records.map((record) => record.findingId);
  const previousFindings = new Map(
    previousRun && previousRun.raw && Array.isArray(previousRun.raw.findings)
      ? previousRun.raw.findings.map((finding) => [finding.id, finding])
      : []
  );
  if (findings.length === 0) errors.push('raw intake has no findings');
  if (new Set(findingIds).size !== findingIds.length) errors.push('raw finding IDs must be unique');
  if (new Set(recordIds).size !== recordIds.length) errors.push('review finding IDs must be unique');
  if (!intake || !Array.isArray(intake.findingIds) || intake.findingIds.join('|') !== findingIds.join('|')) errors.push('intake finding IDs must exactly match raw order');
  if (recordIds.length !== findingIds.length || findingIds.some((id) => recordIds.filter((recordId) => recordId === id).length !== 1)) errors.push('each finding must have exactly one review record');
  if (!review || !isDate(review.reviewedAt)) errors.push('review date must be a valid ISO date');

  findings.forEach((finding) => {
    if (!finding || typeof finding.id !== 'string' || finding.id.length === 0) errors.push('finding has no stable ID');
    if (!isDate(finding.firstSeen) || !isDate(finding.lastUpdated) || finding.firstSeen > finding.lastUpdated) errors.push(`finding ${finding.id || 'unknown'} has contradictory dates`);
    [finding.sourceUrl, ...(Array.isArray(finding.events) ? finding.events.map((event) => event.sourceUrl) : [])].filter(Boolean).forEach((url) => {
      const error = sourceUrlError(url);
      if (error) errors.push(`finding ${finding.id}: ${error}`);
    });
  });

  records.forEach((record) => {
    const label = record.findingId || 'unknown';
    if (!ALLOWED_OUTCOMES.has(record.outcome)) errors.push(`review ${label} has invalid outcome`);
    if (!Array.isArray(record.facts) || record.facts.length === 0) errors.push(`review ${label} has no reviewed facts`);
    if (!Array.isArray(record.xtendHypotheses)) errors.push(`review ${label} does not separate XTend hypotheses`);
    if (!Array.isArray(record.sources) || record.sources.length === 0) errors.push(`review ${label} has no sources`);
    const sources = new Map();
    (record.sources || []).forEach((source) => {
      if (!source.id || sources.has(source.id)) errors.push(`review ${label} has missing or duplicate source ID`);
      sources.set(source.id, source);
      if (!ALLOWED_SOURCE_KINDS.has(source.kind)) errors.push(`review ${label} has unsupported source kind ${source.kind}`);
      const error = sourceUrlError(source.url);
      if (error) errors.push(`review ${label}: ${error}`);
    });
    (record.browserEvidence || []).forEach((evidence) => {
      const source = evidence.sourceRef ? sources.get(evidence.sourceRef) : null;
      if (!ALLOWED_EVIDENCE_STATUSES.has(evidence.status)) errors.push(`review ${label} has invalid browser evidence status`);
      if (evidence.sourceRef && !source) errors.push(`review ${label} references unknown browser evidence source`);
      if (['shipping', 'behind-flag'].includes(evidence.status) && (!source || !SHIPPING_SOURCE_KINDS.has(source.kind))) {
        errors.push(`review ${label} has an unsupported engine shipping claim`);
      }
      if (['beta', 'technology-preview'].includes(evidence.status) && (!source || !PREVIEW_SOURCE_KINDS.has(source.kind))) {
        errors.push(`review ${label} has an unsupported engine preview claim`);
      }
      if (evidence.status === 'in-development' && (!source || !DEVELOPMENT_SOURCE_KINDS.has(source.kind))) {
        errors.push(`review ${label} has an unsupported engine development claim`);
      }
      if (evidence.status === 'baseline' && (!source || source.kind !== 'compat-docs')) errors.push(`review ${label} has an unsupported Baseline claim`);
    });
    if (!Array.isArray(record.browserEvidence) || record.browserEvidence.length === 0) errors.push(`review ${label} has no browser evidence classification`);
    (record.standardsEvidence || []).forEach((evidence) => {
      const source = evidence.sourceRef ? sources.get(evidence.sourceRef) : null;
      if (!source || !STANDARD_SOURCE_KINDS.has(source.kind)) errors.push(`review ${label} has unsupported standards evidence`);
    });
    if (!Array.isArray(record.repoSymbols) || record.repoSymbols.length === 0) errors.push(`review ${label} has no real XTend repo symbols`);
    (record.repoSymbols || []).forEach((repoSymbol) => {
      const absolutePath = resolveRepoPath(repoSymbol.path || '', rootDir);
      if (!repoSymbol.path || !fs.existsSync(absolutePath)) {
        errors.push(`review ${label} references a non-existent XTend path`);
        return;
      }
      if (!repoSymbol.symbol || !fs.readFileSync(absolutePath, 'utf8').includes(repoSymbol.symbol)) errors.push(`review ${label} references a non-existent XTend symbol`);
    });
    if (!Array.isArray(record.radarRefs)) errors.push(`review ${label} has no radarRefs array`);
    if (record.outcome === 'investigation-only' && record.radarRefs && record.radarRefs.length !== 0) errors.push(`investigation ${label} must not create a radar primitive`);
    if (!['investigation-only', 'rejected'].includes(record.outcome) && (!record.radarRefs || record.radarRefs.length === 0)) errors.push(`review ${label} requires a radar reference`);
    (record.radarRefs || []).forEach((radarRef) => {
      if (!/^NFM-BPR-\d{3}$/u.test(radarRef) || !radar.includes(`\`${radarRef}\``)) errors.push(`review ${label} references missing radar ID ${radarRef}`);
    });
    if (!record.owner || !record.nextReview) errors.push(`review ${label} requires owner and next review`);

    const previousFinding = previousFindings.get(record.findingId);
    if (previousFinding) {
      const finding = findings.find((candidate) => candidate.id === record.findingId);
      const expectedDelta = topLevelDiffKeys(previousFinding, finding);
      const declaredDelta = record.rawDelta && Array.isArray(record.rawDelta.changedFields)
        ? record.rawDelta.changedFields.slice().sort()
        : null;
      if (!previousRun.review || record.previousReviewRef !== previousRun.review.reviewId) errors.push(`review ${label} must reference the previous review`);
      if (!record.rawDelta || record.rawDelta.previousIntakeRef !== previousRun.intake.intakeId) errors.push(`review ${label} must reference the previous intake delta`);
      if (!declaredDelta || declaredDelta.join('|') !== expectedDelta.join('|')) errors.push(`review ${label} has an incorrect carry-over delta`);
      if (record.rawDelta && record.rawDelta.classificationOnly === true && expectedDelta.some((key) => key !== 'category')) {
        errors.push(`review ${label} incorrectly classifies a substantive delta as classification-only`);
      }
    }
  });
  return errors;
}

function createRunDocuments(rootDir, run) {
  const rawText = readText(run.raw, rootDir);
  return {
    descriptor: run,
    rawText,
    raw: JSON.parse(rawText),
    intake: readJson(run.intake, rootDir),
    review: readJson(run.review, rootDir)
  };
}

function validateRunIndexDocuments(options) {
  const { rootDir, runIndex, runs, radar, packageManifest } = options;
  const errors = [];
  if (!runIndex || runIndex.schema !== RUN_INDEX_SCHEMA) errors.push('invalid run index schema');
  const descriptors = runIndex && Array.isArray(runIndex.runs) ? runIndex.runs : [];
  if (descriptors.length === 0) errors.push('run index has no runs');
  const intakeIds = descriptors.map((run) => run.intakeId);
  const reviewIds = descriptors.map((run) => run.reviewId);
  const reportDates = descriptors.map((run) => run.reportDate);
  if (new Set(intakeIds).size !== intakeIds.length) errors.push('run intake IDs must be unique');
  if (new Set(reviewIds).size !== reviewIds.length) errors.push('run review IDs must be unique');
  if (new Set(reportDates).size !== reportDates.length || reportDates.some((date) => !isDate(date))) errors.push('run report dates must be valid and unique');
  const current = descriptors.find((run) => run.intakeId === runIndex.currentRun);
  const newestDate = reportDates.slice().sort().at(-1);
  if (!current) errors.push('current run must reference a registered run');
  if (current && current.reportDate !== newestDate) errors.push('current run must be the newest report');
  const metadata = packageManifest.xtend && packageManifest.xtend.nativeFirstFeatureAdoptionObservatory;
  if (!metadata || metadata.runIndex !== RUN_INDEX_PATH) errors.push('package metadata must reference the run index');
  if (!metadata || metadata.runIndexSchema !== RUN_INDEX_SCHEMA) errors.push('package metadata must declare the run index schema');
  if (current && metadata && metadata.currentRun !== current.intakeId) errors.push('package current run alias is stale');
  if (current && metadata && (metadata.intake !== current.intake || metadata.review !== current.review)) errors.push('package current intake and review aliases are stale');

  const documentsById = new Map((runs || []).map((run) => [run.intake.intakeId, run]));
  descriptors.forEach((descriptor, index) => {
    const documents = documentsById.get(descriptor.intakeId);
    if (!documents) {
      errors.push(`missing run documents for ${descriptor.intakeId}`);
      return;
    }
    if (documents.intake.intakeId !== descriptor.intakeId || documents.review.reviewId !== descriptor.reviewId) errors.push(`run identity mismatch for ${descriptor.intakeId}`);
    if (!documents.intake.rawArtifact || documents.intake.rawArtifact.path !== descriptor.raw) errors.push(`run raw path mismatch for ${descriptor.intakeId}`);
    if (!documents.intake.provenance || documents.intake.provenance.reportDate !== descriptor.reportDate) errors.push(`run report date mismatch for ${descriptor.intakeId}`);
    const repositoryDigest = crypto.createHash('sha256').update(documents.rawText).digest('hex');
    const sourceBytes = documents.intake.rawArtifact && documents.intake.rawArtifact.storageNormalization === 'single-terminal-newline-added' && documents.rawText.endsWith('\n')
      ? documents.rawText.slice(0, -1)
      : documents.rawText;
    const sourceDigest = crypto.createHash('sha256').update(sourceBytes).digest('hex');
    if (!documents.intake.rawArtifact || documents.intake.rawArtifact.immutable !== true) errors.push(`run ${descriptor.intakeId} raw artifact is not immutable`);
    if (!documents.intake.rawArtifact || documents.intake.rawArtifact.sha256 !== sourceDigest) errors.push(`run ${descriptor.intakeId} source digest mismatch`);
    if (!documents.intake.rawArtifact || documents.intake.rawArtifact.repositoryCopySha256 !== repositoryDigest) errors.push(`run ${descriptor.intakeId} repository digest mismatch`);
    if (!documents.intake.provenance || documents.intake.provenance.agent !== 'unknown-unreported' || documents.intake.provenance.model !== 'unknown-unreported') errors.push(`run ${descriptor.intakeId} must keep missing provenance explicit`);
    if (!documents.intake.automationPolicy || documents.intake.automationPolicy.mayMutateRadar !== false || documents.intake.automationPolicy.mayMutateRuntime !== false) {
      errors.push(`run ${descriptor.intakeId} must block raw automation mutations`);
    }
    const previousDescriptor = descriptors
      .filter((candidate) => candidate.reportDate < descriptor.reportDate)
      .sort((left, right) => left.reportDate.localeCompare(right.reportDate))
      .at(-1);
    const previousRun = previousDescriptor ? documentsById.get(previousDescriptor.intakeId) : null;
    validateObservatoryDocuments({ rootDir, raw: documents.raw, intake: documents.intake, review: documents.review, radar, previousRun })
      .forEach((error) => errors.push(`${descriptor.intakeId}: ${error}`));
    if (index > 0 && descriptors[index - 1].reportDate >= descriptor.reportDate) errors.push('runs must be ordered by report date');
  });
  return errors;
}

function assertRejected(context, label, mutate, base) {
  const candidate = clone(base);
  mutate(candidate);
  const errors = validateRunIndexDocuments(candidate);
  context.assert(errors.length > 0, `Gate rejects ${label}`);
}

function runBrowserPrimitiveRadarSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({ id: SUITE_ID, label: SUITE_LABEL });
  const runIndex = readJson(RUN_INDEX_PATH, rootDir);
  const runs = runIndex.runs.map((run) => createRunDocuments(rootDir, run));
  const radar = readText('development/XTend-Native-First-Browser-Primitive-Radar.md', rootDir);
  const radarContract = readText('development/XTend-Native-First-Browser-Primitive-Radar-Contract.md', rootDir);
  const observatoryContract = readText('development/XTend-Native-First-Feature-Adoption-Observatory-Contract.md', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const current = runs.find((run) => run.intake.intakeId === runIndex.currentRun);
  const base = { rootDir, runIndex, runs, radar, packageManifest };
  const errors = validateRunIndexDocuments(base);
  errors.forEach((error) => context.fail(error));
  if (errors.length === 0) context.pass('All immutable Observatory runs and reviews satisfy the gate');

  context.assert(runIndex.runs.length === 2 && runs.reduce((sum, run) => sum + run.raw.findings.length, 0) === 21, 'Run index preserves two runs and all 21 finding occurrences');
  context.assert(current && current.raw.findings.length === 12 && current.review.records.length === 12, 'Current weekly run has twelve complete review records');
  context.assert(current && current.review.records.filter((record) => record.previousReviewRef).length === 9, 'Nine carry-over findings reference the previous review');
  context.assert(current && current.review.records.filter((record) => record.rawDelta && record.rawDelta.changedFields.join('|') === 'category').length === 8, 'Eight carry-over findings declare category-only deltas');
  ['NFM-BPR-006', 'NFM-BPR-007', 'NFM-BPR-008', 'NFM-BPR-011', 'NFM-BPR-012', 'NFM-BPR-015', 'NFM-BPR-019', 'NFM-BPR-021', 'NFM-BPR-022', 'NFM-BPR-023', 'NFM-BPR-024'].forEach((radarId) => {
    context.assertIncludes(radar, `\`${radarId}\``, `Radar contains ${radarId}`);
  });
  context.assertIncludes(radarContract, '| `lifecycle` |', 'Radar contract includes lifecycle category');
  context.assertIncludes(observatoryContract, 'standards-evidence-is-not-engine-shipping-evidence', 'Contract separates standards and engine evidence');
  context.assertIncludes(runner, "id: 'browser-primitive-radar'", 'Runner registers the browser primitive radar gate');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:browser-primitive-radar'] === 'node scripts/run_xtend_tests.js browser-primitive-radar', 'Package exposes browser primitive radar gate');

  assertRejected(context, 'stale current pointer', (candidate) => { candidate.runIndex.currentRun = 'NFM-OBS-2026-08-09'; }, base);
  assertRejected(context, 'invalid run index schema', (candidate) => { candidate.runIndex.schema = 'invalid-run-index-schema'; }, base);
  assertRejected(context, 'invalid intake schema', (candidate) => { candidate.runs[1].intake.schema = 'invalid-intake-schema'; }, base);
  assertRejected(context, 'invalid review schema', (candidate) => { candidate.runs[1].review.schema = 'invalid-review-schema'; }, base);
  assertRejected(context, 'duplicate run IDs', (candidate) => { candidate.runIndex.runs[1].intakeId = candidate.runIndex.runs[0].intakeId; }, base);
  assertRejected(context, 'duplicate review IDs', (candidate) => { candidate.runIndex.runs[1].reviewId = candidate.runIndex.runs[0].reviewId; }, base);
  assertRejected(context, 'incorrect source digest', (candidate) => { candidate.runs[1].intake.rawArtifact.sha256 = '0'.repeat(64); }, base);
  assertRejected(context, 'missing review record', (candidate) => { candidate.runs[1].review.records.pop(); }, base);
  assertRejected(context, 'hidden carry-over delta', (candidate) => { candidate.runs[1].review.records.find((record) => record.previousReviewRef).rawDelta.changedFields = []; }, base);
  assertRejected(context, 'unknown previous review', (candidate) => { candidate.runs[1].review.records.find((record) => record.previousReviewRef).previousReviewRef = 'unknown'; }, base);
  assertRejected(context, 'standard source used for shipping', (candidate) => {
    const record = candidate.runs[1].review.records.find((entry) => entry.findingId === 'explicit-resource-management-webkit-tp250');
    record.browserEvidence[0].sourceRef = 'tc39-finished-proposals';
  }, base);
  assertRejected(context, 'technology preview used as stable shipping', (candidate) => {
    const record = candidate.runs[1].review.records.find((entry) => entry.findingId === 'explicit-resource-management-webkit-tp250');
    record.browserEvidence[2].status = 'shipping';
  }, base);
  assertRejected(context, 'insecure source URL', (candidate) => {
    candidate.runs[1].review.records[0].sources[0].url = 'http://webkit.org/unsafe';
  }, base);
  assertRejected(context, 'credential-bearing source URL', (candidate) => {
    candidate.runs[1].review.records[0].sources[0].url = 'https://user:secret@webkit.org/unsafe';
  }, base);
  assertRejected(context, 'non-allowlisted source host', (candidate) => {
    candidate.runs[1].review.records[0].sources[0].url = 'https://example.invalid/claim';
  }, base);
  assertRejected(context, 'non-existent XTend symbol', (candidate) => {
    candidate.runs[1].review.records[0].repoSymbols[0].symbol = 'ImaginaryStreamingTransport';
  }, base);

  return context.result({
    report: {
      schema: REPORT_SCHEMA,
      intakeSchema: INTAKE_SCHEMA,
      reviewSchema: REVIEW_SCHEMA,
      runIndexSchema: RUN_INDEX_SCHEMA,
      runs: runIndex.runs.length,
      currentRun: runIndex.currentRun,
      currentFindings: current.raw.findings.length,
      currentReviews: current.review.records.length,
      findingOccurrences: runs.reduce((sum, run) => sum + run.raw.findings.length, 0),
      currentSha256: current.intake.rawArtifact.sha256,
      newRadarEntries: ['NFM-BPR-024'],
      untrustedInputCannotAdopt: true
    }
  });
}

function printBrowserPrimitiveRadarReport(result) {
  printSuiteReport(result, {
    successTitle: 'Browser Primitive Radar und Observatory Intake erfolgreich.',
    failureTitle: 'Browser Primitive Radar und Observatory Intake fehlgeschlagen:'
  });
}

module.exports = {
  printBrowserPrimitiveRadarReport,
  runBrowserPrimitiveRadarSuite,
  sourceUrlError,
  topLevelDiffKeys,
  validateObservatoryDocuments,
  validateRunIndexDocuments
};
