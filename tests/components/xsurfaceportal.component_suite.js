const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readText,
  resolveRootDir
} = require('../utils/files');

function runXSurfacePortalComponentSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xsurfaceportal',
    label: 'x-surface-portal component contract'
  });

  const source = readText('components/xsurfaceportal.js', rootDir);
  const types = readText('components/xsurfaceportal.d.ts', rootDir);
  const docs = readText('docs/components/xsurfaceportal.md', rootDir);
  const fixture = readText('tests/components/fixtures/xsurfaceportal.component.html', rootDir);

  context.assertIncludes(source, 'xtend.surface.portal-policy.v1', 'runtime emits portal policy records');
  context.assertIncludes(source, 'xtendScaffoldA11yProfile', 'runtime exposes a11y profile');
  context.assertIncludes(source, 'xtendScaffoldPerformanceProfile', 'runtime exposes performance profile');
  context.assertIncludes(source, 'surface-portal-policy', 'runtime emits policy events');
  context.assertIncludes(types, 'XSurfacePortalPolicyRecord', 'types expose policy record');
  context.assertIncludes(types, 'surface-portal-policy', 'types expose policy event');
  context.assertIncludes(docs, '# x-surface-portal', 'docs describe x-surface-portal');
  context.assertIncludes(docs, 'xtend-loader.js', 'docs describe loader integration');
  context.assertIncludes(docs, 'components/manifest.json', 'docs reference the component manifest');
  context.assertIncludes(fixture, '<x-surface-portal', 'fixture instantiates x-surface-portal');
  context.assertIncludes(fixture, 'policy="toast-region"', 'fixture covers toast-region portal policy');
  context.assertIncludes(fixture, '__xtendComponentResult', 'fixture exposes component result object');

  return context.result({ tag: 'x-surface-portal' });
}

function printXSurfacePortalComponentReport(result) {
  printSuiteReport(result, {
    successTitle: 'x-surface-portal Component Contract erfolgreich.',
    failureTitle: 'x-surface-portal Component Contract fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runXSurfacePortalComponentSuite();
  printXSurfacePortalComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXSurfacePortalComponentReport,
  runXSurfacePortalComponentSuite
};
