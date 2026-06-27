(function defineXKeymap(globalTarget) {
  const BaseHTMLElement = globalTarget.HTMLElement || class {};
  const XCommandApi = globalTarget.XCommand || null;

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
  }

  function readEntriesFromAttribute(element) {
    try {
      const raw = element.getAttribute('entries');
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      return [];
    }
  }

  class XKeymap extends BaseHTMLElement {
    static get observedAttributes() {
      return ['open', 'title', 'entries', 'locale', 'platform'];
    }

    static get xtendComponentContract() {
      return {
        schema: 'xtend.component.contract.v2',
        tag: 'x-keymap',
        status: 'implemented',
        surface: 'app-shell-modal',
        contracts: ['xtend.xkeymap.surface-contract.v1', 'xtend.xcommand.kernel-contract.v1'],
        themeParts: ['backdrop', 'surface', 'group', 'command', 'key'],
        accessibility: { role: 'dialog', ariaModal: true, escapeCloses: true, focusReturn: true }
      };
    }

    constructor() {
      super();
      this._entries = [];
      this._previousFocus = null;
      this._onKeydown = (event) => {
        if (event.key === 'Escape') this.close('escape');
      };
      if (this.attachShadow) this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      this._entries = this._entries.length ? this._entries : readEntriesFromAttribute(this);
      this.render();
      if (this.isOpen()) this._activate();
    }

    disconnectedCallback() {
      this._deactivate();
    }

    attributeChangedCallback() {
      this._entries = readEntriesFromAttribute(this);
      this.render();
      if (this.isOpen()) this._activate(); else this._deactivate();
    }

    set entries(value) {
      this._entries = Array.isArray(value) ? value : [];
      this.render();
    }

    get entries() {
      return this._entries || [];
    }

    isOpen() {
      return this.hasAttribute('open');
    }

    open(entries) {
      if (Array.isArray(entries)) this.entries = entries;
      this.setAttribute('open', '');
      this._activate();
    }

    close(reason = 'api') {
      this.removeAttribute('open');
      this._deactivate();
      this.dispatchEvent(new CustomEvent('xkeymap-close', { detail: { reason }, bubbles: true, composed: true }));
    }

    _activate() {
      if (!globalTarget.document) return;
      this._previousFocus = this._previousFocus || globalTarget.document.activeElement;
      globalTarget.document.addEventListener('keydown', this._onKeydown, true);
      const surface = this.shadowRoot && this.shadowRoot.querySelector('.x-keymap__surface');
      if (surface && typeof surface.focus === 'function') surface.focus();
    }

    _deactivate() {
      if (globalTarget.document) globalTarget.document.removeEventListener('keydown', this._onKeydown, true);
      if (this._previousFocus && typeof this._previousFocus.focus === 'function') this._previousFocus.focus();
      this._previousFocus = null;
    }

    _model() {
      if (XCommandApi && typeof XCommandApi.createXKeymapModel === 'function') {
        return XCommandApi.createXKeymapModel(this.entries, { locale: this.getAttribute('locale') || 'en', platform: this.getAttribute('platform') || undefined });
      }
      return { groups: [{ id: 'general', commands: this.entries }] };
    }

    render() {
      if (!this.shadowRoot) return;
      const title = this.getAttribute('title') || 'Keyboard shortcuts';
      const model = this._model();
      const groups = (model.groups || []).map((group) => `
        <section class="x-keymap__group" part="group">
          <h3 class="x-keymap__group-title" part="group-title">${escapeHtml(group.id)}</h3>
          <ul class="x-keymap__commands" part="commands">
            ${(group.commands || []).map((command) => `
              <li class="x-keymap__command" part="command">
                <span class="x-keymap__icon" part="icon" aria-hidden="true">${escapeHtml(command.icon || '⌨')}</span>
                <span class="x-keymap__label" part="label">${escapeHtml(command.label || command.id)}</span>
                <span class="x-keymap__keys" part="keys">${(command.sequence || []).map((key) => `<kbd class="x-keymap__key" part="key">${escapeHtml(key)}</kbd>`).join('')}</span>
              </li>
            `).join('')}
          </ul>
        </section>
      `).join('');

      this.shadowRoot.innerHTML = `
        <style>
          :host { display: ${this.isOpen() ? 'block' : 'none'}; }
          .x-keymap__backdrop { position: fixed; inset: 0; background: var(--xkeymap-backdrop, rgba(15, 23, 42, .45)); z-index: var(--xkeymap-z-index, 1000); }
          .x-keymap__surface { position: fixed; inset: 10vh max(1rem, calc((100vw - 44rem) / 2)) auto; max-height: 80vh; overflow: auto; padding: var(--xkeymap-padding, 1.25rem); border: 1px solid var(--xkeymap-border, rgba(148, 163, 184, .35)); border-radius: var(--xkeymap-radius, 1rem); background: var(--xkeymap-surface, Canvas); color: var(--xkeymap-color, CanvasText); box-shadow: var(--xkeymap-shadow, 0 24px 80px rgba(15,23,42,.24)); z-index: calc(var(--xkeymap-z-index, 1000) + 1); }
          .x-keymap__title { margin: 0 0 1rem; font: var(--xkeymap-title-font, 600 1.125rem/1.4 system-ui); }
          .x-keymap__group { margin-block: 1rem; }
          .x-keymap__group-title { color: var(--xkeymap-group-title-color, currentColor); font: var(--xkeymap-group-title-font, 600 .875rem/1.3 system-ui); text-transform: uppercase; letter-spacing: .06em; }
          .x-keymap__commands { list-style: none; margin: 0; padding: 0; display: grid; gap: .5rem; }
          .x-keymap__command { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: .75rem; }
          .x-keymap__key { margin-inline-start: .25rem; padding: .125rem .45rem; border-radius: .375rem; background: var(--xkeymap-key-bg, color-mix(in srgb, currentColor 10%, transparent)); color: var(--xkeymap-key-color, currentColor); font: var(--xkeymap-key-font, 600 .8rem/1.4 ui-monospace, monospace); }
          .x-keymap__close { float: right; border: 0; background: transparent; color: inherit; font: inherit; cursor: pointer; }
        </style>
        <div class="x-keymap__backdrop" part="backdrop" aria-hidden="true"></div>
        <div class="x-keymap__surface" part="surface" role="dialog" aria-modal="true" tabindex="-1" aria-labelledby="xkeymap-title">
          <button class="x-keymap__close" part="close" type="button" aria-label="Close">×</button>
          <h2 id="xkeymap-title" class="x-keymap__title" part="title">${escapeHtml(title)}</h2>
          ${groups || '<p part="empty">No keyboard shortcuts registered.</p>'}
        </div>
      `;
      const closeButton = this.shadowRoot.querySelector('.x-keymap__close');
      if (closeButton) closeButton.addEventListener('click', () => this.close('button'));
      const backdrop = this.shadowRoot.querySelector('.x-keymap__backdrop');
      if (backdrop) backdrop.addEventListener('click', () => this.close('backdrop'));
    }
  }

  if (globalTarget.customElements && !globalTarget.customElements.get('x-keymap')) {
    globalTarget.customElements.define('x-keymap', XKeymap);
  }

  if (typeof module === 'object' && module.exports) module.exports = { XKeymap };
})(typeof globalThis !== 'undefined' ? globalThis : this);
