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
  EPIC13_RC1_READINESS_CONTRACT,
  EPIC13_RC1_READINESS_DOCS,
  EPIC13_RC1_READINESS_LOCAL_GATE,
  EPIC13_RC1_READINESS_MODULE,
  EPIC13_RC1_READINESS_PACKAGE_SCRIPT,
  EPIC13_RC1_READINESS_REPORT_SCHEMA,
  EPIC13_RC1_READINESS_SCHEMA,
  EPIC13_RC1_READINESS_STATUS,
  EPIC13_RC1_READINESS_STEERING,
  EPIC13_RC1_READINESS_SUITE,
  EPIC13_RC1_READINESS_TARGET,
  EPIC13_RC1_READINESS_WORKPACKAGE,
  EPIC13_RC1_READINESS_WORKPACKAGE_DOC,
  GATE_GAPS,
  GATE_MAPPINGS,
  REQUIRED_BASELINE_GATES,
  REQUIRED_DOCS,
  REQUIRED_SOURCE_SCHEMAS,
  WORKPACKAGES,
  createEpic13Rc1ReadinessModel,
  createEpic13Rc1ReadinessReport,
  validateEpic13Rc1ReadinessModel
} = require('../../catalog/epic13-rc1-readiness');

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

function runEpic13Rc1ReadinessSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'epic13-rc1-readiness',
    label: 'Epic 13 RC1 Readiness'
  });
  const model = createEpic13Rc1ReadinessModel({ rootDir });
  const validation = validateEpic13Rc1ReadinessModel(model);
  const report = createEpic13Rc1ReadinessReport({ rootDir, model });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.epic13Rc1Readiness;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const steering = readText(EPIC13_RC1_READINESS_STEERING, rootDir);
  const contract = readText(EPIC13_RC1_READINESS_CONTRACT, rootDir);
  const workpackage = readText(EPIC13_RC1_READINESS_WORKPACKAGE_DOC, rootDir);
  const docs = readText(EPIC13_RC1_READINESS_DOCS, rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const readme = readText('README.md', rootDir);
  const changelog = readText('CHANGELOG.md', rootDir);
  const moduleSyntax = syntaxCheckFile(EPIC13_RC1_READINESS_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(EPIC13_RC1_READINESS_SUITE, { rootDir, extension: '.js' });

  [
    EPIC13_RC1_READINESS_MODULE,
    EPIC13_RC1_READINESS_SUITE,
    EPIC13_RC1_READINESS_STEERING,
    EPIC13_RC1_READINESS_CONTRACT,
    EPIC13_RC1_READINESS_WORKPACKAGE_DOC,
    EPIC13_RC1_READINESS_DOCS
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as required RC1 readiness doc`);
  });

  context.assert(moduleSyntax.ok, `Epic 13 RC1 Readiness module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Epic 13 RC1 Readiness suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(model.schema === EPIC13_RC1_READINESS_SCHEMA, 'RC1 readiness exposes stable schema');
  context.assert(model.reportSchema === EPIC13_RC1_READINESS_REPORT_SCHEMA, 'RC1 readiness exposes report schema');
  context.assert(model.workpackage === EPIC13_RC1_READINESS_WORKPACKAGE, 'RC1 readiness belongs to WP-E13-01');
  context.assert(model.status === EPIC13_RC1_READINESS_STATUS, 'RC1 readiness is accepted');
  context.assert(model.targetReadiness === EPIC13_RC1_READINESS_TARGET, 'RC1 readiness target is production candidate');
  context.assert(model.sourceReleaseCandidate === 'RC0', 'RC1 readiness starts from RC0');
  context.assert(model.targetReleaseCandidate === 'RC1', 'RC1 readiness targets RC1');
  context.assert(model.sourceDecision === 'ready-for-release-owner-review-not-publish', 'RC1 readiness consumes RC0 source decision');
  context.assert(model.sourceNextDecision === 'release-owner-acceptance', 'RC1 readiness consumes RC0 next decision');
  context.assert(model.nextDecision === 'rc1-gate-matrix-ci-handoff', 'RC1 readiness hands off to Trusted DOM browser proof');
  context.assert(model.nextWorkpackage === 'WP-E13-13', 'RC1 readiness makes WP-E13-11 ready');
  context.assert(model.publishAllowed === false, 'RC1 readiness keeps publish blocked');
  context.assert(model.packagePrivateRequired === true, 'RC1 readiness requires private package');
  context.assert(validation.schema === EPIC13_RC1_READINESS_REPORT_SCHEMA, 'RC1 readiness validator emits report schema');
  context.assert(validation.ok === true, 'RC1 readiness model validates');
  context.assert(report.ok === true, 'RC1 readiness report validates');
  context.assert(report.gateMappingCount === GATE_MAPPINGS.length, 'RC1 readiness report counts gate mappings');
  context.assert(report.gateGapCount === GATE_GAPS.length, 'RC1 readiness report counts gate gaps');
  context.assert(report.workpackageCount === WORKPACKAGES.length, 'RC1 readiness report counts workpackages');
  context.assert(report.completedWorkpackages.includes('WP-E13-01'), 'RC1 readiness report marks WP-E13-01 completed');
  context.assert(report.completedWorkpackages.includes('WP-E13-02'), 'RC1 readiness report marks WP-E13-02 completed');
  context.assert(report.completedWorkpackages.includes('WP-E13-03'), 'RC1 readiness report marks WP-E13-03 completed');
  context.assert(report.completedWorkpackages.includes('WP-E13-04'), 'RC1 readiness report marks WP-E13-04 completed');
  context.assert(report.completedWorkpackages.includes('WP-E13-05'), 'RC1 readiness report marks WP-E13-05 completed');
  context.assert(report.completedWorkpackages.includes('WP-E13-06'), 'RC1 readiness report marks WP-E13-06 completed');
  context.assert(report.completedWorkpackages.includes('WP-E13-07'), 'RC1 readiness report marks WP-E13-07 completed');
  context.assert(report.completedWorkpackages.includes('WP-E13-08'), 'RC1 readiness report marks WP-E13-08 completed');
  context.assert(report.completedWorkpackages.includes('WP-E13-09'), 'RC1 readiness report marks WP-E13-09 completed');
  context.assert(report.completedWorkpackages.includes('WP-E13-10'), 'RC1 readiness report marks WP-E13-10 completed');
  context.assert(report.completedWorkpackages.includes('WP-E13-11'), 'RC1 readiness report marks WP-E13-11 completed');
  context.assert(report.completedWorkpackages.includes('WP-E13-12'), 'RC1 readiness report marks WP-E13-12 completed');
  context.assert(report.readyWorkpackages.includes('WP-E13-13'), 'RC1 readiness report marks WP-E13-13 ready');
  context.assert(report.publishAllowed === false, 'RC1 readiness report blocks publish');
  assertIncludesAll(context, model.sourceSchemas, REQUIRED_SOURCE_SCHEMAS, 'Source schemas');
  assertIncludesAll(context, model.baselineGates, REQUIRED_BASELINE_GATES, 'Baseline gates');
  context.assert(Object.values(model.baselineValidations).every(Boolean), 'All RC0 baseline validations are green');
  context.assert(model.gateMappings.some((entry) => entry.goalpost === 'conditional-network-gates' && entry.status === 'conditional'), 'RC1 readiness keeps network gates conditional');
  context.assert(model.gateMappings.some((entry) => entry.goalpost === 'performance-regression' && entry.rc1Decision === 'carry-forward-after-owner-free-closure'), 'RC1 readiness tracks hydration performance closure');
  context.assert(model.gateMappings.some((entry) => entry.goalpost === 'manifest-security' && entry.rc1Decision === 'carry-forward-with-prod-csp-smoke'), 'RC1 readiness tracks PROD CSP smoke preparation');
  context.assert(model.gateMappings.some((entry) => entry.goalpost === 'browser-smoke' && entry.status === 'available-prod-csp-prepared'), 'RC1 readiness tracks PROD-like browser smoke preparation');
  context.assert(model.gateGaps.some((entry) => entry.id === 'package-export-lock'), 'RC1 readiness captures package export lock gap');
  context.assert(model.gateGaps.some((entry) => entry.id === 'rmt-production-readiness'), 'RC1 readiness captures RMT production readiness gap');
  context.assert(model.gateGaps.some((entry) => entry.id === 'docs-rmt-production-hardening'), 'RC1 readiness captures Docs RMT production hardening gap');
  context.assert(model.featureDriftDecisions.every((entry) => entry.decision !== 'accepted'), 'RC1 readiness rejects feature drift');
  context.assert(model.rc0Snapshot.completedEpic12Workpackages === 16, 'RC1 readiness captures Epic 12 completion');
  context.assert(model.rc0Snapshot.rc0KpiFailed === 0, 'RC1 readiness captures clean RC0 KPI state');
  context.assert(model.rc0Snapshot.visualSnapshotDomDiffCount === 0, 'RC1 readiness captures clean RC0 DOM snapshots');
  context.assert(model.rc1Inputs.conditionalNetworkGates.includes('npm audit --audit-level=moderate'), 'RC1 readiness captures npm audit gate');
  context.assert(model.rc1Inputs.conditionalNetworkGates.includes('npm sbom --sbom-format=cyclonedx --json'), 'RC1 readiness captures npm sbom gate');

  context.assert(packageManifest.private === false, 'Package is public-ready for RC1 readiness');
  context.assert((packageManifest.exports['./catalog/epic13-rc1-readiness'] === './catalog/epic13-rc1-readiness.js' || (packageManifest.exports['./catalog/epic13-rc1-readiness'] && packageManifest.exports['./catalog/epic13-rc1-readiness'].default === './catalog/epic13-rc1-readiness.js')), 'Package exports Epic 13 RC1 readiness module');
  context.assert(packageManifest.scripts['test:epic13-rc1-readiness'] === 'node scripts/run_xtend_tests.js epic13-rc1-readiness', 'Package exposes Epic 13 RC1 readiness script');
  context.assert(packageManifest.xtend.releaseGates.includes(EPIC13_RC1_READINESS_PACKAGE_SCRIPT), 'Package release gates include RC1 readiness script');
  context.assert(packageManifest.xtend.releaseChecklist.candidateGates.includes(EPIC13_RC1_READINESS_PACKAGE_SCRIPT), 'Release checklist metadata includes RC1 readiness script');
  context.assert(metadata && metadata.schema === EPIC13_RC1_READINESS_SCHEMA, 'Package metadata exposes RC1 readiness schema');
  context.assert(metadata && metadata.workpackage === EPIC13_RC1_READINESS_WORKPACKAGE, 'Package metadata exposes WP-E13-01');
  context.assert(metadata && metadata.targetReadiness === EPIC13_RC1_READINESS_TARGET, 'Package metadata exposes RC1 target readiness');
  context.assert(metadata && metadata.nextWorkpackage === 'WP-E13-13', 'Package metadata exposes next workpackage');
  context.assert(metadata && metadata.localGate === EPIC13_RC1_READINESS_LOCAL_GATE, 'Package metadata exposes RC1 readiness local gate');
  context.assert(metadata && metadata.publishAllowed === false, 'Package metadata blocks RC1 readiness publish');
  context.assert(Array.isArray(metadata && metadata.gateGaps) && metadata.gateGaps.includes('package-export-lock'), 'Package metadata exposes gate gaps');
  context.assertIncludes(scaffoldConfig, 'epic13Rc1Readiness', 'Scaffold config exposes Epic 13 RC1 readiness metadata');
  context.assertIncludes(scaffoldConfig, EPIC13_RC1_READINESS_SCHEMA, 'Scaffold config declares RC1 readiness schema');
  context.assertIncludes(scaffoldConfig, EPIC13_RC1_READINESS_LOCAL_GATE, 'Scaffold config references RC1 readiness local gate');
  context.assertIncludes(runner, "id: 'epic13-rc1-readiness'", 'Runner registers Epic 13 RC1 readiness suite');

  assertTextIncludesAll(context, steering, [
    EPIC13_RC1_READINESS_SCHEMA,
    '| `WP-E13-01` | P0 | completed | WS0 | RC1 Readiness Model und Gate-Abgleich einfrieren |',
    '| `WP-E13-02` | P0 | completed | WS0 | Release Owner Acceptance Contract definieren |',
    '| `WP-E13-03` | P0 | completed | WS1 | Conditional Network Gate Evidence vorbereiten |',
    '| `WP-E13-04` | P0 | completed | WS1 | Package Dry Run Artefakt und Export-Surface-Lock bauen |',
    '| `WP-E13-05` | P0 | completed | WS2 | RC0 Known Residuals fuer RC1 triagieren |',
    '| `WP-E13-06` | P0 | completed | WS2 | Hydration Performance Warning schliessen oder RC1 Owner-Entscheid bauen |',
    '| `WP-E13-07` | P1 | completed | WS3 | PROD-nahe Browser-, Local-Server- und CSP-Smokes vorbereiten |',
    '| `WP-E13-08` | P1 | completed | WS3 | Visual Screenshot/Pixels als RC1-Artefakt normalisieren |',
    '| `WP-E13-09` | P1 | completed | WS4 | RMT-first App Production Readiness Gate buendeln |',
    '| `WP-E13-10` | P1 | completed | WS4 | Docs-App RMT Parsedown Shell fuer PROD-nahe Erweiterungen haerten |',
    '| `WP-E13-11` | P1 | completed | WS5 | Trusted DOM, Parsedown und RMT HTML Boundary browsernah pruefen |',
    '| `WP-E13-12` | P1 | completed | WS6 | RC1 Migration Notes, SemVer-Entscheid und Changelog vorbereiten |',
    'Feature-Drift-Bereinigung',
    'RC0 Gate-Abgleich',
    'Offene Gate-Luecken fuer RC1',
    'Handoff nach WP-E13-01'
  ], 'Epic 13 steering document');
  assertTextIncludesAll(context, contract, [
    EPIC13_RC1_READINESS_SCHEMA,
    EPIC13_RC1_READINESS_LOCAL_GATE,
    'RC0 Gate-Abgleich',
    'Gate-Luecken',
    'Feature Drift',
    'WP-E13-02'
  ], 'Epic 13 RC1 readiness contract');
  assertTextIncludesAll(context, workpackage, [
    'xtend.epic13.wp01.rc1-readiness-model.v1',
    'Status: `completed`',
    EPIC13_RC1_READINESS_SCHEMA,
    EPIC13_RC1_READINESS_LOCAL_GATE,
    'WP-E13-02'
  ], 'WP-E13-01 workpackage');
  assertTextIncludesAll(context, docs, [
    EPIC13_RC1_READINESS_SCHEMA,
    EPIC13_RC1_READINESS_LOCAL_GATE,
    EPIC13_RC1_READINESS_TARGET,
    'Release Owner Acceptance',
    'Conditional Network Gates',
    'Package Dry Run',
    'Feature Drift'
  ], 'RC1 readiness docs');
  assertTextIncludesAll(context, registry, [
    EPIC13_RC1_READINESS_MODULE,
    EPIC13_RC1_READINESS_CONTRACT,
    EPIC13_RC1_READINESS_DOCS,
    EPIC13_RC1_READINESS_SUITE,
    EPIC13_RC1_READINESS_LOCAL_GATE
  ], 'Reference registry');
  context.assertIncludes(docsReadme, './rc1-readiness.md', 'Docs README links RC1 readiness');
  context.assertIncludes(docsMenu, 'rc1-readiness', 'Docs menu exposes RC1 readiness');
  context.assertIncludes(testsReadme, EPIC13_RC1_READINESS_LOCAL_GATE, 'Tests README documents RC1 readiness gate');
  context.assertIncludes(readme, 'xtend.epic13Rc1Readiness', 'Root README documents RC1 readiness metadata');
  context.assertIncludes(changelog, EPIC13_RC1_READINESS_SCHEMA, 'Changelog records RC1 readiness model');

  return context.result({
    report: {
      schema: EPIC13_RC1_READINESS_REPORT_SCHEMA,
      gateMappingCount: report.gateMappingCount,
      gateGapCount: report.gateGapCount,
      workpackageCount: report.workpackageCount,
      completedWorkpackages: report.completedWorkpackages,
      readyWorkpackages: report.readyWorkpackages,
      targetReadiness: report.targetReadiness,
      publishAllowed: report.publishAllowed,
      nextWorkpackage: report.nextWorkpackage
    }
  });
}

function printEpic13Rc1ReadinessReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 13 RC1 Readiness erfolgreich.',
    failureTitle: 'Epic 13 RC1 Readiness fehlgeschlagen:'
  });
}

module.exports = {
  printEpic13Rc1ReadinessReport,
  runEpic13Rc1ReadinessSuite
};
