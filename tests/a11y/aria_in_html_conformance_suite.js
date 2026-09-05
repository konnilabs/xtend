const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRootDir
} = require('../utils/files');
const {
  CONFORMANCE_SCHEMA,
  REPORT_SCHEMA,
  validateConformanceCase,
  validateConformanceMatrix
} = require('./aria_in_html_conformance');

const MATRIX_PATH = 'tests/fixtures/native-first/aria-in-html-2026-conformance.json';
const CONTRACT_PATH = 'development/XTend-ARIA-in-HTML-2026-Conformance-Contract.md';
const REQUIRED_SCOPE = [
  'native-semantics',
  'allowed-roles-and-aria',
  'naming-prohibition',
  'summary',
  'label',
  'selectedcontent-and-custom-select',
  'html',
  'img',
  'aria-hidden-with-hidden'
];
const REQUIRED_PHASES = ['ssr', 'pre-hydration', 'post-hydration'];
const REQUIRED_COMPONENTS = ['x-button', 'x-input', 'x-select', 'x-form', 'x-summary', 'x-dialog', 'x-modal', 'x-toast'];

function runAriaInHtmlConformanceSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const context = createSuiteContext({
    id: 'aria-in-html-conformance',
    label: 'ARIA in HTML 2026 author-conformance gate'
  });
  const matrix = readJson(MATRIX_PATH, rootDir);
  const contract = readText(CONTRACT_PATH, rootDir);
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const hydrationSuite = readText('tests/components/accessibility_hydration_suite.js', rootDir);
  const defaultWorkflow = readText('.github/workflows/xtend-default-gates.yml', rootDir);
  const nightlyWorkflow = readText('.github/workflows/xtend-nightly-build.yml', rootDir);
  const nightlyManifestScript = readText('scripts/create_xtend_nightly_manifest.js', rootDir);
  const observatoryReview = readJson('development/observatory/xtend-observatory-2026-08-17.review.json', rootDir);
  const validation = validateConformanceMatrix(matrix);

  context.assert(matrix.schema === CONFORMANCE_SCHEMA, 'Matrix declares the stable ARIA in HTML conformance schema');
  context.assert(validation.schema === REPORT_SCHEMA, 'Validator emits the stable ARIA in HTML report schema');
  context.assert(validation.ok, 'Positive and negative ARIA in HTML fixtures match their expected outcomes');
  context.assert(matrix.baseline.status === 'W3C Recommendation', 'Matrix identifies the normative source as a W3C Recommendation');
  context.assert(matrix.baseline.publishedDate === '2026-08-11', 'Matrix pins the 11 August 2026 Recommendation');
  context.assert(matrix.baseline.url === 'https://www.w3.org/TR/2026/REC-html-aria-20260811/', 'Matrix pins the versioned Recommendation URL');
  context.assert(matrix.baseline.claimBoundary === 'author-conformance-only-no-browser-aom-or-assistive-technology-support-claim', 'Matrix does not turn author conformance into browser, AOM or AT evidence');
  REQUIRED_SCOPE.forEach((entry) => context.assert(matrix.scope.includes(entry), `Matrix covers ${entry}`));

  const positiveCases = matrix.cases.filter((sample) => sample.expectedValid);
  const negativeCases = matrix.cases.filter((sample) => !sample.expectedValid);
  context.assert(positiveCases.length >= 10, 'Matrix contains broad positive rule fixtures');
  context.assert(negativeCases.length >= 8, 'Matrix contains broad negative rule fixtures');
  context.assert(negativeCases.every((sample) => !validateConformanceCase(matrix, sample).ok), 'Every negative fixture is rejected by the validator');
  context.assert(positiveCases.every((sample) => validateConformanceCase(matrix, sample).ok), 'Every positive fixture is accepted by the validator');

  REQUIRED_COMPONENTS.forEach((component) => {
    const snapshot = matrix.componentPhases.find((entry) => entry.component === component);
    context.assert(Boolean(snapshot), `${component} has a versioned conformance snapshot`);
    if (!snapshot) return;
    context.assert(REQUIRED_PHASES.every((phase) => snapshot.phases.includes(phase)), `${component} declares SSR, pre-hydration and post-hydration phases`);
    context.assert(typeof snapshot.semanticFingerprint === 'string' && snapshot.semanticFingerprint.length > 0, `${component} keeps a phase-stable semantic intent`);
    context.assert(snapshot.caseRefs.every((caseRef) => positiveCases.some((sample) => sample.id === caseRef)), `${component} binds only passing conformance cases`);
    const source = readText(snapshot.source, rootDir);
    snapshot.sourceEvidence.forEach((token) => context.assertIncludes(source, token, `${component} source preserves reviewed markup evidence: ${token}`));
  });

  const summarySource = readText('components/xsummary.js', rootDir);
  context.assertIncludes(summarySource, '<details part="container">', 'x-summary keeps native details ownership');
  context.assertIncludes(summarySource, '<summary part="summary">', 'x-summary keeps a native direct-child summary');
  context.assert(!summarySource.includes('<summary part="summary" role='), 'x-summary does not override the direct-child summary role');
  context.assert(!summarySource.includes('this._summary.setAttribute("aria-expanded"'), 'x-summary does not manually mirror native expanded semantics');

  const redundantButton = validation.caseReports.find((report) => report.id === 'native-button-redundant-positive');
  const redundantHidden = validation.caseReports.find((report) => report.id === 'hidden-redundant-positive');
  context.assert(redundantButton.ok && redundantButton.advisories.length === 1, 'Conforming redundant native button role remains an advisory');
  context.assert(redundantHidden.ok && redundantHidden.advisories.length === 1, 'Conforming redundant aria-hidden with hidden remains an advisory');

  const unknownRule = validateConformanceCase(matrix, {id: 'unknown', ruleRef: 'does-not-exist', element: 'div', expectedValid: false});
  context.assert(!unknownRule.ok && unknownRule.errors.some((error) => error.includes('unknown rule')), 'Validator rejects an unknown rule reference');

  const ariaFinding = observatoryReview.records.find((review) => review.findingId === 'aria-in-html-recommendation-2026');
  context.assert(ariaFinding && ariaFinding.outcome === 'investigation-only', 'ARIA in HTML review remains investigation-only');
  context.assert(Array.isArray(ariaFinding.radarRefs) && ariaFinding.radarRefs.length === 0, 'ARIA in HTML review does not create a browser primitive radar entry');

  context.assertIncludes(contract, 'Autorenspezifikation', 'Contract documents the author-conformance boundary');
  context.assertIncludes(contract, 'keine Behauptung ueber einen identischen Accessibility Tree', 'Contract separates phase markup from AOM evidence');
  context.assertIncludes(contract, 'keinen Package-Export', 'Contract prohibits a public package export');
  context.assert(packageManifest.scripts['test:aria-in-html-conformance'] === 'node scripts/run_xtend_tests.js aria-in-html-conformance', 'Package exposes the internal ARIA in HTML gate');
  context.assert(packageManifest.scripts['test:a11y'].includes('aria-in-html-conformance'), 'Aggregate A11y command includes the ARIA in HTML gate');
  context.assert(packageManifest.scripts['test:feature-adoption-observatory'].includes('aria-in-html-conformance'), 'Observatory command includes the ARIA in HTML gate');
  context.assert(packageManifest.scripts['test:pr'].includes('a11y-hydration') && packageManifest.scripts['test:release:full'].includes('a11y-hydration'), 'PR and release commands retain the aggregate A11y gate');
  context.assertIncludes(hydrationSuite, 'runAriaInHtmlConformanceSuite({ rootDir })', 'Aggregate A11y gate executes ARIA in HTML conformance in PR and release chains');
  context.assert(require("../utils/test-catalog").workflowHasScript(defaultWorkflow, "test:feature-adoption-observatory"), 'Default CI executes the Observatory aggregate containing ARIA in HTML');
  context.assertIncludes(nightlyWorkflow, 'id: feature_adoption_observatory', 'Nightly CI executes the Observatory aggregate as a named required gate');
  context.assertIncludes(nightlyWorkflow, 'steps.feature_adoption_observatory.outcome', 'Nightly CI fails closed when the Observatory aggregate fails');
  context.assertIncludes(nightlyManifestScript, "'npm run test:feature-adoption-observatory'", 'Nightly manifest records the Observatory aggregate in its command provenance');
  context.assert(runner.hasSuite("aria-in-html-conformance"), 'Runner registers the ARIA in HTML suite');
  context.assert(!Object.keys(packageManifest.exports || {}).some((key) => key.includes('aria-in-html-conformance')), 'ARIA in HTML test implementation is not a public package export');

  return context.result({
    schema: REPORT_SCHEMA,
    baseline: matrix.baseline,
    ruleCount: matrix.rules.length,
    caseCount: matrix.cases.length,
    componentCount: matrix.componentPhases.length,
    phases: REQUIRED_PHASES,
    claimBoundary: matrix.baseline.claimBoundary
  });
}

function printAriaInHtmlConformanceReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend ARIA in HTML 2026 Conformance Gate erfolgreich.',
    failureTitle: 'XTend ARIA in HTML 2026 Conformance Gate fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runAriaInHtmlConformanceSuite();
  printAriaInHtmlConformanceReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printAriaInHtmlConformanceReport,
  runAriaInHtmlConformanceSuite
};
