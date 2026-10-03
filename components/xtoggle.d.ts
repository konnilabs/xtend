import type { XtendCustomEventMap, XtendFormControlUxProfile, XtendPublicEventContract } from './xtend-public-types';
export type XToggleAttributeName = 'name' | 'value' | 'checked' | 'disabled' | 'required' | 'label' | 'busy' | 'invalid' | 'density';
export type XToggleEventName = 'toggle-changed' | 'toggle-invalid';
export interface XToggleChangedEventDetail {
    checked: boolean;
    value: string;
    source: 'x-toggle';
}
export interface XToggleInvalidEventDetail {
    checked: boolean;
    value: string;
    message: string;
    source: 'x-toggle';
}
export interface XToggleEventDetailMap {
    'toggle-changed': XToggleChangedEventDetail;
    'toggle-invalid': XToggleInvalidEventDetail;
}
export type XToggleEventDetail = XToggleChangedEventDetail | XToggleInvalidEventDetail;
export type XToggleEventMap = XtendCustomEventMap<XToggleEventDetailMap>;
export type XToggleFormControlUxProfile = XtendFormControlUxProfile<'x-toggle'>;
export type XTogglePublicEventContract = XtendPublicEventContract<XToggleEventName, XToggleEventDetail>;
export interface XToggleElement extends HTMLElement {
    checked: boolean;
    value: string;
    readonly stateKey: string;
    checkValidity(): boolean;
    reportValidity(): boolean;
    validate(): boolean;
    toggle(): void;
    reset(): void;
    focus(): void;
    addEventListener<K extends keyof XToggleEventMap>(type: K, listener: (event: XToggleEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}
declare class XToggle extends HTMLElement {
    static formAssociated: boolean;
    static get observedAttributes(): XToggleAttributeName[];
    static get xtendComponentContract(): {
        readonly schema: "xtend.component.contract.v2";
        readonly tag: "x-toggle";
        readonly maturity: "stable";
        readonly source: {
            readonly strategy: "xtend.typescript.component-source-strategy.v1";
            readonly state: "ts-generated-esm";
            readonly sourcePath: "src/components/x-toggle/x-toggle.ts";
        };
        readonly runtime: {
            readonly format: "esm";
            readonly artifact: "components/xtoggle.js";
            readonly declaration: "components/xtoggle.d.ts";
            readonly localOnly: true;
            readonly cdnAllowed: false;
        };
        readonly rmt: {
            readonly adapter: "xtend.component";
            readonly kernelBoundary: "no-rmt-kernel-import-of-xtend-types";
        };
        readonly fabric: {
            readonly api: "@xtend-fabric";
            readonly defaultLane: "user-blocking";
            readonly a11yLane: "a11y";
            readonly diagnosticsLane: "diagnostics";
        };
    };
    static get xtendRmtMetadata(): {
        readonly schema: "xtend.rmt.component-contract.v1";
        readonly adapter: "xtend.component";
        readonly tag: "x-toggle";
        readonly componentRecordKind: "custom_element";
        readonly templateMode: "dom_descriptor";
        readonly eventBindingMode: "dom-event-to-rmt-command";
        readonly schedules: readonly ["component.visible.mount", "component.idle.hydrate", "ui.user-blocking.input", "a11y.announce", "diagnostics.snapshot"];
        readonly hydration: {
            readonly policy: "visible";
            readonly lane: "user-blocking";
        };
        readonly shellAuthoring: {
            readonly schema: "xtend.rmt.shell-authoring.component.v1";
            readonly host: "x-toggle";
            readonly attributes: readonly ["name", "value", "checked", "disabled", "required", "label", "busy", "invalid", "density"];
            readonly events: readonly ["toggle-changed", "toggle-invalid"];
        };
        readonly kernelBoundary: "no-rmt-kernel-import-of-xtend-types";
    };
    static get xtendComponentLifecycleTelemetry(): {
        readonly schema: "xtend.component.lifecycle-telemetry.v1";
        readonly componentRef: "x-toggle";
        readonly operations: readonly ["mount", "hydrate", "render", "update", "event", "keyboard", "error", "unmount"];
        readonly snapshotPath: "snapshot.componentTelemetry";
        readonly fabric: {
            readonly lane: "user-blocking";
            readonly a11yLane: "a11y";
            readonly diagnosticsLane: "diagnostics";
        };
    };
    static get xtendScaffoldA11yProfile(): {
        readonly schema: "xtend.a11y.profile.v1";
        readonly componentRef: "x-toggle";
        readonly role: "switch";
        readonly accessibleName: "required";
        readonly focusStrategy: "native-control-focus";
        readonly keyboard: readonly ["Tab", "Space"];
        readonly ariaStates: readonly ["aria-checked", "aria-invalid", "aria-describedby", "aria-required", "aria-disabled", "aria-busy"];
        readonly screenreader: {
            readonly signalContract: {
                readonly schema: "xtend.a11y.screenreader-signals.v1";
                readonly componentRef: "x-toggle";
                readonly liveRegion: "polite";
                readonly signals: readonly ["checked-state", "validation-error-summary"];
                readonly statusRegions: readonly ["role=status", "aria-live=polite"];
                readonly errorRegions: readonly ["role=alert", "aria-live=assertive"];
                readonly fabric: {
                    readonly lane: "a11y";
                    readonly fiberKind: "a11y.announce";
                    readonly scheduleRef: "a11y.user-blocking.announce";
                };
            };
        };
        readonly motionContrast: {
            readonly policy: {
                readonly schema: "xtend.a11y.motion-contrast-policy.v1";
                readonly componentRef: "x-toggle";
                readonly motion: {
                    readonly schema: "xtend.a11y.motion-policy.v1";
                    readonly mediaQuery: "(prefers-reduced-motion: reduce)";
                    readonly reducedMotion: "required";
                    readonly animationPolicy: "state-change-without-motion-only-feedback";
                    readonly noMotionOnlyState: true;
                };
                readonly contrast: {
                    readonly schema: "xtend.a11y.contrast-policy.v1";
                    readonly mediaQuery: "(forced-colors: active)";
                    readonly highContrast: "required";
                    readonly forcedColorAdjust: "auto";
                    readonly focusVisible: "required";
                    readonly nonColorStatus: "required";
                };
                readonly fabric: {
                    readonly lane: "a11y";
                    readonly fiberKind: "a11y.preference";
                    readonly scheduleRef: "a11y.user-blocking.preference";
                };
            };
        };
    };
    static get xtendScaffoldPerformanceProfile(): {
        readonly schema: "xtend.performance.component-profile.v1";
        readonly componentRef: "x-toggle";
        readonly budgetClass: "interactive-small";
        readonly lane: "user-blocking";
        readonly hydrationPolicy: "visible";
        readonly criticalMeasurements: readonly ["mount", "event", "keyboard", "state-sync"];
        readonly interaction: {
            readonly clickBudgetMs: 8;
            readonly keyboardBudgetMs: 8;
            readonly touchTargetMinPx: 44;
            readonly disabledBusyGuards: true;
        };
        readonly cleanup: readonly ["toggle-event-listeners", "xtendState-subscription"];
    };
    static get xtendFormControlUxProfile(): XToggleFormControlUxProfile;
    static get xtendScreenreaderSignals(): {
        readonly schema: "xtend.a11y.screenreader-signals.v1";
        readonly componentRef: "x-toggle";
        readonly liveRegion: "polite";
        readonly signals: readonly ["checked-state", "validation-error-summary"];
        readonly statusRegions: readonly ["role=status", "aria-live=polite"];
        readonly errorRegions: readonly ["role=alert", "aria-live=assertive"];
        readonly fabric: {
            readonly lane: "a11y";
            readonly fiberKind: "a11y.announce";
            readonly scheduleRef: "a11y.user-blocking.announce";
        };
    };
    static get xtendMotionContrastPolicy(): {
        readonly schema: "xtend.a11y.motion-contrast-policy.v1";
        readonly componentRef: "x-toggle";
        readonly motion: {
            readonly schema: "xtend.a11y.motion-policy.v1";
            readonly mediaQuery: "(prefers-reduced-motion: reduce)";
            readonly reducedMotion: "required";
            readonly animationPolicy: "state-change-without-motion-only-feedback";
            readonly noMotionOnlyState: true;
        };
        readonly contrast: {
            readonly schema: "xtend.a11y.contrast-policy.v1";
            readonly mediaQuery: "(forced-colors: active)";
            readonly highContrast: "required";
            readonly forcedColorAdjust: "auto";
            readonly focusVisible: "required";
            readonly nonColorStatus: "required";
        };
        readonly fabric: {
            readonly lane: "a11y";
            readonly fiberKind: "a11y.preference";
            readonly scheduleRef: "a11y.user-blocking.preference";
        };
    };
    private readonly control;
    private readonly labelText;
    private readonly stateText;
    private readonly internalsRef?;
    private unsubscribeState?;
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;
    get checked(): boolean;
    set checked(value: boolean);
    get value(): string;
    set value(value: string);
    get stateKey(): string;
    toggle(): void;
    reset(): void;
    validate(): boolean;
    formResetCallback(): void;
    formDisabledCallback(disabled: boolean): void;
    checkValidity(): boolean;
    reportValidity(): boolean;
    focus(): void;
    private upgradeAttributes;
    private syncControl;
    private setChecked;
    private handleChange;
    private handleKeydown;
    private handleInvalid;
    private emitChanged;
    private isInteractionBlocked;
    private syncFormValue;
    private publishState;
}
export { XToggle };
export default XToggle;
declare global {
    interface HTMLElementTagNameMap {
        'x-toggle': XToggleElement;
    }
}
