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

function runXKeymapComponentSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const context = createSuiteContext({
    id: 'component:x-keymap',
    label: 'x-keymap component contract'
  });
  const manifest = readJson('components/manifest.json', rootDir);
  const source = readText('components/xkeymap.js', rootDir);
  const types = readText('components/xkeymap.d.ts', rootDir);
  const fixture = readText('tests/components/fixtures/xkeymap.component.html', rootDir);
  const docsDe = readText('docs/de/components/xkeymap.md', rootDir);
  const docsEn = readText('docs/en/components/xkeymap.md', rootDir);
  const syntaxCheck = syntaxCheckFile('components/xkeymap.js', {
    rootDir,
    extension: '.js'
  });

  context.assert(manifest['x-keymap'] === './xkeymap.js', 'x-keymap manifest entry points to local source');
  context.assert(syntaxCheck.ok, `x-keymap source passes syntax check${syntaxCheck.ok ? '' : ` (${syntaxCheck.message})`}`);
  context.assertIncludes(source, "customElements.define('x-keymap'", 'x-keymap registers its Custom Element');
  context.assertIncludes(source, 'xtend.xkeymap.surface-contract.v1', 'x-keymap declares surface contract');
  context.assertIncludes(source, 'xtend.rmt.component-contract.v1', 'x-keymap declares RMT metadata');
  context.assertIncludes(source, 'xtend.performance.component-profile.v1', 'x-keymap declares performance profile');
  context.assertIncludes(source, "role=\"dialog\"", 'x-keymap exposes dialog role');
  context.assertIncludes(source, 'aria-modal="true"', 'x-keymap exposes modal semantics');
  context.assertIncludes(source, "eventBindingMode: 'dom-event-to-rmt-command'", 'x-keymap maps DOM events to RMT commands');
  context.assertIncludes(source, 'no-rmt-kernel-import-of-xtend-types', 'x-keymap preserves RMT kernel boundary');

  context.assertIncludes(types, 'XKeymapElement', 'x-keymap public types declare element interface');
  context.assertIncludes(types, 'XKeymapEntry', 'x-keymap public types declare entry shape');
  context.assertIncludes(types, 'XKeymapEventName', 'x-keymap public types declare event names');
  context.assertIncludes(types, 'XKeymapPublicEventContract', 'x-keymap public types declare public event contract');
  context.assertIncludes(types, 'XKeymapPerformanceProfile', 'x-keymap public types declare performance profile');
  context.assertIncludes(types, "'x-keymap': XKeymapElement", 'x-keymap public types extend HTMLElementTagNameMap');

  context.assertIncludes(fixture, '<x-keymap', 'x-keymap fixture renders the component tag');
  context.assertIncludes(fixture, 'type="module" src="/components/xkeymap.js"', 'x-keymap fixture loads repo-local component');
  context.assert(!fixture.includes('https://cdn.ccs-networks.de'), 'x-keymap fixture has no CDN dependency');
  context.assertIncludes(fixture, '__xtendComponentResult', 'x-keymap fixture records component result contract');
  context.assertIncludes(fixture, 'xkeymap-close', 'x-keymap fixture observes close event');

  context.assertIncludes(docsDe, '# x-keymap', 'German x-keymap docs are present');
  context.assertIncludes(docsDe, 'components/manifest.json', 'German x-keymap docs reference component manifest');
  context.assertIncludes(docsDe, 'components/xkeymap.d.ts', 'German x-keymap docs reference public types');
  context.assertIncludes(docsEn, '# x-keymap', 'English x-keymap docs are present');
  context.assertIncludes(docsEn, 'components/manifest.json', 'English x-keymap docs reference component manifest');
  context.assertIncludes(docsEn, 'components/xkeymap.d.ts', 'English x-keymap docs reference public types');

  return context.result({
    tag: 'x-keymap',
    profiles: ['overlay', 'interactive']
  });
}

function printXKeymapComponentReport(result) {
  printSuiteReport(result, {
    successTitle: 'x-keymap component contract erfolgreich.',
    failureTitle: 'x-keymap component contract fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runXKeymapComponentSuite();
  printXKeymapComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXKeymapComponentReport,
  runXKeymapComponentSuite
};
