const fs = require('fs');
const path = require('path');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
const { readJson, readText, resolveRepoPath, resolveRootDir } = require('../utils/files');
const { syntaxCheckFile } = require('../utils/process');

const XSCALER_PROTOCOL_SCHEMA = 'xtend.xscaler.protocol-suite.v1';
const FIXTURE_DIR = 'tests/rmt/fixtures/xscaler';
const FIXTURES = {
  preflightRequest: {
    path: `${FIXTURE_DIR}/xscaler-preflight-request.json`,
    schema: 'xtend.xscaler.preflight-request.v1'
  },
  preflightResponse: {
    path: `${FIXTURE_DIR}/xscaler-preflight-response.json`,
    schema: 'xtend.xscaler.preflight-response.v1'
  },
  remoteSurfacePlan: {
    path: `${FIXTURE_DIR}/xscaler-remote-surface-plan.json`,
    schema: 'xtend.xscaler.remote-surface-plan.v1'
  },
  xtensionDeployment: {
    path: `${FIXTURE_DIR}/xscaler-xtension-deployment.json`,
    schema: 'xtend.xscaler.xtension-deployment.v1'
  }
};
const DOCS = ['docs/en/xscaler-protocol.md', 'docs/de/xscaler-protocol.md'];
const REQUIRED_ANCHORS = ['## Schemas', '## Remote surface plan', '## SSR compatibility', '## XTensions deployment'];
const REQUIRED_DE_ANCHORS = ['## Schemas', '## Remote-Surface-Plan', '## SSR-Kompatibilitaet', '## XTensions-Deployment'];

function assertFileExists(context, rootDir, relativePath, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function validateFixtures(context, rootDir) {
  const request = readJson(FIXTURES.preflightRequest.path, rootDir);
  const response = readJson(FIXTURES.preflightResponse.path, rootDir);
  const plan = readJson(FIXTURES.remoteSurfacePlan.path, rootDir);
  const deployment = readJson(FIXTURES.xtensionDeployment.path, rootDir);

  Object.values(FIXTURES).forEach((fixture) => {
    assertFileExists(context, rootDir, fixture.path, `${fixture.path} exists`);
    const data = readJson(fixture.path, rootDir);
    context.assert(data.schema === fixture.schema, `${fixture.path} declares ${fixture.schema}`);
    context.assert(data.protocol === 'xscaler', `${fixture.path} declares xscaler protocol`);
  });

  context.assert(request.requestId === response.requestId, 'preflight response correlates to request id');
  context.assert(request.capabilities.includes('remote-surface-plan'), 'preflight request asks for remote surface plan capability');
  context.assert(request.capabilities.includes('ssr-compatible'), 'preflight request asks for SSR compatibility');
  context.assert(request.capabilities.includes('xtension-deployment'), 'preflight request asks for XTension deployment');
  context.assert(response.compatibility.ssr === 'compatible', 'preflight response marks SSR compatible');
  context.assert(plan.ssr.networkDuringRender === false, 'remote surface plan disables network during SSR render');
  context.assert(plan.fallbackSurface && plan.integrity.algorithm === 'sha256', 'remote surface plan has fallback and integrity');
  context.assert(deployment.remoteSurfacePlan === path.basename(FIXTURES.remoteSurfacePlan.path), 'XTension deployment references remote surface plan fixture');
  context.assert(deployment.ssr.hydrateAfterPreflight === true && deployment.ssr.requiresDom === false, 'XTension deployment is SSR-compatible');
}

function validateDocs(context, rootDir) {
  const menu = readText('docs/menu.json', rootDir);
  DOCS.forEach((docPath) => assertFileExists(context, rootDir, docPath, `${docPath} exists`));
  const en = readText(DOCS[0], rootDir);
  const de = readText(DOCS[1], rootDir);
  Object.values(FIXTURES).forEach((fixture) => {
    context.assert(en.includes(fixture.schema), `English docs mention ${fixture.schema}`);
    context.assert(de.includes(fixture.schema), `German docs mention ${fixture.schema}`);
  });
  REQUIRED_ANCHORS.forEach((anchor) => context.assert(en.includes(anchor), `English docs include ${anchor}`));
  REQUIRED_DE_ANCHORS.forEach((anchor) => context.assert(de.includes(anchor), `German docs include ${anchor}`));
  context.assert(menu.includes('xscaler-protocol'), 'docs menu links XScaler protocol');
  ['docs/en/rmt-reference-remote-surfaces.md', 'docs/de/rmt-reference-remote-surfaces.md', 'docs/en/rmt-node-ssr-adapter.md', 'docs/de/rmt-php-ssr-adapter.md', 'docs/de/xtensions-authoring-guide.md'].forEach((docPath) => {
    const text = readText(docPath, rootDir);
    context.assert(text.includes('xscaler-protocol'), `${docPath} references XScaler protocol docs`);
  });
}

function validateRegistration(context, rootDir) {
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const pkg = readJson('package.json', rootDir);
  const workflow = readText('.github/workflows/xtend-default-gates.yml', rootDir);
  context.assert(runner.includes("require('../tests/rmt/xscaler_protocol_suite')"), 'runner imports XScaler suite');
  context.assert(runner.includes("id: 'xscaler-protocol'"), 'runner registers xscaler-protocol gate');
  context.assert(pkg.scripts['test:xscaler-protocol'] === 'node scripts/run_xtend_tests.js xscaler-protocol', 'package exposes XScaler script');
  context.assert((pkg.xtend.releaseGates || []).includes('npm run test:xscaler-protocol'), 'release gates include XScaler protocol');
  context.assert(workflow.includes('npm run test:xscaler-protocol'), 'workflow validates XScaler protocol');
}

function runXScalerProtocolSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({ id: 'xscaler-protocol', label: 'XScaler Protocol Gate' });
  const syntax = syntaxCheckFile('tests/rmt/xscaler_protocol_suite.js', { rootDir, extension: '.js' });
  context.assert(syntax.ok, `XScaler suite syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  validateFixtures(context, rootDir);
  validateDocs(context, rootDir);
  validateRegistration(context, rootDir);
  return context.result({ schema: XSCALER_PROTOCOL_SCHEMA, fixtures: Object.values(FIXTURES).map((fixture) => fixture.path), docs: DOCS });
}

function printXScalerProtocolReport(result) {
  printSuiteReport(result, {
    successTitle: 'XScaler Protocol Gate erfolgreich.',
    failureTitle: 'XScaler Protocol Gate fehlgeschlagen:'
  });
}

module.exports = { printXScalerProtocolReport, runXScalerProtocolSuite };
