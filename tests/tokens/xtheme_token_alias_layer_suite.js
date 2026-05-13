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
  COMPONENT_ALIAS_GROUPS,
  GLOBAL_ALIASES,
  KERNEL_BOUNDARY,
  LEGACY_ALIASES,
  P0_COMPONENTS,
  REQUIRED_GLOBAL_PREFIXES,
  XTHEME_TOKEN_ALIAS_LAYER_DOC_PATH,
  XTHEME_TOKEN_ALIAS_LAYER_FIXTURE_PATH,
  XTHEME_TOKEN_ALIAS_LAYER_LOCAL_GATE,
  XTHEME_TOKEN_ALIAS_LAYER_MODULE_PATH,
  XTHEME_TOKEN_ALIAS_LAYER_PACKAGE_SCRIPT,
  XTHEME_TOKEN_ALIAS_LAYER_REPORT_SCHEMA,
  XTHEME_TOKEN_ALIAS_LAYER_SCHEMA,
  XTHEME_TOKEN_ALIAS_LAYER_SUITE_PATH,
  XTHEME_TOKEN_ALIAS_LAYER_TYPES_PATH,
  XTHEME_TOKEN_ALIAS_LAYER_WORKPACKAGE,
  createAllComponentAliasTokenMap,
  createGlobalAliasTokenMap,
  createXThemeAliasThemeTokens,
  createXThemeTokenAliasLayer,
  validateXThemeTokenAliasLayer
} = require('../../design-tokens/xtheme-token-alias-layer');

const BACKLOG_PATH = 'development/XTend-Enterprise-Component-Flexibilitaets-und-Theme-Hardening-Backlog.md';
const RESULT_KEY = '__xtendXThemeTokenAliasLayerResult';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, source, expected, label) {
  expected.forEach((entry) => {
    context.assert(source.includes(entry), `${label} includes ${entry}`);
  });
}

function runXThemeTokenAliasLayerSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xtheme-token-alias-layer',
    label: 'ECH-WP-03 XTheme Token Alias Layer'
  });
  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const doc = readText(XTHEME_TOKEN_ALIAS_LAYER_DOC_PATH, rootDir);
  const fixture = readText(XTHEME_TOKEN_ALIAS_LAYER_FIXTURE_PATH, rootDir);
  const moduleSource = readText(XTHEME_TOKEN_ALIAS_LAYER_MODULE_PATH, rootDir);
  const typesSource = readText(XTHEME_TOKEN_ALIAS_LAYER_TYPES_PATH, rootDir);
  const suiteSource = readText(XTHEME_TOKEN_ALIAS_LAYER_SUITE_PATH, rootDir);
  const xThemeSource = readText('components/xtheme.js', rootDir);
  const xThemeTypes = readText('components/xtheme.d.ts', rootDir);
  const xButtonSource = readText('components/xbutton.js', rootDir);
  const xMenuSource = readText('components/xmenu.js', rootDir);
  const contract = createXThemeTokenAliasLayer();
  const validation = validateXThemeTokenAliasLayer(contract);
  const invalidValidation = validateXThemeTokenAliasLayer({
    schema: XTHEME_TOKEN_ALIAS_LAYER_SCHEMA,
    reportSchema: XTHEME_TOKEN_ALIAS_LAYER_REPORT_SCHEMA,
    workpackage: XTHEME_TOKEN_ALIAS_LAYER_WORKPACKAGE,
    runtimeProvider: 'x-theme',
    kernelBoundary: KERNEL_BOUNDARY,
    globalAliases: [],
    componentAliases: {},
    legacyAliases: [],
    themeVariants: {}
  });
  const globalTokenMap = createGlobalAliasTokenMap();
  const componentTokenMap = createAllComponentAliasTokenMap();
  const forcedColorTokens = createXThemeAliasThemeTokens('forced-colors');
  const moduleSyntax = syntaxCheckFile(XTHEME_TOKEN_ALIAS_LAYER_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(XTHEME_TOKEN_ALIAS_LAYER_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, XTHEME_TOKEN_ALIAS_LAYER_MODULE_PATH, rootDir, 'XTheme Token Alias module exists');
  assertFileExists(context, XTHEME_TOKEN_ALIAS_LAYER_TYPES_PATH, rootDir, 'XTheme Token Alias types exist');
  assertFileExists(context, XTHEME_TOKEN_ALIAS_LAYER_DOC_PATH, rootDir, 'XTheme Token Alias mapping doc exists');
  assertFileExists(context, XTHEME_TOKEN_ALIAS_LAYER_FIXTURE_PATH, rootDir, 'XTheme Token Alias fixture exists');
  assertFileExists(context, XTHEME_TOKEN_ALIAS_LAYER_SUITE_PATH, rootDir, 'XTheme Token Alias suite exists');
  context.assert(moduleSyntax.ok, `XTheme Token Alias module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `XTheme Token Alias suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(contract.schema === XTHEME_TOKEN_ALIAS_LAYER_SCHEMA, 'Alias layer declares schema');
  context.assert(contract.reportSchema === XTHEME_TOKEN_ALIAS_LAYER_REPORT_SCHEMA, 'Alias layer declares report schema');
  context.assert(contract.workpackage === XTHEME_TOKEN_ALIAS_LAYER_WORKPACKAGE, 'Alias layer binds ECH-WP-03');
  context.assert(contract.runtimeProvider === 'x-theme', 'Alias layer binds x-theme runtime provider');
  context.assert(contract.kernelBoundary === KERNEL_BOUNDARY, 'Alias layer keeps RMT kernel boundary');
  context.assert(validation.schema === XTHEME_TOKEN_ALIAS_LAYER_REPORT_SCHEMA, 'Alias validator emits report schema');
  context.assert(validation.ok === true, 'Alias validator accepts generated layer');
  context.assert(invalidValidation.ok === false, 'Alias validator rejects incomplete layers');
  assertIncludesAll(context, contract.canonicalPrefixes, REQUIRED_GLOBAL_PREFIXES, 'Alias canonical prefixes');
  assertIncludesAll(context, contract.p0Components, P0_COMPONENTS, 'Alias P0 components');
  context.assert(contract.globalAliases.length === GLOBAL_ALIASES.length, 'Alias layer exposes every global alias');
  context.assert(contract.legacyAliases.length === LEGACY_ALIASES.length, 'Alias layer exposes every legacy alias');
  context.assert(Object.keys(contract.componentAliases).length === P0_COMPONENTS.length, 'Alias layer exposes one component group per P0 component');
  Object.entries(COMPONENT_ALIAS_GROUPS).forEach(([tag, group]) => {
    context.assert(contract.componentAliases[tag].prefix === group.prefix, `${tag}: alias prefix is stable`);
    context.assert(contract.componentAliases[tag].aliases.length === group.aliases.length, `${tag}: alias count is stable`);
  });

  assertIncludesAll(context, Object.keys(globalTokenMap), [
    '--xtend-color-action',
    '--xtend-surface-page',
    '--xtend-surface-panel',
    '--xtend-text-primary',
    '--xtend-radius-control',
    '--xtend-space-control-gap',
    '--xtend-elevation-2',
    '--xtend-motion-easing-standard'
  ], 'Global alias token map');
  assertIncludesAll(context, Object.keys(componentTokenMap), [
    '--xtend-header-surface',
    '--xtend-button-primary-surface',
    '--xtend-menu-item-hover-surface',
    '--xtend-drawer-overlay-surface',
    '--xtend-modal-overlay-surface',
    '--xtend-popover-surface',
    '--xtend-toast-surface',
    '--xtend-icon-color'
  ], 'Component alias token map');
  context.assert(forcedColorTokens['--xtend-surface-page'] === 'Canvas', 'Forced-colors maps page surface to Canvas');
  context.assert(forcedColorTokens['--xtend-text-primary'] === 'CanvasText', 'Forced-colors maps text to CanvasText');
  context.assert(forcedColorTokens['--xtend-color-action'] === 'Highlight', 'Forced-colors maps action color to Highlight');
  context.assert(forcedColorTokens['--xtend-text-on-action'] === 'HighlightText', 'Forced-colors maps action text to HighlightText');
  context.assert(forcedColorTokens['--xtend-elevation-2'] === 'none', 'Forced-colors disables decorative elevation');

  assertIncludesAll(context, moduleSource, [
    XTHEME_TOKEN_ALIAS_LAYER_SCHEMA,
    'createXThemeTokenAliasLayer',
    'createXThemeAliasThemeTokens',
    'validateXThemeTokenAliasLayer',
    '--xtend-surface-page',
    '--xtend-button-primary-surface',
    '--xtend-menu-item-hover-surface'
  ], 'Alias module source');
  assertIncludesAll(context, typesSource, [
    'XThemeTokenAliasLayer',
    'createXThemeTokenAliasLayer',
    'validateXThemeTokenAliasLayer'
  ], 'Alias public types');
  context.assertIncludes(suiteSource, 'XTHEME_TOKEN_ALIAS_LAYER_REPORT_SCHEMA', 'Alias suite declares report schema');

  assertIncludesAll(context, xThemeSource, [
    XTHEME_TOKEN_ALIAS_LAYER_SCHEMA,
    'XTHEME_ALIAS_GLOBAL_TOKENS',
    'XTHEME_ALIAS_COMPONENT_TOKENS',
    'getTokenAliasLayer()',
    "aliasLayerWorkpackage: 'ECH-WP-03'",
    '--xtend-surface-page',
    '--xtend-button-primary-surface',
    '--xtend-menu-item-hover-surface'
  ], 'x-theme runtime alias integration');
  assertIncludesAll(context, xThemeTypes, [
    'XThemeTokenAliasLayer',
    'getTokenAliasLayer(): XThemeTokenAliasLayer',
    "aliasLayerWorkpackage?: 'ECH-WP-03'"
  ], 'x-theme public types');

  assertIncludesAll(context, xButtonSource, [
    '--xtend-button-surface',
    '--xtend-button-primary-surface',
    '--xtend-button-focus-outline',
    '--xtend-button-motion-duration'
  ], 'x-button visible alias pilot');
  context.assert(!xButtonSource.includes('background: rgba(40, 60, 120, 0.25);'), 'x-button no longer uses legacy hardcoded default surface');
  context.assert(!xButtonSource.includes('linear-gradient(135deg, rgba(0,123,255'), 'x-button no longer hardcodes primary gradient');
  assertIncludesAll(context, xMenuSource, [
    '--xtend-menu-surface',
    '--xtend-menu-item-hover-surface',
    '--xtend-menu-focus-outline',
    '--xtend-menu-motion-duration'
  ], 'x-menu visible alias pilot');
  context.assert(!xMenuSource.includes('background: var(--xtend-menu-bg, rgba(40, 60, 120, 0.25));'), 'x-menu no longer uses legacy hardcoded default surface');
  context.assert(!xMenuSource.includes('linear-gradient(135deg, rgba(0,123,255'), 'x-menu no longer hardcodes primary gradient');

  assertIncludesAll(context, doc, [
    XTHEME_TOKEN_ALIAS_LAYER_SCHEMA,
    XTHEME_TOKEN_ALIAS_LAYER_LOCAL_GATE,
    'XTend.css Beispiel',
    'XTheme Beispiel',
    '--xtend-surface-page',
    '--xtend-button-primary-surface',
    '--xtend-menu-item-hover-surface',
    'CanvasText'
  ], 'Alias mapping document');
  assertIncludesAll(context, fixture, [
    XTHEME_TOKEN_ALIAS_LAYER_SCHEMA,
    RESULT_KEY,
    '--xtend-surface-page',
    '--xtend-text-primary',
    '--xtend-button-primary-surface',
    '--xtend-menu-surface',
    'data-theme="forced-colors"',
    'CanvasText'
  ], 'Alias browser fixture');
  [
    'alias layer light tokens visible',
    'alias layer dark tokens visible',
    'alias layer high contrast tokens visible',
    'alias layer forced colors system tokens visible',
    'alias layer component aliases visible',
    'alias layer host override path visible'
  ].forEach((check) => {
    context.assertIncludes(fixture, `recordCheck('${check}'`, `Alias fixture records ${check}`);
  });

  context.assertIncludes(backlog, '| `ECH-WP-03` | P0 | completed |', 'Backlog marks ECH-WP-03 completed');
  context.assertIncludes(backlog, XTHEME_TOKEN_ALIAS_LAYER_DOC_PATH, 'Backlog links Alias mapping doc');
  context.assertIncludes(backlog, XTHEME_TOKEN_ALIAS_LAYER_FIXTURE_PATH, 'Backlog links Alias fixture');
  context.assertIncludes(backlog, XTHEME_TOKEN_ALIAS_LAYER_LOCAL_GATE, 'Backlog exposes Alias local gate');
  context.assertIncludes(runner, "id: 'xtheme-token-alias-layer'", 'Runner exposes XTheme Token Alias suite');
  context.assertIncludes(runner, 'runXThemeTokenAliasLayerSuite', 'Runner imports XTheme Token Alias suite');
  context.assert(packageManifest.scripts['test:xtheme-token-alias-layer'] === 'node scripts/run_xtend_tests.js xtheme-token-alias-layer', 'Package exposes XTheme Token Alias script');
  context.assert(packageManifest.exports['./design-tokens/xtheme-token-alias-layer'].default === './design-tokens/xtheme-token-alias-layer.js', 'Package exports XTheme Token Alias module');

  return context.result({
    report: {
      schema: XTHEME_TOKEN_ALIAS_LAYER_REPORT_SCHEMA,
      workpackage: XTHEME_TOKEN_ALIAS_LAYER_WORKPACKAGE,
      globalAliasCount: GLOBAL_ALIASES.length,
      componentAliasCount: Object.keys(componentTokenMap).length,
      legacyAliasCount: LEGACY_ALIASES.length,
      p0ComponentCount: P0_COMPONENTS.length,
      localGate: XTHEME_TOKEN_ALIAS_LAYER_LOCAL_GATE
    }
  });
}

function printXThemeTokenAliasLayerReport(result) {
  printSuiteReport(result, {
    successTitle: 'ECH-WP-03 XTheme Token Alias Layer erfolgreich.',
    failureTitle: 'ECH-WP-03 XTheme Token Alias Layer fehlgeschlagen:'
  });
}

module.exports = {
  BACKLOG_PATH,
  RESULT_KEY,
  printXThemeTokenAliasLayerReport,
  runXThemeTokenAliasLayerSuite
};
