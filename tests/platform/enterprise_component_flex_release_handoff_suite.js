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
  LEGACY_ALIASES,
  P0_COMPONENTS
} = require('../../design-tokens/xtheme-token-alias-layer');
const {
  ADOPTION_RISKS,
  COMPATIBILITY_ALIASES,
  CURRENT_VERSION,
  ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_DOC,
  ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_LOCAL_GATE,
  ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_MODULE,
  ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_PACKAGE_SCRIPT,
  ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_REPORT_SCHEMA,
  ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_SCHEMA,
  ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_STATUS,
  ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_SUITE,
  ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_TARGET,
  ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_WORKPACKAGE,
  MIGRATION_SECTIONS,
  PROPOSED_VERSION,
  PUBLISH_BOUNDARY,
  RELEASE_CHECKLIST,
  RELEASE_GATES,
  REQUIRED_WORKPACKAGES,
  SEMVER_IMPACTS,
  SOURCE_GATES,
  createEnterpriseComponentFlexReleaseHandoff,
  createEnterpriseComponentFlexReleaseHandoffReport,
  validateEnterpriseComponentFlexReleaseHandoff
} = require('../../catalog/enterprise-component-flex-release-handoff');

const BACKLOG_PATH = 'development/XTend-Enterprise-Component-Flexibilitaets-und-Theme-Hardening-Backlog.md';
const DOCS_README = 'docs/README.md';
const DOCS_MENU = 'docs/menu.json';
const ENTERPRISE_ADOPTION_DOC = 'docs/enterprise-adoption.md';
const THIRD_PARTY_AUTHORING_DOC = 'docs/third-party-design-authoring.md';
const RELEASE_POLICY_DOC = 'development/XTend-Release-Checklist-und-SemVer-Policy.md';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertTextIncludesAll(context, source, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(source, entry, `${label} includes ${entry}`);
  });
}

function runEnterpriseComponentFlexReleaseHandoffSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'enterprise-component-flex-release-handoff',
    label: 'ECH-WP-12 Enterprise Component Flex Release Handoff'
  });
  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const docsReadme = readText(DOCS_README, rootDir);
  const docsMenu = readJson(DOCS_MENU, rootDir);
  const enterpriseAdoption = readText(ENTERPRISE_ADOPTION_DOC, rootDir);
  const thirdPartyAuthoring = readText(THIRD_PARTY_AUTHORING_DOC, rootDir);
  const handoffDoc = readText(ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_DOC, rootDir);
  const moduleSource = readText(ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_MODULE, rootDir);
  const suiteSource = readText(ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_SUITE, rootDir);
  const handoff = createEnterpriseComponentFlexReleaseHandoff();
  const validation = validateEnterpriseComponentFlexReleaseHandoff(handoff);
  const invalidValidation = validateEnterpriseComponentFlexReleaseHandoff({
    schema: ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_SCHEMA,
    reportSchema: ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_REPORT_SCHEMA,
    workpackage: ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_WORKPACKAGE,
    status: ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_STATUS,
    targetReadiness: ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_TARGET,
    currentVersion: CURRENT_VERSION,
    proposedVersion: PROPOSED_VERSION,
    publishBoundary: PUBLISH_BOUNDARY,
    publishAllowed: true,
    packagePrivateRequired: false,
    semverDecision: {
      classification: 'major-breaking',
      breakingChanges: ['removed-defaults']
    },
    compatibility: {
      existingDefaultsRemainCompatible: false,
      newModesAreAdditive: false,
      breakingChangesAvoided: false,
      deprecatedAliasesRemainBridged: false
    },
    requiredWorkpackages: ['ECH-WP-12'],
    sourceGates: [],
    releaseGates: [],
    deprecatedAliases: [],
    migrationSections: [],
    releaseChecklist: [],
    adoptionRisks: [],
    handoff: {
      decision: 'publish-now'
    }
  });
  const report = createEnterpriseComponentFlexReleaseHandoffReport({ rootDir, handoff });
  const moduleSyntax = syntaxCheckFile(ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_SUITE, { rootDir, extension: '.js' });

  [
    ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_MODULE,
    ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_DOC,
    ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_SUITE,
    BACKLOG_PATH,
    DOCS_README,
    DOCS_MENU,
    ENTERPRISE_ADOPTION_DOC,
    THIRD_PARTY_AUTHORING_DOC,
    RELEASE_POLICY_DOC
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });

  context.assert(moduleSyntax.ok, `Enterprise component flex release handoff module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Enterprise component flex release handoff suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(handoff.schema === ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_SCHEMA, 'Release handoff factory emits schema');
  context.assert(handoff.reportSchema === ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_REPORT_SCHEMA, 'Release handoff factory emits report schema');
  context.assert(handoff.workpackage === ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_WORKPACKAGE, 'Release handoff binds ECH-WP-12');
  context.assert(handoff.status === ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_STATUS, 'Release handoff status is accepted');
  context.assert(handoff.targetReadiness === ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_TARGET, 'Release handoff targets enterprise design-system readiness');
  context.assert(handoff.currentVersion === CURRENT_VERSION, 'Release handoff records current package version');
  context.assert(handoff.proposedVersion === PROPOSED_VERSION, 'Release handoff records proposed RC version');
  context.assert(handoff.publishBoundary === PUBLISH_BOUNDARY, 'Release handoff records private publish boundary');
  context.assert(handoff.publishAllowed === false, 'Release handoff keeps publish blocked');
  context.assert(handoff.packagePrivateRequired === true, 'Release handoff requires private package boundary');
  context.assert(validation.ok === true, 'Release handoff validator accepts generated handoff');
  context.assert(invalidValidation.ok === false, 'Release handoff validator rejects publish-breaking input');
  context.assert(report.ok === true, 'Release handoff report has no blocking findings');
  context.assert(report.sourceGateCount === SOURCE_GATES.length, 'Release handoff report counts source gates');
  context.assert(report.releaseGateCount === RELEASE_GATES.length, 'Release handoff report counts release gates');
  context.assert(report.deprecatedAliasCount === LEGACY_ALIASES.length + 4, 'Release handoff report counts legacy and compatibility aliases');
  context.assert(report.migrationSectionCount === MIGRATION_SECTIONS.length, 'Release handoff report counts migration sections');
  context.assert(report.adoptionRiskCount === ADOPTION_RISKS.length, 'Release handoff report counts adoption risks');

  context.assert(handoff.semverDecision.classification === 'minor-pre-1.0-additive-public-api-hardening', 'SemVer decision is additive pre-1.0 minor hardening');
  context.assert(handoff.semverDecision.breakingChanges.length === 0, 'SemVer decision lists no breaking changes');
  context.assert(handoff.compatibility.existingDefaultsRemainCompatible === true, 'Existing defaults remain compatible');
  context.assert(handoff.compatibility.newModesAreAdditive === true, 'New modes are additive');
  context.assert(handoff.compatibility.breakingChangesAvoided === true, 'Breaking changes are avoided');
  context.assert(handoff.compatibility.deprecatedAliasesRemainBridged === true, 'Deprecated aliases remain bridged');
  P0_COMPONENTS.forEach((tag) => {
    context.assert(handoff.compatibility.p0Components.includes(tag), `P0 component ${tag} remains in compatibility scope`);
  });

  assertTextIncludesAll(context, handoffDoc, [
    ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_SCHEMA,
    ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_LOCAL_GATE,
    ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_PACKAGE_SCRIPT,
    CURRENT_VERSION,
    PROPOSED_VERSION,
    PUBLISH_BOUNDARY,
    'SemVer-Bewertung',
    'Deprecated Aliases',
    'Migration Notes',
    'Release Checklist',
    'Adoption Risiken',
    'enterprise-design-system-ready-release-owner-review',
    'Breaking Changes: keine'
  ], 'Release handoff doc');
  REQUIRED_WORKPACKAGES.forEach((id) => {
    context.assert(handoff.requiredWorkpackages.includes(id), `Handoff requires ${id}`);
  });
  SEMVER_IMPACTS.forEach((entry) => {
    context.assertIncludes(handoffDoc, entry.id, `Handoff docs include SemVer impact ${entry.id}`);
    context.assert(entry.defaultCompatible === true, `${entry.id} remains default compatible`);
  });
  COMPATIBILITY_ALIASES.forEach((entry) => {
    context.assertIncludes(handoffDoc, entry.deprecated, `Handoff docs include deprecated alias ${entry.deprecated}`);
    context.assertIncludes(handoffDoc, entry.replacement, `Handoff docs include alias replacement ${entry.replacement}`);
  });
  MIGRATION_SECTIONS.forEach((entry) => {
    context.assertIncludes(handoffDoc, entry.id, `Handoff docs include migration section ${entry.id}`);
  });
  RELEASE_CHECKLIST.forEach((item) => {
    context.assertIncludes(handoffDoc, item, `Handoff docs include checklist item ${item}`);
  });
  ADOPTION_RISKS.forEach((entry) => {
    context.assertIncludes(handoffDoc, entry.id, `Handoff docs include adoption risk ${entry.id}`);
  });
  SOURCE_GATES.forEach((gate) => {
    context.assertIncludes(handoffDoc, gate, `Handoff docs include source gate ${gate}`);
  });
  RELEASE_GATES.forEach((gate) => {
    context.assertIncludes(handoffDoc, gate, `Handoff docs include release gate ${gate}`);
  });

  assertTextIncludesAll(context, moduleSource, [
    ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_SCHEMA,
    'createEnterpriseComponentFlexReleaseHandoff',
    'validateEnterpriseComponentFlexReleaseHandoff',
    'createEnterpriseComponentFlexReleaseHandoffReport',
    'SEMVER_IMPACTS',
    'COMPATIBILITY_ALIASES',
    'MIGRATION_SECTIONS',
    'RELEASE_CHECKLIST',
    'ADOPTION_RISKS'
  ], 'Release handoff module');
  context.assertIncludes(suiteSource, 'ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_REPORT_SCHEMA', 'Suite source declares report schema');

  const menuSlugs = docsMenu.map((entry) => entry.slug);
  context.assert(menuSlugs.includes('enterprise-component-flex-release-handoff'), 'Docs menu exposes enterprise-component-flex-release-handoff');
  context.assertIncludes(docsReadme, 'enterprise-component-flex-release-handoff.md', 'Docs README links release handoff');
  context.assertIncludes(docsReadme, ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_SCHEMA, 'Docs README documents release handoff schema');
  context.assertIncludes(enterpriseAdoption, ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_SCHEMA, 'Enterprise Adoption links release handoff schema');
  context.assertIncludes(enterpriseAdoption, ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_LOCAL_GATE, 'Enterprise Adoption documents release handoff gate');
  context.assertIncludes(thirdPartyAuthoring, ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_SCHEMA, 'Third-party authoring guide links release handoff schema');
  context.assertIncludes(thirdPartyAuthoring, ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_LOCAL_GATE, 'Third-party authoring guide documents release handoff gate');

  context.assertIncludes(backlog, '| `ECH-WP-12` | P2 | completed |', 'Backlog marks ECH-WP-12 completed');
  context.assertIncludes(backlog, ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_DOC, 'Backlog links release handoff doc');
  context.assertIncludes(backlog, ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_LOCAL_GATE, 'Backlog exposes release handoff local gate');
  context.assertIncludes(backlog, PROPOSED_VERSION, 'Backlog records proposed version');
  context.assertIncludes(runner, "id: 'enterprise-component-flex-release-handoff'", 'Runner exposes release handoff suite');
  context.assertIncludes(runner, 'runEnterpriseComponentFlexReleaseHandoffSuite', 'Runner imports release handoff suite');
  context.assert(packageManifest.scripts['test:enterprise-component-flex-release-handoff'] === 'node scripts/run_xtend_tests.js enterprise-component-flex-release-handoff', 'Package exposes release handoff script');

  return context.result({
    report: {
      schema: ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_REPORT_SCHEMA,
      workpackage: ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_WORKPACKAGE,
      docs: ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_DOC,
      sourceGateCount: report.sourceGateCount,
      releaseGateCount: report.releaseGateCount,
      deprecatedAliasCount: report.deprecatedAliasCount,
      migrationSectionCount: report.migrationSectionCount,
      adoptionRiskCount: report.adoptionRiskCount,
      localGate: ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_LOCAL_GATE
    }
  });
}

function printEnterpriseComponentFlexReleaseHandoffReport(result) {
  printSuiteReport(result, {
    successTitle: 'ECH-WP-12 Enterprise Component Flex Release Handoff erfolgreich.',
    failureTitle: 'ECH-WP-12 Enterprise Component Flex Release Handoff fehlgeschlagen:'
  });
}

module.exports = {
  printEnterpriseComponentFlexReleaseHandoffReport,
  runEnterpriseComponentFlexReleaseHandoffSuite
};
