'use strict';
const legacy = require('./vnext-compiler');
const { RMT_CLASSIC_COMPILER_CONTRACT, getRmtClassicAstSchema, validateRmtClassicAst } = require('./classic-ast-contract');

function assertContractVersion(options) {
  if (options.contractVersion !== undefined && options.contractVersion !== RMT_CLASSIC_COMPILER_CONTRACT.version) {
    throw Object.assign(new TypeError(`Unsupported RMT Classic compiler contract ${options.contractVersion}.`), {
      code: 'rmt.classic.contract.unsupported', expected: RMT_CLASSIC_COMPILER_CONTRACT.version, received: options.contractVersion
    });
  }
}
function compileRmtClassicSource(input = {}, options = {}) {
  assertContractVersion(options);
  return legacy.compileRmtVNextSource(input, options);
}
function compileRmtClassicAst(ast, options = {}) {
  assertContractVersion(options);
  return legacy.compileRmtVNextAst(ast, options);
}
function createRmtClassicCompiler(options = {}) {
  assertContractVersion(options);
  return Object.freeze({ ...legacy.createRmtVNextCompiler(options), name: 'RMT Classic', contract: RMT_CLASSIC_COMPILER_CONTRACT,
    compileSource: (input, overrides = {}) => compileRmtClassicSource(input, { ...options, ...overrides }),
    compileAst: (ast, overrides = {}) => compileRmtClassicAst(ast, { ...options, ...overrides }) });
}

module.exports = {
  RMT_CLASSIC_COMPILER_CONTRACT, getRmtClassicAstSchema, validateRmtClassicAst, createRmtClassicCompiler,
  isRmtClassicAst: ast => validateRmtClassicAst(ast).length === 0,
  compileRmtClassicSource, compileRmtClassicAst,
  serializeRmtClassicCore: legacy.serializeRmtVNextCore
};
