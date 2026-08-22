const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');

function resolveRootDir(options = {}) {
  return options.rootDir || require('path').resolve(__dirname, '..', '..');
}

function runXThemeComponentSuite(options = {}) {
  const rootDir = resolveRootDir(options);
  const context = createSuiteContext({
    id: 'component:x-theme',
    label: 'x-theme module contract'
  });

  const manifest = readJson('components/manifest.json', rootDir);
  const source = readText('components/xtheme.js', rootDir);
  const types = readText('components/xtheme.d.ts', rootDir);
  const fixture = readText('tests/components/fixtures/xtheme.component.html', rootDir);
  const docs = readText('docs/components/xtheme.md', rootDir);
  const syntaxCheck = syntaxCheckFile('components/xtheme.js', {
    rootDir,
    extension: '.js'
  });

  context.assert(manifest['x-theme'] === './xtheme.js', 'x-theme manifest entry points to xtheme.js');
  context.assert(syntaxCheck.ok, `x-theme source passes syntax check${syntaxCheck.ok ? '' : ` (${syntaxCheck.message})`}`);
  context.assert(source.includes('window.XTend.theme'), 'x-theme exposes window.XTend.theme');
  context.assert(source.includes('window.XTheme'), 'x-theme exposes legacy window.XTheme facade');
  context.assert(source.includes('theme-changed'), 'x-theme emits theme-changed');
  context.assert(source.includes('theme-variable-changed'), 'x-theme emits theme-variable-changed');
  context.assert(source.includes('theme-preference-changed'), 'x-theme emits preference changes');
  context.assert(source.includes('theme-a11y-announcement'), 'x-theme emits A11y announcement events');
  context.assert(source.includes('registerTheme'), 'x-theme supports runtime theme registration');
  context.assert(source.includes('loadExternalTheme'), 'x-theme supports external theme loading');
  context.assert(source.includes('getDesignTokens'), 'x-theme exposes design tokens');
  context.assert(source.includes('getA11yPreferences'), 'x-theme exposes A11y preference snapshot');
  context.assert(source.includes('setDensity'), 'x-theme supports runtime density changes');
  context.assert(source.includes('getThemeContext'), 'x-theme exposes propagated theme context');
  context.assert(source.includes('snapshotPerformance'), 'x-theme exposes performance snapshots');
  context.assert(source.includes('xtendScaffoldPerformanceProfile'), 'x-theme declares performance profile metadata');
  context.assert(source.includes('xtend.performance.component-profile.v1'), 'x-theme declares performance profile schema');
  context.assert(source.includes('xtendRmtMetadata'), 'x-theme declares RMT metadata without kernel coupling');
  context.assert(source.includes('xtend.rmt.component-contract.v1'), 'x-theme declares RMT component contract schema');
  context.assert(source.includes('xtendComponentNetworkContract'), 'x-theme declares component network context');
  context.assert(source.includes('xtend.component.network.v1'), 'x-theme declares component network schema');
  context.assert(source.includes('xtendScaffoldA11yProfile'), 'x-theme declares runtime A11y profile metadata');
  context.assert(source.includes('xtendMotionContrastPolicy'), 'x-theme declares Motion/Contrast policy metadata');
  context.assert(source.includes('xtend.a11y.motion-contrast-policy.v1'), 'x-theme declares Motion/Contrast policy schema');
  context.assert(source.includes('prefers-reduced-motion'), 'x-theme observes prefers-reduced-motion');
  context.assert(source.includes('forced-colors'), 'x-theme observes forced-colors');
  context.assert(source.includes('forced-color-adjust'), 'x-theme includes forced-color-adjust CSS');
  context.assert(source.includes('CanvasText') && source.includes('Highlight'), 'x-theme maps forced colors to system colors');
  context.assert(source.includes('aria-live') && source.includes("setAttribute('role', 'status')"), 'x-theme owns a live status announcer');
  context.assert(source.includes('data-theme'), 'x-theme synchronizes data-theme attribute');
  context.assert(source.includes('data-xtend-density'), 'x-theme synchronizes density attribute');
  context.assert(source.includes('data-xtend-motion'), 'x-theme synchronizes motion preference attribute');
  context.assert(source.includes('data-xtend-contrast'), 'x-theme synchronizes contrast preference attribute');
  context.assert(source.includes('--xtend-density-scale'), 'x-theme exposes density tokens');
  context.assert(source.includes('xtend-theme'), 'x-theme persists theme state under xtend-theme');
  context.assert(source.includes("xtendState.set('theme'"), 'x-theme mirrors current theme to state');
  context.assert(source.includes("xtendState.set('xtend.theme.density'"), 'x-theme mirrors density to state');
  context.assert(source.includes("xtendState.set('xtend.theme.context'"), 'x-theme mirrors theme context to state');
  context.assert(source.includes("xtendState.set('xtend.theme.performanceProfile'"), 'x-theme mirrors performance profile to state');
  context.assert(source.includes("xtendState.set('xtend.theme.preferences'"), 'x-theme mirrors A11y preferences to state');
  context.assert(types.includes('XThemeA11yPreferences'), 'x-theme public types expose A11y preferences');
  context.assert(types.includes('XThemeMotionContrastPolicy'), 'x-theme public types expose Motion/Contrast policy');
  context.assert(types.includes('XThemeDensity'), 'x-theme public types expose density type');
  context.assert(types.includes('XThemePerformanceProfile'), 'x-theme public types expose performance profile');
  context.assert(types.includes('XThemeContext'), 'x-theme public types expose theme context');
  context.assert(types.includes('XThemeRmtMetadata'), 'x-theme public types expose RMT metadata');
  context.assert(types.includes('theme-preference-changed'), 'x-theme public types include preference event');
  context.assert(types.includes('theme-a11y-announcement'), 'x-theme public types include announcement event');
  context.assert(types.includes('theme-density-changed'), 'x-theme public types include density event');
  context.assert(types.includes('theme-context-changed'), 'x-theme public types include context event');
  context.assert(types.includes('theme-performance-measured'), 'x-theme public types include performance measurement event');
  context.assert(fixture.includes('/components/xtheme.js'), 'x-theme fixture loads the repo-local module');
  context.assert(!fixture.includes('https://cdn.ccs-networks.de'), 'x-theme fixture has no CDN dependency');
  context.assert(fixture.includes('window.XTend.state'), 'x-theme fixture stubs state locally');
  context.assert(fixture.includes('setDensity'), 'x-theme fixture exercises density propagation');
  context.assert(fixture.includes('getThemeContext'), 'x-theme fixture checks theme context propagation');
  context.assert(fixture.includes('snapshotPerformance'), 'x-theme fixture checks performance snapshot');
  context.assert(fixture.includes('__xtendComponentResult'), 'x-theme fixture exposes a component result object');
  context.assert(docs.includes('# x-theme'), 'x-theme documentation is present');
  context.assert(docs.includes('xtend-loader.js'), 'x-theme docs describe loader integration');
  context.assert(docs.includes('components/manifest.json'), 'x-theme docs reference the component manifest');
  context.assert(docs.includes('RMT Hosts'), 'x-theme docs describe RMT host integration');

  return context.result({
    tag: 'x-theme',
    profiles: ['theme', 'stateful']
  });
}

function printXThemeComponentReport(result) {
  printSuiteReport(result, {
    successTitle: `${result.label} erfolgreich.`,
    failureTitle: `${result.label} fehlgeschlagen:`
  });
}

if (require.main === module) {
  const result = runXThemeComponentSuite();
  printXThemeComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXThemeComponentReport,
  runXThemeComponentSuite
};
