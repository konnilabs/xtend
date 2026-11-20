'use strict';
// Private, one-use parser handoff. JSON/options supplied by clients cannot add
// declarations to the retained standalone RMTX grammar.
const contexts = new WeakMap();
function bindProjectDeclarations(options, input, declarations) {
  contexts.set(options, { text: input.text, filePath: input.filePath, declarations });
  return options;
}
function consumeProjectDeclarations(options, input) {
  const context = contexts.get(options);
  contexts.delete(options);
  if (!context) return [];
  if (context.text !== input.text || context.filePath !== input.filePath) throw new TypeError('Stale project parser context.');
  return context.declarations;
}
module.exports = { bindProjectDeclarations, consumeProjectDeclarations };
