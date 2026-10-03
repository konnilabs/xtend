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

function runXtendI18nComponentSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const context = createSuiteContext({
    id: 'component:xtend-i18n',
    label: 'xtend-i18n infrastructure boundary contract'
  });
  const manifest = readJson('components/manifest.json', rootDir);
  const source = readText('components/xtend-i18n.js', rootDir);
  const types = readText('components/xtend-i18n.d.ts', rootDir);
  const fixture = readText('tests/components/fixtures/xtend-i18n.component.html', rootDir);
  const docsDe = readText('docs/de/components/xtend-i18n.md', rootDir);
  const docsEn = readText('docs/en/components/xtend-i18n.md', rootDir);
  const loader = readText('xtend-loader.js', rootDir);
  const policy = readText('security/manifest-import-policy.js', rootDir);
  const labelsEn = readText('components/i18n/labels.en.js', rootDir);
  const syntaxCheck = syntaxCheckFile('components/xtend-i18n.js', {
    rootDir,
    extension: '.js'
  });

  context.assert(manifest['xtend-i18n'] === './xtend-i18n.js', 'xtend-i18n manifest entry points to local source');
  context.assert(syntaxCheck.ok, `xtend-i18n source passes syntax check${syntaxCheck.ok ? '' : ` (${syntaxCheck.message})`}`);
  context.assert(!source.includes('customElements.define('), 'xtend-i18n does not register a visual Custom Element');
  context.assertIncludes(source, 'xtend.i18n.boundary-probe.v1', 'xtend-i18n declares boundary schema');
  context.assertIncludes(source, 'xtend.i18n.labels.v1', 'xtend-i18n declares label bundle schema');
  context.assertIncludes(source, 'xtend.i18n.state-adapter.v1', 'xtend-i18n declares state adapter schema');
  context.assertIncludes(source, 'xtend.i18n.xrouter-adapter.v1', 'xtend-i18n declares xrouter adapter schema');
  context.assertIncludes(source, 'xtend.i18n.component-label-contract.v1', 'xtend-i18n declares component label contract schema');
  context.assertIncludes(source, 'LOCALE_CHANGED', 'xtend-i18n publishes LOCALE_CHANGED');
  context.assertIncludes(source, 'xtend.i18n.locale.request', 'xtend-i18n supports the Classic state locale request key');
  context.assertIncludes(source, 'connectState', 'xtend-i18n exposes its state adapter');
  context.assertIncludes(source, 'connectRouter', 'xtend-i18n exposes xrouter adapter');
  context.assertIncludes(source, 'queryParam: \'lang\'', 'xtend-i18n defaults query locale parameter to lang');
  context.assertIncludes(source, 'urlMode: \'both\'', 'xtend-i18n supports prefix and query URL modes');
  context.assertIncludes(source, 'patchRouterRouteMatching', 'xtend-i18n patches router matching for locale prefixes');
  context.assertIncludes(source, 'patchCustomElementsDefine', 'xtend-i18n patches CustomElement definitions for label contracts');
  context.assertIncludes(source, 'explicitAuthoringWins: true', 'xtend-i18n keeps explicit author labels authoritative');
  context.assertIncludes(source, 'x-button', 'xtend-i18n includes existing component label contracts');
  context.assertIncludes(source, 'x-router', 'xtend-i18n includes router label contract');
  context.assertIncludes(source, 'no-rmt-kernel-import-of-xtend-types', 'xtend-i18n preserves RMT kernel boundary');

  context.assertIncludes(types, 'XtendI18nApi', 'xtend-i18n public types declare API interface');
  context.assertIncludes(types, 'XtendI18nLabelBundle', 'xtend-i18n public types declare label bundle');
  context.assertIncludes(types, 'XtendI18nComponentLabelContract', 'xtend-i18n public types declare component label contract');
  context.assertIncludes(types, 'XtendI18nStateAdapterContract', 'xtend-i18n public types declare the state adapter');
  context.assertIncludes(types, 'XtendI18nRouterAdapterContract', 'xtend-i18n public types declare xrouter adapter');
  context.assertIncludes(types, 'addEventListener<K extends keyof XtendI18nEventMap>', 'xtend-i18n public types expose typed event listener overload');

  context.assertIncludes(fixture, "import { xtendI18n } from '/components/xtend-i18n.js'", 'xtend-i18n fixture imports repo-local module');
  context.assertIncludes(fixture, "import { xtendState } from '/components/xtend-state.js'", 'xtend-i18n fixture imports repo-local Classic state');
  context.assert(!fixture.includes('https://cdn.ccs-networks.de'), 'xtend-i18n fixture has no CDN dependency');
  context.assertIncludes(fixture, 'data-boundary="i18n-probe"', 'xtend-i18n fixture marks non-visual boundary probe');
  context.assertIncludes(fixture, 'LOCALE_CHANGED', 'xtend-i18n fixture observes locale event');
  context.assertIncludes(fixture, 'xtend.i18n.locale.request', 'xtend-i18n fixture covers state requests');
  context.assertIncludes(fixture, 'lang=de', 'xtend-i18n fixture covers query locale URL');
  context.assertIncludes(fixture, "router.navigate('/de/fixture')", 'xtend-i18n fixture covers prefix locale URL');
  context.assert(!fixture.includes('path="/de/fixture"'), 'xtend-i18n fixture relies on adapter prefix matching');
  context.assertIncludes(fixture, 'customElements.get(\'x-button\').xtendI18nLabelContract', 'xtend-i18n fixture checks component label contract exposure');
  context.assertIncludes(fixture, '__xtendComponentResult', 'xtend-i18n fixture records component result contract');
  context.assertIncludes(fixture, 'i18n-results', 'xtend-i18n fixture exposes browser smoke results in the DOM');

  context.assertIncludes(labelsEn, "schema: 'xtend.i18n.labels.v1'", 'English label template declares label schema');
  context.assertIncludes(labelsEn, "'x-button.fallbackLabel': 'Click'", 'English label template exposes x-button fallback label');
  context.assertIncludes(labelsEn, "'x-router.routeLoading': 'Route is loading'", 'English label template exposes router loading label');

  context.assertIncludes(loader, "await tryLoad('xtend-i18n'", 'Loader bootstraps xtend-i18n after xtend-state');
  context.assertIncludes(loader, "BOOTSTRAP_MODULE_KEYS = ['xtend-state', 'xtend-i18n', 'x-utils']", 'Loader treats Classic state, i18n and x-utils as bootstrap modules');
  context.assertIncludes(policy, "RESERVED_BOOTSTRAP_KEYS = ['xtend-state', 'xtend-i18n']", 'Manifest policy reserves Classic state and i18n bootstrap keys');

  context.assertIncludes(docsDe, '# xtend-i18n', 'German xtend-i18n docs are present');
  context.assertIncludes(docsEn, '# xtend-i18n', 'English xtend-i18n docs are present');
  context.assertIncludes(docsEn, 'components/manifest.json', 'English docs reference component manifest');
  context.assertIncludes(docsEn, 'labelLoaders', 'English docs show lazy label loading');
  context.assertIncludes(docsEn, '/readme?lang=de', 'English docs describe lang query route');

  return context.result({
    tag: 'xtend-i18n',
    profiles: ['i18n', 'infrastructure']
  });
}

function printXtendI18nComponentReport(result) {
  printSuiteReport(result, {
    successTitle: 'xtend-i18n infrastructure boundary contract erfolgreich.',
    failureTitle: 'xtend-i18n infrastructure boundary contract fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runXtendI18nComponentSuite();
  printXtendI18nComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXtendI18nComponentReport,
  runXtendI18nComponentSuite
};
