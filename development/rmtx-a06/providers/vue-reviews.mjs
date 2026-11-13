/** @param {{Vue: {h: (...args: any[]) => any}}} peers */
export function createComponent({ Vue }) {
  return { props: ['productId', 'sort', 'xtension'],
    /** @param {import('../two-host.types.js').ProductReviewsProps} props */
    setup(props) {
    return () => Vue.h('label', null, ['Sort ' + props.productId + ' ',
      Vue.h('select', { 'aria-label': 'Sort', value: props.sort,
        /** @param {{currentTarget: HTMLSelectElement}} event */
        onChange(event) { return props.xtension.emit({ type: 'changeSort', payload: { sort: event.currentTarget.value } }); } },
      ['recent', 'rating'].map(value => Vue.h('option', { value, key: value }, value))),
      Vue.h('output', null, props.sort)]);
  } };
}
