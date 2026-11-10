import { formatValue } from './format.mjs';
export function createComponent({ React }) {
  globalThis.__XTendA043Observe?.();
  return function FilterPanel({ query, activeId, xtension }) {
    return React.createElement('label', null,
      React.createElement('input', { value: query, onInput(event) { xtension.emit({ type: 'change', payload: { filter: { query: event.currentTarget.value, selection: { activeId } } } }); } }),
      React.createElement('output', null, formatValue(query, activeId)));
  };
}
