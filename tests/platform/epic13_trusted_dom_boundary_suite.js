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
  SANITIZING_BOUNDARY_CONTRACT,
  TRUSTED_DOM_POLICY_CONTRACT,
  TRUSTED_DOM_SANITIZER_CONTRACT,
  TRUSTED_TEXT_SANITIZER_CONTRACT,
  getTrustedDomPolicy,
  sanitizeTrustedDomHtml,
  sanitizeTrustedText
} = require('../../security/trusted-dom-policy');
const {
  EPIC13_TRUSTED_DOM_BOUNDARY_CONTRACT,
  EPIC13_TRUSTED_DOM_BOUNDARY_DOCS,
  EPIC13_TRUSTED_DOM_BOUNDARY_FIXTURE_SCHEMA,
  EPIC13_TRUSTED_DOM_BOUNDARY_LOCAL_GATE,
  EPIC13_TRUSTED_DOM_BOUNDARY_MODULE,
  EPIC13_TRUSTED_DOM_BOUNDARY_PACKAGE_SCRIPT,
  EPIC13_TRUSTED_DOM_BOUNDARY_REPORT_ARTIFACT,
  EPIC13_TRUSTED_DOM_BOUNDARY_REPORT_SCHEMA,
  EPIC13_TRUSTED_DOM_BOUNDARY_SCHEMA,
  EPIC13_TRUSTED_DOM_BOUNDARY_STATUS,
  EPIC13_TRUSTED_DOM_BOUNDARY_STEERING,
  EPIC13_TRUSTED_DOM_BOUNDARY_SUITE,
  EPIC13_TRUSTED_DOM_BOUNDARY_TARGET,
  EPIC13_TRUSTED_DOM_BOUNDARY_WORKPACKAGE,
  EPIC13_TRUSTED_DOM_BOUNDARY_WORKPACKAGE_DOC,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  PUBLISH_BOUNDARY,
  REQUIRED_ARTIFACTS,
  REQUIRED_BROWSER_ASSERTIONS,
  REQUIRED_SOURCE_GATES,
  TRUSTED_DOM_BOUNDARY_FIXTURE,
  TRUSTED_DOM_BOUNDARY_RESULT_KEY,
  createEpic13TrustedDomBoundaryPlan,
  createEpic13TrustedDomBoundaryReport,
  validateEpic13TrustedDomBoundaryPlan
} = require('../../catalog/epic13-trusted-dom-boundary');

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

async function assertTrustedDomLocalServerProbe(context, rootDir) {
  let handle = null;
  try {
    handle = await listenXtendDevServer({
      rootDir,
      defaultPath: TRUSTED_DOM_BOUNDARY_FIXTURE,
      port: 0,
      contentSecurityPolicy: PROD_LIKE_CSP_POLICY
    });

    context.assert(handle.schema === SERVER_CONTRACT, 'Trusted DOM boundary proof uses shared local dev server contract');
    const response = await requestText(`${handle.origin}/${TRUSTED_DOM_BOUNDARY_FIXTURE}`);
    context.assert(response.statusCode === 200, 'Trusted DOM boundary fixture is served by the local server');
    context.assert(response.headers['content-type'].includes('text/html'), 'Trusted DOM boundary fixture is served as HTML');
    context.assert(response.headers['content-security-policy'] === PROD_LIKE_CSP_POLICY, 'Trusted DOM boundary probe can run with PROD-like CSP header');
    context.assert(response.body.includes(EPIC13_TRUSTED_DOM_BOUNDARY_FIXTURE_SCHEMA), 'Trusted DOM boundary fixture body is reachable over local server');
    const loaderResponse = await requestText(`${handle.origin}/docs/utils/pageloader.js`);
    context.assert(loaderResponse.statusCode === 200, 'Trusted DOM boundary probe serves Docs page loader');
    context.assert(loaderResponse.headers['content-type'].includes('text/javascript'), 'Docs page loader is served as JavaScript');
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    const code = error && error.code ? error.code : '';
    if ((code === 'EPERM' || code === 'EACCES') && /listen/u.test(message)) {
      context.skip(`Trusted DOM boundary local server probe skipped because this environment denies loopback listen (${message})`);
      return;
    }
    context.fail(`Trusted DOM boundary local server probe (${message})`);
  } finally {
    if (handle && handle.server) {
      await new Promise((resolve) => handle.server.close(resolve));
    }
  }
}

async function runEpic13TrustedDomBoundarySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'epic13-trusted-dom-boundary',
    label: 'Epic 13 Trusted DOM Boundary'
  });
  const plan = createEpic13TrustedDomBoundaryPlan({ rootDir });
  const validation = validateEpic13TrustedDomBoundaryPlan(plan);
  const report = createEpic13TrustedDomBoundaryReport({ rootDir, plan });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.epic13TrustedDomBoundary;
  const rc1Metadata = packageManifest.xtend && packageManifest.xtend.epic13Rc1Readiness;
  const ownerMetadata = packageManifest.xtend && packageManifest.xtend.epic13ReleaseOwnerAcceptance;
  const docsRmtMetadata = packageManifest.xtend && packageManifest.xtend.epic13DocsRmtProductionHardening;
  const packageLockMetadata = packageManifest.xtend && packageManifest.xtend.epic13PackageExportLock;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const policySource = readText('security/trusted-dom-policy.js', rootDir);
  const pageLoader = [
    readText('docs/utils/pageloader.js', rootDir),
    readText('docs/utils/page/route-controller.mjs', rootDir)
  ].join('\n');
  const indexPhp = readText('docs/index.php', rootDir);
  const rmtDocument = readJson('docs/xtendrmt-parsedown-docs.rmt', rootDir);
  const fixture = readText(TRUSTED_DOM_BOUNDARY_FIXTURE, rootDir);
  const browserSuite = readText('tests/browser/browser_smoke_suite.js', rootDir);
  const steering = readText(EPIC13_TRUSTED_DOM_BOUNDARY_STEERING, rootDir);
  const contract = readText(EPIC13_TRUSTED_DOM_BOUNDARY_CONTRACT, rootDir);
  const workpackage = readText(EPIC13_TRUSTED_DOM_BOUNDARY_WORKPACKAGE_DOC, rootDir);
  const docs = readText(EPIC13_TRUSTED_DOM_BOUNDARY_DOCS, rootDir);
  const trustedDomDocs = readText('docs/en/trusted-dom-sanitizing.md', rootDir);
  const docsHardening = readText('development/XTend-Epic13-Docs-RMT-Production-Hardening-Contract.md', rootDir);
  const prodCspDocs = readText('development/XTend-Epic13-PROD-Browser-CSP-Smoke-Contract.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const releaseChecklist = readText('development/XTend-Release-Checklist-und-SemVer-Policy.md', rootDir);
  const ciMatrix = readText('development/XTend-CI-Gate-Matrix.md', rootDir);
  const docsReadme = readText('docs/en/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const rootReadme = readText('README.md', rootDir);
  const changelog = readText('CHANGELOG.md', rootDir);
  const moduleSyntax = syntaxCheckFile(EPIC13_TRUSTED_DOM_BOUNDARY_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(EPIC13_TRUSTED_DOM_BOUNDARY_SUITE, { rootDir, extension: '.js' });
  const policySyntax = syntaxCheckFile('security/trusted-dom-policy.js', { rootDir, extension: '.js' });
  const loaderSyntax = syntaxCheckFile('docs/utils/pageloader.js', { rootDir, extension: '.js' });

  [
    EPIC13_TRUSTED_DOM_BOUNDARY_MODULE,
    EPIC13_TRUSTED_DOM_BOUNDARY_SUITE,
    EPIC13_TRUSTED_DOM_BOUNDARY_STEERING,
    EPIC13_TRUSTED_DOM_BOUNDARY_CONTRACT,
    EPIC13_TRUSTED_DOM_BOUNDARY_WORKPACKAGE_DOC,
    EPIC13_TRUSTED_DOM_BOUNDARY_DOCS,
    TRUSTED_DOM_BOUNDARY_FIXTURE
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });
  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as required Trusted DOM artifact`);
  });

  context.assert(moduleSyntax.ok, `Trusted DOM boundary module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Trusted DOM boundary suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(policySyntax.ok, `Trusted DOM policy syntax passes${policySyntax.ok ? '' : ` (${policySyntax.message})`}`);
  context.assert(loaderSyntax.ok, `Docs page loader syntax passes${loaderSyntax.ok ? '' : ` (${loaderSyntax.message})`}`);
  context.assert(plan.schema === EPIC13_TRUSTED_DOM_BOUNDARY_SCHEMA, 'Trusted DOM boundary exposes stable schema');
  context.assert(plan.fixtureSchema === EPIC13_TRUSTED_DOM_BOUNDARY_FIXTURE_SCHEMA, 'Trusted DOM boundary exposes fixture schema');
  context.assert(plan.reportSchema === EPIC13_TRUSTED_DOM_BOUNDARY_REPORT_SCHEMA, 'Trusted DOM boundary exposes report schema');
  context.assert(plan.workpackage === EPIC13_TRUSTED_DOM_BOUNDARY_WORKPACKAGE, 'Trusted DOM boundary belongs to WP-E13-11');
  context.assert(plan.status === EPIC13_TRUSTED_DOM_BOUNDARY_STATUS, 'Trusted DOM boundary is accepted');
  context.assert(plan.sourceSchema === 'xtend.epic13.docs-rmt-production-hardening.v1', 'Trusted DOM boundary consumes Docs RMT hardening');
  context.assert(plan.sourceValidationOk === true && plan.sourceReportOk === true, 'Trusted DOM boundary source validates');
  context.assert(plan.targetReadiness === EPIC13_TRUSTED_DOM_BOUNDARY_TARGET, 'Trusted DOM boundary target is browser-proofed');
  context.assert(plan.trustedDomPolicy === TRUSTED_DOM_POLICY_CONTRACT, 'Trusted DOM boundary references policy');
  context.assert(plan.trustedDomSanitizer === TRUSTED_DOM_SANITIZER_CONTRACT, 'Trusted DOM boundary references sanitizer');
  context.assert(plan.trustBoundary === SANITIZING_BOUNDARY_CONTRACT, 'Trusted DOM boundary references sanitizing boundary');
  context.assert(plan.fixture === TRUSTED_DOM_BOUNDARY_FIXTURE, 'Trusted DOM boundary exposes fixture path');
  context.assert(plan.resultKey === TRUSTED_DOM_BOUNDARY_RESULT_KEY, 'Trusted DOM boundary exposes result key');
  assertIncludesAll(context, plan.sourceGates, REQUIRED_SOURCE_GATES, 'Trusted DOM boundary source gates');
  assertIncludesAll(context, plan.requiredBrowserAssertions, REQUIRED_BROWSER_ASSERTIONS, 'Trusted DOM browser assertions');
  context.assert(plan.boundaryProof.parsedownHtmlRequiresSanitizer === true, 'Parsedown HTML requires sanitizer');
  context.assert(plan.boundaryProof.rmtHtmlFragmentRequiresSanitizer === true, 'RMT HTML fragments require sanitizer');
  context.assert(plan.boundaryProof.structuredDomDescriptorPreferred === true, 'Structured descriptors remain preferred');
  context.assert(plan.boundaryProof.scriptsBlocked === true, 'Scripts are blocked');
  context.assert(plan.boundaryProof.inlineEventHandlersBlocked === true, 'Inline event handlers are blocked');
  context.assert(plan.boundaryProof.javascriptUrlsBlocked === true, 'JavaScript URLs are blocked');
  context.assert(plan.boundaryProof.srcdocBlocked === true, 'srcdoc is blocked');
  context.assert(plan.rmtKernelImportsSanitizer === false && plan.rmtKernelImportsParsedown === false && plan.rmtKernelImportsXtendTypes === false, 'RMT kernel remains dependency-free');
  context.assert(plan.nextWorkpackage === NEXT_WORKPACKAGE, 'Trusted DOM boundary makes WP-E13-13 ready');
  context.assert(plan.nextDecision === NEXT_DECISION, 'Trusted DOM boundary hands off to migration notes');
  context.assert(validation.schema === EPIC13_TRUSTED_DOM_BOUNDARY_REPORT_SCHEMA, 'Trusted DOM boundary validator emits report schema');
  context.assert(validation.ok === true, 'Trusted DOM boundary plan validates');
  context.assert(report.ok === true, 'Trusted DOM boundary report validates');
  context.assert(report.browserAssertionCount === REQUIRED_BROWSER_ASSERTIONS.length, 'Trusted DOM boundary report counts browser assertions');

  const policy = getTrustedDomPolicy();
  const sanitized = sanitizeTrustedDomHtml('<p onclick="evil()">x</p><script>evil()</script><a href="javascript:evil()">x</a><iframe srcdoc="<b>x</b>"></iframe>', {
    markupClass: 'parsedownHtml'
  });
  const sanitizedText = sanitizeTrustedText('line one\r\nline two');
  const refusedText = sanitizeTrustedText('line one\u0000line two');
  context.assert(policy.sanitizer.schema === TRUSTED_DOM_SANITIZER_CONTRACT, 'Trusted DOM policy exposes sanitizer schema');
  context.assert(policy.markupClasses.parsedownHtml.sanitizerRequired === true, 'Trusted DOM policy requires sanitizer for Parsedown HTML');
  context.assert(policy.markupClasses.htmlFragment.sanitizerRequired === true, 'Trusted DOM policy requires sanitizer for RMT html fragments');
  context.assert(sanitized.schema === TRUSTED_DOM_SANITIZER_CONTRACT, 'Trusted DOM sanitizer emits sanitizer schema');
  context.assert(sanitized.boundary === SANITIZING_BOUNDARY_CONTRACT, 'Trusted DOM sanitizer emits sanitizing boundary');
  context.assert(sanitized.html.includes('<p>x</p>'), 'Trusted DOM sanitizer preserves safe text markup');
  context.assert(!sanitized.html.includes('<script'), 'Trusted DOM sanitizer removes script elements');
  context.assert(!sanitized.html.includes('onclick'), 'Trusted DOM sanitizer removes inline event handlers');
  context.assert(!sanitized.html.includes('javascript:'), 'Trusted DOM sanitizer removes JavaScript URLs');
  context.assert(!sanitized.html.includes('srcdoc'), 'Trusted DOM sanitizer removes srcdoc');
  context.assert(sanitized.removedCount >= 4, 'Trusted DOM sanitizer reports removed payloads');
  context.assert(sanitizedText.schema === TRUSTED_TEXT_SANITIZER_CONTRACT && sanitizedText.ok === true && sanitizedText.text === 'line one\nline two', 'Trusted text sanitizer normalizes line endings with a positive verdict');
  context.assert(refusedText.ok === false && refusedText.text === null && !JSON.stringify(refusedText).includes('line one'), 'Trusted text sanitizer rejects control characters without echoing hostile input');
  assertTextIncludesAll(context, policySource, [
    'TRUSTED_DOM_SANITIZER_CONTRACT',
    'sanitizeTrustedDomHtml',
    'isAllowedTrustedDomUrl',
    'script',
    'srcdoc'
  ], 'Trusted DOM policy source');
  assertTextIncludesAll(context, pageLoader, [
    EPIC13_TRUSTED_DOM_BOUNDARY_SCHEMA,
    'sanitizeDocsTrustedDomHtml',
    'normalizeDocsParsedownCodeEntities',
    'normalizedCodeEntityCount',
    'applyDocsTrustedDomHtml(shell.mdContent',
    'data-rmt-sanitized',
    'data-rmt-trusted-dom-proof',
    'xtendDocsTrustedDomLastSanitize',
    'xtendDocsTrustedDomBoundary'
  ], 'Docs page loader');
  assertTextIncludesAll(context, indexPhp, [
    'window.xtendDocsTrustedDomBoundaryProof',
    EPIC13_TRUSTED_DOM_BOUNDARY_SCHEMA,
    TRUSTED_DOM_SANITIZER_CONTRACT,
    "blockedVectors: ['script', 'inline-event-handler', 'javascript-url', 'srcdoc']",
    "nextWorkpackage: 'WP-E13-13'"
  ], 'Docs PHP host');

  const hardening = rmtDocument.manifest && rmtDocument.manifest.metadata && rmtDocument.manifest.metadata.productionHardening;
  context.assert(hardening && hardening.trustedDomProofSchema === EPIC13_TRUSTED_DOM_BOUNDARY_SCHEMA, 'Docs RMT document declares Trusted DOM proof schema');
  context.assert(hardening && hardening.trustedDomSanitizer === TRUSTED_DOM_SANITIZER_CONTRACT, 'Docs RMT document declares sanitizer');
  context.assert(hardening && hardening.nextWorkpackage === NEXT_WORKPACKAGE, 'Docs RMT document hands off to WP-E13-13');
  context.assert(Array.isArray(hardening.blockedVectors) && hardening.blockedVectors.includes('javascript-url'), 'Docs RMT document declares blocked vectors');

  assertTextIncludesAll(context, fixture, [
    EPIC13_TRUSTED_DOM_BOUNDARY_FIXTURE_SCHEMA,
    TRUSTED_DOM_BOUNDARY_RESULT_KEY,
    '/docs/utils/pageloader.js',
    'nonce="xtend-e13-trusted-dom-boundary"',
    "recordCheck('parsedown content sanitized before innerhtml sink'",
    "recordCheck('script element removed from parsedown html'",
    "recordCheck('event handler attributes removed'",
    "recordCheck('javascript urls removed'",
    "recordCheck('parsedown inline code entities normalized'",
    "recordCheck('sanitizer records code entity normalization'",
    "recordCheck('malicious script did not execute'",
    'javascript:alert(1)',
    'onclick=',
    'srcdoc='
  ], 'Trusted DOM fixture');
  context.assert(!fixture.includes('https://cdn.ccs-networks.de/xtend'), 'Trusted DOM fixture has no CDN dependency');
  context.assert(!fixture.includes('type="importmap"'), 'Trusted DOM fixture has no importmap');
  context.assertIncludes(browserSuite, TRUSTED_DOM_BOUNDARY_FIXTURE, 'Browser suite registers Trusted DOM boundary fixture');
  context.assertIncludes(browserSuite, 'assertEpic13TrustedDomBoundaryFixtureContract', 'Browser suite validates Trusted DOM boundary fixture contract');
  await assertTrustedDomLocalServerProbe(context, rootDir);

  context.assert(packageManifest.private === false, 'Package is public-ready for Trusted DOM boundary');
  context.assert((packageManifest.exports['./catalog/epic13-trusted-dom-boundary'] === './catalog/epic13-trusted-dom-boundary.js' || (packageManifest.exports['./catalog/epic13-trusted-dom-boundary'] && packageManifest.exports['./catalog/epic13-trusted-dom-boundary'].default === './catalog/epic13-trusted-dom-boundary.js')), 'Package exports Trusted DOM boundary module');
  context.assert(packageManifest.scripts['test:epic13-trusted-dom-boundary'] === 'node scripts/run_xtend_tests.js epic13-trusted-dom-boundary', 'Package exposes Trusted DOM boundary script');
  context.assert(packageManifest.xtend.releaseGates.includes(EPIC13_TRUSTED_DOM_BOUNDARY_PACKAGE_SCRIPT), 'Release gates include Trusted DOM boundary script');
  context.assert(packageManifest.xtend.releaseChecklist.candidateGates.includes(EPIC13_TRUSTED_DOM_BOUNDARY_PACKAGE_SCRIPT), 'Release checklist metadata includes Trusted DOM boundary script');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(EPIC13_TRUSTED_DOM_BOUNDARY_CONTRACT), 'Artifact checklist includes Trusted DOM boundary contract');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(EPIC13_TRUSTED_DOM_BOUNDARY_REPORT_ARTIFACT), 'Artifact checklist includes Trusted DOM boundary report');
  context.assert(metadata && metadata.schema === EPIC13_TRUSTED_DOM_BOUNDARY_SCHEMA, 'Package metadata exposes Trusted DOM boundary schema');
  context.assert(metadata && metadata.workpackage === EPIC13_TRUSTED_DOM_BOUNDARY_WORKPACKAGE, 'Package metadata exposes WP-E13-11');
  context.assert(metadata && metadata.nextWorkpackage === NEXT_WORKPACKAGE, 'Package metadata exposes next workpackage');
  context.assert(metadata && metadata.fixture === TRUSTED_DOM_BOUNDARY_FIXTURE, 'Package metadata exposes fixture');
  context.assert(metadata && metadata.trustedDomSanitizer === TRUSTED_DOM_SANITIZER_CONTRACT, 'Package metadata exposes sanitizer');
  context.assert(rc1Metadata && rc1Metadata.nextWorkpackage === NEXT_WORKPACKAGE, 'RC1 readiness metadata now hands off to WP-E13-13');
  context.assert(ownerMetadata && ownerMetadata.nextWorkpackage === NEXT_WORKPACKAGE, 'Owner acceptance metadata now hands off to WP-E13-13');
  context.assert(docsRmtMetadata && docsRmtMetadata.nextWorkpackage === NEXT_WORKPACKAGE, 'Docs RMT hardening metadata now hands off to WP-E13-13');
  context.assert(packageLockMetadata && packageLockMetadata.expectedExportCount >= 124, 'Package export lock includes RC1 gate matrix and kernel exports');
  context.assertIncludes(scaffoldConfig, 'epic13TrustedDomBoundary', 'Scaffold config exposes Trusted DOM boundary metadata');
  context.assertIncludes(scaffoldConfig, EPIC13_TRUSTED_DOM_BOUNDARY_SCHEMA, 'Scaffold config declares Trusted DOM boundary schema');
  context.assertIncludes(scaffoldConfig, `expectedExportCount: ${packageLockMetadata.expectedExportCount}`, 'Scaffold config updates package export count');
  context.assertIncludes(scaffoldConfig, `nextWorkpackage: "${NEXT_WORKPACKAGE}"`, 'Scaffold config advances Epic 13 handoff to WP-E13-13');
  context.assertIncludes(runner, "id: 'epic13-trusted-dom-boundary'", 'Runner registers Trusted DOM boundary suite');

  assertTextIncludesAll(context, steering, [
    EPIC13_TRUSTED_DOM_BOUNDARY_SCHEMA,
    '| `WP-E13-11` | P1 | completed | WS5 | Trusted DOM, Parsedown und RMT HTML Boundary browsernah pruefen |',
    '| `WP-E13-12` | P1 | completed | WS6 | RC1 Migration Notes, SemVer-Entscheid und Changelog vorbereiten |',
    'Handoff nach WP-E13-11',
    NEXT_DECISION
  ], 'Epic 13 steering');
  assertTextIncludesAll(context, contract, [
    EPIC13_TRUSTED_DOM_BOUNDARY_SCHEMA,
    EPIC13_TRUSTED_DOM_BOUNDARY_LOCAL_GATE,
    TRUSTED_DOM_BOUNDARY_FIXTURE,
    TRUSTED_DOM_SANITIZER_CONTRACT,
    'Parsedown HTML',
    'RMT HTML-Fragmente',
    'WP-E13-13'
  ], 'Trusted DOM boundary contract');
  assertTextIncludesAll(context, workpackage, [
    'xtend.epic13.wp11.trusted-dom-boundary.v1',
    'Status: `completed`',
    EPIC13_TRUSTED_DOM_BOUNDARY_SCHEMA,
    EPIC13_TRUSTED_DOM_BOUNDARY_LOCAL_GATE,
    'WP-E13-13'
  ], 'WP-E13-11 workpackage');
  assertTextIncludesAll(context, docs, [
    EPIC13_TRUSTED_DOM_BOUNDARY_SCHEMA,
    EPIC13_TRUSTED_DOM_BOUNDARY_LOCAL_GATE,
    TRUSTED_DOM_BOUNDARY_FIXTURE,
    'parsedownHtml',
    'htmlFragment',
    TRUSTED_DOM_SANITIZER_CONTRACT
  ], 'Trusted DOM boundary docs');
  assertTextIncludesAll(context, trustedDomDocs, [
    'security/trusted-dom-policy.js',
    'sanitizeTrustedDomHtml()',
    './trusted-dom-boundary-browser-proof.md'
  ], 'Trusted DOM sanitizing docs');
  assertTextIncludesAll(context, docsHardening, [
    EPIC13_TRUSTED_DOM_BOUNDARY_SCHEMA,
    'WP-E13-13'
  ], 'Docs RMT hardening contract handoff');
  assertTextIncludesAll(context, prodCspDocs, [
    'xtend.epic13.prod-browser-csp-smoke.v1',
    'WP-E13-11'
  ], 'PROD CSP contract handoff');
  assertTextIncludesAll(context, registry, [
    EPIC13_TRUSTED_DOM_BOUNDARY_MODULE,
    EPIC13_TRUSTED_DOM_BOUNDARY_CONTRACT,
    EPIC13_TRUSTED_DOM_BOUNDARY_DOCS,
    EPIC13_TRUSTED_DOM_BOUNDARY_SUITE,
    EPIC13_TRUSTED_DOM_BOUNDARY_LOCAL_GATE,
    TRUSTED_DOM_BOUNDARY_FIXTURE
  ], 'Reference registry');
  assertTextIncludesAll(context, releaseChecklist, [
    EPIC13_TRUSTED_DOM_BOUNDARY_PACKAGE_SCRIPT,
    EPIC13_TRUSTED_DOM_BOUNDARY_CONTRACT,
    EPIC13_TRUSTED_DOM_BOUNDARY_REPORT_ARTIFACT
  ], 'Release checklist');
  assertTextIncludesAll(context, ciMatrix, [
    EPIC13_TRUSTED_DOM_BOUNDARY_LOCAL_GATE,
    'Trusted DOM Boundary'
  ], 'CI gate matrix');
  context.assertIncludes(docsReadme, './trusted-dom-boundary-browser-proof.md', 'Docs README links Trusted DOM boundary proof');
  context.assertIncludes(docsMenu, 'trusted-dom-boundary-browser-proof', 'Docs menu exposes Trusted DOM boundary proof');
  context.assertIncludes(testsReadme, EPIC13_TRUSTED_DOM_BOUNDARY_LOCAL_GATE, 'Tests README documents Trusted DOM boundary gate');
  context.assertIncludes(rootReadme, 'docs/en/trusted-dom-sanitizing.md', 'Root README links the user-facing Trusted DOM guide');
  context.assertIncludes(changelog, EPIC13_TRUSTED_DOM_BOUNDARY_SCHEMA, 'Changelog records Trusted DOM boundary contract');

  return context.result({
    report: {
      schema: EPIC13_TRUSTED_DOM_BOUNDARY_REPORT_SCHEMA,
      sourceGateCount: report.sourceGateCount,
      browserAssertionCount: report.browserAssertionCount,
      fixture: report.fixture,
      trustedDomSanitizer: report.trustedDomSanitizer,
      publishAllowed: report.publishAllowed,
      nextWorkpackage: report.nextWorkpackage
    }
  });
}

function printEpic13TrustedDomBoundaryReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 13 Trusted DOM Boundary Gates erfolgreich.',
    failureTitle: 'Epic 13 Trusted DOM Boundary Gates fehlgeschlagen:'
  });
}

if (require.main === module) {
  runEpic13TrustedDomBoundarySuite()
    .then((result) => {
      printEpic13TrustedDomBoundaryReport(result);
      if (!result.ok) {
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error(`Epic 13 Trusted DOM Boundary Gates fehlgeschlagen:\n\n- ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  runEpic13TrustedDomBoundarySuite,
  printEpic13TrustedDomBoundaryReport
};
