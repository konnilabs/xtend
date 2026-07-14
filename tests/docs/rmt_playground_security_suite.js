const path = require('path');
const { spawnSync } = require('child_process');
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

const RMT_PLAYGROUND_SECURITY_SCHEMA = 'xtend.docs.rmt-playground-security.v1';
const RMT_PLAYGROUND_SECURITY_REPORT_SCHEMA = 'xtend.docs.rmt-playground-security-report.v1';
const VALID_SOURCE = `template learn.rmt.playground {
  state preview.message type object preserve {
    initial {
      id "hello"
      text "Hello from the playground"
      tone "success"
    }
  }

  selector preview.message from state preview.message {
    output PreviewMessage
  }

  surface preview.card kind card component x-status {
    source selector preview.message

    lane visible weight 80 {
      hydrate preview-card from selector preview.message
    }
  }
}`;
const GENERIC_COMPONENT_SOURCE = `import "./shared/*.rmt"

template learn.rmt.generic {
  state preview.progress type object preserve {
    initial {
      id "progress"
      label "Compiler coverage"
      value 72
      max 100
      tone "success"
    }
  }

  selector preview.progress from state preview.progress {
    output PreviewProgress
  }

  surface preview.progress kind card component x-progress {
    source selector preview.progress

    lane visible weight 70 {
      hydrate preview-progress from selector preview.progress
    }
  }
}`;

function runPlaygroundEndpoint(rootDir, method, body, contentLengthOverride = null, endpoint = 'compile') {
  const source = String(body || '');
  const contentLength = contentLengthOverride == null ? Buffer.byteLength(source) : Number(contentLengthOverride);
  const code = [
    `chdir(${JSON.stringify(rootDir)});`,
    `$_GET = ["xtend-rmt-playground" => ${JSON.stringify(endpoint)}];`,
    `$_SERVER["REQUEST_METHOD"] = ${JSON.stringify(method)};`,
    `$_SERVER["CONTENT_LENGTH"] = ${String(contentLength)};`,
    '$_SERVER["SCRIPT_NAME"] = "/docs/index.php";',
    `$_SERVER["REQUEST_URI"] = "/docs/index.php?xtend-rmt-playground=${endpoint}";`,
    'include "docs/index.php";'
  ].join(' ');
  return spawnSync('php', ['-d', 'variables_order=EGPCS', '-r', code], {
    cwd: rootDir,
    input: '',
    encoding: 'utf8',
    maxBuffer: 96 * 1024 * 1024,
    timeout: 10000,
    env: {
      ...process.env,
      XTEND_DOCS_RMT_PLAYGROUND_BODY: source
    }
  });
}

function parseEndpointJson(result) {
  try {
    return JSON.parse(result.stdout || '{}');
  } catch (error) {
    return {
      ok: false,
      status: 'invalid_test_json',
      diagnostics: [{ message: error.message, stdout: result.stdout, stderr: result.stderr }]
    };
  }
}

function extractPlaygroundClientBlock(pageLoader) {
  const start = pageLoader.indexOf('function createDocsRmtPlaygroundElement');
  const end = pageLoader.indexOf('function resolveDocsSlugFromRouteContext');
  return start >= 0 && end > start ? pageLoader.slice(start, end) : '';
}

function runRmtPlaygroundSecuritySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-playground-security',
    label: 'RMT Playground Security'
  });
  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const indexPhp = readText('docs/index.php', rootDir);
  const pageLoader = readText('docs/utils/pageloader.js', rootDir);
  const lspBridge = readText('scripts/rmt_playground_lsp_bridge.js', rootDir);
  const maracaBridge = readText('scripts/rmt_playground_maraca_preview_bridge.js', rootDir);
  const vnextCompiler = readText('tools/rmt-language/vnext-compiler.js', rootDir);
  const vnextTooling = readText('tools/rmt-language/vnext-tooling.js', rootDir);
  const customerServiceKernelSource = readText('products/rmt-maraca-kernel-orchestration/kernel-orchestration-app.rmt', rootDir);
  const playgroundClient = extractPlaygroundClientBlock(pageLoader);
  const legacyNodeSyntaxPattern = /\?\.[A-Za-z_$[(]|\?\?/u;
  const indexSyntax = spawnSync('php', ['-l', path.join(rootDir, 'docs/index.php')], {
    cwd: rootDir,
    encoding: 'utf8'
  });
  const loaderSyntax = syntaxCheckFile('docs/utils/pageloader.js', { rootDir, extension: '.js' });
  const lspBridgeSyntax = syntaxCheckFile('scripts/rmt_playground_lsp_bridge.js', { rootDir, extension: '.js' });
  const maracaBridgeSyntax = syntaxCheckFile('scripts/rmt_playground_maraca_preview_bridge.js', { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile('tests/docs/rmt_playground_security_suite.js', { rootDir, extension: '.js' });

  context.assert(indexSyntax.status === 0, `docs/index.php PHP syntax passes${indexSyntax.status === 0 ? '' : ` (${indexSyntax.stderr || indexSyntax.stdout})`}`);
  context.assert(loaderSyntax.ok, `Docs page loader syntax passes${loaderSyntax.ok ? '' : ` (${loaderSyntax.message})`}`);
  context.assert(lspBridgeSyntax.ok, `RMT playground LSP bridge syntax passes${lspBridgeSyntax.ok ? '' : ` (${lspBridgeSyntax.message})`}`);
  context.assert(maracaBridgeSyntax.ok, `RMT playground Maraca preview bridge syntax passes${maracaBridgeSyntax.ok ? '' : ` (${maracaBridgeSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `RMT playground security suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(indexPhp.includes('REQUEST_METHOD') && indexPhp.includes('POST'), 'Compile endpoint enforces POST');
  context.assert(indexPhp.includes('CONTENT_LENGTH'), 'Compile endpoint checks request body size');
  context.assert(indexPhp.includes('64 * 1024'), 'Compile endpoint limits source size to 64 KB');
  context.assert(indexPhp.includes('X-Content-Type-Options: nosniff'), 'Compile endpoint emits nosniff JSON responses');
  context.assert(indexPhp.includes('docsRmtPlaygroundPolicyDiagnostics'), 'Compile endpoint applies playground policy diagnostics');
  context.assert(indexPhp.includes('docsRmtPlaygroundHandleDiagnostics'), 'Diagnostics endpoint exposes the RMT Language Server bridge');
  context.assert(indexPhp.includes('docsRmtPlaygroundCompileMaracaPreview') && indexPhp.includes("'operation' => 'maraca-plan'"), 'Compile endpoint appends Maraca plans through the official tooling bridge');
  context.assert(indexPhp.includes('docsRmtPlaygroundHandlePreset') && indexPhp.includes('customer-service-kernel'), 'Docs host exposes the whitelisted Customer Service Kernel preset');
  context.assert(indexPhp.includes('innerHTML|outerHTML|insertAdjacentHTML|srcdoc'), 'Compile endpoint blocks HTML injection sinks');
  context.assert(indexPhp.includes('docsRmtPlaygroundProjectSafePreview') && indexPhp.includes("'operation' => 'safe-preview'"), 'Compile endpoint projects structured component previews through the official safe-preview bridge');
  context.assert(indexPhp.includes("'renderMode' => 'dom_descriptor'"), 'Compile endpoint marks component previews as DOM descriptors');
  context.assert(lspBridge.includes('executeToolingBridgeOperation') && lspBridge.includes("operation: 'language-diagnostics'"), 'LSP compatibility bridge delegates to the official tooling bridge');
  context.assert(!legacyNodeSyntaxPattern.test(vnextCompiler) && !legacyNodeSyntaxPattern.test(vnextTooling), 'RMT Playground LSP server path avoids optional chaining and nullish coalescing for older Node runtimes');
  context.assert(maracaBridge.includes('executeToolingBridgeOperation') && maracaBridge.includes("operation: 'maraca-plan'"), 'Maraca compatibility bridge delegates planning and sanitization to the official tooling bridge');
  context.assert(pageLoader.includes("from '/xtendrmt/rmt-dom-descriptor-renderer.js'") && pageLoader.includes('docsRmtDescriptorRenderer.render('), 'Preview client uses the stable DOM descriptor renderer export');
  context.assert(playgroundClient.includes('DOCS_RMT_PLAYGROUND_MARACA_RUNTIME_MODULES') && playgroundClient.includes('bootDocsRmtPlaygroundMaracaPreview'), 'Preview client boots the Maraca runtime preview from whitelisted modules');
  context.assert(playgroundClient.includes('playgroundMode: DOCS_RMT_PLAYGROUND_MARACA_MODE'), 'Compile requests opt into Maraca preview mode');
  context.assert(playgroundClient.includes('runDocsRmtPlaygroundLanguageDiagnostics'), 'Preview client calls live LSP diagnostics');
  context.assert(playgroundClient.includes('replaceChildren'), 'Preview client resets surfaces with replaceChildren');
  context.assert(!playgroundClient.includes('innerHTML'), 'Playground client does not use innerHTML');
  context.assert(pageLoader.includes('createMaracaPlanRuntime({') && !pageLoader.includes('writeDocsRmtPlaygroundPath'), 'Playground delegates reducer paths to the official Maraca runtime');
  context.assert(!pageLoader.includes('syncDocsRmtPlaygroundMaracaStateAttributes'), 'Playground contains no local reducer-to-DOM synchronization path');
  context.assert(!pageLoader.includes('createDocsRmtPlaygroundMaracaKernel'), 'Playground contains no local kernel controller');

  const validResult = runPlaygroundEndpoint(rootDir, 'POST', JSON.stringify({ source: VALID_SOURCE, locale: 'en' }));
  const validPayload = parseEndpointJson(validResult);
  context.assert(validResult.status === 0, `Valid playground POST exits cleanly${validResult.status === 0 ? '' : ` (${validResult.stderr})`}`);
  context.assert(validPayload.ok === true, 'Valid playground source compiles through the endpoint');
  context.assert(typeof validPayload.coreJson === 'string' && validPayload.coreJson.includes('xtend.rmt.core-format.vnext.v1'), 'Endpoint returns core JSON output');
  context.assert(validPayload.preview && Array.isArray(validPayload.preview.surfaces), 'Endpoint returns structured preview data');
  const previewSurface = validPayload.preview && validPayload.preview.surfaces && validPayload.preview.surfaces[0];
  context.assert(previewSurface && previewSurface.componentPreview && previewSurface.componentPreview.tag === 'x-status', 'Endpoint returns x-status descriptor preview data');
  context.assert(previewSurface && previewSurface.componentPreview && previewSurface.componentPreview.descriptor && previewSurface.componentPreview.descriptor.attributes && previewSurface.componentPreview.descriptor.attributes.message === 'Hello from the playground', 'Endpoint maps selector state into descriptor attributes');

  const genericPayload = parseEndpointJson(runPlaygroundEndpoint(rootDir, 'POST', JSON.stringify({ source: GENERIC_COMPONENT_SOURCE, locale: 'en' })));
  const genericSurface = genericPayload.preview && genericPayload.preview.surfaces && genericPayload.preview.surfaces[0];
  context.assert(genericPayload.ok === true, 'Playground compiles RMT with imports and non-status XTend components');
  context.assert(genericPayload.preview && genericPayload.preview.importCount === 1, 'Endpoint preserves compiled import records');
  context.assert(genericSurface && genericSurface.componentPreview && genericSurface.componentPreview.tag === 'x-progress', 'Endpoint returns generic x-progress descriptor preview data');
  context.assert(genericSurface && genericSurface.componentPreview && genericSurface.componentPreview.descriptor.attributes.value === '72', 'Endpoint maps generic component state into descriptor attributes');

  const maracaPayload = parseEndpointJson(runPlaygroundEndpoint(rootDir, 'POST', JSON.stringify({
    source: customerServiceKernelSource,
    locale: 'en',
    playgroundMode: 'maraca-preview',
    maraca: {
      orchestration: 'auto',
      kernel: 'auto',
      hydration: 'auto',
      validation: 'auto',
      transitions: 'auto'
    }
  })));
  context.assert(maracaPayload.ok === true, 'Customer Service Kernel source compiles through the playground endpoint');
  context.assert(maracaPayload.maraca && maracaPayload.maraca.ok === true, 'Endpoint appends a successful Maraca preview plan');
  context.assert(maracaPayload.maraca && maracaPayload.maraca.summary && maracaPayload.maraca.summary.surfaceCount === 15, 'Maraca preview reports 15 surfaces');
  context.assert(maracaPayload.maraca && maracaPayload.maraca.summary && maracaPayload.maraca.summary.actionCount === 12, 'Maraca preview reports 12 actions');
  context.assert(maracaPayload.maraca && maracaPayload.maraca.summary && maracaPayload.maraca.summary.validationGroupCount === 3, 'Maraca preview reports 3 validation groups');
  context.assert(maracaPayload.maraca && maracaPayload.maraca.summary && maracaPayload.maraca.summary.transitionCount === 6, 'Maraca preview reports 6 transitions');
  context.assert(maracaPayload.maraca && maracaPayload.maraca.features && maracaPayload.maraca.features.kernel && maracaPayload.maraca.features.kernel.enabled === true, 'Maraca preview enables kernel orchestration');
  context.assert(maracaPayload.maraca && maracaPayload.maraca.features && maracaPayload.maraca.features.validation && maracaPayload.maraca.features.validation.enabled === true, 'Maraca preview enables validation');
  context.assert(maracaPayload.maraca && maracaPayload.maraca.features && maracaPayload.maraca.features.transitions && maracaPayload.maraca.features.transitions.enabled === true, 'Maraca preview enables transitions');
  context.assert(!/\/home\/|workpackage|WP-/iu.test(JSON.stringify(maracaPayload.maraca || {})), 'Maraca preview response strips local paths and internal workpackage identifiers');

  const brokenSource = 'template learn.rmt.playground { surface preview.card kind card component x-status { lane visible weight 80 { hydrate preview-card from selector preview.message } }';
  const lspPayload = parseEndpointJson(runPlaygroundEndpoint(rootDir, 'POST', JSON.stringify({ source: brokenSource, locale: 'en' }), null, 'diagnostics'));
  context.assert(lspPayload.ok === true, 'Diagnostics endpoint returns a successful LSP response for broken source');
  context.assert(lspPayload.diagnosticsSource === 'xtend-rmt-language-server', 'Diagnostics endpoint identifies the LSP diagnostics source');
  context.assert(lspPayload.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.vnext.syntax.error' && diagnostic.severity === 'error'), 'Diagnostics endpoint returns vNext syntax errors from the Language Server');

  const getResult = runPlaygroundEndpoint(rootDir, 'GET', '');
  const getPayload = parseEndpointJson(getResult);
  context.assert(getPayload.status === 'method_not_allowed', 'Compile endpoint refuses GET requests');
  const diagnosticsGetPayload = parseEndpointJson(runPlaygroundEndpoint(rootDir, 'GET', '', null, 'diagnostics'));
  context.assert(diagnosticsGetPayload.status === 'method_not_allowed', 'Diagnostics endpoint refuses GET requests');

  const oversizedPayload = parseEndpointJson(runPlaygroundEndpoint(rootDir, 'POST', '', 71 * 1024));
  context.assert(oversizedPayload.status === 'body_too_large', 'Compile endpoint refuses oversize POST bodies');
  const oversizedDiagnosticsPayload = parseEndpointJson(runPlaygroundEndpoint(rootDir, 'POST', '', 71 * 1024, 'diagnostics'));
  context.assert(oversizedDiagnosticsPayload.status === 'body_too_large', 'Diagnostics endpoint refuses oversize POST bodies');

  const maliciousSource = '<script>alert(1)</script>';
  const maliciousResult = runPlaygroundEndpoint(rootDir, 'POST', JSON.stringify({ source: maliciousSource }));
  const maliciousPayload = parseEndpointJson(maliciousResult);
  context.assert(maliciousPayload.status === 'blocked', 'Compile endpoint blocks script input before compilation');
  context.assert(!/(<script|<\/script|javascript:|onerror=)/iu.test(maliciousResult.stdout || ''), 'Malicious response contains no executable HTML or script');

  const invalidSource = 'template learn.rmt.invalid { surface root { lane visible weight 80 { mount } } }';
  const invalidResult = runPlaygroundEndpoint(rootDir, 'POST', JSON.stringify({ source: invalidSource }));
  const invalidPayload = parseEndpointJson(invalidResult);
  context.assert(invalidPayload.ok === false, 'Invalid RMT source returns diagnostics');
  context.assert(!/workpackage|WP-/iu.test(invalidResult.stdout || ''), 'Compiler diagnostics are stripped of internal fields');

  context.assert(packageManifest.scripts['test:rmt-playground-security'] === 'node scripts/run_xtend_tests.js rmt-playground-security', 'package exposes rmt-playground-security script');
  context.assert(packageManifest.xtend && packageManifest.xtend.rmtPlaygroundSecurity && packageManifest.xtend.rmtPlaygroundSecurity.schema === RMT_PLAYGROUND_SECURITY_SCHEMA, 'package metadata records RMT playground security schema');
  context.assert(runner.includes("id: 'rmt-playground-security'"), 'test runner exposes rmt-playground-security suite');

  return context.result({
    report: {
      schema: RMT_PLAYGROUND_SECURITY_REPORT_SCHEMA,
      endpoint: 'docs/index.php?xtend-rmt-playground=compile',
      sourceLimitBytes: 64 * 1024
    }
  });
}

function printRmtPlaygroundSecurityReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT playground security checks passed.',
    failureTitle: 'RMT playground security checks failed:'
  });
}

if (require.main === module) {
  const result = runRmtPlaygroundSecuritySuite();
  printRmtPlaygroundSecurityReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printRmtPlaygroundSecurityReport,
  runRmtPlaygroundSecuritySuite
};
