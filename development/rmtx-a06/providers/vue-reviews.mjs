/** @param {{Vue: {h: (...args: any[]) => any}, componentInterface: import('../../../tools/xtensions/component-interface.js').ComponentInterface}} peers */
export function createComponent({ Vue, componentInterface }) {
  return { inheritAttrs: false, props: [...Object.keys(componentInterface.props), 'xtension'],
    /** @param {import('../two-host.types.js').ProductReviewsProps} props */
    setup(props) {
    return () => Vue.h('label', null, ['Sort ' + props.productId + ' ',
      Vue.h('select', { 'aria-label': 'Sort', value: props.sort,
        /** @param {{currentTarget: HTMLSelectElement}} event */
        onChange(event) { return props.xtension.emit({ type: 'changeSort', payload: { order: event.currentTarget.value } }); } },
      ['recent', 'rating'].map(value => Vue.h('option', { value, key: value }, value))),
      Vue.h('output', null, props.sort)]);
  } };
}
