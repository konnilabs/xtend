'use strict';
const { parseRmtxSource, RMTX_SOURCE_PROFILE, RMTX_SELECTOR_SOURCE_PROFILE, RMTX_KEYED_SOURCE_PROFILE, RMTX_ORCHESTRATION_SOURCE_PROFILE, RMTX_NATIVE_SOURCE_PROFILE } = require('./rmtx-parser');
const { projectRmtxHostScopes } = require('./rmtx-host-scopes');
const { createRmtxSelectorDependencyReport } = require('./rmtx-selector-dependencies');
const { compileRmtClassicAstResult } = require('./classic-compiler');
const { validateStateBindingArtifact } = require('../xtensions/state-binding-artifact');
const RMTX_COMPILER_API_VERSION = '5.0.0';
const RMTX_COMPILE_RESULT_SCHEMA = 'xtend.rmtx.compile-result.v1';
const RMTX_COMPILE_RESULT_SCHEMA_V2 = 'xtend.rmtx.compile-result.v2';
const RMTX_COMPILE_RESULT_SCHEMA_V3 = 'xtend.rmtx.compile-result.v3';
const RMTX_COMPILE_RESULT_SCHEMA_V4 = 'xtend.rmtx.compile-result.v4';
const RMTX_COMPILE_RESULT_SCHEMA_V5 = 'xtend.rmtx.compile-result.v5';
function compileRmtxSource(input = {}, options = {}) {
  const parserResult = parseRmtxSource(input, options);
  let result = { ok: false, phase: parserResult.phase, status: 'invalid', diagnostics: parserResult.diagnostics,
    compilerDiagnostics: [], coreDocument: null, coreJson: null, orchestrationArtifacts: null, appServiceDemands: null, primitiveArtifacts: null };
  if (parserResult.ok) {
    const { xtensionBindings: ignored, componentInterfaceCatalog, ...backendOptions } = options;
    const native = parserResult.sourceProfile.version === '5.0.0';
    const extended = native || parserResult.sourceProfile.version === '4.0.0';
    result = compileRmtClassicAstResult(parserResult.ast, { ...backendOptions, sourceModel: parserResult.sourceModel, sourceProfile: parserResult.sourceProfile,
      ...(extended ? { rmtxActionInputRules: parserResult.actionInputRules } : {}),
      ...(native ? { rmtxNativeView: parserResult.nativeView } : {}) });
    if (result.ok && extended) {
      try {
        if (Object.hasOwn(options, 'xtensionBindings')) throw new TypeError(native ? 'RMTX 5 uses inline provider bindings; additional binding sidecars are not supported.' : 'RMTX 4 uses inline provider bindings; additional binding sidecars are not supported.');
        if (parserResult.components.hosts.length) {
          const projection = require('./rmtx-component-bindings').projectRmtxComponents({ contract: parserResult.components,
            catalog: componentInterfaceCatalog, program: result.orchestrationArtifacts });
          result = { ...result, xtensionBindings: projection.xtensionBindings, xtensionComposition: projection.xtensionComposition,
            componentDependencies: projection.dependencies };
        }
      } catch (error) {
        const diagnostics = error.diagnostics || [{ code: 'rmtx.components.invalid', severity: 'error', message: error.message }];
        result = { ...result, ok: false, phase: 'components', status: 'invalid', diagnostics: [...result.diagnostics, ...diagnostics], compilerDiagnostics: [...result.compilerDiagnostics, ...diagnostics] };
      }
    } else if (result.ok && (Object.hasOwn(options, 'xtensionBindings') || parserResult.hostScopes?.hosts.length)) {
      try {
        const bindings = parserResult.sourceProfile.version === '3.0.0'
          ? projectRmtxHostScopes(parserResult.hostScopes, options.xtensionBindings) : options.xtensionBindings;
        result = { ...result, xtensionBindings: validateStateBindingArtifact(bindings, result.orchestrationArtifacts) };
      }
      catch (error) {
        const diagnostics = error.diagnostics || [{ code: 'rmtx.xtensions.binding.invalid', severity: 'error', message: error.message }];
        result = { ...result, ok: false, phase: 'xtension-bindings', status: 'invalid',
          diagnostics: [...result.diagnostics, ...diagnostics], compilerDiagnostics: [...result.compilerDiagnostics, ...diagnostics] };
      }
    }
  }
  const v3 = parserResult.sourceProfile.version === '3.0.0';
  const v5 = parserResult.sourceProfile.version === '5.0.0';
  const v4 = parserResult.sourceProfile.version === '4.0.0';
  const v2 = parserResult.sourceProfile.version === '2.0.0' || v3 || v4 || v5;
  if (v2) result = { ...result, selectorDependencies: result.ok
    ? createRmtxSelectorDependencyReport({ ...result, sourceProfile: parserResult.sourceProfile }) : null };
  if ((v4 || v5) && result.ok && result.componentDependencies) {
    const selectors = new Map(result.selectorDependencies.selectors.map(selector => [selector.id, selector]));
    const declarations = result.componentDependencies.declarations.map(declaration => {
      const reads = new Map();
      for (const read of declaration.reads) {
        const values = read.root === 'state' ? [{ root: 'state', symbol: read.symbol, path: read.path }]
          : selectors.get(read.symbol).transitiveStateReads.map(value => ({ root: 'state', symbol: value.symbol, path: value.path }));
        values.forEach(value => reads.set(JSON.stringify(value), value));
      }
      return { ...declaration, transitiveStateReads: [...reads.values()].sort((a, b) => JSON.stringify(a) < JSON.stringify(b) ? -1 : JSON.stringify(a) > JSON.stringify(b) ? 1 : 0) };
    });
    const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
    result = { ...result, componentDependencies: freeze({ ...result.componentDependencies, declarations }) };
  }
  if (v5) {
    if (result.ok) {
      const report = require('./rmtx-native-view').lowerRmtxNativeViews(parserResult.nativeView, result.coreDocument.appPlatform).dependencies;
      const selectors = new Map(result.selectorDependencies.selectors.map(selector => [selector.id, selector]));
      const surfaces = report.surfaces.map(surface => {
        const reads = new Map();
        for (const read of surface.reads) {
          const values = read.root === 'state' ? [read] : selectors.get(read.symbol).transitiveStateReads.map(value => ({ root: 'state', symbol: value.symbol, path: value.path }));
          values.forEach(value => reads.set(JSON.stringify(value), value));
        }
        return { ...surface, transitiveStateReads: [...reads.values()].sort((a, b) => JSON.stringify(a) < JSON.stringify(b) ? -1 : JSON.stringify(a) > JSON.stringify(b) ? 1 : 0) };
      });
      const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
      result = { ...result, nativeDependencies: freeze({ ...report, surfaces }) };
    } else result = { ...result, nativeDependencies: null };
  }
  if (!result.ok) result = { ...result, coreDocument: null, coreJson: null, orchestrationArtifacts: null, appServiceDemands: null, primitiveArtifacts: null, xtensionBindings: null,
    ...((v4 || v5) ? { xtensionComposition: null, componentDependencies: null } : {}) };
  return { ...result, schema: v5 ? RMTX_COMPILE_RESULT_SCHEMA_V5 : v4 ? RMTX_COMPILE_RESULT_SCHEMA_V4 : v3 ? RMTX_COMPILE_RESULT_SCHEMA_V3 : v2 ? RMTX_COMPILE_RESULT_SCHEMA_V2 : RMTX_COMPILE_RESULT_SCHEMA,
    apiVersion: parserResult.sourceProfile.version, sourceProfile: parserResult.sourceProfile, parserResult,
    diagnostics: result.diagnostics.map(diagnostic => ({ ...diagnostic, source: 'rmtx' })),
    compilerDiagnostics: result.compilerDiagnostics.map(diagnostic => ({ ...diagnostic, source: 'rmtx' })) };
}
function createRmtxCompiler(defaultOptions = {}) {
  const profile = defaultOptions.syntaxVersion === '5.0.0' ? RMTX_NATIVE_SOURCE_PROFILE : defaultOptions.syntaxVersion === '4.0.0' ? RMTX_ORCHESTRATION_SOURCE_PROFILE : defaultOptions.syntaxVersion === '3.0.0' ? RMTX_KEYED_SOURCE_PROFILE : defaultOptions.syntaxVersion === '2.0.0' ? RMTX_SELECTOR_SOURCE_PROFILE : RMTX_SOURCE_PROFILE;
  return Object.freeze({ name: 'RMTX', apiVersion: profile.version,
    schema: profile.version === '5.0.0' ? RMTX_COMPILE_RESULT_SCHEMA_V5 : profile.version === '4.0.0' ? RMTX_COMPILE_RESULT_SCHEMA_V4 : profile.version === '3.0.0' ? RMTX_COMPILE_RESULT_SCHEMA_V3 : profile.version === '2.0.0' ? RMTX_COMPILE_RESULT_SCHEMA_V2 : RMTX_COMPILE_RESULT_SCHEMA, sourceProfile: profile,
    compileSource: (input = {}, options = {}) => compileRmtxSource(input, { ...defaultOptions, ...options,
      ...(['4.0.0', '5.0.0'].includes(profile.version) && options.syntaxVersion === undefined ? { syntaxVersion: profile.version } : {}) }) });
}
module.exports = { RMTX_COMPILER_API_VERSION, RMTX_COMPILE_RESULT_SCHEMA, RMTX_COMPILE_RESULT_SCHEMA_V2, RMTX_COMPILE_RESULT_SCHEMA_V3, RMTX_COMPILE_RESULT_SCHEMA_V4, RMTX_COMPILE_RESULT_SCHEMA_V5, compileRmtxSource, createRmtxCompiler };
