import { formatValue } from './format.mjs';
export function createComponent({ Vue }) {
  globalThis.__XTendA043Observe?.();
  return { props: ['query', 'activeId', 'xtension'], setup(props) {
    return () => Vue.h('label', null, [
      Vue.h('input', { value: props.query, onInput(event) { props.xtension.emit({ type: 'change', payload: { query: event.currentTarget.value } }); } }),
      Vue.h('output', null, formatValue(props.query, props.activeId))
    ]);
  } };
}
