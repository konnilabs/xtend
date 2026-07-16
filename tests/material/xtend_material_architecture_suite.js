'use strict';

const fs = require('fs');
const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');

const ADR_PATH = 'development/XTend-Material-Tailwind-Architecture-Decision.md';
const BACKLOG_PATH = 'development/BACKLOG-XTend-Material-Tailwind-CSS-Fast-Path.md';
const PACKAGE_SCOPE = '@xtend-material';
const CORE_PACKAGE = '@xtend-material/core';
const MARACA_ADAPTER_PACKAGE = '@xtend-material/maraca-tailwind';
const TAILWIND_BASELINE = '4.3.2';

function readText(rootDir, relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function runXtendMaterialArchitectureSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const context = createSuiteContext({
    id: 'xtend-material-architecture',
    label: 'XTend Material Tailwind architecture decision'
  });
  const packageManifest = JSON.parse(readText(rootDir, 'package.json'));
  const adr = readText(rootDir, ADR_PATH);
  const backlog = readText(rootDir, BACKLOG_PATH);
  const runner = readText(rootDir, 'scripts/run_xtend_tests.js');
  const metadata = packageManifest.xtend && packageManifest.xtend.xtendMaterialArchitecture;
  const rootDependencySections = [
    packageManifest.dependencies,
    packageManifest.devDependencies,
    packageManifest.peerDependencies,
    packageManifest.optionalDependencies
  ].filter(Boolean);

  context.assert(/^@[a-z0-9-]+$/u.test(PACKAGE_SCOPE), 'canonical product identity is a valid npm scope');
  context.assert(/^@[a-z0-9-]+\/[a-z0-9-]+$/u.test(CORE_PACKAGE), 'core distribution uses a complete scoped npm package name');
  context.assert(/^@[a-z0-9-]+\/[a-z0-9-]+$/u.test(MARACA_ADAPTER_PACKAGE), 'Maraca adapter uses a complete scoped npm package name');
  context.assert(CORE_PACKAGE.startsWith(`${PACKAGE_SCOPE}/`) && MARACA_ADAPTER_PACKAGE.startsWith(`${PACKAGE_SCOPE}/`), 'core and adapter share the @xtend-material scope');

  context.assert(adr.includes('Status: `accepted-by-XTM-00`'), 'ADR is accepted by XTM-00');
  context.assert(adr.includes('Owner: `CCS Labs (ccslabs)`'), 'ADR records CCS Labs upstream ownership');
  context.assert(adr.includes('Initial Package: `@xtend-material/core`'), 'ADR records the installable core package');
  context.assert(adr.includes('Maraca Adapter Target: `@xtend-material/maraca-tailwind`'), 'ADR records the adapter package');
  context.assert(adr.includes('"tailwindcss": "4.3.2"'), 'ADR pins Tailwind 4.3.2 as direct package dependency');
  context.assert(adr.includes('`latest-stable-reviewed`'), 'ADR defines reviewed latest-stable upgrades');
  context.assert(adr.includes('Tailwind Preflight ist fuer den MVP deaktiviert'), 'ADR disables Tailwind Preflight for the MVP');
  context.assert(adr.includes('Ein beweglicher Wert wie `"latest"` ist in veroeffentlichten Manifests verboten'), 'ADR blocks moving latest tags in published manifests');
  context.assert(adr.includes('Standard-Gates fragen die Registry nicht ab'), 'ADR keeps default gates offline reproducible');
  context.assert(adr.includes('Exit Path'), 'ADR defines a native CSS provider exit path');
  context.assert(adr.includes('keinen Claim auf:'), 'ADR constrains Material compatibility claims');

  context.assert(metadata && metadata.schema === 'xtend.material.architecture-decision.v1', 'package metadata exposes the architecture decision schema');
  context.assert(metadata && metadata.status === 'accepted-by-XTM-00', 'package metadata marks XTM-00 accepted');
  context.assert(metadata && metadata.scope === PACKAGE_SCOPE, 'package metadata records the @xtend-material scope');
  context.assert(metadata && metadata.corePackage === CORE_PACKAGE, 'package metadata records the core package');
  context.assert(metadata && metadata.maracaAdapterPackage === MARACA_ADAPTER_PACKAGE, 'package metadata records the Maraca adapter package');
  context.assert(metadata && metadata.owner === 'CCS Labs (ccslabs)', 'package metadata records CCS Labs ownership');
  context.assert(metadata && metadata.tailwindBaseline === TAILWIND_BASELINE, 'package metadata records Tailwind 4.3.2 baseline');
  context.assert(metadata && metadata.tailwindDependencySection === 'dependencies', 'package metadata requires Tailwind as direct package dependency');
  context.assert(metadata && metadata.tailwindLifecycle === 'build-time-only', 'package metadata classifies Tailwind as build-time-only');
  context.assert(metadata && metadata.preflight === 'disabled-for-mvp', 'package metadata records disabled MVP Preflight');
  context.assert(metadata && metadata.latestStablePolicy === 'latest-stable-reviewed-exact-pin', 'package metadata records reviewed exact-pin upgrades');
  context.assert(metadata && metadata.rootDependencyAllowed === false, 'package metadata blocks a root Tailwind dependency');
  context.assert(metadata && metadata.browserRuntimeAllowed === false, 'package metadata blocks Tailwind browser runtime');
  context.assert(metadata && metadata.rmtKernelImportAllowed === false, 'package metadata blocks Tailwind imports in the RMT kernel');
  context.assert(metadata && metadata.contract === ADR_PATH, 'package metadata links the ADR');
  context.assert(metadata && metadata.backlog === BACKLOG_PATH, 'package metadata links the backlog');
  context.assert(metadata && metadata.suite === 'tests/material/xtend_material_architecture_suite.js', 'package metadata links the architecture suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js xtend-material-architecture --json', 'package metadata exposes the local gate');

  context.assert(rootDependencySections.every((section) => !section.tailwindcss && !section['@tailwindcss/node'] && !section['@tailwindcss/cli']), 'XTend root package has no Tailwind dependency');
  context.assert(backlog.includes('| `XTM-00` | P0 | completed | WS0 |'), 'backlog marks XTM-00 completed');
  context.assert(backlog.includes('Product Target: `@xtend-material/core`'), 'backlog uses the complete core package target');
  context.assert(backlog.includes('NPM Scope Target: `@xtend-material`'), 'backlog records the requested npm scope');
  context.assert(backlog.includes('Build Adapter Target: `@xtend-material/maraca-tailwind`'), 'backlog keeps adapter in the same product scope');
  context.assert(runner.includes("id: 'xtend-material-architecture'"), 'test runner exposes the XTM-00 gate');
  context.assert(packageManifest.scripts['test:xtend-material-architecture'] === 'node scripts/run_xtend_tests.js xtend-material-architecture', 'package exposes the isolated XTM-00 gate');

  return context.result({
    report: {
      schema: 'xtend.material.architecture-report.v1',
      status: context.failures.length === 0 ? 'accepted' : 'blocked',
      scope: PACKAGE_SCOPE,
      corePackage: CORE_PACKAGE,
      maracaAdapterPackage: MARACA_ADAPTER_PACKAGE,
      owner: 'CCS Labs (ccslabs)',
      tailwindBaseline: TAILWIND_BASELINE,
      tailwindLifecycle: 'build-time-only'
    }
  });
}

function printXtendMaterialArchitectureReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Material architecture gate passed.',
    failureTitle: 'XTend Material architecture gate failed:'
  });
}

if (require.main === module) {
  const result = runXtendMaterialArchitectureSuite();
  printXtendMaterialArchitectureReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  ADR_PATH,
  BACKLOG_PATH,
  CORE_PACKAGE,
  MARACA_ADAPTER_PACKAGE,
  PACKAGE_SCOPE,
  TAILWIND_BASELINE,
  printXtendMaterialArchitectureReport,
  runXtendMaterialArchitectureSuite
};
