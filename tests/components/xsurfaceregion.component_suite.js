const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readText,
  resolveRootDir
} = require('../utils/files');

function runXSurfaceRegionComponentSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xsurfaceregion',
    label: 'x-surface-region component contract'
  });

  const source = readText('components/xsurfaceregion.js', rootDir);
  const types = readText('components/xsurfaceregion.d.ts', rootDir);
  const docs = readText('docs/components/xsurfaceregion.md', rootDir);
  const fixture = readText('tests/components/fixtures/xsurfaceregion.component.html', rootDir);

  context.assertIncludes(source, 'xtend.surface.record.v1', 'runtime exposes surface record contract');
  context.assertIncludes(source, 'type: \'region\'', 'runtime lowers generic kinds to region type');
  context.assertIncludes(source, 'xtendScaffoldPerformanceProfile', 'runtime exposes performance profile');
  context.assertIncludes(source, 'aria-label', 'runtime syncs accessible label');
  context.assertIncludes(source, 'surface-region-command', 'runtime emits manager command events');
  context.assertIncludes(source, 'bounds-mode', 'runtime accepts responsive bounds mode');
  context.assertIncludes(source, 'surfaceRegionCssLength', 'runtime preserves CSS-native initial bounds');
  context.assertIncludes(source, 'initial-min-width', 'runtime accepts responsive bounds constraints');
  context.assertIncludes(source, 'syncSurfaceRegionBoundsContainerScope', 'runtime enables container-scoped responsive bounds');
  context.assertIncludes(types, 'XSurfaceRegionCommandDetail', 'types expose command detail');
  context.assertIncludes(types, "'bounds-mode'", 'types expose bounds-mode attribute');
  context.assertIncludes(types, 'toSurfaceRecord(managerId', 'types expose surface record API');
  context.assertIncludes(docs, '# x-surface-region', 'docs describe x-surface-region');
  context.assertIncludes(docs, 'xtend-loader.js', 'docs describe loader integration');
  context.assertIncludes(docs, 'components/manifest.json', 'docs reference the component manifest');
  context.assertIncludes(fixture, '<x-surface-region', 'fixture instantiates x-surface-region');
  context.assertIncludes(fixture, 'kind="card"', 'fixture covers card kind');
  context.assertIncludes(fixture, '__xtendComponentResult', 'fixture exposes component result object');

  return context.result({ tag: 'x-surface-region' });
}

function printXSurfaceRegionComponentReport(result) {
  printSuiteReport(result, {
    successTitle: 'x-surface-region Component Contract erfolgreich.',
    failureTitle: 'x-surface-region Component Contract fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runXSurfaceRegionComponentSuite();
  printXSurfaceRegionComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXSurfaceRegionComponentReport,
  runXSurfaceRegionComponentSuite
};
