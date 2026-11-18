'use strict';

const RMTX_SELECTOR_DEPENDENCIES_SCHEMA = 'xtend.rmtx.selector-dependencies.v1';
const RMTX_SELECTOR_DEPENDENCIES_SCHEMA_V2 = 'xtend.rmtx.selector-dependencies.v2';
const RMTX_SELECTOR_DEPENDENCIES_SCHEMA_V3 = 'xtend.rmtx.selector-dependencies.v3';
const RMTX_SELECTOR_DEPENDENCIES_SCHEMA_V4 = 'xtend.rmtx.selector-dependencies.v4';
const UNSAFE = new Set(['__proto__', 'prototype', 'constructor']);
const OPERAND_FIELDS = Object.freeze({
  equals: ['left', 'right'], 'not-equals': ['left', 'right'],
  gt: ['left', 'right'], gte: ['left', 'right'], lt: ['left', 'right'], lte: ['left', 'right'],
  not: ['value'], if: ['test', 'then', 'else'], contains: ['value', 'search']
});
function invalid(message) {
  throw Object.assign(new TypeError(message), { code: 'rmtx.selector-dependencies.invalid' });
}
function segments(value) {
  if (value === '') return [];
  const parts = value.split('.');
  if (parts.some(part => !part || UNSAFE.has(part))) invalid('Expected a safe canonical dependency path.');
  return parts;
}
function readKey(read) { return JSON.stringify([read.symbol, read.path]); }
function orderedReads(values) {
  const seen = new Map();
  for (const read of values) seen.set(readKey(read), read);
  return [...seen.values()].sort((a, b) => {
    const left = readKey(a), right = readKey(b);
    return left < right ? -1 : left > right ? 1 : 0;
  });
}
function orderedPaths(values) {
  return [...new Set(values.map(value => JSON.stringify(value)))].sort().map(value => JSON.parse(value));
}
function freeze(value, seen = new Set()) {
  if (value && typeof value === 'object' && !seen.has(value)) {
    seen.add(value); Object.values(value).forEach(item => freeze(item, seen)); Object.freeze(value);
  }
  return value;
}

/**
 * Summarizes already validated compilation facts. This report is not an input
 * validator, a subscription plan, or authority to read/mutate a runtime Model.
 */
function createRmtxSelectorDependencyReport(result) {
  const profile = result && (result.sourceProfile || result.parserResult?.sourceProfile);
  const compiledPlan = result?.orchestrationArtifacts?.state?.selectors;
  // An empty declaration-only program has no orchestration artifact at all.
  const plan = result?.orchestrationArtifacts === null && Array.isArray(result?.coreDocument?.selectors)
    && result.coreDocument.selectors.length === 0 ? [] : compiledPlan;
  const references = result?.primitiveSemanticGraph?.references?.records;
  if (result?.ok !== true || profile?.syntax !== 'rmtx' || !['2.0.0', '3.0.0', '4.0.0', '5.0.0'].includes(profile.version)
      || result.coreDocument?.manifest?.sourceSyntax !== 'rmtx' || !Array.isArray(plan) || !Array.isArray(references)) {
    invalid('A successful RMTX 2.0.0 or 3.0.0 compilation with semantic facts and a compiled selector plan is required.');
  }
  // Resolve each selector's owner candidates once. Shared predicates commonly
  // have many paths into the same symbol; repeated graph scans would add an
  // avoidable quadratic pass to otherwise small dependency summaries.
  const ownersBySelector = new Map();
  for (const reference of references) {
    if (reference.sourceDomain !== 'selectors' || reference.resolved !== true
        || !['states', 'selectors'].includes(reference.targetDomain)) continue;
    if (typeof reference.targetId !== 'string') invalid('Expected a resolved semantic symbol.');
    if (!ownersBySelector.has(reference.sourceId)) ownersBySelector.set(reference.sourceId, {
      states: new Set(), selectors: new Set(), sources: new Set()
    });
    const owners = ownersBySelector.get(reference.sourceId);
    owners[reference.targetDomain].add(reference.targetId);
    if (reference.relationship === 'selector.source') owners.sources.add(`${reference.targetDomain}:${reference.targetId}`);
  }
  const entries = [], complete = new Map(), ids = new Set();
  for (const selector of plan) {
    if (!selector || typeof selector.id !== 'string' || ids.has(selector.id) || !Array.isArray(selector.clauses)) invalid('Expected unique compiled selectors.');
    ids.add(selector.id);
    const owners = ownersBySelector.get(selector.id);
    const candidates = Object.fromEntries(['states', 'selectors'].map(domain => [domain,
      [...(owners?.[domain] || [])].sort((left, right) => right.length - left.length)]));
    const stateReads = [], selectorReads = [], rowPaths = [], parameterPaths = [];
    function canonicalRead(reference, source = false) {
      if (typeof reference !== 'string') invalid('Expected a compiled dependency reference.');
      const kind = reference.startsWith('state.') ? 'state' : reference.startsWith('selector.') ? 'selector' : null;
      if (!kind) invalid('Unexpected compiled dependency namespace.');
      const domain = kind === 'state' ? 'states' : 'selectors';
      // Owners come only from successful semantic resolution, including its
      // longest declared symbol-prefix rule. Do not infer owners from one dot.
      const owner = candidates[domain].find(symbol => (!source || owners.sources.has(`${domain}:${symbol}`))
        && (reference === `${kind}.${symbol}` || reference.startsWith(`${kind}.${symbol}.`)));
      if (!owner || source && reference !== `${kind}.${owner}`) invalid(`Missing validated dependency fact for ${reference}.`);
      const suffix = reference.slice(kind.length + owner.length + 1);
      const path = suffix ? segments(suffix.slice(1)) : [];
      segments(owner);
      const read = { symbol: owner, path, reference: `${kind}.${owner}${path.length ? '.' + path.join('.') : ''}` };
      (kind === 'state' ? stateReads : selectorReads).push(read);
      return { kind, symbol: owner };
    }
    function expression(value) {
      if (typeof value === 'string') {
        if (value === '$item' || value.startsWith('$item.')) rowPaths.push(segments(value === '$item' ? '' : value.slice(6)));
        else if (value === '$params' || value.startsWith('$params.')) parameterPaths.push(segments(value === '$params' ? '' : value.slice(8)));
        else canonicalRead(value);
        return;
      }
      if (!value || typeof value !== 'object' || Array.isArray(value)) invalid('Unexpected compiled selector operand.');
      if (value.op === 'literal') return; // Literal strings never create dependencies.
      const fields = OPERAND_FIELDS[value.op];
      if (!fields) invalid(`Unsupported compiled selector expression ${String(value.op)}.`);
      for (const field of fields) {
        if (!Object.hasOwn(value, field)) invalid(`Missing compiled selector operand ${field}.`);
        expression(value[field]);
      }
    }
    const source = canonicalRead(selector.from, true);
    for (const clause of selector.clauses) {
      if (clause.kind === 'where' || clause.kind === 'find') expression(clause.expression);
      else if (!['sort', 'output'].includes(clause.kind)) invalid('Unexpected compiled selector clause.');
    }
    if (selector.sort) rowPaths.push(segments(String(selector.sort.by || '')));
    const directSelectors = orderedReads(selectorReads);
    const inheritedStates = [];
    for (const read of directSelectors) {
      const dependency = complete.get(read.symbol);
      if (!dependency) invalid(`Selector ${read.symbol} must precede ${selector.id} in the validated plan.`);
      inheritedStates.push(...dependency.transitiveStateReads);
    }
    const directStates = orderedReads(stateReads);
    const entry = {
      id: selector.id, source, stateReads: directStates, selectorReads: directSelectors,
      transitiveStateReads: orderedReads([...directStates, ...inheritedStates]),
      rowPaths: orderedPaths(rowPaths), parameterPaths: orderedPaths(parameterPaths)
    };
    entries.push(entry); complete.set(selector.id, entry);
  }
  return freeze({
    schema: profile.version === '5.0.0' ? RMTX_SELECTOR_DEPENDENCIES_SCHEMA_V4 : profile.version === '4.0.0' ? RMTX_SELECTOR_DEPENDENCIES_SCHEMA_V3 : profile.version === '3.0.0' ? RMTX_SELECTOR_DEPENDENCIES_SCHEMA_V2 : RMTX_SELECTOR_DEPENDENCIES_SCHEMA,
    sourceProfile: { syntax: 'rmtx', version: profile.version },
    topologicalOrder: entries.map(entry => entry.id), selectors: entries,
    incrementalRecomputation: false, runtimeTracking: false, parametersForwardedToDependencies: false
  });
}

module.exports = { RMTX_SELECTOR_DEPENDENCIES_SCHEMA, RMTX_SELECTOR_DEPENDENCIES_SCHEMA_V2, RMTX_SELECTOR_DEPENDENCIES_SCHEMA_V3, RMTX_SELECTOR_DEPENDENCIES_SCHEMA_V4, createRmtxSelectorDependencyReport };
