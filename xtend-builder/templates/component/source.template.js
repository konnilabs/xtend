(function () {
  class {{className}} extends HTMLElement {
    static get observedAttributes() {
      return ['variant', 'aria-label'];
    }

    static get xtendScaffoldWiring() {
      return {
        schema: '{{featureWiringSchema}}',
        statePrefix: '{{featureStatePrefix}}',
        stateKeys: [{{featureStateKeysJson}}],
        events: [{{featureEventsJson}}],
        apiNamespaces: [{{featureApiNamespacesJson}}],
        localUiPolicy: '{{featureLocalUiPolicy}}'
      };
    }

    static get {{extensionSourceGetter}}() {
      return {{extensionPointsJson}};
    }

    static get xtendScaffoldA11yProfile() {
      return {{a11yProfileJson}};
    }

    static get xtendScaffoldPerformanceProfile() {
      return {{performanceProfileJson}};
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.__xtendHydrated = false;
    }

    connectedCallback() {
      this.hydrate();
    }

    disconnectedCallback() {
      this.onDisconnect();
      this.__xtendHydrated = false;
      this.removeAttribute('{{hydrationStateAttribute}}');
    }

    beforeHydrate() {}

    afterHydrate() {}

    beforeRender() {}

    afterRender() {}

    onDisconnect() {}

    _escapeAttribute(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    hydrate() {
      this.beforeHydrate();
      this.__xtendHydrated = true;
      this.setAttribute('{{hydrationStateAttribute}}', 'true');
      this.render();
      this.afterHydrate();
    }

    attributeChangedCallback() {
      if (this.isConnected) {
        this.hydrate();
        return;
      }

      this.render();
    }

    render() {
      this.beforeRender();
      const variant = this._escapeAttribute(this.getAttribute('variant') || 'default');
      const accessibleName = this.getAttribute('aria-label') || '{{a11yAccessibleNameDefault}}';
      const role = '{{a11yRole}}';
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
          }

          .root {
            border: 1px solid var(--xt-color-border, #d5dbe3);
            border-radius: 8px;
            padding: 1rem;
            color: var(--xt-color-text, #172033);
            background: var(--xt-color-surface, #ffffff);
          }

          .root:focus-visible {
            outline: 2px solid var(--xt-color-focus, #2563eb);
            outline-offset: 2px;
          }

          @media (prefers-reduced-motion: reduce) {
            .root {
              animation: none !important;
              transition: none !important;
              scroll-behavior: auto !important;
            }
          }

          @media (forced-colors: active) {
            .root {
              forced-color-adjust: auto;
              color: CanvasText;
              background: Canvas;
              border-color: CanvasText;
            }

            .root:focus-visible {
              outline-color: Highlight;
            }
          }
        </style>
        <section class="root" data-variant="${variant}" part="root" role="${role}" aria-label="${this._escapeAttribute(accessibleName)}">
          <slot>{{className}}</slot>
        </section>
      `;
      this.afterRender();
    }
  }

  if (!customElements.get('{{tag}}')) {
    customElements.define('{{tag}}', {{className}});
  }
})();
