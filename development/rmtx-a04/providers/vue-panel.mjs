export function createPanel({ Vue }) {
  return { props: ['query', 'activeId', 'xtension'], setup(props) {
    return () => Vue.h('label', null, [
      Vue.h('input', { value: props.query, onInput(event) { props.xtension.emit({ type: 'change', payload: { query: event.currentTarget.value } }); } }),
      Vue.h('output', null, `${props.query}:${props.activeId ?? '-'}`)
    ]);
  } };
}
