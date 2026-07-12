const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readText,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');

const REQUIRED_MENU_MODES = Object.freeze(['drawer', 'side-panel', 'popover', 'fullscreen', 'inline-main']);
const REQUIRED_PLACEMENTS = Object.freeze(['start', 'end', 'top', 'bottom']);
const REQUIRED_MENU_ATTRIBUTES = Object.freeze([
  'menu-mode',
  'menu-placement',
  'menu-modal',
  'menu-open',
  'menu-breakpoint',
  'menu-width',
  'menu-max-height',
  'menu-align'
]);
const REQUIRED_SNAPSHOT_FIELDS = Object.freeze([
  'menuOpen',
  'menuMode',
  'menuPlacement',
  'menuModal',
  'menuBreakpoint',
  'menuWidth',
  'menuMaxHeight',
  'menuAlign',
  'compact'
]);
const REQUIRED_PARTS = Object.freeze([
  'brand title',
  'trigger control',
  'trigger-icon control icon',
  'menu drawer nav',
  'menu-surface drawer-surface nav',
  'menu-content nav',
  'backdrop'
]);
const REQUIRED_TOKENS = Object.freeze([
  '--xtend-header-menu-surface',
  '--xtend-header-menu-text',
  '--xtend-header-menu-border-color',
  '--xtend-header-menu-radius',
  '--xtend-header-menu-elevation',
  '--xtend-header-menu-padding',
  '--xtend-header-menu-gap',
  '--xtend-header-menu-width',
  '--xtend-header-menu-max-width',
  '--xtend-header-menu-max-height',
  '--xtend-header-menu-backdrop',
  '--xtend-header-menu-z-index'
]);
const REQUIRED_BRAND_SNAPSHOT_FIELDS = Object.freeze([
  'brandCollapse',
  'brandPresentation',
  'brandTitleFits',
  'brandAvailableWidth',
  'brandRequiredWidth'
]);

function assertIncludesAll(context, content, patterns, label) {
  patterns.forEach((pattern) => {
    context.assert(content.includes(pattern), `${label}: ${pattern}`);
  });
}

function runXHeaderMenuModesSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const context = createSuiteContext({
    id: 'xheader-menu-modes',
    label: 'ECH-WP-05 XHeader Menu Presentation Modes'
  });
  const source = readText('components/xheader.js', rootDir);
  const types = readText('components/xheader.d.ts', rootDir);
  const docs = readText('docs/components/xheader.md', rootDir);
  const fixture = readText('tests/components/fixtures/xheader.component.html', rootDir);
  const browserFixture = readText('tests/browser/fixtures/xheader-menu-modes-smoke.html', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const packageJson = readText('package.json', rootDir);
  const backlog = readText('development/XTend-Enterprise-Component-Flexibilitaets-und-Theme-Hardening-Backlog.md', rootDir);
  const syntax = syntaxCheckFile('components/xheader.js', { rootDir, extension: '.js' });

  context.assert(syntax.ok, `x-header source passes syntax check${syntax.ok ? '' : ` (${syntax.message})`}`);
  context.assert(source.includes('static get observedAttributes()'), 'x-header exposes observed attribute contract');
  assertIncludesAll(context, source, REQUIRED_MENU_ATTRIBUTES.map((attribute) => `"${attribute}"`), 'x-header observes menu attributes');
  assertIncludesAll(context, source, REQUIRED_MENU_MODES.map((mode) => `'${mode}'`), 'x-header source supports required menu modes');
  assertIncludesAll(context, source, REQUIRED_PLACEMENTS.map((placement) => `'${placement}'`), 'x-header source supports required menu placements');
  assertIncludesAll(context, source, REQUIRED_TOKENS, 'x-header exposes required menu tokens');
  assertIncludesAll(context, source, REQUIRED_PARTS.map((part) => `part="${part}"`), 'x-header exposes required menu parts');
  context.assert(source.includes('drawerMode: "fixed-full-width-overlay"'), 'x-header keeps legacy drawerMode snapshot alias');
  assertIncludesAll(context, source, REQUIRED_SNAPSHOT_FIELDS.map((field) => `${field}:`), 'x-header snapshot includes menu fields');
  assertIncludesAll(context, source, ['menu-before-open', 'menu-before-close', 'menu-opened', 'menu-closed', 'menu-mode-changed', 'menu-placement-changed'], 'x-header emits menu lifecycle/configuration events');
  assertIncludesAll(context, source, ['_positionMenu()', '_positionDrawer()', '_syncMenuPresentation', '_syncMenuA11y', '_trapMenuFocus(event)', '_restoreMenuFocus'], 'x-header implements menu mode behavior helpers');
  assertIncludesAll(context, source, ['aria-haspopup', 'aria-expanded', 'aria-modal', 'aria-hidden', 'inert', 'Escape', 'Tab'], 'x-header implements mode-aware a11y attributes and keyboard paths');
  context.assert(source.includes('data-xtend-header-menu-modal') || source.includes('xtendHeaderMenuModal'), 'x-header marks modal menu state for host diagnostics');
  context.assert(source.includes(':host([menu-mode="side-panel"])'), 'x-header styles side-panel mode');
  context.assert(source.includes(':host([menu-mode="popover"])'), 'x-header styles popover mode');
  context.assert(source.includes(':host([menu-mode="fullscreen"])'), 'x-header styles fullscreen mode');
  context.assert(source.includes(':host([menu-mode="inline-main"])'), 'x-header styles inline-main mode');
  context.assert(source.includes('@media (forced-colors: active)'), 'x-header keeps forced-colors coverage');
  context.assert(source.includes('@media (prefers-reduced-motion: reduce)'), 'x-header keeps reduced-motion coverage');
  context.assert(source.includes('XHEADER_BRAND_COLLAPSE_POLICIES') && source.includes('"brand-collapse"'), 'x-header exposes auto, never and always brand collapse policies');
  context.assert(source.includes('new ResizeObserver') && source.includes('_syncBrandPresentation') && source.includes('header-brand-visibility-changed'), 'x-header measures intrinsic brand fit and emits presentation changes');
  context.assert(source.includes(':host([logo-only]) .title-text') && source.includes('clip-path: inset(50%)'), 'x-header hides an unfitting title visually while retaining accessible text');
  assertIncludesAll(context, source, REQUIRED_BRAND_SNAPSHOT_FIELDS.map((field) => `${field}:`), 'x-header snapshot includes brand fit fields');

  assertIncludesAll(context, types, ['XHeaderMenuMode', 'XHeaderMenuPlacement', 'XHeaderMenuAlign', 'XHeaderBrandCollapsePolicy', 'XHeaderBrandPresentation', 'XHeaderToggleMenuOptions'], 'x-header public types expose menu and brand-fit APIs');
  assertIncludesAll(context, types, REQUIRED_MENU_MODES.map((mode) => `'${mode}'`), 'x-header public types include required menu modes');
  assertIncludesAll(context, types, REQUIRED_SNAPSHOT_FIELDS.map((field) => `${field}:`), 'x-header public types include menu snapshot fields');
  context.assert(types.includes('@deprecated Use menuMode'), 'x-header types mark drawerMode as legacy alias');
  assertIncludesAll(context, types, REQUIRED_BRAND_SNAPSHOT_FIELDS.map((field) => `${field}:`), 'x-header public types include brand fit snapshot fields');

  assertIncludesAll(context, docs, ['Menu Presentation Modes', '`drawer`', '`side-panel`', '`popover`', '`fullscreen`', '`inline-main`'], 'x-header docs describe menu modes');
  assertIncludesAll(context, docs, REQUIRED_MENU_ATTRIBUTES.map((attribute) => `\`${attribute}\``), 'x-header docs document menu attributes');
  assertIncludesAll(context, docs, ['menu-before-open', 'menu-before-close', 'menu-mode-changed', 'menu-placement-changed'], 'x-header docs document new events');
  assertIncludesAll(context, docs, ['--xtend-header-menu-width', '--xtend-header-menu-max-height', '--xtend-header-menu-backdrop'], 'x-header docs document host styling tokens');
  context.assert(docs.includes('Legacy CSS Parts'), 'x-header docs describe legacy drawer part aliases');
  assertIncludesAll(context, docs, ['`brand-collapse`', '`header-brand-visibility-changed`', '`--xtend-header-brand-fit-slack`'], 'x-header docs describe intrinsic brand fitting');

  assertIncludesAll(context, fixture, REQUIRED_MENU_ATTRIBUTES.map((attribute) => attribute), 'x-header component fixture covers menu attributes');
  context.assert(fixture.includes('brand-collapse="auto"'), 'x-header component fixture covers automatic brand collapse');
  assertIncludesAll(context, browserFixture, REQUIRED_MENU_MODES.map((mode) => `menu-mode="${mode}"`), 'x-header browser fixture renders all menu modes');
  context.assert(browserFixture.includes('customElements.whenDefined(\'x-header\')'), 'x-header browser fixture waits for custom element');
  context.assert(browserFixture.includes('snapshot()'), 'x-header browser fixture checks snapshots');

  context.assert(runner.includes('xheader-menu-modes'), 'Runner exposes xheader-menu-modes suite');
  context.assert(packageJson.includes('"test:xheader-menu-modes"'), 'package.json exposes xheader-menu-modes script');
  context.assert(backlog.includes('| `ECH-WP-05` | P0 | completed |'), 'Backlog marks ECH-WP-05 completed');

  return context.result({
    workpackage: 'ECH-WP-05',
    requiredMenuModes: REQUIRED_MENU_MODES.length,
    requiredSnapshotFields: REQUIRED_SNAPSHOT_FIELDS.length,
    localGate: 'node scripts/run_xtend_tests.js xheader-menu-modes --json'
  });
}

function printXHeaderMenuModesReport(result) {
  printSuiteReport(result, {
    successTitle: 'ECH-WP-05 XHeader Menu Presentation Modes erfolgreich.',
    failureTitle: 'ECH-WP-05 XHeader Menu Presentation Modes fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runXHeaderMenuModesSuite();
  printXHeaderMenuModesReport(result);
  process.exit(result.ok ? 0 : 1);
}

module.exports = {
  printXHeaderMenuModesReport,
  runXHeaderMenuModesSuite
};
