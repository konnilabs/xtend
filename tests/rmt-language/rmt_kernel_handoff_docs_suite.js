const fs = require('fs');
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

const RMT_KERNEL_HANDOFF_DOCS_SCHEMA = 'xtend.rmt.kernel-migration-authoring-incident-handoff.v1';
const RMT_KERNEL_HANDOFF_DOCS_REPORT_SCHEMA = 'xtend.rmt.kernel-migration-authoring-incident-handoff-report.v1';
const RMT_KERNEL_HANDOFF_DOCS_WORKPACKAGE = 'RKSH-WP-11';
const RMT_KERNEL_HANDOFF_DOCS_SUITE = 'tests/rmt-language/rmt_kernel_handoff_docs_suite.js';
const RMT_KERNEL_HANDOFF_DOCS_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-kernel-handoff-docs --json';
const RMT_KERNEL_HANDOFF_DOCS_PACKAGE_SCRIPT = 'npm run test:rmt-kernel-handoff-docs';
const RMT_KERNEL_HANDOFF_DOCS_BACKLOG = 'development/XTendRMT-Kernel-Sicherheits-Hardening-Backlog.md';
const RMT_KERNEL_HANDOFF_DOCS_CONTRACT = 'development/XTendRMT-Kernel-Migration-Authoring-Incident-Handoff-Contract.md';
const RMT_KERNEL_HANDOFF_DOCS_WORKPACKAGE_DOC = 'development/WP-RKSH-11-Migration-Authoring-und-Incident-Handoff-dokumentieren.md';

const RMT_KERNEL_HANDOFF_DOCS = [
  'docs/rmt-kernel-security-hardening-migration.md',
  'docs/rmt-kernel-trusted-output-authoring.md',
  'docs/rmt-kernel-panic-recovery-incident-handoff.md'
];

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertTextIncludesAll(context, text, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(text, entry, `${label} includes ${entry}`);
  });
}

function assertArrayIncludesAll(context, actual, expected, message) {
  const list = Array.isArray(actual) ? actual : [];
  const missing = expected.filter((item) => !list.includes(item));
  context.assert(missing.length === 0, `${message}${missing.length > 0 ? ` missing ${missing.join(', ')}` : ''}`);
}

function runRmtKernelHandoffDocsSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const context = createSuiteContext({
    id: 'rmt-kernel-handoff-docs',
    label: 'RKSH-WP-11 Kernel Migration Authoring Incident Handoff'
  });

  [
    RMT_KERNEL_HANDOFF_DOCS_SUITE,
    RMT_KERNEL_HANDOFF_DOCS_CONTRACT,
    RMT_KERNEL_HANDOFF_DOCS_WORKPACKAGE_DOC,
    RMT_KERNEL_HANDOFF_DOCS_BACKLOG,
    'docs/README.md',
    'docs/menu.json',
    'tests/rmt/README.md',
    'scripts/run_xtend_tests.js',
    'package.json',
    ...RMT_KERNEL_HANDOFF_DOCS
  ].forEach((relativePath) => {
    assertFileExists(context, relativePath, rootDir, `${relativePath} exists`);
  });

  const syntax = syntaxCheckFile(RMT_KERNEL_HANDOFF_DOCS_SUITE, { rootDir });
  context.assert(syntax.ok, `${RMT_KERNEL_HANDOFF_DOCS_SUITE} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);

  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtKernelHandoffDocs;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const docsMenu = readJson('docs/menu.json', rootDir);
  const testsReadme = readText('tests/rmt/README.md', rootDir);
  const backlog = readText(RMT_KERNEL_HANDOFF_DOCS_BACKLOG, rootDir);
  const contract = readText(RMT_KERNEL_HANDOFF_DOCS_CONTRACT, rootDir);
  const workpackage = readText(RMT_KERNEL_HANDOFF_DOCS_WORKPACKAGE_DOC, rootDir);
  const migration = readText(RMT_KERNEL_HANDOFF_DOCS[0], rootDir);
  const authoring = readText(RMT_KERNEL_HANDOFF_DOCS[1], rootDir);
  const incident = readText(RMT_KERNEL_HANDOFF_DOCS[2], rootDir);

  assertTextIncludesAll(context, migration, [
    RMT_KERNEL_HANDOFF_DOCS_SCHEMA,
    RMT_KERNEL_HANDOFF_DOCS_WORKPACKAGE,
    'innerHTML',
    'insertAdjacentHTML',
    'slot.html',
    'prerender.html',
    'fallback.html',
    'onclick',
    'style',
    'srcdoc',
    'javascript:',
    'RmtKernelRuntimeTrustVerdict',
    'SemVer',
    '`major`',
    '`minor`',
    '`patch`',
    'node scripts/run_xtend_tests.js rmt-kernel-security-regression --json'
  ], 'migration guide');

  assertTextIncludesAll(context, authoring, [
    RMT_KERNEL_HANDOFF_DOCS_SCHEMA,
    RMT_KERNEL_HANDOFF_DOCS_WORKPACKAGE,
    'Trust Boundary',
    'sanitize html',
    'html_fragment',
    'textContent',
    'data-*',
    'aria-*',
    'safeFallbackHtml',
    'commitTrustedHtml',
    'commitTrustedAttribute',
    'commitTrustedProperty',
    'remote-surface',
    'adapter-output'
  ], 'authoring guide');

  assertTextIncludesAll(context, incident, [
    RMT_KERNEL_HANDOFF_DOCS_SCHEMA,
    RMT_KERNEL_HANDOFF_DOCS_WORKPACKAGE,
    'rmt.kernel.panic',
    'rmt.kernel.recovery',
    'rmt.kernel.escalation',
    'rmt.kernel.scheduler_failure',
    'panicId',
    'correlationId',
    'blockedCommitCount',
    'recoveryAction',
    'quarantined',
    'hostNotified',
    'Incident Severity',
    'rollback-last-safe-snapshot',
    'render-safe-fallback',
    'notify-host',
    'panic_blocked'
  ], 'incident handoff');

  assertTextIncludesAll(context, contract, [
    RMT_KERNEL_HANDOFF_DOCS_SCHEMA,
    RMT_KERNEL_HANDOFF_DOCS_REPORT_SCHEMA,
    RMT_KERNEL_HANDOFF_DOCS_WORKPACKAGE,
    RMT_KERNEL_HANDOFF_DOCS_LOCAL_GATE,
    RMT_KERNEL_HANDOFF_DOCS_PACKAGE_SCRIPT,
    ...RMT_KERNEL_HANDOFF_DOCS
  ], 'handoff contract');

  assertTextIncludesAll(context, workpackage, [
    'Status: `completed`',
    RMT_KERNEL_HANDOFF_DOCS_SCHEMA,
    RMT_KERNEL_HANDOFF_DOCS_REPORT_SCHEMA,
    RMT_KERNEL_HANDOFF_DOCS_LOCAL_GATE,
    RMT_KERNEL_HANDOFF_DOCS_PACKAGE_SCRIPT,
    RMT_KERNEL_HANDOFF_DOCS_CONTRACT
  ], 'RKSH-WP-11 document');

  assertTextIncludesAll(context, docsReadme, [
    './rmt-kernel-security-hardening-migration.md',
    './rmt-kernel-trusted-output-authoring.md',
    './rmt-kernel-panic-recovery-incident-handoff.md',
    RMT_KERNEL_HANDOFF_DOCS_SCHEMA,
    RMT_KERNEL_HANDOFF_DOCS_LOCAL_GATE
  ], 'docs README');

  const slugs = new Set(docsMenu.map((entry) => entry.slug));
  [
    'rmt-kernel-security-hardening-migration',
    'rmt-kernel-trusted-output-authoring',
    'rmt-kernel-panic-recovery-incident-handoff'
  ].forEach((slug) => {
    context.assert(slugs.has(slug), `docs menu includes ${slug}`);
  });

  assertTextIncludesAll(context, testsReadme, [
    RMT_KERNEL_HANDOFF_DOCS_SCHEMA,
    'rmt-kernel-handoff-docs',
    RMT_KERNEL_HANDOFF_DOCS_PACKAGE_SCRIPT
  ], 'RMT tests README');

  context.assert(packageManifest.scripts['test:rmt-kernel-handoff-docs'] === 'node scripts/run_xtend_tests.js rmt-kernel-handoff-docs', 'package exposes handoff docs script');
  context.assert(metadata && metadata.schema === RMT_KERNEL_HANDOFF_DOCS_SCHEMA, 'package metadata exposes handoff docs schema');
  context.assert(metadata && metadata.reportSchema === RMT_KERNEL_HANDOFF_DOCS_REPORT_SCHEMA, 'package metadata exposes handoff docs report schema');
  context.assert(metadata && metadata.workpackage === RMT_KERNEL_HANDOFF_DOCS_WORKPACKAGE, 'package metadata points to RKSH-WP-11');
  context.assert(metadata && metadata.contract === RMT_KERNEL_HANDOFF_DOCS_CONTRACT, 'package metadata points to handoff contract');
  context.assert(metadata && metadata.workpackageDocument === RMT_KERNEL_HANDOFF_DOCS_WORKPACKAGE_DOC, 'package metadata points to WP-11 document');
  context.assert(metadata && metadata.localGate === RMT_KERNEL_HANDOFF_DOCS_LOCAL_GATE, 'package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === RMT_KERNEL_HANDOFF_DOCS_PACKAGE_SCRIPT, 'package metadata exposes package script');
  assertArrayIncludesAll(context, metadata && metadata.docs, RMT_KERNEL_HANDOFF_DOCS, 'package metadata includes handoff docs');
  assertArrayIncludesAll(context, metadata && metadata.sourceGates, [
    'node scripts/run_xtend_tests.js rmt-kernel-security-regression --json',
    'node scripts/verify_xtendrmt_artifact_parity.js --json'
  ], 'package metadata includes source gates');
  assertArrayIncludesAll(context, metadata && metadata.incidentChannels, [
    'rmt.kernel.panic',
    'rmt.kernel.recovery',
    'rmt.kernel.escalation',
    'rmt.kernel.scheduler_failure'
  ], 'package metadata includes incident channels');

  assertTextIncludesAll(context, runner, [
    "require('../tests/rmt-language/rmt_kernel_handoff_docs_suite')",
    "id: 'rmt-kernel-handoff-docs'",
    'runRmtKernelHandoffDocsSuite',
    'printRmtKernelHandoffDocsReport'
  ], 'runner wiring');

  assertTextIncludesAll(context, backlog, [
    '| `RKSH-WP-11` | P2 | completed | Docs | Migration, Authoring und Incident-Handoff dokumentieren | `npm run test:rmt-kernel-handoff-docs` |',
    RMT_KERNEL_HANDOFF_DOCS_CONTRACT,
    RMT_KERNEL_HANDOFF_DOCS_WORKPACKAGE_DOC,
    RMT_KERNEL_HANDOFF_DOCS_LOCAL_GATE,
    RMT_KERNEL_HANDOFF_DOCS_PACKAGE_SCRIPT
  ], 'kernel security hardening backlog');

  return context.result({
    schema: RMT_KERNEL_HANDOFF_DOCS_REPORT_SCHEMA,
    handoffSchema: RMT_KERNEL_HANDOFF_DOCS_SCHEMA,
    workpackage: RMT_KERNEL_HANDOFF_DOCS_WORKPACKAGE,
    docs: RMT_KERNEL_HANDOFF_DOCS.slice()
  });
}

function printRmtKernelHandoffDocsReport(result) {
  printSuiteReport(result, {
    successTitle: 'RKSH-WP-11 Kernel Migration Authoring Incident Handoff erfolgreich.',
    failureTitle: 'RKSH-WP-11 Kernel Migration Authoring Incident Handoff fehlgeschlagen:'
  });
}

module.exports = {
  RMT_KERNEL_HANDOFF_DOCS_LOCAL_GATE,
  RMT_KERNEL_HANDOFF_DOCS_PACKAGE_SCRIPT,
  RMT_KERNEL_HANDOFF_DOCS_REPORT_SCHEMA,
  RMT_KERNEL_HANDOFF_DOCS_SCHEMA,
  RMT_KERNEL_HANDOFF_DOCS_WORKPACKAGE,
  printRmtKernelHandoffDocsReport,
  runRmtKernelHandoffDocsSuite
};
