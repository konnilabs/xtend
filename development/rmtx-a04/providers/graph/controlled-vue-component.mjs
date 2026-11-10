import { formatValue } from './format.mjs';
export function createComponent({ Vue }) {
  globalThis.__XTendA043Observe?.();
  return { props: ['query', 'activeId', 'xtension'], setup(props) {
    return () => Vue.h('label', null, [
      Vue.h('input', { value: props.query, onInput(event) { props.xtension.emit({ type: 'change', payload: { filter: { query: event.currentTarget.value, selection: { activeId: props.activeId } } } }); } }),
      Vue.h('output', null, formatValue(props.query, props.activeId))
    ]);
  } };
}
