'use strict';
const { parseRmtxSource, RMTX_SOURCE_PROFILE } = require('./rmtx-parser');
const { compileRmtClassicAstResult } = require('./classic-compiler');
const { validateStateBindingArtifact } = require('../xtensions/state-binding-artifact');
const RMTX_COMPILER_API_VERSION = '1.0.0';
const RMTX_COMPILE_RESULT_SCHEMA = 'xtend.rmtx.compile-result.v1';
function compileRmtxSource(input = {}, options = {}) {
  const parserResult = parseRmtxSource(input, options);
  let result = { ok: false, phase: parserResult.phase, status: 'invalid', diagnostics: parserResult.diagnostics,
    compilerDiagnostics: [], coreDocument: null, coreJson: null, orchestrationArtifacts: null, appServiceDemands: null, primitiveArtifacts: null };
  if (parserResult.ok) {
    const { xtensionBindings: ignored, ...backendOptions } = options;
    result = compileRmtClassicAstResult(parserResult.ast, { ...backendOptions, sourceModel: parserResult.sourceModel, sourceProfile: RMTX_SOURCE_PROFILE });
    if (result.ok && Object.hasOwn(options, 'xtensionBindings')) {
      try { result = { ...result, xtensionBindings: validateStateBindingArtifact(options.xtensionBindings, result.orchestrationArtifacts) }; }
      catch (error) {
        const diagnostics = error.diagnostics || [{ code: 'rmtx.xtensions.binding.invalid', severity: 'error', message: error.message }];
        result = { ...result, ok: false, phase: 'xtension-bindings', status: 'invalid',
          diagnostics: [...result.diagnostics, ...diagnostics], compilerDiagnostics: [...result.compilerDiagnostics, ...diagnostics] };
      }
    }
  }
  if (!result.ok) result = { ...result, coreDocument: null, coreJson: null, orchestrationArtifacts: null, appServiceDemands: null, primitiveArtifacts: null, xtensionBindings: null };
  return { ...result, schema: RMTX_COMPILE_RESULT_SCHEMA, apiVersion: RMTX_COMPILER_API_VERSION, sourceProfile: RMTX_SOURCE_PROFILE, parserResult,
    diagnostics: result.diagnostics.map(diagnostic => ({ ...diagnostic, source: 'rmtx' })),
    compilerDiagnostics: result.compilerDiagnostics.map(diagnostic => ({ ...diagnostic, source: 'rmtx' })) };
}
function createRmtxCompiler(defaultOptions = {}) {
  return Object.freeze({ name: 'RMTX', apiVersion: RMTX_COMPILER_API_VERSION, schema: RMTX_COMPILE_RESULT_SCHEMA, sourceProfile: RMTX_SOURCE_PROFILE,
    compileSource: (input = {}, options = {}) => compileRmtxSource(input, { ...defaultOptions, ...options }) });
}
module.exports = { RMTX_COMPILER_API_VERSION, RMTX_COMPILE_RESULT_SCHEMA, compileRmtxSource, createRmtxCompiler };
