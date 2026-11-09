'use strict';
// The data adapter returns a pure Action result; only the declared reducer writes Model.
function repeatedBindings() {
  const path = [{ repeat: 0 }, 'filters', { repeat: 1 }];
  return { schema: 'xtend.xtensions.state-binding-artifact.v3', documentId: 'repeated-filter-example', bindings: [{
    surface: 'filter', repeat: [{ state: 'groups', path: ['items'], key: ['id'] }, { path: ['filters'], key: ['id'] }],
    presence: { state: 'groups', path: ['items', ...path, 'enabled'] },
    binding: { schema: 'xtend.xtensions.state-binding.v2',
      address: { documentId: 'repeated-filter-example', declarationId: 'filter-panel', keys: [] },
      props: {
        query: { state: 'groups', path: ['items', ...path, 'query'], type: 'string' },
        activeId: { state: 'groups', path: ['items', ...path, 'selection', 'activeId'], type: 'string', nullable: true }
      },
      intents: { change: { command: 'filters.update', payloadSchema: 'repeated-filter-example.change.v1',
        fields: { query: { type: 'string' } }, keyFields: { groupId: { index: 0, type: 'json' }, filterId: { index: 1, type: 'json' } } } }
    }
  }] };
}
function createRepeatedFilterPanel(React) {
  return function RepeatedFilterPanel({ query, activeId, xtension }) {
    return React.createElement('label', null,
      React.createElement('input', { value: query, onInput(event) { xtension.emit({ type: 'change', payload: { query: event.currentTarget.value } }); } }),
      React.createElement('output', null, `${query}:${activeId ?? '-'}`));
  };
}
function createRepeatedDataSourceAdapter() {
  return { async fetch(endpoint, { payload, context }) {
    if (endpoint !== '/filters/update') throw new Error('Unknown reference data source.');
    const groups = JSON.parse(JSON.stringify(context.stateRuntime.getState('groups')));
    const group = groups.items.find((item) => item.id === payload.groupId);
    const filter = group?.filters.find((item) => item.id === payload.filterId);
    if (!filter) throw new Error('Addressed Model item is absent.');
    filter.query = payload.query;
    return { record: { groups } };
  } };
}
module.exports = { repeatedBindings, createRepeatedFilterPanel, createRepeatedDataSourceAdapter };
