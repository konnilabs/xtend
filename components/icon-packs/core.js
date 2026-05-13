const XTEND_CORE_ICON_PACK_SCHEMA = 'xtend.icon-pack.core.v1';

function path(d, attrs = {}) {
  return { tag: 'path', attrs: { d, ...attrs } };
}

function line(x1, y1, x2, y2, attrs = {}) {
  return { tag: 'line', attrs: { x1, y1, x2, y2, ...attrs } };
}

function circle(cx, cy, r, attrs = {}) {
  return { tag: 'circle', attrs: { cx, cy, r, ...attrs } };
}

function rect(x, y, width, height, attrs = {}) {
  return { tag: 'rect', attrs: { x, y, width, height, ...attrs } };
}

const icons = Object.freeze({
  close: {
    aliases: ['x', 'cancel', 'dismiss'],
    nodes: [line(18, 6, 6, 18), line(6, 6, 18, 18)]
  },
  menu: {
    aliases: ['hamburger', 'nav'],
    nodes: [line(4, 6, 20, 6), line(4, 12, 20, 12), line(4, 18, 20, 18)]
  },
  search: {
    aliases: ['magnifier', 'find'],
    nodes: [circle(11, 11, 7), line(16.5, 16.5, 21, 21)]
  },
  home: {
    aliases: ['start'],
    nodes: [
      path('M3 11.5 12 4l9 7.5'),
      path('M5 10.5V20h5v-5h4v5h5v-9.5')
    ]
  },
  settings: {
    aliases: ['gear'],
    nodes: [
      circle(12, 12, 3),
      path('M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-2.8-2.8.1-.1A1.7 1.7 0 0 0 4.6 15 1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L7.1 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3h4a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.8 2.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1H21v4h-.1a1.7 1.7 0 0 0-1.5 1Z')
    ]
  },
  'chevron-down': {
    aliases: ['expand', 'down'],
    nodes: [path('m6 9 6 6 6-6')]
  },
  'chevron-up': {
    aliases: ['collapse-up', 'up'],
    nodes: [path('m18 15-6-6-6 6')]
  },
  'chevron-left': {
    aliases: ['previous', 'left', 'collapse'],
    nodes: [path('m15 18-6-6 6-6')]
  },
  'chevron-right': {
    aliases: ['next', 'right'],
    nodes: [path('m9 18 6-6-6-6')]
  },
  pin: {
    aliases: ['dock', 'pinned'],
    nodes: [path('M15 4 20 9l-4 4v5l-1 1-4-4-5 5-2-2 5-5-4-4 1-1h5Z')]
  },
  minus: {
    aliases: ['minimize', 'remove'],
    nodes: [line(5, 12, 19, 12)]
  },
  maximize: {
    aliases: ['restore', 'window'],
    nodes: [rect(5, 5, 14, 14, { rx: 2 }), path('M9 9h6v6H9Z')]
  },
  sun: {
    aliases: ['light', 'bright'],
    nodes: [
      circle(12, 12, 4),
      line(12, 2, 12, 5),
      line(12, 19, 12, 22),
      line(4.9, 4.9, 7, 7),
      line(17, 17, 19.1, 19.1),
      line(2, 12, 5, 12),
      line(19, 12, 22, 12),
      line(4.9, 19.1, 7, 17),
      line(17, 7, 19.1, 4.9)
    ]
  },
  moon: {
    aliases: ['dark'],
    nodes: [path('M20.5 14.5A8 8 0 1 1 9.5 3.5 6.5 6.5 0 0 0 20.5 14.5Z')]
  },
  info: {
    aliases: ['help'],
    nodes: [circle(12, 12, 9), line(12, 10, 12, 16), line(12, 7, 12.01, 7)]
  },
  success: {
    aliases: ['check', 'ok', 'done'],
    nodes: [circle(12, 12, 9), path('m8 12 2.7 2.7L16.5 9')]
  },
  warning: {
    aliases: ['alert', 'caution'],
    nodes: [path('M12 3 2.8 20h18.4L12 3Z'), line(12, 9, 12, 14), line(12, 17, 12.01, 17)]
  },
  error: {
    aliases: ['danger'],
    nodes: [circle(12, 12, 9), line(15, 9, 9, 15), line(9, 9, 15, 15)]
  },
  copy: {
    aliases: ['duplicate'],
    nodes: [rect(9, 9, 11, 11, { rx: 2 }), rect(4, 4, 11, 11, { rx: 2 })]
  },
  download: {
    aliases: ['save'],
    nodes: [path('M12 3v12'), path('m7 10 5 5 5-5'), path('M5 21h14')]
  },
  docs: {
    aliases: ['document', 'file-text'],
    nodes: [path('M6 3h8l4 4v14H6Z'), path('M14 3v5h5'), line(9, 13, 15, 13), line(9, 17, 15, 17)]
  },
  component: {
    aliases: ['widget'],
    nodes: [rect(4, 4, 7, 7, { rx: 1.4 }), rect(13, 4, 7, 7, { rx: 1.4 }), rect(4, 13, 7, 7, { rx: 1.4 }), rect(13, 13, 7, 7, { rx: 1.4 })]
  },
  route: {
    aliases: ['routing'],
    nodes: [circle(6, 6, 2), circle(18, 18, 2), path('M8 6h4a4 4 0 0 1 0 8h-1a4 4 0 0 0 0 8h1')]
  },
  shield: {
    aliases: ['security'],
    nodes: [path('M12 3 20 6v6c0 4.5-3.1 7.3-8 9-4.9-1.7-8-4.5-8-9V6Z'), path('m8.8 12 2.1 2.1 4.5-4.8')]
  },
  package: {
    aliases: ['release', 'box'],
    nodes: [path('M12 3 21 8l-9 5-9-5Z'), path('M3 8v8l9 5 9-5V8'), path('M12 13v8')]
  }
});

export function createXTendCoreIconPack(overrides = {}) {
  return {
    schema: XTEND_CORE_ICON_PACK_SCHEMA,
    id: 'core',
    label: 'XTend Core Icons',
    source: 'xtend.local.inline-svg',
    distribution: 'bundled',
    cdnAllowed: false,
    viewBox: '0 0 24 24',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    icons: { ...icons, ...(overrides.icons || {}) }
  };
}

export const XTEND_CORE_ICON_PACK = Object.freeze(createXTendCoreIconPack());
export { XTEND_CORE_ICON_PACK_SCHEMA };
