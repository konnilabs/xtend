'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
const { createCssBuildRequest, createNativeMaracaCssProvider, runCssProviderLifecycle } = require('../../xtend-maraca/css-provider');
const { createTailwindCssProvider } = require('../../xtend-maraca-css-tailwind');
const { createMaracaBuildPlan } = require('../../xtend-maraca');
const { createMaterialRecipeRegistry } = require('../../xtend-material/recipes');

const REPORT_SCHEMA = 'xtend.material.docs-release-report.v1';
const RELEASE_SCHEMA = 'xtend.material.release-handoff.v1';
const MIGRATION_SCHEMA = 'xtend.material.migration.v1';
const SUPPORT_STATUS = 'supported-opt-in';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js xtend-material-docs docs-public-quality scoped-package-readmes package-exports references --json';
const DOC_PATHS = Object.freeze([
  'docs/en/xtend-material.md',
  'docs/de/xtend-material.md',
  'docs/en/xtend-material-migration.md',
  'docs/de/xtend-material-migration.md'
]);
const HANDOFF_PATH = 'development/XTend-Material-Release-Handoff.md';
const FIXTURE_PATH = 'tests/fixtures/material/material-migration-contract.json';
const CSS_INPUT = 'tests/fixtures/material/material-migration-app.css';
const PRODUCT_RMT = 'products/xtend-material-workbench/src/app.rmt';
const PRODUCT_CONFIG = 'products/xtend-material-workbench/maraca.config.json';

function read(rootDir, relativePath) {
  return fs.readFileSync(path.resolve(rootDir, relativePath), 'utf8');
}

function readJson(rootDir, relativePath) {
  return JSON.parse(read(rootDir, relativePath));
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function publicDocsFacts(rootDir) {
  return DOC_PATHS.map((file) => {
    const text = read(rootDir, file);
    return {
      file,
      bytes: Buffer.byteLength(text),
      h2Count: (text.match(/^## /gmu) || []).length,
      codeBlocks: (text.match(/^```/gmu) || []).length / 2,
      links: Array.from(text.matchAll(/\[[^\]]+\]\(([^)]+)\)/gu)).map((match) => match[1])
    };
  });
}

async function migrationEvidence(rootDir) {
  const fixture = readJson(rootDir, FIXTURE_PATH);
  const rmtBefore = read(rootDir, PRODUCT_RMT);
  const sourceFingerprintBefore = sha256(rmtBefore);
  const request = createCssBuildRequest({
    provider: 'tailwind',
    mode: 'external',
    input: CSS_INPUT,
    output: 'xtend.material.migration.css',
    profile: 'production',
    minify: true,
    sources: [
      { path: PRODUCT_RMT, kind: 'rmt' },
      { path: CSS_INPUT, kind: 'css' }
    ],
    sourcePolicy: { root: '.', allow: [PRODUCT_RMT, CSS_INPUT], automaticDiscovery: false },
    metadata: { preflight: 'disabled' }
  });
  const tailwind = await runCssProviderLifecycle(createTailwindCssProvider({ rootDir }), request);
  const nativeCss = `${read(rootDir, 'xtend-material/tokens.css')}\n${read(rootDir, 'xtend-material/styles.css')}`;
  const native = await runCssProviderLifecycle(createNativeMaracaCssProvider({ cssText: nativeCss }), createCssBuildRequest({
    provider: 'maraca-native',
    mode: 'external',
    output: 'xtend.material.native.css',
    sources: [{ path: PRODUCT_RMT, kind: 'rmt' }],
    sourcePolicy: { root: '.', allow: [PRODUCT_RMT], automaticDiscovery: false }
  }));
  const productRoot = path.resolve(rootDir, 'products/xtend-material-workbench');
  const plan = createMaracaBuildPlan({ config: 'maraca.config.json' }, { rootDir: productRoot });
  const rmtAfter = read(rootDir, PRODUCT_RMT);
  const tailwindCss = tailwind.artifact && tailwind.artifact.cssText || '';
  const nativeOutput = native.artifact && native.artifact.cssText || '';
  const coverage = fixture.expectedSemanticClasses.map((className) => ({
    className,
    rmt: rmtBefore.includes(`class "${className}"`),
    tailwind: tailwindCss.includes(`.${className}`),
    native: nativeOutput.includes(`.${className}`)
  }));
  const summary = plan.orchestration && plan.orchestration.summary || {};
  return {
    schema: MIGRATION_SCHEMA,
    ok: tailwind.ok && native.ok && sourceFingerprintBefore === sha256(rmtAfter) && coverage.every((entry) => entry.rmt && entry.tailwind && entry.native),
    fixture: fixture.schema,
    mappings: fixture.legacyMappings,
    sourceFingerprintBefore,
    sourceFingerprintAfter: sha256(rmtAfter),
    coverage,
    tailwind: { ok: tailwind.ok, bytes: tailwind.artifact && tailwind.artifact.bytes, runtimeImports: /(?:from\s+['"]tailwindcss|require\s*\(\s*['"]tailwindcss)/u.test(tailwindCss) ? 1 : 0 },
    native: { ok: native.ok, bytes: native.artifact && native.artifact.bytes, runtimeImports: /(?:from\s+['"]tailwindcss|require\s*\(\s*['"]tailwindcss)/u.test(nativeOutput) ? 1 : 0 },
    businessRecords: {
      stateCount: summary.stateCount,
      selectorCount: summary.selectorCount,
      actionCount: summary.actionCount,
      validationCount: plan.validation && plan.validation.summary && plan.validation.summary.groupCount,
      transitionCount: plan.transitions && plan.transitions.summary && plan.transitions.summary.transitionCount,
      surfaceCount: summary.surfaceCount
    }
  };
}

async function runXtendMaterialDocsSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const context = createSuiteContext({ id: 'xtend-material-docs', label: 'XTM-13 XTend Material Docs, Migration and Release' });
  const docs = Object.fromEntries(DOC_PATHS.map((file) => [file, read(rootDir, file)]));
  const handoff = read(rootDir, HANDOFF_PATH);
  const core = readJson(rootDir, 'xtend-material/package.json');
  const adapter = readJson(rootDir, 'xtend-maraca-css-tailwind/package.json');
  const rootManifest = readJson(rootDir, 'package.json');
  const backlog = read(rootDir, 'development/BACKLOG-XTend-Material-Tailwind-CSS-Fast-Path.md');
  const menu = readJson(rootDir, 'docs/menu.json');
  const fixture = readJson(rootDir, FIXTURE_PATH);
  const facts = publicDocsFacts(rootDir);
  const migration = await migrationEvidence(rootDir);
  const registry = createMaterialRecipeRegistry();
  const metadata = rootManifest.xtend && rootManifest.xtend.materialDocsRelease;
  const combinedPublicDocs = DOC_PATHS.map((file) => docs[file]).join('\n');

  const report = {
    schema: REPORT_SCHEMA,
    generatedAt: new Date().toISOString(),
    status: 'measured',
    supportStatus: SUPPORT_STATUS,
    publicDocs: facts,
    recipeCount: registry.records.length,
    migration,
    packages: [
      { name: core.name, version: core.version, supportStatus: core.xtend && core.xtend.supportStatus, changelog: core.files.includes('CHANGELOG.md') },
      { name: adapter.name, version: adapter.version, supportStatus: adapter.xtend && adapter.xtend.supportStatus, changelog: adapter.files.includes('CHANGELOG.md') }
    ],
    defaultChanged: false,
    publishExecuted: false
  };
  report.ok = migration.ok && report.packages.every((entry) => entry.supportStatus === SUPPORT_STATUS && entry.changelog);
  report.status = report.ok ? 'passed' : 'blocked';
  const reportTarget = path.resolve(rootDir, '.xtend-test-results/xtend-material-docs-release-report.json');
  fs.mkdirSync(path.dirname(reportTarget), { recursive: true });
  fs.writeFileSync(reportTarget, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  context.assert(facts.every((entry) => entry.bytes >= 7000 && entry.h2Count >= 8 && entry.codeBlocks >= 3 && entry.links.length >= 4), 'all four bilingual articles provide substantial structured guidance, runnable examples and related reading');
  context.assert(menu.some((entry) => entry.slug === 'xtend-material' && entry.contentType === 'tutorial') && menu.some((entry) => entry.slug === 'xtend-material-migration' && entry.parent === 'xtend-material'), 'Developer Center exposes the guide and migration path in its public hierarchy');
  context.assert(combinedPublicDocs.includes('supported-opt-in') && combinedPublicDocs.includes('4.3.2') && combinedPublicDocs.includes('0.1.x'), 'public docs state support status and tested compatibility lines');
  context.assert(/not Angular Material/u.test(docs['docs/en/xtend-material.md']) && /weder Angular Material/u.test(docs['docs/de/xtend-material.md']), 'public docs clearly reject Angular Material API and complete parity claims');
  context.assert(combinedPublicDocs.includes('cssProviderFallback') && combinedPublicDocs.includes('cssPreflight') && combinedPublicDocs.includes('cssSources'), 'Quick Start documents explicit source, Preflight and fallback boundaries');
  context.assert(
    docs['docs/en/xtend-material.md'].includes('npm run serve')
      && docs['docs/de/xtend-material.md'].includes('npm run serve')
      && combinedPublicDocs.includes('site/index.html')
      && combinedPublicDocs.includes('server/index.mjs')
      && combinedPublicDocs.includes('npm run test:catfood'),
    'bilingual Quick Start documents generated Node hosting and the build-first serve/catfood paths'
  );
  context.assert(combinedPublicDocs.includes('xtm-form-flow') && combinedPublicDocs.includes('xtm-confirmation-flow') && combinedPublicDocs.includes('xtm-plain-text') && registry.records.length === 27, 'public docs cover foundation, shell and flow recipe vocabulary');
  context.assert(combinedPublicDocs.includes('data-material-pack') && combinedPublicDocs.includes('data-density') && combinedPublicDocs.includes('--xtend-*'), 'themes, density and the single XTend token source are documented');
  context.assert(/raw utilities/u.test(docs['docs/en/xtend-material.md']) && /rohe Utilities/u.test(docs['docs/de/xtend-material.md']) && combinedPublicDocs.includes('w-[37rem]'), 'unsupported raw, dynamic, variant and arbitrary Tailwind syntax is visible');
  context.assert(fixture.legacyMappings.length === 7 && migration.coverage.length === 7 && migration.coverage.every((entry) => entry.rmt && entry.tailwind && entry.native), 'legacy shell mapping compiles through both Tailwind and native semantic CSS paths');
  context.assert(migration.ok && migration.sourceFingerprintBefore === migration.sourceFingerprintAfter, 'bidirectional provider migration preserves the RMT source fingerprint');
  context.assert(migration.tailwind.runtimeImports === 0 && migration.native.runtimeImports === 0, 'both migration paths emit zero Tailwind browser runtime imports');
  context.assert(migration.businessRecords.stateCount >= 15 && migration.businessRecords.actionCount >= 3 && migration.businessRecords.surfaceCount >= 15, 'migration proof retains substantial state, action and surface records');
  context.assert(handoff.includes(RELEASE_SCHEMA) && handoff.includes(`Entscheidung: \`${SUPPORT_STATUS}\``) && handoff.includes('## Release Decision Matrix'), 'release handoff records one explicit support decision and all four alternatives');
  context.assert(handoff.includes('## Tailwind Upgrade Runbook') && handoff.includes('latest-stable-reviewed') && handoff.includes('## Compatibility Matrix'), 'release handoff includes reviewed Tailwind upgrade and compatibility procedures');
  context.assert(handoff.includes('separaten akzeptierten ADR') && handoff.includes('Default Provider: `unchanged`'), 'a default change remains blocked behind a separate accepted ADR');
  context.assert(core.version === '0.1.0' && adapter.version === '0.1.0' && core.xtend.supportStatus === SUPPORT_STATUS && adapter.xtend.supportStatus === SUPPORT_STATUS, 'both package manifests lock the 0.1.x supported-opt-in line');
  context.assert(core.files.includes('CHANGELOG.md') && adapter.files.includes('CHANGELOG.md') && read(rootDir, 'xtend-material/CHANGELOG.md').includes('## 0.1.0') && read(rootDir, 'xtend-maraca-css-tailwind/CHANGELOG.md').includes('## 0.1.0'), 'both publish surfaces include versioned changelogs');
  context.assert(metadata && metadata.schema === REPORT_SCHEMA && metadata.supportStatus === SUPPORT_STATUS && metadata.localGate === LOCAL_GATE, 'root metadata exposes release schema, status and complete local gate');
  context.assert(backlog.includes('| `XTM-13` | P2 | completed |') && backlog.includes('- Status: `completed (2026-07-16)`'), 'backlog records XTM-13 completion consistently');
  context.assert(report.ok && report.defaultChanged === false && report.publishExecuted === false, 'release report passes without changing defaults or publishing packages');

  return context.result({ report });
}

function printXtendMaterialDocsReport(result) {
  printSuiteReport(result, { successTitle: 'XTM-13 XTend Material Docs und Release Gates erfolgreich.', failureTitle: 'XTM-13 XTend Material Docs und Release Gates fehlgeschlagen:' });
}

module.exports = { printXtendMaterialDocsReport, runXtendMaterialDocsSuite };
