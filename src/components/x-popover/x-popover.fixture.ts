export const xPopoverFixture = {
  tag: 'x-popover',
  id: 'component-popover',
  attributes: {
    placement: 'bottom',
    modal: true,
    label: 'Filter options'
  },
  slots: {
    trigger: 'Open filters',
    default: 'Filter content',
    actions: 'Apply'
  },
  expectedEvents: ['popover-opened', 'popover-closed'],
  stateKeys: ['xpopover-open-component-popover']
} as const;

export type XPopoverFixture = typeof xPopoverFixture;
