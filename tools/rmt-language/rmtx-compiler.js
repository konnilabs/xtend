'use strict';
const { parseRmtxSource, RMTX_SOURCE_PROFILE, RMTX_SELECTOR_SOURCE_PROFILE } = require('./rmtx-parser');
const { createRmtxSelectorDependencyReport } = require('./rmtx-selector-dependencies');
const { compileRmtClassicAstResult } = require('./classic-compiler');
const { validateStateBindingArtifact } = require('../xtensions/state-binding-artifact');
const RMTX_COMPILER_API_VERSION = '2.0.0';
const RMTX_COMPILE_RESULT_SCHEMA = 'xtend.rmtx.compile-result.v1';
const RMTX_COMPILE_RESULT_SCHEMA_V2 = 'xtend.rmtx.compile-result.v2';
function compileRmtxSource(input = {}, options = {}) {
  const parserResult = parseRmtxSource(input, options);
  let result = { ok: false, phase: parserResult.phase, status: 'invalid', diagnostics: parserResult.diagnostics,
    compilerDiagnostics: [], coreDocument: null, coreJson: null, orchestrationArtifacts: null, appServiceDemands: null, primitiveArtifacts: null };
  if (parserResult.ok) {
    const { xtensionBindings: ignored, ...backendOptions } = options;
    result = compileRmtClassicAstResult(parserResult.ast, { ...backendOptions, sourceModel: parserResult.sourceModel, sourceProfile: parserResult.sourceProfile });
    if (result.ok && Object.hasOwn(options, 'xtensionBindings')) {
      try { result = { ...result, xtensionBindings: validateStateBindingArtifact(options.xtensionBindings, result.orchestrationArtifacts) }; }
      catch (error) {
        const diagnostics = error.diagnostics || [{ code: 'rmtx.xtensions.binding.invalid', severity: 'error', message: error.message }];
        result = { ...result, ok: false, phase: 'xtension-bindings', status: 'invalid',
          diagnostics: [...result.diagnostics, ...diagnostics], compilerDiagnostics: [...result.compilerDiagnostics, ...diagnostics] };
      }
    }
  }
  const v2 = parserResult.sourceProfile.version === '2.0.0';
  if (v2) result = { ...result, selectorDependencies: result.ok
    ? createRmtxSelectorDependencyReport({ ...result, sourceProfile: parserResult.sourceProfile }) : null };
  if (!result.ok) result = { ...result, coreDocument: null, coreJson: null, orchestrationArtifacts: null, appServiceDemands: null, primitiveArtifacts: null, xtensionBindings: null };
  return { ...result, schema: v2 ? RMTX_COMPILE_RESULT_SCHEMA_V2 : RMTX_COMPILE_RESULT_SCHEMA,
    apiVersion: parserResult.sourceProfile.version, sourceProfile: parserResult.sourceProfile, parserResult,
    diagnostics: result.diagnostics.map(diagnostic => ({ ...diagnostic, source: 'rmtx' })),
    compilerDiagnostics: result.compilerDiagnostics.map(diagnostic => ({ ...diagnostic, source: 'rmtx' })) };
}
function createRmtxCompiler(defaultOptions = {}) {
  const profile = defaultOptions.syntaxVersion === '2.0.0' ? RMTX_SELECTOR_SOURCE_PROFILE : RMTX_SOURCE_PROFILE;
  return Object.freeze({ name: 'RMTX', apiVersion: profile.version,
    schema: profile.version === '2.0.0' ? RMTX_COMPILE_RESULT_SCHEMA_V2 : RMTX_COMPILE_RESULT_SCHEMA, sourceProfile: profile,
    compileSource: (input = {}, options = {}) => compileRmtxSource(input, { ...defaultOptions, ...options }) });
}
module.exports = { RMTX_COMPILER_API_VERSION, RMTX_COMPILE_RESULT_SCHEMA, RMTX_COMPILE_RESULT_SCHEMA_V2, compileRmtxSource, createRmtxCompiler };
