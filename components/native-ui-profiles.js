import { connectNativeCollection, projectNativeCollection, prepareNativeCollection } from './native-collection-layout.js';
/** Reviewed managed branches of the shipped UI classes. Classic methods remain on the same prototype. */
import { componentListen, emitManagedEvent, getManagedContext, managedLocal, onManagedCleanup, requestManaged } from './native-managed.js';
const noop = () => {};
const commands = {
  "x-alert": [
    "dismiss",
    "snapshot"
  ],
  "x-button": [
    "focus",
    "setLoading"
  ],
  "x-calendar": [
    "focus",
    "checkValidity",
    "reportValidity",
    "reset"
  ],
  "x-cards": [
    "snapshot"
  ],
  "x-checkbox": [
    "focus",
    "checkValidity",
    "reportValidity",
    "validate",
    "reset",
    "toggle"
  ],
  "x-code": [
    "hydrate",
    "snapshot"
  ],
  "x-dialog": [
    "open",
    "close",
    "snapshot"
  ],
  "x-drawer": [
    "openDrawer",
    "closeDrawer",
    "toggle",
    "snapshot"
  ],
  "x-footer": [
    "snapshot"
  ],
  "x-form": [
    "submit",
    "reset",
    "validate",
    "getFormData"
  ],
  "x-header": [
    "toggleMenu",
    "isMenuOpen",
    "snapshot"
  ],
  "x-hero": [
    "scrollPast",
    "snapshot"
  ],
  "x-icon": [
    "setIcon",
    "snapshot"
  ],
  "x-input": [
    "focus",
    "checkValidity",
    "reportValidity",
    "validate",
    "reset"
  ],
  "x-keymap": [
    "open",
    "close",
    "isOpen"
  ],
  "x-lightbox": [
    "open",
    "close",
    "snapshot"
  ],
  "x-link": [
    "focus"
  ],
  "x-masonry": [
    "snapshot"
  ],
  "x-menu": [
    "focus"
  ],
  "x-modal": [
    "open",
    "close",
    "snapshot"
  ],
  "x-player": [
    "play",
    "pause",
    "playMedia",
    "pauseMedia",
    "setMediaState",
    "seek",
    "fullscreen",
    "snapshot"
  ],
  "x-popover": [
    "show",
    "hide",
    "toggle",
    "snapshot"
  ],
  "x-progress": [
    "setProgress",
    "complete",
    "reset",
    "snapshot"
  ],
  "x-radio": [
    "focus",
    "checkValidity",
    "reportValidity",
    "validate",
    "reset",
    "check"
  ],
  "x-section": [
    "snapshot"
  ],
  "x-select": [
    "focus",
    "checkValidity",
    "reportValidity",
    "validate",
    "reset"
  ],
  "x-spinner": [
    "pause",
    "resume",
    "snapshot"
  ],
  "x-status": [
    "announce",
    "dismiss",
    "snapshot"
  ],
  "x-summary": [
    "open",
    "close",
    "toggle",
    "snapshot"
  ],
  "x-tabs": [
    "selectTab"
  ],
  "x-textarea": [
    "focus",
    "checkValidity",
    "reportValidity",
    "validate",
    "reset",
    "snapshot"
  ],
  "x-toast": [
    "dismiss"
  ],
  "x-toggle": [
    "focus",
    "checkValidity",
    "reportValidity",
    "validate",
    "reset",
    "toggle"
  ],
  "x-tooltip": [
    "show",
    "hide",
    "toggle",
    "snapshot"
  ],
  "x-type": [
    "pause",
    "resume",
    "snapshot"
  ],
  "x-writer": [
    "focus",
    "reset",
    "save",
    "exportHTML",
    "exportMarkdown",
    "getHTML",
    "getText",
    "getMarkdown"
  ]
};
function createCommandCatalog() { return Object.freeze(Object.fromEntries(Object.entries(commands).map(([tag, names]) => [tag, Object.freeze(names)]))); }
export const NATIVE_UI_COMMANDS = /* @__PURE__ */ createCommandCatalog();
function requireModelIntent(element, name, detail) {
  if (!event(element, name, detail)) throw new TypeError(`Native ${element.localName} command requires a validated RMT.On Action binding for ${name}`);
  return null;
}
function headerMenuCommand(args) {
  return requireModelIntent(this, args.open ? 'menu-opened' : 'menu-closed', { ...this.snapshot(), menuOpen: !!args.open, source: 'rmt-command' });
}
function modelCommand(element, tag, name, args) {
  const source = 'rmt-command';
  if (name === 'setLoading') return () => requireModelIntent(element, args.loading ? 'loading-start' : 'loading-end', { loading: !!args.loading, source });
  if (name === 'setProgress' || tag === 'x-progress' && ['complete','reset'].includes(name)) {
    const value = name === 'complete' ? element.max : name === 'reset' ? 0 : args.value;
    return () => requireModelIntent(element, 'progress-changed', { value, max: element.max, percent: element.max ? value / element.max * 100 : 0, source });
  }
  if (['x-input','x-textarea','x-select','x-checkbox','x-radio','x-toggle','x-calendar'].includes(tag) && ['reset','toggle','check'].includes(name)) {
    const prefix = { 'x-input':'input', 'x-textarea':'textarea', 'x-select':'select', 'x-checkbox':'checkbox', 'x-radio':'radio', 'x-toggle':'toggle', 'x-calendar':'date' }[tag];
    const eventName = tag === 'x-calendar' ? 'date-select' : `${prefix}-changed`;
    const detail = ['x-checkbox','x-radio','x-toggle'].includes(tag) ? { checked: name === 'reset' ? false : name === 'check' ? true : !element.checked, value: element.value, name: element.getAttribute('name') || '', source } : { value: '', values: [], files: [], fileCount: 0, date: '', source };
    return () => requireModelIntent(element, eventName, detail);
  }
  if (tag === 'x-tabs' && name === 'selectTab') { const item = element._nativeItems?.[args.index]; if (!Number.isInteger(args.index) || !item) throw new RangeError('Invalid tab index'); return () => requireModelIntent(element, 'tab-selection-requested', { key: item.key }); }
  if (tag === 'x-header' && name === 'toggleMenu') return () => headerMenuCommand.call(element, args);
  if (tag === 'x-summary' && ['open','close','toggle'].includes(name)) { const open = name === 'toggle' ? !element.hasAttribute('open') : name === 'open'; return () => requireModelIntent(element, open ? 'open' : 'close', { open }); }
  if (tag === 'x-status' && name === 'announce') return () => requireModelIntent(element, 'status-changed', { ...element.state, message: args.message, source });
  if (name === 'dismiss') return () => requireModelIntent(element, tag === 'x-status' ? 'status-dismissed' : tag === 'x-alert' ? 'alert-dismissed' : 'toast-dismissed', { ...(element._getDetail?.(args.reason || source) || element.state), reason: args.reason || source, dismissed: true, source });
  if (['x-dialog','x-modal','x-drawer','x-popover','x-tooltip','x-lightbox'].includes(tag) && ['open','close','openDrawer','closeDrawer','show','hide','toggle'].includes(name)) {
    const open = name === 'toggle' ? !element._open : ['open','openDrawer','show'].includes(name);
    const prefix = tag.slice(2);
    return () => requireModelIntent(element, `${prefix}-${open ? 'opened' : 'closed'}`, { id: element.id || '', open, src: args.src || element.getAttribute('src') || '', source, placement: element.getAttribute('placement') || '', modal: !!element.modal });
  }
  if (tag === 'x-keymap' && ['open','close'].includes(name)) return () => requireModelIntent(element, name === 'open' ? 'xkeymap-open' : 'xkeymap-close', { open: name === 'open', reason: args.reason || source, entries: args.entries || element.entries });
  if (tag === 'x-spinner' && ['pause','resume'].includes(name)) return () => requireModelIntent(element, name === 'pause' ? 'paused' : 'resumed', { paused: name === 'pause', source });
  if (tag === 'x-player' && ['play','playMedia','pause','pauseMedia','seek','setMediaState'].includes(name)) {
    const patch = name === 'setMediaState' ? args.state : name === 'seek' ? { currentTime: args.time } : { playing: ['play','playMedia'].includes(name) };
    return () => requireModelIntent(element, 'player-state-changed', { playing: element.playing, currentTime: element.currentTime, volume: element.volume, muted: element.muted, ...patch, source });
  }
  if (tag === 'x-writer' && name === 'reset') return () => requireModelIntent(element, 'writer:change', { html: '', markdown: '', plain: '', source });
  if (tag === 'x-form' && name === 'reset') return () => requireModelIntent(element, 'reset', { source });
  if (tag === 'x-form' && name === 'submit') return () => { const valid = element.validate(); return requireModelIntent(element, valid ? 'submit' : 'invalid', valid ? { data: element.getFormData() } : { message: 'Form validation failed.', invalidFields: [] }); };
  return null;
}
function commandMap(tag) {
  return Object.fromEntries((commands[tag] || []).map((name) => [name, function(args) {
    const transition = modelCommand(this, tag, name, args);
    if (transition) return transition();
    if (name === 'focus') return requestManaged(this, 'focus.request', { part: this._input ? 'input' : this._control ? 'control' : 'root' });
    if (name === 'setIcon') return this.setIcon(args.name);
    if (name === 'setProgress') return this.setProgress(args.value);
    if (name === 'announce') return this.announce(args.message);
    if (name === 'setMediaState') return this.setMediaState(args.state);
    if (name === 'close' && tag === 'x-keymap') return this.close(args.reason || 'rmt');
    if (name === 'setLoading') return this.setLoading(args.loading, { sync: false });
    if (name === 'toggleMenu') return this.toggleMenu(args.open, { source: 'rmt', focus: false });
    if (name === 'selectTab') return this.selectTab(args.index);
    if (name === 'open' && tag === 'x-lightbox') return this.open(args.src, { source: 'rmt' });
    if (name === 'open' && tag === 'x-keymap') return this.open(args.entries);
    if (name === 'openDrawer') return this.openDrawer({ source: 'rmt' });
    if (name === 'closeDrawer') return this.closeDrawer({ source: 'rmt' });
    if (name === 'open' && tag === 'x-drawer') return this.openDrawer({ source: 'rmt' });
    if (name === 'close' && tag === 'x-drawer') return this.closeDrawer({ source: 'rmt' });
    if (name === 'dismiss') return tag === 'x-status' ? this._onDismiss() : this.dismiss(args.reason || 'rmt');
    if (name === 'playMedia') return this.playMedia(args);
    if (name === 'pauseMedia') return this.pauseMedia();
    if (name === 'play') return this.playMedia(args);
    if (name === 'pause' && tag === 'x-player') return this.pauseMedia();
    if (name === 'seek') return this.setMediaState({ currentTime: args.time });
    if (name === 'fullscreen') return requestManaged(this, 'media.request', { operation: 'fullscreen', enabled: args.enabled });
    if (name === 'save') return this.save(Boolean(args.autosave));
    if (name === 'exportHTML' || name === 'exportMarkdown') return this[name](args.filename);
    if (typeof this[name] !== 'function') throw new Error(`Missing native command implementation ${tag}.${name}`);
    return this[name]({ source: 'rmt' });
  }]));
}
function event(element, type, detail = {}) { return emitManagedEvent(element, type, detail); }
function listen(element, target, name, listener, options) { return componentListen(element, target, name, listener, options); }
function ownId(element, suffix) {
  const state = managedLocal(element);
  if (!state.id) state.id = `rmt-native-${suffix}-${++ownId.counter}`;
  return state.id;
}
ownId.counter = 0;
function inputConnect() {
  this._upgradeAttributes();
  const emit = () => {
    const files = this.files ? Array.from(this.files, (file) => getManagedContext(this).captureFile(file)) : [];
    event(this, 'input-changed', { value: this.value, files, fileCount: files.length, source: 'x-input' });
  };
  listen(this, this._input, 'input', emit);
  listen(this, this._input, 'change', (e) => { e.stopPropagation(); emit(); });
  listen(this, this._input, 'invalid', () => event(this, 'validation-failed', { value: this.value, source: 'x-input', message: this._input.validationMessage }));
  listen(this, this._input, 'blur', () => this.reportValidity());
}
function formConnect() {
  this.constructor.observedAttributes.forEach((name) => this.attributeChangedCallback(name));
  this._elements = this.querySelectorAll(this._supportedSelector);
  const refresh = () => { this._elements = this.querySelectorAll(this._supportedSelector); };
  const observer = new MutationObserver(refresh);
  observer.observe(this, { childList: true, subtree: true });
  onManagedCleanup(this, () => observer.disconnect());
  listen(this, this._form, 'submit', (e) => { e.preventDefault(); this._onSubmit(e); });
  listen(this, this._form, 'reset', (e) => { e.preventDefault(); this._onReset(); });
}
function overlayLease(element, open, modal) {
  const state = managedLocal(element), context = getManagedContext(element);
  if (!open || !element.isConnected || !context?.isActive()) {
    state.overlayCleanup?.();state.overlayLease=null;state.overlayCleanup=null;state.overlayOpen=false;state.overlayModal=undefined;
    return null;
  }
  if (state.overlayLease && state.overlayModal === !!modal) return state.overlayLease;
  state.overlayCleanup?.();
  const lease = requestManaged(element, 'overlay.acquire', {open:true,modal:!!modal});
  if (!lease || typeof lease.release !== 'function') throw new TypeError('An actual owned overlay lease is required');
  state.overlayLease=lease;state.overlayOpen=true;state.overlayModal=!!modal;
  state.overlayCleanup=onManagedCleanup(element,()=>{
    lease.release();
    if(state.overlayLease===lease){state.overlayLease=null;state.overlayCleanup=null;state.overlayOpen=false;state.overlayModal=undefined;}
  });
  return lease;
}

function dialogRender() {
  const isModal = this.localName === 'x-modal';
  const content = this.getAttribute('content') || '';
  const state = { entry: null, title: this.getAttribute('title') || '', content: isModal && content ? this._sanitizeManagedHTML(content) : '', overlay: this.hasAttribute('overlay'), open: this.hasAttribute('open'), actions: this._managedActions || null, width: this.getAttribute('width') || 'min(90vw, 480px)', height: this.getAttribute('height') || 'auto' };
  this._open = state.open; this._overlay = state.overlay; this._title = state.title; this._content = state.content; this._actions = state.actions; this._width = state.width; this._height = state.height;
  this._render(state);
  this.shadowRoot.querySelector(isModal ? '.x-modal' : '.xdialog')?.setAttribute('tabindex', '-1');
  const contentRoot = this.shadowRoot.querySelector(isModal ? '.x-modal-content' : '.xdialog-content');
  if (contentRoot) contentRoot.addEventListener('click', (e) => { const anchor = e.target.closest?.('a[href]'); if (anchor && contentRoot.contains(anchor)) { e.preventDefault(); event(this, 'modal-link-requested', { href: anchor.getAttribute('href') }); } });
  overlayLease(this, state.open, true);
  if (isModal) this._syncA11y?.();
}
function dialogIntent(open, options = {}) {
  const prefix = this.localName === 'x-modal' ? 'modal' : 'dialog';
  // Business state changes arrive through props. User gestures request the next Model value.
  return event(this, `${prefix}-${open ? 'opened' : 'closed'}`, { id: this.id || null, open, source: options.source || 'rmt' });
}
function menuConnect() {
  this._items = this._collectItems();
  const refresh = () => { this._items = this._collectItems(); };
  listen(this, this._slot, 'slotchange', refresh);
  listen(this, this, 'click', (e) => {
    const item = e.composedPath().find((node) => this._items.includes(node));
    if (!item || this._isItemDisabled(item)) return;
    const index = this._items.indexOf(item), href = this._resolveItemHref(item);
    e.preventDefault();
    event(this, 'menu-item-clicked', { index, href: href || null, source: 'click' });
  });
  listen(this, this, 'keydown', (e) => {
    const index = this._items.findIndex((item) => item === e.target || item.contains(e.target));
    if (index < 0) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); event(this, 'menu-item-clicked', { index, href: this._resolveItemHref(this._items[index]) || null, source: 'keyboard' });
    } else if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      const next = e.key === 'Home' ? this._resolveFirstEnabledIndex() : e.key === 'End' ? this._resolveLastEnabledIndex() : this._resolveNextEnabledIndex(index, /Down|Right/.test(e.key) ? 1 : -1);
      if (next < 0) return;
      requestManaged(this, 'focus.request', { slot: 'default', item: next });
      event(this, 'menu-keyboard-navigation', { key: e.key, fromIndex: index, toIndex: next });
    }
  });
}
function masonryRender() {
  this._applyAttributes();
  // Project original nodes. CSS grid performs layout; RMT retains structure, order, keys and collapsed state.
  const slot = this.shadowRoot.querySelector('slot');
  slot.hidden = false; slot.style.display = 'contents';
  const old = this._container.querySelectorAll('.item'); old.forEach((item) => item.remove());
  event(this, 'masonry-layout', this.snapshot());
}
function tabsRender() {
  const header = this.shadowRoot.querySelector('.tabs'); header.replaceChildren();
  this._tabs = Array.from(this.children).filter((child) => child.localName === 'x-tab').map((panel, index) => {
    const button = this.ownerDocument.createElement('button'); button.type = 'button';
    button.textContent = panel.getAttribute('name') || panel.getAttribute('label') || `Tab ${index + 1}`;
    button.setAttribute('role', 'tab'); button.disabled = this._isTabElementDisabled(panel);
    button.setAttribute('aria-selected', String(index === this._selected)); button.tabIndex = index === this._selected ? 0 : -1;
    button.addEventListener('click', () => event(this, 'tab-selected', { index })); header.append(button); return button;
  });
  this._hasRenderedTabs = true;
}
function toastConnect() {
  this._dismissed = false; this._render();
  if (this.hasAttribute('overlay')) overlayLease(this, !this.hasAttribute('hidden'), false);
  if (!this.hasAttribute('hidden') && (this.localName === 'x-alert' || this.hasAttribute('open'))) {
    this._scheduleDismiss(); this._emitToastEvent ? this._emitToastEvent('toast-shown', 'connected') : this._emitAlertEvent('alert-shown', 'connected');
  }
}
function toastDismiss(reason = 'manual') {
  if (this._dismissed) return;
  this._dismissed = true; clearTimeout(this._timeout);
  const prefix = this.localName === 'x-alert' ? 'alert' : 'toast';
  event(this, `${prefix}-dismissed`, { ...this._getDetail(reason), dismissed: true, reason });
}
function tooltipLeaseCurrent(lease) { return !!lease && typeof lease.isCurrent === 'function' && lease.isCurrent(); }
function tooltipBind(options = {}) {
  this._unbindAnchor();
  const state = managedLocal(this);
  if (this.hasAttribute('for')) {
    const lease = requestManaged(this, 'focus.request', { operation: 'tooltip-anchor', ref: this.getAttribute('for'), describedBy: this._tooltip.id, ...(options.allowMissing ? { allowMissing: true } : {}) });
    if (options.allowMissing && lease === null) return;
    const measure = lease?.getRect || lease?.measure;
    if (!lease || typeof lease.isCurrent !== 'function' || typeof measure !== 'function' || typeof lease.subscribe !== 'function' || typeof lease.release !== 'function') throw new TypeError('The actual Renderer tooltip anchor lease is required');
    const current = () => getManagedContext(this).isActive() && tooltipLeaseCurrent(lease);
    const emptyRect = Object.freeze({x:0,y:0,left:0,right:0,top:0,bottom:0,width:0,height:0});
    this._anchor = { getBoundingClientRect: () => current() ? measure.call(lease) : emptyRect };
    const guarded = callback => (...args) => { if (current()) callback(...args); };
    const unsubscribe = lease.subscribe({ enter: guarded(this._onAnchorEnter), leave: guarded(this._onAnchorLeave), focus: guarded(this._onAnchorFocus), blur: guarded(this._onAnchorBlur), reposition: guarded(this._onViewportChange) });
    const describe = () => { if (current()) lease.describe?.(this.label || this.textContent || ''); };
    describe();
    const observer = new MutationObserver(describe);observer.observe(this,{childList:true,subtree:true,characterData:true});
    state.tooltipUnbind = onManagedCleanup(this, () => { unsubscribe();observer.disconnect();lease.release();state.tooltipUnbind=null; });
    state.tooltipLease = lease;
    return;
  }
  this._anchor = this.shadowRoot.querySelector('.trigger');
  if (!this._anchor) return;
  state.tooltipOwnListeners = [
    listen(this, this._anchor, 'mouseenter', this._onAnchorEnter),
    listen(this, this._anchor, 'mouseleave', this._onAnchorLeave),
    listen(this, this._anchor, 'focus', this._onAnchorFocus, true),
    listen(this, this._anchor, 'blur', this._onAnchorBlur, true)
  ];
  this._anchor.setAttribute('aria-describedby', this._tooltip.id);
}

function writerConnect() {
  const editor = this.shadowRoot.querySelector('.editor');
  if (this._managedHTML !== undefined) editor.innerHTML = this._admitManagedHTML(this._managedHTML);
  listen(this, editor, 'click', (e) => { const anchor = e.target.closest?.('a[href]'); if (anchor && editor.contains(anchor)) { e.preventDefault(); event(this, 'writer:link-requested', { href: anchor.getAttribute('href') }); } });
  listen(this, editor, 'input', () => {
    this._sanitizeManagedEditor();
    event(this, 'writer:change', { html: this.getHTML(), markdown: this.getMarkdown(), plain: this.getText(), source: 'input' });
  });
  listen(this, editor, 'paste', (e) => {
    e.preventDefault();
    const text = e.clipboardData?.getData('text/plain') || '';
    const selection = this.ownerDocument.defaultView.getSelection();
    if (selection?.rangeCount) { const range = selection.getRangeAt(0); if (editor.contains(range.commonAncestorContainer)) { range.deleteContents(); range.insertNode(this.ownerDocument.createTextNode(text)); } }
    this.dispatchChangeEvent();
  });
  listen(this, editor, 'drop', (e) => { e.preventDefault(); event(this, 'writer:error', { error: { name: 'CapabilityError', message: 'Use the RMT file port to import content' } }); });
  const save = this.shadowRoot.querySelector('#saveBtn');
  if (save) listen(this, save, 'click', () => this.save(false));
  for (const [id, method] of [['exportHtml','exportHTML'],['exportMd','exportMarkdown']]) {
    const control = this.shadowRoot.querySelector(`#${id}`); if (control) listen(this, control, 'click', () => this[method]());
  }
  this.markdownLibLoaded = true; this.enableExportButtons();
  const exportButton = this.shadowRoot.querySelector('#exportBtn'); if (exportButton) listen(this, exportButton, 'click', () => this.toggleExportMenu());
  for (const button of this.shadowRoot.querySelectorAll('.toolbar button[data-cmd]')) listen(this, button, 'click', () => {
    const selection = this.ownerDocument.defaultView.getSelection();
    const rootSelection = this.shadowRoot.getSelection?.() || selection;
    if (!rootSelection?.rangeCount || !editor.contains(rootSelection.getRangeAt(0).commonAncestorContainer)) return;
    this.ownerDocument.execCommand(button.dataset.cmd, false, null); this.dispatchChangeEvent();
  });
  const color = this.shadowRoot.querySelector('#fontColor'); if (color) listen(this, color, 'input', (e) => {
    const selection = this.shadowRoot.getSelection?.() || this.ownerDocument.defaultView.getSelection();
    if (selection?.rangeCount && editor.contains(selection.getRangeAt(0).commonAncestorContainer)) { this.applyStyleToSelection('color', e.target.value); this.dispatchChangeEvent(); }
  });
  const size = this.shadowRoot.querySelector('#fontSize'); if (size) listen(this, size, 'change', (e) => {
    const px = { 1:'10px',2:'13px',3:'16px',4:'18px',5:'24px',6:'32px',7:'48px' }[e.target.value] || '16px';
    this.currentFontSize = px; editor.style.fontSize = px;
    const selection = this.shadowRoot.getSelection?.() || this.ownerDocument.defaultView.getSelection();
    if (selection?.rangeCount && editor.contains(selection.getRangeAt(0).commonAncestorContainer)) this.applyFontSizeToSelection(px);
    this.dispatchChangeEvent();
  });
}
function mediaError(error, operation) { event(this, 'player-error', { error: { name: error?.name || 'MediaError', message: error?.message || String(error) }, operation }); }
function playerConnect() {
  this._loadMedia(); this._updateOverlay(); this._updateDimensions(); this._observePlayerResize();
  for (const [name, value] of Object.entries(this._managedMediaState || {})) this[name] = value;
  if (this._media) {
    for (const type of ['play','pause','timeupdate','volumechange','ended','loadedmetadata']) {
      listen(this, this._media, type, () => {
        const playing = !this._media.paused;
        if (type === 'volumechange' && this._managedMediaState?.volume === this._media.volume && this._managedMediaState?.muted === this._media.muted) return;
        if (type === 'timeupdate' && this._managedMediaState?.currentTime === this._media.currentTime) return;
        if (['play','pause'].includes(type) && this._managedMediaState?.playing === playing) return;
        event(this, 'player-state-changed', { playing: !this._media.paused, currentTime: this._media.currentTime, volume: this._media.volume, muted: this._media.muted, duration: Number.isFinite(this._media.duration) ? this._media.duration : 0, source: type });
      });
    }
    listen(this, this._media, 'error', () => mediaError.call(this, new Error(this._media.error?.message || 'Media playback failed'), 'load'));
  }
}
/** The same Header behavior can be delivered without the unused full UI dispatcher. */
export function managedHeaderProfile() {
  return {
    commands: {
      toggleMenu: headerMenuCommand,
      snapshot() { return this.snapshot({source:'rmt'}); }
    },
    methods: {
      toggleMenu(open, options = {}) { return event(this, open ? 'menu-opened' : 'menu-closed', { ...this.snapshot(), menuOpen: !!open, source: options.source || 'user' }); },
      _applyMenuModality(active) { overlayLease(this, active, this._getMenuModal()); },
      _restoreMenuFocus() { return requestManaged(this, 'focus.request', { part: 'menu', restore: true }); },
      _focusMenuSurface() { return requestManaged(this, 'focus.request', { part: 'menu' }); }
    }
  };
}
export function managedProfile(tag) {
  const profile = { commands: commandMap(tag), methods: {} };
  switch (tag) {
    case 'x-checkbox': case 'x-radio': case 'x-toggle':
      profile.methods[tag === 'x-toggle' ? 'handleChange' : '_onChange'] = function() {
        const control = this._control || this.control; const checked = control.checked;
        event(this, `${tag.slice(2)}-changed`, { checked, value: this.value, name: this.getAttribute('name') || '', source: tag });
        control.checked = this.hasAttribute('checked');
      };
      profile.methods.toggle = function() { return event(this, `${tag.slice(2)}-changed`, { checked: !this.checked, value: this.value, source: tag }); };
      profile.methods.check = function() { return event(this, 'radio-changed', { checked: true, value: this.value, name: this.getAttribute('name') || '', source: tag }); };
      break;
    case 'x-calendar':
      profile.prepare = function(context) { this._prepareManagedCalendar();context.onCleanup(context.onDeactivation(()=>{this._nativeNeedsFocus=false;this._nativeFocusedDate=undefined;})); context.onCleanup(context.registerProjectionValidator(values => { const locale = values.attributes.locale; if (locale) Intl.getCanonicalLocales(locale); })); };
      break;
    case 'x-input': profile.connect = inputConnect; profile.disconnect = noop; break;
    case 'x-button':
      profile.connect = function() { this._upgradeAttributes(); this._renderButton(); this._forwardEvents(); listen(this, this._slot, 'slotchange', () => this._syncLabelFallback()); };
      break;
    case 'x-header':
      return managedHeaderProfile();
    case 'x-icon':
      profile.connect = function() { this._lastReadyKey = null; this.render(); };
      break;
    case 'x-footer': profile.methods.applyTheme = noop; profile.methods.observeThemeChanges = noop; break;
    case 'x-section': profile.prepare = function(context) { this._prepareManagedStyle(context); }; break;
    case 'x-hero':
      profile.prepare = function(context) { this._prepareManagedHero(context); };
      profile.connect = function() { this.render(); const control = this.shadowRoot.querySelector('.scroll-button'); if (control) listen(this, control, 'click', () => this.scrollPast()); event(this, 'hero-rendered'); };
      profile.disconnect = noop;
      profile.methods.applyTheme = noop;
      profile.methods.scrollPast = function() { return requestManaged(this, 'focus.request', { operation: 'scroll-past' }); };
      break;
    case 'x-form':
      profile.connect = formConnect; profile.disconnect = noop;
      profile.methods._attachFieldListeners = noop;
      profile.methods._onReset = function() { return event(this, 'reset', { data: this.getFormData() }); };
      profile.methods._onSubmit = function(e) {
        e?.preventDefault();
        const invalidFields = Array.from(this._elements).filter((control) => typeof control.checkValidity === 'function' && !control.checkValidity()).map((control) => control.getAttribute('name') || '');
        return event(this, invalidFields.length ? 'invalid' : 'submit', invalidFields.length ? { message: 'Form validation failed.', invalidFields } : { data: this.getFormData() });
      };
      profile.methods.getFormData = function() {
        const result = {};
        Array.from(this._elements || []).forEach((control) => {
          const name = control.getAttribute('name'); if (!name || ['__proto__','constructor','prototype'].includes(name)) return;
          if (control.localName === 'x-radio' && !control.checked) return;
          result[name] = ['x-checkbox','x-toggle'].includes(control.localName) ? !!control.checked : control.files ? Array.from(control.files, (file) => getManagedContext(this).captureFile(file)) : control.value;
        }); return result;
      };
      profile.methods.reset = function() { return this._onReset(); };
      break;
    case 'x-menu':
      profile.connect = menuConnect; profile.disconnect = noop;
      profile.methods._updateMenu = function() { this._items = this._collectItems(); };
      profile.methods._syncDisclosureIconControl = noop; profile.methods._applyItemActiveState = noop;
      profile.methods._setActiveItem = function(index, reason) { event(this, 'menu-item-clicked', { index, href: this._resolveItemHref(this._items[index]) || null, source: reason || 'rmt' }); };
      profile.methods._getCurrentPath = () => '';
      break;
    case 'x-masonry':
      profile.prepare = function() { prepareNativeCollection(this, 'masonry'); };
      profile.connect = function() { connectNativeCollection(this, 'masonry'); };
      profile.methods.snapshot = function() { return { apiVersion: '2.0.0', tag, columns: this.getAttribute('columns') || '3', gap: this.getAttribute('gap') || '1.5rem', order: this._nativeOrder?.slice() || (this._nativeItems || []).map(item => item.key), collapsed: this._nativeCollapsed?.slice() || (this._nativeItems || []).filter(item => item.collapsed).map(item => item.key) }; };
      profile.disconnect = noop;
      profile.attribute = function() { this._applyAttributes(); projectNativeCollection(this, 'masonry'); };
      profile.methods._renderItems = function() { projectNativeCollection(this, 'masonry'); };
      profile.methods._enableDragAndDrop = noop; profile.methods._observeThemeChange = noop;
      break;
    case 'x-tabs':
      profile.prepare = function() { prepareNativeCollection(this, 'tabs'); };
      profile.connect = function() { connectNativeCollection(this, 'tabs'); };
      profile.disconnect = noop;
      profile.attribute = function(name) { this._syncOrientation(); if (name === 'selected' && this._nativeItems?.length) { const index = Number(this.getAttribute('selected')); if (!Number.isInteger(index) || !this._nativeItems[index]) throw new RangeError('Invalid selected tab index'); this._nativeSelectedKey = this._nativeItems[index].key; } projectNativeCollection(this, 'tabs'); };
      profile.methods._renderTabs = function() { projectNativeCollection(this, 'tabs'); };
      profile.methods._updateVisibility = noop;
      profile.methods.selectTab = function(index) { const item = this._nativeItems?.[index]; if (!Number.isInteger(index) || !item) throw new RangeError('Invalid tab index'); return event(this, 'tab-selection-requested', { key: item.key }); };
      break;
    case 'x-link':
      profile.connect = function() { this._syncAnchorState(); listen(this, this._anchor, 'click', (e) => { e.preventDefault(); if (!this._isDisabled()) event(this, 'before-navigate', { href: this.getAttribute('href') || '', source: 'x-link', navigationKind: this.getAttribute('navigation') || 'client' }); }); };
      profile.disconnect = noop; profile.methods._updateActive = noop;
      break;
    case 'x-alert': case 'x-toast':
      if (tag === 'x-alert') profile.methods.snapshot = function() { return { apiVersion: '2.0.0', tag, ...this._getDetail('snapshot') }; };
      profile.connect = toastConnect; profile.disconnect = function() { clearTimeout(this._timeout); };
      profile.attribute = function() { this._render(); clearTimeout(this._timeout); if (!this.hasAttribute('hidden') && (tag === 'x-alert' || this.hasAttribute('open'))) this._scheduleDismiss(); };
      profile.methods.dismiss = toastDismiss; profile.methods._syncState = noop;
      break;
    case 'x-dialog': case 'x-modal':
      profile.prepare = function(context) { this._prepareManagedDialog?.(context); };
      profile.connect = function() { dialogRender.call(this); listen(this, this, 'keydown', this._onDocumentKeyDown); };
      profile.attribute = dialogRender; profile.disconnect = noop;
      profile.methods._syncFromRuntime = dialogRender;
      profile.methods.open = function(options) { return dialogIntent.call(this, true, options); };
      profile.methods.close = function(options) { return dialogIntent.call(this, false, options); };
      profile.methods._ensureDocumentPortal = noop; profile.methods._restoreDocumentPortal = noop;
      break;
    case 'x-lightbox':
      profile.connect = function() {
        this._src = this.getAttribute('src') || ''; this._open = this.hasAttribute('open'); this._syncMedia(); this._syncA11y();
        listen(this, this, 'keydown', this._onDocumentKeyDown); overlayLease(this, this._open, true);
      };
      profile.attribute = function() { this._src = this.getAttribute('src') || ''; this._open = this.hasAttribute('open'); this._syncMedia(); this._syncA11y(); overlayLease(this, this._open, true); };
      profile.methods.open = function(src) { return event(this, 'lightbox-opened', { src: typeof src === 'string' ? src : this.getAttribute('src') || '' }); };
      profile.methods.close = function() { return event(this, 'lightbox-closed', { src: this.getAttribute('src') || '' }); };
      profile.methods._ensureDocumentPortal = noop; profile.methods._restoreDocumentPortal = noop;
      profile.methods._focusElement = function() { return requestManaged(this, 'focus.request', { part: 'close' }); };
      profile.methods._restoreFocus = function() { return requestManaged(this, 'focus.request', { restore: true }); };
      break;
    case 'x-spinner':
      profile.prepare = function(context) { this._prepareManagedStyle(context); };
      profile.methods.pause = function() { this.setAttribute('paused', ''); };
      profile.methods.resume = function() { this.removeAttribute('paused'); };
      profile.connect = function() { this._renderSpinner(); this._spinner.setAttribute('aria-busy', String(!this.hasAttribute('paused'))); this._emitSpinnerEvent('spinner-started'); };
      profile.disconnect = function() { this._emitSpinnerEvent('spinner-stopped'); };
      profile.attribute = function(name) { if (['size','color','speed','type'].includes(name)) this._renderSpinner(); if (name === 'paused') this._spinner.style.animationPlayState = this.hasAttribute('paused') ? 'paused' : 'running'; if (name === 'overlay') { this._overlay.style.display = this.hasAttribute('overlay') ? 'flex' : 'none'; overlayLease(this, this.hasAttribute('overlay'), false); } };
      break;
    case 'x-tooltip':
      profile.prepare = function(context) { context.onCleanup(context.onProjection(() => { if (context.isActive() && this.hasAttribute('for') && !tooltipLeaseCurrent(managedLocal(this).tooltipLease)) tooltipBind.call(this, {allowMissing:true}); })); };
      profile.connect = function() {
        this._tooltip.id = ownId(this, 'tooltip'); this._bindAnchor(); this._open = this.hasAttribute('open'); this._tooltip.setAttribute('aria-hidden', String(!this._open));
        listen(this, this, 'keydown', this._onKeyDown);
      };
      profile.attribute = function(name) {
        if (name === 'for' && this.isConnected) this._bindAnchor();
        if (name === 'open') { this._open = this.hasAttribute('open'); this._tooltip.setAttribute('aria-hidden', String(!this._open)); if (this._open) this._updatePosition(); }
        if (name === 'label') { this._tooltip.setAttribute('aria-label', this.label); const lease=managedLocal(this).tooltipLease;if(tooltipLeaseCurrent(lease))lease.describe(this.label || this.textContent || ''); }
      };
      for (const [method, open] of [['show', true], ['hide', false]]) profile.methods[method] = function(options = {}) {
        if (getManagedContext(this).isApplyingUpdate() || ['attribute','initial'].includes(options.source)) { this._open = open; this.toggleAttribute('open', open); this._tooltip.setAttribute('aria-hidden', String(!open)); return; }
        const run = () => event(this, open ? 'tooltip-opened' : 'tooltip-closed', { id: this.id || '', open, source: options.source || 'user', placement: this.getAttribute('placement') || 'top' });
        if (open && !options.immediate && this.delay > 0) { clearTimeout(this._showTimer); this._showTimer = setTimeout(run, this.delay); } else run();
      };
      profile.methods._bindAnchor = tooltipBind;
      profile.methods._unbindAnchor = function() {
        clearTimeout(this._showTimer);clearTimeout(this._hideTimer);
        if(this._positionFrame){this.ownerDocument.defaultView.cancelAnimationFrame(this._positionFrame);this._positionFrame=0;}
        const state = managedLocal(this); state.tooltipUnbind?.();state.tooltipLease=null;
        for (const remove of state.tooltipOwnListeners || []) remove();state.tooltipOwnListeners=[];
        if (this._anchor?.nodeType === 1 && this.shadowRoot.contains(this._anchor)) this._anchor.removeAttribute('aria-describedby');this._anchor=null;
      };
      break;
    case 'x-popover':
      profile.methods.show = function(options = {}) {
        if (getManagedContext(this).isApplyingUpdate() || ['attribute','initial'].includes(options.source)) { this._open = true; this.toggleAttribute('open', true); this._syncA11y(); overlayLease(this, true, this.modal); }
        else event(this, 'popover-opened', { id: this.id || '', open: true, source: options.source || 'user', placement: this.getAttribute('placement') || 'bottom', modal: this.modal });
      };
      profile.methods.hide = function(options = {}) {
        if (getManagedContext(this).isApplyingUpdate() || ['attribute','initial'].includes(options.source)) { this._open = false; this.toggleAttribute('open', false); this._syncA11y(); overlayLease(this, false, this.modal); }
        else event(this, 'popover-closed', { id: this.id || '', open: false, source: options.source || 'user', placement: this.getAttribute('placement') || 'bottom', modal: this.modal });
      };
      break;
    case 'x-drawer':
      for (const [method, open] of [['openDrawer', true], ['closeDrawer', false]]) profile.methods[method] = function(options = {}) {
        if (getManagedContext(this).isApplyingUpdate() || ['attribute','initial'].includes(options.source)) { this._open = open; this.toggleAttribute('open', open); this._syncA11y(); overlayLease(this, open, this.modal); }
        else event(this, open ? 'drawer-opened' : 'drawer-closed', { id: this.id || '', open, source: options.source || 'user', placement: this.getAttribute('placement') || 'right', modal: this.modal });
      };
      profile.methods._syncThemeAttribute = noop; profile.methods._observeThemeAttribute = noop;
      profile.methods._resolveFocusReturnTarget = () => null;
      break;
    case 'x-progress':
      profile.methods.snapshot = function() { return { apiVersion: '2.0.0', tag, value: this.value, max: this.max, percent: this.percent, indeterminate: this.indeterminate, busy: this.busy }; };
      break;
    case 'x-status':
      profile.methods.snapshot = function() { return { apiVersion: '2.0.0', tag: 'x-status', ...this.state }; };
      profile.methods._onDismiss = function() { return event(this, 'status-dismissed', this.state); };
      break;
    case 'x-keymap':
      profile.attribute = function() { this.render(); if (this.isOpen()) this._activate(); else this._deactivate(); };
      profile.methods.open = function() { return event(this, 'xkeymap-open', { open: true }); };
      profile.methods.close = function(reason = 'user') { return event(this, 'xkeymap-close', { open: false, reason }); };
      profile.methods._activate = function() { overlayLease(this, true, true); listen(this, this, 'keydown', this._onKeydown, true); requestManaged(this, 'focus.request', { part: 'surface' }); };
      profile.methods._deactivate = function() { overlayLease(this, false, true); };
      profile.methods._model = function() { return { groups: [{ id: 'general', commands: this.entries }] }; };
      break;
    case 'x-summary':
      profile.connect = function() { this._details.open = this.hasAttribute('open'); listen(this, this._details, 'toggle', () => { const wanted = this._details.open, projected = this.hasAttribute('open'); if (wanted !== projected) { event(this, wanted ? 'open' : 'close', { open: wanted }); this._details.open = projected; } }); listen(this, this._summary, 'keydown', this._onSummaryKeydown); };
      profile.disconnect = noop;
      profile.attribute = function() { this._details.open = this.hasAttribute('open'); };
      profile.methods.open = function() { return event(this, 'open', { open: true }); };
      profile.methods.close = function() { return event(this, 'close', { open: false }); };
      profile.methods.toggle = function() { const open = !this.hasAttribute('open'); return event(this, open ? 'open' : 'close', { open }); };
      break;
    case 'x-type':
      profile.prepare = function(context) { context.onCleanup(context.onProjection(() => { if (context.isActive()) { this._managedTypingCycle = (this._managedTypingCycle || 0) + 1; this._typing = false; this._start(); } })); };
      profile.attribute = function() { this._initAttributes(); };
      profile.connect = function() {
        this._initAttributes(); this._applyStyle(); this._textSpan.style.whiteSpace = 'pre'; this._cursorSpan.textContent = this._cursorChar;
        this.shadowRoot.append(this._textSpan); if (this._blinking) this.shadowRoot.append(this._cursorSpan); else this._cursorSpan.remove();
        this._managedTypingCycle = (this._managedTypingCycle || 0) + 1; this._typing = false; this._paused = false; this._start();
      };
      profile.disconnect = function() { this.pause(); this._managedTypingCycle = (this._managedTypingCycle || 0) + 1; this._typing = false; };
      break;
    case 'x-writer':
      profile.connect = writerConnect; profile.disconnect = noop;
      profile.methods.getMarkdown = function() {
        const value = requestManaged(this, 'writer.markdown', { html: this.getHTML() });
        if (typeof value !== 'string') throw new TypeError('The local writer markdown port must return a string');
        return value;
      };
      profile.methods.dispatchChangeEvent = function() { this._sanitizeManagedEditor(); if (!getManagedContext(this).isActive() || getManagedContext(this).isApplyingUpdate()) return false; return event(this, 'writer:change', { html: this.getHTML(), markdown: this.getMarkdown(), plain: this.getText(), source: 'rmt' }); };
      profile.methods.save = async function(autosave = false) { try { const result = await requestManaged(this, 'writer.save', { html: this.getHTML(), markdown: this.getMarkdown(), plain: this.getText(), autosave }); if (getManagedContext(this).isActive()) event(this, 'writer:save', result); return result; } catch (error) { event(this, 'writer:error', { error: { name: error.name, message: error.message } }); throw error; } };
      for (const [name, format] of [['exportHTML','html'],['exportMarkdown','markdown'],['doHTMLExport','html'],['doMarkdownExport','markdown']]) profile.methods[name] = function(filename) { return requestManaged(this, 'writer.export', { format, content: format === 'html' ? this.getHTML() : this.getMarkdown(), filename: typeof filename === 'string' ? filename : `export.${format === 'html' ? 'html' : 'md'}` }); };
      profile.methods.loadMarkdownLib = function() { throw new Error('Managed writer uses an explicit local markdown port'); };
      profile.methods.loadFromLocalStorage = function() { throw new Error('Managed writer storage requires the RMT writer port'); };
      profile.methods.initAutosave = function() { throw new Error('Schedule autosave through the RMT owner'); };
      break;
    case 'x-player':
      profile.connect = playerConnect;
      profile.methods._setupChooser = function() {
        const container = this.shadowRoot.querySelector('#chooser-container'); container.replaceChildren();
        if (!this.hasAttribute('media-chooser') || this.getAttribute('media-chooser') === 'false') return;
        const select = this.ownerDocument.createElement('select');
        for (const source of this.querySelectorAll('source')) { const option = this.ownerDocument.createElement('option'); option.value = source.getAttribute('src') || ''; option.textContent = source.getAttribute('label') || option.value; select.append(option); }
        select.value = this.getAttribute('src') || '';
        select.addEventListener('change', () => event(this, 'player-source-requested', { src: select.value })); container.append(select);
      };
      profile.methods._setupDownload = function() { const container = this.shadowRoot.querySelector('#download-container'); container.replaceChildren(); if (this.getAttribute('downloadable') === 'true') { const button = this.ownerDocument.createElement('button'); button.textContent = 'Download'; button.type = 'button'; button.addEventListener('click', () => requestManaged(this, 'media.request', { operation: 'download', src: this.getAttribute('src') || '' })); container.append(button); } };
      profile.methods._requestFullscreenFor = function() { return requestManaged(this, 'media.request', { operation: 'fullscreen', enabled: true }); };
      profile.methods._exitFullscreenDocument = function() { return requestManaged(this, 'media.request', { operation: 'fullscreen', enabled: false }); };
      profile.methods.playMedia = async function() { try { await this._media.play(); return { playing: true }; } catch (error) { mediaError.call(this, error, 'play'); throw error; } };
      profile.methods.pauseMedia = function() { this._media?.pause(); return { playing: false }; };
      break;
  }
  return profile;
}
