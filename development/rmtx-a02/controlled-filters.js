'use strict';

// Executable A02.1 reference: real React, existing RMT Model, existing XTend State.
// The binding declaration is runtime data; this does not propose RMTX source syntax.
const { XTENSION_STATE_BINDING_SCHEMA } = require('../../tools/xtensions/state-binding');
const filterRule = { type: 'object', fields: {
  query: { type: 'string' },
  selection: { type: 'object', fields: { activeId: { type: 'string', nullable: true } } }
} };
function filterBinding(itemKey) {
  return {
    schema: XTENSION_STATE_BINDING_SCHEMA,
    address: { documentId: 'filter-example', declarationId: 'filter-panel', keys: [itemKey] },
    props: {
      query: { state: `filter.${itemKey}`, path: ['query'], type: 'string' },
      activeId: { state: `filter.${itemKey}`, path: ['selection', 'activeId'], type: 'string', nullable: true }
    },
    intents: { change: { command: `filter.${itemKey}.replace`, payloadSchema: 'xtend.schemas.xtension.intent.v1', fields: { filter: filterRule } } }
  };
}
function filterModelOptions() {
  return {
    states: ['left', 'right'].map((key) => ({ id: `filter.${key}`, projectionKey: `filter_${key}`, type: 'object',
      initial: { query: key, selection: { activeId: null } } })),
    reducers: ['left', 'right'].map((key) => ({ id: `filter.${key}.replace`, state: `filter.${key}`, set: '$payload.filter' }))
  };
}
function createFilterPanel(React) {
  return function FilterPanel({ query, activeId, xtension }) {
    return React.createElement('label', null,
      React.createElement('input', { value: query, onInput: (event) => xtension.emit({ type: 'change', payload: {
        filter: { query: event.currentTarget.value, selection: { activeId } }
      } }) }),
      React.createElement('output', null, `${query}:${activeId ?? '-'}`));
  };
}
module.exports = { filterBinding, filterModelOptions, createFilterPanel };
