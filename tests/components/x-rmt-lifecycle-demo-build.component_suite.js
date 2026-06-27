const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');

function runXRmtLifecycleDemoBuildComponentSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const context = createSuiteContext({
    id: 'component:x-rmt-lifecycle-demo-build',
    label: 'x-rmt-lifecycle-demo-build generated RMT app component contract'
  });
  const manifest = readJson('components/manifest.json', rootDir);
  const source = readText('components/x-rmt-lifecycle-demo-build.js', rootDir);
  const types = readText('components/x-rmt-lifecycle-demo-build.d.ts', rootDir);
  const fixture = readText('tests/components/fixtures/x-rmt-lifecycle-demo-build.component.html', rootDir);
  const syntaxCheck = syntaxCheckFile('components/x-rmt-lifecycle-demo-build.js', {
    rootDir,
    extension: '.js'
  });

  context.assert(manifest['x-rmt-lifecycle-demo-build'] === './x-rmt-lifecycle-demo-build.js', 'x-rmt-lifecycle-demo-build manifest entry points to local source');
  context.assert(syntaxCheck.ok, `x-rmt-lifecycle-demo-build source passes syntax check${syntaxCheck.ok ? '' : ` (${syntaxCheck.message})`}`);
  context.assertIncludes(source, "customElements.define('x-rmt-lifecycle-demo-build'", 'x-rmt-lifecycle-demo-build registers its Custom Element');
  context.assertIncludes(source, "attachShadow({ mode: 'open' })", 'x-rmt-lifecycle-demo-build creates open shadow DOM');
  context.assertIncludes(source, 'xtend.scaffold.feature-wiring.v1', 'x-rmt-lifecycle-demo-build declares scaffold wiring schema');
  context.assertIncludes(source, 'xtend.scaffold.component-extension-points.v1', 'x-rmt-lifecycle-demo-build declares extension point schema');
  context.assertIncludes(source, 'xtend.rmt.root-handshake.v1', 'x-rmt-lifecycle-demo-build declares RMT root handshake');
  context.assertIncludes(source, 'xtend.rmt.template-authoring.v1', 'x-rmt-lifecycle-demo-build declares template authoring contract');
  context.assertIncludes(source, 'xtend.a11y.profile.v1', 'x-rmt-lifecycle-demo-build declares A11y profile');
  context.assertIncludes(source, 'xtend.performance.component-profile.v1', 'x-rmt-lifecycle-demo-build declares performance profile');
  context.assertIncludes(source, 'component.visible.mount', 'x-rmt-lifecycle-demo-build exposes visible mount scheduler hint');
  context.assertIncludes(source, 'component.idle.hydrate', 'x-rmt-lifecycle-demo-build exposes idle hydration scheduler hint');
  context.assertIncludes(source, 'rmt-lifecycle-demo-build-ready', 'x-rmt-lifecycle-demo-build declares ready event channel');
  context.assertIncludes(source, 'rmt-lifecycle-demo-build-changed', 'x-rmt-lifecycle-demo-build declares changed event channel');
  context.assertIncludes(source, 'data-xtend-hydrated', 'x-rmt-lifecycle-demo-build marks hydration state');
  context.assertIncludes(source, 'role="${role}"', 'x-rmt-lifecycle-demo-build renders semantic region role');
  context.assertIncludes(source, 'aria-label="${this._escapeAttribute(accessibleName)}"', 'x-rmt-lifecycle-demo-build reflects accessible name');
  context.assertIncludes(source, 'data-variant="${variant}"', 'x-rmt-lifecycle-demo-build reflects variant');
  context.assertIncludes(source, "const variant = this._escapeAttribute(this.getAttribute('variant') || 'default');", 'x-rmt-lifecycle-demo-build escapes variant before rendering');

  context.assertIncludes(types, 'XRmtLifecycleDemoBuildElement', 'x-rmt-lifecycle-demo-build public types declare element interface');
  context.assertIncludes(types, 'XRmtLifecycleDemoBuildEventDetailMap', 'x-rmt-lifecycle-demo-build public types declare detail map');
  context.assertIncludes(types, 'XRmtLifecycleDemoBuildPublicEventContract', 'x-rmt-lifecycle-demo-build public types declare public event contract');
  context.assertIncludes(types, 'addEventListener<K extends keyof XRmtLifecycleDemoBuildEventMap>', 'x-rmt-lifecycle-demo-build public types expose typed event listener overload');
  context.assertIncludes(types, "'x-rmt-lifecycle-demo-build'", 'x-rmt-lifecycle-demo-build public types map HTMLElementTagNameMap');

  context.assertIncludes(fixture, '<x-rmt-lifecycle-demo-build', 'x-rmt-lifecycle-demo-build fixture contains the component tag');
  context.assertIncludes(fixture, '/components/x-rmt-lifecycle-demo-build.js', 'x-rmt-lifecycle-demo-build fixture loads repo-local component');
  context.assert(!fixture.includes('https://cdn.ccs-networks.de'), 'x-rmt-lifecycle-demo-build fixture has no CDN dependency');
  context.assertIncludes(fixture, 'aria-label="RMT Lifecycle Demo Build"', 'x-rmt-lifecycle-demo-build fixture sets accessible name');
  context.assertIncludes(fixture, 'customElements.whenDefined', 'x-rmt-lifecycle-demo-build fixture waits for definition');
  context.assertIncludes(fixture, 'xtendScaffoldWiring', 'x-rmt-lifecycle-demo-build fixture checks scaffold wiring');
  context.assertIncludes(fixture, 'xtendScaffoldA11yProfile', 'x-rmt-lifecycle-demo-build fixture checks A11y profile');
  context.assertIncludes(fixture, 'xtendScaffoldPerformanceProfile', 'x-rmt-lifecycle-demo-build fixture checks performance profile');
  context.assertIncludes(fixture, '__xtendComponentResult', 'x-rmt-lifecycle-demo-build fixture records component result contract');

  return context.result({
    tag: 'x-rmt-lifecycle-demo-build',
    profiles: ['display', 'stateful']
  });
}

function printXRmtLifecycleDemoBuildComponentReport(result) {
  printSuiteReport(result, {
    successTitle: 'x-rmt-lifecycle-demo-build generated RMT app component contract erfolgreich.',
    failureTitle: 'x-rmt-lifecycle-demo-build generated RMT app component contract fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runXRmtLifecycleDemoBuildComponentSuite();
  printXRmtLifecycleDemoBuildComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXRmtLifecycleDemoBuildComponentReport,
  runXRmtLifecycleDemoBuildComponentSuite
};
