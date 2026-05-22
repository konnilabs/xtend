import { xstate } from './xstate.js';

class XPlayer extends HTMLElement {
  static get observedAttributes() {
    return ["src", "poster", "type", "media-chooser", "downloadable", "autoplay", "title", "height", "width"];
  }

  static get xtendComponentContract() {
    return {
      schema: "xtend.component.contract.v2",
      tag: "x-player",
      profiles: ["media", "interactive"],
      maturity: "ux-ready"
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: "xtend.rmt.component-contract.v1",
      adapter: "xtend.component",
      schedule: "media.lazy.load",
      kernelBoundary: "no-rmt-kernel-import-of-xtend-types"
    };
  }

  static get xtendRmtPlayerContract() {
    return {
      schema: "xtend.mm-rmt.player-contract.v1",
      tag: "x-player",
      commands: ["play-media", "pause-media", "set-source", "set-state", "apply-theme"],
      events: ["xplayer-play", "xplayer-pause", "xplayer-state", "xplayer-fullscreen", "xplayer-pip", "xplayer-caption", "xplayer-mute"],
      stateKey: "xplayer-state-<id>",
      stateBridge: "xstate-host-bridge",
      themeTokens: ["--x-player-primary", "--x-player-accent", "--x-player-background", "--x-player-radius"],
      parts: ["root", "media", "title", "overlay", "spinner-overlay", "spinner", "big-controls", "controls", "progress"]
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: "xtend.a11y.screenreader-signals.v1",
      role: "region",
      accessibleName: "Media Player",
      focusStrategy: "controls-and-slider"
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: "xtend.performance.component-profile.v1",
      performanceProfile: "media",
      budgetClass: "media-interactive",
      lane: "media",
      hydrationPolicy: "lazy",
      criticalMeasurements: ["xtend.media.lazyLoad", "xtend.media.playback", "xtend.media.controls"],
      idleOrBackgroundAllowed: true
    };
  }

  static get xtendLayoutDisplayMediaUxProfile() {
    return {
      schema: "xtend.component.layout-display-media-ux-profile.v1",
      componentRef: "x-player",
      family: "media-player",
      role: "region",
      contentKind: "audio-video",
      responsiveStrategy: "aspect-ratio-media-box",
      lazyPolicy: "lazy-media-load",
      overflowPolicy: "controls-contained",
      aspectRatio: "16:9-default-or-author-width-height",
      events: ["xplayer-play", "xplayer-pause", "xplayer-fullscreen", "xplayer-pip"],
      commands: ["preload-media", "play-media", "pause-media", "snapshot"],
      stateKey: "xplayer-state-<id>",
      schedule: "media.lazy.load",
      fabric: { lane: "media", a11yLane: "a11y", diagnosticsLane: "diagnostics", api: "@xtend-fabric" },
      rmt: { adapter: "xtend.component", kernelBoundary: "no-rmt-kernel-import-of-xtend-types" }
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._autoplayUnmuted = false;
    this._dialogOpen = false; // <--- NEU: Globales Dialog-Flag für Endlosschutz
    this._resizeObserver = null;
    this._resizeFrame = null;
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          min-width: 0;
          min-height: 0;
          max-width: 100%;
          max-height: 100%;
          overflow: hidden;
          box-sizing: border-box;
          container-type: inline-size;
          font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
          --glass-bg: rgba(30, 34, 44, 0.55);
          --glass-blur: 18px;
          --primary: #4fc3f7;
          --primary-dark: #0288d1;
          --accent: #fff;
          --border-radius: 18px;
          --icon-size: 1.6em;
          --shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.18);
          --focus-outline: 2px solid var(--primary);
        }
        .player {
          width: 100%;
          height: 100%;
          min-width: 0;
          min-height: 0;
          max-width: 100%;
          max-height: 100%;
          box-sizing: border-box;
          background: var(--glass-bg);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow);
          overflow: hidden;
          position: relative;
          backdrop-filter: blur(var(--glass-blur));
          border: 1.5px solid rgba(255,255,255,0.12);
          transition: box-shadow 0.3s, border 0.3s;
        }
        .controls {
          display: flex;
          align-items: center;
          background: var(--glass-bg);
          backdrop-filter: blur(var(--glass-blur));
          border-radius: var(--border-radius);
          box-shadow: var(--shadow);
          padding: 0.7em 1em;
          color: var(--accent);
          font-size: 1em;
          gap: 0.5em;
          position: absolute;
          bottom: 1.2em;
          left: 1.2em;
          right: 1.2em;
          z-index: 10;
          box-sizing: border-box;
          min-width: 0;
          max-width: calc(100% - 2.4em);
          overflow: visible;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s, box-shadow 0.3s;
        }
        .controls.visible {
          opacity: 1;
          pointer-events: auto;
        }
        .controls-left {
          display: flex;
          align-items: center;
          gap: 0.5em;
          flex: 0 1 auto;
          min-width: 0;
        }
        .progress {
          flex: 1 1 0%;
          height: 6px;
          background: rgba(255,255,255,0.18);
          border-radius: 3px;
          margin: 0 0.7em;
          position: relative;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          min-width: 60px;
          max-width: 100%;
        }
        .controls-stack {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          min-width: 0;
          max-width: 100%;
          width: auto;
          gap: 0.5em;
          flex: 0 1 auto;
          overflow: visible;
        }
        .volume-container {
          display: flex;
          align-items: center;
          position: relative;
          width: 2.6em;
          min-width: 2.6em;
          max-width: 2.6em;
          height: 2.6em;
          overflow: visible;
          z-index: 2;
          flex-shrink: 0;
        }
        .volume-container.expanded {
          /* Keine Breitenänderung mehr! */
        }
        .volume-slider {
          position: absolute;
          left: 50%;
          bottom: 100%;
          transform: translateX(-50%) scaleY(0);
          transform-origin: bottom center;
          width: 36px;
          height: 80px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s, transform 0.25s cubic-bezier(.4,1.4,.6,1);
          background: rgba(30,34,44,0.85);
          border-radius: 1em;
          box-shadow: 0 4px 16px rgba(0,0,0,0.18);
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.7em 0;
        }
        .volume-container:hover .volume-slider,
        .volume-container:focus-within .volume-slider,
        .volume-container.expanded .volume-slider {
          opacity: 1;
          transform: translateX(-50%) scaleY(1);
          pointer-events: auto;
        }
        .volume-container button {
          position: relative;
          z-index: 2;
        }
        .volume-slider {
          left: 50%;
          /* bleibt, damit der Fader mittig über dem Button ist */
        }
        @media (hover: none) and (pointer: coarse) {
          .volume-slider { display: none !important; }
        }
        .controls-right {
          display: flex;
          align-items: center;
          gap: 0.5em;
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
          flex: 0 1 auto;
          transition: none;
        }
        .time,
        .branding {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        button, .icon-btn {
          background: rgba(255,255,255,0.08);
          border: none;
          color: var(--accent);
          border-radius: 50%;
          width: 2.6em;
          height: 2.6em;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          outline: none;
          position: relative;
        }
        button:focus, .icon-btn:focus {
          outline: var(--focus-outline);
          outline-offset: 2px;
          z-index: 2;
        }
        button:hover, .icon-btn:hover {
          background: rgba(79,195,247,0.18);
          transform: scale(1.08);
        }
        .progress {
          flex: 1;
          height: 6px;
          background: rgba(255,255,255,0.18);
          border-radius: 3px;
          margin: 0 0.7em;
          position: relative;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .buffer-bar {
          position: absolute;
          top: 0; left: 0;
          height: 100%;
          background: rgba(255,255,255,0.25);
          width: 0%;
          z-index: 1;
          border-radius: 3px;
        }
        .progress-bar {
          position: absolute;
          top: 0; left: 0;
          height: 100%;
          background: var(--primary);
          width: 0%;
          border-radius: 3px;
          z-index: 2;
          transition: width 0.2s linear;
        }
        .scrub-knob {
          position: absolute;
          top: 50%;
          left: 0;
          width: 16px;
          height: 16px;
          background: var(--primary);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          z-index: 3;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(79,195,247,0.18);
          border: 2px solid #fff;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .scrub-knob:hover, .scrub-knob.dragging {
          transform: translate(-50%, -50%) scale(1.2);
          box-shadow: 0 4px 16px rgba(79,195,247,0.28);
        }
        .overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(30,34,44,0.32);
          color: var(--accent);
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 1.2em;
          text-align: center;
          z-index: 5;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s;
          backdrop-filter: blur(8px);
          border-radius: var(--border-radius);
        }
        .overlay.visible {
          opacity: 1;
        }
        .big-controls {
          display: none;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 15;
          gap: 1.5em;
          justify-content: center;
          align-items: center;
          opacity: 0;
          transition: opacity 0.3s, transform 0.3s;
          /* pointer-events: none; entfernt, damit Buttons wieder funktionieren */
        }
        .big-controls-visible .big-controls {
          display: flex;
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
        .big-controls button {
          background: rgba(255,255,255,0.10);
          border: none;
          color: var(--primary);
          font-size: 2.5em;
          width: 3.5em;
          height: 3.5em;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 2px 12px rgba(0,0,0,0.10);
          transition: background 0.2s, transform 0.15s;
        }
        .big-controls button:hover {
          background: rgba(79,195,247,0.18);
          color: var(--primary-dark);
          transform: scale(1.08);
        }
        .video-title {
          position: absolute;
          top: 1.2em;
          left: 1.2em;
          box-sizing: border-box;
          max-width: calc(100% - 2.4em);
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow-wrap: normal;
          color: var(--accent);
          background: rgba(30,34,44,0.38);
          padding: 0.4em 1.2em;
          border-radius: 1em;
          font-size: 1em;
          z-index: 15;
          display: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.10);
          backdrop-filter: blur(8px);
        }
        .video-title.visible {
          display: block;
        }
        .hide-cursor {
          cursor: none;
        }
        .branding {
          color: var(--primary);
          font-size: 1em;
          opacity: 0.7;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-shadow: 0 2px 8px rgba(79,195,247,0.18);
        }
        input[type="range"] {
          accent-color: var(--primary);
          border-radius: 6px;
          background: rgba(255,255,255,0.10);
          height: 4px;
          margin: 0 0.5em;
          outline: none;
          transition: background 0.2s;
        }
        input[type="range"]::-webkit-slider-thumb {
          border-radius: 50%;
          background: var(--primary);
          width: 16px;
          height: 16px;
          box-shadow: 0 2px 8px rgba(79,195,247,0.18);
          border: 2px solid #fff;
          transition: transform 0.2s;
        }
        input[type="range"]:hover::-webkit-slider-thumb {
          transform: scale(1.15);
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255,255,255,0.18);
          border-top: 4px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .spinner-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          display: none;
          justify-content: center;
          align-items: center;
          background: rgba(30,34,44,0.32);
          z-index: 8; /* NEU: Unter der Steuerleiste (controls: z-index 10), über Video */
          backdrop-filter: blur(8px);
          border-radius: var(--border-radius);
        }
        .spinner-overlay.visible {
          display: flex;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .xplayer-context-menu {
          position: fixed;
          z-index: 99999;
          background: var(--glass-bg);
          color: var(--accent);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow);
          min-width: 180px;
          max-width: 240px;
          padding: 0.5em 0;
          font-size: 1em;
          display: none;
          flex-direction: column;
          animation: fadeIn 0.15s;
          overflow: hidden;
          backdrop-filter: blur(var(--glass-blur));
          border: 1.5px solid rgba(255,255,255,0.12);
        }
        .xplayer-context-menu.visible {
          display: flex;
        }
        .xplayer-context-menu button {
          background: none;
          border: none;
          color: inherit;
          text-align: left;
          width: 100%;
          box-sizing: border-box;
          border-radius: 0;
          padding: 0.7em 1.2em;
          font: inherit;
          cursor: pointer;
          transition: background 0.15s;
          margin: 0;
          outline: none;
        }
        .xplayer-context-menu button:hover, .xplayer-context-menu button:focus {
          background: rgba(79,195,247,0.10);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98);}
          to { opacity: 1; transform: scale(1);}
        }
        .xplayer-dialog-backdrop {
          position: absolute;
          z-index: 2147483647;
          top: 0; left: 0; right: 0; bottom: 0;
          width: 100%;
          height: 100%;
          background: rgba(30,34,44,0.32);
          display: none;
          align-items: center;
          justify-content: center;
          pointer-events: auto;
          backdrop-filter: blur(8px);
          border-radius: var(--border-radius);
        }
        .xplayer-dialog-backdrop.visible {
          display: flex;
        }
        .xplayer-dialog {
          background: var(--glass-bg);
          color: var(--accent);
          border-radius: var(--border-radius);
          padding: 2em 2em 1.5em 2em;
          min-width: 240px;
          max-width: 90vw;
          box-shadow: var(--shadow);
          text-align: center;
          position: relative;
          margin: 0 auto;
          word-break: break-word;
          z-index: 2147483648;
          backdrop-filter: blur(var(--glass-blur));
          border: 1.5px solid rgba(255,255,255,0.12);
        }
        .xplayer-dialog button {
          margin-top: 1.5em;
          background: var(--primary);
          color: #222;
          border: none;
          border-radius: 2em;
          padding: 0.5em 2em;
          font-size: 1em;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          box-shadow: 0 2px 8px rgba(79,195,247,0.10);
        }
        .xplayer-dialog button:hover {
          background: var(--primary-dark);
          color: #fff;
        }
        .focus-visible {
          outline: var(--focus-outline);
          outline-offset: 2px;
        }
        /* Responsive */
        @media (max-width: 600px) {
          .controls { left: 0.5em; right: 0.5em; bottom: 0.5em; padding: 0.5em 0.5em; }
          .video-title { left: 0.5em; top: 0.5em; font-size: 0.95em; padding: 0.3em 0.7em; }
        }
        /* Lautstärkeleiste: Standardmäßig versteckt, fährt bei Hover über das Lautsprecher-Icon aus */
        .volume-container {
          display: flex;
          align-items: center;
          position: relative;
          width: 2.6em; /* Nur Icon sichtbar */
          min-width: 2.6em;
          max-width: 2.6em;
          height: 2.6em;
          overflow: visible;
          z-index: 2;
          flex-shrink: 0;
        }
        .volume-container.expanded {
          /* Keine Breitenänderung mehr! */
        }
        .volume-slider {
          position: absolute;
          left: 50%;
          bottom: 100%;
          transform: translateX(-50%) scaleY(0);
          transform-origin: bottom center;
          width: 36px;
          height: 80px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s, transform 0.25s cubic-bezier(.4,1.4,.6,1);
          background: rgba(30,34,44,0.85);
          border-radius: 1em;
          box-shadow: 0 4px 16px rgba(0,0,0,0.18);
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.7em 0;
        }
        .volume-container:hover .volume-slider,
        .volume-container:focus-within .volume-slider,
        .volume-container.expanded .volume-slider {
          opacity: 1;
          transform: translateX(-50%) scaleY(1);
          pointer-events: auto;
        }
        .volume-slider input[type="range"] {
          writing-mode: vertical-lr;
          direction: rtl;
          width: 100%;
          height: 70px;
          margin: 0;
          background: transparent;
        }
        @media (hover: none) and (pointer: coarse) {
          .volume-slider { display: none !important; }
        }
        .media-container {
          width: 100%;
          height: 100%;
          min-width: 0;
          min-height: 0;
          max-width: 100%;
          max-height: 100%;
          box-sizing: border-box;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        video, audio {
          width: 100%;
          height: 100%;
          min-width: 0;
          min-height: 0;
          max-width: 100%;
          max-height: 100%;
          box-sizing: border-box;
          object-fit: cover;
          display: block;
          border-radius: var(--border-radius);
          background: #111;
        }
        video[poster] {
          object-fit: cover;
        }
        @media (prefers-reduced-motion: reduce) {
          .player, .controls, .overlay, .big-controls, .spinner, .xplayer-context-menu {
            animation: none !important;
            transition: none !important;
          }
        }
        @container (max-width: 520px) {
          .controls {
            left: 0;
            right: 0;
            bottom: 0;
            max-width: 100%;
            gap: 0.35em;
            padding: 0.5em;
          }
          .progress {
            min-width: 28px;
            margin: 0 0.35em;
          }
          .branding {
            display: none;
          }
        }
        @media (forced-colors: active) {
          .player, .controls, button, .icon-btn, .progress {
            border: 1px solid CanvasText;
          }
        }
      </style>
      <div class="player" part="root" tabindex="0" role="region" aria-label="Media Player">
        <div id="media-container" part="media" class="media-container"></div>
        <div class="video-title" part="title" id="video-title" aria-live="polite"></div>
        <div class="overlay" part="overlay" id="overlay" aria-hidden="true"></div>
        <div class="spinner-overlay" part="spinner-overlay" id="spinner-overlay" aria-live="polite" aria-busy="false">
          <div class="spinner" part="spinner" aria-label="Loading"></div>
        </div>
        <div class="big-controls" part="big-controls" id="big-controls" aria-label="Main Controls" role="group">
          <button id="backward" aria-label="10 Sekunden zurück" tabindex="0" class="icon-btn">${svgIcon('backward')}</button>
          <button id="big-play" aria-label="Abspielen/Pause" tabindex="0" class="icon-btn">${svgIcon('play')}</button>
          <button id="forward" aria-label="10 Sekunden vor" tabindex="0" class="icon-btn">${svgIcon('forward')}</button>
        </div>
        <div class="controls" part="controls" role="group" aria-label="Player Controls">
          <div class="controls-left">
            <button id="play" aria-label="Abspielen/Pause" tabindex="0" class="icon-btn">${svgIcon('play')}</button>
            <div class="time" aria-hidden="true">
              <span id="current">0:00</span> / <span id="duration">0:00</span>
            </div>
          </div>
          <div class="progress" part="progress" id="seekbar" aria-label="Position" role="slider" tabindex="0" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
            <div class="buffer-bar" id="buffer"></div>
            <div class="progress-bar" id="bar"></div>
            <div class="scrub-knob" id="knob" tabindex="0" aria-label="Scrub"></div>
          </div>
          <div class="controls-stack">
            <div class="volume-container">
              <button id="mute" aria-label="Stumm schalten" tabindex="0" class="icon-btn">${svgIcon('volume')}</button>
              <div class="volume-slider">
                <input type="range" id="volume" min="0" max="1" step="0.01" value="1" aria-label="Lautstärke" tabindex="0">
              </div>
            </div>
            <div class="controls-right">
              <button id="subtitles" aria-label="Untertitel umschalten" tabindex="0" class="icon-btn">${svgIcon('cc')}</button>
              <button id="pip" aria-label="Picture-in-Picture" tabindex="0" class="icon-btn">${svgIcon('pip')}</button>
              <button id="fullscreen" aria-label="Vollbild" tabindex="0" class="icon-btn">${svgIcon('fullscreen')}</button>
              <div id="chooser-container" style="display:none"></div>
              <div id="download-container"></div>
              <div class="branding" aria-hidden="true">XPlayer</div>
            </div>
          </div>
        </div>
        <div class="xplayer-context-menu" id="xplayer-context-menu" role="menu" aria-label="Kontextmenü">
          <button id="xplayer-about-btn" role="menuitem" tabindex="0">About XPlayer...</button>
        </div>
        <div class="xplayer-dialog-backdrop" id="xplayer-dialog-backdrop" aria-modal="true" role="dialog">
          <div class="xplayer-dialog">
            <div style="font-size:1.2em;margin-bottom:1em;">XPlayer V0.1 Beta</div>
            <div style="margin-bottom:1em;">XPlayer is part of XTend, a free and open source web framework.</div>
            <button id="xplayer-dialog-close" tabindex="0">OK</button>
          </div>
        </div>
      </div>
    `;
  }

  _removeNativeTitles() {
    if (!this.shadowRoot) return;
    Array.from(this.shadowRoot.querySelectorAll('[title]')).forEach((element) => {
      element.removeAttribute('title');
    });
  }

  connectedCallback() {
    this._loadMedia();
    this._initControls();
    this._toggleControlsVisibility();
    this._setupChooser();
    this._setupDownload();
    this._updateOverlay();
    this._setupKeyboardControls();
    this._setupBigControls();
    this._setupCursorHiding();
    this._updateDimensions();
    this._observePlayerResize();
    this._removeNativeTitles();

    // Add the loaded class to trigger branding animation
    this.classList.add("loaded");

    // State Management: Eindeutige ID für diesen Player
    if (!this.id) this.id = `xplayer-${Math.random().toString(36).slice(2, 10)}`;

    // Initialen State setzen
    xstate.set(`xplayer-state-${this.id}`, {
      src: this.getAttribute("src"),
      playing: false,
      currentTime: 0,
      volume: 1,
      muted: false,
      fullscreen: false
    });

    this._internalStateUpdate = false; // <--- NEU: Flag für interne Updates

    // State-Änderungen abonnieren (z.B. externe Steuerung)
    this._unsubscribeState = xstate.subscribe((key, value) => {
      if (key !== `xplayer-state-${this.id}`) return; // Nur auf eigenen State reagieren!
      if (this._dialogOpen) return;
      if (typeof value === "object" && this._media) {
        if (this._internalStateUpdate) return;

        if (value.src && value.src !== this._media.src) {
          this.setAttribute("src", value.src);
        }
        if (typeof value.playing === "boolean") {
          if (value.playing !== !this._media.paused) {
            if (value.playing) {
              this._media.play().catch(() => {});
            } else {
              this._media.pause();
            }
          }
        }
        if (typeof value.currentTime === "number" && Math.abs(this._media.currentTime - value.currentTime) > 0.5) {
          this._media.currentTime = value.currentTime;
        }
        if (typeof value.volume === "number" && this._media.volume !== value.volume) {
          this._media.volume = value.volume;
        }
        if (typeof value.muted === "boolean" && this._media.muted !== value.muted) {
          this._media.muted = value.muted;
        }
        if (typeof value.fullscreen === "boolean") {
          const isFullscreen = this.classList.contains("fullscreen");
          if (value.fullscreen && !isFullscreen) {
            this.shadowRoot.querySelector(".player").requestFullscreen();
          } else if (!value.fullscreen && isFullscreen) {
            document.exitFullscreen();
          }
        }
      }
    });

    // Fullscreen-Handling optimieren
    document.addEventListener("fullscreenchange", () => {
      const player = this.shadowRoot.querySelector(".player");
      const isFullscreen = !!document.fullscreenElement;

      // 1. Dimensionen setzen
      this._updateDimensions();

      // 2. Spinner/Overlay nur anzeigen, wenn Video wirklich lädt oder pausiert ist
      if (this._media && !this._media.paused && !this._media.seeking && !this._media.ended) {
        this._hideOverlay();
        const spinner = this.shadowRoot.querySelector("#spinner-overlay");
        if (spinner) spinner.classList.remove("visible");
      }

      // 2b. Big Controls im Fullscreen bei laufender Wiedergabe ausblenden
      if (this._media && !this._media.paused) {
        player.classList.remove("big-controls-visible");
      }

      // 3. Endlosschleife verhindern: State nur setzen, wenn sich wirklich etwas ändert
      if (!this._internalFullscreenChange) {
        const prevState = xstate.get(`xplayer-state-${this.id}`);
        if (prevState && prevState.fullscreen !== isFullscreen) {
          this._internalStateUpdate = true;
          xstate.set(`xplayer-state-${this.id}`, {
            ...prevState,
            fullscreen: isFullscreen
          });
          this._internalStateUpdate = false;
        }
      }

      // 4. CSS-Klasse setzen/entfernen
      if (isFullscreen) {
        this.classList.add("fullscreen");
      } else {
        this.classList.remove("fullscreen");
      }
    });

    // Kontextmenü-Logik
    const player = this.shadowRoot.querySelector(".player");
    const contextMenu = this.shadowRoot.querySelector("#xplayer-context-menu");
    const aboutBtn = this.shadowRoot.querySelector("#xplayer-about-btn");
    const controls = this.shadowRoot.querySelector(".controls"); // <-- HIER hinzufügen

    // Kontextmenü anzeigen
    player.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();

      contextMenu.style.display = "flex";
      contextMenu.classList.add("visible");

      contextMenu.style.position = "absolute";
      const playerRect = player.getBoundingClientRect();
      const menuRect = contextMenu.getBoundingClientRect();

      let left = e.clientX - playerRect.left;
      let top = e.clientY - playerRect.top;

      if (left + menuRect.width > playerRect.width) {
        left = playerRect.width - menuRect.width;
      }
      if (top + menuRect.height > playerRect.height) {
        top = playerRect.height - menuRect.height;
      }
      if (left < 0) left = 0;
      if (top < 0) top = 0;

      contextMenu.style.left = left + "px";
      contextMenu.style.top = top + "px";

      // Schließen bei Klick außerhalb
      const closeMenu = (ev) => {
        if (!contextMenu.contains(ev.target)) {
          contextMenu.classList.remove("visible");
          contextMenu.style.display = "none";
          window.removeEventListener("mousedown", closeMenu, true);
        }
      };
      window.addEventListener("mousedown", closeMenu, true);
    });

    // Klicks im Kontextmenü nicht an Player weiterreichen
    contextMenu.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      e.preventDefault();
    });
    // About-Dialog öffnen (XDialog API im globalen Scope)
    let dialogOpen = false; // Flag für Dialog-Status (nur lokal, für setTimeout-Logik)
    aboutBtn.addEventListener("pointerdown", function(e) {
      e.stopPropagation();
      e.preventDefault();
      if (this._dialogOpen) return; // <--- Endlosschutz global
      this._dialogOpen = true;
      contextMenu.classList.remove("visible");
      contextMenu.style.display = "none";
      let tries = 0;
      function getXDialog() {
        return (window.XDialog && typeof window.XDialog.show === "function") ? window.XDialog :
               (window.top && window.top.XDialog && typeof window.top.XDialog.show === "function") ? window.top.XDialog :
               (window.parent && window.parent.XDialog && typeof window.parent.XDialog.show === "function") ? window.parent.XDialog : null;
      }
      function tryShowDialog() {
        const XDialogAPI = getXDialog();
        if (XDialogAPI) {
          const dialogId = XDialogAPI.show({
            title: "XPlayer V0.1 Beta",
            content: "XPlayer is part of XTend, a free and open source web framework.",
            actions: [{ label: "OK", primary: true, callback: () => { this._dialogOpen = false; } }]
          });
          // Optional: State-Subscription für Dialog schließen
          const unsub = xstate.subscribe((key, value) => {
            if (key === `dialog-open-${dialogId}` && value === false) {
              this._dialogOpen = false;
              if (typeof unsub === 'function') unsub();
            }
          });
        } else if (tries < 10) {
          tries++;
          setTimeout(tryShowDialog.bind(this), 100);
        } else {
          // Fallback: Shadow DOM Dialog anzeigen
          const dialogBackdrop = this.shadowRoot.querySelector("#xplayer-dialog-backdrop");
          if (dialogBackdrop) {
            dialogBackdrop.classList.add("visible");
            const closeBtn = this.shadowRoot.querySelector("#xplayer-dialog-close");
            if (closeBtn) {
              closeBtn.focus();
              closeBtn.onclick = () => {
                dialogBackdrop.classList.remove("visible");
                this._dialogOpen = false;
              };
            }
          } else {
            alert("XPlayer V0.1 Beta\n\nXPlayer is part of XTend, a free and open source web framework.");
            this._dialogOpen = false;
          }
        }
      }
      tryShowDialog.call(this);
    }.bind(this))

    // --- Fix: Player-Click-Handler blockiert, wenn Kontextmenü offen ---
    this._playerClickHandler = (e) => {
      if (e.defaultPrevented) return;
      // 1. Kontextmenü offen? Dann nie toggeln!
      if (contextMenu && contextMenu.classList.contains("visible")) {
        if (contextMenu.contains(e.target)) return;
        return;
      }
      // 2. Klick auf Steuerelemente? Dann nie toggeln!
      if (
        controls &&
        (controls.contains(e.target) ||
        e.target.closest(".controls") ||
        e.target.closest(".big-controls") ||
        e.target.closest("#chooser-container") ||
        e.target.closest("#download-container") ||
        e.target.closest(".xplayer-context-menu"))
      ) {
        return;
      }
      // 3. Klick auf den Player-Hintergrund oder Video/Audio? -> Toggle Play/Pause
      if (
        this._media.muted &&
        this.hasAttribute("autoplay") &&
        !this._autoplayUnmuted &&
        this._media.paused
      ) {
        this._media.muted = false;
        this._autoplayUnmuted = true;
      }
      if (this._media.paused) {
        this._media.play();
      } else {
        this._media.pause();
      }
    };

    player.addEventListener("click", this._playerClickHandler);
  }

  disconnectedCallback() {
    if (this._unsubscribeState) this._unsubscribeState();
    if (this._removeTitleInterval) {
      clearInterval(this._removeTitleInterval);
      this._removeTitleInterval = null;
    }
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._resizeFrame) {
      cancelAnimationFrame(this._resizeFrame);
      this._resizeFrame = null;
    }
  }

  snapshot() {
    return {
      schema: "xtend.component.layout-display-media-snapshot.v1",
      componentRef: "x-player",
      stateKey: `xplayer-state-${this.id}`,
      schedule: "media.lazy.load",
      src: this.getAttribute("src"),
      type: this.getAttribute("type") || "video",
      playing: this._media ? !this._media.paused : false,
      currentTime: this._media ? this._media.currentTime : 0
    };
  }

  getRmtPlayerContract() {
    return XPlayer.xtendRmtPlayerContract;
  }

  setMediaState(patch = {}) {
    const stateKey = `xplayer-state-${this.id || "unmounted"}`;
    const currentState = typeof xstate.get === "function" ? (xstate.get(stateKey) || {}) : {};
    if (patch.src && patch.src !== this.getAttribute("src")) {
      this.setAttribute("src", patch.src);
    }
    if (this._media) {
      if (typeof patch.currentTime === "number") this._media.currentTime = patch.currentTime;
      if (typeof patch.volume === "number") this._media.volume = Math.max(0, Math.min(1, patch.volume));
      if (typeof patch.muted === "boolean") this._media.muted = patch.muted;
    }
    const nextState = {
      ...currentState,
      ...patch,
      src: patch.src || this.getAttribute("src"),
      playing: typeof patch.playing === "boolean" ? patch.playing : (this._media ? !this._media.paused : Boolean(currentState.playing)),
      currentTime: this._media ? this._media.currentTime : (patch.currentTime || currentState.currentTime || 0),
      volume: this._media ? this._media.volume : (typeof patch.volume === "number" ? patch.volume : currentState.volume || 1),
      muted: this._media ? this._media.muted : (typeof patch.muted === "boolean" ? patch.muted : Boolean(currentState.muted))
    };
    if (typeof xstate.set === "function") xstate.set(stateKey, nextState);
    if (typeof CustomEvent === "function") {
      this.dispatchEvent(new CustomEvent("xplayer-state", { detail: nextState }));
    }
    return nextState;
  }

  playMedia() {
    if (!this._media || typeof this._media.play !== "function") {
      return Promise.resolve(this.setMediaState({ playing: false }));
    }
    const playRequest = this._media.play();
    this.setMediaState({ playing: true });
    return playRequest && typeof playRequest.then === "function"
      ? playRequest.then(() => this.snapshot()).catch((error) => {
        this.setMediaState({ playing: this._media ? !this._media.paused : false });
        throw error;
      })
      : Promise.resolve(this.snapshot());
  }

  pauseMedia() {
    if (this._media && typeof this._media.pause === "function") {
      this._media.pause();
    }
    return this.setMediaState({ playing: false });
  }

  applyRmtThemeTokens(tokens = {}) {
    Object.entries(tokens || {}).forEach(([name, value]) => {
      if (value === null || typeof value === "undefined") return;
      const tokenName = String(name).startsWith("--") ? String(name) : `--x-player-${String(name).replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}`;
      this.style.setProperty(tokenName, String(value));
    });
    return {
      schema: "xtend.mm-rmt.player-theme-report.v1",
      tokenCount: Object.keys(tokens || {}).length
    };
  }

  applyRmtPlayerCommand(command, payload = {}) {
    const kind = typeof command === "string" ? command : command && (command.kind || command.type || command.command);
    const data = typeof command === "object" && command && !Array.isArray(command)
      ? { ...command, ...payload }
      : payload;
    if (kind === "play-media" || kind === "play") return this.playMedia(data);
    if (kind === "pause-media" || kind === "pause") return this.pauseMedia(data);
    if (kind === "set-source") {
      const src = data.src || data.source || "";
      if (src) this.setAttribute("src", src);
      if (data.type) this.setAttribute("type", data.type);
      if (data.poster) this.setAttribute("poster", data.poster);
      return this.setMediaState({ src, type: data.type || this.getAttribute("type") || "video", playing: false });
    }
    if (kind === "set-state") return this.setMediaState(data.state || data);
    if (kind === "apply-theme") return this.applyRmtThemeTokens(data.tokens || data.theme || data);
    throw new Error(`Unsupported x-player RMT command: ${kind || "unknown"}`);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (["src", "poster", "type", "media-chooser", "downloadable", "title"].includes(name)) {
      this._loadMedia();
      if (name === "title") {
        this._updateOverlay();
      }
    }

    if (name === "autoplay" && this._media) {
      if (newValue !== null) {
        this._media.play().then(() => {
          this.updatePlayPauseIcon(); // Ensure play button updates on autoplay
        }).catch(() => {}); // Fehler ignorieren, falls play() abgebrochen wird
      } else {
        this._media.pause();
      }
    }

    if (["height", "width"].includes(name)) {
      this._updateDimensions(); // Dynamically update dimensions
    }
  }

  _setupBigControls() {
    const bigPlay = this.shadowRoot.querySelector("#big-play");
    const backward = this.shadowRoot.querySelector("#backward");
    const forward = this.shadowRoot.querySelector("#forward");
    const player = this.shadowRoot.querySelector(".player");
    const media = this._media;

    // Replay SVG
    const svgReplay = () => `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5V2L7 6.5L12 11V8C15.31 8 18 10.69 18 14C18 17.31 15.31 20 12 20C8.69 20 6 17.31 6 14H4C4 18.42 7.58 22 12 22C16.42 22 20 18.42 20 14C20 9.58 16.42 6 12 6V5Z" fill="currentColor"/></svg>`;

    function updateBigPlay() {
      if (media.ended) {
        bigPlay.innerHTML = svgReplay();
        bigPlay.setAttribute('aria-label', 'Neustart');
        bigPlay.onclick = () => {
          media.currentTime = 0;
          media.play();
        };
      } else {
        bigPlay.innerHTML = media.paused ? svgIcon('play') : svgIcon('pause');
        bigPlay.setAttribute('aria-label', media.paused ? 'Abspielen' : 'Pause');
        bigPlay.onclick = () => {
          if (media.paused) {
            media.play();
          } else {
            media.pause();
          }
        };
      }
    }

    updateBigPlay();
    media.addEventListener('ended', updateBigPlay);
    media.addEventListener('play', updateBigPlay);
    media.addEventListener('pause', updateBigPlay);

    backward.onclick = () => {
      media.currentTime = Math.max(media.currentTime - 10, 0);
    };
    forward.onclick = () => {
      media.currentTime = Math.min(media.currentTime + 10, media.duration);
    };
  }

  _updateOverlay() {
    const titleElement = this.shadowRoot.querySelector("#video-title");
    const title = this.getAttribute("title") || this._getDefaultTitle();
    titleElement.textContent = title;
  }

  _getDefaultTitle() {
    const src = this.getAttribute("src");
    if (!src) return "Untitled Video";
    const fileName = src.split("/").pop();
    return fileName || "Untitled Video";
  }

  _loadMedia() {
    const container = this.shadowRoot.querySelector("#media-container");
    container.innerHTML = "";

    const type = this.getAttribute("type") === "audio" ? "audio" : "video";
    const media = document.createElement(type);
    media.controls = false;
    media.src = this.getAttribute("src") || "";
    media.removeAttribute("title"); // Tooltip entfernen (direkt nach Erzeugung)
    if (this.hasAttribute("poster") && type === "video") media.poster = this.getAttribute("poster");
    if (this.hasAttribute("loop")) media.loop = true;

    // Add playsinline attributes for mobile-friendliness (especially iOS)
    if (type === "video") {
      media.setAttribute("playsinline", "");
      media.setAttribute("webkit-playsinline", "");
    }

    const spinnerOverlay = this.shadowRoot.querySelector("#spinner-overlay");
    let hasPlayed = false; // <-- Add this flag

    const showSpinner = () => {
      const spinnerOverlay = this.shadowRoot.querySelector("#spinner-overlay");
      const overlay = this.shadowRoot.querySelector("#overlay");
      const title = this.shadowRoot.querySelector("#video-title");
      if (spinnerOverlay) spinnerOverlay.classList.add("visible");
      if (overlay) overlay.classList.remove("visible");
      if (title) title.classList.remove("visible");
      xstate.set(`xplayer-spinner-${this.id}`, true);
    };

    const hideSpinner = () => {
      const spinnerOverlay = this.shadowRoot.querySelector("#spinner-overlay");
      if (spinnerOverlay) spinnerOverlay.classList.remove("visible");
      xstate.set(`xplayer-spinner-${this.id}`, false);
    };

    media.addEventListener("waiting", showSpinner);
    media.addEventListener("playing", hideSpinner);
    media.addEventListener("canplay", hideSpinner);
    media.addEventListener("loadedmetadata", () => {
      media.removeAttribute("title");
      media.title = "";
    });
    // --- Workaround: title-Attribut regelmäßig entfernen und leeren ---
    if (this._removeTitleInterval) clearInterval(this._removeTitleInterval);
    this._removeTitleInterval = setInterval(() => {
      if (!media.isConnected) {
        clearInterval(this._removeTitleInterval);
        this._removeTitleInterval = null;
      } else {
        media.removeAttribute('title');
        media.title = "";
      }
    }, 500);

    if (this.hasAttribute("autoplay")) {
      media.muted = true;
      media.autoplay = true;
      media.play().then(() => {
        this._hideOverlay();
      }).catch((err) => {
        // Only show overlay if autoplay fails
        this._showOverlay();
        hideSpinner();
        console.warn("Autoplay failed:", err.message);
      });
    }

    media.addEventListener("play", () => {
      hasPlayed = true; // <-- Mark as played
      this.updatePlayPauseIcon();
      this._hideOverlay();
      this.dispatchEvent(new CustomEvent("xplayer-play", {
        detail: {
          currentTime: media.currentTime,
          src: media.currentSrc || media.src,
          source: "media-event"
        }
      }));

      this._internalStateUpdate = true;
      const prev = xstate.get(`xplayer-state-${this.id}`) || {};
      if (!prev.playing) {
        xstate.set(`xplayer-state-${this.id}`, {
          ...prev,
          playing: true,
          currentTime: media.currentTime
        });
      }
      this._internalStateUpdate = false;
    });

    media.addEventListener("pause", () => {
      if (hasPlayed) this._showOverlay();
      if (hasPlayed) {
        this.dispatchEvent(new CustomEvent("xplayer-pause", {
          detail: {
            currentTime: media.currentTime,
            src: media.currentSrc || media.src,
            source: "media-event"
          }
        }));
      }

      this._internalStateUpdate = true;
      const prev = xstate.get(`xplayer-state-${this.id}`) || {};
      if (prev.playing) {
        xstate.set(`xplayer-state-${this.id}`, {
          ...prev,
          playing: false,
          currentTime: media.currentTime
        });
      }
      this._internalStateUpdate = false;
    });

    media.addEventListener("seeked", () => {
      this._internalStateUpdate = true;
      const prev = xstate.get(`xplayer-state-${this.id}`) || {};
      if (Math.abs((prev.currentTime || 0) - media.currentTime) > 0.5) {
        xstate.set(`xplayer-state-${this.id}`, {
          ...prev,
          currentTime: media.currentTime
        });
      }
      this._internalStateUpdate = false;
    });

    media.addEventListener("volumechange", () => {
      this._internalStateUpdate = true;
      const prev = xstate.get(`xplayer-state-${this.id}`) || {};
      if (prev.volume !== media.volume || prev.muted !== media.muted) {
        xstate.set(`xplayer-state-${this.id}`, {
          ...prev,
          volume: media.volume,
          muted: media.muted
        });
      }
      this._internalStateUpdate = false;
    });

    container.appendChild(media);
    this._media = media;
    this._initControls();
    this._toggleControlsVisibility();
    this._setupChooser();
    this._setupDownload();
    // Klick auf den Videobereich toggelt Play/Pause (außer auf Controls)
    const player = this.shadowRoot.querySelector(".player");
    const controls = this.shadowRoot.querySelector(".controls");
    const contextMenu = this.shadowRoot.querySelector("#xplayer-context-menu");
    // Vorherigen Listener entfernen, falls _loadMedia() mehrfach aufgerufen wird
    if (this._playerClickHandler) {
      player.removeEventListener("click", this._playerClickHandler);
    }
    this._playerClickHandler = (e) => {
      if (e.defaultPrevented) return;
      // 1. Kontextmenü offen? Dann nie toggeln!
      if (contextMenu && contextMenu.classList.contains("visible")) {
        if (contextMenu.contains(e.target)) return;
        return;
      }
      // 2. Klick auf Steuerelemente? Dann nie toggeln!
      if (
        controls &&
        (controls.contains(e.target) ||
        e.target.closest(".controls") ||
        e.target.closest(".big-controls") ||
        e.target.closest("#chooser-container") ||
        e.target.closest("#download-container") ||
        e.target.closest(".xplayer-context-menu"))
      ) {
        return;
      }
      // 3. Klick auf den Player-Hintergrund oder Video/Audio? -> Toggle Play/Pause
      if (
        this._media.muted &&
        this.hasAttribute("autoplay") &&
        !this._autoplayUnmuted &&
        this._media.paused
      ) {
        this._media.muted = false;
        this._autoplayUnmuted = true;
      }
      if (this._media.paused) {
        this._media.play();
      } else {
        this._media.pause();
      }
    };
    player.addEventListener("click", this._playerClickHandler);
  }

  _showOverlay() {
    // Nur anzeigen, wenn das Video wirklich pausiert ist
    if (this._media && !this._media.paused) return;
    const overlay = this.shadowRoot.querySelector("#overlay");
    const spinner = this.shadowRoot.querySelector("#spinner-overlay");
    const title = this.shadowRoot.querySelector("#video-title");
    const player = this.shadowRoot.querySelector(".player");
    if (spinner && spinner.classList.contains("visible")) {
      // Spinner hat Vorrang, kein Pause-Overlay anzeigen
      overlay.classList.remove("visible");
      title.classList.remove("visible");
      if (player) player.classList.remove("big-controls-visible");
      return;
    }
    overlay.classList.add("visible");
    title.classList.add("visible");
    if (player) player.classList.add("big-controls-visible");
  }

  _hideOverlay() {
    const overlay = this.shadowRoot.querySelector("#overlay");
    const title = this.shadowRoot.querySelector("#video-title");
    const player = this.shadowRoot.querySelector(".player");
    overlay.classList.remove("visible");
    title.classList.remove("visible"); // Hide title with overlay
    if (player) player.classList.remove("big-controls-visible");
  }

  updatePlayPauseIcon() {
    const play = this.shadowRoot.querySelector("#play");
    const bigPlay = this.shadowRoot.querySelector("#big-play");
    const media = this._media;
    // Replay SVG
    const svgReplay = () => `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5V2L7 6.5L12 11V8C15.31 8 18 10.69 18 14C18 17.31 15.31 20 12 20C8.69 20 6 17.31 6 14H4C4 18.42 7.58 22 12 22C16.42 22 20 18.42 20 14C20 9.58 16.42 6 12 6V5Z" fill="currentColor"/></svg>`;

    if (media.ended) {
      // Replay für BigButton
      if (bigPlay) {
        bigPlay.innerHTML = svgReplay();
        bigPlay.setAttribute('aria-label', 'Neustart');
        bigPlay.onclick = () => {
          media.currentTime = 0;
          media.play();
        };
      }
      // Replay für kleinen Button
      if (play) {
        play.innerHTML = svgReplay();
        play.setAttribute('aria-label', 'Neustart');
        play.onclick = () => {
          media.currentTime = 0;
          media.play();
        };
      }
    } else {
      // BigButton normal
      if (bigPlay) {
        bigPlay.innerHTML = media.paused ? svgIcon('play') : svgIcon('pause');
        bigPlay.setAttribute('aria-label', media.paused ? 'Abspielen' : 'Pause');
        bigPlay.onclick = () => {
          if (media.paused) {
            media.play();
          } else {
            media.pause();
          }
        };
      }
      // Kleiner Button normal
      if (play) {
        play.innerHTML = media.paused ? svgIcon('play') : svgIcon('pause');
        play.setAttribute('aria-label', media.paused ? 'Abspielen' : 'Pause');
        play.onclick = (e) => {
          e.preventDefault();
          if (media.paused) {
            media.play();
          } else {
            media.pause();
          }
          this.updatePlayPauseIcon();
        };
      }
    }
  }

  _initControls() {
    const media = this._media;
    const play = this.shadowRoot.querySelector("#play");
    const mute = this.shadowRoot.querySelector("#mute");
    const volume = this.shadowRoot.querySelector("#volume");
    const volumeContainer = this.shadowRoot.querySelector('.volume-container');
    const controlsStack = this.shadowRoot.querySelector('.controls-stack');
    const fullscreen = this.shadowRoot.querySelector("#fullscreen");
    const pip = this.shadowRoot.querySelector("#pip");
    const subtitles = this.shadowRoot.querySelector("#subtitles");
    const current = this.shadowRoot.querySelector("#current");
    const duration = this.shadowRoot.querySelector("#duration");
    const bar = this.shadowRoot.querySelector("#bar");
    const seekbar = this.shadowRoot.querySelector("#seekbar");
    const buffer = this.shadowRoot.querySelector("#buffer");
    const knob = this.shadowRoot.querySelector("#knob");
    const controls = this.shadowRoot.querySelector('.controls');

    // Update time display
    const updateTime = () => {
      current.textContent = this._format(media.currentTime);
      duration.textContent = this._format(media.duration || 0);
      const progress = (media.currentTime / media.duration) * 100;
      bar.style.width = `${progress}%`;
      knob.style.left = `${progress}%`;
    };

    // Update buffer bar
    const updateBufferBar = () => {
      if (media.buffered.length > 0) {
        const bufferedEnd = media.buffered.end(media.buffered.length - 1); // End of the last buffered range
        const bufferWidth = (bufferedEnd / media.duration) * 100;
        buffer.style.width = `${bufferWidth}%`;
      }
    };

    media.addEventListener("timeupdate", updateTime);
    media.addEventListener("loadedmetadata", updateTime);
    media.addEventListener("progress", updateBufferBar);
    media.addEventListener("loadedmetadata", updateBufferBar);

    // Seek functionality
    seekbar.onclick = (e) => {
      const rect = seekbar.getBoundingClientRect();
      const seekTime = ((e.clientX - rect.left) / rect.width) * media.duration;
      media.currentTime = seekTime;
    };
    // Touch support for seekbar
    seekbar.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = seekbar.getBoundingClientRect();
        const seekTime = ((touch.clientX - rect.left) / rect.width) * media.duration;
        media.currentTime = seekTime;
      }
    });

    // Scrub knob functionality
    let isDragging = false;
    let isTouchDragging = false;

    knob.onmousedown = (e) => {
      isDragging = true;
      knob.classList.add("dragging");
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      document.addEventListener("mouseleave", onMouseUp);
    };
    // Touch support for scrub knob
    knob.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isTouchDragging = true;
        knob.classList.add("dragging");
        document.addEventListener("touchmove", onTouchMove);
        document.addEventListener("touchend", onTouchEnd);
        document.addEventListener("touchcancel", onTouchEnd);
      }
    });

    function onMouseMove(event) {
      if (isDragging) {
        const rect = seekbar.getBoundingClientRect();
        const offsetX = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
        const progress = (offsetX / rect.width) * 100;
        const seekTime = (offsetX / rect.width) * media.duration;
        knob.style.left = `${progress}%`;
        bar.style.width = `${progress}%`;
        media.currentTime = seekTime;
      }
    }
    function onMouseUp() {
      isDragging = false;
      knob.classList.remove("dragging");
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseUp);
    }
    function onTouchMove(event) {
      if (isTouchDragging && event.touches.length === 1) {
        const touch = event.touches[0];
        const rect = seekbar.getBoundingClientRect();
        const offsetX = Math.min(Math.max(touch.clientX - rect.left, 0), rect.width);
        const progress = (offsetX / rect.width) * 100;
        const seekTime = (offsetX / rect.width) * media.duration;
        knob.style.left = `${progress}%`;
        bar.style.width = `${progress}%`;
        media.currentTime = seekTime;
      }
    }
    function onTouchEnd() {
      isTouchDragging = false;
      knob.classList.remove("dragging");
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    }

    // Fullscreen button: add touch support
    fullscreen.onclick = () => {
      const player = this.shadowRoot.querySelector(".player");
      if (!document.fullscreenElement) {
        player.requestFullscreen().then(() => {
          this.classList.add("fullscreen");
          this._updateDimensions();
        }).catch((err) => {
          console.error("Failed to enter full-screen mode:", err);
        });
      } else {
        document.exitFullscreen().then(() => {
          this.classList.remove("fullscreen");
          this._updateDimensions();
        }).catch((err) => {
          console.error("Failed to exit full-screen mode:", err);
        });
      }
      this.dispatchEvent(new CustomEvent("xplayer-fullscreen", { detail: { fullscreen: !!document.fullscreenElement } }));
    };
    fullscreen.addEventListener('touchstart', (e) => {
      e.preventDefault();
      fullscreen.onclick();
    });
    pip.onclick = async () => {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await media.requestPictureInPicture();
        }
      } catch (err) {
        console.warn("PIP failed:", err.message);
      }
      this.dispatchEvent(new CustomEvent("xplayer-pip", { detail: {} }));
    };
    subtitles.onclick = () => {
      // ...existing code for subtitles toggle...
      this.dispatchEvent(new CustomEvent("xplayer-caption", { detail: {} }));
    };
    // Defensive: Fallback für fehlende Controls
    if (!play || !mute || !volume || !fullscreen || !pip || !subtitles) {
      console.warn("Einige Steuerelemente fehlen im Player.");
    }

    // Volume-Slider auf Mobilgeräten deaktivieren
    if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
      if (volume) volume.style.display = 'none';
    }
    // Desktop: Stack-Logik für Icons rechts des Lautsprecher-Icons
    if (volumeContainer && controlsStack) {
      const volumeSlider = volumeContainer.querySelector('.volume-slider');
      let hoverCount = 0;
      let hideTimeout = null;
      function isDescendant(parent, child) {
        let node = child;
        while (node) {
          if (node === parent) return true;
          node = node.parentNode;
        }
        return false;
      }
      const show = () => {
        hoverCount++;
        clearTimeout(hideTimeout); // Nur im show(), nicht im hide()
        volumeContainer.classList.add('expanded');
        if (controls) controls.classList.add('visible');
      };
      const hide = (e) => {
        hoverCount = Math.max(0, hoverCount - 1);
        let related = e && (e.relatedTarget || e.toElement);
        if (related && (isDescendant(volumeContainer, related) || isDescendant(volumeSlider, related))) {
          return;
        }
        if (hoverCount === 0) {
          hideTimeout = setTimeout(() => {
            volumeContainer.classList.remove('expanded');
            // Slider immer ausblenden, unabhängig vom Status der Steuerleiste
          }, 800);
        }
      };
      volumeContainer.addEventListener('mouseenter', show);
      volumeContainer.addEventListener('mouseleave', hide);
      if (volumeSlider) {
        volumeSlider.addEventListener('mouseenter', show);
        volumeSlider.addEventListener('mouseleave', hide);
        // Nach Interaktion auf dem Slider: GUI und Slider nach kurzer Zeit ausblenden
        const volumeInput = volumeSlider.querySelector('input[type="range"]');
        if (volumeInput) {
          let interactionEnd = () => {
            hideTimeout = setTimeout(() => {
              volumeContainer.classList.remove('expanded');
              // Slider immer ausblenden, unabhängig vom Status der Steuerleiste
            }, 800);
          };
          volumeInput.addEventListener('mouseup', interactionEnd);
          volumeInput.addEventListener('touchend', interactionEnd);
          volumeInput.addEventListener('change', interactionEnd);
        }
      }
      volumeContainer.addEventListener('focusin', show);
      volumeContainer.addEventListener('focusout', hide);
    }
    if (controls) controls.classList.add('visible');

    // ARIA- und Event-Verbesserungen für Controls
    play.onclick = null;
    play.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (this._media.paused) {
        this._media.play();
      } else {
        this._media.pause();
      }
      this.updatePlayPauseIcon();
    });
    mute.onclick = null;
    mute.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this._media.muted = !this._media.muted;
      mute.innerHTML = this._media.muted ? svgIcon('mute') : svgIcon('volume');
      this.dispatchEvent(new CustomEvent("xplayer-mute", { detail: { muted: this._media.muted } }));
    });
    if (volume) {
      // Lautstärke-Slider steuert die Media-Lautstärke
      volume.addEventListener('input', (e) => {
        if (this._media) {
          this._media.volume = parseFloat(volume.value);
          if (this._media.volume === 0) {
            this._media.muted = true;
            mute.innerHTML = svgIcon('mute');
          } else {
            this._media.muted = false;
            mute.innerHTML = svgIcon('volume');
          }
        }
      });
      // Synchronisiere Slider, wenn Lautstärke extern geändert wird
      this._media.addEventListener('volumechange', () => {
        volume.value = this._media.volume;
        mute.innerHTML = this._media.muted ? svgIcon('mute') : svgIcon('volume');
      });
    }
    // NEU: Immer synchronisieren, auch bei Tastatursteuerung etc.
    this._media.addEventListener('play', () => this.updatePlayPauseIcon());
    this._media.addEventListener('pause', () => this.updatePlayPauseIcon());
    this._media.addEventListener('ended', () => this.updatePlayPauseIcon());
  }

  _toggleControlsVisibility() {
    const controls = this.shadowRoot.querySelector(".controls");
    const volumeContainer = this.shadowRoot.querySelector('.volume-container');
    let timeout;

    const showControls = () => {
      controls.classList.add("visible");
      clearTimeout(timeout);
      // GUI ist sichtbar, Slider kann unabhängig gesteuert werden
    };

    const hideControls = () => {
      controls.classList.remove("visible");
      // NEU: Immer auch den Lautstärke-Slider schließen
      if (volumeContainer) volumeContainer.classList.remove('expanded');
    };

    this._media.addEventListener("mousemove", showControls);
    this._media.addEventListener("play", showControls);
    this._media.addEventListener("pause", () => {
      controls.classList.add("visible"); // Keep controls visible when paused
      clearTimeout(timeout); // Cancel any timeout to hide controls
    });

    // Automatisches Ausblenden nach 3s nur wenn Video spielt
    showControls();
    this._media.addEventListener("mousemove", () => {
      if (!this._media.paused) {
        clearTimeout(timeout);
        timeout = setTimeout(hideControls, 3000);
      }
    });
  }

  _setupChooser() {
    const container = this.shadowRoot.querySelector("#chooser-container");
    container.innerHTML = "";
    container.style.display = "none";

    if (this.getAttribute("media-chooser") !== "true") return;

    const select = document.createElement("select");
    const options = Array.from(this.querySelectorAll("source"));

    options.forEach((source, idx) => {
      const opt = document.createElement("option");
      opt.value = source.getAttribute("src");
      opt.textContent = source.getAttribute("label") || `Source ${idx + 1}`;
      select.appendChild(opt);
    });

    if (options.length > 0) {
      select.onchange = () => {
        this._media.src = select.value;
        this._media.load();
        this._media.play().catch((err) => {
          console.warn("Media play failed:", err.message);
        });
      };
      container.appendChild(select);
      container.style.display = "block";
    }
  }

  _setupDownload() {
    const container = this.shadowRoot.querySelector("#download-container");
    container.innerHTML = "";

    if (this.getAttribute("downloadable") === "true" && this._media?.src) {
      const link = document.createElement("a");
      link.href = this._media.src;
      link.download = "";
      link.className = "download";
      link.title = "Download";
      link.textContent = "⬇";
      container.appendChild(link);
    }
  }

  _setupKeyboardControls() {
    const player = this.shadowRoot.querySelector(".player");
    const media = this._media;
    const volumeSlider = this.shadowRoot.querySelector("#volume");

    player.addEventListener("keydown", (e) => {
      switch (e.key) {
        case " ":
          e.preventDefault(); // Prevent scrolling
          if (media.paused) {
            media.play();
          } else {
            media.pause();
          }
          break;
        case "ArrowRight":
          media.currentTime = Math.min(media.currentTime + 10, media.duration);
          break;
        case "ArrowLeft":
          media.currentTime = Math.max(media.currentTime - 10, 0);
          break;
        case "ArrowUp":
          e.preventDefault(); // Prevent scrolling
          media.volume = Math.min(media.volume + 0.1, 1);
          volumeSlider.value = media.volume;
          break;
        case "ArrowDown":
          e.preventDefault(); // Prevent scrolling
          media.volume = Math.max(media.volume - 0.1, 0);
          volumeSlider.value = media.volume;
          break;
      }
    });
  }

  _setupCursorHiding() {
    const player = this.shadowRoot.querySelector(".player");
    let cursorTimeout;

    const hideCursor = () => {
      player.classList.add("hide-cursor");
    };

    const showCursor = () => {
      player.classList.remove("hide-cursor");
      clearTimeout(cursorTimeout);
      cursorTimeout = setTimeout(hideCursor, 3000); // Hide cursor after 3 seconds
    };

    player.addEventListener("mousemove", () => {
      if (document.fullscreenElement) {
        showCursor();
      }
    });

    document.addEventListener("fullscreenchange", () => {
      if (!document.fullscreenElement) {
        player.classList.remove("hide-cursor"); // Ensure cursor is visible when exiting full-screen
        clearTimeout(cursorTimeout);
      }
    });
  }

  _format(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  _observePlayerResize() {
    if (typeof ResizeObserver !== "function" || this._resizeObserver) return;
    this._resizeObserver = new ResizeObserver(() => {
      if (this._resizeFrame) cancelAnimationFrame(this._resizeFrame);
      this._resizeFrame = requestAnimationFrame(() => {
        this._resizeFrame = null;
        this._updateDimensions();
      });
    });
    this._resizeObserver.observe(this);
  }

  _updateDimensions() {
    const container = this.shadowRoot.querySelector("#media-container");
    const player = this.shadowRoot.querySelector(".player");
    const media = this._media;

    // Hole Attribute oder CSS-Variablen
    const width = this.getAttribute("width") || this.style.width || "";
    const height = this.getAttribute("height") || this.style.height || "";

    if (this.classList.contains("fullscreen")) {
      // Im Fullscreen: immer 100%
      container.style.width = "100%";
      container.style.height = "100%";
      player.style.width = "100%";
      player.style.height = "100%";
      if (media) {
        media.style.width = "100%";
        media.style.height = "100%";
      }
    } else {
      // Außerhalb Fullscreen: feste Größe aus Attributen oder CSS übernehmen
      if (width) {
        player.style.width = width.endsWith("px") || width.endsWith("%") ? width : width + "px";
        container.style.width = player.style.width;
        if (media) media.style.width = player.style.width;
      } else {
        player.style.width = "";
        container.style.width = "";
        if (media) media.style.width = "";
      }
      if (height) {
        player.style.height = height.endsWith("px") || height.endsWith("%") ? height : height + "px";
        container.style.height = player.style.height;
        if (media) media.style.height = player.style.height;
      } else {
        player.style.height = "";
        container.style.height = "";
        if (media) media.style.height = "";
      }
    }
  }
}

if (!customElements.get("x-player")) {
  customElements.define("x-player", XPlayer);
}

// SVG-Icon Helper (direkt im File, keine Abhängigkeit)
function svgIcon(name) {
  switch (name) {
    case 'play': return `<svg width="1.6em" height="1.6em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>`;
    case 'pause': return `<svg width="1.6em" height="1.6em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
    case 'backward': return `<svg width="1.6em" height="1.6em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 19 2 12 11 5 11 19"/><polygon points="22 19 13 12 22 5 22 19"/></svg>`;
    case 'forward': return `<svg width="1.6em" height="1.6em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 5 22 12 13 19 13 5"/><polygon points="2 5 11 12 2 19 2 5"/></svg>`;
    case 'volume': return `<svg width="1.6em" height="1.6em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
    case 'mute': return `<svg width="1.6em" height="1.6em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
    case 'fullscreen': return `<svg width="1.6em" height="1.6em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>`;
    case 'cc': return `<svg width="1.6em" height="1.6em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="4"/><path d="M9 10a2 2 0 1 0 0 4"/><path d="M15 10a2 2 0 1 0 0 4"/></svg>`;
    case 'pip': return `<svg width="1.6em" height="1.6em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="9" y="13" width="6" height="6" rx="1"/></svg>`;
    default: return '';
  }
}
