import { xstate } from './xstate.js';

class XWriter extends HTMLElement {
  static get observedAttributes() {
    return ['storage-key'];
  }

  static get xtendComponentContract() {
    return {
      schema: 'xtend.component.contract.v2',
      tag: 'x-writer',
      maturity: 'stable',
      source: {
        strategy: 'xtend.legacy-js-with-enterprise-profile.v1',
        state: 'js-runtime-profiled',
        sourcePath: 'components/xwriter.js'
      },
      runtime: {
        format: 'esm',
        artifact: 'components/xwriter.js',
        declaration: 'components/xwriter.d.ts',
        localOnly: true,
        cdnAllowed: false
      },
      rmt: {
        adapter: 'xtend.component',
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      },
      fabric: {
        api: '@xtend-fabric',
        defaultLane: 'idle'
      }
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: 'xtend.rmt.component-contract.v1',
      adapter: 'xtend.component',
      tag: 'x-writer',
      schedules: ['component.visible.mount', 'component.idle.hydrate', 'ui.user-blocking.input', 'a11y.announce', 'diagnostics.snapshot'],
      hydration: { policy: 'idle', lane: 'idle' },
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: 'xtend.a11y.profile.v1',
      componentRef: 'x-writer',
      role: 'textbox',
      accessibleName: 'required',
      focusStrategy: 'editable-surface-focus',
      keyboard: ['Tab', 'Shift+Tab', 'Ctrl+B', 'Ctrl+I', 'Ctrl+S'],
      screenreader: { signals: ['writer-change', 'writer-save', 'writer-error'] },
      motionContrast: { reducedMotion: 'required', forcedColors: 'required' }
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: 'xtend.performance.component-profile.v1',
      componentRef: 'x-writer',
      budgetClass: 'background',
      lane: 'idle',
      hydrationPolicy: 'idle',
      criticalMeasurements: ['mount', 'hydrate', 'event'],
      cleanup: ['autosave-timer', 'xstate-subscription', 'theme-observer']
    };
  }

  static get xtendFormControlUxProfile() {
    return {
      schema: 'xtend.component.form-control-ux-profile.v1',
      componentRef: 'x-writer',
      family: 'rich-text-entry',
      role: 'textbox',
      valueMode: 'html-markdown-plain',
      slots: ['label', 'hint', 'error'],
      parts: ['root', 'control', 'toolbar', 'helper', 'error'],
      events: ['writer:change', 'writer:save', 'writer:error', 'writer:autosave', 'writer:export'],
      commands: ['focus', 'reset', 'set-value', 'snapshot'],
      stateKey: 'xwriter-content',
      schedule: 'component.idle.hydrate',
      fabric: { lane: 'idle', a11yLane: 'a11y', diagnosticsLane: 'diagnostics' },
      rmt: XWriter.xtendRmtMetadata,
      validation: { valueMode: 'html-markdown-plain', errorRegion: 'role=alert aria-live=assertive' }
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.api = this.getAttribute('api') || null;
    this.method = this.getAttribute('method') || 'POST';
    this.autosaveInterval = parseInt(this.getAttribute('autosave') || '0');
    this.markdownLibLoaded = false;
    this.saveTimer = null;
    this.storageKey = this.getAttribute('storage-key') || 'xwriter-content';
    this.currentFontSize = '16px'; // Default for new text
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'storage-key' && oldValue !== newValue) {
      this.storageKey = newValue || 'xwriter-content';
    }
  }

  async connectedCallback() {
    await this.loadMarkdownLib();
    if (this.api === "local") {
      this.loadFromLocalStorage();
    }
    this.registerEvents();
    if (this.autosaveInterval) this.initAutosave();
    this._observeThemeChange?.();
    this.enableExportButtons();

    // Example: save editor content in the global state
    xstate.set('xwriter-content', this.getHTML());
    // Optional: react to global changes
    this._unsubscribeState = xstate.subscribe((key, value, all) => {
      if (key === 'xwriter-content' && value !== this.getHTML()) {
        this.shadowRoot.querySelector('.editor').innerHTML = value || '';
      }
    });
  }

  disconnectedCallback() {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
    // Remove state listener
    if (this._unsubscribeState) this._unsubscribeState();
  }

  // Enable or disable export buttons based on library availability
  enableExportButtons() {
    const exportBtn = this.shadowRoot.querySelector('#exportBtn');
    const exportMd = this.shadowRoot.querySelector('#exportMd');
    const exportHtml = this.shadowRoot.querySelector('#exportHtml');
    
    if (exportBtn) exportBtn.disabled = false;
    if (exportMd) exportMd.disabled = !this.markdownLibLoaded;
    if (exportHtml) exportHtml.disabled = false;
  }

  _observeThemeChange() {
    const observer = new MutationObserver(() => {
      const theme = document.documentElement.getAttribute("data-theme");
      this.setAttribute("data-theme", theme);
    });
    const initialTheme = document.documentElement.getAttribute("data-theme");
    if (initialTheme) this.setAttribute("data-theme", initialTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: sans-serif;
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 1em;
          background: var(--form-background, #fff);
          color: var(--text-color, #000);
        }
        :host([data-theme="dark"]) {
          --form-background: #181b20;
          --text-color: #f1f1f1;
          --primary-color: #4fc3f7;
        }
        .toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5em;
          margin-bottom: 0.5em;
          align-items: center;
          position: relative;
        }
        .toolbar button,
        .toolbar select,
        .toolbar input[type="color"] {
          padding: 0.3em 0.6em;
          background: var(--primary-color, #007bff);
          color: white;
          border: none;
          border-radius: 3px;
          cursor: pointer;
        }
        .toolbar input[type="color"] {
          width: 32px;
          padding: 0;
          border: 1px solid #ccc;
        }
        .editor {
          min-height: 200px;
          border: 1px solid #ddd;
          padding: 1em;
          border-radius: 3px;
          background: var(--editor-bg, #fff);
          color: var(--text-color, #000);
          outline: none;
          transition: background 0.2s, color 0.2s;
        }
        :host([data-theme="dark"]) .editor {
          background: #23272e;
          border-color: #444;
        }
        .export-menu {
          position: absolute;
          left: 0;
          top: 100%;
          margin-top: 0.3em;
          background: var(--form-background, #fff);
          color: var(--text-color, #000);
          border: 1px solid #ccc;
          border-radius: 4px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          z-index: 100;
          min-width: 180px;
          display: none;
          flex-direction: column;
          padding: 0.3em 0;
          opacity: 0;
          transform: translateY(-10px) scale(0.98);
          pointer-events: none;
          transition: 
            opacity 0.18s cubic-bezier(.4,0,.2,1),
            transform 0.18s cubic-bezier(.4,0,.2,1);
        }
        .export-menu.open {
          display: flex;
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
          animation: menuFadeIn 0.18s cubic-bezier(.4,0,.2,1);
        }
        .export-menu button {
          background: none;
          color: inherit;
          border: none;
          text-align: left;
          padding: 0.7em 1.2em;
          cursor: pointer;
          font-size: 1em;
          border-radius: 0;
          transition: background 0.15s;
        }
        .export-menu button:hover,
        .export-menu button:focus {
          background: var(--primary-color, #007bff);
          color: #fff;
        }
        @keyframes menuFadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      </style>
      <div class="toolbar">
        <button data-cmd="bold" title="Fett"><b>B</b></button>
        <button data-cmd="italic" title="Kursiv"><i>I</i></button>
        <button data-cmd="underline" title="Unterstrichen"><u>U</u></button>
        <button data-cmd="strikeThrough" title="Durchgestrichen"><s>S</s></button>
        <label>Größe:
          <select id="fontSize">
            <option value="1">10px</option>
            <option value="2">13px</option>
            <option value="3" selected>16px</option>
            <option value="4">18px</option>
            <option value="5">24px</option>
            <option value="6">32px</option>
            <option value="7">48px</option>
          </select>
        </label>
        <label>Farbe:
          <input type="color" id="fontColor" value="#000000" />
        </label>
        <div style="position:relative;display:inline-block;">
          <button id="exportBtn" disabled>Export</button>
          <div class="export-menu" id="exportMenu">
            <button id="exportMd">Export als Markdown (.md)</button>
            <button id="exportHtml">Export als HTML (.html)</button>
          </div>
        </div>
        <button id="saveBtn">Save</button>
      </div>
      <div class="editor" contenteditable="true"></div>
    `;
  }

  registerEvents() {
    const editor = this.shadowRoot.querySelector('.editor');
    editor.style.fontSize = this.currentFontSize;

    // Formatierungen
    this.shadowRoot.querySelectorAll('.toolbar button[data-cmd]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.execCommand(btn.dataset.cmd, false, null);
        this.dispatchChangeEvent();
        editor.focus();
      });
    });

    this.shadowRoot.querySelector('#fontColor').addEventListener('input', e => {
      this.applyStyleToSelection('color', e.target.value);
      this.dispatchChangeEvent();
      editor.focus();
    });

    this.shadowRoot.querySelector('#fontSize').addEventListener('change', e => {
      const pxSizes = {
        1: '10px', 2: '13px', 3: '16px', 4: '18px', 5: '24px', 6: '32px', 7: '48px'
      };
      const sizePx = pxSizes[e.target.value] || '16px';
      this.currentFontSize = sizePx;
      editor.style.fontSize = sizePx;
      this.applyFontSizeToSelection(sizePx);
      this.dispatchChangeEvent();
      editor.focus();
    });

    // Export / Save
    const exportBtn = this.shadowRoot.querySelector('#exportBtn');
    const exportMenu = this.shadowRoot.querySelector('#exportMenu');
    const exportMd = this.shadowRoot.querySelector('#exportMd');
    const exportHtml = this.shadowRoot.querySelector('#exportHtml');

    // Enable or disable based on available functions
    exportBtn.disabled = false;
    exportMd.disabled = !this.markdownLibLoaded;
    exportHtml.disabled = false;

    // Export button for opening the menu
    exportBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("Export-Button geklickt, Menü wird geöffnet");
      this.toggleExportMenu();
    });

    // Menu entries with direct event listeners
    exportMd.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("Markdown-Button direkt geklickt!");
      this.doMarkdownExport();
    });

    exportHtml.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("HTML-Button direkt geklickt!");
      this.doHtmlExport();
    });

    // Debug listener to check whether events arrive at all
    exportMd.addEventListener('mousedown', () => {
      console.log("exportMd mousedown erkannt");
    });

    exportHtml.addEventListener('mousedown', () => {
      console.log("exportHtml mousedown erkannt");
    });

    // Clicks outside close the menu
    document.addEventListener('mousedown', (e) => {
      if (exportMenu.classList.contains('open') && 
          !exportMenu.contains(e.target) && 
          e.target !== exportBtn) {
        exportMenu.classList.remove('open');
      }
    });

    // Save-Button
    this.shadowRoot.querySelector('#saveBtn').addEventListener('click', () => this.save());

    editor.addEventListener('input', () => this.dispatchChangeEvent());
    editor.addEventListener('dragover', e => e.preventDefault());
    editor.addEventListener('drop', e => this.handleDrop(e));
  }

  // Helper for applying inline styles
  applyStyleToSelection(styleProp, value) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;

    const span = document.createElement('span');
    span.style[styleProp] = value;
    range.surroundContents(span);
  }

  // Apply font size to selected text, and to the editor style for an empty selection
  applyFontSizeToSelection(sizePx) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);

    if (range.collapsed) {
      // No text selected: only set the editor style, which is already done
      return;
    }

    // execCommand creates <font size="7">; replace it with <span style="font-size">
    document.execCommand('fontSize', false, '7');
    const editor = this.shadowRoot.querySelector('.editor');
    const fonts = editor.querySelectorAll('font[size="7"]');
    fonts.forEach(font => {
      const span = document.createElement('span');
      span.style.fontSize = sizePx;
      span.innerHTML = font.innerHTML;
      font.parentNode.replaceChild(span, font);
    });
  }

  handleDrop(e) {
    e.preventDefault();
    const data = e.dataTransfer;
    if (data.files.length > 0) {
      const file = data.files[0];
      const reader = new FileReader();
      if (file.type.startsWith("image/")) {
        reader.onload = () => {
          const img = document.createElement("img");
          img.src = reader.result;
          this.shadowRoot.querySelector(".editor").appendChild(img);
          this.dispatchChangeEvent();
        };
        reader.readAsDataURL(file);
      }
    } else {
      const text = data.getData("text/plain");
      if (text) {
        document.execCommand("insertText", false, text);
        this.dispatchChangeEvent();
      }
    }
  }

  dispatchChangeEvent() {
    const html = this.getHTML();
    const markdown = this.getMarkdown();
    const plain = this.getText();
    // Update editor content in global state
    xstate.set('xwriter-content', html);
    this._emitWriterEvent('writer:change', { html, markdown, plain });
  }

  get value() {
    return this.getHTML();
  }

  set value(content) {
    const editor = this.shadowRoot.querySelector('.editor');
    if (editor) {
      editor.innerHTML = content == null ? '' : String(content);
      this.dispatchChangeEvent();
    }
  }

  reset() {
    this.value = '';
  }

  focus() {
    this.shadowRoot.querySelector('.editor')?.focus();
  }

  getHTML() {
    return this.shadowRoot.querySelector('.editor').innerHTML;
  }

  getText() {
    return this.shadowRoot.querySelector('.editor').textContent;
  }

  getMarkdown() {
    if (!this.markdownLibLoaded || !window.TurndownService) return '';
    const turndown = new window.TurndownService({ headingStyle: 'atx' });

    turndown.addRule('spanWithStyle', {
      filter: node => node.nodeName === 'SPAN' && node.getAttribute('style'),
      replacement: (content, node) => {
        const style = node.getAttribute('style');
        return `<span style="${style}">${content}</span>`;
      }
    });

    return turndown.turndown(this.getHTML());
  }

  exportMarkdown() {
    if (!this.markdownLibLoaded || !window.TurndownService) {
      console.error("Markdown-Export nicht verfügbar - TurndownService fehlt");
      if (window.XToast) window.XToast.error("Markdown-Export nicht verfügbar.");
      if (window.XDialog) {
        window.XDialog.show({
          title: "Fehler",
          content: "Markdown-Export ist noch nicht verfügbar. Bitte warten Sie einen Moment und versuchen Sie es erneut.",
          actions: [
            { label: "OK", primary: true }
          ],
          overlay: true
        });
      } else {
        alert("Markdown-Export ist noch nicht verfügbar. Bitte warten Sie einen Moment und versuchen Sie es erneut.");
      }
      return;
    }
    
    const markdown = this.getMarkdown();
    console.log("Exportiere Markdown-Inhalt:", markdown.substring(0, 100) + "...");
    
    try {
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      
      // Create a visible download link that is removed after the click
      const a = document.createElement('a');
      a.href = url;
      a.download = 'export.md';
      a.textContent = "Download Markdown";
      a.style.position = 'fixed';
      a.style.bottom = '10px';
      a.style.left = '10px';
      a.style.zIndex = '9999';
      a.style.background = '#007bff';
      a.style.color = 'white';
      a.style.padding = '8px 16px';
      a.style.borderRadius = '4px';
      a.style.textDecoration = 'none';
      
      document.body.appendChild(a);
      a.click(); // Click automatically
      
      // Remove the link after 5 seconds
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 5000);
      
      this._emitWriterEvent('writer:export', { filename: 'export.md', success: true });
      
      if (window.XToast) {
        window.XToast.success("Export erfolgreich. Download sollte starten.");
      }
    } catch (err) {
      console.error("Fehler beim Markdown-Export:", err);
      if (window.XToast) {
        window.XToast.error("Export fehlgeschlagen: " + err.message);
      }
      this._emitWriterEvent('writer:export', { error: err.message, success: false });
    }
  }

  exportHTML() {
    try {
      const html = this.getHTML();
      console.log("Exportiere HTML-Inhalt:", html.substring(0, 100) + "...");
      
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Create a visible download link that is removed after the click
      const a = document.createElement('a');
      a.href = url;
      a.download = 'export.html';
      a.textContent = "Download HTML";
      a.style.position = 'fixed';
      a.style.bottom = '10px';
      a.style.left = '10px';
      a.style.zIndex = '9999';
      a.style.background = '#28a745';
      a.style.color = 'white';
      a.style.padding = '8px 16px';
      a.style.borderRadius = '4px';
      a.style.textDecoration = 'none';
      
      document.body.appendChild(a);
      a.click(); // Click automatically
      
      // Remove the link after 5 seconds
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 5000);
      
      this._emitWriterEvent('writer:export', { filename: 'export.html', success: true });
      
      if (window.XToast) {
        window.XToast.success("HTML-Export erfolgreich. Download sollte starten.");
      }
    } catch (err) {
      console.error("Fehler beim HTML-Export:", err);
      if (window.XToast) {
        window.XToast.error("Export fehlgeschlagen: " + err.message);
      }
      this._emitWriterEvent('writer:export', { error: err.message, success: false });
    }
  }

  async save(isAutosave = false) {
    if (this.api === "local") {
      const content = {
        html: this.getHTML(),
        markdown: this.getMarkdown(),
        plain: this.getText(),
        timestamp: Date.now()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(content));
      this._emitWriterEvent('writer:save', { status: "local", response: content });
      if (window.XToast) {
        if (isAutosave) {
          window.XToast.success("Autosave im Browser gespeichert.");
        } else {
          window.XToast.success("Im Browser gespeichert.");
        }
      }
      return;
    }

    if (!this.api) {
      this._emitWriterEvent('writer:error', { error: 'No API endpoint set.' });
      if (window.XToast) {
        if (isAutosave) {
          window.XToast.warning("Autosave fehlgeschlagen: Kein API-Endpunkt gesetzt.");
        } else {
          window.XToast.error("Fehler: Kein API-Endpunkt gesetzt.");
        }
      }
      return;
    }
    try {
      const response = await fetch(this.api, {
        method: this.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: this.getMarkdown() })
      });
      const result = await response.json();
      this._emitWriterEvent('writer:save', { status: response.status, response: result });
      if (window.XToast && !isAutosave) {
        window.XToast.success("Speichern erfolgreich.");
      }
    } catch (error) {
      this._emitWriterEvent('writer:error', { error });
      console.error('Fehler beim Speichern:', error);
      if (window.XToast) {
        if (isAutosave) {
          window.XToast.warning("Autosave fehlgeschlagen!");
        } else {
          window.XToast.error("Fehler beim Speichern!");
        }
      }
    }
  }

  loadFromLocalStorage() {
    const data = localStorage.getItem(this.storageKey);
    if (data) {
      try {
        const content = JSON.parse(data);
        const editor = this.shadowRoot.querySelector('.editor');
        if (editor && content.html) {
          editor.innerHTML = content.html;
          this.dispatchChangeEvent();
        }
      } catch (e) {
        console.warn("Konnte lokalen Editor-Inhalt nicht laden:", e);
      }
    }
  }

  initAutosave() {
    if (this.saveTimer) clearInterval(this.saveTimer);
    this.saveTimer = setInterval(() => {
      this.save(true);
      this._emitWriterEvent('writer:autosave', { source: 'x-writer' });
    }, this.autosaveInterval);
  }

  _emitWriterEvent(type, detail = {}) {
    this.dispatchEvent(new CustomEvent(type, {
      detail: { ...detail, source: 'x-writer' },
      bubbles: true,
      composed: true
    }));
  }

  async loadMarkdownLib() {
    console.log("Markdown-Bibliothek wird geladen...");
  
    if (window.TurndownService) {
      console.log("Markdown-Bibliothek bereits geladen");
      this.markdownLibLoaded = true;
      this.enableExportButtons();
      return;
    }
  
    try {
      console.log("Versuche Turndown zu laden...");
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = new URL('./turndown.js', import.meta.url).href;
        
        script.onload = () => {
          console.log("Turndown-Skript geladen, überprüfe TurndownService...");
          if (window.TurndownService) {
            console.log("TurndownService erfolgreich geladen");
            this.markdownLibLoaded = true;
            this.enableExportButtons();
            resolve();
          } else {
            console.error("TurndownService nicht gefunden nach Script-Load");
            reject(new Error("TurndownService nicht gefunden"));
          }
        };
        
        script.onerror = (e) => {
          console.error("Fehler beim Laden von Turndown:", e);
          reject(new Error("Turndown konnte nicht geladen werden"));
        };
        
        document.head.appendChild(script);
      });
    } catch (err) {
      console.error('Turndown konnte nicht geladen werden:', err);
      if (window.XToast) {
        window.XToast.error("Markdown-Bibliothek konnte nicht geladen werden");
      }
    }
  }

  // Open or close the export menu
  toggleExportMenu() {
    const exportMenu = this.shadowRoot.querySelector('#exportMenu');
    if (exportMenu.classList.contains('open')) {
      exportMenu.classList.remove('open');
    } else {
      exportMenu.classList.add('open');
    }
  }

  // Markdown export method
  doMarkdownExport() {
    console.log("Markdown-Export wird ausgeführt...");
  
    // Immediately check whether the Markdown library is available
    if (!this.markdownLibLoaded || !window.TurndownService) {
      console.error("Fehler: Markdown-Bibliothek nicht geladen!");
      if (window.XToast) window.XToast.error("Markdown-Bibliothek nicht geladen");
      else alert("Markdown-Bibliothek nicht geladen");
      return;
    }
  
    // Get content
    const markdown = this.getMarkdown();
    if (!markdown || markdown.length === 0) {
      console.error("Fehler: Kein Markdown-Inhalt generiert");
      if (window.XToast) window.XToast.error("Kein Inhalt zum Exportieren");
      else alert("Kein Inhalt zum Exportieren");
      return;
    }
  
    console.log("Markdown-Inhalt erstellt, Länge:", markdown.length);
  
    // Direct download via data URI, which is more robust than Blob
    try {
      const fileName = 'export-' + new Date().toISOString().slice(0,10) + '.md';
      const dataUri = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(markdown);
  
      const a = document.createElement('a');
      a.setAttribute('href', dataUri);
      a.setAttribute('download', fileName);
      a.style.display = 'none';
      document.body.appendChild(a);
  
      console.log("Download-Link erstellt, klicke zum Herunterladen...");
      a.click();
  
      setTimeout(() => {
        document.body.removeChild(a);
        console.log("Download-Link entfernt");
      }, 100);
  
      if (window.XToast) window.XToast.success("Markdown-Export erfolgreich");
    } catch (err) {
      console.error("Export-Fehler:", err);
      if (window.XToast) window.XToast.error("Export fehlgeschlagen: " + err.message);
      else alert("Export fehlgeschlagen: " + err.message);
    }
  
    // Close the menu
    this.shadowRoot.querySelector('#exportMenu').classList.remove('open');
  }

  // HTML export method
  doHtmlExport() {
    console.log("HTML-Export wird ausgeführt...");
  
    // Get content
    const html = this.getHTML();
    if (!html || html.length === 0) {
      console.error("Fehler: Kein HTML-Inhalt vorhanden");
      if (window.XToast) window.XToast.error("Kein Inhalt zum Exportieren");
      else alert("Kein Inhalt zum Exportieren");
      return;
    }
  
    console.log("HTML-Inhalt erstellt, Länge:", html.length);
  
    // Direct download via data URI, which is more robust than Blob
    try {
      const fileName = 'export-' + new Date().toISOString().slice(0,10) + '.html';
      const dataUri = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
  
      const a = document.createElement('a');
      a.setAttribute('href', dataUri);
      a.setAttribute('download', fileName);
      a.style.display = 'none';
      document.body.appendChild(a);
  
      console.log("Download-Link erstellt, klicke zum Herunterladen...");
      a.click();
  
      setTimeout(() => {
        document.body.removeChild(a);
        console.log("Download-Link entfernt");
      }, 100);
  
      if (window.XToast) window.XToast.success("HTML-Export erfolgreich");
    } catch (err) {
      console.error("Export-Fehler:", err);
      if (window.XToast) window.XToast.error("Export fehlgeschlagen: " + err.message);
      else alert("Export fehlgeschlagen: " + err.message);
    }
  
    // Close the menu
    this.shadowRoot.querySelector('#exportMenu').classList.remove('open');
  }
}

customElements.define('x-writer', XWriter);
