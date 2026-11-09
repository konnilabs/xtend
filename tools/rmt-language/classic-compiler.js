'use strict';
const legacy = require('./vnext-compiler');
const { RMT_CLASSIC_COMPILER_CONTRACT, getRmtClassicAstSchema, validateRmtClassicAst } = require('./classic-ast-contract');
const { validateStateBindingArtifact } = require('../xtensions/state-binding-artifact');
const RMT_CLASSIC_COMPILER_API_VERSION = '4.0.0';
const RMT_CLASSIC_COMPILE_RESULT_SCHEMA = 'xtend.rmt.classic.compile-result.v4';

function assertContractVersion(options) {
  if (options.contractVersion !== undefined && options.contractVersion !== RMT_CLASSIC_COMPILER_CONTRACT.version) {
    throw Object.assign(new TypeError(`Unsupported RMT Classic compiler contract ${options.contractVersion}.`), {
      code: 'rmt.classic.contract.unsupported', expected: RMT_CLASSIC_COMPILER_CONTRACT.version, received: options.contractVersion
    });
  }
}
function compileRmtClassicSource(input = {}, options = {}) {
  assertContractVersion(options);
  const result = { ...legacy.compileRmtVNextSource(input, options), schema: RMT_CLASSIC_COMPILE_RESULT_SCHEMA };
  if (!Object.hasOwn(options, 'xtensionBindings') || !result.ok) return result;
  try {
    return { ...result, xtensionBindings: validateStateBindingArtifact(options.xtensionBindings, result.orchestrationArtifacts) };
  } catch (error) {
    const diagnostics = error.diagnostics || [{ code: 'rmt.xtensions.binding.invalid', severity: 'error', message: error.message, stage: 'xtension-bindings' }];
    return { ...result, ok: false, status: 'invalid', phase: 'xtension-bindings', diagnostics: [...result.diagnostics, ...diagnostics],
      compilerDiagnostics: [...result.compilerDiagnostics, ...diagnostics], coreDocument: null, coreJson: null, orchestrationArtifacts: null, xtensionBindings: null };
  }
}
function compileRmtClassicAst(ast, options = {}) {
  assertContractVersion(options);
  if (Object.hasOwn(options, 'xtensionBindings')) throw new TypeError('Use compileRmtClassicAstWithBindings() for an AST with a binding sidecar.');
  return legacy.compileRmtVNextAst(ast, options);
}
function compileRmtClassicAstWithBindings(ast, bindings, options = {}) {
  const { xtensionBindings: ignored, ...astOptions } = options;
  const coreDocument = compileRmtClassicAst(ast, astOptions);
  const orchestrationArtifacts = legacy.createRmtAppOrchestrationArtifacts(coreDocument);
  return { coreDocument, coreJson: legacy.serializeRmtVNextCore(coreDocument), orchestrationArtifacts,
    xtensionBindings: validateStateBindingArtifact(bindings, orchestrationArtifacts) };
}
function createRmtClassicCompiler(options = {}) {
  assertContractVersion(options);
  return Object.freeze({ ...legacy.createRmtVNextCompiler(options), name: 'RMT Classic', apiVersion: RMT_CLASSIC_COMPILER_API_VERSION,
    schema: RMT_CLASSIC_COMPILE_RESULT_SCHEMA, contract: RMT_CLASSIC_COMPILER_CONTRACT,
    compileSource: (input, overrides = {}) => compileRmtClassicSource(input, { ...options, ...overrides }),
    compileAst: (ast, overrides = {}) => compileRmtClassicAst(ast, { ...options, ...overrides }),
    compileAstWithBindings: (ast, bindings, overrides = {}) => compileRmtClassicAstWithBindings(ast, bindings, { ...options, ...overrides }) });
}

module.exports = {
  RMT_CLASSIC_COMPILER_API_VERSION, RMT_CLASSIC_COMPILE_RESULT_SCHEMA,
  validateStateBindingArtifact,
  RMT_CLASSIC_COMPILER_CONTRACT, getRmtClassicAstSchema, validateRmtClassicAst, createRmtClassicCompiler,
  isRmtClassicAst: ast => validateRmtClassicAst(ast).length === 0,
  compileRmtClassicSource, compileRmtClassicAst, compileRmtClassicAstWithBindings,
  serializeRmtClassicCore: legacy.serializeRmtVNextCore
};
