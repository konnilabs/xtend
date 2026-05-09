export const xDrawerFixture = {
  tag: 'x-drawer',
  id: 'component-drawer',
  attributes: {
    placement: 'left',
    modal: true,
    label: 'App navigation',
    routeAware: true
  },
  slots: {
    trigger: 'Open navigation',
    header: 'Navigation',
    default: 'Route links',
    footer: 'Signed in'
  },
  expectedEvents: ['drawer-opened', 'drawer-closed', 'drawer-route-selected'],
  stateKeys: ['xdrawer-open-component-drawer']
} as const;

export type XDrawerFixture = typeof xDrawerFixture;
