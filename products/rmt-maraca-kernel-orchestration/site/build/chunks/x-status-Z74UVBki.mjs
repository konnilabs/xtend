import { a as xstate } from './x-button-DGQY--Wj.mjs';

const XTEND_CORE_ICON_PACK_SCHEMA = 'xtend.icon-pack.core.v1';

function path$1(d, attrs = {}) {
  return { tag: 'path', attrs: { d, ...attrs } };
}

function line$1(x1, y1, x2, y2, attrs = {}) {
  return { tag: 'line', attrs: { x1, y1, x2, y2, ...attrs } };
}

function circle$1(cx, cy, r, attrs = {}) {
  return { tag: 'circle', attrs: { cx, cy, r, ...attrs } };
}

function rect$1(x, y, width, height, attrs = {}) {
  return { tag: 'rect', attrs: { x, y, width, height, ...attrs } };
}

const icons$1 = Object.freeze({
  close: {
    aliases: ['x', 'cancel', 'dismiss'],
    nodes: [line$1(18, 6, 6, 18), line$1(6, 6, 18, 18)]
  },
  menu: {
    aliases: ['hamburger', 'nav'],
    nodes: [line$1(4, 6, 20, 6), line$1(4, 12, 20, 12), line$1(4, 18, 20, 18)]
  },
  search: {
    aliases: ['magnifier', 'find'],
    nodes: [circle$1(11, 11, 7), line$1(16.5, 16.5, 21, 21)]
  },
  home: {
    aliases: ['start'],
    nodes: [
      path$1('M3 11.5 12 4l9 7.5'),
      path$1('M5 10.5V20h5v-5h4v5h5v-9.5')
    ]
  },
  settings: {
    aliases: ['gear'],
    nodes: [
      circle$1(12, 12, 3),
      path$1('M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-2.8-2.8.1-.1A1.7 1.7 0 0 0 4.6 15 1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L7.1 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3h4a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.8 2.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1H21v4h-.1a1.7 1.7 0 0 0-1.5 1Z')
    ]
  },
  'chevron-down': {
    aliases: ['expand', 'down'],
    nodes: [path$1('m6 9 6 6 6-6')]
  },
  'chevron-up': {
    aliases: ['collapse-up', 'up'],
    nodes: [path$1('m18 15-6-6-6 6')]
  },
  'chevron-left': {
    aliases: ['previous', 'left', 'collapse'],
    nodes: [path$1('m15 18-6-6 6-6')]
  },
  'chevron-right': {
    aliases: ['next', 'right'],
    nodes: [path$1('m9 18 6-6-6-6')]
  },
  pin: {
    aliases: ['dock', 'pinned'],
    nodes: [path$1('M15 4 20 9l-4 4v5l-1 1-4-4-5 5-2-2 5-5-4-4 1-1h5Z')]
  },
  minus: {
    aliases: ['minimize', 'remove'],
    nodes: [line$1(5, 12, 19, 12)]
  },
  maximize: {
    aliases: ['restore', 'window'],
    nodes: [rect$1(5, 5, 14, 14, { rx: 2 }), path$1('M9 9h6v6H9Z')]
  },
  sun: {
    aliases: ['light', 'bright'],
    nodes: [
      circle$1(12, 12, 4),
      line$1(12, 2, 12, 5),
      line$1(12, 19, 12, 22),
      line$1(4.9, 4.9, 7, 7),
      line$1(17, 17, 19.1, 19.1),
      line$1(2, 12, 5, 12),
      line$1(19, 12, 22, 12),
      line$1(4.9, 19.1, 7, 17),
      line$1(17, 7, 19.1, 4.9)
    ]
  },
  moon: {
    aliases: ['dark'],
    nodes: [path$1('M20.5 14.5A8 8 0 1 1 9.5 3.5 6.5 6.5 0 0 0 20.5 14.5Z')]
  },
  info: {
    aliases: ['help'],
    nodes: [circle$1(12, 12, 9), line$1(12, 10, 12, 16), line$1(12, 7, 12.01, 7)]
  },
  success: {
    aliases: ['check', 'ok', 'done'],
    nodes: [circle$1(12, 12, 9), path$1('m8 12 2.7 2.7L16.5 9')]
  },
  warning: {
    aliases: ['alert', 'caution'],
    nodes: [path$1('M12 3 2.8 20h18.4L12 3Z'), line$1(12, 9, 12, 14), line$1(12, 17, 12.01, 17)]
  },
  error: {
    aliases: ['danger'],
    nodes: [circle$1(12, 12, 9), line$1(15, 9, 9, 15), line$1(9, 9, 15, 15)]
  },
  copy: {
    aliases: ['duplicate'],
    nodes: [rect$1(9, 9, 11, 11, { rx: 2 }), rect$1(4, 4, 11, 11, { rx: 2 })]
  },
  download: {
    aliases: ['save'],
    nodes: [path$1('M12 3v12'), path$1('m7 10 5 5 5-5'), path$1('M5 21h14')]
  },
  docs: {
    aliases: ['document', 'file-text'],
    nodes: [path$1('M6 3h8l4 4v14H6Z'), path$1('M14 3v5h5'), line$1(9, 13, 15, 13), line$1(9, 17, 15, 17)]
  },
  component: {
    aliases: ['widget'],
    nodes: [rect$1(4, 4, 7, 7, { rx: 1.4 }), rect$1(13, 4, 7, 7, { rx: 1.4 }), rect$1(4, 13, 7, 7, { rx: 1.4 }), rect$1(13, 13, 7, 7, { rx: 1.4 })]
  },
  route: {
    aliases: ['routing'],
    nodes: [circle$1(6, 6, 2), circle$1(18, 18, 2), path$1('M8 6h4a4 4 0 0 1 0 8h-1a4 4 0 0 0 0 8h1')]
  },
  shield: {
    aliases: ['security'],
    nodes: [path$1('M12 3 20 6v6c0 4.5-3.1 7.3-8 9-4.9-1.7-8-4.5-8-9V6Z'), path$1('m8.8 12 2.1 2.1 4.5-4.8')]
  },
  package: {
    aliases: ['release', 'box'],
    nodes: [path$1('M12 3 21 8l-9 5-9-5Z'), path$1('M3 8v8l9 5 9-5V8'), path$1('M12 13v8')]
  }
});

function createXTendCoreIconPack(overrides = {}) {
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
    icons: { ...icons$1, ...(overrides.icons || {}) }
  };
}

const XTEND_CORE_ICON_PACK = Object.freeze(createXTendCoreIconPack());

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

function createXTendLucideIconPack(overrides = {}) {
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

const XTEND_LUCIDE_ICON_PACK = Object.freeze(createXTendLucideIconPack());

const X_ICON_REGISTRY_SCHEMA = 'xtend.icon.registry.v1';
const X_ICON_SOURCE_SCHEMA = 'xtend.icon.source.v1';
const X_ICON_STATE_SCHEMA = 'xtend.component.x-icon.state.v1';
const X_ICON_MISSING_SCHEMA = 'xtend.component.x-icon.missing.v1';
const X_ICON_READY_SCHEMA = 'xtend.component.x-icon.ready.v1';
const X_ICON_PERFORMANCE_PROFILE_SCHEMA = 'xtend.performance.component-profile.v1';
const SVG_NS = 'http://www.w3.org/2000/svg';
const SAFE_NODE_NAMES = new Set(['path', 'line', 'circle', 'rect', 'polyline', 'polygon', 'ellipse', 'g']);
const SAFE_ATTR_NAMES = new Set([
  'd',
  'x',
  'y',
  'x1',
  'x2',
  'y1',
  'y2',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'width',
  'height',
  'points',
  'fill',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'opacity',
  'fill-rule',
  'clip-rule',
  'transform'
]);

function getGlobalScope() {
  if (typeof window !== 'undefined') return window;
  if (typeof globalThis !== 'undefined') return globalThis;
  return {};
}

function normalizeName(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeIconNodes(record) {
  if (Array.isArray(record.nodes)) return record.nodes;
  if (Array.isArray(record.paths)) {
    return record.paths.map((entry) => {
      if (typeof entry === 'string') return { tag: 'path', attrs: { d: entry } };
      if (entry && typeof entry === 'object' && entry.d) {
        return { tag: 'path', attrs: { d: entry.d, ...(entry.attrs || {}) } };
      }
      return entry;
    });
  }
  if (record.path || record.d) {
    return [{ tag: 'path', attrs: { d: record.path || record.d } }];
  }
  return [];
}

function normalizeIconRecord(name, record, pack = {}) {
  const sourceName = normalizeName(name || (record && record.name));
  if (!sourceName) return null;

  if (typeof record === 'string') {
    const value = record.trim();
    return {
      schema: X_ICON_SOURCE_SCHEMA,
      name: sourceName,
      kind: value.startsWith('<svg') ? 'svg' : 'path',
      svg: value.startsWith('<svg') ? value : undefined,
      nodes: value.startsWith('<svg') ? [] : [{ tag: 'path', attrs: { d: value } }],
      viewBox: pack.viewBox || '0 0 24 24',
      aliases: []
    };
  }

  const value = record && typeof record === 'object' ? record : {};
  const src = value.src || value.url;
  return {
    schema: X_ICON_SOURCE_SCHEMA,
    name: sourceName,
    kind: src ? 'url' : (value.svg ? 'svg' : 'path'),
    aliases: Array.isArray(value.aliases) ? value.aliases.map(normalizeName).filter(Boolean) : [],
    nodes: normalizeIconNodes(value),
    svg: value.svg,
    src,
    viewBox: value.viewBox || pack.viewBox || '0 0 24 24',
    fill: value.fill,
    stroke: value.stroke,
    strokeLinecap: value.strokeLinecap || pack.strokeLinecap || 'round',
    strokeLinejoin: value.strokeLinejoin || pack.strokeLinejoin || 'round',
    metadata: value.metadata || {}
  };
}

function normalizeIconPack(pack) {
  const id = normalizeName(pack && pack.id);
  if (!id) throw new Error('XTend Icon Pack benoetigt eine id.');
  const iconEntries = pack.icons instanceof Map
    ? Array.from(pack.icons.entries())
    : Object.entries(pack.icons || {});
  const icons = new Map();
  const aliases = new Map();

  iconEntries.forEach(([name, record]) => {
    const normalized = normalizeIconRecord(name, record, pack);
    if (!normalized) return;
    icons.set(normalized.name, normalized);
    normalized.aliases.forEach((alias) => aliases.set(alias, normalized.name));
  });

  return {
    schema: pack.schema || 'xtend.icon-pack.custom.v1',
    id,
    label: pack.label || id,
    source: pack.source || 'custom',
    distribution: pack.distribution || 'runtime',
    cdnAllowed: pack.cdnAllowed === true,
    viewBox: pack.viewBox || '0 0 24 24',
    icons,
    aliases,
    metadata: pack.metadata || {}
  };
}

function createRegistry(seedPacks = []) {
  return {
    schema: X_ICON_REGISTRY_SCHEMA,
    packs: new Map(),
    order: [],
    defaultPack: 'core',
    register(pack, options = {}) {
      const normalized = normalizeIconPack(pack);
      this.packs.set(normalized.id, normalized);
      this.order = this.order.filter((id) => id !== normalized.id);
      if (options.prepend) this.order.unshift(normalized.id);
      else this.order.push(normalized.id);
      if (options.default || this.order.length === 1) this.defaultPack = normalized.id;
      return normalized;
    },
    resolve(name, options = {}) {
      const iconName = normalizeName(name);
      const requestedPack = normalizeName(options.pack || '');
      const packOrder = requestedPack
        ? [requestedPack]
        : Array.from(new Set([this.defaultPack, ...this.order]));

      for (const packId of packOrder) {
        const pack = this.packs.get(packId);
        if (!pack) continue;
        const resolvedName = pack.icons.has(iconName) ? iconName : pack.aliases.get(iconName);
        if (resolvedName && pack.icons.has(resolvedName)) {
          return {
            schema: X_ICON_SOURCE_SCHEMA,
            pack: pack.id,
            packLabel: pack.label,
            source: pack.source,
            distribution: pack.distribution,
            cdnAllowed: pack.cdnAllowed,
            record: pack.icons.get(resolvedName)
          };
        }
      }
      return null;
    },
    snapshot() {
      return {
        schema: X_ICON_REGISTRY_SCHEMA,
        defaultPack: this.defaultPack,
        packs: this.order.map((id) => {
          const pack = this.packs.get(id);
          return {
            id,
            label: pack.label,
            source: pack.source,
            distribution: pack.distribution,
            cdnAllowed: pack.cdnAllowed,
            iconCount: pack.icons.size,
            aliases: pack.aliases.size
          };
        })
      };
    }
  };
}

const globalScope = getGlobalScope();
const XTendIconRegistry = globalScope.__xtendIconRegistry || createRegistry();
globalScope.__xtendIconRegistry = XTendIconRegistry;

function registerIconPack(pack, options = {}) {
  const registered = XTendIconRegistry.register(pack, options);
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('icon-pack-registered', {
      detail: {
        schema: 'xtend.icon-pack.registered.v1',
        pack: registered.id,
        iconCount: registered.icons.size,
        cdnAllowed: registered.cdnAllowed
      }
    }));
  }
  return registered;
}

function resolveIcon(name, options = {}) {
  return XTendIconRegistry.resolve(name, options);
}

function getIconRegistrySnapshot() {
  return XTendIconRegistry.snapshot();
}

function installDefaultIconPacks() {
  if (!XTendIconRegistry.packs.has('core')) {
    registerIconPack(createXTendCoreIconPack(XTEND_CORE_ICON_PACK), { default: true });
  }
  if (!XTendIconRegistry.packs.has('lucide')) {
    registerIconPack(createXTendLucideIconPack(XTEND_LUCIDE_ICON_PACK));
  }
}

function isSafeIconUrl(value) {
  const url = String(value || '').trim();
  if (!url) return false;
  const lowered = url.replace(/[\u0000-\u001F\u007F\s]+/g, '').toLowerCase();
  if (lowered.startsWith('javascript:') || lowered.startsWith('vbscript:')) return false;
  if (lowered.startsWith('data:')) return lowered.startsWith('data:image/');
  return true;
}

function setSafeAttribute(element, name, value) {
  if (!SAFE_ATTR_NAMES.has(name)) return;
  if (value === undefined || value === null || value === false) return;
  element.setAttribute(name, String(value));
}

function appendSafeSvgNode(parent, sourceNode) {
  const tag = normalizeName(sourceNode && sourceNode.localName);
  if (!SAFE_NODE_NAMES.has(tag)) return;
  const child = document.createElementNS(SVG_NS, tag);
  Array.from(sourceNode.attributes || []).forEach((attribute) => {
    setSafeAttribute(child, normalizeName(attribute.name), attribute.value);
  });
  Array.from(sourceNode.children || []).forEach((nestedNode) => {
    appendSafeSvgNode(child, nestedNode);
  });
  parent.appendChild(child);
}

function appendSafeSvgMarkup(svg, markup) {
  if (!markup || typeof DOMParser === 'undefined') return;
  const parsed = new DOMParser().parseFromString(String(markup), 'image/svg+xml');
  const sourceSvg = parsed.documentElement;
  if (!sourceSvg || normalizeName(sourceSvg.localName) !== 'svg') return;
  const parsedViewBox = sourceSvg.getAttribute('viewBox');
  if (parsedViewBox) svg.setAttribute('viewBox', parsedViewBox);
  Array.from(sourceSvg.children || []).forEach((sourceNode) => {
    appendSafeSvgNode(svg, sourceNode);
  });
}

function createSvgElement(record, options = {}) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('part', 'svg');
  svg.setAttribute('viewBox', record.viewBox || '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('fill', record.fill || 'none');
  svg.setAttribute('stroke', record.stroke || 'currentColor');
  svg.setAttribute('stroke-width', String(options.strokeWidth || '2'));
  svg.setAttribute('stroke-linecap', record.strokeLinecap || 'round');
  svg.setAttribute('stroke-linejoin', record.strokeLinejoin || 'round');

  (record.nodes || []).forEach((node) => {
    const tag = normalizeName(node && node.tag || 'path');
    if (!SAFE_NODE_NAMES.has(tag)) return;
    const child = document.createElementNS(SVG_NS, tag);
    Object.entries(node.attrs || {}).forEach(([attrName, attrValue]) => {
      setSafeAttribute(child, attrName, attrValue);
    });
    svg.appendChild(child);
  });
  appendSafeSvgMarkup(svg, record.svg);
  return svg;
}

function createUrlElement(record, options = {}) {
  const img = document.createElement('img');
  img.part = 'image';
  img.alt = options.decorative ? '' : options.label || record.name || '';
  img.decoding = 'async';
  img.loading = 'lazy';
  if (isSafeIconUrl(record.src)) {
    img.src = record.src;
  }
  return img;
}

function createExternalSourceRecord(src) {
  return {
    schema: X_ICON_SOURCE_SCHEMA,
    name: 'external-source',
    kind: 'url',
    src,
    viewBox: '0 0 24 24',
    nodes: [],
    aliases: [],
    metadata: {
      providedBy: 'x-icon.src'
    }
  };
}

installDefaultIconPacks();

class XIcon extends HTMLElement {
  static get observedAttributes() {
    return ['name', 'pack', 'src', 'label', 'size', 'stroke-width', 'color', 'decorative'];
  }

  static get xtendComponentContract() {
    return {
      schema: 'xtend.component.contract.v2',
      tag: 'x-icon',
      maturity: 'stable',
      profiles: ['display', 'iconography'],
      source: {
        strategy: 'xtend.local-esm-icon-adapter.v1',
        state: 'js-runtime-profiled',
        sourcePath: 'components/xicon.js'
      },
      runtime: {
        format: 'esm',
        artifact: 'components/xicon.js',
        declaration: 'components/xicon.d.ts',
        localOnly: true,
        cdnAllowed: false
      },
      rmt: {
        adapter: 'xtend.component',
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      },
      fabric: {
        api: '@xtend-fabric',
        defaultLane: 'visible',
        diagnosticsLane: 'diagnostics'
      }
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: 'xtend.rmt.component-contract.v1',
      adapter: 'xtend.component',
      tag: 'x-icon',
      componentRecordKind: 'custom_element',
      templateMode: 'dom_descriptor',
      eventBindingMode: 'dom-event-to-rmt-command',
      schedules: ['component.visible.mount', 'component.visible.hydrate', 'diagnostics.snapshot'],
      hydration: { policy: 'visible', lane: 'visible' },
      shellAuthoring: {
        schema: 'xtend.rmt.shell-authoring.component.v1',
        host: 'x-icon',
        attributes: ['name', 'pack', 'src', 'label', 'size', 'stroke-width', 'color', 'decorative'],
        stateKey: 'xicon-state-<id>',
        events: ['icon-ready', 'icon-missing', 'icon-pack-registered']
      },
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: 'xtend.a11y.profile.v1',
      componentRef: 'x-icon',
      role: 'img-or-presentation',
      accessibleName: 'label-or-decorative',
      decorativePolicy: 'aria-hidden-when-decorative',
      screenreader: {
        signalContract: XIcon.xtendScreenreaderSignals
      },
      motionContrast: {
        policy: XIcon.xtendMotionContrastPolicy
      }
    };
  }

  static get xtendScreenreaderSignals() {
    return {
      schema: 'xtend.a11y.screenreader-signals.v1',
      componentRef: 'x-icon',
      signals: ['icon-ready', 'icon-missing'],
      statusRegions: ['role=img', 'aria-label', 'aria-hidden'],
      fabric: {
        lane: 'a11y',
        fiberKind: 'a11y.static-label',
        scheduleRef: 'a11y.visible.label'
      }
    };
  }

  static get xtendMotionContrastPolicy() {
    return {
      schema: 'xtend.a11y.motion-contrast-policy.v1',
      componentRef: 'x-icon',
      motion: {
        schema: 'xtend.a11y.motion-policy.v1',
        mediaQuery: '(prefers-reduced-motion: reduce)',
        reducedMotion: 'supported',
        animationPolicy: 'no-essential-motion'
      },
      contrast: {
        schema: 'xtend.a11y.contrast-policy.v1',
        mediaQuery: '(forced-colors: active)',
        highContrast: 'required',
        forcedColorAdjust: 'auto',
        colorToken: 'currentColor'
      }
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: X_ICON_PERFORMANCE_PROFILE_SCHEMA,
      componentRef: 'x-icon',
      profiles: ['display', 'iconography'],
      primaryProfile: 'display',
      budgetClass: 'display-micro',
      lane: 'visible',
      hydrationPolicy: 'visible',
      budgetsMs: {
        mount: 8,
        hydrate: 12,
        renderUpdate: 6,
        stateSync: 4
      },
      criticalMeasurements: ['xtend.component.hydrate', 'xtend.component.render', 'xtend.state.sync'],
      cleanup: ['icon-registry-reference'],
      rmt: {
        scheduleRefs: ['component.visible.hydrate', 'diagnostics.snapshot'],
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      },
      fabric: {
        lane: 'visible',
        diagnosticsLane: 'diagnostics',
        snapshotPath: 'xtend.component.x-icon.snapshot'
      }
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._lastReadyKey = '';
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --xtend-icon-size: 1em;
          --xtend-icon-color: currentColor;
          --xtend-icon-stroke-width: 2;
          display: inline-flex;
          width: var(--xtend-icon-size);
          height: var(--xtend-icon-size);
          min-width: var(--xtend-icon-size);
          min-height: var(--xtend-icon-size);
          align-items: center;
          justify-content: center;
          color: var(--xtend-icon-color);
          vertical-align: -0.125em;
          line-height: 1;
          contain: layout paint style;
        }
        .icon-root,
        svg,
        img {
          display: block;
          width: 100%;
          height: 100%;
        }
        svg {
          overflow: visible;
        }
        img {
          object-fit: contain;
        }
        :host([hidden]) {
          display: none !important;
        }
        @media (forced-colors: active) {
          :host {
            forced-color-adjust: auto;
            color: CanvasText;
          }
        }
      </style>
      <span class="icon-root" part="root"></span>
    `;
    this._root = this.shadowRoot.querySelector('.icon-root');
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  get name() {
    return this.getAttribute('name') || '';
  }

  set name(value) {
    if (value === null || value === undefined) this.removeAttribute('name');
    else this.setAttribute('name', String(value));
  }

  registerPack(pack, options = {}) {
    return registerIconPack(pack, options);
  }

  setIcon(name, options = {}) {
    this.name = name;
    if (options.pack) this.setAttribute('pack', options.pack);
    if (options.label) this.setAttribute('label', options.label);
    if (options.src) this.setAttribute('src', options.src);
    return this.snapshot();
  }

  snapshot() {
    const label = this.getLabel();
    const decorative = this.isDecorative(label);
    const src = this.getAttribute('src') || '';
    const name = this.name;
    const pack = this.getAttribute('pack') || '';
    const resolved = src
      ? (isSafeIconUrl(src)
        ? { pack: 'external', record: createExternalSourceRecord(src), source: 'x-icon.src', distribution: 'runtime' }
        : null)
      : resolveIcon(name, { pack });
    return {
      schema: X_ICON_STATE_SCHEMA,
      componentRef: 'x-icon',
      id: this.id || null,
      name,
      pack: resolved ? resolved.pack : pack,
      src,
      mode: src ? (resolved ? 'url' : 'missing') : (resolved && resolved.record ? resolved.record.kind : 'missing'),
      resolved: Boolean(resolved),
      decorative,
      label,
      size: this.getAttribute('size') || '1em',
      strokeWidth: this.getAttribute('stroke-width') || '2',
      color: this.getAttribute('color') || 'currentColor',
      registry: getIconRegistrySnapshot()
    };
  }

  getLabel() {
    return this.getAttribute('label') || this.getAttribute('aria-label') || '';
  }

  isDecorative(label = this.getLabel()) {
    if (this.hasAttribute('decorative')) {
      const value = this.getAttribute('decorative');
      return value === '' || value === 'true' || value === 'decorative';
    }
    return !label;
  }

  applyA11y(snapshot) {
    if (snapshot.decorative) {
      this.removeAttribute('role');
      this.setAttribute('aria-hidden', 'true');
      this.removeAttribute('aria-label');
      return;
    }
    this.setAttribute('role', 'img');
    this.removeAttribute('aria-hidden');
    this.setAttribute('aria-label', snapshot.label || snapshot.name || 'Icon');
  }

  applyTokens(snapshot) {
    this.style.setProperty('--xtend-icon-size', snapshot.size);
    this.style.setProperty('--xtend-icon-stroke-width', snapshot.strokeWidth);
    this.style.setProperty('--xtend-icon-color', snapshot.color);
  }

  syncState(snapshot) {
    const stateKey = `xicon-state-${this.id || snapshot.name || 'anonymous'}`;
    try {
      xstate.set(stateKey, snapshot);
    } catch (error) {
      // xstate is optional for host-neutral RMT rendering.
    }
    this.setAttribute('data-xstate-key', stateKey);
  }

  emitReady(snapshot, resolved) {
    const readyKey = `${snapshot.name}|${snapshot.pack}|${snapshot.mode}|${snapshot.resolved}`;
    if (readyKey === this._lastReadyKey) return;
    this._lastReadyKey = readyKey;
    const eventName = snapshot.resolved ? 'icon-ready' : 'icon-missing';
    const schema = snapshot.resolved ? X_ICON_READY_SCHEMA : X_ICON_MISSING_SCHEMA;
    this.dispatchEvent(new CustomEvent(eventName, {
      bubbles: true,
      composed: true,
      detail: {
        schema,
        componentRef: 'x-icon',
        id: this.id || null,
        name: snapshot.name,
        pack: snapshot.pack,
        src: snapshot.src,
        source: resolved ? resolved.source : 'registry-miss',
        distribution: resolved ? resolved.distribution : null,
        resolved: snapshot.resolved
      }
    }));
  }

  render() {
    const src = this.getAttribute('src') || '';
    const name = this.name;
    const pack = this.getAttribute('pack') || '';
    const label = this.getLabel();
    const decorative = this.isDecorative(label);
    const resolved = src
      ? (isSafeIconUrl(src)
        ? { pack: 'external', record: createExternalSourceRecord(src), source: 'x-icon.src', distribution: 'runtime' }
        : null)
      : resolveIcon(name, { pack });
    const snapshot = this.snapshot();

    this.applyTokens(snapshot);
    this.applyA11y({ ...snapshot, decorative, label });
    this._root.textContent = '';
    this._root.removeAttribute('data-icon-missing');

    if (resolved && resolved.record) {
      const node = resolved.record.kind === 'url'
        ? createUrlElement(resolved.record, { decorative, label })
        : createSvgElement(resolved.record, { strokeWidth: snapshot.strokeWidth });
      this._root.appendChild(node);
    } else {
      this._root.setAttribute('data-icon-missing', name || 'empty');
    }

    this.syncState(snapshot);
    this.emitReady(snapshot, resolved);
  }
}

if (!customElements.get('x-icon')) {
  customElements.define('x-icon', XIcon);
}

if (typeof window !== 'undefined') {
  window.XTend = window.XTend || {};
  window.XTend.icons = {
    schema: X_ICON_REGISTRY_SCHEMA,
    registry: XTendIconRegistry,
    register: registerIconPack,
    resolve: resolveIcon,
    snapshot: getIconRegistrySnapshot,
    createCorePack: createXTendCoreIconPack,
    createLucidePack: createXTendLucideIconPack
  };
}

class XStatus extends HTMLElement {
  static get observedAttributes() {
    return ['type', 'state', 'message', 'dismissible', 'busy', 'polite', 'label'];
  }

  static get xtendComponentContract() {
    return {
      schema: 'xtend.component.contract.v2',
      tag: 'x-status',
      maturity: 'stable',
      source: {
        strategy: 'xtend.typescript.component-source-strategy.v1',
        state: 'ts-source',
        sourcePath: 'src/components/x-status/x-status.ts'
      },
      runtime: {
        format: 'esm',
        artifact: 'components/xstatus.js',
        declaration: 'components/xstatus.d.ts',
        localOnly: true,
        cdnAllowed: false
      },
      rmt: {
        adapter: 'xtend.component',
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      },
      fabric: {
        api: '@xtend-fabric',
        defaultLane: 'feedback'
      }
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: 'xtend.rmt.component-contract.v1',
      adapter: 'xtend.component',
      tag: 'x-status',
      schedules: ['component.visible.mount', 'component.idle.hydrate', 'feedback.status.update', 'diagnostics.snapshot'],
      hydration: { policy: 'visible', lane: 'feedback' },
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    };
  }

  static get xtendComponentLifecycleTelemetry() {
    return {
      schema: 'xtend.component.lifecycle-telemetry.v1',
      componentRef: 'x-status',
      operations: ['mount', 'hydrate', 'render', 'update', 'event', 'error', 'unmount'],
      snapshotPath: 'snapshot.componentTelemetry'
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: 'xtend.a11y.profile.v1',
      componentRef: 'x-status',
      role: 'status',
      accessibleName: 'optional',
      liveRegion: 'polite',
      screenreader: {
        signalContract: XStatus.xtendScreenreaderSignals
      },
      motionContrast: {
        policy: XStatus.xtendMotionContrastPolicy
      }
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: 'xtend.performance.component-profile.v1',
      componentRef: 'x-status',
      budgetClass: 'feedback-small',
      lane: 'feedback',
      hydrationPolicy: 'visible',
      criticalMeasurements: ['mount', 'hydrate', 'event'],
      cleanup: ['xstate-subscription']
    };
  }

  static get xtendFeedbackStatusUxProfile() {
    return {
      schema: 'xtend.component.feedback-status-ux-profile.v1',
      componentRef: 'x-status',
      family: 'inline-status',
      role: 'status-or-alert',
      severityModel: 'type-plus-state',
      liveRegion: 'polite-or-assertive',
      timeoutMode: 'none',
      dismissMode: 'dismissible-attribute',
      events: ['status-changed', 'status-dismissed'],
      commands: ['announce', 'dismiss', 'update-status', 'snapshot'],
      stateKey: 'xstatus-state-<id>',
      schedule: 'feedback.status.update',
      fabric: {
        lane: 'feedback',
        a11yLane: 'a11y',
        diagnosticsLane: 'diagnostics'
      },
      rmt: XStatus.xtendRmtMetadata,
      statusSemantics: {
        noColorOnlyState: true,
        assertiveForError: true,
        ariaBusyMirroring: true
      }
    };
  }

  static get xtendScreenreaderSignals() {
    return {
      schema: 'xtend.a11y.screenreader-signals.v1',
      componentRef: 'x-status',
      liveRegion: 'polite',
      signals: ['status-update', 'validation-feedback', 'scheduler-feedback'],
      statusRegions: ['role=status', 'aria-live=polite'],
      errorRegions: ['role=alert', 'aria-live=assertive'],
      fabric: {
        lane: 'a11y',
        fiberKind: 'a11y.announce',
        scheduleRef: 'a11y.user-blocking.announce'
      }
    };
  }

  static get xtendMotionContrastPolicy() {
    return {
      schema: 'xtend.a11y.motion-contrast-policy.v1',
      componentRef: 'x-status',
      motion: {
        schema: 'xtend.a11y.motion-policy.v1',
        mediaQuery: '(prefers-reduced-motion: reduce)',
        reducedMotion: 'required',
        animationPolicy: 'status-without-motion-only-feedback',
        noMotionOnlyState: true
      },
      contrast: {
        schema: 'xtend.a11y.contrast-policy.v1',
        mediaQuery: '(forced-colors: active)',
        highContrast: 'required',
        forcedColorAdjust: 'auto',
        focusVisible: 'required',
        nonColorStatus: 'required'
      },
      fabric: {
        lane: 'a11y',
        fiberKind: 'a11y.preference',
        scheduleRef: 'a11y.user-blocking.preference'
      }
    };
  }

  constructor() {
    super();
    this._unsubscribeState = null;
    this._syncingFromXstate = false;
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: var(--text-color, #111827);
        }
        .status {
          --status-border: var(--xtend-feedback-border, #bfdbfe);
          --status-bg: var(--xtend-feedback-bg, #eff6ff);
          --status-color: var(--xtend-feedback-color, #1e3a8a);
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
          padding: var(--status-padding, 0.75rem);
          border: 1px solid var(--status-border, #bfdbfe);
          border-radius: var(--xtend-feedback-radius, var(--border-radius, 4px));
          background: var(--status-bg, #eff6ff);
          color: var(--status-color, #1e3a8a);
        }
        :host([type="success"]) .status {
          --status-border: #bbf7d0;
          --status-bg: #f0fdf4;
          --status-color: #14532d;
        }
        :host([type="warning"]) .status {
          --status-border: #fde68a;
          --status-bg: #fffbeb;
          --status-color: #78350f;
        }
        :host([type="error"]) .status {
          --status-border: #fecaca;
          --status-bg: #fef2f2;
          --status-color: #7f1d1d;
        }
        .content {
          flex: 1;
          min-width: 0;
        }
        .label {
          font-weight: 700;
        }
        .message {
          margin-top: 0.125rem;
        }
        button {
          border: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
          font: inherit;
          padding: 0.125rem 0.25rem;
        }
        .status-icon {
          flex: 0 0 auto;
          margin-top: 0.125rem;
        }
        button x-icon {
          pointer-events: none;
        }
        button:focus-visible {
          outline: var(--xtend-feedback-focus, 2px solid currentColor);
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .status,
          button {
            transition: none !important;
            animation: none !important;
          }
        }
        @media (forced-colors: active) {
          .status,
          button {
            forced-color-adjust: auto;
          }
          .status {
            border-color: CanvasText;
            background: Canvas;
            color: CanvasText;
          }
        }
      </style>
      <div id="status" class="status" part="root content" role="status" aria-live="polite" aria-atomic="true">
        <x-icon id="icon" class="status-icon" name="info" part="status-icon icon" decorative size="1.125rem"></x-icon>
        <div class="content" part="content">
          <div id="label" class="label" part="label"><slot name="label"><span id="label-text"></span></slot></div>
          <div id="message" class="message" part="message"><slot></slot></div>
        </div>
        <button id="dismiss" part="close control" type="button" aria-label="Dismiss status" hidden>
          <x-icon name="close" part="close-icon control icon" decorative size="1rem"></x-icon>
        </button>
      </div>
    `;
    this._status = this.shadowRoot.querySelector('#status');
    this._labelText = this.shadowRoot.querySelector('#label-text');
    this._message = this.shadowRoot.querySelector('#message');
    this._icon = this.shadowRoot.querySelector('#icon');
    this._dismissButton = this.shadowRoot.querySelector('#dismiss');
    this._onDismiss = this._onDismiss.bind(this);
  }

  connectedCallback() {
    if (!this.id) this.id = `xstatus-${Math.random().toString(36).slice(2, 10)}`;
    this._upgradeAttributes();
    this._syncState();
    this._dismissButton.addEventListener('click', this._onDismiss);
    xstate.set(`xstatus-state-${this.id}`, this.state);
    this._unsubscribeState = xstate.subscribe((key, value) => {
      if (key === `xstatus-state-${this.id}` && value && typeof value === 'object') {
        this._syncingFromXstate = true;
        try {
          this.setStatus(value);
        } finally {
          this._syncingFromXstate = false;
        }
      }
    }, `xstatus-state-${this.id}`);
  }

  disconnectedCallback() {
    this._dismissButton.removeEventListener('click', this._onDismiss);
    if (this._unsubscribeState) this._unsubscribeState();
  }

  _upgradeAttributes() {
    XStatus.observedAttributes.forEach((attribute) => {
      if (this.hasAttribute(attribute)) {
        this.attributeChangedCallback(attribute, null, this.getAttribute(attribute));
      }
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this._status || oldValue === newValue) return;
    if (name === 'message') {
      this._message.textContent = newValue || '';
    }
    if (name === 'label') {
      this._labelText.textContent = newValue || '';
    }
    this._syncState();
  }

  _syncState() {
    const isAlert = this.type === 'error' || this.hasAttribute('polite') === false && this.type === 'warning';
    this._status.setAttribute('role', isAlert ? 'alert' : 'status');
    this._status.setAttribute('aria-live', isAlert ? 'assertive' : 'polite');
    this._status.setAttribute('aria-busy', String(this.busy));
    if (this._icon) this._icon.setAttribute('name', this._iconNameForType(this.type));
    this._dismissButton.hidden = !this.dismissible;
    this.dispatchEvent(new CustomEvent('status-changed', {
      detail: this.state,
      bubbles: true,
      composed: true
    }));
    if (this.id && !this._syncingFromXstate) xstate.set(`xstatus-state-${this.id}`, this.state);
  }

  _onDismiss() {
    this.hidden = true;
    this.dispatchEvent(new CustomEvent('status-dismissed', {
      detail: this.state,
      bubbles: true,
      composed: true
    }));
  }

  _iconNameForType(type) {
    if (type === 'success') return 'success';
    if (type === 'warning') return 'warning';
    if (type === 'error') return 'error';
    return 'info';
  }

  get type() {
    return this.getAttribute('type') || 'info';
  }

  get busy() {
    return this.hasAttribute('busy');
  }

  get dismissible() {
    return this.hasAttribute('dismissible');
  }

  get state() {
    return {
      type: this.type,
      status: this.getAttribute('state') || this.type,
      message: this.getAttribute('message') || this.textContent.trim(),
      busy: this.busy,
      source: 'x-status'
    };
  }

  setStatus(nextState = {}) {
    if (nextState.type) this.setAttribute('type', nextState.type);
    if (nextState.status) this.setAttribute('state', nextState.status);
    if (nextState.message) this.setAttribute('message', nextState.message);
    if (typeof nextState.busy === 'boolean') {
      if (nextState.busy) this.setAttribute('busy', '');
      else this.removeAttribute('busy');
    }
    this.hidden = false;
    this._syncState();
  }

  dismiss() {
    this._onDismiss();
  }

  announce(message = this.state.message) {
    if (message) this.setAttribute('message', message);
    this._syncState();
  }
}

customElements.define('x-status', XStatus);

export { XStatus };
//# sourceMappingURL=x-status-Z74UVBki.mjs.map

