'use strict';
// Authoring bindings are interpreted statically. They are not a JSX runtime.
const { getRmtxOperatorProfile } = require('./rmtx-operator-profiles');
const RMTX_AUTHORING_API_VERSION = '5.0.0';
function compileRequired() { throw new TypeError('RMTX authoring operators and helpers must be compiled with compileRmtxSource().'); }
const RMT = Object.freeze(Object.fromEntries(Object.keys(getRmtxOperatorProfile('5.0.0').operators).map(name => [name, compileRequired])));
module.exports = Object.freeze({
  RMTX_AUTHORING_API_VERSION, RMT,
  model: Object.freeze({}), input: Object.freeze({}), selectors: Object.freeze({}), item: Object.freeze({}), params: Object.freeze({}),
  result: Object.freeze({}), error: Object.freeze({}), payload: Object.freeze({}),
  contains: compileRequired
});
