import { xstate } from './xstate.js';

class XLightbox extends HTMLElement {
  static get observedAttributes() {
    return ['src', 'open', 'alt'];
  }

  static get xtendComponentContract() {
    return {
      schema: 'xtend.component.contract.v2',
      tag: 'x-lightbox',
      profiles: ['overlay', 'media'],
      maturity: 'ux-ready'
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: 'xtend.rmt.component-contract.v1',
      adapter: 'xtend.component',
      schedule: 'media.lazy.load',
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: 'xtend.a11y.screenreader-signals.v1',
      role: 'dialog',
      accessibleName: 'Lightbox',
      focusStrategy: 'close-button-return-focus'
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: 'xtend.performance.component-profile.v1',
      performanceProfile: 'media',
      budgetClass: 'media-overlay',
      lane: 'media',
      hydrationPolicy: 'lazy',
      criticalMeasurements: ['xtend.media.lazyLoad', 'xtend.lightbox.open'],
      idleOrBackgroundAllowed: true
    };
  }

  static get xtendLayoutDisplayMediaUxProfile() {
    return {
      schema: 'xtend.component.layout-display-media-ux-profile.v1',
      componentRef: 'x-lightbox',
      family: 'media-lightbox',
      role: 'dialog',
      contentKind: 'image-preview-overlay',
      responsiveStrategy: 'viewport-bounded-media',
      lazyPolicy: 'lazy-media-load',
      overflowPolicy: 'viewport-overlay-contained',
      aspectRatio: 'media-contain',
      events: ['lightbox-opened', 'lightbox-closed'],
      commands: ['lazy-load', 'expand', 'collapse', 'snapshot'],
      stateKey: 'xlightbox-open-<id>',
      schedule: 'media.lazy.load',
      fabric: { lane: 'media', a11yLane: 'a11y', diagnosticsLane: 'diagnostics', api: '@xtend-fabric' },
      rmt: { adapter: 'xtend.component', kernelBoundary: 'no-rmt-kernel-import-of-xtend-types' }
    };
  }

  constructor() {
    super();
    this._open = false;
    this._src = '';
    this._closeTimer = null;
    this._unsubscribeState = null;
    this._previouslyFocusedElement = null;
    this._synchronizingAttribute = false;
    this._portalParent = null;
    this._portalNextSibling = null;
    this._isPortaled = false;
    this._isMovingPortal = false;
    this._onDocumentKeyDown = this._handleKeyDown.bind(this);

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --xlightbox-overlay-bg: var(--lightbox-bg, var(--xtend-overlay-bg, rgba(0, 0, 0, 0.82)));
          --xlightbox-blur: var(--lightbox-blur, var(--xtend-glass-blur, 18px));
          --xlightbox-padding: var(--lightbox-padding, clamp(0.75rem, 2vw, 2rem));
          --xlightbox-radius: var(--lightbox-radius, var(--xtend-radius, 0.75rem));
          --xlightbox-shadow: var(--lightbox-shadow, 0 28px 84px rgba(0, 0, 0, 0.45));
          --xlightbox-close-bg: var(--lightbox-close-bg, rgba(255, 255, 255, 0.12));
          --xlightbox-close-color: var(--lightbox-close-color, #ffffff);
          --xlightbox-close-hover-bg: var(--lightbox-close-hover-bg, rgba(255, 255, 255, 0.2));
          --xlightbox-close-hover-color: var(--lightbox-close-hover-color, #ffffff);
          --xlightbox-focus-outline: var(--lightbox-focus-outline, var(--xtend-focus-outline, 2px solid #4fc3f7));
          display: inline-block;
          font-family: var(--xtend-font-family, 'Inter', 'Segoe UI', Arial, sans-serif);
        }
        .trigger {
          display: inline-flex;
        }
        .overlay {
          position: fixed;
          inset: 0;
          z-index: var(--surface-overlay-z, 2147483646);
          display: none;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          width: 100vw;
          min-height: 100vh;
          min-height: 100dvh;
          padding: var(--xlightbox-padding);
          overflow: hidden;
          background: var(--xlightbox-overlay-bg);
          backdrop-filter: blur(var(--xlightbox-blur));
          animation: fadeInOverlay 0.18s ease-out;
        }
        :host([open]) .overlay {
          display: flex;
        }
        .overlay[hidden] {
          display: none !important;
        }
        .content {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          max-width: 100%;
          max-height: 100%;
          border-radius: var(--xlightbox-radius);
          box-shadow: var(--xlightbox-shadow);
          animation: fadeContentIn 0.18s ease-out;
        }
        .content img {
          display: block;
          width: auto;
          height: auto;
          max-width: calc(100vw - var(--xlightbox-padding) - var(--xlightbox-padding));
          max-height: calc(100vh - var(--xlightbox-padding) - var(--xlightbox-padding));
          max-height: calc(100dvh - var(--xlightbox-padding) - var(--xlightbox-padding));
          object-fit: contain;
          border-radius: var(--xlightbox-radius);
          background: #050506;
        }
        .content.closing {
          animation: fadeContentOut 0.16s ease-in forwards;
        }
        .close-btn {
          position: absolute;
          top: clamp(0.6rem, 1.2vw, 1rem);
          right: clamp(0.6rem, 1.2vw, 1rem);
          z-index: 2;
          width: 2.5rem;
          height: 2.5rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 999px;
          background: var(--xlightbox-close-bg);
          color: var(--xlightbox-close-color);
          cursor: pointer;
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
          transition: background 0.16s ease, color 0.16s ease, transform 0.16s ease;
        }
        .close-btn:hover {
          background: var(--xlightbox-close-hover-bg);
          color: var(--xlightbox-close-hover-color);
          transform: translateY(-1px);
        }
        .close-btn:focus-visible {
          outline: var(--xlightbox-focus-outline);
          outline-offset: 2px;
        }
        .close-btn svg {
          width: 1.1rem;
          height: 1.1rem;
          stroke: currentColor;
        }
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeContentIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeContentOut {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.98); }
        }
        @media (prefers-reduced-motion: reduce) {
          .overlay,
          .content,
          .close-btn {
            animation: none !important;
            transition: none !important;
          }
        }
        @media (forced-colors: active) {
          .overlay,
          .content,
          .close-btn {
            forced-color-adjust: auto;
          }
          .overlay {
            background: Canvas;
          }
          .content {
            border: 1px solid CanvasText;
            box-shadow: none;
          }
          .close-btn {
            color: ButtonText;
            background: ButtonFace;
            border: 1px solid ButtonText;
            box-shadow: none;
          }
          .close-btn:focus-visible {
            outline-color: Highlight;
          }
        }
      </style>
      <span class="trigger" part="trigger"><slot name="trigger"></slot></span>
      <div class="overlay" part="overlay root" role="dialog" aria-modal="true" aria-hidden="true" aria-label="Lightbox" hidden inert>
        <div class="content" part="content">
          <button class="close-btn" part="close control" type="button" aria-label="Schliessen">
            <svg part="close-icon control icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.75 7.75L16.25 16.25M16.25 7.75L7.75 16.25" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"></path>
            </svg>
          </button>
          <img part="media" src="" alt="">
        </div>
      </div>
    `;

    this._trigger = this.shadowRoot.querySelector('.trigger');
    this._triggerSlot = this.shadowRoot.querySelector('slot[name="trigger"]');
    this._overlay = this.shadowRoot.querySelector('.overlay');
    this._content = this.shadowRoot.querySelector('.content');
    this._img = this.shadowRoot.querySelector('img');
    this._btn = this.shadowRoot.querySelector('.close-btn');

    this._trigger.addEventListener('click', (event) => {
      if (event.defaultPrevented) return;
      this.open();
    });
    this._trigger.addEventListener('button-interaction', (event) => {
      if (event.defaultPrevented) return;
      this.open();
    });
    this._btn.addEventListener('click', () => this.close({ source: 'button' }));
    this._overlay.addEventListener('click', (event) => {
      if (event.target === this._overlay) this.close({ source: 'overlay' });
    });
  }

  connectedCallback() {
    if (this._isMovingPortal) return;
    if (!this.id) this.id = `xlightbox-${Math.random().toString(36).slice(2, 10)}`;

    this._src = this.getAttribute('src') || this._src || '';
    this._syncMedia();
    this._syncA11y();
    document.addEventListener('keydown', this._onDocumentKeyDown);

    if (typeof xstate.subscribe === 'function') {
      this._unsubscribeState = xstate.subscribe((key, value) => {
        if (key !== `xlightbox-open-${this.id}`) return;
        if (value && typeof value === 'object' && value.open && value.src) {
          this.open(value.src, { source: 'xstate' });
        } else if (value === false) {
          this.close({ source: 'xstate', immediate: true });
        }
      }, `xlightbox-open-${this.id}`);
    }

    if (this.hasAttribute('open')) {
      this.open(this._src, { source: 'attribute', silent: true });
    } else {
      this._publishState(false);
    }
  }

  disconnectedCallback() {
    if (this._isMovingPortal) return;
    document.removeEventListener('keydown', this._onDocumentKeyDown);
    if (typeof this._unsubscribeState === 'function') {
      this._unsubscribeState();
      this._unsubscribeState = null;
    }
    if (this._closeTimer) {
      clearTimeout(this._closeTimer);
      this._closeTimer = null;
    }
    this._clearPortalState();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (name === 'src') {
      this._src = newValue || '';
      this._syncMedia();
      return;
    }

    if (name === 'alt') {
      this._syncMedia();
      return;
    }

    if (name === 'open' && !this._synchronizingAttribute && this.isConnected) {
      newValue === null ? this.close({ source: 'attribute' }) : this.open(this._src, { source: 'attribute' });
    }
  }

  open(src = this._src || this.getAttribute('src'), options = {}) {
    const resolvedSrc = this._resolveSrc(src);
    if (!resolvedSrc) return false;

    const wasOpen = this._open;
    if (this._closeTimer) {
      clearTimeout(this._closeTimer);
      this._closeTimer = null;
    }

    this._src = resolvedSrc;
    this._previouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this._ensureDocumentPortal();
    this._open = true;
    this._syncOpenAttribute(true);
    this._syncMedia();
    this._syncA11y();
    this._content.classList.remove('closing');

    if (!wasOpen && !options.silent) {
      this.dispatchEvent(new CustomEvent('lightbox-opened', {
        detail: { src: resolvedSrc },
        bubbles: true,
        composed: true
      }));
    }

    if (options.source !== 'xstate') {
      this._publishState(true);
    }

    queueMicrotask(() => this._focusElement(this._btn));
    return true;
  }

  close(options = {}) {
    if (!this._open && !this.hasAttribute('open')) return false;
    const source = options.source || 'api';
    const complete = () => this._completeClose(source, options);

    if (this._closeTimer) {
      clearTimeout(this._closeTimer);
      this._closeTimer = null;
    }

    if (options.immediate) {
      complete();
      return true;
    }

    this._content.classList.add('closing');
    this._closeTimer = setTimeout(complete, 160);
    return true;
  }

  snapshot() {
    return {
      schema: 'xtend.component.layout-display-media-snapshot.v1',
      componentRef: 'x-lightbox',
      stateKey: `xlightbox-open-${this.id}`,
      schedule: 'media.lazy.load',
      src: this._src || this.getAttribute('src') || '',
      open: this._open
    };
  }

  _completeClose(source, options = {}) {
    this._closeTimer = null;
    const closedSrc = this._src;
    this._content.classList.remove('closing');
    this._restoreFocus();
    this._open = false;
    this._syncOpenAttribute(false);
    this._syncA11y();
    this._img.removeAttribute('src');

    if (source !== 'xstate') {
      this._publishState(false);
    }

    if (!options.silent) {
      this.dispatchEvent(new CustomEvent('lightbox-closed', {
        detail: { src: closedSrc },
        bubbles: true,
        composed: true
      }));
    }

    this._restoreDocumentPortal();
  }

  _handleKeyDown(event) {
    if (event.key === 'Escape' && this._open) {
      this.close({ source: 'escape' });
    }
  }

  _resolveSrc(src) {
    return typeof src === 'string' && src.trim() ? src.trim() : '';
  }

  _syncOpenAttribute(isOpen) {
    this._synchronizingAttribute = true;
    this.toggleAttribute('open', isOpen);
    this._synchronizingAttribute = false;
  }

  _syncMedia() {
    if (!this._img) return;
    const src = this._src || this.getAttribute('src') || '';
    if (this._open && src) {
      this._img.src = src;
    }
    this._img.alt = this.getAttribute('alt') || '';
  }

  _syncA11y() {
    if (!this._overlay) return;
    this._overlay.hidden = !this._open;
    this._overlay.toggleAttribute('inert', !this._open);
    this._overlay.inert = !this._open;
    this._overlay.setAttribute('aria-hidden', this._open ? 'false' : 'true');
    this._syncTriggerA11y();
  }

  _syncTriggerA11y() {
    if (!this._triggerSlot) return;
    this._triggerSlot.assignedElements({ flatten: true }).forEach((element) => {
      if (!(element instanceof HTMLElement)) return;
      element.setAttribute('aria-expanded', this._open ? 'true' : 'false');
      element.setAttribute('aria-controls', `${this.id}-overlay`);
    });
    this._overlay.id = `${this.id}-overlay`;
  }

  _restoreFocus() {
    const focusTarget = this._resolveFocusReturnTarget();
    if (!focusTarget) return;
    this._focusElement(focusTarget);
  }

  _focusElement(element) {
    if (!element || typeof element.focus !== 'function') return;
    try {
      element.focus({ preventScroll: true });
    } catch (error) {
      element.focus();
    }
  }

  _resolveFocusReturnTarget() {
    if (
      this._previouslyFocusedElement &&
      this._previouslyFocusedElement.isConnected &&
      typeof this._previouslyFocusedElement.focus === 'function' &&
      !this._overlay.contains(this._previouslyFocusedElement)
    ) {
      return this._previouslyFocusedElement;
    }
    const triggerCandidate = this._triggerSlot
      ? this._triggerSlot.assignedElements({ flatten: true }).find((element) => element instanceof HTMLElement && typeof element.focus === 'function')
      : null;
    if (triggerCandidate && triggerCandidate.isConnected) {
      return triggerCandidate;
    }
    return document.body instanceof HTMLElement ? document.body : null;
  }

  _publishState(isOpen) {
    if (!this.id || typeof xstate.set !== 'function') return;
    xstate.set(`xlightbox-open-${this.id}`, isOpen ? { open: true, src: this._src } : false);
  }

  _ensureDocumentPortal() {
    if (this._isPortaled || !this.isConnected || !document.body || this.parentNode === document.body) {
      return;
    }

    this._portalParent = this.parentNode;
    this._portalNextSibling = this.nextSibling;
    this._isMovingPortal = true;
    document.body.appendChild(this);
    this._isMovingPortal = false;
    this._isPortaled = true;
    this.setAttribute('data-xtend-portal', 'document-body');
  }

  _restoreDocumentPortal() {
    if (!this._isPortaled) return;

    const parent = this._portalParent;
    const nextSibling = this._portalNextSibling;
    this._isMovingPortal = true;

    if (parent && parent.isConnected) {
      parent.insertBefore(this, nextSibling && nextSibling.parentNode === parent ? nextSibling : null);
    } else if (this.parentNode) {
      this._isMovingPortal = false;
      this.remove();
      this._clearPortalState();
      return;
    }

    this._isMovingPortal = false;
    this._clearPortalState();
  }

  _clearPortalState() {
    this._portalParent = null;
    this._portalNextSibling = null;
    this._isPortaled = false;
    this._isMovingPortal = false;
    this.removeAttribute('data-xtend-portal');
  }
}

if (!customElements.get('x-lightbox')) {
  customElements.define('x-lightbox', XLightbox);
}

(function () {
  function showLightbox(src) {
    let lightbox = document.querySelector('x-lightbox');
    if (!lightbox) {
      lightbox = document.createElement('x-lightbox');
      document.body.appendChild(lightbox);
    }
    lightbox.open(src);
  }

  function bindLightboxImages(root = document) {
    if (!root || typeof root.querySelectorAll !== 'function') return;
    root.querySelectorAll('img[data-xlightbox]').forEach((image) => {
      if (image.hasAttribute('data-xlightbox-bound')) return;
      image.setAttribute('data-xlightbox-bound', '');
      image.addEventListener('click', function () {
        showLightbox(this.currentSrc || this.src);
      });
    });
  }

  if (typeof window !== 'undefined') {
    window.showLightbox = showLightbox;
    window.XLightbox = XLightbox;
    window.addEventListener('DOMContentLoaded', () => bindLightboxImages(document));
    document.addEventListener('xrouter-after-navigate', () => bindLightboxImages(document));
  }

  XLightbox.show = showLightbox;
  XLightbox.bindImages = bindLightboxImages;
})();
