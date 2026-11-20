import { XIcon } from './xicon.definition.js';
import { componentState, markManagedComponentClass, componentListen, isManagedComponent, getManagedContext, emitManagedEvent } from './native-managed.js';
import { managedProfile } from './native-ui-profiles.js';
import { xtendState } from './xtend-state.definition.js';


function civilDateKey(date) {
  return `${String(date.getUTCFullYear()).padStart(4, '0')}-${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')}`;
}
function parseCivilDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new TypeError('Calendar dates must use YYYY-MM-DD');
  const [year,month,day]=value.split('-').map(Number), date=new Date(0);
  date.setUTCFullYear(year,month-1,day);date.setUTCHours(0,0,0,0);
  if (date.getUTCFullYear()!==year || date.getUTCMonth()!==month-1 || date.getUTCDate()!==day) throw new TypeError('Calendar date is not a real civil date');
  return date;
}
class XCalendar extends HTMLElement {
  static get observedAttributes() { return ['value', 'min', 'max', 'name', 'locale', 'disabled', 'required']; }
  attributeChangedCallback(name, oldValue, newValue) {
    if (!isManagedComponent(this) || oldValue === newValue) return;
    if (name === 'value') this.value = newValue || '';
    else this._render();
  }
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
      cleanup: ['xtend-state-subscription']
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
    this._nativeInitialViewDate = new Date(this._viewDate);
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
          cursor: pointer;
          color: var(--text-color, #000);
          inline-size: 2rem;
          block-size: 2rem;
          display: inline-grid;
          place-items: center;
          padding: 0;
        }
        .header button x-icon {
          pointer-events: none;
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
          <button id="prev" part="previous control" aria-label="Previous Month">
            <x-icon name="chevron-left" part="previous-icon control icon" decorative size="1rem"></x-icon>
          </button>
          <div id="monthLabel"></div>
          <button id="next" part="next control" aria-label="Next Month">
            <x-icon name="chevron-right" part="next-icon control icon" decorative size="1rem"></x-icon>
          </button>
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
      if (isManagedComponent(this)) { this._requestViewMonth(-1); return; }
      this._viewDate.setMonth(this._viewDate.getMonth() - 1);
      this._render();
      this._updateState();
    });

    this._elements.nextBtn.addEventListener('click', () => {
      if (isManagedComponent(this)) { this._requestViewMonth(1); return; }
      this._viewDate.setMonth(this._viewDate.getMonth() + 1);
      this._render();
      this._updateState();
    });
  }

  connectedCallback() {
    // Unique ID for state management
    if (!this.id) this.id = `xcalendar-${Math.random().toString(36).slice(2, 10)}`;

    this._render();

    // Set initial state
    this._updateState();

    // Subscribe to state changes, for example external date or view updates
    this._unsubscribeState = componentState(this, xtendState).subscribe((key, value) => {
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

  _prepareManagedCalendar() {
    const now = new Date(); this._nativeInitialViewDate = parseCivilDate(`${String(now.getFullYear()).padStart(4,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`);
    this._viewDate = new Date(this._nativeInitialViewDate);
  }

  _render() {
    const managed = isManagedComponent(this);
    const preserveFocus = managed && this._nativeDayNodes && [...this._nativeDayNodes.values()].includes(this.shadowRoot.activeElement);
    if (managed) this._nativeDayNodes = new Map();
    const year = managed ? this._viewDate.getUTCFullYear() : this._viewDate.getFullYear();
    const month = managed ? this._viewDate.getUTCMonth() : this._viewDate.getMonth();
    const firstDay = managed ? parseCivilDate(`${String(year).padStart(4,'0')}-${String(month+1).padStart(2,'0')}-01`) : new Date(year, month, 1);
    const lastDay = new Date(firstDay); if (managed) { lastDay.setUTCMonth(month+1); lastDay.setUTCDate(0); } else { lastDay.setMonth(month+1); lastDay.setDate(0); }
    const startDay = managed ? firstDay.getUTCDay() : firstDay.getDay();

    const daysContainer = this._elements.daysGrid;
    daysContainer.innerHTML = "";

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const locale = this.getAttribute('locale') || 'en-GB';
    this._elements.monthLabel.textContent = isManagedComponent(this) ? new Intl.DateTimeFormat(locale,{month:'long',year:'numeric',calendar:'gregory',timeZone:'UTC'}).format(this._viewDate) : `${monthNames[month]} ${year}`;

    const localeInfo = managed ? new Intl.Locale(locale) : null;
    const textInfo = localeInfo ? typeof localeInfo.getTextInfo === 'function' ? localeInfo.getTextInfo() : localeInfo.textInfo : null;
    if (managed) { this._nativeCalendarDirection = textInfo?.direction || 'ltr'; daysContainer.dir = this._nativeCalendarDirection; }
    let weekStart=1;
    if (isManagedComponent(this)) { const region=new Intl.Locale(locale);const info=typeof region.getWeekInfo==='function'?region.getWeekInfo():region.weekInfo;weekStart=(info?.firstDay || 1)%7; }
    if (managed) this._nativeWeekStart = weekStart;
    const dow = isManagedComponent(this) ? Array.from({length:7},(_,index)=>new Intl.DateTimeFormat(locale,{weekday:'short',timeZone:'UTC'}).format(new Date(Date.UTC(2023,0,1+(weekStart+index)%7)))) : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    for (const d of dow) {
      const div = document.createElement('div');
      div.className = 'dow';
      if (managed) div.setAttribute('role', 'columnheader');
      div.textContent = d;
      daysContainer.appendChild(div);
    }

    let start = isManagedComponent(this) ? (startDay-weekStart+7)%7 : (startDay + 6) % 7;
    for (let i = 0; i < start; i++) {
      daysContainer.appendChild(document.createElement('div'));
    }

    const today = new Date();
    for (let d = 1; d <= (managed ? lastDay.getUTCDate() : lastDay.getDate()); d++) {
      const date = managed ? parseCivilDate(`${String(year).padStart(4,'0')}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`) : new Date(year, month, d);
      const dayEl = document.createElement('div');
      dayEl.className = 'day';
      dayEl.tabIndex = this._selected && date.toDateString() === this._selected.toDateString() ? 0 : -1;
      dayEl.textContent = managed ? new Intl.NumberFormat(locale,{useGrouping:false}).format(d) : d;
      dayEl.setAttribute("role", "gridcell");

      if (managed ? civilDateKey(date) === `${String(today.getFullYear()).padStart(4,'0')}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}` : date.toDateString() === today.toDateString()) {
        dayEl.classList.add('today');
      }

      if (this._selected && date.toDateString() === this._selected.toDateString()) {
        dayEl.classList.add('selected');
        dayEl.setAttribute("aria-selected", "true");
      } else {
        dayEl.setAttribute("aria-selected", "false");
      }

      const key = isManagedComponent(this) ? civilDateKey(date) : date.toISOString().slice(0,10);
      const unavailable = isManagedComponent(this) && (this.hasAttribute('disabled') || this.getAttribute('min') && key < this.getAttribute('min') || this.getAttribute('max') && key > this.getAttribute('max'));
      if (unavailable) { dayEl.setAttribute('aria-disabled', 'true'); dayEl.tabIndex = -1; }
      if (managed) {
        this._nativeDayNodes.set(key, dayEl);
        dayEl.setAttribute('aria-label', new Intl.DateTimeFormat(locale,{dateStyle:'full',calendar:'gregory',timeZone:'UTC'}).format(date));
        dayEl.addEventListener('focus', () => { this._nativeFocusedDate = key; for (const [entry,node] of this._nativeDayNodes) node.tabIndex = entry === key ? 0 : -1; });
        dayEl.addEventListener('keydown', event => this._handleNativeCalendarKey(event, key));
      }
      dayEl.addEventListener('click', () => {
        if (unavailable) return;
        if (isManagedComponent(this)) { this.dispatchEvent(new CustomEvent('date-select', { detail: { value: key, date: key, source: 'x-calendar' }, bubbles: true, composed: true })); return; }
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
    if (managed) {
      this.shadowRoot.querySelector('.calendar').setAttribute('aria-labelledby','monthLabel');
      this._elements.monthLabel.setAttribute('aria-live','polite');
      const available = node => node && node.getAttribute('aria-disabled') !== 'true';
      const candidate = [this._nativeDayNodes.get(this._nativeFocusedDate),this._nativeDayNodes.get(this.value),...this._nativeDayNodes.values()].find(available);
      for (const node of this._nativeDayNodes.values()) node.tabIndex = node === candidate ? 0 : -1;
      this._elements.prevBtn.disabled = this.hasAttribute('disabled') || year === 0 && month === 0;
      this._elements.nextBtn.disabled = this.hasAttribute('disabled') || year === 9999 && month === 11;
      if (candidate && (preserveFocus || this._nativeNeedsFocus) && getManagedContext(this).isActive()) { this._nativeNeedsFocus = false; candidate.focus({preventScroll:true}); }
    }
  }

  _handleNativeCalendarKey(event,key) {
    if (!getManagedContext(this).isActive() || this.hasAttribute('disabled')) return;
    const node = this._nativeDayNodes.get(key);
    if (!node || node.getAttribute('aria-disabled') === 'true') return;
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); node.click(); return; }
    const date = parseCivilDate(key), offset = (date.getUTCDay() - (this._nativeWeekStart || 0) + 7) % 7, rtl = this._nativeCalendarDirection === 'rtl';
    const movement = {ArrowLeft:rtl?1:-1,ArrowRight:rtl?-1:1,ArrowUp:-7,ArrowDown:7,Home:-offset,End:6-offset};
    if (!Object.hasOwn(movement,event.key)) return;
    event.preventDefault();date.setUTCDate(date.getUTCDate()+movement[event.key]);
    if (date.getUTCFullYear()<0 || date.getUTCFullYear()>9999) return;
    let next = civilDateKey(date);
    const min=this.getAttribute('min'),max=this.getAttribute('max');
    if (min && next<min) next=min;if(max && next>max)next=max;
    const target = this._nativeDayNodes.get(next);
    if (target && target.getAttribute('aria-disabled')!=='true') { target.focus({preventScroll:true}); return; }
    const desired=parseCivilDate(next),viewDate=next.slice(0,8)+'01';
    this._nativeFocusedDate=next;this._nativeNeedsFocus=true;
    if (this._nativeViewDateControlled) { if (!emitManagedEvent(this,'calendar-view-changed',{viewDate})) this._nativeNeedsFocus=false; }
    else { this._viewDate=desired;this._render();emitManagedEvent(this,'calendar-view-changed',{viewDate}); }
  }

  _updateState() {
    if (this.id) {
      componentState(this, xtendState).set(`xcalendar-state-${this.id}`, {
        selected: this.value,
        viewDate: this._getViewDateString()
      });
    }
  }

  get viewDate() { return this._nativeViewDateControlled ? civilDateKey(this._viewDate) : undefined; }
  set viewDate(value) {
    if (value===undefined && getManagedContext(this)?.isApplyingUpdate()) { this._nativeViewDateControlled=false;this._viewDate=new Date(this._selected || this._nativeInitialViewDate); }
    else { this._viewDate=parseCivilDate(value);this._nativeViewDateControlled=true; }
    if (!isManagedComponent(this) || getManagedContext(this).isActive()) this._render();
  }
  _requestViewMonth(delta) {
    if (this.hasAttribute('disabled')) return;
    const next=new Date(this._viewDate);next.setUTCDate(1);next.setUTCMonth(next.getUTCMonth()+delta);
    if (next.getUTCFullYear()<0 || next.getUTCFullYear()>9999) return;
    const viewDate=civilDateKey(next);
    if (!this._nativeViewDateControlled) {this._viewDate=next;this._render();}
    this.dispatchEvent(new CustomEvent('calendar-view-changed',{detail:{viewDate},bubbles:true,composed:true}));
  }

  _getViewDateString() {
    if (isManagedComponent(this)) return civilDateKey(this._viewDate);
    return this._viewDate.toISOString().split("T")[0];
  }

  get value() {
    return this._selected ? isManagedComponent(this) ? civilDateKey(this._selected) : this._selected.toISOString().split('T')[0] : '';
  }

  set value(dateStr) {
    if (isManagedComponent(this) && !dateStr) { this._selected = null; this._render(); return; }
    const d = isManagedComponent(this) ? parseCivilDate(dateStr) : new Date(dateStr);
    if (!isNaN(d)) {
      this._selected = d;
      if (!isManagedComponent(this) || !this._nativeViewDateControlled) this._viewDate = new Date(d);
      this._render();
      this._updateState();
    }
  }

  checkValidity() {
    if (isManagedComponent(this)) {
      if (this.hasAttribute('disabled')) return true;
      const value = this.value;
      return !(this.hasAttribute('required') && !value || value && this.getAttribute('min') && value < this.getAttribute('min') || value && this.getAttribute('max') && value > this.getAttribute('max'));
    }
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
    if (isManagedComponent(this)) { if (this.hasAttribute('disabled')) return; const target=[...this._nativeDayNodes.values()].find(node=>node.tabIndex===0 && node.getAttribute('aria-disabled')!=='true');target?.focus();return; }
    const selected = this.shadowRoot.querySelector('.day[aria-selected="true"]');
    const firstDay = this.shadowRoot.querySelector('.day');
    (selected || firstDay || this._elements.prevBtn).focus();
  }
}



markManagedComponentClass(XCalendar, "x-calendar", managedProfile("x-calendar"));
export { XCalendar };

export default XCalendar;
export const nativeDependencies = Object.freeze([["x-icon", XIcon]]);
