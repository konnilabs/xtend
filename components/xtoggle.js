import { xstate } from './xstate.js';
const X_TOGGLE_STATE_SCHEMA = 'xtend.component.x-toggle.state.v1';
class XToggle extends HTMLElement {
    static formAssociated = true;
    static get observedAttributes() {
        return ['name', 'value', 'checked', 'disabled', 'required', 'label', 'busy', 'invalid', 'density'];
    }
    static get xtendComponentContract() {
        return {
            schema: 'xtend.component.contract.v2',
            tag: 'x-toggle',
            maturity: 'stable',
            source: {
                strategy: 'xtend.typescript.component-source-strategy.v1',
                state: 'ts-generated-esm',
                sourcePath: 'src/components/x-toggle/x-toggle.ts'
            },
            runtime: {
                format: 'esm',
                artifact: 'components/xtoggle.js',
                declaration: 'components/xtoggle.d.ts',
                localOnly: true,
                cdnAllowed: false
            },
            rmt: {
                adapter: 'xtend.component',
                kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
            },
            fabric: {
                api: '@xtend-fabric',
                defaultLane: 'user-blocking',
                a11yLane: 'a11y',
                diagnosticsLane: 'diagnostics'
            }
        };
    }
    static get xtendRmtMetadata() {
        return {
            schema: 'xtend.rmt.component-contract.v1',
            adapter: 'xtend.component',
            tag: 'x-toggle',
            componentRecordKind: 'custom_element',
            templateMode: 'dom_descriptor',
            eventBindingMode: 'dom-event-to-rmt-command',
            schedules: ['component.visible.mount', 'component.idle.hydrate', 'ui.user-blocking.input', 'a11y.announce', 'diagnostics.snapshot'],
            hydration: { policy: 'visible', lane: 'user-blocking' },
            shellAuthoring: {
                schema: 'xtend.rmt.shell-authoring.component.v1',
                host: 'x-toggle',
                attributes: ['name', 'value', 'checked', 'disabled', 'required', 'label', 'busy', 'invalid', 'density'],
                events: ['toggle-changed', 'toggle-invalid']
            },
            kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
        };
    }
    static get xtendComponentLifecycleTelemetry() {
        return {
            schema: 'xtend.component.lifecycle-telemetry.v1',
            componentRef: 'x-toggle',
            operations: ['mount', 'hydrate', 'render', 'update', 'event', 'keyboard', 'error', 'unmount'],
            snapshotPath: 'snapshot.componentTelemetry',
            fabric: {
                lane: 'user-blocking',
                a11yLane: 'a11y',
                diagnosticsLane: 'diagnostics'
            }
        };
    }
    static get xtendScaffoldA11yProfile() {
        return {
            schema: 'xtend.a11y.profile.v1',
            componentRef: 'x-toggle',
            role: 'switch',
            accessibleName: 'required',
            focusStrategy: 'native-control-focus',
            keyboard: ['Tab', 'Space'],
            ariaStates: ['aria-checked', 'aria-invalid', 'aria-describedby', 'aria-required', 'aria-disabled', 'aria-busy'],
            screenreader: { signalContract: XToggle.xtendScreenreaderSignals },
            motionContrast: { policy: XToggle.xtendMotionContrastPolicy }
        };
    }
    static get xtendScaffoldPerformanceProfile() {
        return {
            schema: 'xtend.performance.component-profile.v1',
            componentRef: 'x-toggle',
            budgetClass: 'interactive-small',
            lane: 'user-blocking',
            hydrationPolicy: 'visible',
            criticalMeasurements: ['mount', 'event', 'keyboard', 'state-sync'],
            interaction: {
                clickBudgetMs: 8,
                keyboardBudgetMs: 8,
                touchTargetMinPx: 44,
                disabledBusyGuards: true
            },
            cleanup: ['toggle-event-listeners', 'xstate-subscription']
        };
    }
    static get xtendFormControlUxProfile() {
        return {
            schema: 'xtend.component.form-control-ux-profile.v1',
            componentRef: 'x-toggle',
            family: 'selection',
            role: 'switch',
            valueMode: 'boolean-or-token',
            slots: ['default', 'label', 'hint', 'error', 'on-label', 'off-label'],
            parts: ['root', 'control', 'track', 'thumb', 'state', 'label', 'helper', 'error'],
            events: ['toggle-changed', 'toggle-invalid'],
            commands: ['focus', 'validate', 'reset', 'set-value', 'announce-error'],
            stateKey: 'xtoggle-checked-<id>',
            schedule: 'ui.user-blocking.input',
            fabric: { lane: 'user-blocking', a11yLane: 'a11y', diagnosticsLane: 'diagnostics' },
            rmt: XToggle.xtendRmtMetadata,
            validation: { validityApi: true, errorRegion: 'role=alert aria-live=assertive' },
            densityProfiles: ['comfortable', 'compact', 'dense'],
            states: ['checked', 'unchecked', 'required', 'disabled', 'busy', 'invalid'],
            signatureDesign: {
                note: 'iOS-inspired switch with native checkbox reliability, tokenized track/thumb styling and explicit non-color state affordances.',
                tokenStrategy: 'toggle tokens map track, thumb, focus, disabled, busy, validation and density states.',
                reference: 'Apple Human Interface Guidelines Toggles'
            }
        };
    }
    static get xtendScreenreaderSignals() {
        return {
            schema: 'xtend.a11y.screenreader-signals.v1',
            componentRef: 'x-toggle',
            liveRegion: 'polite',
            signals: ['checked-state', 'validation-error-summary'],
            statusRegions: ['role=status', 'aria-live=polite'],
            errorRegions: ['role=alert', 'aria-live=assertive'],
            fabric: {
                lane: 'a11y',
                fiberKind: 'a11y.announce',
                scheduleRef: 'a11y.user-blocking.announce'
            }
        };
    }
    static get xtendMotionContrastPolicy() {
        return {
            schema: 'xtend.a11y.motion-contrast-policy.v1',
            componentRef: 'x-toggle',
            motion: {
                schema: 'xtend.a11y.motion-policy.v1',
                mediaQuery: '(prefers-reduced-motion: reduce)',
                reducedMotion: 'required',
                animationPolicy: 'state-change-without-motion-only-feedback',
                noMotionOnlyState: true
            },
            contrast: {
                schema: 'xtend.a11y.contrast-policy.v1',
                mediaQuery: '(forced-colors: active)',
                highContrast: 'required',
                forcedColorAdjust: 'auto',
                focusVisible: 'required',
                nonColorStatus: 'required'
            },
            fabric: {
                lane: 'a11y',
                fiberKind: 'a11y.preference',
                scheduleRef: 'a11y.user-blocking.preference'
            }
        };
    }
    control;
    labelText;
    stateText;
    internalsRef;
    unsubscribeState;
    constructor() {
        super();
        this.internalsRef = this.attachInternals?.();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          box-sizing: border-box;
          max-width: 100%;
          color: var(--xtend-toggle-text, var(--xtend-form-text, var(--text-color, #111827)));
          font-family: var(--xtend-toggle-font-family, var(--xtend-form-font-family, var(--xtend-font-family-body, inherit)));
          font-size: var(--xtend-toggle-font-size, var(--xtend-form-control-font-size, 1rem));
          --xtend-toggle-width: var(--xtend-form-toggle-width, 3.25rem);
          --xtend-toggle-height: var(--xtend-form-toggle-height, 1.875rem);
          --xtend-toggle-thumb-size: calc(var(--xtend-toggle-height) - 0.375rem);
          --xtend-toggle-gap: var(--xtend-form-gap, 0.6rem);
          --xtend-toggle-control-surface: var(--xtend-form-control-surface, var(--xtend-control-bg, #d1d5db));
          --xtend-toggle-control-text: var(--xtend-form-control-text, currentColor);
          --xtend-toggle-track-off: var(--xtend-toggle-track-off-color, var(--xtend-toggle-control-surface));
          --xtend-toggle-track-on: var(--xtend-toggle-track-on-color, var(--xtend-form-accent-color, var(--xtend-control-color, var(--primary-color, #34c759))));
          --xtend-toggle-track-border: var(--xtend-toggle-border-color, var(--xtend-form-control-border, rgba(17, 24, 39, 0.18)));
          --xtend-toggle-thumb: var(--xtend-toggle-thumb-color, #ffffff);
          --xtend-toggle-focus: var(--xtend-toggle-focus-ring, var(--xtend-form-focus-ring, var(--xtend-control-focus, 2px solid var(--primary-color, #2563eb))));
          --xtend-toggle-error: var(--xtend-form-error-text, var(--error-color, #b42318));
          --xtend-toggle-error-surface: var(--xtend-form-error-surface, #fff1ed);
          --xtend-toggle-error-border: var(--xtend-form-error-border, var(--xtend-toggle-error));
          --xtend-toggle-radius: var(--xtend-form-radius, 999px);
          --xtend-form-icon-color: var(--xtend-toggle-control-text);
        }
        :host([density="comfortable"]) {
          --xtend-toggle-width: 3.5rem;
          --xtend-toggle-height: 2rem;
        }
        :host([density="compact"]) {
          --xtend-toggle-width: 3rem;
          --xtend-toggle-height: 1.7rem;
          --xtend-toggle-gap: 0.5rem;
        }
        :host([density="dense"]) {
          --xtend-toggle-width: 2.7rem;
          --xtend-toggle-height: 1.5rem;
          --xtend-toggle-gap: 0.4rem;
          font-size: var(--xtend-form-dense-font-size, 0.92rem);
        }
        .root {
          display: inline-grid;
          grid-template-columns: auto minmax(0, 1fr);
          grid-template-areas:
            "switch label"
            ". hint"
            ". error";
          align-items: center;
          column-gap: var(--xtend-toggle-gap);
          row-gap: 0.25rem;
          max-width: 100%;
          cursor: pointer;
        }
        input {
          position: absolute;
          width: 1px;
          height: 1px;
          margin: -1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          white-space: nowrap;
          border: 0;
        }
        .track {
          grid-area: switch;
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;
          width: var(--xtend-toggle-width);
          min-width: var(--xtend-toggle-width);
          height: var(--xtend-toggle-height);
          border: 1px solid var(--xtend-toggle-track-border);
          border-radius: var(--xtend-toggle-radius);
          background: var(--xtend-toggle-track-off);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.26);
          transition: background 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }
        .thumb {
          position: absolute;
          top: 50%;
          left: 0.1875rem;
          width: var(--xtend-toggle-thumb-size);
          height: var(--xtend-toggle-thumb-size);
          border-radius: 50%;
          background: var(--xtend-toggle-thumb);
          color: var(--xtend-toggle-control-text);
          box-shadow: 0 1px 4px rgba(15, 23, 42, 0.28);
          transform: translate(0, -50%);
          transition: transform 160ms ease;
        }
        .state {
          position: absolute;
          inset: 0;
          display: block;
          overflow: hidden;
          color: var(--xtend-toggle-state-text, var(--xtend-form-icon-color, rgba(17, 24, 39, 0.64)));
          font-size: var(--xtend-toggle-state-font-size, 0.625rem);
          font-weight: 700;
          letter-spacing: 0;
          line-height: 1;
          pointer-events: none;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .state-label {
          position: absolute;
          top: 50%;
          display: block;
          box-sizing: border-box;
          max-width: calc(var(--xtend-toggle-width) - var(--xtend-toggle-thumb-size) - 0.75rem);
          min-width: 0;
          overflow: hidden;
          text-overflow: clip;
          transform: translateY(-50%);
          white-space: nowrap;
        }
        .state-label slot,
        slot[name="on-label"]::slotted(*),
        slot[name="off-label"]::slotted(*) {
          white-space: nowrap;
        }
        .state-label-on {
          left: 0.48rem;
          text-align: left;
        }
        .state-label-off {
          right: 0.42rem;
          text-align: right;
        }
        .label {
          grid-area: label;
          min-width: 0;
          color: var(--xtend-toggle-label-text, var(--xtend-form-label-text, currentColor));
          font-weight: var(--xtend-form-label-font-weight, 600);
          line-height: 1.35;
          overflow-wrap: anywhere;
        }
        .hint {
          grid-area: hint;
          color: var(--xtend-form-helper-text, var(--muted-color, #6b7280));
          font-size: var(--xtend-form-helper-font-size, 0.875rem);
          line-height: 1.45;
          overflow-wrap: anywhere;
        }
        .error {
          display: none;
          grid-area: error;
          color: var(--xtend-form-error-text, var(--error-color, #b42318));
          background: var(--xtend-toggle-error-surface);
          border-inline-start: 3px solid currentColor;
          border-radius: var(--xtend-form-error-radius, 0.35rem);
          padding: 0.25rem 0 0.25rem 0.55rem;
          font-size: var(--xtend-form-helper-font-size, 0.875rem);
          font-weight: 600;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }
        input:checked + .track {
          background: var(--xtend-toggle-track-on);
          border-color: var(--xtend-toggle-track-on);
        }
        input:checked + .track .thumb {
          transform: translate(calc(var(--xtend-toggle-width) - var(--xtend-toggle-height)), -50%);
        }
        input:focus-visible + .track {
          outline: var(--xtend-toggle-focus);
          outline-offset: 3px;
        }
        :host([invalid]) .track {
          border-color: var(--xtend-toggle-error-border);
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--xtend-toggle-error-border) 35%, transparent);
        }
        :host([invalid]) .error {
          display: block;
        }
        :host([disabled]),
        :host([busy]) {
          opacity: var(--xtend-form-disabled-opacity, 0.72);
        }
        :host([disabled]) .root {
          cursor: not-allowed;
        }
        :host([busy]) .root {
          cursor: progress;
        }
        :host([busy]) .track::after {
          content: "";
          position: absolute;
          inset: 0.35rem;
          border: 2px solid rgba(255, 255, 255, 0.78);
          border-top-color: transparent;
          border-radius: 999px;
          animation: xtoggle-spin 760ms linear infinite;
        }
        @keyframes xtoggle-spin {
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .track,
          .thumb,
          :host([busy]) .track::after {
            transition: none !important;
            animation: none !important;
          }
        }
        @media (forced-colors: active) {
          .track,
          .thumb,
          .error {
            forced-color-adjust: auto;
          }
          .track {
            background: Canvas;
            border: 2px solid CanvasText;
          }
          input:checked + .track {
            background: Highlight;
            border-color: Highlight;
          }
          .thumb {
            background: CanvasText;
          }
          input:checked + .track .thumb {
            background: HighlightText;
          }
          input:focus-visible + .track {
            outline: 2px solid Highlight;
          }
          .error {
            background: Mark;
            color: MarkText;
            border: 1px solid MarkText;
            padding: 0.25rem;
          }
        }
      </style>
      <label class="root" part="root">
        <input id="control" part="control" type="checkbox" role="switch" aria-describedby="hint error">
        <span class="track" part="track" aria-hidden="true">
          <span class="state" part="state">
            <span class="state-label state-label-on"><slot name="on-label">I</slot></span>
            <span class="state-label state-label-off"><slot name="off-label">O</slot></span>
          </span>
          <span class="thumb" part="thumb"></span>
        </span>
        <span class="label" part="label"><slot name="label"><span id="label-text"></span></slot><slot></slot></span>
        <span id="hint" class="hint" part="helper"><slot name="hint"></slot></span>
        <span id="error" class="error" part="error status" role="alert" aria-live="assertive" aria-atomic="true"><slot name="error">This toggle is required.</slot></span>
      </label>
      <span id="state-status" part="status" role="status" aria-live="polite" aria-atomic="true" hidden></span>
    `;
        this.control = this.shadowRoot.querySelector('#control');
        this.labelText = this.shadowRoot.querySelector('#label-text');
        this.stateText = this.shadowRoot.querySelector('#state-status');
        this.handleChange = this.handleChange.bind(this);
        this.handleInvalid = this.handleInvalid.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
    }
    connectedCallback() {
        if (!this.id)
            this.id = `xtoggle-${Math.random().toString(36).slice(2, 10)}`;
        this.upgradeAttributes();
        this.control.addEventListener('change', this.handleChange);
        this.control.addEventListener('invalid', this.handleInvalid);
        this.control.addEventListener('keydown', this.handleKeydown);
        this.syncControl();
        this.publishState('attribute');
        this.unsubscribeState = xstate.subscribe((key, value) => {
            if (key === this.stateKey && typeof value === 'boolean' && value !== this.checked) {
                this.setChecked(value, { emit: false, source: 'property' });
            }
        }, this.stateKey);
    }
    disconnectedCallback() {
        this.control.removeEventListener('change', this.handleChange);
        this.control.removeEventListener('invalid', this.handleInvalid);
        this.control.removeEventListener('keydown', this.handleKeydown);
        if (this.unsubscribeState)
            this.unsubscribeState();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.control || oldValue === newValue)
            return;
        if (name === 'checked') {
            this.control.checked = this.hasAttribute('checked');
            this.syncFormValue();
            this.publishState('attribute');
            return;
        }
        if (name === 'disabled') {
            this.control.disabled = this.hasAttribute('disabled');
            this.setAttribute('aria-disabled', String(this.hasAttribute('disabled')));
            this.syncFormValue();
            return;
        }
        if (name === 'required') {
            this.control.required = this.hasAttribute('required');
            this.control.setAttribute('aria-required', String(this.hasAttribute('required')));
            this.syncFormValue();
            return;
        }
        if (name === 'busy') {
            this.control.setAttribute('aria-busy', String(this.hasAttribute('busy')));
            return;
        }
        if (name === 'invalid') {
            this.control.setAttribute('aria-invalid', String(this.hasAttribute('invalid')));
            return;
        }
        if (name === 'name') {
            this.control.name = newValue || '';
            return;
        }
        if (name === 'value') {
            this.control.value = newValue || 'on';
            this.syncFormValue();
            return;
        }
        if (name === 'label') {
            this.labelText.textContent = newValue || '';
            if (newValue)
                this.control.setAttribute('aria-label', newValue);
            else
                this.control.removeAttribute('aria-label');
        }
    }
    get checked() {
        return this.control.checked;
    }
    set checked(value) {
        this.setChecked(Boolean(value), { emit: false, source: 'property' });
    }
    get value() {
        return this.getAttribute('value') || 'on';
    }
    set value(value) {
        this.setAttribute('value', value == null ? 'on' : String(value));
    }
    get stateKey() {
        return `xtoggle-checked-${this.id}`;
    }
    toggle() {
        if (this.isInteractionBlocked())
            return;
        this.setChecked(!this.checked, { emit: true, source: 'user' });
    }
    reset() {
        this.setChecked(false, { emit: true, source: 'reset' });
    }
    validate() {
        return this.reportValidity();
    }
    formResetCallback() {
        this.setChecked(this.hasAttribute('checked'), { emit: false, source: 'reset' });
    }
    formDisabledCallback(disabled) {
        this.control.disabled = Boolean(disabled) || this.hasAttribute('disabled');
        this.setAttribute('aria-disabled', String(this.control.disabled));
        this.syncFormValue();
    }
    checkValidity() {
        this.syncFormValue();
        return this.control.checkValidity();
    }
    reportValidity() {
        this.syncFormValue();
        const valid = this.control.reportValidity();
        if (!valid)
            this.handleInvalid();
        return valid;
    }
    focus() {
        this.control.focus();
    }
    upgradeAttributes() {
        XToggle.observedAttributes.forEach((attribute) => {
            if (this.hasAttribute(attribute)) {
                this.attributeChangedCallback(attribute, null, this.getAttribute(attribute));
            }
        });
    }
    syncControl() {
        this.control.name = this.getAttribute('name') || '';
        this.control.value = this.value;
        this.control.checked = this.hasAttribute('checked');
        this.control.disabled = this.hasAttribute('disabled');
        this.control.required = this.hasAttribute('required');
        if (this.hasAttribute('label')) {
            const label = this.getAttribute('label') || '';
            this.labelText.textContent = label;
            this.control.setAttribute('aria-label', label);
        }
        this.setAttribute('aria-disabled', String(this.hasAttribute('disabled')));
        this.control.setAttribute('aria-required', String(this.hasAttribute('required')));
        this.control.setAttribute('aria-busy', String(this.hasAttribute('busy')));
        this.syncFormValue();
    }
    setChecked(value, options) {
        const nextChecked = Boolean(value);
        const previous = this.checked;
        this.control.checked = nextChecked;
        if (nextChecked) {
            if (!this.hasAttribute('checked'))
                this.setAttribute('checked', '');
        }
        else if (this.hasAttribute('checked')) {
            this.removeAttribute('checked');
        }
        this.syncFormValue();
        this.publishState(options.source);
        if (options.emit && previous !== nextChecked) {
            this.emitChanged();
        }
    }
    handleChange() {
        if (this.isInteractionBlocked()) {
            this.control.checked = this.hasAttribute('checked');
            this.syncFormValue();
            return;
        }
        this.setChecked(this.control.checked, { emit: true, source: 'user' });
    }
    handleKeydown(event) {
        if (event.key !== ' ')
            return;
        if (this.isInteractionBlocked()) {
            event.preventDefault();
        }
    }
    handleInvalid() {
        this.setAttribute('invalid', '');
        this.dispatchEvent(new CustomEvent('toggle-invalid', {
            detail: {
                checked: this.checked,
                value: this.value,
                message: this.control.validationMessage,
                source: 'x-toggle'
            },
            bubbles: true,
            composed: true
        }));
    }
    emitChanged() {
        this.dispatchEvent(new CustomEvent('toggle-changed', {
            detail: { checked: this.checked, value: this.value, source: 'x-toggle' },
            bubbles: true,
            composed: true
        }));
    }
    isInteractionBlocked() {
        return this.hasAttribute('disabled') || this.hasAttribute('busy');
    }
    syncFormValue() {
        this.control.setAttribute('aria-checked', String(this.checked));
        if (this.hasAttribute('required') && !this.checked) {
            this.control.setCustomValidity('This toggle is required.');
            this.setAttribute('invalid', '');
            this.control.setAttribute('aria-invalid', 'true');
            this.internalsRef?.setValidity?.({ valueMissing: true }, 'This toggle is required.', this.control);
        }
        else {
            this.control.setCustomValidity('');
            if (!this.hasAttribute('invalid'))
                this.control.setAttribute('aria-invalid', 'false');
            else
                this.control.setAttribute('aria-invalid', 'true');
            if (this.checked || !this.hasAttribute('required'))
                this.removeAttribute('invalid');
            this.internalsRef?.setValidity?.({});
        }
        this.internalsRef?.setFormValue(this.checked ? this.value : null);
    }
    publishState(source) {
        const state = {
            schema: X_TOGGLE_STATE_SCHEMA,
            componentRef: 'x-toggle',
            id: this.id,
            checked: this.checked,
            value: this.value,
            source
        };
        xstate.set(this.stateKey, this.checked);
        xstate.set(`xtoggle-state-${this.id}`, state);
        this.stateText.textContent = this.checked ? 'On' : 'Off';
    }
}
if (!customElements.get('x-toggle')) {
    customElements.define('x-toggle', XToggle);
}
export { XToggle };
export default XToggle;
