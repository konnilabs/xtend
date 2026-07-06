import { xstate } from './xstate.js';

const XCODE_LANGUAGE_ALIASES = Object.freeze({
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  html: 'markup',
  xml: 'markup',
  svg: 'markup',
  md: 'markdown',
  plaintext: 'text',
  plain: 'text',
  txt: 'text',
  'rmt-vnext': 'rmt',
  xtendrmt: 'rmt'
});

function getGlobalTarget() {
  if (typeof window !== 'undefined') return window;
  if (typeof globalThis !== 'undefined') return globalThis;
  return {};
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;');
}

function escapeAttribute(str) {
  return escapeHtml(str).replace(/\s+/g, '-');
}

function normalizeLanguage(value) {
  const raw = String(value || 'text').trim().toLowerCase();
  return XCODE_LANGUAGE_ALIASES[raw] || raw || 'text';
}

function safeHighlightResult(result, fallbackCode, fallbackLanguage) {
  if (!result || (typeof result.html !== 'string' && typeof result.text !== 'string')) {
    return {
      html: escapeHtml(fallbackCode),
      highlighted: false,
      engine: 'plain-text',
      language: fallbackLanguage
    };
  }
  if (typeof result.text === 'string') {
    return {
      html: escapeHtml(result.text),
      highlighted: false,
      engine: result.engine || 'plain-text',
      language: result.language || fallbackLanguage
    };
  }
  const isTrustedHtml = result.trustedHtml === true || result.trusted === true;
  return {
    html: isTrustedHtml ? result.html : escapeHtml(result.html),
    highlighted: result.highlighted === true && isTrustedHtml,
    engine: result.engine || (result.highlighted && isTrustedHtml ? 'prism' : 'plain-text'),
    language: result.language || fallbackLanguage
  };
}

function callHighlighter(provider, input) {
  if (!provider) return null;
  try {
    if (typeof provider === 'function') return provider(input);
    if (typeof provider.highlight === 'function') return provider.highlight(input);
  } catch (error) {
    return {
      html: escapeHtml(input.code),
      highlighted: false,
      engine: 'plain-text',
      language: input.language,
      error: error && error.message ? error.message : String(error)
    };
  }
  return null;
}

class XCode extends HTMLElement {
  static get observedAttributes() {
    return ['lang', 'language'];
  }

  static registerHighlighter(provider) {
    this._highlighter = provider || null;
    return this._highlighter;
  }

  static getHighlighter() {
    return this._highlighter || null;
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
    this._lastHighlightSnapshot = {
      highlighted: false,
      highlightEngine: 'plain-text',
      highlightLanguage: 'text',
      languageAlias: 'default'
    };
  }

  connectedCallback() {
    // Unique ID for state management
    if (!this.id) this.id = `xcode-${Math.random().toString(36).slice(2, 10)}`;
    this.hydrate();
    this._observeLightDom();

    // Subscribe to state changes, for example external code or language updates
    this._unsubscribeState = xstate.subscribe((key, value) => {
      if (key === `xcode-state-${this.id}` && typeof value === "object") {
        if (typeof value.lang === "string" && value.lang !== this._getLanguageMeta().language) {
          this.setAttribute('lang', value.lang);
        }
        if (typeof value.language === "string" && !this.hasAttribute('lang') && value.language !== this.getAttribute('language')) {
          this.setAttribute('language', value.language);
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
    if ((name === 'lang' || name === 'language') && oldValue !== newValue) {
      if (!this.isConnected) return;
      this._render();
      // Update state
      if (this.id) {
        const languageMeta = this._getLanguageMeta();
        xstate.set(`xcode-state-${this.id}`, {
          lang: languageMeta.language,
          language: languageMeta.language,
          languageAlias: languageMeta.alias,
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
      const languageMeta = this._getLanguageMeta();
      xstate.set(`xcode-state-${this.id}`, {
        lang: languageMeta.language,
        language: languageMeta.language,
        languageAlias: languageMeta.alias,
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

  _getLanguageMeta() {
    const langAttribute = this.getAttribute('lang');
    const languageAttribute = this.getAttribute('language');
    const raw = langAttribute || languageAttribute || 'text';
    return {
      language: normalizeLanguage(raw),
      rawLanguage: raw,
      alias: langAttribute ? 'lang' : (languageAttribute ? 'language' : 'default')
    };
  }

  _highlightCode(rawCode, languageMeta) {
    const globalTarget = getGlobalTarget();
    const language = languageMeta.language || 'text';
    const input = {
      code: rawCode,
      language,
      rawLanguage: languageMeta.rawLanguage,
      languageAlias: languageMeta.alias,
      element: this
    };
    const registeredResult = callHighlighter(this.constructor.getHighlighter(), input)
      || callHighlighter(globalTarget.XTendXCodeHighlighter, input);
    if (registeredResult) return safeHighlightResult(registeredResult, rawCode, language);

    const prism = globalTarget.Prism;
    if (!prism || !prism.languages || typeof prism.highlight !== 'function') {
      return safeHighlightResult(null, rawCode, language);
    }

    if (globalTarget.XTendRmtPrism && typeof globalTarget.XTendRmtPrism.register === 'function') {
      globalTarget.XTendRmtPrism.register(prism);
    }
    const prismHighlighter = globalTarget.XTendRmtPrism && typeof globalTarget.XTendRmtPrism.createHighlighter === 'function'
      ? globalTarget.XTendRmtPrism.createHighlighter(prism)
      : null;
    const prismResult = callHighlighter(prismHighlighter, input);
    if (prismResult) return safeHighlightResult({ ...prismResult, trustedHtml: true }, rawCode, language);

    const grammar = prism.languages[language] || prism.languages[languageMeta.rawLanguage] || null;
    if (!grammar) return safeHighlightResult(null, rawCode, language);

    try {
      return safeHighlightResult({
        html: prism.highlight(rawCode, grammar, language),
        highlighted: true,
        engine: 'prism',
        language,
        trustedHtml: true
      }, rawCode, language);
    } catch (error) {
      return safeHighlightResult(null, rawCode, language);
    }
  }

  _render() {
    this._suppressLightDomObserver = true;
    // Always wrap content in a <template> (virtual, not rendered)
    let tpl = this._getTemplate();
    if (!tpl) {
      // Create a template and move all child nodes except <template> into it
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
    const languageMeta = this._getLanguageMeta();
    const highlightedCode = this._highlightCode(rawCode, languageMeta);
    this._lastHighlightSnapshot = {
      highlighted: highlightedCode.highlighted,
      highlightEngine: highlightedCode.engine,
      highlightLanguage: highlightedCode.language,
      languageAlias: languageMeta.alias
    };
    const lang = escapeAttribute(highlightedCode.language || languageMeta.language || 'text');
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
        .token.comment {
          color: var(--x-code-token-comment, #8b949e);
          font-style: italic;
        }
        .token.string {
          color: var(--x-code-token-string, #a5d6ff);
        }
        .token.number,
        .token.boolean {
          color: var(--x-code-token-number, #79c0ff);
        }
        .token.keyword,
        .token.rmt-primitive,
        .token.rmt-lifecycle,
        .token.rmt-boundary {
          color: var(--x-code-token-keyword, #ff7b72);
        }
        .token.function,
        .token.rmt-action {
          color: var(--x-code-token-function, #d2a8ff);
        }
        .token.property,
        .token.variable,
        .token.rmt-identifier,
        .token.rmt-reference {
          color: var(--x-code-token-property, #ffa657);
        }
        .token.class-name,
        .token.rmt-component {
          color: var(--x-code-token-class, #7ee787);
        }
        .token.operator,
        .token.punctuation {
          color: var(--x-code-token-punctuation, #c9d1d9);
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
      <pre part="root pre"><code part="code" class="language-${lang}" data-x-code-highlight-engine="${escapeAttribute(highlightedCode.engine)}">${highlightedCode.html}</code></pre>
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
        // Update state, optionally for copy status
        if (this.id) {
          const nextLanguageMeta = this._getLanguageMeta();
          xstate.set(`xcode-state-${this.id}`, {
            lang: nextLanguageMeta.language,
            language: nextLanguageMeta.language,
            languageAlias: nextLanguageMeta.alias,
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
    const languageMeta = this._getLanguageMeta();
    return {
      schema: "xtend.component.layout-display-media-snapshot.v1",
      componentRef: "x-code",
      stateKey: `xcode-state-${this.id}`,
      schedule: "component.idle.hydrate",
      lang: languageMeta.language,
      language: languageMeta.language,
      codeLength: this._getRawCode().length,
      highlighted: this._lastHighlightSnapshot.highlighted === true,
      highlightEngine: this._lastHighlightSnapshot.highlightEngine || 'plain-text',
      highlightLanguage: this._lastHighlightSnapshot.highlightLanguage || languageMeta.language,
      languageAlias: this._lastHighlightSnapshot.languageAlias || languageMeta.alias
    };
  }
}

customElements.define('x-code', XCode);
