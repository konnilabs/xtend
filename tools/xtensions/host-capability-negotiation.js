// SPDX-License-Identifier: Apache-2.0
'use strict';
const { data, fields, name, clone, freeze } = require('./state-binding-contract');

// Runtime implementation facts, never manifest/provider claims. New adapters
// must supply their own reviewed implementation profile before being admitted.
const implementations = new Set(['react', 'vue']);
const featureNames = ['kernel.lifecycle', 'fabric.boundary', 'props.controlled', 'work.named',
  'resources.cooperative', 'cancellation.cooperative', 'surface.lifecycle', 'work.bounded',
  'work.pressure-budgets', 'framework.internal-scheduling', 'execution.preemption', 'render.ssr', 'render.adoption'];
const categories = ['features', 'work', 'resources', 'events'];
function names(input, label, maximum = 64) {
  if (!Array.isArray(input) || input.length > maximum) throw new TypeError(`${label} requires a bounded array.`);
  input.forEach(name);
  if (new Set(input).size !== input.length) throw new TypeError(`${label} contains duplicate names.`);
  return [...input].sort();
}
function requests(input) {
  fields(input, categories, 'Capability requests');
  const result = Object.fromEntries(categories.map(key => [key, names(input[key] === undefined ? [] : input[key], key, key === 'work' ? 32 : 64)]));
  if (result.features.some(key => !featureNames.includes(key))) throw new TypeError('Unknown runtime capability requirement.');
  return result;
}
function createHostCapabilityNegotiation(input, { framework, kernelCapabilities, graph, budget, allowedResources, events, ssr }) {
  data(input); fields(input, ['schema', 'framework', 'required', 'optional'], 'Host capability requirements');
  if (input.schema !== 'xtend.xtensions.host-capability-requirements.v1') throw new TypeError('Host capability requirements v1 is required.');
  if (input.framework !== undefined && !['react', 'vue', 'angular', 'vanilla'].includes(input.framework)) throw new TypeError('Unknown required framework.');
  const required = requests(input.required), optional = requests(input.optional === undefined ? {} : input.optional);
  for (const category of categories) if (required[category].some(key => optional[category].includes(key))) throw new TypeError('Required and optional capabilities must be disjoint.');
  if (!implementations.has(framework) || kernelCapabilities?.schema !== 'xtend.xtensions.runtime-capabilities.v1' || kernelCapabilities.framework !== framework) throw new TypeError('A reviewed actual kernel runtime adapter is required.');
  data(allowedResources); data(events);
  const resources = names(allowedResources, 'Resource grants');
  fields(events, Object.keys(events), 'Event grants');
  const eventNames = names(Object.keys(events), 'Event grants');
  Object.values(events).forEach(name);
  const capabilities = freeze({ schema: ssr ? 'xtend.xtensions.runtime-capabilities.v3' : 'xtend.xtensions.runtime-capabilities.v2', framework,
    profile: budget ? 'budget' : graph ? 'graph' : 'kernel',
    features: {
      'kernel.lifecycle': true, 'fabric.boundary': true, 'props.controlled': true,
      'work.named': true, 'resources.cooperative': true, 'cancellation.cooperative': true,
      'surface.lifecycle': graph, 'work.bounded': budget, 'work.pressure-budgets': budget,
      'framework.internal-scheduling': false, 'execution.preemption': false, 'render.ssr': ssr === 'server', 'render.adoption': ssr === 'client'
    },
    grants: { work: [...kernelCapabilities.namedWork], resources, events: eventNames }
  });
  const missing = request => Object.fromEntries(categories.map(category => [category,
    request[category].filter(key => category === 'features' ? capabilities.features[key] !== true : !capabilities.grants[category].includes(key))]));
  const missingRequired = missing(required), missingOptional = missing(optional);
  const frameworkMatched = input.framework === undefined || input.framework === framework;
  const satisfied = request => categories.every(key => !request[key].length);
  const ok = frameworkMatched && satisfied(missingRequired), status = !ok ? 'blocked' : satisfied(missingOptional) ? 'matched' : 'degraded';
  const requirements = freeze({ schema: input.schema, ...(input.framework === undefined ? {} : { framework: input.framework }), required, optional });
  const report = freeze({ schema: ssr ? 'xtend.xtensions.host-capability-negotiation.v2' : 'xtend.xtensions.host-capability-negotiation.v1', stage: 'preflight', status, ok,
    framework, requiredFramework: input.framework ?? null, frameworkMatched,
    requirements, capabilities, missingRequired, missingOptional,
    // Negotiation does not load a runtime, prove a peer version, or grant more authority.
    runtimeExecutionVerified: false
  });
  return Object.freeze({ capabilities, report, snapshot: () => clone(report) });
}
module.exports = { createHostCapabilityNegotiation };
