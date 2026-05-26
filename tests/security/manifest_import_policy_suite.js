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
  IMPORT_POLICY_CONTRACT,
  LOADER_POLICY_CONTRACT,
  MANIFEST_IMPORT_GATE_CONTRACT,
  MANIFEST_POLICY_CONTRACT,
  classifyManifestRecord,
  classifyPolicyUrl,
  createManifestImportPolicy,
  normalizeManifest
} = require('../../security/manifest-import-policy');
const {
  REPORT_SCHEMA,
  runManifestImportPolicyVerification
} = require('../../scripts/verify_manifest_import_policy');

function runManifestImportPolicySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const context = createSuiteContext({
    id: 'manifest-import-policy',
    label: 'XTend manifest and dynamic import policy gates'
  });
  const packageManifest = readJson('package.json', rootDir);
  const currentManifest = readJson('components/manifest.json', rootDir);
  const policySource = readText('security/manifest-import-policy.js', rootDir);
  const loaderSource = readText('xtend-loader.js', rootDir);
  const verifySource = readText('scripts/verify_manifest_import_policy.js', rootDir);
  const policy = createManifestImportPolicy();
  const baseUrl = 'http://127.0.0.1:4173/components/manifest.json';
  const currentUrl = 'http://127.0.0.1:4173/index.html';
  const normalized = normalizeManifest(currentManifest, { baseUrl, currentUrl });
  const localModule = classifyPolicyUrl('./xalert.js', { kind: 'module', baseUrl, currentUrl, source: 'x-alert' });
  const rootModule = classifyPolicyUrl('/components/xrouter.js', { kind: 'module', baseUrl, currentUrl, source: 'x-router' });
  const loopbackModule = classifyPolicyUrl('http://localhost:4173/components/xmodal.js', { kind: 'module', baseUrl, currentUrl, source: 'x-modal' });
  const externalModule = classifyPolicyUrl('https://cdn.example.com/xtend/xalert.js', { kind: 'module', baseUrl, currentUrl, source: 'external' });
  const javascriptModule = classifyPolicyUrl('javascript:alert(1)', { kind: 'module', baseUrl, currentUrl, source: 'javascript' });
  const dataModule = classifyPolicyUrl('data:text/javascript,alert(1)', { kind: 'module', baseUrl, currentUrl, source: 'data' });
  const traversalModule = classifyPolicyUrl('/components/%2e%2e/x.js', { kind: 'module', baseUrl, currentUrl, source: 'traversal' });
  const badExtension = classifyPolicyUrl('/components/xalert.txt', { kind: 'module', baseUrl, currentUrl, source: 'extension' });
  const externalManifest = classifyPolicyUrl('https://cdn.example.com/manifest.json', { kind: 'manifest', baseUrl: currentUrl, currentUrl, source: 'manifest' });
  const badTag = classifyManifestRecord('BadTag', './xalert.js', { baseUrl, currentUrl });
  const i18nBootstrap = classifyManifestRecord('xtend-i18n', './xtend-i18n.js', { baseUrl, currentUrl });
  const urlDependency = classifyManifestRecord('x-bad', {
    path: './xbad.js',
    dependencies: ['https://cdn.example.com/x.js']
  }, { baseUrl, currentUrl });
  const report = runManifestImportPolicyVerification({ rootDir, baseUrl, currentUrl });

  context.assertIncludes(policySource, LOADER_POLICY_CONTRACT, 'Policy module declares loader policy contract');
  context.assertIncludes(policySource, MANIFEST_POLICY_CONTRACT, 'Policy module declares manifest policy contract');
  context.assertIncludes(policySource, IMPORT_POLICY_CONTRACT, 'Policy module declares import policy contract');
  context.assertIncludes(policySource, MANIFEST_IMPORT_GATE_CONTRACT, 'Policy module declares manifest import gate contract');
  context.assertIncludes(verifySource, REPORT_SCHEMA, 'Verify script declares manifest import policy report schema');
  context.assert(policy.loaderPolicy === LOADER_POLICY_CONTRACT, 'Policy exposes loader policy contract');
  context.assert(policy.manifestPolicy === MANIFEST_POLICY_CONTRACT, 'Policy exposes manifest policy contract');
  context.assert(policy.importPolicy === IMPORT_POLICY_CONTRACT, 'Policy exposes import policy contract');
  context.assert(policy.schema === MANIFEST_IMPORT_GATE_CONTRACT, 'Policy exposes manifest import gate schema');
  context.assert(normalized.ok === true, 'Current components manifest passes manifest import policy');
  context.assert(Object.keys(normalized.entries).length === Object.keys(currentManifest).length, 'Current manifest keeps all valid entries');
  context.assert(localModule.ok === true, 'Relative local module URL is allowed');
  context.assert(rootModule.ok === true, 'Root-local module URL is allowed');
  context.assert(loopbackModule.ok === true, 'Loopback dev-server module URL is allowed from loopback origin');
  context.assert(externalModule.ok === false && externalModule.diagnostics.includes('xtend.security.import.refused.external_module'), 'External module URL is refused');
  context.assert(javascriptModule.ok === false && javascriptModule.diagnostics.includes('xtend.security.import.refused.protocol'), 'javascript: module URL is refused');
  context.assert(dataModule.ok === false && dataModule.diagnostics.includes('xtend.security.import.refused.protocol'), 'data: module URL is refused');
  context.assert(traversalModule.ok === false && traversalModule.diagnostics.includes('xtend.security.import.refused.path_traversal'), 'Encoded path traversal module URL is refused');
  context.assert(badExtension.ok === false && badExtension.diagnostics.includes('xtend.security.import.refused.extension'), 'Non-JavaScript module URL is refused');
  context.assert(externalManifest.ok === false && externalManifest.diagnostics.includes('xtend.security.loader.refused.external_manifest'), 'External manifest URL is refused');
  context.assert(badTag.ok === false && badTag.diagnostics.includes('xtend.security.manifest.invalid.tag'), 'Invalid manifest tag is refused');
  context.assert(i18nBootstrap.ok === true, 'xtend-i18n bootstrap manifest key is allowed');
  context.assert(policy.reservedBootstrapKeys.includes('xtend-i18n'), 'Manifest policy exposes xtend-i18n as reserved bootstrap key');
  context.assert(urlDependency.ok === false && urlDependency.diagnostics.includes('xtend.security.manifest.invalid.dependencies'), 'URL-like manifest dependency is refused');
  context.assertIncludes(loaderSource, 'xtend.security.loader-policy.v1', 'Loader source carries loader policy contract');
  context.assertIncludes(loaderSource, 'classifyLoaderUrl', 'Loader validates Manifest and module URLs before loading');
  context.assertIncludes(loaderSource, 'emitSecurityDiagnostic', 'Loader emits structured security diagnostics');
  context.assertIncludes(loaderSource, 'xtend.security.import.refused', 'Loader exposes import refusal diagnostic');
  context.assertIncludes(loaderSource, 'xtend.security.manifest.invalid', 'Loader exposes manifest invalid diagnostic');
  const manifestImportPolicyExport = packageManifest.exports['./security/manifest-import-policy'];
  context.assert((typeof manifestImportPolicyExport === 'string' ? manifestImportPolicyExport : manifestImportPolicyExport.default) === './security/manifest-import-policy.js', 'Package exports manifest import policy module');
  context.assert(packageManifest.scripts['test:manifest-policy'] === 'node scripts/run_xtend_tests.js manifest-import-policy', 'Package exposes manifest policy suite script');
  context.assert(packageManifest.scripts['security:manifest-policy'] === 'node scripts/verify_manifest_import_policy.js', 'Package exposes manifest policy verify script');
  context.assert(packageManifest.xtend.releaseGates.includes('npm run test:manifest-policy'), 'Release gates include manifest policy gate');
  context.assert(report.schema === REPORT_SCHEMA, 'Verify script returns manifest import policy report schema');
  context.assert(report.ok === true, 'Verify script passes for current manifest and refusal fixtures');
  context.assert(report.checks.length >= 8, 'Verify script performs multiple manifest policy checks');

  return context.result({
    policy,
    report
  });
}

function printManifestImportPolicyReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Manifest Import Policy Gates erfolgreich.',
    failureTitle: 'XTend Manifest Import Policy Gates fehlgeschlagen:'
  });
}

module.exports = {
  printManifestImportPolicyReport,
  runManifestImportPolicySuite
};
