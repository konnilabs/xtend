'use strict';

const { data } = require('../xtensions/state-binding-contract');
function sameData(left, right) {
  if (Object.is(left, right)) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object' || Array.isArray(left) !== Array.isArray(right)) return false;
  const keys = Object.keys(left), other = Object.keys(right);
  return keys.length === other.length && keys.every(key => Object.hasOwn(right, key) && sameData(left[key], right[key]));
}

/** Project source declarations into the existing binding validator's input.
 * This does not materialize keys, evaluate presence or grant provider authority.
 */
function projectRmtxHostScopes(contract, input) {
  if (!contract?.hosts?.length) return input;
  function invalid(message, host) {
    const diagnostic = { code: 'rmtx.host-scope.binding', severity: 'error', message,
      ...(host?.range ? { range: host.range } : {}) };
    throw Object.assign(new TypeError(message), { diagnostics: [diagnostic] });
  }
  try { data(input); } catch (error) { invalid(error.message, contract.hosts[0]); }
  if (input?.schema !== 'xtend.xtensions.state-binding-artifact.v3' || !Array.isArray(input.bindings))
    invalid('RMTX host scopes require an explicit XTension binding artifact v3.', contract.hosts[0]);
  const declared = new Map();
  for (const host of contract.hosts) {
    if (declared.has(host.surface)) invalid('Host scope surfaces must have unique declarations.', host);
    declared.set(host.surface, host);
    if (input.bindings.filter(entry => entry.surface === host.surface).length !== 1)
      invalid(`Host scope ${host.surface} requires exactly one matching XTension binding.`, host);
  }
  return { ...input, bindings: input.bindings.map(entry => {
    const host = declared.get(entry.surface);
    if (!host) return entry;
    const projected = { ...entry };
    for (const field of ['repeat', 'presence']) {
      if (Object.hasOwn(entry, field) && !sameData(entry[field], host[field]))
        invalid(`Sidecar ${field} conflicts with the RMTX host scope for ${host.surface}.`, host);
      if (Object.hasOwn(host, field)) projected[field] = host[field];
    }
    return projected;
  }) };
}

module.exports = { projectRmtxHostScopes };
