'use strict';
const path = require('node:path');
const rootDir = path.resolve(__dirname, '../../../..');
const source = 'development/rmtx-a06/release-acceptance/runtime/source.rmtx';
function createInput(outputDir) {
  return { source, project: true, sourceSyntax: 'rmtx', rmtxSyntaxVersion: '8.0.0',
    rmtxProviders: require('../../orchestration-profile/reference.cjs').providers(),
    out: path.resolve(outputDir), profile: 'production', orchestration: 'strict', kernel: 'strict',
    hydration: 'off', validation: 'off', transitions: 'off', services: false, pwa: false, lazy: 'none' };
}
async function build(outputDir) {
  return require('../../../../xtend-maraca').buildMaracaRmtxSSRBundleAsync({
    schema: 'xtend.maraca.rmtx-ssr-build-options.v1', input: createInput(outputDir)
  }, { rootDir });
}
module.exports = { rootDir, source, createInput, build };
