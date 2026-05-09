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

function runXUtilsComponentSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const context = createSuiteContext({
    id: 'component:x-utils',
    label: 'x-utils utility boundary contract'
  });
  const manifest = readJson('components/manifest.json', rootDir);
  const source = readText('components/xutils.js', rootDir);
  const types = readText('components/xutils.d.ts', rootDir);
  const fixture = readText('tests/components/fixtures/xutils.component.html', rootDir);
  const docs = readText('docs/components/xutils.md', rootDir);
  const syntaxCheck = syntaxCheckFile('components/xutils.js', {
    rootDir,
    extension: '.js'
  });

  context.assert(manifest['x-utils'] === './xutils.js', 'x-utils manifest entry points to local source');
  context.assert(syntaxCheck.ok, `x-utils source passes syntax check${syntaxCheck.ok ? '' : ` (${syntaxCheck.message})`}`);
  context.assert(!source.includes('customElements.define'), 'x-utils does not register a visual Custom Element');
  context.assertIncludes(source, 'xtend.utility.module-contract.v1', 'x-utils declares utility contract schema');
  context.assertIncludes(source, 'xtend.utility.import-policy.v1', 'x-utils declares import policy schema');
  context.assertIncludes(source, 'xtend.utility.boundary-probe.v1', 'x-utils declares boundary probe schema');
  context.assertIncludes(source, 'xtendUtilityContract', 'x-utils exposes utility contract metadata');
  context.assertIncludes(source, 'xtendImportPolicy', 'x-utils exposes import policy metadata');
  context.assertIncludes(source, 'assertLocalImport(specifier)', 'x-utils exposes local import policy check');
  context.assertIncludes(source, 'snapshotUtilityContract()', 'x-utils exposes boundary snapshot API');
  context.assertIncludes(source, 'no-rmt-kernel-import-of-xtend-types', 'x-utils preserves RMT kernel boundary');
  context.assert(!source.includes('https://cdn.ccs-networks.de/xtend/components/'), 'x-utils source has no CDN component import');

  context.assertIncludes(types, 'XUtilsApi', 'x-utils public types declare API interface');
  context.assertIncludes(types, 'XUtilsUtilityContract', 'x-utils public types declare utility contract');
  context.assertIncludes(types, 'XUtilsImportPolicy', 'x-utils public types declare import policy');
  context.assertIncludes(types, 'XUtilsImportPolicyResult', 'x-utils public types declare import policy result');
  context.assertIncludes(types, 'XUtilsBoundarySnapshot', 'x-utils public types declare boundary snapshot');
  context.assertIncludes(types, 'XUtilsTemplateApi', 'x-utils public types declare template API');
  context.assertIncludes(types, 'addEventListener<K extends keyof XUtilsEventMap>', 'x-utils public types expose typed policy event listener overload');
  context.assertIncludes(types, 'Window', 'x-utils public types expose Window API surface');

  context.assertIncludes(fixture, "import { XUtils } from '/components/xutils.js'", 'x-utils fixture imports repo-local module');
  context.assert(!fixture.includes('https://cdn.ccs-networks.de'), 'x-utils fixture has no CDN dependency');
  context.assertIncludes(fixture, 'data-boundary="utility-probe"', 'x-utils fixture marks utility boundary probe');
  context.assertIncludes(fixture, 'assertLocalImport', 'x-utils fixture checks import policy');
  context.assertIncludes(fixture, 'snapshotUtilityContract', 'x-utils fixture reads utility boundary snapshot');
  context.assertIncludes(fixture, 'xutils:import-policy-check', 'x-utils fixture observes policy events');
  context.assertIncludes(fixture, 'XTemplate.card', 'x-utils fixture exercises template recipe');
  context.assertIncludes(fixture, '__xtendComponentResult', 'x-utils fixture records component result contract');

  context.assertIncludes(docs, '# xutils', 'x-utils documentation is present');
  context.assertIncludes(docs, 'Utility Boundary Contract', 'x-utils docs document boundary contract');
  context.assertIncludes(docs, 'xtend.utility.module-contract.v1', 'x-utils docs document utility contract schema');
  context.assertIncludes(docs, 'xtend.utility.import-policy.v1', 'x-utils docs document import policy schema');
  context.assertIncludes(docs, 'assertLocalImport', 'x-utils docs document import policy helper');

  return context.result({
    tag: 'x-utils',
    profiles: ['utility']
  });
}

function printXUtilsComponentReport(result) {
  printSuiteReport(result, {
    successTitle: 'x-utils utility boundary contract erfolgreich.',
    failureTitle: 'x-utils utility boundary contract fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runXUtilsComponentSuite();
  printXUtilsComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXUtilsComponentReport,
  runXUtilsComponentSuite
};
