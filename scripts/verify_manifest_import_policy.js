#!/usr/bin/env node

const path = require('path');
const {
  readJson,
  resolveRootDir
} = require('../tests/utils/files');
const {
  IMPORT_POLICY_CONTRACT,
  LOADER_POLICY_CONTRACT,
  MANIFEST_IMPORT_GATE_CONTRACT,
  MANIFEST_POLICY_CONTRACT,
  classifyManifestRecord,
  classifyPolicyUrl,
  createManifestImportPolicy,
  normalizeManifest
} = require('../security/manifest-import-policy');

const REPORT_SCHEMA = 'xtend.security.manifest-import-policy-report.v1';

function createCheck(id, ok, detail = {}) {
  return {
    id,
    ok: Boolean(ok),
    detail
  };
}

function runManifestImportPolicyVerification(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const baseUrl = options.baseUrl || 'http://127.0.0.1:4173/components/manifest.json';
  const currentUrl = options.currentUrl || 'http://127.0.0.1:4173/index.html';
  const manifest = readJson('components/manifest.json', rootDir);
  const policy = createManifestImportPolicy();
  const normalized = normalizeManifest(manifest, { baseUrl, currentUrl });
  const externalImport = classifyPolicyUrl('https://cdn.example.com/xtend/xalert.js', {
    kind: 'module',
    baseUrl,
    currentUrl,
    source: 'external-fixture'
  });
  const javascriptImport = classifyPolicyUrl('javascript:alert(1)', {
    kind: 'module',
    baseUrl,
    currentUrl,
    source: 'javascript-fixture'
  });
  const dataImport = classifyPolicyUrl('data:text/javascript,alert(1)', {
    kind: 'module',
    baseUrl,
    currentUrl,
    source: 'data-fixture'
  });
  const badManifest = classifyPolicyUrl('https://cdn.example.com/manifest.json', {
    kind: 'manifest',
    baseUrl: currentUrl,
    currentUrl,
    source: 'manifest-fixture'
  });
  const badTag = classifyManifestRecord('BadTag', './xalert.js', { baseUrl, currentUrl });
  const urlDependency = classifyManifestRecord('x-bad', {
    path: './xbad.js',
    dependencies: ['https://cdn.example.com/x.js']
  }, { baseUrl, currentUrl });

  const checks = [
    createCheck('policy-contracts', (
      policy.loaderPolicy === LOADER_POLICY_CONTRACT &&
      policy.manifestPolicy === MANIFEST_POLICY_CONTRACT &&
      policy.importPolicy === IMPORT_POLICY_CONTRACT &&
      policy.schema === MANIFEST_IMPORT_GATE_CONTRACT
    ), policy),
    createCheck('current-manifest-normalizes', normalized.ok === true, {
      entryCount: Object.keys(normalized.entries).length,
      diagnostics: normalized.diagnostics
    }),
    createCheck('external-module-refused', externalImport.ok === false && externalImport.diagnostics.includes('xtend.security.import.refused.external_module'), externalImport),
    createCheck('javascript-module-refused', javascriptImport.ok === false && javascriptImport.diagnostics.includes('xtend.security.import.refused.protocol'), javascriptImport),
    createCheck('data-module-refused', dataImport.ok === false && dataImport.diagnostics.includes('xtend.security.import.refused.protocol'), dataImport),
    createCheck('external-manifest-refused', badManifest.ok === false && badManifest.diagnostics.includes('xtend.security.loader.refused.external_manifest'), badManifest),
    createCheck('invalid-manifest-tag-refused', badTag.ok === false && badTag.diagnostics.includes('xtend.security.manifest.invalid.tag'), badTag),
    createCheck('url-dependency-refused', urlDependency.ok === false && urlDependency.diagnostics.includes('xtend.security.manifest.invalid.dependencies'), urlDependency)
  ];

  return {
    schema: REPORT_SCHEMA,
    ok: checks.every((check) => check.ok),
    rootDir,
    policy,
    normalizedEntryCount: Object.keys(normalized.entries).length,
    checks
  };
}

function printReport(report) {
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  if (report.ok) {
    console.log('XTend Manifest Import Policy Verification erfolgreich.');
  } else {
    console.error('XTend Manifest Import Policy Verification fehlgeschlagen.');
  }

  report.checks.forEach((check) => {
    const prefix = check.ok ? '-' : '- FAILED:';
    console.log(`${prefix} ${check.id}`);
  });
}

if (require.main === module) {
  const report = runManifestImportPolicyVerification({
    rootDir: path.resolve(__dirname, '..')
  });
  printReport(report);
  if (!report.ok) {
    process.exit(1);
  }
}

module.exports = {
  REPORT_SCHEMA,
  runManifestImportPolicyVerification
};
