export const xTooltipFixture = {
  tag: 'x-tooltip',
  id: 'component-tooltip',
  attributes: {
    for: 'tooltip-anchor',
    placement: 'top',
    delay: '20',
    label: 'Tooltip help'
  },
  slots: {
    default: 'Explains the scheduled action.'
  },
  expectedEvents: ['tooltip-opened', 'tooltip-closed'],
  stateKeys: ['xtooltip-open-component-tooltip']
} as const;

export type XTooltipFixture = typeof xTooltipFixture;
