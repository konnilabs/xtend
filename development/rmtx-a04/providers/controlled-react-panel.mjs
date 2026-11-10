export function createPanel({ React }) {
  return function FilterPanel({ query, activeId, xtension }) {
    return React.createElement('label', null,
      React.createElement('input', { value: query, onInput(event) { xtension.emit({ type: 'change', payload: { filter: { query: event.currentTarget.value, selection: { activeId } } } }); } }),
      React.createElement('output', null, `${query}:${activeId ?? '-'}`));
  };
}
