import { xstate } from './xstate.js';

// <x-type>
class XType extends HTMLElement {
  static get xtendComponentContract() {
    return {
      schema: "xtend.component.contract.v2",
      tag: "x-type",
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
      role: "text",
      accessibleName: "Animated text",
      focusStrategy: "not-focusable"
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: "xtend.performance.component-profile.v1",
      performanceProfile: "display",
      budgetClass: "display-animation",
      lane: "idle",
      hydrationPolicy: "idle",
      criticalMeasurements: ["xtend.type.render", "xtend.type.tick"],
      idleOrBackgroundAllowed: true
    };
  }

  static get xtendLayoutDisplayMediaUxProfile() {
    return {
      schema: "xtend.component.layout-display-media-ux-profile.v1",
      componentRef: "x-type",
      family: "display-text-effect",
      role: "text",
      contentKind: "animated-text",
      responsiveStrategy: "inline-text-preserve",
      lazyPolicy: "idle-hydrate",
      overflowPolicy: "inline-overflow-safe",
      aspectRatio: "text-driven",
      events: ["typing-started", "typing-completed", "text-erased"],
      commands: ["render", "hydrate", "snapshot"],
      stateKey: "xtype-current",
      schedule: "component.idle.hydrate",
      fabric: { lane: "idle", a11yLane: "a11y", diagnosticsLane: "diagnostics", api: "@xtend-fabric" },
      rmt: { adapter: "xtend.component", kernelBoundary: "no-rmt-kernel-import-of-xtend-types" }
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._texts = [];
    this._index = 0;
    this._loop = true;
    this._speed = 100;
    this._pause = 1500;
    this._cursorChar = '|';
    this._blinking = false;
    this._paused = false;
    this._typing = false;

    this._textSpan = document.createElement('span');
    this._textSpan.setAttribute("part", "text");
    this._cursorSpan = document.createElement('span');
    this._cursorSpan.className = 'cursor';
    this._cursorSpan.setAttribute("part", "cursor");
    this._unsubscribeState = null;
  }

  static get observedAttributes() {
    return ["texts", "speed", "pause", "cursor", "blinking-cursor", "loop"];
  }

  connectedCallback() {
    this.setAttribute("part", "root");
    this._initAttributes();
    this._applyStyle();

    this._textSpan.style.whiteSpace = 'pre';
    this._cursorSpan.textContent = this._cursorChar;

    this.shadowRoot.appendChild(this._textSpan);
    if (this._blinking) this.shadowRoot.appendChild(this._cursorSpan);

    // State initialisieren
    xstate.set('xtype-current', this._texts[this._index] || '');

    // React to state changes, optionally pause or resume from outside
    this._unsubscribeState = xstate.subscribe((key, value) => {
      if (key === 'xtype-pause' && value === true) this.pause();
      if (key === 'xtype-pause' && value === false) this.resume();
      if (key === 'xtype-set-index' && typeof value === 'number') {
        this._index = value % this._texts.length;
        this._start();
      }
    });

    this._start();
  }

  disconnectedCallback() {
    if (this._unsubscribeState) this._unsubscribeState();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this._initAttributes();
      this._start();
    }
  }

  _initAttributes() {
    const raw = this.getAttribute('texts') || '["x-type"]';
    try {
      this._texts = JSON.parse(raw);
    } catch {
      console.warn("Invalid JSON for texts attribute. Falling back to default.");
      this._texts = raw.split(',').map(t => t.trim());
    }

    if (!this._texts || this._texts.length === 0) {
      console.warn("No texts provided. Falling back to default text.");
      this._texts = ["x-type"];
    }

    this._speed = parseInt(this.getAttribute('speed')) || 100;
    this._pause = parseInt(this.getAttribute('pause')) || 1500;
    this._loop = this.hasAttribute('loop');
    this._cursorChar = this.getAttribute('cursor') || '|';
    this._blinking = this.hasAttribute('blinking-cursor');

    // Reset the index to start from the first text
    this._index = 0;
  }

  _applyStyle() {
    if (!this.shadowRoot.querySelector('style')) {
      const style = document.createElement('style');
      style.textContent = `
        :host {
          display: inline;
        }
        .cursor {
          display: inline-block;
          margin-left: 2px;
          animation: blink 1s step-start infinite;
          color: var(--cursor-color, inherit);
          font-size: var(--cursor-font-size, inherit);
        }

        @keyframes blink {
          50% { opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cursor { animation: none !important; }
        }
        @media (forced-colors: active) {
          .cursor { color: CanvasText; }
        }
      `;
      this.shadowRoot.appendChild(style);
    }
  }

  async _start() {
    if (this._typing) return; // Prevent overlapping loops
    this._typing = true;

    while ((this._loop || this._index < this._texts.length) && !this._paused) {
      const text = this._texts[this._index % this._texts.length];
      xstate.set('xtype-current', text); // Save current text in state
      this.dispatchEvent(new CustomEvent("typing-started", { detail: { text } }));
      await this._type(text);
      this.dispatchEvent(new CustomEvent("typing-completed", { detail: { text } }));
      await this._wait(this._pause);
      await this._erase();
      this.dispatchEvent(new CustomEvent("text-erased"));
      this._index++;
    }

    this._typing = false; // Reset the flag when the loop ends
  }

  async _type(text) {
    for (let i = 0; i <= text.length; i++) {
      this._textSpan.textContent = text.slice(0, i);
      if (!this._blinking) this._textSpan.textContent += this._cursorChar;
      await this._wait(this._speed);
    }
  }

  async _erase() {
    const text = this._textSpan.textContent.replace(this._cursorChar, '');
    for (let i = text.length; i >= 0; i--) {
      this._textSpan.textContent = text.slice(0, i);
      if (!this._blinking) this._textSpan.textContent += this._cursorChar;
      await this._wait(this._speed / 2);
    }
    this._textSpan.textContent = '';
  }

  _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  pause() {
    this._paused = true;
    xstate.set('xtype-paused', true);
  }

  resume() {
    this._paused = false;
    xstate.set('xtype-paused', false);
    this._start();
  }

  snapshot() {
    return {
      schema: "xtend.component.layout-display-media-snapshot.v1",
      componentRef: "x-type",
      stateKey: "xtype-current",
      schedule: "component.idle.hydrate",
      current: this._textSpan ? this._textSpan.textContent : "",
      paused: this._paused
    };
  }
}

customElements.define('x-type', XType);
