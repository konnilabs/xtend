const fs = require('fs');
const http = require('http');
const path = require('path');
const {
  PROD_LIKE_CSP_POLICY,
  SERVER_CONTRACT,
  listenXtendDevServer
} = require('../../scripts/serve_xtend_dev');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  EPIC13_PROD_BROWSER_CSP_SMOKE_CONTRACT,
  EPIC13_PROD_BROWSER_CSP_SMOKE_DOCS,
  EPIC13_PROD_BROWSER_CSP_SMOKE_FIXTURE_SCHEMA,
  EPIC13_PROD_BROWSER_CSP_SMOKE_LOCAL_GATE,
  EPIC13_PROD_BROWSER_CSP_SMOKE_MODULE,
  EPIC13_PROD_BROWSER_CSP_SMOKE_PACKAGE_SCRIPT,
  EPIC13_PROD_BROWSER_CSP_SMOKE_REPORT_SCHEMA,
  EPIC13_PROD_BROWSER_CSP_SMOKE_SCHEMA,
  EPIC13_PROD_BROWSER_CSP_SMOKE_STATUS,
  EPIC13_PROD_BROWSER_CSP_SMOKE_STEERING,
  EPIC13_PROD_BROWSER_CSP_SMOKE_SUITE,
  EPIC13_PROD_BROWSER_CSP_SMOKE_TARGET,
  EPIC13_PROD_BROWSER_CSP_SMOKE_WORKPACKAGE,
  EPIC13_PROD_BROWSER_CSP_SMOKE_WORKPACKAGE_DOC,
  PROD_CSP_FIXTURE,
  PROD_CSP_MANIFEST,
  PROD_CSP_NONCE,
  PROD_CSP_RESULT_KEY,
  PUBLISH_BOUNDARY,
  REQUIRED_DOCS,
  REQUIRED_PROD_SMOKE_ASSERTIONS,
  REQUIRED_SOURCE_GATES,
  createEpic13ProdBrowserCspSmokePlan,
  createEpic13ProdBrowserCspSmokeReport,
  validateEpic13ProdBrowserCspSmokePlan
} = require('../../catalog/epic13-prod-browser-csp-smoke');

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, values, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(values) && values.includes(entry), `${label} includes ${entry}`);
  });
}

function assertTextIncludesAll(context, text, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(text, entry, `${label} includes ${entry}`);
  });
}

function requestText(url) {
  const target = new URL(url);
  const origin = `${target.protocol}//${target.host}`;
  const rawPath = String(url).startsWith(origin)
    ? String(url).slice(origin.length) || '/'
    : `${target.pathname}${target.search}`;

  return new Promise((resolve, reject) => {
    const request = http.request({
      hostname: target.hostname,
      port: target.port,
      path: rawPath,
      method: 'GET'
    }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          headers: response.headers,
          body
        });
      });
    });

    request.on('error', reject);
    request.end();
  });
}

async function assertProdLocalServerProbe(context, rootDir) {
  let handle = null;
  try {
    handle = await listenXtendDevServer({
      rootDir,
      defaultPath: PROD_CSP_FIXTURE,
      port: 0,
      contentSecurityPolicy: PROD_LIKE_CSP_POLICY
    });

    context.assert(handle.schema === SERVER_CONTRACT, 'PROD CSP smoke uses shared local dev server contract');
    const response = await requestText(`${handle.origin}/${PROD_CSP_FIXTURE}`);
    context.assert(response.statusCode === 200, 'PROD CSP fixture is served by the local server');
    context.assert(response.headers['content-type'].includes('text/html'), 'PROD CSP fixture is served as HTML');
    context.assert(response.headers['cache-control'] === 'no-store', 'PROD CSP fixture keeps no-store cache policy');
    context.assert(response.headers['content-security-policy'] === PROD_LIKE_CSP_POLICY, 'PROD CSP server emits configured CSP header');
    context.assert(response.headers['x-xtend-dev-server'] === SERVER_CONTRACT, 'PROD CSP response carries server contract header');
    context.assert(response.body.includes(EPIC13_PROD_BROWSER_CSP_SMOKE_FIXTURE_SCHEMA), 'PROD CSP fixture body is reachable over local server');

    const manifestResponse = await requestText(`${handle.origin}${PROD_CSP_MANIFEST}`);
    context.assert(manifestResponse.statusCode === 200, 'PROD CSP server serves same-origin fixture manifest');
    context.assert(manifestResponse.headers['content-type'].includes('application/json'), 'PROD CSP server serves manifest as JSON');
  } catch (error) {
    context.fail(`PROD CSP local server probe (${error.message})`);
  } finally {
    if (handle && handle.server) {
      await new Promise((resolve) => handle.server.close(resolve));
    }
  }
}

async function runEpic13ProdBrowserCspSmokeSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'epic13-prod-browser-csp-smoke',
    label: 'Epic 13 PROD Browser CSP Smoke'
  });
  const plan = createEpic13ProdBrowserCspSmokePlan({ rootDir });
  const validation = validateEpic13ProdBrowserCspSmokePlan(plan);
  const report = createEpic13ProdBrowserCspSmokeReport({ rootDir, plan });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.epic13ProdBrowserCspSmoke;
  const rc1Metadata = packageManifest.xtend && packageManifest.xtend.epic13Rc1Readiness;
  const ownerMetadata = packageManifest.xtend && packageManifest.xtend.epic13ReleaseOwnerAcceptance;
  const networkMetadata = packageManifest.xtend && packageManifest.xtend.epic13ConditionalNetworkEvidence;
  const packageLockMetadata = packageManifest.xtend && packageManifest.xtend.epic13PackageExportLock;
  const hydrationMetadata = packageManifest.xtend && packageManifest.xtend.epic13HydrationPerformanceClosure;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const serverSource = readText('scripts/serve_xtend_dev.js', rootDir);
  const fixture = readText(PROD_CSP_FIXTURE, rootDir);
  const fixtureManifest = readJson('tests/browser/fixtures/components/manifest.json', rootDir);
  const loaderSource = readText('xtend-loader.js', rootDir);
  const policySource = readText('security/manifest-import-policy.js', rootDir);
  const browserSuite = readText('tests/browser/browser_smoke_suite.js', rootDir);
  const steering = readText(EPIC13_PROD_BROWSER_CSP_SMOKE_STEERING, rootDir);
  const contractDoc = readText(EPIC13_PROD_BROWSER_CSP_SMOKE_CONTRACT, rootDir);
  const workpackage = readText(EPIC13_PROD_BROWSER_CSP_SMOKE_WORKPACKAGE_DOC, rootDir);
  const docs = readText(EPIC13_PROD_BROWSER_CSP_SMOKE_DOCS, rootDir);
  const rc1Docs = readText('docs/rc1-readiness.md', rootDir);
  const ownerDocs = readText('docs/release-owner-acceptance.md', rootDir);
  const hydrationDocs = readText('docs/hydration-performance-closure.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const releaseChecklist = readText('development/XTend-Release-Checklist-und-SemVer-Policy.md', rootDir);
  const ciMatrix = readText('development/XTend-CI-Gate-Matrix.md', rootDir);
  const enterpriseAdoption = readText('docs/enterprise-adoption.md', rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const readme = readText('README.md', rootDir);
  const changelog = readText('CHANGELOG.md', rootDir);
  const moduleSyntax = syntaxCheckFile(EPIC13_PROD_BROWSER_CSP_SMOKE_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(EPIC13_PROD_BROWSER_CSP_SMOKE_SUITE, { rootDir, extension: '.js' });
  const serverSyntax = syntaxCheckFile('scripts/serve_xtend_dev.js', { rootDir, extension: '.js' });

  [
    EPIC13_PROD_BROWSER_CSP_SMOKE_MODULE,
    EPIC13_PROD_BROWSER_CSP_SMOKE_SUITE,
    EPIC13_PROD_BROWSER_CSP_SMOKE_STEERING,
    EPIC13_PROD_BROWSER_CSP_SMOKE_CONTRACT,
    EPIC13_PROD_BROWSER_CSP_SMOKE_WORKPACKAGE_DOC,
    EPIC13_PROD_BROWSER_CSP_SMOKE_DOCS,
    PROD_CSP_FIXTURE
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as required PROD browser CSP doc`);
  });

  context.assert(moduleSyntax.ok, `Epic 13 PROD Browser CSP module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Epic 13 PROD Browser CSP suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(serverSyntax.ok, `Local dev server syntax passes${serverSyntax.ok ? '' : ` (${serverSyntax.message})`}`);
  context.assert(plan.schema === EPIC13_PROD_BROWSER_CSP_SMOKE_SCHEMA, 'PROD Browser CSP smoke exposes stable schema');
  context.assert(plan.fixtureSchema === EPIC13_PROD_BROWSER_CSP_SMOKE_FIXTURE_SCHEMA, 'PROD Browser CSP smoke exposes fixture schema');
  context.assert(plan.reportSchema === EPIC13_PROD_BROWSER_CSP_SMOKE_REPORT_SCHEMA, 'PROD Browser CSP smoke exposes report schema');
  context.assert(plan.workpackage === EPIC13_PROD_BROWSER_CSP_SMOKE_WORKPACKAGE, 'PROD Browser CSP smoke belongs to WP-E13-07');
  context.assert(plan.status === EPIC13_PROD_BROWSER_CSP_SMOKE_STATUS, 'PROD Browser CSP smoke is accepted');
  context.assert(plan.sourceSchema === 'xtend.epic13.hydration-performance-closure.v1', 'PROD Browser CSP smoke consumes hydration closure');
  context.assert(plan.sourceValidationOk === true && plan.sourceReportOk === true, 'PROD Browser CSP smoke consumes valid hydration closure');
  context.assert(plan.targetReadiness === EPIC13_PROD_BROWSER_CSP_SMOKE_TARGET, 'PROD Browser CSP smoke target is prepared');
  context.assert(plan.fixture === PROD_CSP_FIXTURE, 'PROD Browser CSP smoke exposes fixture path');
  context.assert(plan.resultKey === PROD_CSP_RESULT_KEY, 'PROD Browser CSP smoke exposes result key');
  context.assert(plan.nonce === PROD_CSP_NONCE, 'PROD Browser CSP smoke exposes nonce');
  context.assert(plan.manifestUrl === PROD_CSP_MANIFEST, 'PROD Browser CSP smoke exposes manifest URL');
  context.assert(plan.localServerContract === SERVER_CONTRACT, 'PROD Browser CSP smoke uses local server contract');
  context.assert(plan.cspPolicy === PROD_LIKE_CSP_POLICY, 'PROD Browser CSP smoke uses shared PROD-like CSP policy');
  context.assert(plan.localGateMode === 'static-fixture-plus-local-server-header-probe', 'PROD Browser CSP local gate is static plus server probe');
  context.assert(plan.externalBrowserRequiredInLocalGate === false, 'PROD Browser CSP local gate does not require external browser');
  context.assert(plan.externalNetworkAllowedInLocalGate === false, 'PROD Browser CSP local gate does not require external network');
  context.assert(plan.cspHeaderPrepared === true && plan.cspMetaPrepared === true, 'PROD Browser CSP prepares header and meta policy');
  context.assert(plan.sameOriginOnly === true && plan.cdnAllowed === false && plan.importMapAllowed === false, 'PROD Browser CSP remains same-origin only');
  context.assert(plan.nextWorkpackage === 'WP-E13-13', 'PROD Browser CSP smoke makes WP-E13-09 ready after visual owner artifact normalization');
  context.assert(plan.nextDecision === 'rc1-gate-matrix-ci-handoff', 'PROD Browser CSP smoke hands off to RMT-first production readiness bundling');
  context.assert(plan.publishBoundary === PUBLISH_BOUNDARY, 'PROD Browser CSP smoke keeps publish boundary');
  context.assert(plan.publishAllowed === false, 'PROD Browser CSP smoke keeps publish blocked');
  context.assert(validation.schema === EPIC13_PROD_BROWSER_CSP_SMOKE_REPORT_SCHEMA, 'PROD Browser CSP validator emits report schema');
  context.assert(validation.ok === true, 'PROD Browser CSP plan validates');
  context.assert(report.ok === true, 'PROD Browser CSP report validates');
  context.assert(report.assertionCount === REQUIRED_PROD_SMOKE_ASSERTIONS.length, 'PROD Browser CSP report counts assertions');
  assertIncludesAll(context, plan.requiredAssertions, REQUIRED_PROD_SMOKE_ASSERTIONS, 'PROD Browser CSP assertions');
  assertIncludesAll(context, plan.sourceGates, REQUIRED_SOURCE_GATES, 'PROD Browser CSP source gates');

  context.assertIncludes(fixture, EPIC13_PROD_BROWSER_CSP_SMOKE_FIXTURE_SCHEMA, 'PROD CSP fixture declares schema');
  context.assertIncludes(fixture, 'http-equiv="Content-Security-Policy"', 'PROD CSP fixture declares CSP meta');
  context.assertIncludes(fixture, `nonce="${PROD_CSP_NONCE}"`, 'PROD CSP fixture uses nonce scripts');
  context.assertIncludes(fixture, "script-src 'self' 'nonce-xtend-e13-prod-csp-smoke'", 'PROD CSP fixture restricts scripts to self plus nonce');
  context.assertIncludes(fixture, 'src="/xtend-loader.js"', 'PROD CSP fixture loads root-local loader');
  context.assertIncludes(fixture, `data-manifest="${PROD_CSP_MANIFEST}"`, 'PROD CSP fixture uses same-origin fixture manifest');
  context.assertIncludes(fixture, 'data-module-cache-bust="epic13-prod-csp-smoke"', 'PROD CSP fixture exercises cache-busting path');
  context.assertIncludes(fixture, PROD_CSP_RESULT_KEY, 'PROD CSP fixture exposes result object');
  context.assertIncludes(fixture, "recordCheck('loader boot promise resolved under csp'", 'PROD CSP fixture checks loader boot promise');
  context.assertIncludes(fixture, "recordCheck('prod csp manifest is same origin'", 'PROD CSP fixture checks same-origin manifest');
  context.assertIncludes(fixture, "recordCheck('router route rendered under csp'", 'PROD CSP fixture checks router hydration');
  context.assert(!fixture.includes('https://cdn.ccs-networks.de/xtend'), 'PROD CSP fixture has no XTend CDN dependency');
  context.assert(!fixture.includes('type="importmap"'), 'PROD CSP fixture has no importmap');
  context.assert(fixtureManifest.xstate === '/components/xstate.js', 'PROD CSP fixture manifest resolves xstate locally');
  context.assert(fixtureManifest['x-router'] === '/components/xrouter.js', 'PROD CSP fixture manifest resolves x-router locally');
  context.assertIncludes(serverSource, 'PROD_LIKE_CSP_POLICY', 'Local dev server exposes PROD-like CSP policy');
  context.assertIncludes(serverSource, 'content-security-policy', 'Local dev server can emit CSP header');
  context.assertIncludes(serverSource, '--prod-csp', 'Local dev server exposes prod CSP CLI option');
  context.assertIncludes(serverSource, '--csp <policy>', 'Local dev server documents custom CSP CLI option');
  context.assertIncludes(loaderSource, 'window.__XTendLoaderBootPromise', 'Loader exposes boot promise for PROD CSP fixture');
  context.assertIncludes(loaderSource, 'data-manifest', 'Loader supports manifest override used by PROD CSP fixture');
  context.assertIncludes(policySource, 'xtend.security.loader-policy.v1', 'Manifest policy source exposes loader policy');
  context.assertIncludes(browserSuite, 'SERVER_CONTRACT', 'Browser harness still uses the shared local server contract');
  await assertProdLocalServerProbe(context, rootDir);

  context.assert(packageManifest.private === true, 'Package remains private for PROD Browser CSP smoke');
  context.assert((packageManifest.exports['./catalog/epic13-prod-browser-csp-smoke'] === './catalog/epic13-prod-browser-csp-smoke.js' || (packageManifest.exports['./catalog/epic13-prod-browser-csp-smoke'] && packageManifest.exports['./catalog/epic13-prod-browser-csp-smoke'].default === './catalog/epic13-prod-browser-csp-smoke.js')), 'Package exports PROD Browser CSP smoke module');
  context.assert(packageManifest.scripts['test:epic13-prod-browser-csp-smoke'] === 'node scripts/run_xtend_tests.js epic13-prod-browser-csp-smoke', 'Package exposes PROD Browser CSP smoke script');
  context.assert(packageManifest.scripts['dev:local:csp'] === `node scripts/serve_xtend_dev.js --port 4173 --prod-csp --default ${PROD_CSP_FIXTURE}`, 'Package exposes PROD-like local CSP dev server script');
  context.assert(packageManifest.xtend.releaseGates.includes(EPIC13_PROD_BROWSER_CSP_SMOKE_PACKAGE_SCRIPT), 'Package release gates include PROD Browser CSP script');
  context.assert(packageManifest.xtend.releaseChecklist.candidateGates.includes(EPIC13_PROD_BROWSER_CSP_SMOKE_PACKAGE_SCRIPT), 'Release checklist metadata includes PROD Browser CSP script');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(EPIC13_PROD_BROWSER_CSP_SMOKE_CONTRACT), 'Artifact checklist includes PROD Browser CSP contract');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(PROD_CSP_FIXTURE), 'Artifact checklist includes PROD CSP fixture');
  context.assert(metadata && metadata.schema === EPIC13_PROD_BROWSER_CSP_SMOKE_SCHEMA, 'Package metadata exposes PROD Browser CSP schema');
  context.assert(metadata && metadata.workpackage === EPIC13_PROD_BROWSER_CSP_SMOKE_WORKPACKAGE, 'Package metadata exposes WP-E13-07');
  context.assert(metadata && metadata.nextWorkpackage === 'WP-E13-13', 'Package metadata exposes next workpackage');
  context.assert(metadata && metadata.fixture === PROD_CSP_FIXTURE, 'Package metadata exposes fixture');
  context.assert(metadata && metadata.cspHeaderPrepared === true, 'Package metadata exposes CSP header preparation');
  context.assert(rc1Metadata && rc1Metadata.nextWorkpackage === 'WP-E13-13', 'RC1 readiness metadata now hands off to WP-E13-09');
  context.assert(ownerMetadata && ownerMetadata.nextWorkpackage === 'WP-E13-13', 'Owner acceptance metadata now hands off to WP-E13-09');
  context.assert(networkMetadata && networkMetadata.nextWorkpackage === 'WP-E13-13', 'Network evidence metadata now hands off to WP-E13-09');
  context.assert(packageLockMetadata && packageLockMetadata.nextWorkpackage === 'WP-E13-13', 'Package export lock metadata now hands off to WP-E13-09');
  context.assert(hydrationMetadata && hydrationMetadata.nextWorkpackage === 'WP-E13-13', 'Hydration closure metadata now hands off to WP-E13-09');
  context.assertIncludes(scaffoldConfig, 'epic13ProdBrowserCspSmoke', 'Scaffold config exposes PROD Browser CSP metadata');
  context.assertIncludes(scaffoldConfig, EPIC13_PROD_BROWSER_CSP_SMOKE_SCHEMA, 'Scaffold config declares PROD Browser CSP schema');
  context.assertIncludes(scaffoldConfig, PROD_CSP_FIXTURE, 'Scaffold config references PROD CSP fixture');
  context.assertIncludes(scaffoldConfig, 'nextWorkpackage: "WP-E13-13"', 'Scaffold config advances Epic 13 handoff to WP-E13-09');
  context.assertIncludes(runner, "id: 'epic13-prod-browser-csp-smoke'", 'Runner registers PROD Browser CSP suite');

  assertTextIncludesAll(context, steering, [
    EPIC13_PROD_BROWSER_CSP_SMOKE_SCHEMA,
    '| `WP-E13-07` | P1 | completed | WS3 | PROD-nahe Browser-, Local-Server- und CSP-Smokes vorbereiten |',
    '| `WP-E13-08` | P1 | completed | WS3 | Visual Screenshot/Pixels als RC1-Artefakt normalisieren |',
    '| `WP-E13-09` | P1 | completed | WS4 | RMT-first App Production Readiness Gate buendeln |',
    'Handoff nach WP-E13-07',
    PROD_CSP_FIXTURE,
    'rmt-first-production-readiness-bundling'
  ], 'Epic 13 steering document');
  assertTextIncludesAll(context, contractDoc, [
    EPIC13_PROD_BROWSER_CSP_SMOKE_SCHEMA,
    EPIC13_PROD_BROWSER_CSP_SMOKE_FIXTURE_SCHEMA,
    EPIC13_PROD_BROWSER_CSP_SMOKE_LOCAL_GATE,
    PROD_CSP_FIXTURE,
    "script-src 'self' 'nonce-xtend-e13-prod-csp-smoke'",
    'static-fixture-plus-local-server-header-probe',
    'WP-E13-09'
  ], 'PROD Browser CSP contract doc');
  assertTextIncludesAll(context, workpackage, [
    'xtend.epic13.wp07.prod-browser-csp-smoke.v1',
    'Status: `completed`',
    EPIC13_PROD_BROWSER_CSP_SMOKE_SCHEMA,
    EPIC13_PROD_BROWSER_CSP_SMOKE_LOCAL_GATE,
    'WP-E13-09'
  ], 'WP-E13-07 workpackage');
  assertTextIncludesAll(context, docs, [
    EPIC13_PROD_BROWSER_CSP_SMOKE_SCHEMA,
    EPIC13_PROD_BROWSER_CSP_SMOKE_LOCAL_GATE,
    PROD_CSP_FIXTURE,
    'nonce',
    'same-origin',
    PUBLISH_BOUNDARY
  ], 'PROD Browser CSP docs');
  assertTextIncludesAll(context, rc1Docs, [
    'PROD Browser CSP Smokes',
    'WP-E13-09',
    './prod-browser-csp-smokes.md'
  ], 'RC1 readiness docs handoff');
  assertTextIncludesAll(context, ownerDocs, [
    EPIC13_PROD_BROWSER_CSP_SMOKE_SCHEMA,
    'prod-browser-csp-smoke',
    'WP-E13-09',
    './prod-browser-csp-smokes.md'
  ], 'Owner acceptance docs handoff');
  assertTextIncludesAll(context, hydrationDocs, [
    'WP-E13-07',
    './prod-browser-csp-smokes.md'
  ], 'Hydration docs handoff');
  assertTextIncludesAll(context, registry, [
    EPIC13_PROD_BROWSER_CSP_SMOKE_MODULE,
    EPIC13_PROD_BROWSER_CSP_SMOKE_CONTRACT,
    EPIC13_PROD_BROWSER_CSP_SMOKE_DOCS,
    EPIC13_PROD_BROWSER_CSP_SMOKE_SUITE,
    EPIC13_PROD_BROWSER_CSP_SMOKE_LOCAL_GATE,
    PROD_CSP_FIXTURE
  ], 'Reference registry');
  assertTextIncludesAll(context, releaseChecklist, [
    'npm run test:epic13-prod-browser-csp-smoke',
    EPIC13_PROD_BROWSER_CSP_SMOKE_CONTRACT,
    PROD_CSP_FIXTURE
  ], 'Release checklist');
  assertTextIncludesAll(context, ciMatrix, [
    EPIC13_PROD_BROWSER_CSP_SMOKE_LOCAL_GATE,
    'PROD Browser CSP'
  ], 'CI gate matrix');
  assertTextIncludesAll(context, enterpriseAdoption, [
    EPIC13_PROD_BROWSER_CSP_SMOKE_SCHEMA,
    './prod-browser-csp-smokes.md',
    'dev:local:csp'
  ], 'Enterprise adoption docs');
  context.assertIncludes(docsReadme, './prod-browser-csp-smokes.md', 'Docs README links PROD Browser CSP smokes');
  context.assertIncludes(docsMenu, 'prod-browser-csp-smokes', 'Docs menu exposes PROD Browser CSP smokes');
  context.assertIncludes(testsReadme, EPIC13_PROD_BROWSER_CSP_SMOKE_LOCAL_GATE, 'Tests README documents PROD Browser CSP gate');
  context.assertIncludes(readme, 'xtend.epic13ProdBrowserCspSmoke', 'Root README documents PROD Browser CSP metadata');
  context.assertIncludes(changelog, EPIC13_PROD_BROWSER_CSP_SMOKE_SCHEMA, 'Changelog records PROD Browser CSP contract');

  return context.result({
    report: {
      schema: EPIC13_PROD_BROWSER_CSP_SMOKE_REPORT_SCHEMA,
      assertionCount: report.assertionCount,
      fixture: report.fixture,
      cspHeaderPrepared: report.cspHeaderPrepared,
      cspMetaPrepared: report.cspMetaPrepared,
      sameOriginOnly: report.sameOriginOnly,
      publishAllowed: report.publishAllowed,
      nextWorkpackage: report.nextWorkpackage
    }
  });
}

function printEpic13ProdBrowserCspSmokeReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 13 PROD Browser CSP Smoke erfolgreich.',
    failureTitle: 'Epic 13 PROD Browser CSP Smoke fehlgeschlagen:'
  });
}

module.exports = {
  printEpic13ProdBrowserCspSmokeReport,
  runEpic13ProdBrowserCspSmokeSuite
};
