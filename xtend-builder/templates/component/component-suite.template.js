const path = require('path');
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

function run{{className}}ComponentSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'component:{{tag}}',
    label: '{{tag}} component contract'
  });

  const source = readText('components/{{tag}}.js', rootDir);
  const fixture = readText('tests/components/fixtures/{{tag}}.component.html', rootDir);
  const docs = readText('docs/components/{{name}}.md', rootDir);
  const manifest = readJson('components/manifest.json', rootDir);
  const syntax = syntaxCheckFile('components/{{tag}}.js', { rootDir });

  context.assert(syntax.ok, '{{tag}} source passes syntax check');
  context.assert(source.includes("customElements.define('{{tag}}'") || source.includes('customElements.define("{{tag}}"'), '{{tag}} registers its Custom Element');
  context.assert(source.includes('attachShadow') && (source.includes("mode: 'open'") || source.includes('mode: "open"')), '{{tag}} creates open shadow DOM');
  context.assert(source.includes('observedAttributes'), '{{tag}} declares observed attributes');
  context.assert(source.includes('variant'), '{{tag}} handles variant attribute');
  context.assert(source.includes('hydrate()'), '{{tag}} exposes explicit hydration path');
  context.assert(source.includes('disconnectedCallback'), '{{tag}} exposes disconnect cleanup path');
  context.assert(source.includes('{{hydrationStateAttribute}}'), '{{tag}} marks hydrated instances');
  context.assert(source.includes('xtendScaffoldWiring'), '{{tag}} exposes scaffold feature wiring metadata');
  context.assert(source.includes('{{featureWiringSchema}}'), '{{tag}} exposes stable feature wiring schema');
  context.assert(source.includes('{{featureStatePrefix}}'), '{{tag}} exposes canonical state prefix');
  context.assert(source.includes('xtendScaffoldA11yProfile'), '{{tag}} exposes scaffold A11y profile metadata');
  context.assert(source.includes('{{a11yProfileSchema}}'), '{{tag}} exposes stable A11y profile schema');
  context.assert(source.includes('{{a11yTestContractSchema}}'), '{{tag}} exposes stable A11y test contract');
  context.assert(source.includes('{{a11yScreenreaderContractSchema}}'), '{{tag}} exposes stable screenreader signal contract');
  context.assert(source.includes('{{a11yMotionContrastContractSchema}}'), '{{tag}} exposes stable motion/contrast contract');
  context.assert(source.includes('prefers-reduced-motion'), '{{tag}} respects reduced-motion users');
  context.assert(source.includes('forced-colors'), '{{tag}} respects forced-colors users');
  context.assert(source.includes('xtendScaffoldPerformanceProfile'), '{{tag}} exposes scaffold Performance profile metadata');
  context.assert(source.includes('{{performanceProfileSchema}}'), '{{tag}} exposes stable Performance profile schema');
  context.assert(source.includes('{{performancePolicySchema}}'), '{{tag}} exposes stable Performance policy schema');
  context.assert(source.includes("aria-label") || source.includes('aria-label'), '{{tag}} supports accessible name attribute');
  context.assert(source.includes('role="${role}"') || source.includes('role='), '{{tag}} renders explicit role semantics');
  context.assert(!source.includes('xstate.on(') && !source.includes('xstate.off('), '{{tag}} avoids legacy xstate listener facades');
  context.assert(!source.includes('window.show'), '{{tag}} avoids unnamespaced global helper APIs');
  context.assert(source.includes('<slot'), '{{tag}} renders default slot content');
  context.assert(fixture.includes('<{{tag}}'), '{{tag}} fixture contains component markup');
  context.assert(fixture.includes('aria-label="{{a11yAccessibleNameDefault}}"'), '{{tag}} fixture sets accessible name');
  context.assert(fixture.includes('../../components/{{tag}}.js') || fixture.includes('../../../components/{{tag}}.js'), '{{tag}} fixture uses repo-local component import');
  context.assert(!fixture.includes('https://') && !fixture.includes('http://'), '{{tag}} fixture avoids external component imports');
  context.assert(fixture.includes('window.{{fixtureResultName}}'), '{{tag}} fixture exposes hydration result object');
  context.assert(fixture.includes('hydrated:'), '{{tag}} fixture reports hydration status');
  context.assert(fixture.includes('a11yProfile:') && fixture.includes('accessibleName:'), '{{tag}} fixture reports A11y hydration result');
  context.assert(fixture.includes('screenreaderSignals:') && fixture.includes('{{a11yScreenreaderContractSchema}}'), '{{tag}} fixture reports screenreader signal result');
  context.assert(fixture.includes('motionContrastPolicy:') && fixture.includes('{{a11yMotionContrastContractSchema}}'), '{{tag}} fixture reports motion/contrast policy result');
  context.assert(docs.includes('{{tag}}'), '{{tag}} docs contain component tag');
  context.assert(docs.includes('variant'), '{{tag}} docs describe variant attribute');
  context.assert(docs.includes('API- und Feature-Wiring'), '{{tag}} docs describe feature wiring');
  context.assert(docs.includes('{{featureWiringSchema}}'), '{{tag}} docs include feature wiring schema');
  context.assert(docs.includes('{{featureStatePrefix}}'), '{{tag}} docs include canonical state prefix');
  context.assert(docs.includes('A11y-Profil'), '{{tag}} docs include A11y profile section');
  context.assert(docs.includes('{{a11yProfileSchema}}'), '{{tag}} docs include A11y profile schema');
  context.assert(docs.includes('{{a11yTestContractSchema}}'), '{{tag}} docs include A11y test contract');
  context.assert(docs.includes('Screenreader-Signale'), '{{tag}} docs include screenreader signal section');
  context.assert(docs.includes('{{a11yScreenreaderContractSchema}}'), '{{tag}} docs include screenreader signal contract');
  context.assert(docs.includes('Motion-und-Contrast-Policy'), '{{tag}} docs include motion/contrast section');
  context.assert(docs.includes('{{a11yMotionContrastContractSchema}}'), '{{tag}} docs include motion/contrast contract');
  context.assert(docs.includes('node scripts/run_xtend_tests.js a11y-hydration'), '{{tag}} docs include A11y hydration gate');
  context.assert(docs.includes('node scripts/run_xtend_tests.js screenreader-signals'), '{{tag}} docs include Screenreader signal gate');
  context.assert(docs.includes('node scripts/run_xtend_tests.js motion-contrast'), '{{tag}} docs include Motion/Contrast gate');
  context.assert(docs.includes('Performance-Profil'), '{{tag}} docs include Performance profile section');
  context.assert(docs.includes('{{performancePolicySchema}}'), '{{tag}} docs include Performance policy schema');
  context.assert(docs.includes('{{performanceAuthorGuide}}'), '{{tag}} docs link Performance author guide');
  context.assert(docs.includes('node scripts/run_xtend_tests.js performance-regression'), '{{tag}} docs include Performance regression gate');
  context.assert(Array.isArray(manifest) || typeof manifest === 'object', '{{tag}} manifest file is parseable');

  return context.result({
    component: '{{tag}}',
    profiles: '{{profilesCsv}}'
  });
}

function print{{className}}ComponentReport(result) {
  printSuiteReport(result, {
    successTitle: '{{tag}} Component Contract erfolgreich.',
    failureTitle: '{{tag}} Component Contract fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = run{{className}}ComponentSuite();
  print{{className}}ComponentReport(result);
  if (!result.ok) {
    process.exit(1);
  }
}

module.exports = {
  print{{className}}ComponentReport,
  run{{className}}ComponentSuite
};
