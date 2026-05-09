const SURFACE_OVERLAY_SELECTOR = 'x-modal, x-dialog, x-drawer';
const SURFACE_OVERLAY_BRIDGE_SCHEMA = 'xtend.surface.overlay-stack-bridge.v1';
const SURFACE_RECORD_SCHEMA = 'xtend.surface.record.v1';
const OVERLAY_Z_INDEX_BASE = 2147483000;

const OVERLAY_PROFILES = Object.freeze({
  'x-modal': Object.freeze({
    componentRef: 'x-modal',
    surfaceType: 'modal',
    family: 'modal-dialog',
    stateKey: 'modal-open-<id>',
    labelAttributes: Object.freeze(['label', 'title', 'aria-label']),
    lifecycleEvents: Object.freeze(['modal-opened', 'modal-closed']),
    modal: true,
    capabilities: Object.freeze(['open', 'focus', 'close', 'snapshot'])
  }),
  'x-dialog': Object.freeze({
    componentRef: 'x-dialog',
    surfaceType: 'dialog',
    family: 'dialog',
    stateKey: 'dialog-open-<id>',
    labelAttributes: Object.freeze(['label', 'title', 'aria-label']),
    lifecycleEvents: Object.freeze(['dialog-opened', 'dialog-closed']),
    modal: true,
    capabilities: Object.freeze(['open', 'focus', 'close', 'snapshot'])
  }),
  'x-drawer': Object.freeze({
    componentRef: 'x-drawer',
    surfaceType: 'drawer',
    family: 'drawer',
    stateKey: 'xdrawer-open-<id>',
    labelAttributes: Object.freeze(['label', 'aria-label', 'title']),
    lifecycleEvents: Object.freeze(['drawer-opened', 'drawer-closed', 'drawer-route-selected']),
    modal: false,
    capabilities: Object.freeze(['open', 'focus', 'close', 'resize', 'restore', 'snapshot'])
  })
});

const OVERLAY_LIFECYCLE_EVENTS = Object.freeze([
  'modal-opened',
  'modal-closed',
  'dialog-opened',
  'dialog-closed',
  'drawer-opened',
  'drawer-closed',
  'drawer-route-selected'
]);

function overlayTagName(element) {
  return String(element && (element.localName || element.tagName) || '').toLowerCase();
}

function overlayProfileFor(element) {
  return OVERLAY_PROFILES[overlayTagName(element)] || null;
}

function isSurfaceOverlayElement(element) {
  return Boolean(element && typeof element.matches === 'function' && element.matches(SURFACE_OVERLAY_SELECTOR));
}

function closestSurfaceOverlayElement(target) {
  if (!target) return null;
  if (isSurfaceOverlayElement(target)) return target;
  if (typeof target.closest === 'function') {
    const closest = target.closest(SURFACE_OVERLAY_SELECTOR);
    if (closest) return closest;
  }
  return null;
}

function findSurfaceOverlayElement(event) {
  if (!event) return null;
  if (typeof event.composedPath === 'function') {
    const path = event.composedPath();
    const match = path.find((entry) => isSurfaceOverlayElement(entry));
    if (match) return match;
  }
  return closestSurfaceOverlayElement(event.target);
}

function readAttribute(element, names, fallback = null) {
  for (const name of names) {
    const value = element.getAttribute(name);
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return fallback;
}

function ensureOverlayId(element) {
  const current = readAttribute(element, ['surface-id', 'id']);
  if (current) return current;
  const tag = overlayTagName(element).replace(/^x-/, '') || 'overlay';
  const id = `${tag}-${Math.random().toString(36).slice(2, 10)}`;
  element.id = id;
  return id;
}

function overlaySurfaceId(element) {
  return ensureOverlayId(element);
}

function overlayStateKey(profile, id) {
  return String(profile.stateKey).replace('<id>', id);
}

function overlaySurfaceType(element) {
  const profile = overlayProfileFor(element);
  return profile ? profile.surfaceType : 'dialog';
}

function overlayLabel(element, profile, id) {
  return readAttribute(element, profile.labelAttributes, id || profile.surfaceType);
}

function overlayPlacement(element, type) {
  if (type !== 'drawer') return null;
  return readAttribute(element, ['placement'], 'right');
}

function overlayIsModal(element, profile, type) {
  if (type === 'modal' || type === 'dialog') return true;
  return profile.modal === true || element.hasAttribute('modal');
}

function overlayZIndex(record) {
  const zIndex = Number(record && record.zIndex);
  return OVERLAY_Z_INDEX_BASE + (Number.isFinite(zIndex) ? zIndex : 0);
}

function createOverlayCompatibilityProfile(element) {
  const profile = overlayProfileFor(element);
  if (!profile) return null;
  return {
    schema: SURFACE_OVERLAY_BRIDGE_SCHEMA,
    componentRef: profile.componentRef,
    surfaceType: profile.surfaceType,
    managerSlot: 'overlays',
    managerEvent: 'surface-overlay-command',
    legacyLifecycleEvents: profile.lifecycleEvents.slice(),
    legacyStateKey: profile.stateKey,
    registration: 'optional',
    bridgeModule: 'components/xsurfaceoverlay-bridge.js',
    surfaceRecordSchema: SURFACE_RECORD_SCHEMA,
    legacyApiPreserved: true,
    fabric: {
      lane: profile.surfaceType === 'drawer' ? 'visible' : 'user-blocking',
      diagnosticsLane: 'diagnostics'
    },
    rmt: {
      adapter: 'xtend.component',
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    }
  };
}

function toOverlaySurfaceRecord(element, managerId = 'xtend.surface.manager') {
  const profile = overlayProfileFor(element);
  if (!profile) {
    throw new Error('Unsupported Surface overlay element.');
  }

  const id = overlaySurfaceId(element);
  const type = profile.surfaceType;
  const placement = overlayPlacement(element, type);

  return {
    schema: SURFACE_RECORD_SCHEMA,
    id,
    manager: managerId,
    type,
    label: overlayLabel(element, profile, id),
    stateKey: overlayStateKey(profile, id),
    status: element.hasAttribute('open') ? 'open' : 'closed',
    defaultOpen: element.hasAttribute('open'),
    modal: overlayIsModal(element, profile, type),
    placement,
    mode: 'overlay',
    capabilities: profile.capabilities.slice(),
    metadata: {
      overlayCompatibility: createOverlayCompatibilityProfile(element)
    }
  };
}

function callOverlayOpen(element) {
  if (overlayTagName(element) === 'x-drawer' && typeof element.openDrawer === 'function') {
    element.openDrawer({ source: 'surface-manager' });
    return;
  }
  if (typeof element.open === 'function') {
    element.open({ source: 'surface-manager' });
    return;
  }
  element.setAttribute('open', '');
}

function callOverlayClose(element) {
  if (overlayTagName(element) === 'x-drawer' && typeof element.closeDrawer === 'function') {
    element.closeDrawer({ source: 'surface-manager' });
    return;
  }
  if (typeof element.close === 'function') {
    element.close({ source: 'surface-manager' });
    return;
  }
  element.removeAttribute('open');
}

function applyOverlaySurfaceSnapshot(element, record = {}) {
  const shouldOpen = record.status !== 'closed';
  const zIndex = overlayZIndex(record);

  element.style.setProperty('--surface-overlay-backdrop-z', String(Math.max(1, zIndex - 1)));
  element.style.setProperty('--surface-overlay-z', String(zIndex));
  element.toggleAttribute('data-surface-active', record.active === true);

  if (shouldOpen && !element.hasAttribute('open')) {
    callOverlayOpen(element);
  }

  if (!shouldOpen && element.hasAttribute('open')) {
    callOverlayClose(element);
  }
}

export {
  OVERLAY_LIFECYCLE_EVENTS,
  OVERLAY_PROFILES,
  SURFACE_OVERLAY_BRIDGE_SCHEMA,
  SURFACE_OVERLAY_SELECTOR,
  applyOverlaySurfaceSnapshot,
  createOverlayCompatibilityProfile,
  findSurfaceOverlayElement,
  isSurfaceOverlayElement,
  overlaySurfaceId,
  overlaySurfaceType,
  toOverlaySurfaceRecord
};
