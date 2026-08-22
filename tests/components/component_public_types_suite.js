const fs = require('fs');
const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readText,
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');

const PUBLIC_TYPES_SCHEMA = 'xtend.enterprise.er-wp-34.public-component-types.v1';

const publicTypeContracts = [
  {
    tag: 'x-alert',
    path: 'components/xalert.d.ts',
    typeNames: ['XAlertEventName', 'XAlertEventDetail', 'XAlertEventMap', 'XAlertPublicEventContract', 'XAlertElement'],
    events: ['alert-shown', 'alert-dismissed'],
    attributes: ['type', 'closable', 'duration', 'overlay', 'aria-label'],
    elementMap: true
  },
  {
    tag: 'x-toast',
    path: 'components/xtoast.d.ts',
    typeNames: ['XToastEventName', 'XToastEventDetail', 'XToastEventMap', 'XToastPublicEventContract', 'XToastElement'],
    events: ['toast-shown', 'toast-dismissed'],
    attributes: ['type', 'duration'],
    elementMap: true
  },
  {
    tag: 'x-modal',
    path: 'components/xmodal.d.ts',
    typeNames: ['XModalEventName', 'XModalLifecycleEventDetail', 'XModalActionEventDetail', 'XModalEventMap', 'XModalPublicEventContract', 'XModalElement'],
    events: ['modal-opened', 'modal-closed', 'modal-action'],
    attributes: ['open', 'overlay', 'title', 'content', 'actions'],
    methods: ['open(): void', 'close(options?'],
    elementMap: true
  },
  {
    tag: 'x-router',
    path: 'components/xrouter.d.ts',
    typeNames: ['XRouterEventName', 'XRouterRouteChangeDetail', 'XRouterRoutesRegisteredDetail', 'XRouterScrollBoundaryDetail', 'XRouterDocumentMetaDetail', 'XRouterEventMap', 'XRouterPublicEventContract', 'XRouterElement', 'XRouteElement'],
    events: ['route-changed', 'routechange', 'xrouter-routes-registered', 'xrouter-scroll-boundary-normalized', 'xrouter-navigation-overlays-closed', 'xrouter-title-updated'],
    attributes: ['mode', 'routesrc'],
    methods: ['registerRoutes(routes?', 'navigate(to:', 'normalizeRmtRouteRecord'],
    elementMap: true
  },
  {
    tag: 'x-link',
    path: 'components/xlink.d.ts',
    typeNames: ['XLinkEventName', 'XLinkNavigationEventDetail', 'XLinkRouterNavigateDetail', 'XLinkEventMap', 'XLinkPublicEventContract', 'XLinkElement'],
    events: ['before-navigate', 'after-navigate'],
    attributes: ['href', 'target', 'rel', 'state', 'active'],
    elementMap: true
  },
  {
    tag: 'x-input',
    path: 'components/xinput.d.ts',
    typeNames: ['XInputEventName', 'XInputEventDetail', 'XInputEventMap', 'XInputPublicEventContract', 'XInputElement'],
    events: ['input-changed', 'validation-failed'],
    attributes: ['type', 'name', 'value', 'placeholder', 'required', 'disabled'],
    methods: ['checkValidity(): boolean', 'reportValidity(): boolean', 'reset(): void', 'focus(): void'],
    elementMap: true
  },
  {
    tag: 'x-select',
    path: 'components/xselect.d.ts',
    typeNames: ['XSelectAttributeName', 'XSelectEventName', 'XSelectEventDetail', 'XSelectEventMap', 'XSelectPublicEventContract', 'XSelectElement'],
    events: ['select-changed', 'select-invalid'],
    attributes: ['name', 'value', 'disabled', 'required', 'multiple', 'placeholder', 'label'],
    methods: ['checkValidity(): boolean', 'reportValidity(): boolean', 'validate(): boolean', 'reset(): void', 'focus(): void'],
    elementMap: true
  },
  {
    tag: 'x-checkbox',
    path: 'components/xcheckbox.d.ts',
    typeNames: ['XCheckboxAttributeName', 'XCheckboxEventName', 'XCheckboxEventDetail', 'XCheckboxEventMap', 'XCheckboxPublicEventContract', 'XCheckboxElement'],
    events: ['checkbox-changed', 'checkbox-invalid'],
    attributes: ['name', 'value', 'checked', 'disabled', 'required', 'indeterminate', 'label'],
    methods: ['checkValidity(): boolean', 'reportValidity(): boolean', 'validate(): boolean', 'toggle(): void', 'reset(): void', 'focus(): void'],
    elementMap: true
  },
  {
    tag: 'x-toggle',
    path: 'components/xtoggle.d.ts',
    typeNames: ['XToggleAttributeName', 'XToggleEventName', 'XToggleChangedEventDetail', 'XToggleInvalidEventDetail', 'XToggleEventMap', 'XTogglePublicEventContract', 'XToggleElement'],
    events: ['toggle-changed', 'toggle-invalid'],
    attributes: ['name', 'value', 'checked', 'disabled', 'required', 'label', 'busy', 'invalid', 'density'],
    methods: ['checkValidity(): boolean', 'reportValidity(): boolean', 'validate(): boolean', 'toggle(): void', 'reset(): void', 'focus(): void'],
    elementMap: true
  },
  {
    tag: 'x-radio',
    path: 'components/xradio.d.ts',
    typeNames: ['XRadioAttributeName', 'XRadioEventName', 'XRadioEventDetail', 'XRadioEventMap', 'XRadioPublicEventContract', 'XRadioElement'],
    events: ['radio-changed', 'radio-invalid'],
    attributes: ['name', 'value', 'checked', 'disabled', 'required', 'label'],
    methods: ['checkValidity(): boolean', 'reportValidity(): boolean', 'validate(): boolean', 'check(): void', 'reset(): void', 'focus(): void'],
    elementMap: true
  },
  {
    tag: 'x-rmt-lifecycle-demo-build',
    path: 'components/x-rmt-lifecycle-demo-build.d.ts',
    typeNames: ['XRmtLifecycleDemoBuildEventName', 'XRmtLifecycleDemoBuildEventDetail', 'XRmtLifecycleDemoBuildEventDetailMap', 'XRmtLifecycleDemoBuildPublicEventContract', 'XRmtLifecycleDemoBuildElement'],
    events: ['rmt-lifecycle-demo-build-ready', 'rmt-lifecycle-demo-build-changed'],
    attributes: ['variant', 'aria-label'],
    methods: ['hydrate(): void', 'render(): void'],
    elementMap: true
  },
  {
    tag: 'x-textarea',
    path: 'components/xtextarea.d.ts',
    typeNames: ['XTextareaAttributeName', 'XTextareaEventName', 'XTextareaPayloadDetail', 'XTextareaChangedEventDetail', 'XTextareaInvalidEventDetail', 'XTextareaSubmitEventDetail', 'XTextareaCommandEventDetail', 'XTextareaEventDetail', 'XTextareaEventMap', 'XTextareaPublicEventContract', 'XTextareaSnapshot', 'XTextareaElement', 'export declare const XTextarea'],
    events: ['textarea-changed', 'textarea-invalid', 'textarea-submit', 'xtend-command'],
    attributes: ['name', 'value', 'placeholder', 'required', 'disabled', 'readonly', 'maxlength', 'minlength', 'rows', 'label', 'busy', 'invalid', 'density', 'fill', 'submit-on-enter', 'submit-command', 'syntax-highlight', 'highlight', 'line-numbering', 'lang', 'language'],
    methods: ['checkValidity(): boolean', 'reportValidity(): boolean', 'validate(): boolean', 'reset(): void', 'focus(): void', 'snapshot(): XTextareaSnapshot'],
    elementMap: true
  },
  {
    tag: 'x-status',
    path: 'components/xstatus.d.ts',
    typeNames: ['XStatusAttributeName', 'XStatusEventName', 'XStatusState', 'XStatusEventMap', 'XStatusPublicEventContract', 'XStatusElement'],
    events: ['status-changed', 'status-dismissed'],
    attributes: ['type', 'state', 'message', 'dismissible', 'busy', 'polite', 'label'],
    methods: ['setStatus(nextState?', 'dismiss(): void'],
    elementMap: true
  },
  {
    tag: 'x-progress',
    path: 'components/xprogress.d.ts',
    typeNames: ['XProgressAttributeName', 'XProgressEventName', 'XProgressEventDetail', 'XProgressEventMap', 'XProgressPublicEventContract', 'XProgressElement'],
    events: ['progress-changed', 'progress-complete'],
    attributes: ['value', 'max', 'label', 'status', 'indeterminate', 'busy'],
    methods: ['setProgress(value: number)', 'complete(): void', 'reset(): void'],
    elementMap: true
  },
  {
    tag: 'x-tooltip',
    path: 'components/xtooltip.d.ts',
    typeNames: ['XTooltipAttributeName', 'XTooltipEventName', 'XTooltipPlacement', 'XTooltipEventDetail', 'XTooltipEventMap', 'XTooltipPublicEventContract', 'XTooltipElement'],
    events: ['tooltip-opened', 'tooltip-closed'],
    attributes: ['for', 'placement', 'open', 'delay', 'label'],
    methods: ['show(options?', 'hide(options?', 'toggle(): void'],
    elementMap: true
  },
  {
    tag: 'x-popover',
    path: 'components/xpopover.d.ts',
    typeNames: ['XPopoverAttributeName', 'XPopoverEventName', 'XPopoverPlacement', 'XPopoverEventDetail', 'XPopoverEventMap', 'XPopoverPublicEventContract', 'XPopoverElement'],
    events: ['popover-opened', 'popover-closed'],
    attributes: ['open', 'placement', 'modal', 'anchor', 'label'],
    methods: ['show(options?', 'hide(options?', 'toggle(): void'],
    elementMap: true
  },
  {
    tag: 'x-drawer',
    path: 'components/xdrawer.d.ts',
    typeNames: ['XDrawerAttributeName', 'XDrawerEventName', 'XDrawerPlacement', 'XDrawerLifecycleEventDetail', 'XDrawerRouteSelectedEventDetail', 'XDrawerEventMap', 'XDrawerPublicEventContract', 'XDrawerElement'],
    events: ['drawer-opened', 'drawer-closed', 'drawer-route-selected'],
    attributes: ['open', 'placement', 'modal', 'label', 'route-aware'],
    methods: ['openDrawer(options?', 'closeDrawer(options?', 'toggle(): void'],
    elementMap: true
  },
  {
    tag: 'x-form',
    path: 'components/xform.d.ts',
    typeNames: ['XFormEventName', 'XFormSubmitEventDetail', 'XFormInvalidEventDetail', 'XFormResetEventDetail', 'XFormEventMap', 'XFormPublicEventContract', 'XFormElement'],
    events: ['submit', 'invalid', 'reset'],
    methods: ['getFormData(): XFormData'],
    elementMap: true
  },
  {
    tag: 'x-tabs',
    path: 'components/xtabs.d.ts',
    typeNames: ['XTabsEventName', 'XTabsSelectedEventDetail', 'XTabsEventMap', 'XTabsPublicEventContract', 'XTabsElement', 'XTabElement'],
    events: ['tab-selected'],
    attributes: ['selected', 'text-color'],
    methods: ['selectTab(index: number)'],
    elementMap: true
  },
  {
    tag: 'x-dialog',
    path: 'components/xdialog.d.ts',
    typeNames: ['XDialogEventName', 'XDialogLifecycleEventDetail', 'XDialogEventMap', 'XDialogPublicEventContract', 'XDialogElement'],
    events: ['dialog-opened', 'dialog-closed'],
    attributes: ['open', 'overlay', 'title', 'width', 'height'],
    methods: ['open(): void', 'close(options?'],
    elementMap: true
  },
  {
    tag: 'x-lightbox',
    path: 'components/xlightbox.d.ts',
    typeNames: ['XLightboxEventName', 'XLightboxOpenedEventDetail', 'XLightboxClosedEventDetail', 'XLightboxEventMap', 'XLightboxPublicEventContract', 'XLightboxElement'],
    events: ['lightbox-opened', 'lightbox-closed'],
    attributes: ['src', 'open', 'alt'],
    methods: ['open(src?', 'close(options?'],
    elementMap: true
  },
  {
    tag: 'x-calendar',
    path: 'components/xcalendar.d.ts',
    typeNames: ['XCalendarEventName', 'XCalendarState', 'XCalendarDateSelectEventDetail', 'XCalendarEventMap', 'XCalendarPublicEventContract', 'XCalendarElement'],
    events: ['date-select'],
    methods: ['value: string'],
    elementMap: true
  },
  {
    tag: 'x-writer',
    path: 'components/xwriter.d.ts',
    typeNames: ['XWriterEventName', 'XWriterChangeEventDetail', 'XWriterSaveEventDetail', 'XWriterErrorEventDetail', 'XWriterEventMap', 'XWriterPublicEventContract', 'XWriterElement'],
    events: ['writer:change', 'writer:save', 'writer:error', 'writer:autosave', 'writer:export'],
    attributes: ['storage-key', 'api', 'method', 'autosave'],
    methods: ['getHTML(): string', 'getMarkdown(): string', 'save(isAutosave?'],
    elementMap: true
  },
  {
    tag: 'x-theme',
    path: 'components/xtheme.d.ts',
    typeNames: ['XThemeEventName', 'XThemeChangedEventDetail', 'XThemeVariableChangedEventDetail', 'XThemeEventMap', 'XThemePublicEventContract', 'XThemeManager'],
    events: ['theme-initialized', 'theme-changed', 'theme-variable-changed'],
    methods: ['setTheme(themeName: string)', 'registerTheme(name: string', 'getDesignTokens(themeName?'],
    windowApi: ['XTend?', 'XTheme?']
  },
  {
    tag: 'x-button',
    path: 'components/xbutton.d.ts',
    typeNames: ['XButtonEventName', 'XButtonStateEventDetail', 'XButtonInteractionEventDetail', 'XButtonPerformanceSnapshot', 'XButtonEventMap', 'XButtonPublicEventContract', 'XButtonElement'],
    events: ['loading-start', 'loading-end', 'click', 'focus', 'blur', 'button-interaction', 'button-performance-measured'],
    attributes: ['disabled', 'label', 'variant', 'size', 'icon', 'loading', 'overlay', 'aria-label', 'aria-busy'],
    methods: ['getPerformanceBudget(): Record<string, number>', 'getInteractionBudget(): XButtonInteractionBudget', 'snapshotPerformance(): XButtonPerformanceSnapshot', 'setLoading(loading: boolean'],
    elementMap: true
  },
  {
    tag: 'x-icon',
    path: 'components/xicon.d.ts',
    typeNames: ['XIconAttributeName', 'XIconEventName', 'XIconSourceRecord', 'XIconPack', 'XIconResolvedSource', 'XIconSnapshot', 'XIconEventMap', 'XIconPublicEventContract', 'XIconElement'],
    events: ['icon-ready', 'icon-missing', 'icon-pack-registered'],
    attributes: ['name', 'pack', 'src', 'label', 'size', 'stroke-width', 'color', 'decorative'],
    methods: ['registerPack(pack: XIconPack', 'setIcon(name: string', 'snapshot(): XIconSnapshot', 'registerIconPack(pack: XIconPack', 'resolveIcon(name: string'],
    elementMap: true
  },
  {
    tag: 'x-spinner',
    path: 'components/xspinner.d.ts',
    typeNames: ['XSpinnerEventName', 'XSpinnerEventDetail', 'XSpinnerEventMap', 'XSpinnerPublicEventContract', 'XSpinnerElement'],
    events: ['spinner-started', 'spinner-stopped', 'paused', 'resumed'],
    attributes: ['paused', 'size', 'color', 'speed', 'type', 'overlay', 'aria-label', 'aria-busy', 'aria-valuetext'],
    elementMap: true
  },
  {
    tag: 'x-menu',
    path: 'components/xmenu.d.ts',
    typeNames: ['XMenuEventName', 'XMenuItemClickedEventDetail', 'XMenuNavigateEventDetail', 'XMenuKeyboardNavigationEventDetail', 'XMenuPerformanceSnapshot', 'XMenuEventMap', 'XMenuPublicEventContract', 'XMenuElement'],
    events: ['menu-item-clicked', 'menu-navigate', 'menu-keyboard-navigation', 'menu-performance-measured'],
    methods: ['getPerformanceBudget(): Record<string, number>', 'getInteractionBudget(): XMenuInteractionBudget', 'snapshotPerformance(): XMenuPerformanceSnapshot'],
    elementMap: true
  },
  {
    tag: 'xtend-state',
    path: 'components/xtend-state.d.ts',
    typeNames: ['XTendStateRuntime', 'XTendStateBoundaryContract', 'XTendStateRmtStateAdapter', 'XTendStateDiagnosticsSnapshot', 'XTendStateLifecycleEventDetail', 'XTendStatePublicEventContract'],
    events: ['xtend-state:lifecycle'],
    methods: ['snapshot(): XTendStateSnapshot', 'snapshotDiagnostics(): XTendStateDiagnosticsSnapshot', 'createRmtStateAdapter(options?']
  },
  {
    tag: 'xtend-i18n',
    path: 'components/xtend-i18n.d.ts',
    typeNames: ['XtendI18nApi', 'XtendI18nLabelBundle', 'XtendI18nComponentLabelContract', 'XtendI18nStateAdapterContract', 'XtendI18nRouterAdapterContract', 'XtendI18nPublicEventContract'],
    events: ['xtend-i18n-locale-changed', 'xtend-i18n-labels-loaded', 'xtend-i18n-error'],
    methods: ['configure(options?', 'registerLabels(locale:', 'loadLocale(locale:', 'setLocale(locale:', 'connectState(stateRuntime?', 'connectRouter(router?', 'snapshot(): XtendI18nSnapshot', 'snapshotDiagnostics(): XtendI18nDiagnosticsSnapshot'],
    windowApi: ['xtendI18n: XtendI18nApi']
  },
  {
    tag: 'x-utils',
    path: 'components/xutils.d.ts',
    typeNames: ['XUtilsApi', 'XUtilsUtilityContract', 'XUtilsImportPolicy', 'XUtilsImportPolicyResult', 'XUtilsBoundarySnapshot', 'XUtilsUiEffectsState', 'XUtilsTemplateApi', 'XUtilsPublicEventContract'],
    events: ['xutils:import-policy-check', 'xutils:ui-effects-change'],
    methods: ['assertLocalImport(specifier: string): XUtilsImportPolicyResult', 'snapshotUtilityContract(): XUtilsBoundarySnapshot', 'resolveUiEffects(input?', 'prepareUiEffects(input?', 'releaseUiEffects(input?'],
    windowApi: ['XUtils: XUtilsApi']
  },
  {
    tag: 'x-summary',
    path: 'components/xsummary.d.ts',
    typeNames: ['XSummaryEventName', 'XSummaryToggleEventDetail', 'XSummaryEventMap', 'XSummaryPublicEventContract', 'XSummaryElement'],
    events: ['open', 'close'],
    attributes: ['open', 'type'],
    methods: ['open(): void', 'close(): void', 'toggle(): void'],
    elementMap: true
  },
  {
    tag: 'x-player',
    path: 'components/xplayer.d.ts',
    typeNames: ['XPlayerEventName', 'XPlayerPlaybackEventDetail', 'XPlayerFullscreenEventDetail', 'XPlayerMuteEventDetail', 'XPlayerEventMap', 'XPlayerPublicEventContract', 'XPlayerElement'],
    events: ['xplayer-play', 'xplayer-pause', 'xplayer-fullscreen', 'xplayer-pip', 'xplayer-caption', 'xplayer-mute'],
    attributes: ['src', 'poster', 'type', 'media-chooser', 'downloadable', 'autoplay', 'title', 'height', 'width'],
    elementMap: true
  },
  {
    tag: 'x-section',
    path: 'components/xsection.d.ts',
    typeNames: ['XSectionEventName', 'XSectionSnapshot', 'XSectionEventMap', 'XSectionPublicEventContract', 'XSectionElement', 'XSectionLayoutDisplayMediaUxProfile'],
    events: ['section-rendered'],
    attributes: ['padding', 'background', 'bordered', 'layout', 'label'],
    methods: ['snapshot(): XSectionSnapshot'],
    elementMap: true
  },
  {
    tag: 'x-cards',
    path: 'components/xcards.d.ts',
    typeNames: ['XCardsEventName', 'XCardsSnapshot', 'XCardsEventMap', 'XCardsPublicEventContract', 'XCardsElement', 'XCardsLayoutDisplayMediaUxProfile'],
    events: ['cards-layout'],
    attributes: ['columns', 'gap'],
    methods: ['snapshot(): XCardsSnapshot'],
    elementMap: true
  },
  {
    tag: 'x-header',
    path: 'components/xheader.d.ts',
    typeNames: ['XHeaderEventName', 'XHeaderSnapshot', 'XHeaderEventMap', 'XHeaderPublicEventContract', 'XHeaderElement', 'XHeaderLayoutDisplayMediaUxProfile', 'XHeaderSlotAlignment', 'XHeaderMenuMode', 'XHeaderMenuPlacement', 'XHeaderMenuAlign', 'XHeaderBrandCollapsePolicy', 'XHeaderBrandPresentation', 'XHeaderTitleSource', 'XHeaderToggleMenuOptions'],
    events: ['header-ready', 'menu-before-open', 'menu-before-close', 'menu-opened', 'menu-closed', 'menu-mode-changed', 'menu-placement-changed', 'logo-loaded'],
    attributes: ['src', 'logo-size', 'title', 'sticky', 'shadow', 'menu-mode', 'menu-placement', 'menu-modal', 'menu-open', 'menu-breakpoint', 'menu-width', 'menu-max-height', 'menu-align'],
    methods: ['toggleMenu(open: boolean)', 'isMenuOpen(): boolean', 'snapshot(): XHeaderSnapshot'],
    elementMap: true
  },
  {
    tag: 'x-footer',
    path: 'components/xfooter.d.ts',
    typeNames: ['XFooterEventName', 'XFooterSnapshot', 'XFooterEventMap', 'XFooterPublicEventContract', 'XFooterElement', 'XFooterLayoutDisplayMediaUxProfile'],
    events: ['footer-ready', 'theme-applied', 'logo-loaded'],
    attributes: ['src', 'logo-size', 'sticky'],
    methods: ['snapshot(): XFooterSnapshot'],
    elementMap: true
  },
  {
    tag: 'x-hero',
    path: 'components/xhero.d.ts',
    typeNames: ['XHeroEventName', 'XHeroSnapshot', 'XHeroEventMap', 'XHeroPublicEventContract', 'XHeroElement', 'XHeroLayoutDisplayMediaUxProfile'],
    events: ['hero-rendered', 'hero-animated'],
    attributes: ['background', 'background-image', 'align', 'vertical-align', 'fullheight', 'overlay', 'animate', 'scroll-button', 'font-color', 'text-box'],
    methods: ['scrollPast(): void', 'snapshot(): XHeroSnapshot'],
    elementMap: true
  },
  {
    tag: 'x-type',
    path: 'components/xtype.d.ts',
    typeNames: ['XTypeEventName', 'XTypeTextEventDetail', 'XTypeSnapshot', 'XTypeEventMap', 'XTypePublicEventContract', 'XTypeElement', 'XTypeLayoutDisplayMediaUxProfile'],
    events: ['typing-started', 'typing-completed', 'text-erased'],
    attributes: ['texts', 'speed', 'pause', 'cursor', 'blinking-cursor', 'loop'],
    methods: ['pause(): void', 'resume(): void', 'snapshot(): XTypeSnapshot'],
    elementMap: true
  },
  {
    tag: 'x-code',
    path: 'components/xcode.d.ts',
    typeNames: ['XCodeEventName', 'XCodeSnapshot', 'XCodeEventMap', 'XCodePublicEventContract', 'XCodeElement', 'XCodeLayoutDisplayMediaUxProfile'],
    events: ['code-copied'],
    attributes: ['lang'],
    methods: ['hydrate(): XCodeSnapshot', 'snapshot(): XCodeSnapshot'],
    elementMap: true
  },
  {
    tag: 'x-masonry',
    path: 'components/xmasonry.d.ts',
    typeNames: ['XMasonryEventName', 'XMasonrySnapshot', 'XMasonryEventMap', 'XMasonryPublicEventContract', 'XMasonryElement', 'XMasonryLayoutDisplayMediaUxProfile'],
    events: ['masonry-layout'],
    attributes: ['columns', 'gap', 'save-positions'],
    methods: ['snapshot(): XMasonrySnapshot'],
    elementMap: true
  }
];

function assertContainsAll(context, content, values, label) {
  (values || []).forEach((value) => {
    context.assertIncludes(content, value, `${label} includes ${value}`);
  });
}

function runComponentPublicTypesSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const context = createSuiteContext({
    id: 'component-public-types',
    label: 'Component public type and event contracts'
  });
  const sharedPath = 'components/xtend-public-types.d.ts';
  const sharedAbsolutePath = resolveRepoPath(sharedPath, rootDir);
  const sharedTypes = readText(sharedPath, rootDir);

  context.assert(fs.existsSync(sharedAbsolutePath), 'Shared XTend public type helpers exist');
  context.assertIncludes(sharedTypes, PUBLIC_TYPES_SCHEMA, 'Shared type helpers declare ER-WP-34 schema');
  context.assertIncludes(sharedTypes, 'XtendPublicEventContract', 'Shared type helpers expose public event contract type');
  context.assertIncludes(sharedTypes, 'XtendCustomEventMap', 'Shared type helpers expose custom event map type');
  context.assertIncludes(sharedTypes, 'XtendLayoutDisplayMediaUxProfile', 'Shared type helpers expose Layout Display Media UX profile type');

  publicTypeContracts.forEach((contract) => {
    const absolutePath = resolveRepoPath(contract.path, rootDir);
    const typeFile = fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, 'utf8') : '';
    const label = `${contract.tag} public types`;

    context.assert(fs.existsSync(absolutePath), `${label} file exists`);
    context.assertIncludes(typeFile, 'xtend-public-types', `${label} imports shared type helpers`);
    context.assertIncludes(typeFile, 'PublicEventContract', `${label} declares public event contract`);
    context.assertIncludes(typeFile, 'EventDetailMap', `${label} declares detail map`);
    context.assertIncludes(typeFile, 'addEventListener<K extends keyof', `${label} exposes typed event listener overload`);
    assertContainsAll(context, typeFile, contract.typeNames, label);
    assertContainsAll(context, typeFile, contract.events, label);
    assertContainsAll(context, typeFile, contract.attributes, label);
    assertContainsAll(context, typeFile, contract.methods, label);
    assertContainsAll(context, typeFile, contract.windowApi, label);
    if (contract.elementMap) {
      context.assertIncludes(typeFile, 'HTMLElementTagNameMap', `${label} augments HTMLElementTagNameMap`);
      context.assertIncludes(typeFile, `'${contract.tag}'`, `${label} maps its custom element tag`);
    }
  });

  return context.result({
    tag: 'public-types',
    schema: PUBLIC_TYPES_SCHEMA,
    publicTypeContracts: publicTypeContracts.map((contract) => contract.tag)
  });
}

function printComponentPublicTypesReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Component Public Types erfolgreich.',
    failureTitle: 'XTend Component Public Types fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runComponentPublicTypesSuite();
  printComponentPublicTypesReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  PUBLIC_TYPES_SCHEMA,
  printComponentPublicTypesReport,
  publicTypeContracts,
  runComponentPublicTypesSuite
};
