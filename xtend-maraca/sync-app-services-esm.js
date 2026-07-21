'use strict';

const fs = require('fs');
const path = require('path');

const CJS_EXPORT_MARKER = 'module.exports = {';
const APP_TRUSTED_TEXT_IMPORT_PATTERN = /const \{\n([\s\S]*?)\n\} = require\('\.\/trusted-text-sanitizer'\);/u;
const SECURITY_TRUSTED_TEXT_IMPORT_PATTERN = /const \{\n([\s\S]*?)\n\} = require\('\.\.\/xtend-maraca\/trusted-text-sanitizer'\);/u;

function createAppServicesEsmSource(commonJsSource) {
  const source = String(commonJsSource || '').replace(
    APP_TRUSTED_TEXT_IMPORT_PATTERN,
    "import {\n$1\n} from './trusted-text-sanitizer.mjs';"
  );
  const markerIndex = source.lastIndexOf(CJS_EXPORT_MARKER);
  if (markerIndex < 0) {
    throw new Error(`AppServices CommonJS source must contain a final ${CJS_EXPORT_MARKER} block.`);
  }
  if (source.indexOf(CJS_EXPORT_MARKER) !== markerIndex) {
    throw new Error('AppServices CommonJS source contains more than one module.exports block.');
  }
  const prefix = source.slice(0, markerIndex);
  const exportBlock = source.slice(markerIndex).replace(CJS_EXPORT_MARKER, 'export {');
  return `${prefix}${exportBlock}`;
}

function createTrustedDomPolicyEsmSource(commonJsSource) {
  const source = String(commonJsSource || '').replace(
    SECURITY_TRUSTED_TEXT_IMPORT_PATTERN,
    "import {\n$1\n} from '../xtend-maraca/trusted-text-sanitizer.mjs';"
  );
  const markerIndex = source.lastIndexOf(CJS_EXPORT_MARKER);
  if (markerIndex < 0 || source.indexOf(CJS_EXPORT_MARKER) !== markerIndex) {
    throw new Error('Trusted DOM policy CommonJS source must contain one final module.exports block.');
  }
  return `${source.slice(0, markerIndex)}${source.slice(markerIndex).replace(CJS_EXPORT_MARKER, 'export {')}`;
}

function createTrustedTextSanitizerEsmSource(commonJsSource) {
  const source = String(commonJsSource || '');
  const markerIndex = source.lastIndexOf(CJS_EXPORT_MARKER);
  if (markerIndex < 0 || source.indexOf(CJS_EXPORT_MARKER) !== markerIndex) {
    throw new Error('Trusted text sanitizer CommonJS source must contain one final module.exports block.');
  }
  return `${source.slice(0, markerIndex)}${source.slice(markerIndex).replace(CJS_EXPORT_MARKER, 'export {')}`;
}

function createNodeAppServiceHostEsmSource(commonJsSource) {
  const source = String(commonJsSource || '');
  const importPattern = /const \{\n([\s\S]*?)\n\} = require\('\.\/app-services'\);/u;
  if (!importPattern.test(source)) {
    throw new Error('Node AppService host must import the AppServices CommonJS module with the canonical destructuring block.');
  }
  return createAppServicesEsmSource(source.replace(
    importPattern,
    "import {\n$1\n} from './app-services.mjs';"
  ));
}

function syncAppServicesEsm(options = {}) {
  const directory = path.resolve(options.directory || __dirname);
  const commonJsPath = path.join(directory, 'app-services.js');
  const esmPath = path.join(directory, 'app-services.mjs');
  const nodeCommonJsPath = path.join(directory, 'node-app-service-host.js');
  const nodeEsmPath = path.join(directory, 'node-app-service-host.mjs');
  const trustedTextCommonJsPath = path.join(directory, 'trusted-text-sanitizer.js');
  const trustedTextEsmPath = path.join(directory, 'trusted-text-sanitizer.mjs');
  const securityDirectory = path.resolve(directory, '..', 'security');
  const trustedPolicyCommonJsPath = path.join(securityDirectory, 'trusted-dom-policy.js');
  const trustedPolicyEsmPath = path.join(securityDirectory, 'trusted-dom-policy.mjs');
  const expected = createAppServicesEsmSource(fs.readFileSync(commonJsPath, 'utf8'));
  const nodeExpected = createNodeAppServiceHostEsmSource(fs.readFileSync(nodeCommonJsPath, 'utf8'));
  const trustedTextExpected = createTrustedTextSanitizerEsmSource(fs.readFileSync(trustedTextCommonJsPath, 'utf8'));
  const trustedPolicyExpected = createTrustedDomPolicyEsmSource(fs.readFileSync(trustedPolicyCommonJsPath, 'utf8'));
  const current = fs.existsSync(esmPath) ? fs.readFileSync(esmPath, 'utf8') : null;
  const nodeCurrent = fs.existsSync(nodeEsmPath) ? fs.readFileSync(nodeEsmPath, 'utf8') : null;
  const trustedTextCurrent = fs.existsSync(trustedTextEsmPath) ? fs.readFileSync(trustedTextEsmPath, 'utf8') : null;
  const trustedPolicyCurrent = fs.existsSync(trustedPolicyEsmPath) ? fs.readFileSync(trustedPolicyEsmPath, 'utf8') : null;
  if (options.check === true) {
    return Object.freeze({
      ok: current === expected && nodeCurrent === nodeExpected && trustedTextCurrent === trustedTextExpected && trustedPolicyCurrent === trustedPolicyExpected,
      commonJsPath,
      esmPath,
      nodeCommonJsPath,
      nodeEsmPath
    });
  }
  if (current !== expected) fs.writeFileSync(esmPath, expected);
  if (nodeCurrent !== nodeExpected) fs.writeFileSync(nodeEsmPath, nodeExpected);
  if (trustedTextCurrent !== trustedTextExpected) fs.writeFileSync(trustedTextEsmPath, trustedTextExpected);
  if (trustedPolicyCurrent !== trustedPolicyExpected) fs.writeFileSync(trustedPolicyEsmPath, trustedPolicyExpected);
  return Object.freeze({
    ok: true,
    changed: current !== expected || nodeCurrent !== nodeExpected || trustedTextCurrent !== trustedTextExpected || trustedPolicyCurrent !== trustedPolicyExpected,
    commonJsPath,
    esmPath,
    nodeCommonJsPath,
    nodeEsmPath
  });
}

if (require.main === module) {
  const check = process.argv.includes('--check');
  const result = syncAppServicesEsm({ check });
  if (!result.ok) {
    console.error('XTend Maraca generated ESM artifacts are not synchronized with their CommonJS sources.');
    process.exitCode = 1;
  } else if (!check && result.changed) {
    console.log('Synchronized xtend-maraca/app-services.mjs.');
  }
}

module.exports = {
  createAppServicesEsmSource,
  createTrustedDomPolicyEsmSource,
  createTrustedTextSanitizerEsmSource,
  createNodeAppServiceHostEsmSource,
  syncAppServicesEsm
};
