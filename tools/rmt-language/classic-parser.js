'use strict';
const legacy = require('./vnext-parser');
const { validateRmtClassicAst } = require('./classic-ast-contract');
function parseRmtClassicSource(input = {}, options = {}) {
  const result = legacy.parseRmtVNextSource(input, options);
  if (!result.ok) return result;
  const diagnostics = validateRmtClassicAst(result.ast, { sourceModel: result.sourceModel });
  return diagnostics.length ? { ...result, ok: false, phase: 'ast', status: 'invalid_ast', diagnostics: result.diagnostics.concat(diagnostics) } : result;
}
function createRmtClassicParser(options = {}) {
  return Object.freeze({ ...legacy.createRmtVNextParser(options), name: 'RMT Classic',
    parseSource: (input, overrides = {}) => parseRmtClassicSource(input, { ...options, ...overrides }) });
}
module.exports = {
  parseRmtClassicSource, createRmtClassicParser,
  RMT_CLASSIC_AST_SCHEMA: legacy.RMT_VNEXT_AST_SCHEMA
};
