const fs = require('fs');
const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  EPIC13_KNOWN_RESIDUAL_DECISION_SCHEMA,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_CONTRACT,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_DOCS,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_LOCAL_GATE,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_MODULE,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_PACKAGE_SCRIPT,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_REPORT_SCHEMA,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_SCHEMA,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_STATUS,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_STEERING,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_SUITE,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_TARGET,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_WORKPACKAGE,
  EPIC13_KNOWN_RESIDUAL_TRIAGE_WORKPACKAGE_DOC,
  PUBLISH_BOUNDARY,
  RC0_RESIDUAL_SCOPES,
  REQUIRED_DOCS,
  REQUIRED_SOURCE_GATES,
  createEpic13KnownResidualTriagePlan,
  createEpic13KnownResidualTriageReport,
  validateEpic13KnownResidualTriagePlan
} = require('../../catalog/epic13-known-residual-triage');

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, values, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(values) && values.includes(entry), `${label} includes ${entry}`);
  });
}

function assertTextIncludesAll(context, text, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(text, entry, `${label} includes ${entry}`);
  });
}

function runEpic13KnownResidualTriageSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'epic13-known-residual-triage',
    label: 'Epic 13 Known Residual Triage'
  });
  const plan = createEpic13KnownResidualTriagePlan({ rootDir });
  const validation = validateEpic13KnownResidualTriagePlan(plan);
  const report = createEpic13KnownResidualTriageReport({ rootDir, plan });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.epic13KnownResidualTriage;
  const rc1Metadata = packageManifest.xtend && packageManifest.xtend.epic13Rc1Readiness;
  const ownerMetadata = packageManifest.xtend && packageManifest.xtend.epic13ReleaseOwnerAcceptance;
  const networkMetadata = packageManifest.xtend && packageManifest.xtend.epic13ConditionalNetworkEvidence;
  const packageLockMetadata = packageManifest.xtend && packageManifest.xtend.epic13PackageExportLock;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const steering = readText(EPIC13_KNOWN_RESIDUAL_TRIAGE_STEERING, rootDir);
  const contractDoc = readText(EPIC13_KNOWN_RESIDUAL_TRIAGE_CONTRACT, rootDir);
  const workpackage = readText(EPIC13_KNOWN_RESIDUAL_TRIAGE_WORKPACKAGE_DOC, rootDir);
  const docs = readText(EPIC13_KNOWN_RESIDUAL_TRIAGE_DOCS, rootDir);
  const rc1Docs = readText('development/docs-evidence/legacy-routes/en/rc1-readiness.md', rootDir);
  const ownerDocs = readText('development/docs-evidence/legacy-routes/en/release-owner-acceptance.md', rootDir);
  const packageDocs = readText('docs/package-export-lock.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const releaseChecklist = readText('development/XTend-Release-Checklist-und-SemVer-Policy.md', rootDir);
  const ciMatrix = readText('development/XTend-CI-Gate-Matrix.md', rootDir);
  const enterpriseAdoption = readText('docs/enterprise-adoption.md', rootDir);
  const docsReadme = readText('docs/en/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const readme = readText('README.md', rootDir);
  const changelog = readText('CHANGELOG.md', rootDir);
  const moduleSyntax = syntaxCheckFile(EPIC13_KNOWN_RESIDUAL_TRIAGE_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(EPIC13_KNOWN_RESIDUAL_TRIAGE_SUITE, { rootDir, extension: '.js' });
  const stateDecision = plan.decisions.find((entry) => entry.scope === 'xtend-state');
  const xutilsDecision = plan.decisions.find((entry) => entry.scope === 'x-utils');
  const hydrateDecision = plan.decisions.find((entry) => entry.scope === 'xtend.component.hydrate');

  [
    EPIC13_KNOWN_RESIDUAL_TRIAGE_MODULE,
    EPIC13_KNOWN_RESIDUAL_TRIAGE_SUITE,
    EPIC13_KNOWN_RESIDUAL_TRIAGE_STEERING,
    EPIC13_KNOWN_RESIDUAL_TRIAGE_CONTRACT,
    EPIC13_KNOWN_RESIDUAL_TRIAGE_WORKPACKAGE_DOC,
    EPIC13_KNOWN_RESIDUAL_TRIAGE_DOCS
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as required known residual triage doc`);
  });

  context.assert(moduleSyntax.ok, `Epic 13 Known Residual Triage module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Epic 13 Known Residual Triage suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(plan.schema === EPIC13_KNOWN_RESIDUAL_TRIAGE_SCHEMA, 'Known residual triage exposes stable schema');
  context.assert(plan.decisionSchema === EPIC13_KNOWN_RESIDUAL_DECISION_SCHEMA, 'Known residual triage exposes decision schema');
  context.assert(plan.reportSchema === EPIC13_KNOWN_RESIDUAL_TRIAGE_REPORT_SCHEMA, 'Known residual triage exposes report schema');
  context.assert(plan.workpackage === EPIC13_KNOWN_RESIDUAL_TRIAGE_WORKPACKAGE, 'Known residual triage belongs to WP-E13-05');
  context.assert(plan.status === EPIC13_KNOWN_RESIDUAL_TRIAGE_STATUS, 'Known residual triage is accepted');
  context.assert(plan.targetReadiness === EPIC13_KNOWN_RESIDUAL_TRIAGE_TARGET, 'Known residual triage target is ready');
  context.assert(plan.sourceValidationOk === true && plan.sourceReportOk === true, 'Known residual triage consumes package export lock');
  context.assert(plan.rc0GateMatrixOk === true, 'Known residual triage consumes valid RC0 gate matrix');
  context.assert(plan.longTailPlanOk === true, 'Known residual triage consumes valid long-tail plan');
  context.assert(plan.preferredClosureMode === 'owner-free-closure-before-owner-renewal', 'Known residual triage prefers owner-free closure');
  context.assert(plan.nextWorkpackage === 'WP-E13-06', 'Known residual triage makes WP-E13-06 ready');
  context.assert(plan.nextDecision === 'hydration-performance-warning-decision', 'Known residual triage hands off to hydration warning decision');
  context.assert(plan.publishBoundary === PUBLISH_BOUNDARY, 'Known residual triage keeps publish boundary');
  context.assert(plan.publishAllowed === false, 'Known residual triage keeps publish blocked');
  context.assert(validation.schema === EPIC13_KNOWN_RESIDUAL_TRIAGE_REPORT_SCHEMA, 'Known residual triage validator emits report schema');
  context.assert(validation.ok === true, 'Known residual triage plan validates');
  context.assert(report.ok === true, 'Known residual triage report validates');
  context.assert(report.decisionCount === RC0_RESIDUAL_SCOPES.length, 'Known residual triage reports all RC0 residuals');
  context.assert(report.closedResiduals.includes('xtend-state'), 'Known residual triage closes XTend State as boundary');
  context.assert(report.closedResiduals.includes('x-utils'), 'Known residual triage closes x-utils as boundary');
  context.assert(report.watchpoints.includes('xtend.component.hydrate'), 'Known residual triage keeps hydration as watchpoint');
  context.assert(report.publishBlockingResiduals.length === 1 && report.publishBlockingResiduals[0] === 'xtend.component.hydrate', 'Only hydration residual remains publish-blocking');
  context.assert(report.ownerDecisionRequiredResiduals.length === 0, 'Known residual triage adds no owner residual by default');
  assertIncludesAll(context, plan.rc0ResidualScopes, RC0_RESIDUAL_SCOPES, 'RC0 residual scopes');
  assertIncludesAll(context, plan.sourceGates, REQUIRED_SOURCE_GATES, 'Source gates');
  context.assert(stateDecision && stateDecision.catalogStatus === 'contract-gated', 'state keeps catalog boundary status');
  context.assert(stateDecision && stateDecision.migrationKind === 'adapter-boundary-probe', 'state keeps long-tail boundary probe');
  context.assert(stateDecision && stateDecision.publishBlocking === false, 'state no longer blocks publish as residual');
  context.assert(xutilsDecision && xutilsDecision.catalogStatus === 'typed-contract-gated', 'x-utils keeps typed catalog boundary status');
  context.assert(xutilsDecision && xutilsDecision.migrationKind === 'adapter-boundary-probe', 'x-utils keeps long-tail boundary probe');
  context.assert(xutilsDecision && xutilsDecision.publishBlocking === false, 'x-utils no longer blocks publish as residual');
  context.assert(hydrateDecision && hydrateDecision.targetWorkpackage === 'WP-E13-06', 'Hydration warning targets WP-E13-06');
  context.assert(hydrateDecision && hydrateDecision.measurement.status === 'warn-not-fail', 'Hydration warning preserves warn-not-fail status');

  context.assert(packageManifest.private === false, 'Package is public-ready for known residual triage');
  context.assert((packageManifest.exports['./catalog/epic13-known-residual-triage'] === './catalog/epic13-known-residual-triage.js' || (packageManifest.exports['./catalog/epic13-known-residual-triage'] && packageManifest.exports['./catalog/epic13-known-residual-triage'].default === './catalog/epic13-known-residual-triage.js')), 'Package exports known residual triage module');
  context.assert(packageManifest.scripts['test:epic13-known-residual-triage'] === 'node scripts/run_xtend_tests.js epic13-known-residual-triage', 'Package exposes known residual triage script');
  context.assert(packageManifest.xtend.releaseGates.includes(EPIC13_KNOWN_RESIDUAL_TRIAGE_PACKAGE_SCRIPT), 'Package release gates include known residual triage script');
  context.assert(packageManifest.xtend.releaseChecklist.candidateGates.includes(EPIC13_KNOWN_RESIDUAL_TRIAGE_PACKAGE_SCRIPT), 'Release checklist metadata includes known residual triage script');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(EPIC13_KNOWN_RESIDUAL_TRIAGE_CONTRACT), 'Artifact checklist includes known residual triage contract');
  context.assert(metadata && metadata.schema === EPIC13_KNOWN_RESIDUAL_TRIAGE_SCHEMA, 'Package metadata exposes known residual triage schema');
  context.assert(metadata && metadata.workpackage === EPIC13_KNOWN_RESIDUAL_TRIAGE_WORKPACKAGE, 'Package metadata exposes WP-E13-05');
  context.assert(metadata && metadata.nextWorkpackage === 'WP-E13-06', 'Package metadata exposes next workpackage');
  context.assert(metadata && metadata.closedResiduals.includes('xtend-state') && metadata.closedResiduals.includes('x-utils'), 'Package metadata exposes closed boundary residuals');
  context.assert(metadata && metadata.watchpoints.includes('xtend.component.hydrate'), 'Package metadata exposes hydration watchpoint');
  context.assert(rc1Metadata && rc1Metadata.nextWorkpackage === 'WP-E13-13', 'RC1 readiness metadata now hands off to WP-E13-09 after visual owner artifact normalization');
  context.assert(ownerMetadata && ownerMetadata.nextWorkpackage === 'WP-E13-13', 'Owner acceptance metadata now hands off to WP-E13-09 after visual owner artifact normalization');
  context.assert(networkMetadata && networkMetadata.nextWorkpackage === 'WP-E13-13', 'Network evidence metadata now hands off to WP-E13-09 after visual owner artifact normalization');
  context.assert(packageLockMetadata && packageLockMetadata.nextWorkpackage === 'WP-E13-13', 'Package export lock metadata now hands off to WP-E13-09 after visual owner artifact normalization');
  context.assertIncludes(scaffoldConfig, 'epic13KnownResidualTriage', 'Scaffold config exposes known residual triage metadata');
  context.assertIncludes(scaffoldConfig, EPIC13_KNOWN_RESIDUAL_TRIAGE_SCHEMA, 'Scaffold config declares known residual triage schema');
  context.assertIncludes(scaffoldConfig, EPIC13_KNOWN_RESIDUAL_TRIAGE_LOCAL_GATE, 'Scaffold config references known residual triage gate');
  context.assertIncludes(scaffoldConfig, 'nextWorkpackage: "WP-E13-06"', 'Scaffold config advances Epic 13 handoff to WP-E13-06');
  context.assertIncludes(runner, "id: 'epic13-known-residual-triage'", 'Runner registers known residual triage suite');

  assertTextIncludesAll(context, steering, [
    EPIC13_KNOWN_RESIDUAL_TRIAGE_SCHEMA,
    '| `WP-E13-05` | P0 | completed | WS2 | RC0 Known Residuals fuer RC1 triagieren |',
    '| `WP-E13-06` | P0 | completed | WS2 | Hydration Performance Warning schliessen oder RC1 Owner-Entscheid bauen |',
    '| `WP-E13-07` | P1 | completed | WS3 | PROD-nahe Browser-, Local-Server- und CSP-Smokes vorbereiten |',
    '| `WP-E13-08` | P1 | completed | WS3 | Visual Screenshot/Pixels als RC1-Artefakt normalisieren |',
    '| `WP-E13-09` | P1 | completed | WS4 | RMT-first App Production Readiness Gate buendeln |',
    'Handoff nach WP-E13-05',
    ['x', 'state'].join(''),
    'x-utils',
    'xtend.component.hydrate'
  ], 'Epic 13 steering document');
  assertTextIncludesAll(context, contractDoc, [
    EPIC13_KNOWN_RESIDUAL_TRIAGE_SCHEMA,
    EPIC13_KNOWN_RESIDUAL_DECISION_SCHEMA,
    EPIC13_KNOWN_RESIDUAL_TRIAGE_LOCAL_GATE,
    'closed-as-runtime-boundary',
    'closed-as-utility-boundary',
    'defer-to-wp-e13-06-owner-free-closure'
  ], 'Known residual triage contract doc');
  assertTextIncludesAll(context, workpackage, [
    'xtend.epic13.wp05.known-residual-triage.v1',
    'Status: `completed`',
    EPIC13_KNOWN_RESIDUAL_TRIAGE_SCHEMA,
    EPIC13_KNOWN_RESIDUAL_TRIAGE_LOCAL_GATE,
    'WP-E13-06'
  ], 'WP-E13-05 workpackage');
  assertTextIncludesAll(context, docs, [
    EPIC13_KNOWN_RESIDUAL_TRIAGE_SCHEMA,
    EPIC13_KNOWN_RESIDUAL_TRIAGE_LOCAL_GATE,
    ['x', 'state'].join(''),
    'x-utils',
    'xtend.component.hydrate',
    PUBLISH_BOUNDARY
  ], 'Known residual triage docs');
  assertTextIncludesAll(context, rc1Docs, [
    'Known Residual Triage',
    'WP-E13-06',
    './known-residual-triage.md'
  ], 'RC1 readiness docs handoff');
  assertTextIncludesAll(context, ownerDocs, [
    EPIC13_KNOWN_RESIDUAL_TRIAGE_SCHEMA,
    'known-residual-renewal',
    'WP-E13-06',
    './known-residual-triage.md'
  ], 'Owner acceptance docs handoff');
  assertTextIncludesAll(context, packageDocs, [
    EPIC13_KNOWN_RESIDUAL_TRIAGE_SCHEMA,
    'WP-E13-06',
    './known-residual-triage.md'
  ], 'Package export lock docs handoff');
  assertTextIncludesAll(context, registry, [
    EPIC13_KNOWN_RESIDUAL_TRIAGE_MODULE,
    EPIC13_KNOWN_RESIDUAL_TRIAGE_CONTRACT,
    EPIC13_KNOWN_RESIDUAL_TRIAGE_DOCS,
    EPIC13_KNOWN_RESIDUAL_TRIAGE_SUITE,
    EPIC13_KNOWN_RESIDUAL_TRIAGE_LOCAL_GATE
  ], 'Reference registry');
  assertTextIncludesAll(context, releaseChecklist, [
    'npm run test:epic13-known-residual-triage',
    EPIC13_KNOWN_RESIDUAL_TRIAGE_CONTRACT,
    '.xtend-test-results/xtend-known-residual-triage-report.json'
  ], 'Release checklist');
  assertTextIncludesAll(context, ciMatrix, [
    EPIC13_KNOWN_RESIDUAL_TRIAGE_LOCAL_GATE,
    'Known Residual Triage'
  ], 'CI gate matrix');
  assertTextIncludesAll(context, enterpriseAdoption, [
    EPIC13_KNOWN_RESIDUAL_TRIAGE_SCHEMA,
    './known-residual-triage.md',
    'xtend.component.hydrate'
  ], 'Enterprise adoption docs');
  context.assertIncludes(docsReadme, './known-residual-triage.md', 'Docs README links known residual triage');
  context.assertIncludes(docsMenu, 'known-residual-triage', 'Docs menu exposes known residual triage');
  context.assertIncludes(testsReadme, EPIC13_KNOWN_RESIDUAL_TRIAGE_LOCAL_GATE, 'Tests README documents known residual triage gate');
  context.assertIncludes(readme, 'xtend.epic13KnownResidualTriage', 'Root README documents known residual triage metadata');
  context.assertIncludes(changelog, EPIC13_KNOWN_RESIDUAL_TRIAGE_SCHEMA, 'Changelog records known residual triage contract');

  return context.result({
    report: {
      schema: EPIC13_KNOWN_RESIDUAL_TRIAGE_REPORT_SCHEMA,
      decisionCount: report.decisionCount,
      closedResiduals: report.closedResiduals,
      watchpoints: report.watchpoints,
      publishBlockingResiduals: report.publishBlockingResiduals,
      publishAllowed: report.publishAllowed,
      nextWorkpackage: report.nextWorkpackage
    }
  });
}

function printEpic13KnownResidualTriageReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 13 Known Residual Triage erfolgreich.',
    failureTitle: 'Epic 13 Known Residual Triage fehlgeschlagen:'
  });
}

module.exports = {
  printEpic13KnownResidualTriageReport,
  runEpic13KnownResidualTriageSuite
};
