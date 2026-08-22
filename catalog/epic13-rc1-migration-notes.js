const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');
const {
  EPIC13_RELEASE_OWNER_ACCEPTANCE_SCHEMA,
  createEpic13ReleaseOwnerAcceptanceContract,
  createEpic13ReleaseOwnerAcceptanceReport,
  validateEpic13ReleaseOwnerAcceptanceContract
} = require('./epic13-release-owner-acceptance');
const {
  EPIC13_TRUSTED_DOM_BOUNDARY_REPORT_SCHEMA,
  EPIC13_TRUSTED_DOM_BOUNDARY_SCHEMA,
  createEpic13TrustedDomBoundaryPlan,
  createEpic13TrustedDomBoundaryReport,
  validateEpic13TrustedDomBoundaryPlan
} = require('./epic13-trusted-dom-boundary');

const EPIC13_RC1_MIGRATION_NOTES_SCHEMA = 'xtend.epic13.rc1-migration-notes-semver.v1';
const EPIC13_RC1_MIGRATION_NOTES_REPORT_SCHEMA = 'xtend.epic13.rc1-migration-notes-semver-report.v1';
const EPIC13_RC1_MIGRATION_NOTES_WORKPACKAGE = 'WP-E13-12';
const EPIC13_RC1_MIGRATION_NOTES_STATUS = 'accepted-rc1-migration-notes-semver-changelog';
const EPIC13_RC1_MIGRATION_NOTES_TARGET = 'rc1-consumer-communication-ready';
const EPIC13_RC1_MIGRATION_NOTES_MODULE = 'catalog/epic13-rc1-migration-notes.js';
const EPIC13_RC1_MIGRATION_NOTES_SUITE = 'tests/platform/epic13_rc1_migration_notes_suite.js';
const EPIC13_RC1_MIGRATION_NOTES_STEERING = 'development/RC0-RC1-transfer-EPIC13.md';
const EPIC13_RC1_MIGRATION_NOTES_CONTRACT = 'development/XTend-Epic13-RC1-Migration-Notes-und-SemVer-Entscheid.md';
const EPIC13_RC1_MIGRATION_NOTES_WORKPACKAGE_DOC = 'development/WP-E13-12-RC1-Migration-Notes-SemVer-Entscheid-und-Changelog-vorbereiten.md';
const EPIC13_RC1_MIGRATION_NOTES_DOCS = 'docs/rc1-migration-notes.md';
const EPIC13_RC1_MIGRATION_NOTES_LOCAL_GATE = 'node scripts/run_xtend_tests.js epic13-rc1-migration-notes --json';
const EPIC13_RC1_MIGRATION_NOTES_PACKAGE_SCRIPT = 'npm run test:epic13-rc1-migration-notes';
const EPIC13_RC1_MIGRATION_NOTES_REPORT_ARTIFACT = '.xtend-test-results/xtend-epic13-rc1-migration-notes-report.json';
const NEXT_DECISION = 'rc1-gate-matrix-ci-handoff';
const NEXT_WORKPACKAGE = 'WP-E13-13';
const PUBLISH_BOUNDARY = 'private-until-release-owner-acceptance';
const CURRENT_VERSION = '0.1.0-rc.1';
const PROPOSED_VERSION = '0.1.0-rc.1';

const REQUIRED_SOURCE_GATES = Object.freeze([
  'npm run test:epic13-package-export-lock',
  'npm run test:epic13-known-residual-triage',
  'npm run test:epic13-trusted-dom-boundary',
  'npm run test:epic13-release-owner-acceptance'
]);

const REQUIRED_MIGRATION_SECTIONS = Object.freeze([
  'loader-local-esm-cdn-free',
  'package-export-surface',
  'rmt-first-app-authoring',
  'docs-rmt-parsedown-shell',
  'trusted-dom-boundary',
  'fabric-lanes-telemetry',
  'component-typescript-and-dts',
  'known-residuals-and-watchpoints',
  'visual-owner-artifacts',
  'conditional-network-evidence',
  'publish-boundary'
]);

const REQUIRED_CHANGELOG_SECTIONS = Object.freeze([
  'Added',
  'Changed',
  'Security',
  'Migration Notes',
  'SemVer Decision',
  'Known Residuals',
  'Release Gates'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  EPIC13_RC1_MIGRATION_NOTES_STEERING,
  EPIC13_RC1_MIGRATION_NOTES_CONTRACT,
  EPIC13_RC1_MIGRATION_NOTES_WORKPACKAGE_DOC,
  EPIC13_RC1_MIGRATION_NOTES_DOCS,
  'CHANGELOG.md',
  'README.md',
  'package.json',
  'xtend-builder/scaffold.config.js',
  'development/XTend-Release-Checklist-und-SemVer-Policy.md',
  'development/XTend-CI-Gate-Matrix.md',
  'development/XTend-Epic13-RC1-Readiness-Modell.md',
  'development/XTend-Epic13-Release-Owner-Acceptance-Contract.md',
  'development/XTend-Epic13-Package-Export-Lock-Contract.md',
  'docs/en/README.md',
  'docs/menu.json',
  'development/docs-evidence/legacy-routes/en/rc1-readiness.md',
  'development/docs-evidence/legacy-routes/en/release-owner-acceptance.md',
  'docs/en/trusted-dom-boundary-browser-proof.md'
]);

function createMigrationSection(id, owner, evidence, risk, action) {
  return {
    id,
    owner,
    evidence,
    risk,
    action,
    consumerFacing: true
  };
}

function createEpic13Rc1MigrationNotesPlan(options = {}) {
  const trustedDomPlan = options.trustedDomPlan || createEpic13TrustedDomBoundaryPlan(options);
  const trustedDomValidation = options.trustedDomValidation || validateEpic13TrustedDomBoundaryPlan(trustedDomPlan);
  const trustedDomReport = options.trustedDomReport || createEpic13TrustedDomBoundaryReport({ ...options, plan: trustedDomPlan });
  const ownerContract = options.ownerContract || createEpic13ReleaseOwnerAcceptanceContract(options);
  const ownerValidation = options.ownerValidation || validateEpic13ReleaseOwnerAcceptanceContract(ownerContract);
  const ownerReport = options.ownerReport || createEpic13ReleaseOwnerAcceptanceReport({ ...options, contract: ownerContract });

  return {
    schema: EPIC13_RC1_MIGRATION_NOTES_SCHEMA,
    reportSchema: EPIC13_RC1_MIGRATION_NOTES_REPORT_SCHEMA,
    workpackage: EPIC13_RC1_MIGRATION_NOTES_WORKPACKAGE,
    status: EPIC13_RC1_MIGRATION_NOTES_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    module: EPIC13_RC1_MIGRATION_NOTES_MODULE,
    suite: EPIC13_RC1_MIGRATION_NOTES_SUITE,
    steeringDocument: EPIC13_RC1_MIGRATION_NOTES_STEERING,
    contract: EPIC13_RC1_MIGRATION_NOTES_CONTRACT,
    workpackageDocument: EPIC13_RC1_MIGRATION_NOTES_WORKPACKAGE_DOC,
    docs: EPIC13_RC1_MIGRATION_NOTES_DOCS,
    localGate: EPIC13_RC1_MIGRATION_NOTES_LOCAL_GATE,
    packageScript: EPIC13_RC1_MIGRATION_NOTES_PACKAGE_SCRIPT,
    reportArtifact: EPIC13_RC1_MIGRATION_NOTES_REPORT_ARTIFACT,
    sourceSchema: EPIC13_TRUSTED_DOM_BOUNDARY_SCHEMA,
    sourceReportSchema: EPIC13_TRUSTED_DOM_BOUNDARY_REPORT_SCHEMA,
    sourceStatus: trustedDomPlan.status,
    sourceValidationOk: trustedDomValidation.ok,
    sourceReportOk: trustedDomReport.ok,
    ownerSourceSchema: EPIC13_RELEASE_OWNER_ACCEPTANCE_SCHEMA,
    ownerSourceValidationOk: ownerValidation.ok,
    ownerSourceReportOk: ownerReport.ok,
    targetReadiness: EPIC13_RC1_MIGRATION_NOTES_TARGET,
    currentVersion: CURRENT_VERSION,
    proposedVersion: PROPOSED_VERSION,
    semverDecision: {
      phase: 'pre-1.0-enterprise-rc',
      classification: 'minor-pre-1.0-release-candidate',
      currentVersion: CURRENT_VERSION,
      proposedVersion: PROPOSED_VERSION,
      publicSurfaceChanged: true,
      breakingChangeAllowedPre1: true,
      migrationNotesRequired: true,
      changelogRequired: true,
      publishAllowed: false,
      packagePrivateRequired: true
    },
    sourceGates: REQUIRED_SOURCE_GATES.slice(),
    migrationSections: [
      createMigrationSection('loader-local-esm-cdn-free', 'xtend-loader', 'xtend-loader.js, docs/index.php, manifest policy', 'Apps with CDN-era bootstrap assumptions must switch to local ESM loader paths.', 'Use local server and same-origin ESM modules; do not load deprecated CDN xtend-state.'),
      createMigrationSection('package-export-surface', 'package', 'catalog/epic13-package-export-lock.js', 'Consumers should rely on documented exports only.', 'Use the locked export map and treat catalog gates as explicit public tooling exports.'),
      createMigrationSection('rmt-first-app-authoring', 'xtendrmt', 'docs/rmt-first-xtend-apps.md', 'Manual shells should not become the default app integration path.', 'Template app shells in RMT and keep XTend adapters outside the kernel.'),
      createMigrationSection('docs-rmt-parsedown-shell', 'docs', 'docs/docs-rmt-production-hardening.md', 'Parsedown HTML remains DOM-untrusted even with RMT orchestration.', 'Schedule Parsedown as a component and sanitize before DOM sinks.'),
      createMigrationSection('trusted-dom-boundary', 'security', 'docs/en/trusted-dom-boundary-browser-proof.md', 'HTML fragments and Markdown output can cross unsafe DOM boundaries.', 'Prefer dom_descriptor and route html_fragment through the Trusted-DOM sanitizer.'),
      createMigrationSection('fabric-lanes-telemetry', 'fabric', 'fabric/xtend-fabric.js', 'Telemetry integrations need stable lane semantics.', 'Use Fabric adapters and RMT lane mappings instead of component-local scheduler assumptions.'),
      createMigrationSection('component-typescript-and-dts', 'components', 'components/*.d.ts', 'Component APIs now carry stronger type and metadata contracts.', 'Consume generated d.ts files and keep component metadata aligned with manifests.'),
      createMigrationSection('known-residuals-and-watchpoints', 'release-owner', 'docs/known-residual-triage.md', 'Closed residuals can reappear when old loaders or utility boundaries are bypassed.', 'Keep xtend-state and x-utils as boundary contracts and monitor hydration watchpoints.'),
      createMigrationSection('visual-owner-artifacts', 'quality', 'docs/visual-owner-artifacts.md', 'Visual acceptance remains owner-artifact based in local static mode.', 'Attach CI screenshots or owner-reviewed artifacts before publish approval.'),
      createMigrationSection('conditional-network-evidence', 'supply-chain', 'docs/conditional-network-evidence.md', 'Audit and SBOM still require executed evidence or owner deferral.', 'Run or defer network gates explicitly before RC1 publish approval.'),
      createMigrationSection('publish-boundary', 'release-owner', 'package.json private=true', 'No automatic publish is allowed before RC1 owner acceptance.', 'Keep package private and require a final owner decision.')
    ],
    requiredChangelogSections: REQUIRED_CHANGELOG_SECTIONS.slice(),
    artifactPaths: REQUIRED_ARTIFACTS.slice(),
    consumerAudiences: [
      'app-authors',
      'component-authors',
      'release-owners',
      'security-reviewers',
      'ci-maintainers'
    ],
    docsMenuSlug: 'rc1-migration-notes',
    frameworkAgnostic: true,
    rmtKernelImportsXtendTypes: false,
    kernelBoundary: KERNEL_BOUNDARY,
    nextDecision: NEXT_DECISION,
    nextWorkpackage: NEXT_WORKPACKAGE,
    publishBoundary: PUBLISH_BOUNDARY,
    publishAllowed: false,
    packagePrivateRequired: true
  };
}

function validateEpic13Rc1MigrationNotesPlan(plan = createEpic13Rc1MigrationNotesPlan()) {
  const errors = [];
  const semver = plan && plan.semverDecision ? plan.semverDecision : {};

  if (!plan || plan.schema !== EPIC13_RC1_MIGRATION_NOTES_SCHEMA) errors.push(`schema must be ${EPIC13_RC1_MIGRATION_NOTES_SCHEMA}`);
  if (!plan || plan.reportSchema !== EPIC13_RC1_MIGRATION_NOTES_REPORT_SCHEMA) errors.push(`reportSchema must be ${EPIC13_RC1_MIGRATION_NOTES_REPORT_SCHEMA}`);
  if (!plan || plan.workpackage !== EPIC13_RC1_MIGRATION_NOTES_WORKPACKAGE) errors.push(`workpackage must be ${EPIC13_RC1_MIGRATION_NOTES_WORKPACKAGE}`);
  if (!plan || plan.status !== EPIC13_RC1_MIGRATION_NOTES_STATUS) errors.push(`status must be ${EPIC13_RC1_MIGRATION_NOTES_STATUS}`);
  if (!plan || plan.sourceSchema !== EPIC13_TRUSTED_DOM_BOUNDARY_SCHEMA) errors.push('source schema must be Trusted DOM boundary');
  if (!plan || plan.sourceValidationOk !== true || plan.sourceReportOk !== true) errors.push('Trusted DOM source must validate');
  if (!plan || plan.ownerSourceSchema !== EPIC13_RELEASE_OWNER_ACCEPTANCE_SCHEMA) errors.push('owner source schema must be release owner acceptance');
  if (!plan || plan.ownerSourceValidationOk !== true || plan.ownerSourceReportOk !== true) errors.push('release owner acceptance source must validate');
  if (!plan || plan.targetReadiness !== EPIC13_RC1_MIGRATION_NOTES_TARGET) errors.push(`targetReadiness must be ${EPIC13_RC1_MIGRATION_NOTES_TARGET}`);
  if (!semver || semver.proposedVersion !== PROPOSED_VERSION) errors.push(`proposedVersion must be ${PROPOSED_VERSION}`);
  if (!semver || semver.currentVersion !== CURRENT_VERSION) errors.push(`currentVersion must be ${CURRENT_VERSION}`);
  if (!semver || semver.classification !== 'minor-pre-1.0-release-candidate') errors.push('semver classification must be minor pre-1.0 RC');
  if (!semver || semver.publicSurfaceChanged !== true || semver.migrationNotesRequired !== true || semver.changelogRequired !== true) errors.push('semver decision must require public migration notes and changelog');
  if (!semver || semver.publishAllowed !== false || semver.packagePrivateRequired !== true) errors.push('semver decision must keep publish blocked and package private');
  REQUIRED_SOURCE_GATES.forEach((gate) => {
    if (!plan || !plan.sourceGates.includes(gate)) errors.push(`source gate missing: ${gate}`);
  });
  REQUIRED_MIGRATION_SECTIONS.forEach((section) => {
    if (!plan || !plan.migrationSections.some((entry) => entry.id === section)) errors.push(`migration section missing: ${section}`);
  });
  REQUIRED_CHANGELOG_SECTIONS.forEach((section) => {
    if (!plan || !plan.requiredChangelogSections.includes(section)) errors.push(`changelog section missing: ${section}`);
  });
  REQUIRED_ARTIFACTS.forEach((artifact) => {
    if (!plan || !plan.artifactPaths.includes(artifact)) errors.push(`artifact missing: ${artifact}`);
  });
  if (!plan || plan.docsMenuSlug !== 'rc1-migration-notes') errors.push('docs menu slug must be rc1-migration-notes');
  if (!plan || plan.frameworkAgnostic !== true || plan.rmtKernelImportsXtendTypes !== false) errors.push('migration notes must preserve RMT framework agnosticism');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.nextDecision !== NEXT_DECISION) errors.push(`next decision must be ${NEXT_DECISION}`);
  if (!plan || plan.nextWorkpackage !== NEXT_WORKPACKAGE) errors.push(`next workpackage must be ${NEXT_WORKPACKAGE}`);
  if (!plan || plan.publishBoundary !== PUBLISH_BOUNDARY) errors.push(`publishBoundary must be ${PUBLISH_BOUNDARY}`);
  if (!plan || plan.publishAllowed !== false || plan.packagePrivateRequired !== true) errors.push('publish must remain blocked and package private');

  return {
    schema: EPIC13_RC1_MIGRATION_NOTES_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createEpic13Rc1MigrationNotesReport(options = {}) {
  const plan = options.plan || createEpic13Rc1MigrationNotesPlan(options);
  const validation = validateEpic13Rc1MigrationNotesPlan(plan);

  return {
    schema: EPIC13_RC1_MIGRATION_NOTES_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    plan,
    migrationSectionCount: plan.migrationSections.length,
    changelogSectionCount: plan.requiredChangelogSections.length,
    proposedVersion: plan.semverDecision.proposedVersion,
    publishAllowed: plan.publishAllowed,
    nextWorkpackage: plan.nextWorkpackage
  };
}

module.exports = {
  CURRENT_VERSION,
  EPIC13_RC1_MIGRATION_NOTES_CONTRACT,
  EPIC13_RC1_MIGRATION_NOTES_DOCS,
  EPIC13_RC1_MIGRATION_NOTES_LOCAL_GATE,
  EPIC13_RC1_MIGRATION_NOTES_MODULE,
  EPIC13_RC1_MIGRATION_NOTES_PACKAGE_SCRIPT,
  EPIC13_RC1_MIGRATION_NOTES_REPORT_ARTIFACT,
  EPIC13_RC1_MIGRATION_NOTES_REPORT_SCHEMA,
  EPIC13_RC1_MIGRATION_NOTES_SCHEMA,
  EPIC13_RC1_MIGRATION_NOTES_STATUS,
  EPIC13_RC1_MIGRATION_NOTES_STEERING,
  EPIC13_RC1_MIGRATION_NOTES_SUITE,
  EPIC13_RC1_MIGRATION_NOTES_TARGET,
  EPIC13_RC1_MIGRATION_NOTES_WORKPACKAGE,
  EPIC13_RC1_MIGRATION_NOTES_WORKPACKAGE_DOC,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  PROPOSED_VERSION,
  PUBLISH_BOUNDARY,
  REQUIRED_ARTIFACTS,
  REQUIRED_CHANGELOG_SECTIONS,
  REQUIRED_MIGRATION_SECTIONS,
  REQUIRED_SOURCE_GATES,
  createEpic13Rc1MigrationNotesPlan,
  createEpic13Rc1MigrationNotesReport,
  validateEpic13Rc1MigrationNotesPlan
};
