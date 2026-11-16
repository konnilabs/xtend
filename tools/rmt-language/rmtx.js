'use strict';
// Authoring bindings are recognized statically. They are not a JSX runtime.
function compileRequired() { throw new TypeError('RMTX authoring operators must be compiled with compileRmtxSource().'); }
const RMT = Object.freeze(Object.fromEntries(['Program', 'State', 'Action', 'Input', 'Reduce', 'Portal', 'Surface', 'Lane', 'Mount'].map(name => [name, compileRequired])));
module.exports = Object.freeze({ RMT, model: Object.freeze({}), input: Object.freeze({}) });
