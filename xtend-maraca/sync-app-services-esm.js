'use strict';

const fs = require('fs');
const path = require('path');

const CJS_EXPORT_MARKER = 'module.exports = {';

function createAppServicesEsmSource(commonJsSource) {
  const source = String(commonJsSource || '');
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
  const expected = createAppServicesEsmSource(fs.readFileSync(commonJsPath, 'utf8'));
  const nodeExpected = createNodeAppServiceHostEsmSource(fs.readFileSync(nodeCommonJsPath, 'utf8'));
  const current = fs.existsSync(esmPath) ? fs.readFileSync(esmPath, 'utf8') : null;
  const nodeCurrent = fs.existsSync(nodeEsmPath) ? fs.readFileSync(nodeEsmPath, 'utf8') : null;
  if (options.check === true) {
    return Object.freeze({
      ok: current === expected && nodeCurrent === nodeExpected,
      commonJsPath,
      esmPath,
      nodeCommonJsPath,
      nodeEsmPath
    });
  }
  if (current !== expected) fs.writeFileSync(esmPath, expected);
  if (nodeCurrent !== nodeExpected) fs.writeFileSync(nodeEsmPath, nodeExpected);
  return Object.freeze({
    ok: true,
    changed: current !== expected || nodeCurrent !== nodeExpected,
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
  createNodeAppServiceHostEsmSource,
  syncAppServicesEsm
};
