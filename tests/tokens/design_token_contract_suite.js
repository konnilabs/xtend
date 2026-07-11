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
  KERNEL_BOUNDARY,
  TOKEN_DEFINITIONS,
  XTEND_DESIGN_TOKEN_CONTRACT_PATH,
  XTEND_DESIGN_TOKEN_DOC_PATH,
  XTEND_DESIGN_TOKEN_EXAMPLE_THEME_PATH,
  XTEND_DESIGN_TOKEN_LOCAL_GATE,
  XTEND_DESIGN_TOKEN_MODULE_PATH,
  XTEND_DESIGN_TOKEN_PACKAGE_SCRIPT,
  XTEND_DESIGN_TOKEN_PACK_SCHEMA,
  XTEND_DESIGN_TOKEN_REPORT_SCHEMA,
  XTEND_DESIGN_TOKEN_SCHEMA,
  XTEND_DESIGN_TOKEN_SUITE_PATH,
  XTEND_DESIGN_TOKEN_WORKPACKAGE,
  XTEND_DESIGN_TOKEN_WP_PATH,
  createXtendDesignTokenContract,
  tokenNames,
  validateXtendDesignTokenContract
} = require('../../design-tokens/xtend-design-tokens');

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, source, expected, label) {
  expected.forEach((entry) => {
    context.assert(source.includes(entry), `${label} includes ${entry}`);
  });
}

function assertNoLocalVisualTokens(context, source, label) {
  [
    '--matrix-bg',
    '--matrix-fg',
    '--matrix-accent',
    '--matrix-gap',
    '--matrix-radius',
    '--matrix-motion-duration',
    '--snapshot-bg',
    '--snapshot-fg',
    '--snapshot-accent',
    '--snapshot-gap',
    '--snapshot-radius'
  ].forEach((tokenName) => {
    context.assert(!source.includes(tokenName), `${label} does not include ${tokenName}`);
  });
}

function runDesignTokenContractSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'design-tokens',
    label: 'Epic 12 Enterprise Design System Tokens'
  });
  const contract = createXtendDesignTokenContract();
  const validation = validateXtendDesignTokenContract(contract);
  const tokenSet = tokenNames();
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.designTokens;
  const exampleTheme = readJson(XTEND_DESIGN_TOKEN_EXAMPLE_THEME_PATH, rootDir);
  const moduleSource = readText(XTEND_DESIGN_TOKEN_MODULE_PATH, rootDir);
  const suiteSource = readText(XTEND_DESIGN_TOKEN_SUITE_PATH, rootDir);
  const xThemeSource = readText('components/xtheme.js', rootDir);
  const xThemeTypes = readText('components/xtheme.d.ts', rootDir);
  const themeMatrixFixture = readText('tests/browser/fixtures/epic11-theme-matrix-smoke.html', rootDir);
  const visualFixture = readText('tests/browser/fixtures/visual-snapshots-fixture.html', rootDir);
  const visualRunner = readText('tests/browser/visual-snapshots-runner.js', rootDir);
  const visualBaseline = readText('tests/browser/visual-baselines/visual-snapshots.dom-baseline.json', rootDir);
  const runnerIndex = readText('scripts/run_xtend_tests.js', rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const contractDoc = readText(XTEND_DESIGN_TOKEN_CONTRACT_PATH, rootDir);
  const docs = readText(XTEND_DESIGN_TOKEN_DOC_PATH, rootDir);
  const xThemeDocs = readText('docs/components/xtheme.md', rootDir);
  const docsReadme = readText('docs/en/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const browserReadme = readText('tests/browser/README.md', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung.md', rootDir);
  const rcModel = readText('development/XTend-Epic12-RC-Hardening-Modell.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const workpackage = readText(XTEND_DESIGN_TOKEN_WP_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(XTEND_DESIGN_TOKEN_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(XTEND_DESIGN_TOKEN_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, XTEND_DESIGN_TOKEN_MODULE_PATH, rootDir, 'Design Token contract module exists');
  assertFileExists(context, XTEND_DESIGN_TOKEN_SUITE_PATH, rootDir, 'Design Token suite exists');
  assertFileExists(context, XTEND_DESIGN_TOKEN_CONTRACT_PATH, rootDir, 'Design Token contract document exists');
  assertFileExists(context, XTEND_DESIGN_TOKEN_DOC_PATH, rootDir, 'Design Token docs page exists');
  assertFileExists(context, XTEND_DESIGN_TOKEN_EXAMPLE_THEME_PATH, rootDir, 'Design Token example theme exists');
  assertFileExists(context, XTEND_DESIGN_TOKEN_WP_PATH, rootDir, 'WP-E12-12 workpackage document exists');
  context.assert(moduleSyntax.ok, `Design Token module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Design Token suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(contract.schema === XTEND_DESIGN_TOKEN_SCHEMA, 'Design Token contract declares schema');
  context.assert(contract.workpackage === XTEND_DESIGN_TOKEN_WORKPACKAGE, 'Design Token contract belongs to WP-E12-12');
  context.assert(contract.productSurface.runtimeProvider === 'x-theme', 'Design Token contract uses x-theme as runtime provider');
  context.assert(contract.productSurface.localOnly === true, 'Design Token contract remains local-only');
  context.assert(contract.productSurface.externalNetworkAllowed === false, 'Design Token contract rejects external network');
  context.assert(contract.productSurface.kernelBoundary === KERNEL_BOUNDARY, 'Design Token contract keeps RMT kernel boundary');
  context.assert(validation.schema === XTEND_DESIGN_TOKEN_REPORT_SCHEMA, 'Design Token validator emits report schema');
  context.assert(validation.ok === true, 'Design Token validator accepts generated contract');
  context.assert(contract.themePacks.length === 4, 'Design Token contract exposes four theme packs');
  context.assert(contract.densityPacks.length === 3, 'Design Token contract exposes three density packs');
  context.assert(contract.themePacks.some((pack) => pack.name === 'high-contrast'), 'Design Token contract exposes high-contrast theme pack');
  context.assert(contract.themePacks.some((pack) => pack.name === 'forced-colors'), 'Design Token contract exposes forced-colors theme pack');
  context.assert(contract.densityPacks.some((pack) => pack.name === 'dense'), 'Design Token contract exposes dense density pack');

  const requiredThemeTokens = TOKEN_DEFINITIONS.filter((token) => token.requiredInTheme).map((token) => token.name);
  const requiredDensityTokens = TOKEN_DEFINITIONS.filter((token) => token.densityOnly).map((token) => token.name);
  assertIncludesAll(context, contract.tokenNames, tokenSet, 'Design Token contract token names');
  contract.themePacks.forEach((pack) => {
    assertIncludesAll(context, Object.keys(pack.tokens), requiredThemeTokens, `${pack.name} theme pack tokens`);
  });
  contract.densityPacks.forEach((pack) => {
    assertIncludesAll(context, Object.keys(pack.tokens), requiredDensityTokens, `${pack.name} density pack tokens`);
  });

  context.assert(exampleTheme.schema === XTEND_DESIGN_TOKEN_PACK_SCHEMA, 'Example theme declares token pack schema');
  context.assert(exampleTheme.type === 'theme', 'Example theme is a theme token pack');
  context.assert(exampleTheme.extends === 'light', 'Example theme extends light pack');
  assertIncludesAll(context, Object.keys(exampleTheme.tokens), requiredThemeTokens, 'Example theme tokens');
  context.assert(exampleTheme.kernelBoundary === KERNEL_BOUNDARY, 'Example theme keeps kernel boundary visible');
  context.assert(exampleTheme.localOnly === true, 'Example theme is local-only');

  assertIncludesAll(context, xThemeSource, tokenSet, 'x-theme source token names');
  assertIncludesAll(context, xThemeSource, ['compact', 'comfortable', 'dense'], 'x-theme density names');
  context.assert(!xThemeSource.includes("'spacious'"), 'x-theme no longer exposes spacious density');
  context.assertIncludes(xThemeSource, XTEND_DESIGN_TOKEN_SCHEMA, 'x-theme source exposes design token schema');
  context.assertIncludes(xThemeSource, 'getDesignTokenContract()', 'x-theme exposes Design Token contract API');
  context.assertIncludes(xThemeTypes, "export type XThemeDensity = 'compact' | 'comfortable' | 'dense';", 'x-theme types expose compact/comfortable/dense');
  context.assertIncludes(xThemeTypes, 'getDesignTokenContract()', 'x-theme types expose Design Token contract API');

  assertIncludesAll(context, themeMatrixFixture, [
    '--xtend-surface',
    '--xtend-text',
    '--xtend-color-primary',
    '--xtend-density-spacing',
    '--xtend-radius',
    '--xtend-motion-duration-fast'
  ], 'Theme Matrix fixture product tokens');
  assertNoLocalVisualTokens(context, themeMatrixFixture, 'Theme Matrix fixture');
  assertIncludesAll(context, visualFixture, [
    '--xtend-surface',
    '--xtend-text',
    '--xtend-color-primary',
    '--xtend-density-spacing',
    '--xtend-radius'
  ], 'Visual Snapshot fixture product tokens');
  assertNoLocalVisualTokens(context, visualFixture, 'Visual Snapshot fixture');
  assertNoLocalVisualTokens(context, visualRunner, 'Visual Snapshot runner');
  assertNoLocalVisualTokens(context, visualBaseline, 'Visual Snapshot baseline');
  assertIncludesAll(context, visualRunner, ['--xtend-surface', '--xtend-color-primary'], 'Visual Snapshot runner token keys');
  assertIncludesAll(context, visualBaseline, ['--xtend-surface', '--xtend-color-primary'], 'Visual Snapshot baseline token keys');

  context.assertIncludes(moduleSource, XTEND_DESIGN_TOKEN_SCHEMA, 'Design Token module declares schema');
  context.assertIncludes(suiteSource, 'XTEND_DESIGN_TOKEN_SCHEMA', 'Design Token suite asserts schema');
  context.assertIncludes(runnerIndex, "id: 'design-tokens'", 'XTend runner registers Design Token suite');
  context.assert(packageManifest.scripts['test:design-tokens'] === 'node scripts/run_xtend_tests.js design-tokens', 'Package exposes Design Token test script');
  context.assert((packageManifest.exports['./design-tokens'] === './design-tokens/xtend-design-tokens.js' || (packageManifest.exports['./design-tokens'] && packageManifest.exports['./design-tokens'].default === './design-tokens/xtend-design-tokens.js')), 'Package exports Design Token contract module');
  context.assert(metadata && metadata.schema === XTEND_DESIGN_TOKEN_SCHEMA, 'Package metadata exposes Design Token schema');
  context.assert(metadata && metadata.module === XTEND_DESIGN_TOKEN_MODULE_PATH, 'Package metadata exposes Design Token module path');
  context.assert(metadata && metadata.exampleTheme === XTEND_DESIGN_TOKEN_EXAMPLE_THEME_PATH, 'Package metadata exposes Design Token example theme');
  context.assert(metadata && metadata.localGate === XTEND_DESIGN_TOKEN_LOCAL_GATE, 'Package metadata exposes Design Token local gate');
  context.assert(metadata && metadata.packageScript === XTEND_DESIGN_TOKEN_PACKAGE_SCRIPT, 'Package metadata exposes Design Token package script');
  context.assert(metadata && Array.isArray(metadata.themePacks) && metadata.themePacks.includes('forced-colors'), 'Package metadata exposes forced-colors theme pack');
  context.assert(metadata && Array.isArray(metadata.densityPacks) && metadata.densityPacks.includes('dense'), 'Package metadata exposes dense density pack');
  context.assertIncludes(scaffoldConfig, 'designTokens', 'Scaffold config exposes Design Token metadata');
  context.assertIncludes(scaffoldConfig, XTEND_DESIGN_TOKEN_SCHEMA, 'Scaffold config exposes Design Token schema');

  assertIncludesAll(context, contractDoc, [
    XTEND_DESIGN_TOKEN_SCHEMA,
    XTEND_DESIGN_TOKEN_LOCAL_GATE,
    '--xtend-color-primary',
    '--xtend-density-spacing',
    'high-contrast',
    'forced-colors',
    'CSS Parts',
    KERNEL_BOUNDARY
  ], 'Design Token contract document');
  assertIncludesAll(context, docs, [
    XTEND_DESIGN_TOKEN_SCHEMA,
    XTEND_DESIGN_TOKEN_LOCAL_GATE,
    XTEND_DESIGN_TOKEN_EXAMPLE_THEME_PATH,
    '--xtend-surface',
    '--xtend-focus-outline',
    'compact',
    'comfortable',
    'dense'
  ], 'Design Token docs page');
  context.assertIncludes(xThemeDocs, 'getDesignTokenContract()', 'x-theme docs describe Design Token API');
  context.assertIncludes(xThemeDocs, "`dense`", 'x-theme docs document dense density');
  context.assertIncludes(docsReadme, 'Design Tokens', 'Docs README links Design Tokens');
  context.assertIncludes(docsMenu, '"design-tokens"', 'Docs menu links Design Tokens');
  context.assertIncludes(browserReadme, XTEND_DESIGN_TOKEN_LOCAL_GATE, 'Browser README documents Design Token gate');
  context.assertIncludes(testsReadme, XTEND_DESIGN_TOKEN_LOCAL_GATE, 'Tests README documents Design Token gate');

  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E12-12 is completed');
  context.assertIncludes(workpackage, XTEND_DESIGN_TOKEN_SCHEMA, 'WP-E12-12 documents schema');
  context.assertIncludes(workpackage, XTEND_DESIGN_TOKEN_LOCAL_GATE, 'WP-E12-12 documents local gate');
  context.assertIncludes(workpackage, '`WP-E12-13` startbar', 'WP-E12-12 hands off WP-E12-13');
  context.assertIncludes(backlog, '| `WP-E12-12` | P1 | completed | WS6 | Enterprise Design System Token Productization vorbereiten |', 'Backlog marks WP-E12-12 completed');
  context.assertIncludes(backlog, '| `WP-E12-13` | P2 | completed | WS7 | RMT DSL Authoring Polish fuer Component Shells vorbereiten |', 'Backlog marks WP-E12-13 completed');
  context.assertIncludes(backlog, '| `WP-E12-14` | P2 | completed | WS8 | Release Candidate Gate Matrix fuer RC0 schneiden |', 'Backlog marks WP-E12-14 completed');
  context.assertIncludes(backlog, '| `WP-E12-15` | P2 | completed | WS9 | Docs, Migration Notes und Enterprise Adoption Guide aktualisieren |', 'Backlog marks WP-E12-15 completed');
  context.assertIncludes(backlog, '| `WP-E12-16` | P2 | completed | WS10 | Epic-12-Abschlussreview und RC0-Handoff |', 'Backlog marks WP-E12-16 completed');
  context.assertIncludes(backlog, 'Handoff nach WP-E12-12', 'Backlog contains WP-E12-12 handoff');
  context.assertIncludes(rcModel, '`WP-E12-12` Enterprise Design System Token Productization: abgeschlossen', 'RC model marks WP-E12-12 complete');
  assertIncludesAll(context, registry, [
    XTEND_DESIGN_TOKEN_MODULE_PATH,
    XTEND_DESIGN_TOKEN_SUITE_PATH,
    XTEND_DESIGN_TOKEN_CONTRACT_PATH,
    XTEND_DESIGN_TOKEN_DOC_PATH,
    XTEND_DESIGN_TOKEN_EXAMPLE_THEME_PATH
  ], 'Reference registry Design Token paths');

  return context.result({
    report: {
      schema: XTEND_DESIGN_TOKEN_REPORT_SCHEMA,
      tokenCount: contract.tokenNames.length,
      themePackCount: contract.themePacks.length,
      densityPackCount: contract.densityPacks.length,
      cssPartCount: contract.cssParts.length,
      localGate: XTEND_DESIGN_TOKEN_LOCAL_GATE
    }
  });
}

function printDesignTokenContractReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 12 Enterprise Design System Tokens erfolgreich.',
    failureTitle: 'Epic 12 Enterprise Design System Tokens fehlgeschlagen:'
  });
}

module.exports = {
  printDesignTokenContractReport,
  runDesignTokenContractSuite
};
