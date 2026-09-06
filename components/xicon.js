import { componentStyleNonce } from './style-nonce.js';
import { xtendState } from './xtend-state.js';
import { createXTendCoreIconPack, XTEND_CORE_ICON_PACK } from './icon-packs/core.js';
import { createXTendLucideIconPack, XTEND_LUCIDE_ICON_PACK } from './icon-packs/lucide.js';

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

export function registerIconPack(pack, options = {}) {
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

export function resolveIcon(name, options = {}) {
  return XTendIconRegistry.resolve(name, options);
}

export function getIconRegistrySnapshot() {
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
      <style${componentStyleNonce(this.ownerDocument)}>
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
      xtendState.set(stateKey, snapshot);
    } catch (error) {
      // xtendState is optional for host-neutral RMT rendering.
    }
    this.setAttribute('data-xtend-state-key', stateKey);
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

export {
  XIcon,
  X_ICON_REGISTRY_SCHEMA,
  X_ICON_SOURCE_SCHEMA,
  X_ICON_STATE_SCHEMA,
  createXTendCoreIconPack,
  createXTendLucideIconPack,
  XTendIconRegistry
};
