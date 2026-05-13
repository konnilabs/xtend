import { xstate } from './xstate.js';

class XCode extends HTMLElement {
  static get observedAttributes() {
    return ['lang'];
  }

  static get xtendComponentContract() {
    return {
      schema: "xtend.component.contract.v2",
      tag: "x-code",
      profiles: ["display"],
      maturity: "ux-ready"
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: "xtend.rmt.component-contract.v1",
      adapter: "xtend.component",
      schedule: "component.idle.hydrate",
      kernelBoundary: "no-rmt-kernel-import-of-xtend-types"
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: "xtend.a11y.screenreader-signals.v1",
      role: "region",
      accessibleName: "Code sample",
      focusStrategy: "copy-button-first"
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: "xtend.performance.component-profile.v1",
      performanceProfile: "display",
      budgetClass: "display-content",
      lane: "idle",
      hydrationPolicy: "idle",
      criticalMeasurements: ["xtend.code.render", "xtend.code.copy"],
      idleOrBackgroundAllowed: true
    };
  }

  static get xtendLayoutDisplayMediaUxProfile() {
    return {
      schema: "xtend.component.layout-display-media-ux-profile.v1",
      componentRef: "x-code",
      family: "display-code",
      role: "region",
      contentKind: "code-block",
      responsiveStrategy: "pre-wrap-overflow-contained",
      lazyPolicy: "idle-hydrate",
      overflowPolicy: "internal-scroll",
      aspectRatio: "content-driven",
      signatureDesign: {
        note: "Readable enterprise code surface with crisp copy control, contained overflow and themeable monospace personality.",
        tokenStrategy: "layout tokens back code surface, text, border, radius, spacing, typography, focus, media radius and elevation.",
        themeExpectation: "documentation, IDE-like and corporate design themes can replace the code surface without DOM changes."
      },
      events: ["code-copied"],
      commands: ["render", "copy", "snapshot"],
      stateKey: "xcode-state-<id>",
      schedule: "component.idle.hydrate",
      fabric: { lane: "idle", a11yLane: "a11y", diagnosticsLane: "diagnostics", api: "@xtend-fabric" },
      rmt: { adapter: "xtend.component", kernelBoundary: "no-rmt-kernel-import-of-xtend-types" }
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._unsubscribeState = null;
    this._lightDomObserver = null;
    this._pendingHydration = false;
    this._suppressLightDomObserver = false;
  }

  connectedCallback() {
    // Eindeutige ID für State-Management
    if (!this.id) this.id = `xcode-${Math.random().toString(36).slice(2, 10)}`;
    this.hydrate();
    this._observeLightDom();

    // State-Änderungen abonnieren (z.B. externes Setzen von Code oder Sprache)
    this._unsubscribeState = xstate.subscribe((key, value) => {
      if (key === `xcode-state-${this.id}` && typeof value === "object") {
        if (typeof value.lang === "string" && value.lang !== this.getAttribute('lang')) {
          this.setAttribute('lang', value.lang);
        }
        if (typeof value.code === "string" && value.code !== this._getRawCode()) {
          this._setRawCode(value.code);
          this._render();
        }
      }
    });
  }

  disconnectedCallback() {
    if (this._unsubscribeState) this._unsubscribeState();
    if (this._lightDomObserver) {
      this._lightDomObserver.disconnect();
      this._lightDomObserver = null;
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'lang' && oldValue !== newValue) {
      if (!this.isConnected) return;
      this._render();
      // State aktualisieren
      if (this.id) {
        xstate.set(`xcode-state-${this.id}`, {
          lang: newValue,
          code: this._getRawCode()
        });
      }
    }
  }

  _getTemplate() {
    const templates = Array.from(this.querySelectorAll('template'));
    if (!templates.length) return null;
    return templates.find((template) => this._readTemplateCode(template)) || templates[0];
  }

  _readTemplateCode(tpl) {
    if (!tpl) return '';
    if (tpl.getAttribute('data-x-code-mode') === 'text') {
      const textCode = tpl.content ? tpl.content.textContent : tpl.textContent;
      return String(textCode || '').trim();
    }
    return tpl.innerHTML.trim();
  }

  _observeLightDom() {
    if (this._lightDomObserver || typeof MutationObserver !== 'function') return;
    this._lightDomObserver = new MutationObserver(() => {
      if (this._suppressLightDomObserver) return;
      this._scheduleHydration();
    });
    this._lightDomObserver.observe(this, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  _scheduleHydration() {
    if (this._pendingHydration) return;
    this._pendingHydration = true;
    const commit = () => {
      this._pendingHydration = false;
      if (this.isConnected) this.hydrate();
    };
    if (typeof queueMicrotask === 'function') queueMicrotask(commit);
    else Promise.resolve().then(commit);
  }

  hydrate() {
    this._render();
    if (this.id) {
      xstate.set(`xcode-state-${this.id}`, {
        lang: this.getAttribute('lang') || 'text',
        code: this._getRawCode(),
        hydrated: true
      });
    }
    return this.snapshot();
  }

  _getRawCode() {
    let tpl = this._getTemplate();
    if (!tpl) return '';
    return this._readTemplateCode(tpl);
  }

  _setRawCode(newCode) {
    let tpl = this._getTemplate();
    if (!tpl) {
      tpl = document.createElement('template');
      this.appendChild(tpl);
    }
    const code = newCode == null ? '' : String(newCode);
    if (tpl.getAttribute('data-x-code-mode') === 'text') {
      tpl.innerHTML = '';
      tpl.content.appendChild(document.createTextNode(code));
      return;
    }
    tpl.innerHTML = code;
  }

  _render() {
    this._suppressLightDomObserver = true;
    // Always wrap content in a <template> (virtual, not rendered)
    let tpl = this._getTemplate();
    if (!tpl) {
      // Create a template and move all child nodes (außer <template>) hinein
      tpl = document.createElement('template');
      const nodes = Array.from(this.childNodes).filter(n => n.nodeName !== 'TEMPLATE');
      while (nodes.length) {
        tpl.content.appendChild(nodes.shift());
      }
      this.appendChild(tpl);
    }
    Array.from(this.querySelectorAll('template')).forEach((template) => {
      if (template !== tpl) template.remove();
    });
    const rawCode = this._readTemplateCode(tpl);
    const lang = this.getAttribute('lang') || 'text';
    function escapeHtml(str) {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/`/g, '&#96;');
    }
    const escapedCode = escapeHtml(rawCode);
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          width: 100%;
          max-width: var(--xtend-layout-content-max, 100%);
          min-width: 0;
          box-sizing: border-box;
          --x-code-grid-min: var(--xtend-layout-grid-min, minmax(0, 1fr));
          --x-code-gap: var(--xtend-layout-gap, 0.75rem);
          font-family: var(--x-code-font-family, var(--xtend-layout-font-family, 'Inter', 'Fira Mono', 'Menlo', 'Consolas', monospace));
          background: var(--x-code-bg, var(--xtend-layout-surface, var(--docs-code-bg, #10131a)));
          color: var(--x-code-text, var(--xtend-layout-text, #f8fafc));
          border-radius: var(--x-code-radius, var(--xtend-layout-radius, 1.2em));
          box-shadow: var(--x-code-shadow, var(--xtend-layout-elevation, 0 4px 24px 0 rgba(40,60,120,0.10), 0 1.5px 6px 0 rgba(40,60,120,0.08)));
          backdrop-filter: var(--x-code-backdrop-filter, blur(14px) saturate(1.1));
          border: var(--x-code-border-width, 1.5px) solid var(--x-code-border, var(--xtend-layout-border-color, rgba(255,255,255,0.10)));
          overflow: auto;
          overflow-x: auto;
          padding: var(--x-code-padding, var(--xtend-layout-spacing, 1.2em 1.5em 1.2em 1.5em));
          margin: var(--x-code-margin, 0.5em 0);
          transition: box-shadow 0.22s cubic-bezier(.4,0,.2,1), background 0.22s;
          overflow-wrap: anywhere;
        }
        pre {
          max-width: 100%;
          min-width: 0;
          margin: 0;
          background: none;
          color: inherit;
          font-size: var(--x-code-font-size, var(--xtend-layout-font-size, 1em));
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-word;
          overflow-wrap: anywhere;
          border: none;
          padding: 0;
        }
        code {
          background: none;
          color: inherit;
          font-family: inherit;
          font-size: inherit;
        }
        .copy-btn {
          position: absolute;
          top: 1.1em;
          right: 1.1em;
          background: var(--x-code-copy-bg, var(--xtend-layout-control-surface, rgba(255,255,255,0.10)));
          border: var(--x-code-copy-border, 1px solid var(--xtend-layout-border-color, transparent));
          border-radius: var(--x-code-copy-radius, var(--xtend-layout-media-radius, 50%));
          width: 2.2em;
          height: 2.2em;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transition: background 0.18s, color 0.18s, transform 0.15s;
          color: var(--x-code-copy-color, var(--xtend-layout-control-text, #fff));
          z-index: 2;
        }
        .copy-btn:focus-visible {
          outline: var(--xtend-layout-focus-ring, 2.5px solid var(--focus-color, #4fc3f7));
          outline-offset: 2px;
          z-index: 3;
        }
        .copy-btn:hover {
          background: var(--x-code-copy-hover-bg, rgba(79,195,247,0.18));
          color: var(--primary, #4fc3f7);
          transform: scale(1.08);
        }
        .copy-btn svg {
          width: 1.2em;
          height: 1.2em;
          pointer-events: none;
        }
        .copy-btn.success {
          background: rgba(40,180,99,0.18);
          color: #27ae60;
        }
        @media (max-width: 600px) {
          :host { padding: 0.7em 0.5em 0.7em 0.7em; }
          .copy-btn { top: 0.5em; right: 0.5em; }
        }
        @media (prefers-reduced-motion: reduce) {
          :host, .copy-btn { transition: none !important; }
        }
        @media (forced-colors: active) {
          :host, .copy-btn {
            border: 1px solid CanvasText;
          }
        }
      </style>
      <button class="copy-btn" part="copy control" aria-label="Code kopieren" title="Code kopieren">
        <svg part="copy-icon control icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2.5"/><rect x="2" y="2" width="13" height="13" rx="2.5"/></svg>
      </button>
      <pre part="root pre"><code part="code" class="language-${lang}">${escapedCode}</code></pre>
    `;
    const copyBtn = this.shadowRoot.querySelector('.copy-btn');
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(rawCode);
        copyBtn.classList.add('success');
        copyBtn.setAttribute('aria-label', 'Kopiert!');
        setTimeout(() => {
          copyBtn.classList.remove('success');
          copyBtn.setAttribute('aria-label', 'Code kopieren');
        }, 1500);
        // State aktualisieren (optional: z.B. für Kopier-Status)
        if (this.id) {
          xstate.set(`xcode-state-${this.id}`, {
            lang: this.getAttribute('lang') || 'text',
            code: rawCode,
            copied: true
          });
        }
        this.dispatchEvent(new CustomEvent('code-copied', {
          detail: this.snapshot(),
          bubbles: true,
          composed: true
        }));
      } catch (err) {
        console.error('Failed to copy code:', err);
        copyBtn.setAttribute('aria-label', 'Fehler beim Kopieren');
      }
    });
    const releaseObserver = () => {
      this._suppressLightDomObserver = false;
    };
    if (typeof queueMicrotask === 'function') queueMicrotask(releaseObserver);
    else Promise.resolve().then(releaseObserver);
  }

  snapshot() {
    return {
      schema: "xtend.component.layout-display-media-snapshot.v1",
      componentRef: "x-code",
      stateKey: `xcode-state-${this.id}`,
      schedule: "component.idle.hydrate",
      lang: this.getAttribute('lang') || 'text',
      codeLength: this._getRawCode().length
    };
  }
}

customElements.define('x-code', XCode);
