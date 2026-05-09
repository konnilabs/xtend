import { xstate } from './xstate.js';

class XCalendar extends HTMLElement {
  static formAssociated = true;

  static get xtendComponentContract() {
    return {
      schema: 'xtend.component.contract.v2',
      tag: 'x-calendar',
      maturity: 'stable',
      source: {
        strategy: 'xtend.legacy-js-with-enterprise-profile.v1',
        state: 'js-runtime-profiled',
        sourcePath: 'components/xcalendar.js'
      },
      runtime: {
        format: 'esm',
        artifact: 'components/xcalendar.js',
        declaration: 'components/xcalendar.d.ts',
        localOnly: true,
        cdnAllowed: false
      },
      rmt: {
        adapter: 'xtend.component',
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      },
      fabric: {
        api: '@xtend-fabric',
        defaultLane: 'user-blocking'
      }
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: 'xtend.rmt.component-contract.v1',
      adapter: 'xtend.component',
      tag: 'x-calendar',
      schedules: ['component.visible.mount', 'component.idle.hydrate', 'ui.user-blocking.input', 'a11y.announce', 'diagnostics.snapshot'],
      hydration: { policy: 'visible', lane: 'user-blocking' },
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: 'xtend.a11y.profile.v1',
      componentRef: 'x-calendar',
      role: 'grid',
      accessibleName: 'required',
      focusStrategy: 'managed-grid-focus',
      keyboard: ['Tab', 'Enter', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'],
      screenreader: { signals: ['date-select', 'month-change'] },
      motionContrast: { reducedMotion: 'required', forcedColors: 'required' }
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: 'xtend.performance.component-profile.v1',
      componentRef: 'x-calendar',
      budgetClass: 'interactive-medium',
      lane: 'user-blocking',
      hydrationPolicy: 'visible',
      criticalMeasurements: ['mount', 'render', 'event'],
      cleanup: ['xstate-subscription']
    };
  }

  static get xtendFormControlUxProfile() {
    return {
      schema: 'xtend.component.form-control-ux-profile.v1',
      componentRef: 'x-calendar',
      family: 'date-entry',
      role: 'grid',
      valueMode: 'iso-date',
      slots: ['label', 'hint', 'error'],
      parts: ['root', 'control', 'label', 'helper', 'error'],
      events: ['date-select'],
      commands: ['focus', 'reset', 'set-value', 'snapshot'],
      stateKey: 'xcalendar-state-<id>',
      schedule: 'ui.user-blocking.input',
      fabric: { lane: 'user-blocking', a11yLane: 'a11y' },
      rmt: XCalendar.xtendRmtMetadata,
      validation: { valueMode: 'iso-date', errorRegion: 'role=alert aria-live=assertive' }
    };
  }

  constructor() {
    super();
    this._internals = this.attachInternals?.();
    this.attachShadow({ mode: 'open' });
    this._selected = null;
    this._viewDate = new Date();
    this._unsubscribeState = null;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          font-family: sans-serif;
        }
        .calendar {
          border: 1px solid var(--xtend-control-border, var(--border-color, #ccc));
          border-radius: var(--xtend-control-radius, var(--border-radius, 6px));
          padding: 1em;
          width: 280px;
          background: var(--xtend-control-bg, var(--background-color, #fff));
          color: var(--xtend-control-color, var(--text-color, #000));
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5em;
        }
        .header button {
          background: none;
          border: none;
          font-size: 1.2em;
          cursor: pointer;
          color: var(--text-color, #000);
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.25em;
        }
        .day, .dow {
          text-align: center;
          padding: 0.5em;
        }
        .dow {
          font-weight: bold;
          color: var(--text-muted, #666);
        }
        .day {
          cursor: pointer;
          border-radius: 4px;
          background: var(--day-bg, transparent);
          color: var(--text-color, #000);
        }
        .day:hover {
          background: var(--hover-bg, #f0f0f0);
        }
        .selected {
          background: var(--primary-color, #007bff);
          color: var(--selected-text-color, #fff);
        }
        .today {
          border: 1px solid var(--primary-color, #007bff);
        }
      </style>
      <div class="calendar" role="grid">
        <div class="header">
          <button id="prev" aria-label="Previous Month">&lt;</button>
          <div id="monthLabel"></div>
          <button id="next" aria-label="Next Month">&gt;</button>
        </div>
        <div class="grid" id="days"></div>
      </div>
    `;

    this._elements = {
      monthLabel: this.shadowRoot.querySelector('#monthLabel'),
      daysGrid: this.shadowRoot.querySelector('#days'),
      prevBtn: this.shadowRoot.querySelector('#prev'),
      nextBtn: this.shadowRoot.querySelector('#next'),
    };

    this._elements.prevBtn.addEventListener('click', () => {
      this._viewDate.setMonth(this._viewDate.getMonth() - 1);
      this._render();
      this._updateState();
    });

    this._elements.nextBtn.addEventListener('click', () => {
      this._viewDate.setMonth(this._viewDate.getMonth() + 1);
      this._render();
      this._updateState();
    });
  }

  connectedCallback() {
    // Eindeutige ID für State-Management
    if (!this.id) this.id = `xcalendar-${Math.random().toString(36).slice(2, 10)}`;

    this._render();

    // Initialen State setzen
    this._updateState();

    // State-Änderungen abonnieren (z.B. externes Setzen von Datum oder Ansicht)
    this._unsubscribeState = xstate.subscribe((key, value) => {
      if (key === `xcalendar-state-${this.id}` && typeof value === "object" && value !== null) {
        if (value.selected && value.selected !== this.value) {
          this.value = value.selected;
        }
        if (value.viewDate && value.viewDate !== this._getViewDateString()) {
          this._viewDate = new Date(value.viewDate);
          this._render();
        }
      }
    });
  }

  disconnectedCallback() {
    if (this._unsubscribeState) this._unsubscribeState();
  }

  _render() {
    const year = this._viewDate.getFullYear();
    const month = this._viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();

    const daysContainer = this._elements.daysGrid;
    daysContainer.innerHTML = "";

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    this._elements.monthLabel.textContent = `${monthNames[month]} ${year}`;

    const dow = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    for (const d of dow) {
      const div = document.createElement('div');
      div.className = 'dow';
      div.textContent = d;
      daysContainer.appendChild(div);
    }

    let start = (startDay + 6) % 7;
    for (let i = 0; i < start; i++) {
      daysContainer.appendChild(document.createElement('div'));
    }

    const today = new Date();
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dayEl = document.createElement('div');
      dayEl.className = 'day';
      dayEl.tabIndex = this._selected && date.toDateString() === this._selected.toDateString() ? 0 : -1;
      dayEl.textContent = d;
      dayEl.setAttribute("role", "gridcell");

      if (date.toDateString() === today.toDateString()) {
        dayEl.classList.add('today');
      }

      if (this._selected && date.toDateString() === this._selected.toDateString()) {
        dayEl.classList.add('selected');
        dayEl.setAttribute("aria-selected", "true");
      } else {
        dayEl.setAttribute("aria-selected", "false");
      }

      dayEl.addEventListener('click', () => {
        this._selected = date;
        this._internals?.setFormValue(date.toISOString().split("T")[0]);
        this._render();
        this._updateState();
        this.dispatchEvent(new CustomEvent("date-select", {
          detail: { value: this.value, date, source: "x-calendar" },
          bubbles: true,
          composed: true
        }));
      });

      daysContainer.appendChild(dayEl);
    }
  }

  _updateState() {
    if (this.id) {
      xstate.set(`xcalendar-state-${this.id}`, {
        selected: this.value,
        viewDate: this._getViewDateString()
      });
    }
  }

  _getViewDateString() {
    return this._viewDate.toISOString().split("T")[0];
  }

  get value() {
    return this._selected?.toISOString().split("T")[0] || "";
  }

  set value(dateStr) {
    const d = new Date(dateStr);
    if (!isNaN(d)) {
      this._selected = d;
      this._viewDate = new Date(d);
      this._render();
      this._updateState();
    }
  }

  checkValidity() {
    return true;
  }

  reportValidity() {
    return this.checkValidity();
  }

  reset() {
    this._selected = null;
    this._internals?.setFormValue("");
    this._render();
    this._updateState();
  }

  focus() {
    const selected = this.shadowRoot.querySelector('.day[aria-selected="true"]');
    const firstDay = this.shadowRoot.querySelector('.day');
    (selected || firstDay || this._elements.prevBtn).focus();
  }
}

customElements.define("x-calendar", XCalendar);
