const XTEND_LUCIDE_ICON_PACK_SCHEMA = 'xtend.icon-pack.lucide-local-adapter.v1';

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
  accessibility: {
    aliases: ['a11y', 'screenreader'],
    nodes: [circle(12, 4, 2), path('M6 8h12'), path('M12 6v8'), path('m8 21 4-7 4 7'), path('M8 14h8')]
  },
  'arrow-left': {
    aliases: ['back'],
    nodes: [path('m12 19-7-7 7-7'), path('M19 12H5')]
  },
  'arrow-right': {
    aliases: ['forward'],
    nodes: [path('m12 5 7 7-7 7'), path('M5 12h14')]
  },
  'book-open': {
    aliases: ['guide', 'manual'],
    nodes: [path('M2 5.5A3.5 3.5 0 0 1 5.5 2H12v18H5.5A3.5 3.5 0 0 0 2 23Z'), path('M22 5.5A3.5 3.5 0 0 0 18.5 2H12v18h6.5A3.5 3.5 0 0 1 22 23Z')]
  },
  boxes: {
    aliases: ['components', 'catalog'],
    nodes: [rect(3, 3, 7, 7, { rx: 1.5 }), rect(14, 3, 7, 7, { rx: 1.5 }), rect(3, 14, 7, 7, { rx: 1.5 }), rect(14, 14, 7, 7, { rx: 1.5 })]
  },
  code: {
    aliases: ['source'],
    nodes: [path('m8 9-4 3 4 3'), path('m16 9 4 3-4 3'), path('m14 5-4 14')]
  },
  database: {
    aliases: ['state'],
    nodes: [path('M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Z'), path('M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6'), path('M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6')]
  },
  download: {
    aliases: ['save'],
    nodes: [path('M12 3v12'), path('m7 10 5 5 5-5'), path('M5 21h14')]
  },
  'external-link': {
    aliases: ['open'],
    nodes: [path('M15 3h6v6'), path('M10 14 21 3'), path('M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5')]
  },
  file: {
    aliases: ['document'],
    nodes: [path('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z'), path('M14 2v6h6')]
  },
  folder: {
    aliases: ['directory'],
    nodes: [path('M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z')]
  },
  gauge: {
    aliases: ['performance', 'speed'],
    nodes: [path('M4 14a8 8 0 1 1 16 0'), path('M12 14l4-4'), path('M6.3 18h11.4')]
  },
  globe: {
    aliases: ['language', 'locale', 'i18n'],
    nodes: [circle(12, 12, 10), path('M2 12h20'), path('M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z')]
  },
  layers: {
    aliases: ['platform'],
    nodes: [path('M12 3 3 8l9 5 9-5Z'), path('m3 13 9 5 9-5'), path('m3 18 9 5 9-5')]
  },
  moon: {
    aliases: ['dark'],
    nodes: [path('M20.5 14.5A8 8 0 1 1 9.5 3.5 6.5 6.5 0 0 0 20.5 14.5Z')]
  },
  palette: {
    aliases: ['theme', 'design'],
    nodes: [path('M12 3a9 9 0 0 0 0 18h1.5a1.5 1.5 0 0 0 .5-2.9 1.5 1.5 0 0 1 .5-2.9H16a5 5 0 0 0 0-10Z'), circle(7.5, 10, 1), circle(10, 7.5, 1), circle(14, 7.5, 1), circle(16.5, 10, 1)]
  },
  rocket: {
    aliases: ['launch', 'release-candidate'],
    nodes: [path('M4.5 16.5 3 21l4.5-1.5'), path('M8 16 4 12l7-7c2.6-2.6 6.1-2.9 9-2-.9 2.9-.6 6.4-3.2 9L10 19Z'), path('m9 15-4-4'), circle(15, 9, 1.5)]
  },
  server: {
    aliases: ['infra', 'host'],
    nodes: [rect(3, 4, 18, 6, { rx: 2 }), rect(3, 14, 18, 6, { rx: 2 }), line(7, 7, 7.01, 7), line(7, 17, 7.01, 17)]
  },
  'shield-check': {
    aliases: ['secure', 'security'],
    nodes: [path('M12 3 20 6v6c0 4.5-3.1 7.3-8 9-4.9-1.7-8-4.5-8-9V6Z'), path('m8.8 12 2.1 2.1 4.5-4.8')]
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
  terminal: {
    aliases: ['cli'],
    nodes: [path('m7 8 4 4-4 4'), path('M13 16h4'), rect(3, 4, 18, 16, { rx: 2 })]
  },
  upload: {
    aliases: ['import'],
    nodes: [path('M12 21V9'), path('m7 14 5-5 5 5'), path('M5 3h14')]
  },
  zap: {
    aliases: ['fabric', 'telemetry'],
    nodes: [path('M13 2 3 14h8l-1 8 11-14h-8Z')]
  }
});

export function createXTendLucideIconPack(overrides = {}) {
  return {
    schema: XTEND_LUCIDE_ICON_PACK_SCHEMA,
    id: 'lucide',
    label: 'Lucide Local Adapter',
    source: 'xtend.local.lucide-compatible-svg-paths',
    distribution: 'local-build',
    cdnAllowed: false,
    viewBox: '0 0 24 24',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    icons: { ...icons, ...(overrides.icons || {}) }
  };
}

export const XTEND_LUCIDE_ICON_PACK = Object.freeze(createXTendLucideIconPack());
export { XTEND_LUCIDE_ICON_PACK_SCHEMA };
