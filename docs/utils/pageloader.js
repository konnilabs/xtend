export {};

const docsPageLoaderScript = Array.from(document.scripts).find((script) => /\/docs\/utils\/pageloader\.js(?:\?|$)/u.test(script.src || ''));
const docsAssetVersion = docsPageLoaderScript ? new URL(docsPageLoaderScript.src, window.location.href).searchParams.get('v') || '' : '';
const docsVersionedModuleUrl = (path) => `${path}${docsAssetVersion ? `?v=${encodeURIComponent(docsAssetVersion)}` : ''}`;
const [
  { createRmtDomDescriptorRenderer },
  { createMaracaPlanRuntime },
  { createRmtBrowserScheduler }
] = await Promise.all([
  import(docsVersionedModuleUrl('/xtendrmt/rmt-dom-descriptor-renderer.js')),
  import(docsVersionedModuleUrl('/xtend-maraca/plan-runtime.mjs')),
  import(docsVersionedModuleUrl('/xtendrmt/rmt-browser-scheduler.js'))
]);

const DOCS_RMT_RENDER_SCHEMA = 'xtend.docs.parsedown-rmt-render.v1';
const docsBrowserScheduler = createRmtBrowserScheduler({ windowTarget: window });
const docsProductDisposers = new Set();

async function requireDocsLifecycleBinding() {
  if (window.XUtils && typeof window.XUtils.on === 'function') return window.XUtils;
  if (window.__XTendLoaderBootPromise) {
    await Promise.resolve(window.__XTendLoaderBootPromise).catch(() => null);
  }
  if (window.XUtils && typeof window.XUtils.on === 'function') return window.XUtils;
  throw new Error('XTend XUtils lifecycle binding is required after loader boot.');
}

await requireDocsLifecycleBinding();

function bindDocsLifecycle(target, eventName, listener, options) {
  if (!window.XUtils || typeof window.XUtils.on !== 'function') throw new Error('XTend XUtils lifecycle binding is required.');
  const dispose = window.XUtils.on(target, eventName, listener, options);
  docsProductDisposers.add(dispose);
  return () => { docsProductDisposers.delete(dispose); dispose(); };
}
const DOCS_RMT_PRODUCTION_HARDENING_SCHEMA = 'xtend.epic13.docs-rmt-production-hardening.v1';
const DOCS_RMT_TRUST_BOUNDARY = 'xtend.security.sanitizing-boundary.v1';
const DOCS_RMT_TRUSTED_DOM_PROOF_SCHEMA = 'xtend.epic13.trusted-dom-boundary.v1';
const DOCS_RMT_TRUSTED_DOM_SANITIZER = 'xtend.security.trusted-dom-sanitizer.v1';
const DOCS_RMT_PARSEDOWN_ENDPOINT = 'xtendrmt.docs.parsedown.parse';
const DOCS_RMT_DEFAULT_SHELL_TEMPLATE = 'docs.app.shell';
const DOCS_RMT_DEFAULT_SEARCH_TEMPLATE = 'docs.header.search';
const DOCS_RMT_DEFAULT_DIAGNOSTICS_SCHEDULE = 'docs.diagnostics.snapshot';
const DOCS_ANIMATION_ENGINE_DEMO_SCHEMA = 'xtend.docs.animation-engine-demo.v1';
const DOCS_ANIMATION_ENGINE_DEMO_SLUG = 'rmt-animation-engine';
const DOCS_ANIMATION_ENGINE_DEMO_MODULE = '/docs/utils/animation-engine-demo.mjs';
const DOCS_ANIMATION_ENGINE_DEMO_ARTIFACT = '/docs/generated/rmt-animation-engine-demo.plan.json';
const DOCS_ANIMATION_ENGINE_DEMO_SCHEDULE = 'docs.animation-engine-demo.hydrate';
const DOCS_RMT_PLAYGROUND_SCHEMA = 'xtend.docs.rmt-playground.v1';
const DOCS_RMT_PLAYGROUND_DEBOUNCE_MS = 300;
const DOCS_RMT_PLAYGROUND_DIAGNOSTIC_DEBOUNCE_MS = 160;
const DOCS_RMT_PLAYGROUND_MAX_SOURCE_BYTES = 64 * 1024;
const DOCS_RMT_PLAYGROUND_RENDERER_MODULE = '/xtendrmt/rmt-dom-descriptor-renderer.js';
const DOCS_RMT_PLAYGROUND_MARACA_SCHEMA = 'xtend.docs.rmt-playground.maraca-preview.v1';
const DOCS_RMT_PLAYGROUND_MARACA_MODE = 'maraca-preview';
const DOCS_RMT_PLAYGROUND_MARACA_RUNTIME_MODULES = Object.freeze([
  '/components/xstate.js',
  '/components/xutils.js',
  '/xtendrmt/rmt-runtime.esm.js',
  '/xtendrmt/rmt-kernel-orchestration-controller.js',
  '/xtendrmt/rmt-state-selector-runtime.js',
  '/xtendrmt/rmt-action-effect-runtime.js',
  '/xtendrmt/rmt-event-routing-runtime.js',
  '/xtendrmt/rmt-form-validation-runtime.js',
  '/xtendrmt/rmt-animation-engine-runtime.js',
  '/xtendrmt/rmt-surface-transition-runtime.js',
  '/xtendrmt/rmt-surface-resource-graph-runtime.js',
  '/xtendrmt/rmt-dom-descriptor-renderer.js'
]);
const DOCS_RMT_PLAYGROUND_HYDRATION_TAGS = Object.freeze([
  'x-alert',
  'x-button',
  'x-calendar',
  'x-cards',
  'x-checkbox',
  'x-code',
  'x-dialog',
  'x-drawer',
  'x-footer',
  'x-form',
  'x-header',
  'x-hero',
  'x-icon',
  'x-input',
  'x-lightbox',
  'x-link',
  'x-masonry',
  'x-menu',
  'x-modal',
  'x-player',
  'x-popover',
  'x-progress',
  'x-radio',
  'x-router',
  'x-section',
  'x-select',
  'x-side-panel',
  'x-spinner',
  'x-status',
  'x-summary',
  'x-surface-manager',
  'x-surface-portal',
  'x-surface-region',
  'x-surface-window',
  'x-tabs',
  'x-textarea',
  'x-theme',
  'x-toggle',
  'x-toast',
  'x-tooltip',
  'x-type',
  'x-writer'
]);
const DOCS_RMT_PLAYGROUND_LAYOUT_TAGS = Object.freeze([
  'x-button',
  'x-icon',
  'x-select',
  'x-side-panel',
  'x-surface-manager',
  'x-surface-window',
  'x-textarea'
]);
const DOCS_RMT_PLAYGROUND_ISLANDS = Object.freeze({
  editor: Object.freeze({
    id: 'docs.rmt.playground.editor',
    surfaceId: 'docs.rmt.playground.editor',
    role: 'source',
    lane: 'user-blocking',
    schedule: 'docs.rmt-playground.editor.input'
  }),
  preview: Object.freeze({
    id: 'docs.rmt.playground.preview',
    surfaceId: 'docs.rmt.playground.preview',
    role: 'preview',
    lane: 'visible',
    schedule: 'docs.rmt-playground.preview.hydrate'
  }),
  output: Object.freeze({
    id: 'docs.rmt.playground.output',
    surfaceId: 'docs.rmt.playground.output',
    role: 'core-json',
    lane: 'idle',
    schedule: 'docs.rmt-playground.output.hydrate'
  }),
  diagnostics: Object.freeze({
    id: 'docs.rmt.playground.diagnostics',
    surfaceId: 'docs.rmt.playground.diagnostics',
    role: 'diagnostics',
    lane: 'diagnostics',
    schedule: 'docs.rmt-playground.diagnostics.hydrate'
  })
});
const docsRmtDescriptorRenderer = createRmtDomDescriptorRenderer({ documentTarget: document });
let docsAnimationEngineDemoModulePromise = null;
let docsAnimationEngineDemoArtifactPromise = null;
const DOCS_RMT_PLAYGROUND_DEFAULT_SOURCE = `template learn.rmt.playground {
  state preview.message type object preserve {
    initial {
      id "hello"
      text "Hello from the playground"
      tone "success"
    }
  }

  selector preview.message from state preview.message {
    output PreviewMessage
  }

  surface preview.card kind card component x-status {
    source selector preview.message
    key message.id

    lane visible weight 80 {
      hydrate preview-card from selector preview.message
    }
  }
}`;
const DOCS_RMT_PLAYGROUND_KERNEL_FORM_SOURCE = `template learn.rmt.kernel.form {
  state demo.name type object preserve {
    initial {
      id "demo-name"
      label "Name"
      placeholder "Avery Stone"
      value ""
      required true
      hidden false
    }
  }

  state demo.next type object preserve {
    initial {
      id "demo-next"
      text "Continue"
      tone "primary"
      disabled true
      hidden false
    }
  }

  selector demo.name from state demo.name {
    output DemoName
  }

  selector demo.next from state demo.next {
    output DemoCommand
  }

  validation demo.ready {
    mode blocking
    target action demo.continue
    field demo.name required message "Enter a name."
  }

  action demo.updateName {
    input value string
    reduce state.demo.name.value = input.value
  }

  action demo.continue {
    input label string
    reduce state.demo.next.text = "Ready"
    reduce state.demo.next.tone = "success"
  }

  surface demo.name kind field component x-input {
    source selector demo.name
    key name.id
    bounds x 16 y 16 width 320 height 88

    lane visible weight 80 {
      hydrate demo-name from selector demo.name
    }

    on input-changed "#demo-name" -> action demo.updateName {
      payload value from detail.value
    }
  }

  surface demo.next kind action component x-button {
    source selector demo.next
    key next.id
    bounds x 16 y 120 width 180 height 56

    lane visible weight 80 {
      mount demo-next from selector demo.next
    }

    on click "[data-action='demo-next']" -> action demo.continue {
      preventDefault true
      payload label from target.dataset.label
    }
  }
}`;
const DOCS_RMT_PLAYGROUND_TRANSITIONS_SOURCE = `template learn.rmt.transitions {
  state demo.first type object preserve {
    initial {
      id "first-card"
      text "First surface"
      tone "info"
      hidden false
    }
  }

  state demo.second type object preserve {
    initial {
      id "second-card"
      text "Second surface"
      tone "success"
      hidden true
    }
  }

  state demo.swap type object preserve {
    initial {
      id "swap-surfaces"
      text "Swap"
      tone "primary"
      hidden false
    }
  }

  selector demo.first from state demo.first {
    output DemoStatus
  }

  selector demo.second from state demo.second {
    output DemoStatus
  }

  selector demo.swap from state demo.swap {
    output DemoCommand
  }

  action demo.swap {
    input label string
    reduce state.demo.first.hidden = true
    reduce state.demo.second.hidden = false
    emit demo.swapped with label input.label
  }

  transition demo.firstToSecond {
    trigger action demo.swap
    from surfaces [demo.first]
    to surfaces [demo.second]
    effect crossfade
    durationMs 220
    easing "ease-out"
    lane transition
  }

  surface demo.first kind card component x-status {
    source selector demo.first
    key first.id
    bounds x 16 y 16 width 320 height 96

    lane visible weight 80 {
      hydrate first-card from selector demo.first
    }
  }

  surface demo.second kind card component x-status {
    source selector demo.second
    key second.id
    bounds x 16 y 16 width 320 height 96

    lane visible weight 80 {
      hydrate second-card from selector demo.second
    }
  }

  surface demo.swap kind action component x-button {
    source selector demo.swap
    key swap.id
    bounds x 16 y 128 width 140 height 56

    lane visible weight 80 {
      mount swap-surfaces from selector demo.swap
    }

    on click "[data-action='swap-surfaces']" -> action demo.swap {
      preventDefault true
      payload label from target.dataset.label
    }
  }
}`;
const DOCS_RMT_PLAYGROUND_PRESETS = Object.freeze([
  Object.freeze({ id: 'minimal', source: DOCS_RMT_PLAYGROUND_DEFAULT_SOURCE, filePath: 'docs/rmt-playground-minimal.rmt' }),
  Object.freeze({ id: 'kernel-form', source: DOCS_RMT_PLAYGROUND_KERNEL_FORM_SOURCE, filePath: 'docs/rmt-playground-kernel-form.rmt' }),
  Object.freeze({ id: 'transitions', source: DOCS_RMT_PLAYGROUND_TRANSITIONS_SOURCE, filePath: 'docs/rmt-playground-transitions.rmt' }),
  Object.freeze({ id: 'customer-service-kernel', endpoint: 'customer-service-kernel', filePath: 'products/rmt-maraca-kernel-orchestration/kernel-orchestration-app.rmt' })
]);
const DOCS_SHELL_SHADOW_STYLE_ID = 'xtend-docs-shell-shadow-styles';
const DOCS_RMT_EXTENSION_SLOTS = Object.freeze([
  'docs.slot.content',
  'docs.slot.sidebar',
  'docs.slot.related',
  'docs.slot.component-demo',
  'docs.slot.rich-content',
  'docs.slot.media',
  'docs.slot.diagnostics'
]);
const DOCS_TRUSTED_DOM_FORBIDDEN_TAGS = Object.freeze([
  'script',
  'iframe',
  'object',
  'embed',
  'link',
  'meta',
  'base',
  'form'
]);
const DOCS_TRUSTED_DOM_URL_ATTRIBUTES = Object.freeze(['href', 'src', 'action', 'poster']);
const DOCS_COMPONENT_DEMOS = Object.freeze(createDocsComponentDemos());
const DOCS_ROUTE_CONTENT_CACHE_LIMIT = 32;
const DOCS_ROUTE_IDLE_TIMEOUT_MS = 520;
const DOCS_ROUTE_CONTENT_CACHE = new Map();
const DOCS_ROUTE_PAYLOAD_PROMISES = new Map();
const DOCS_I18N_SCHEMA = 'xtend.docs.i18n.v1';
const DOCS_I18N_STORAGE_KEY = 'xtend.docs.locale';
const DOCS_SHELL_SCOPED_CSS = `
  #outlet {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }
  xtend-doc-page {
    display: block;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    opacity: 1;
    transform: translateY(0);
    transition: opacity 0.16s ease, transform 0.16s ease;
  }
  xtend-doc-page[data-docs-route-state="loading"] {
    opacity: 0.72;
    transform: translateY(4px);
  }
  xtend-doc-page [data-rmt-shell] {
    transition: border-color 0.16s ease, box-shadow 0.16s ease;
  }
  xtend-doc-page[data-docs-route-state="ready"] [data-rmt-shell] {
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
  }
  .docs-shell-toolbar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 0.5rem;
    min-block-size: 44px;
    margin-bottom: 0.8rem;
  }
  .docs-app-shell {
    display: block;
    width: 100%;
    max-width: none;
    min-width: 0;
    box-sizing: border-box;
    --section-bg: var(--docs-shell-bg);
    --section-padding: 0;
    --main-content-padding: 0;
    --section-gap: 0;
    --border-radius: 0;
  }
  x-section.docs-app-shell::part(container),
  x-section.docs-app-shell::part(content) {
    display: block;
    width: 100%;
    max-width: none;
    min-width: 0;
    flex: 1 1 auto;
    box-sizing: border-box;
    padding: 0;
    overflow: visible;
  }
  .docs-shell-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) var(--docs-sidebar-width, clamp(20rem, 24vw, 27rem));
    gap: var(--docs-layout-gap, clamp(1rem, 2.2vw, 2.5rem));
    align-items: start;
    width: calc(100% - var(--docs-viewport-gutter, 0.5rem) - var(--docs-viewport-gutter, 0.5rem));
    max-width: calc(100% - var(--docs-viewport-gutter, 0.5rem) - var(--docs-viewport-gutter, 0.5rem));
    margin-inline: var(--docs-viewport-gutter, 0.5rem);
    min-width: 0;
    box-sizing: border-box;
  }
  .docs-article-surface,
  .docs-page-sidebar {
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  }
  .docs-article-surface {
    background: var(--section-bg);
    color: var(--text-color);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: clamp(1rem, 2vw, 2rem);
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
  }
  .docs-animation-engine-demo {
    --docs-animation-field-slot-size: 4.55rem;
    --docs-animation-action-slot-size: 4rem;
    --docs-animation-replay-slot-inline-size: 13rem;
    --docs-animation-status-slot-size: 5.5rem;
    display: grid;
    gap: 0.8rem;
    min-block-size: 15.1rem;
    margin: 0 0 1.25rem;
    padding: 1rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: color-mix(in srgb, var(--surface-muted) 84%, var(--section-bg));
    color: var(--text-color);
    box-sizing: border-box;
    contain: layout style;
  }
  .docs-animation-engine-demo-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin: 0;
    font-size: 1rem;
    line-height: 1.35;
    letter-spacing: 0;
  }
  .docs-animation-engine-demo-skeleton-controls {
    display: grid;
    grid-template-columns: repeat(4, minmax(8.5rem, 1fr)) var(--docs-animation-replay-slot-inline-size);
    grid-template-areas:
      "effect duration easing motion replay"
      "status status status status status";
    grid-template-rows: minmax(var(--docs-animation-field-slot-size), auto) var(--docs-animation-status-slot-size);
    gap: 0.7rem;
    align-items: stretch;
    min-width: 0;
  }
  .docs-animation-engine-demo-control-slot {
    display: flex;
    align-items: flex-end;
    min-width: 0;
    min-block-size: var(--docs-animation-field-slot-size);
  }
  .docs-animation-engine-demo-control-slot[data-slot="effect"] {
    grid-area: effect;
  }
  .docs-animation-engine-demo-control-slot[data-slot="duration"] {
    grid-area: duration;
  }
  .docs-animation-engine-demo-control-slot[data-slot="easing"] {
    grid-area: easing;
  }
  .docs-animation-engine-demo-control-slot[data-slot="motion"] {
    grid-area: motion;
  }
  .docs-animation-engine-demo-control-slot[data-slot="replay"] {
    grid-area: replay;
    inline-size: var(--docs-animation-replay-slot-inline-size);
    max-inline-size: 100%;
    min-block-size: var(--docs-animation-action-slot-size);
  }
  .docs-animation-engine-demo-control-slot[data-slot="status"] {
    grid-area: status;
    align-items: stretch;
    block-size: var(--docs-animation-status-slot-size);
    min-block-size: var(--docs-animation-status-slot-size);
  }
  .docs-animation-engine-demo-skeleton-field,
  .docs-animation-engine-demo-skeleton-action,
  .docs-animation-engine-demo-skeleton-status {
    display: block;
    min-width: 0;
    min-height: 4rem;
    border: 1px solid color-mix(in srgb, var(--border-color) 76%, transparent);
    border-radius: 7px;
    background: color-mix(in srgb, var(--docs-code-bg) 76%, var(--surface-muted));
    box-sizing: border-box;
  }
  .docs-animation-engine-demo-skeleton-field {
    inline-size: 100%;
    block-size: var(--docs-animation-field-slot-size);
  }
  .docs-animation-engine-demo-skeleton-action {
    inline-size: 100%;
    block-size: 2.75rem;
    min-height: 2.75rem;
  }
  .docs-animation-engine-demo-skeleton-status {
    inline-size: 100%;
    block-size: 100%;
    min-height: 100%;
  }
  .docs-animation-engine-demo-assistive {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  @media (max-width: 880px) {
    .docs-animation-engine-demo {
      min-block-size: 25rem;
    }
    .docs-animation-engine-demo-skeleton-controls {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-template-areas:
        "effect duration"
        "easing motion"
        "replay replay"
        "status status";
      grid-template-rows:
        repeat(2, minmax(var(--docs-animation-field-slot-size), auto))
        minmax(var(--docs-animation-action-slot-size), auto)
        var(--docs-animation-status-slot-size);
    }
  }
  @media (max-width: 520px) {
    .docs-animation-engine-demo {
      min-block-size: 35.5rem;
    }
    .docs-animation-engine-demo-skeleton-controls {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas:
        "effect"
        "duration"
        "easing"
        "motion"
        "replay"
        "status";
      grid-template-rows:
        repeat(4, minmax(var(--docs-animation-field-slot-size), auto))
        minmax(var(--docs-animation-action-slot-size), auto)
        var(--docs-animation-status-slot-size);
    }
    .docs-animation-engine-demo-control-slot[data-slot="replay"] {
      inline-size: 100%;
    }
  }
  .docs-page-sidebar {
    position: static;
    display: grid;
    gap: 0.85rem;
    align-self: start;
  }
  .docs-sidebar-section {
    background: var(--docs-sidebar-bg);
    color: var(--text-color);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0.9rem;
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
    box-sizing: border-box;
  }
  .docs-sidebar-heading {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin: 0 0 0.65rem;
    font-size: 0.86rem;
    line-height: 1.2;
    color: var(--text-color);
  }
  .docs-sidebar-heading x-icon,
  .docs-related-link x-icon {
    color: var(--primary-color);
    flex: none;
  }
  .docs-sidebar-copy {
    margin: -0.2rem 0 0.75rem;
    color: var(--muted-text-color);
    font-size: 0.88rem;
    line-height: 1.45;
  }
  .docs-related-list {
    display: grid;
    gap: 0.5rem;
  }
  .docs-related-link {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.55rem;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    min-height: 42px;
    padding: 0.55rem 0.62rem;
    border: 1px solid var(--border-color);
    border-radius: 7px;
    background: var(--docs-sidebar-link-bg);
    color: var(--text-color);
    text-decoration: none;
    transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease, transform 0.16s ease;
  }
  x-link.docs-related-link::part(link) {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.55rem;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    color: inherit;
    text-decoration: none;
  }
  .docs-related-link:hover,
  .docs-related-link:focus-visible {
    background: var(--docs-sidebar-link-hover-bg);
    border-color: color-mix(in srgb, var(--primary-color) 56%, var(--border-color));
    color: var(--primary-color);
    transform: translateX(2px);
    outline: none;
  }
  .docs-related-link span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .docs-component-demo[hidden],
  .docs-sidebar-section[hidden] {
    display: none;
  }
  .docs-demo-preview {
    display: grid;
    gap: 0.7rem;
    min-height: 4rem;
    padding: 0.85rem;
    border: 1px solid var(--border-color);
    border-radius: 7px;
    background: var(--surface-muted);
    overflow: visible;
  }
  .docs-demo-preview x-button,
  .docs-demo-preview x-input,
  .docs-demo-preview x-select,
  .docs-demo-preview x-textarea,
  .docs-demo-preview x-status,
  .docs-demo-preview x-progress,
  .docs-demo-preview x-alert,
  .docs-demo-preview x-toast,
  .docs-demo-preview x-tabs,
  .docs-demo-preview x-code,
  .docs-demo-preview x-summary {
    max-width: 100%;
  }
  .docs-demo-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    align-items: center;
  }
  .docs-demo-code-grid {
    display: grid;
    gap: 0.7rem;
    margin-top: 0.75rem;
  }
  .docs-demo-code-block h3 {
    margin: 0 0 0.35rem;
    color: var(--muted-text-color);
    font-size: 0.78rem;
    text-transform: uppercase;
  }
  .docs-demo-code-block x-code {
    display: block;
    width: 100%;
    min-width: 0;
    margin: 0;
    max-height: 18rem;
    max-width: 100%;
    box-sizing: border-box;
    background: var(--docs-code-bg);
    color: var(--x-code-text, #f8fafc);
    border-radius: 8px;
  }
  .docs-demo-surface-zone {
    position: relative;
    min-height: 15rem;
    overflow: hidden;
    border-radius: 7px;
    background: color-mix(in srgb, var(--surface-muted) 80%, transparent);
  }
  .docs-demo-surface-zone x-surface-window,
  .docs-demo-surface-zone x-side-panel {
    position: absolute;
  }
  xtend-doc-page[data-docs-route-slug="learn-rmt-playground"] .docs-shell-layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
    width: calc(100% - var(--docs-viewport-gutter, 0.5rem) - var(--docs-viewport-gutter, 0.5rem));
    max-width: calc(100% - var(--docs-viewport-gutter, 0.5rem) - var(--docs-viewport-gutter, 0.5rem));
  }
  xtend-doc-page[data-docs-route-slug="learn-rmt-playground"] .docs-page-sidebar,
  xtend-doc-page[data-docs-route-slug="learn-rmt-playground"] .docs-shell-toolbar {
    display: none;
  }
  xtend-doc-page[data-docs-route-slug="learn-rmt-playground"] .docs-article-surface {
    min-block-size: max(46rem, calc(100svh - var(--docs-header-reserved-block-size, 4rem) - var(--docs-footer-reserved-block-size, 4rem) - 2.5rem));
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }
  xtend-doc-page[data-docs-route-slug="learn-rmt-playground"] #md-content {
    min-block-size: inherit;
  }
  .docs-rmt-playground {
    display: grid;
    gap: 0;
    margin: 0;
    min-width: 0;
    max-width: 100%;
    min-height: max(46rem, calc(100svh - var(--docs-header-reserved-block-size, 4rem) - var(--docs-footer-reserved-block-size, 4rem) - 2.5rem));
    height: max(46rem, calc(100svh - var(--docs-header-reserved-block-size, 4rem) - var(--docs-footer-reserved-block-size, 4rem) - 2.5rem));
    box-sizing: border-box;
  }
  .docs-rmt-playground-manager {
    display: block;
    width: 100%;
    height: 100%;
    min-height: inherit;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--surface-muted);
    overflow: hidden;
    --surface-manager-min-height: max(46rem, calc(100svh - var(--docs-header-reserved-block-size, 4rem) - var(--docs-footer-reserved-block-size, 4rem) - 2.5rem));
    --surface-manager-bg: var(--surface-muted);
    --surface-manager-color: var(--text-color);
    --surface-window-bg: var(--xtend-surface, var(--section-bg));
    --surface-window-color: var(--text-color);
    --surface-window-border: var(--border-color);
    --surface-window-chrome: color-mix(in srgb, var(--xtend-surface-muted, var(--surface-muted)) 88%, var(--xtend-surface, var(--section-bg)));
    --surface-window-button-hover: color-mix(in srgb, var(--primary-color) 18%, var(--surface-muted));
    --surface-window-active-border: var(--focus-color);
    --surface-window-content-padding: 0;
    --side-panel-bg: var(--xtend-surface, var(--section-bg));
    --side-panel-color: var(--text-color);
    --side-panel-border: var(--border-color);
    --side-panel-chrome: color-mix(in srgb, var(--xtend-surface-muted, var(--surface-muted)) 88%, var(--xtend-surface, var(--section-bg)));
    --side-panel-button-hover: color-mix(in srgb, var(--primary-color) 18%, var(--surface-muted));
    --side-panel-content-padding: 0;
    --xtend-form-control-surface: var(--docs-code-bg);
    --xtend-form-control-text: #f8fafc;
    --xtend-form-label-text: var(--text-color);
    --xtend-form-helper-text: var(--muted-text-color);
    --xtend-form-border-color: color-mix(in srgb, var(--border-color) 72%, transparent);
    --xtend-form-control-shadow: none;
  }
  .docs-rmt-playground-manager x-surface-window,
  .docs-rmt-playground-manager x-side-panel {
    max-width: 100%;
    max-height: 100%;
    contain: layout paint;
  }
  .docs-rmt-playground-editor,
  .docs-rmt-playground-panel {
    display: grid;
    gap: 0;
    min-width: 0;
    height: 100%;
    min-height: 0;
    padding: 0;
    box-sizing: border-box;
    overflow: hidden;
  }
  .docs-rmt-playground-editor {
    grid-template-rows: auto minmax(0, 1fr) minmax(3.35rem, auto);
    background: var(--xtend-surface, var(--section-bg));
  }
  .docs-rmt-playground-template-bar {
    display: grid;
    grid-template-columns: minmax(14rem, 22rem) minmax(0, 1fr);
    align-items: end;
    gap: 0.75rem;
    min-width: 0;
    padding: 0.8rem 0.85rem 0.65rem;
    border-bottom: 1px solid color-mix(in srgb, var(--border-color) 72%, transparent);
    background: color-mix(in srgb, var(--xtend-surface-muted, var(--surface-muted)) 82%, transparent);
    box-sizing: border-box;
  }
  .docs-rmt-playground-template-bar x-select {
    width: 100%;
    min-width: 0;
    --xtend-form-control-height: 2.45rem;
    --xtend-form-control-padding: 0.5rem 0.7rem;
    --xtend-form-label-font-size: 0.78rem;
    --xtend-form-label-font-weight: 700;
    --xtend-form-gap: 0.18rem;
  }
  .docs-rmt-playground-template-bar x-select::part(label) {
    color: var(--muted-text-color);
    text-transform: uppercase;
    letter-spacing: 0;
  }
  .docs-rmt-playground-editor x-textarea {
    display: block;
    width: 100%;
    height: auto;
    min-width: 0;
    min-height: 0;
    align-self: stretch;
    padding: 0.85rem 0.85rem 0;
    box-sizing: border-box;
    --textarea-resize: none;
    --xtend-textarea-code-font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
    --xtend-textarea-line-number-width: 3.25rem;
    --xtend-textarea-line-number-text: var(--muted-text-color);
    --xtend-textarea-line-number-border: color-mix(in srgb, var(--border-color) 66%, transparent);
    --xtend-textarea-line-number-surface: color-mix(in srgb, var(--x-code-bg, var(--docs-code-bg, #06080d)) 88%, var(--xtend-surface-muted, var(--surface-muted)));
    --xtend-form-control-line-height: 1.45;
  }
  .docs-rmt-playground-editor x-textarea::part(label) {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    clip-path: inset(50%);
    overflow: hidden;
    white-space: nowrap;
  }
  .docs-rmt-playground-editor x-textarea::part(editor) {
    height: 100%;
    min-height: 0;
  }
  .docs-rmt-playground-editor x-textarea::part(control),
  .docs-rmt-playground-editor x-textarea::part(highlight),
  .docs-rmt-playground-editor x-textarea::part(highlight-code) {
    font-family: var(--xtend-textarea-code-font-family);
    line-height: var(--xtend-form-control-line-height);
    tab-size: 2;
  }
  .docs-rmt-playground-editor x-textarea::part(control) {
    height: 100%;
    min-height: 0;
    max-height: 100%;
    resize: none;
    overflow: auto;
  }
  .docs-rmt-playground-actions {
    display: grid;
    grid-template-columns: auto auto minmax(14rem, 1fr);
    align-items: center;
    gap: 0.55rem;
    min-height: 3.35rem;
    padding: 0.55rem 0.85rem 0.85rem;
    border-top: 1px solid color-mix(in srgb, var(--border-color) 72%, transparent);
    background: color-mix(in srgb, var(--xtend-surface-muted, var(--surface-muted)) 84%, transparent);
    box-sizing: border-box;
    flex: none;
  }
  .docs-rmt-playground-actions x-button {
    width: max-content;
    min-width: 8.5rem;
    justify-self: start;
  }
  .docs-rmt-playground-status {
    justify-self: end;
    color: var(--muted-text-color);
    font-size: 0.86rem;
    min-width: 0;
    max-width: 100%;
    overflow-wrap: anywhere;
    text-align: end;
  }
  @media (max-width: 42rem) {
    .docs-rmt-playground-template-bar,
    .docs-rmt-playground-actions {
      grid-template-columns: minmax(0, 1fr);
    }
    .docs-rmt-playground-actions x-button,
    .docs-rmt-playground-status {
      width: 100%;
      justify-self: stretch;
      text-align: start;
    }
  }
  .docs-rmt-playground-preview,
  .docs-rmt-playground-output,
  .docs-rmt-playground-diagnostics {
    min-height: 8rem;
    height: 100%;
    max-height: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    overflow: auto;
  }
  .docs-rmt-playground-preview {
    display: grid;
    gap: 0.7rem;
    align-content: start;
    padding: 0.85rem;
  }
  .docs-rmt-playground-preview-app {
    display: grid;
    gap: 0.75rem;
    align-content: start;
    min-width: 0;
    min-height: 100%;
  }
  .docs-rmt-playground-preview-app[data-bounded="true"] {
    position: relative;
    display: block;
    min-height: 38rem;
  }
  .docs-rmt-playground-maraca-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.45rem;
    margin-block-end: 0.55rem;
  }
  .docs-rmt-playground-maraca-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.28rem;
    max-width: 100%;
    min-height: 1.85rem;
    padding: 0.25rem 0.48rem;
    border: 1px solid color-mix(in srgb, var(--border-color) 78%, transparent);
    border-radius: 7px;
    background: color-mix(in srgb, var(--xtend-surface, var(--section-bg)) 88%, var(--primary-color) 12%);
    color: var(--text-color);
    font-size: 0.78rem;
    line-height: 1.2;
    box-sizing: border-box;
  }
  .docs-rmt-playground-maraca-badge[data-enabled="false"] {
    color: var(--muted-text-color);
    background: var(--xtend-surface-muted, var(--surface-muted));
  }
  .docs-rmt-playground-maraca-root {
    display: grid;
    gap: 0.75rem;
    align-content: start;
    min-width: 0;
    min-height: 100%;
  }
  .docs-rmt-playground-maraca-root[data-bounded="true"] {
    position: relative;
    display: block;
    min-height: 42rem;
  }
  .docs-rmt-playground-maraca-root[data-bounded="true"] > [data-maraca-surface] {
    position: absolute;
    box-sizing: border-box;
  }
  .docs-rmt-playground-maraca-root [data-maraca-surface] {
    max-width: 100%;
  }
  .docs-rmt-playground-maraca-root [data-maraca-surface][hidden] {
    display: none;
  }
  .docs-rmt-playground-preview-surface {
    min-width: 0;
  }
  .docs-rmt-playground-preview-surface > * {
    width: 100%;
  }
  .docs-rmt-playground-preview-surface[data-bounded="true"] {
    position: absolute;
    overflow: auto;
    box-sizing: border-box;
    padding: 0.4rem;
  }
  .docs-rmt-playground-preview-card {
    display: grid;
    gap: 0.35rem;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 7px;
    background: var(--xtend-surface, var(--section-bg));
  }
  .docs-rmt-playground-preview-card strong {
    color: var(--text-color);
  }
  .docs-rmt-playground-preview-component {
    display: grid;
    gap: 0.55rem;
  }
  .docs-rmt-playground-preview-component > * {
    width: 100%;
  }
  .docs-rmt-playground-output {
    overflow: auto;
    margin: 0;
    padding: 0.85rem;
    border-radius: 7px;
    background: var(--docs-code-bg);
    color: #f8fafc;
    font-size: 0.86rem;
    line-height: 1.55;
    white-space: pre;
  }
  .docs-rmt-playground-diagnostics {
    display: grid;
    gap: 0.5rem;
    align-content: start;
    padding: 0.85rem;
  }
  .docs-rmt-playground-diagnostic {
    display: grid;
    gap: 0.18rem;
    padding: 0.6rem;
    border: 1px solid var(--border-color);
    border-radius: 7px;
    background: var(--xtend-surface, var(--section-bg));
  }
  .docs-rmt-playground-diagnostic[data-severity="error"] {
    border-color: color-mix(in srgb, #dc2626 56%, var(--border-color));
  }
  .docs-rmt-playground-diagnostic small {
    color: var(--muted-text-color);
  }
  .docs-rmt-playground-article,
  .docs-rmt-playground-related {
    display: block;
    height: 100%;
    min-height: 0;
    max-width: 100%;
    overflow: auto;
    padding: 0.95rem;
    box-sizing: border-box;
    line-height: 1.55;
  }
  .docs-rmt-playground-article > :first-child,
  .docs-rmt-playground-related > :first-child {
    margin-top: 0;
  }
  .docs-rmt-playground-article > :last-child,
  .docs-rmt-playground-related > :last-child {
    margin-bottom: 0;
  }
  .docs-rmt-playground-related .docs-related-list {
    margin-top: 0.7rem;
  }
  .docs-rmt-playground-empty-related {
    color: var(--muted-text-color);
    margin: 0;
  }
  @media (max-width: 980px) {
    xtend-doc-page[data-docs-route-slug="learn-rmt-playground"] .docs-shell-layout {
      width: 100%;
      max-width: 100%;
      margin-inline: 0;
    }
    xtend-doc-page[data-docs-route-slug="learn-rmt-playground"] .docs-article-surface,
    .docs-rmt-playground,
    .docs-rmt-playground-manager {
      border-radius: 0;
    }
  }
  .download-link {
    float: none;
    font-size: 0.9em;
  }
  .docs-icon-button {
    --xtend-button-min-touch-target: 44px;
    color: var(--text-color);
    flex: none;
  }
  .docs-icon-button::part(button) {
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
    padding: 0;
    border: 1px solid var(--border-color);
    border-radius: 999px;
    background: var(--surface-muted);
    color: var(--text-color);
    box-shadow: none;
    backdrop-filter: none;
    transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease, transform 0.16s ease;
  }
  .docs-icon-button:hover::part(button) {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--primary-color) 60%, var(--border-color));
    background: var(--primary-color);
    color: var(--section-bg);
  }
  .docs-icon-button:focus-visible::part(button) {
    outline: 2px solid var(--focus-color);
    outline-offset: 2px;
  }
  .docs-icon-button x-icon {
    pointer-events: none;
  }
  .docs-visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  #md-content {
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    line-height: 1.65;
  }
  #md-content[data-xtend-skeleton-active="true"][data-xtend-skeleton-mode="flow"] {
    min-height: var(--docs-content-skeleton-min-height, 24rem);
  }
  #md-content[data-xtend-skeleton-active="true"] > :not([data-xtend-skeleton-loader]) {
    visibility: hidden;
  }
  #md-content[data-xtend-skeleton-active="true"][data-xtend-skeleton-mode="overlay"] {
    position: relative;
  }
  #md-content[data-xtend-skeleton-cache="overlay"] {
    position: relative;
  }
  #md-content[data-xtend-skeleton-active="true"][data-xtend-skeleton-mode="overlay"] > [data-xtend-skeleton-loader] {
    position: absolute;
    inset: 0 0 auto 0;
    z-index: var(--xtend-skeleton-z-index, 1);
  }
  #md-content[data-xtend-skeleton-cache="overlay"] > [data-xtend-skeleton-loader][data-xtend-skeleton-hidden="true"] {
    position: absolute;
    inset: 0 0 auto 0;
    z-index: var(--xtend-skeleton-z-index, 1);
    opacity: 0;
    pointer-events: none;
  }
  [data-xtend-skeleton-loader] {
    display: grid;
    align-content: start;
    gap: 0.68rem;
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    min-height: var(--docs-content-skeleton-min-height, 24rem);
    padding: 0;
    border-radius: 8px;
    background: transparent;
    contain: layout paint;
  }
  [data-xtend-skeleton-line] {
    display: block;
    height: 0.82rem;
    border-radius: 999px;
    background: var(--xtend-skeleton-line-bg, rgba(148, 163, 184, 0.24));
  }
  [data-xtend-skeleton-line]:first-child {
    height: 1.35rem;
  }
  #md-content > :first-child {
    margin-top: 0;
  }
  #md-content > :last-child {
    margin-bottom: 0;
  }
  #md-content h1,
  #md-content h2,
  #md-content h3 {
    line-height: 1.18;
    color: var(--text-color);
  }
  #md-content p,
  #md-content li {
    color: var(--text-color);
  }
  #md-content a,
  #md-content x-link {
    color: var(--primary-color);
  }
  #md-content pre {
    max-width: 100%;
    overflow: auto;
    padding: 1rem;
    border-radius: 8px;
    background: var(--docs-code-bg);
    color: #f8fafc;
  }
  #md-content code {
    overflow-wrap: anywhere;
  }
  #md-content blockquote {
    margin: 1rem 0;
    padding: 0.7rem 1rem;
    border-left: 3px solid var(--primary-color);
    background: var(--surface-muted);
    border-radius: 0 7px 7px 0;
  }
  #md-content hr {
    height: 1px;
    margin: 1.75rem 0;
    border: 0;
    background: var(--border-color);
  }
  #md-content table {
    width: 100%;
    border-collapse: collapse;
    display: block;
    overflow-x: auto;
  }
  #md-content th,
  #md-content td {
    border: 1px solid var(--border-color);
    padding: 0.55rem;
  }
  @media (max-width: 700px) {
    .docs-shell-layout {
      grid-template-columns: 1fr;
    }
    .docs-page-sidebar {
      position: static;
    }
    .docs-related-link:hover,
    .docs-related-link:focus-visible,
    xtend-doc-page[data-docs-route-state="loading"] {
      transform: none;
    }
  }
`;

function getDocsAssetUrl(key, fallback) {
  const assets = window.xtendDocsAssetUrls || {};
  return typeof assets[key] === 'string' && assets[key] ? assets[key] : fallback;
}

function escapeDocsHtmlAttribute(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function docsPerfNow() {
  return window.performance && typeof window.performance.now === 'function'
    ? window.performance.now()
    : Date.now();
}

function docsRoundDuration(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}

function getDocsI18nConfig() {
  const config = window.xtendDocsI18n && typeof window.xtendDocsI18n === 'object'
    ? window.xtendDocsI18n
    : {};
  const locales = window.xtendDocsLocales && typeof window.xtendDocsLocales === 'object'
    ? window.xtendDocsLocales
    : { de: { label: 'Deutsch', nativeLabel: 'Deutsch' } };
  const available = Array.isArray(config.available) && config.available.length
    ? config.available.slice()
    : Object.keys(locales);
  const fallbackLocale = config.fallbackLocale || config.defaultLocale || available[0] || 'de';
  return {
    schema: config.schema || DOCS_I18N_SCHEMA,
    defaultLocale: config.defaultLocale || fallbackLocale,
    fallbackLocale,
    storageKey: config.storageKey || DOCS_I18N_STORAGE_KEY,
    stateKeys: {
      locale: 'xtend.docs.locale',
      target: 'xtend.docs.locale.target',
      source: 'xtend.docs.locale.source',
      status: 'xtend.docs.locale.status',
      busy: 'xtend.docs.locale.busy',
      transition: 'xtend.docs.locale.transition',
      error: 'xtend.docs.locale.error',
      available: 'xtend.docs.locale.available',
      fallback: 'xtend.docs.locale.fallback',
      ...(config.stateKeys || {})
    },
    locales,
    available
  };
}

function normalizeDocsLocale(value) {
  const config = getDocsI18nConfig();
  const raw = String(value || '').trim().toLowerCase();
  if (config.available.includes(raw)) return raw;
  const short = raw.slice(0, 2);
  if (config.available.includes(short)) return short;
  return config.fallbackLocale;
}

function readStoredDocsLocale() {
  const config = getDocsI18nConfig();
  try {
    return window.localStorage ? window.localStorage.getItem(config.storageKey) : '';
  } catch (error) {
    return '';
  }
}

function writeStoredDocsLocale(locale) {
  const config = getDocsI18nConfig();
  try {
    if (window.localStorage) window.localStorage.setItem(config.storageKey, locale);
  } catch (error) {
    // Storage can be unavailable in hardened or test environments.
  }
}

function detectBrowserDocsLocale() {
  const languages = Array.isArray(navigator.languages) && navigator.languages.length
    ? navigator.languages
    : [navigator.language || ''];
  for (const language of languages) {
    const locale = normalizeDocsLocale(language);
    if (locale) return locale;
  }
  return getDocsI18nConfig().fallbackLocale;
}

function writeDocsLocaleState(values = {}) {
  if (!window.xstate || typeof window.xstate.set !== 'function') return;
  const keys = getDocsI18nConfig().stateKeys;
  Object.entries(values).forEach(([name, value]) => {
    const stateKey = keys[name];
    if (stateKey) window.xstate.set(stateKey, value);
  });
}

function createDocsLocaleTransitionSnapshot(status, detail = {}) {
  const targetLocale = normalizeDocsLocale(detail.targetLocale || detail.locale || getCurrentDocsLocale());
  const activeLocale = window.xtendDocsCurrentLocale ? normalizeDocsLocale(window.xtendDocsCurrentLocale) : '';
  return {
    schema: 'xtend.docs.locale-transition.v1',
    status,
    busy: status === 'loading',
    activeLocale,
    targetLocale,
    slug: detail.slug || getCurrentDocsSlug(),
    source: detail.source || 'route',
    startedAt: detail.startedAt || (window.__xtendDocsLocaleTransition && window.__xtendDocsLocaleTransition.startedAt) || new Date().toISOString(),
    startedAtMs: detail.startedAtMs || (window.__xtendDocsLocaleTransition && window.__xtendDocsLocaleTransition.startedAtMs) || docsPerfNow(),
    completedAt: status === 'loading' ? null : new Date().toISOString(),
    durationMs: detail.startedAtMs ? docsRoundDuration(docsPerfNow() - detail.startedAtMs) : detail.durationMs || 0,
    token: detail.token || (window.__xtendDocsLocaleTransition && window.__xtendDocsLocaleTransition.token) || 0,
    error: detail.error || null
  };
}

function setDocsLocaleTransitionState(status, detail = {}) {
  const snapshot = createDocsLocaleTransitionSnapshot(status, detail);
  if (status === 'loading') {
    window.__xtendDocsLocaleTransition = snapshot;
  } else if (!window.__xtendDocsLocaleTransition ||
    window.__xtendDocsLocaleTransition.token === snapshot.token ||
    window.__xtendDocsLocaleTransition.targetLocale === snapshot.targetLocale) {
    window.__xtendDocsLocaleTransition = null;
  }
  window.__xtendDocsLocaleLastTransition = snapshot;
  writeDocsLocaleState({
    target: snapshot.targetLocale,
    status,
    busy: snapshot.busy,
    transition: snapshot,
    error: snapshot.error
  });
  document.documentElement.toggleAttribute('data-docs-locale-busy', snapshot.busy);
  document.documentElement.setAttribute('data-docs-locale-status', status);
  updateDocsLocaleBusyUi(snapshot);
  window.dispatchEvent(new CustomEvent('xtend-docs-locale-transition', { detail: snapshot }));
  return snapshot;
}

function beginDocsLocaleTransition(targetLocale, detail = {}) {
  const token = Number(window.__xtendDocsLocaleTransitionToken || 0) + 1;
  window.__xtendDocsLocaleTransitionToken = token;
  return setDocsLocaleTransitionState('loading', {
    ...detail,
    targetLocale,
    token,
    startedAt: new Date().toISOString(),
    startedAtMs: docsPerfNow()
  });
}

function completeDocsLocaleTransition(locale, slug, detail = {}) {
  const normalized = normalizeDocsLocale(locale);
  const pending = window.__xtendDocsLocaleTransition;
  if (pending && (pending.targetLocale !== normalized || pending.slug !== slug)) {
    return false;
  }
  setDocsLocaleTransitionState(detail.status || 'ready', {
    ...detail,
    targetLocale: normalized,
    slug,
    token: pending ? pending.token : detail.token,
    startedAt: pending ? pending.startedAt : detail.startedAt,
    startedAtMs: pending ? pending.startedAtMs : detail.startedAtMs,
    source: pending ? pending.source : detail.source
  });
  updateDocsLocaleUi(normalized, { publish: false, busy: false, slug });
  return true;
}

function getDocsBasePath() {
  const raw = String(window.xtendDocsBasePath || '').trim().replace(/\/+$/, '');
  if (!raw || raw === '/') return '';
  return raw.startsWith('/') ? raw : '/' + raw;
}

function stripDocsBasePath(value) {
  let raw = String(value || '').trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) {
    try {
      raw = new URL(raw, location.origin).pathname;
    } catch (error) {
      raw = '';
    }
  }
  raw = raw.split('?')[0].replace(/^#\/?/, '/');
  if (!raw.startsWith('/')) raw = '/' + raw;
  raw = raw.replace(/^\/+index\.php\/?/, '/');
  const base = getDocsBasePath();
  if (base && (raw === base || raw.startsWith(base + '/'))) {
    raw = raw.slice(base.length) || '/';
  }
  return raw.replace(/^\/+index\.php\/?/, '/');
}

function getDocsRouteSource(rawValue) {
  if (rawValue !== undefined && rawValue !== null && String(rawValue).trim() !== '') {
    return rawValue;
  }
  return location.hash || location.pathname || '/';
}

function getDocsBrowserPath(localizedPath) {
  const base = getDocsBasePath();
  const path = String(localizedPath || '/').startsWith('/')
    ? String(localizedPath || '/')
    : '/' + String(localizedPath || '/');
  return (base || '') + path;
}

function normalizeDocsPathForCompare(path) {
  const normalized = String(path || '/').replace(/\/+$/, '');
  return normalized || '/';
}

function getDocsSlugAliases() {
  return window.xtendDocsSlugAliases && typeof window.xtendDocsSlugAliases === 'object'
    ? window.xtendDocsSlugAliases
    : {};
}

function resolveCanonicalDocsSlug(value) {
  const slug = String(value || 'readme').replace(/^\/+|\/+$/g, '') || 'readme';
  const aliases = getDocsSlugAliases();
  const visited = new Set();
  let current = slug;
  while (Object.prototype.hasOwnProperty.call(aliases, current)) {
    if (visited.has(current)) return slug;
    visited.add(current);
    const next = String(aliases[current] || '').replace(/^\/+|\/+$/g, '');
    if (!next) return slug;
    current = next;
  }
  return current;
}

function parseDocsRoutePath(rawValue) {
  const config = getDocsI18nConfig();
  const raw = stripDocsBasePath(getDocsRouteSource(rawValue))
    .split('?')[0]
    .replace(/^\/+/, '');
  if (!raw || raw === '/') {
    return { locale: getCurrentDocsLocale(), slug: 'readme', localized: true };
  }
  const parts = raw.split('/');
  const first = parts[0] || '';
  if (config.available.includes(first)) {
    return {
      locale: normalizeDocsLocale(first),
      slug: resolveCanonicalDocsSlug(parts.slice(1).join('/') || 'readme'),
      localized: true
    };
  }
  return {
    locale: getCurrentDocsLocale(),
    slug: resolveCanonicalDocsSlug(raw || 'readme'),
    localized: false
  };
}

function getCurrentDocsSlug() {
  const route = parseDocsRoutePath();
  return resolveCanonicalDocsSlug(route.slug || window.xtendInitialDocsSlug || 'readme');
}

function publishDocsLocale(locale, source = 'default') {
  const config = getDocsI18nConfig();
  const normalized = normalizeDocsLocale(locale);
  const previous = window.xtendDocsCurrentLocale ? normalizeDocsLocale(window.xtendDocsCurrentLocale) : '';
  const changed = previous !== normalized;
  window.xtendDocsCurrentLocale = normalized;
  document.documentElement.setAttribute('lang', (config.locales[normalized] && config.locales[normalized].htmlLang) || normalized);
  document.documentElement.setAttribute('data-docs-locale', normalized);
  writeDocsLocaleState({
    locale: normalized,
    source,
    target: window.__xtendDocsLocaleTransition ? window.__xtendDocsLocaleTransition.targetLocale : normalized,
    available: config.available.slice(),
    fallback: config.fallbackLocale
  });
  if (!window.__xtendDocsLocaleTransition) {
    writeDocsLocaleState({
      status: 'ready',
      busy: false,
      error: null
    });
  }
  if (changed || source === 'user' || source === 'browser' || source === 'default' || source === 'xstate') {
    window.dispatchEvent(new CustomEvent('xtend-docs-locale-changed', {
      detail: {
        schema: DOCS_I18N_SCHEMA,
        locale: normalized,
        previousLocale: previous || null,
        changed,
        source,
        available: config.available.slice(),
        fallbackLocale: config.fallbackLocale
      }
    }));
  }
  return normalized;
}

function getCurrentDocsLocale() {
  if (window.xtendDocsCurrentLocale) return normalizeDocsLocale(window.xtendDocsCurrentLocale);
  const stored = readStoredDocsLocale();
  if (stored) return publishDocsLocale(stored, 'user');
  return publishDocsLocale(detectBrowserDocsLocale(), 'browser');
}

function getLocalizedDocsPath(slug, locale = getCurrentDocsLocale()) {
  return getDocsBrowserPath('/' + normalizeDocsLocale(locale) + '/' + (slug || 'readme'));
}

function normalizeDocsRouteHref(slugOrHref, locale = getCurrentDocsLocale()) {
  const parsed = parseDocsRoutePath(slugOrHref || 'readme');
  return getLocalizedDocsPath(parsed.slug || 'readme', locale);
}

function getLocalizedDocsMap(recordName, locale = getCurrentDocsLocale()) {
  const root = window[recordName];
  if (!root || typeof root !== 'object') return {};
  return root[normalizeDocsLocale(locale)] || root[getDocsI18nConfig().fallbackLocale] || {};
}

function getExactLocalizedDocsMap(recordName, locale = getCurrentDocsLocale()) {
  const root = window[recordName];
  if (!root || typeof root !== 'object') return {};
  return root[normalizeDocsLocale(locale)] || {};
}

function createDocsActiveRecordPatch(record, slug) {
  if (!slug || !record || typeof record !== 'object' || !Object.prototype.hasOwnProperty.call(record, slug)) {
    return record || {};
  }
  return { [slug]: record[slug] };
}

function syncLegacyDocsGlobals(locale = getCurrentDocsLocale(), options = {}) {
  const normalized = normalizeDocsLocale(locale);
  const pages = getExactLocalizedDocsMap('xtendDocsLocalizedPages', normalized);
  const meta = getLocalizedDocsMap('xtendDocsLocalizedPagesMeta', normalized);
  const titles = getLocalizedDocsMap('xtendDocsLocalizedTitles', normalized);
  const slug = options && options.slug ? String(options.slug) : '';
  const pagePatch = createDocsActiveRecordPatch(pages, slug);
  const metaPatch = createDocsActiveRecordPatch(meta, slug);
  const titlePatch = createDocsActiveRecordPatch(titles, slug);
  window.xtendDocsPages = {
    ...(window.xtendDocsPages || {}),
    ...pagePatch
  };
  window.xtendDocsPagesMeta = {
    ...(window.xtendDocsPagesMeta || {}),
    ...metaPatch
  };
  window.xtendDocsTitles = {
    ...(window.xtendDocsTitles || {}),
    ...titlePatch
  };
  return { pages, meta, titles };
}

function rememberDocsCacheEntry(key, value) {
  DOCS_ROUTE_CONTENT_CACHE.set(key, value);
  while (DOCS_ROUTE_CONTENT_CACHE.size > DOCS_ROUTE_CONTENT_CACHE_LIMIT) {
    const firstKey = DOCS_ROUTE_CONTENT_CACHE.keys().next().value;
    DOCS_ROUTE_CONTENT_CACHE.delete(firstKey);
  }
  return value;
}

function createDocsRouteContentCacheKey(slug, html, options = {}) {
  return [
    options.locale || getCurrentDocsLocale(),
    slug || 'readme',
    options.source || 'docs.parsedown',
    options.markupClass || 'parsedownHtml',
    options.trustBoundary || DOCS_RMT_TRUST_BOUNDARY,
    String(html || '')
  ].join('\u0000');
}

function cloneDocsSanitizeResult(result, cacheHit = false) {
  return {
    ...result,
    removed: Array.isArray(result.removed) ? result.removed.slice() : [],
    removedCount: Number(result.removedCount || 0),
    cacheHit
  };
}

function dispatchDocsLaneComplete(detail = {}) {
  window.dispatchEvent(new CustomEvent('xtend-docs-lane-complete', {
    detail: {
      schema: 'xtend.docs.route-lane.v1',
      completedAt: new Date().toISOString(),
      ...detail
    }
  }));
}

function runDocsMeasuredLane(detail, callback) {
  const startedAt = docsPerfNow();
  const result = callback();
  dispatchDocsLaneComplete({
    ...detail,
    durationMs: docsRoundDuration(docsPerfNow() - startedAt)
  });
  return result;
}

function scheduleDocsAfterPaint(callback) {
  return docsBrowserScheduler.afterPaint(callback);
}

function scheduleDocsIdle(callback, timeout = DOCS_ROUTE_IDLE_TIMEOUT_MS) {
  return docsBrowserScheduler.scheduleEndpoint('docs.route.idle', window.location.pathname, callback, { kind: 'idle', timeout });
}

function getXtendSkeletonLoader() {
  if (window.XTendSkeletonLoader && typeof window.XTendSkeletonLoader.show === 'function') {
    return window.XTendSkeletonLoader;
  }
  if (window.XTendLoader && window.XTendLoader.skeletonLoader && typeof window.XTendLoader.skeletonLoader.show === 'function') {
    return window.XTendLoader.skeletonLoader;
  }
  if (window.XTendLoader && typeof window.XTendLoader.showSkeleton === 'function') {
    return {
      schema: window.XTendLoader.skeletonLoaderContract || 'xtend.loader.skeleton-loader.v1',
      show: window.XTendLoader.showSkeleton,
      hide: window.XTendLoader.hideSkeleton
    };
  }
  return null;
}

function showDocsSkeleton(target, options = {}) {
  if (!target) return null;
  const loader = getXtendSkeletonLoader();
  const skeletonOptions = {
    profile: options.profile || options.profileId || 'docs-article',
    variant: options.variant || 'article',
    lines: options.lines || 10,
    minHeight: options.minHeight || '24rem',
    label: options.label || 'Dokumentation wird geladen',
    source: options.source || 'docs.parsedown',
    schedule: options.schedule || 'docs.markdown.parse'
  };
  if (loader && typeof loader.show === 'function') {
    const skeleton = loader.show(target, skeletonOptions);
    const hasVisualRecords = Boolean(skeleton && typeof skeleton.querySelector === 'function' && skeleton.querySelector(
      '[data-xtend-skeleton-item], [data-xtend-skeleton-line]'
    ));
    if (hasVisualRecords) {
      target.removeAttribute('data-xtend-skeleton-degraded');
      return skeleton;
    }
    if (typeof loader.hide === 'function') loader.hide(target);
    target.removeAttribute('data-xtend-skeleton-active');
    target.removeAttribute('aria-busy');
    target.setAttribute('data-xtend-skeleton-degraded', 'invalid-geometry');
    return null;
  }
  target.removeAttribute('data-xtend-skeleton-active');
  target.removeAttribute('aria-busy');
  target.setAttribute('data-xtend-skeleton-degraded', 'loader-unavailable');
  return null;
}

function hideDocsSkeleton(target, options = {}) {
  if (!target) return 0;
  const loader = getXtendSkeletonLoader();
  if (loader && typeof loader.hide === 'function') {
    const hidden = loader.hide(target, options);
    target.removeAttribute('data-xtend-skeleton-degraded');
    return hidden;
  }
  const skeletons = Array.from(target.querySelectorAll ? target.querySelectorAll('[data-xtend-skeleton-loader]') : []);
  skeletons.forEach((skeleton) => skeleton.remove());
  target.removeAttribute('data-xtend-skeleton-active');
  target.removeAttribute('data-xtend-skeleton-mode');
  target.removeAttribute('data-xtend-skeleton-cache');
  target.removeAttribute('data-xtend-skeleton-degraded');
  if (!options.preserveBusy) target.removeAttribute('aria-busy');
  return skeletons.length;
}

function createRmtSnippet(tag, attributes = {}, children = []) {
  const component = String(tag || 'x-component');
  const id = component.replace(/^x-/, '').replace(/[^A-Za-z0-9_-]+/g, '-');
  const attributeLines = Object.entries(attributes || {})
    .map(([key, value]) => `      ${key} ${JSON.stringify(value)}`);
  const childCount = Array.isArray(children) ? children.length : 0;
  return [
    `template docs.demo.${id} {`,
    '  portal surface.root root "#docs-demo-root" layer surface',
    '',
    `  state docs.demo.${id}.props type object preserve {`,
    '    initial {',
    ...attributeLines,
    `      childCount ${childCount}`,
    '    }',
    '  }',
    '',
    `  surface docs.demo.${id} kind component component ${component} {`,
    `    source state docs.demo.${id}.props`,
    '    portal surface.root',
    '    lane visible weight 50 {',
    `      hydrate ${id}-preview`,
    '    }',
    '  }',
    '}'
  ].join('\n');
}

function createDocsComponentDemos() {
  const demos = {};
  const add = (slug, tag, title, description, html, options = {}) => {
    demos[slug] = {
      tag,
      title,
      description,
      html,
      descriptor: { type: 'element', tag, attributes: options.attributes || {}, children: options.children || [] },
      rmt: options.rmt || createRmtSnippet(tag, options.attributes || {}, options.children || []),
      actions: options.actions || []
    };
  };

  add('components-xbutton', 'x-button', 'x-button', 'Varianten, Iconographie und Button-Events direkt testen.', '<x-button variant="primary"><x-icon name="rocket" pack="lucide" decorative size="1rem"></x-icon>Deploy preview</x-button>', {
    attributes: { variant: 'primary' },
    children: [
      { tag: 'x-icon', attributes: { name: 'rocket', pack: 'lucide', decorative: true, size: '1rem' } },
      'Deploy preview'
    ]
  });
  add('components-xicon', 'x-icon', 'x-icon', 'Lokale Icon-Packs fuer Shell-Actions und Link-Signale.', '<div class="docs-demo-actions"><x-icon name="sparkles" pack="lucide" label="Innovation" size="1.4rem"></x-icon><x-icon name="shield-check" pack="lucide" label="Safety" size="1.4rem"></x-icon><x-icon name="route" pack="lucide" label="Routing" size="1.4rem"></x-icon></div>', {
    attributes: { name: 'sparkles', pack: 'lucide', label: 'Innovation', size: '1.4rem' }
  });
  add('components-xlink', 'x-link', 'x-link', 'Hash-Routing mit visuell klarer Link-Affordance.', '<x-link class="docs-related-link" href="/quick-start-guide"><x-icon name="arrow-up-right" pack="lucide" decorative size="1rem"></x-icon><span>Quick Start Guide</span><x-icon name="chevron-right" pack="lucide" decorative size="1rem"></x-icon></x-link>', {
    attributes: { href: '/quick-start-guide' },
    children: ['Quick Start Guide']
  });
  add('components-xinput', 'x-input', 'x-input', 'Darkmode-faehige Eingabe als Shell-Suchfeld oder Form-Control.', '<x-input name="project" placeholder="Microfrontend suchen..." value="Surface Workbench"></x-input>', {
    attributes: { name: 'project', placeholder: 'Microfrontend suchen...', value: 'Surface Workbench' }
  });
  add('components-xform', 'x-form', 'x-form', 'Komponierte Formular-Shell mit XTend Controls.', '<x-form><x-input name="name" placeholder="App Shell Name"></x-input><x-button variant="primary">Validieren</x-button></x-form>', {
    attributes: {},
    children: [
      { tag: 'x-input', attributes: { name: 'name', placeholder: 'App Shell Name' } },
      { tag: 'x-button', attributes: { variant: 'primary' }, children: ['Validieren'] }
    ]
  });
  add('components-xselect', 'x-select', 'x-select', 'Auswahl-Control mit nativer Select-Semantik.', '<x-select label="Surface Type" placeholder="Bitte waehlen" value="window"><option value="window">Window</option><option value="side-panel">Side Panel</option><option value="modal">Modal</option></x-select>', {
    attributes: { label: 'Surface Type', placeholder: 'Bitte waehlen', value: 'window' },
    children: [
      { tag: 'option', attributes: { value: 'window' }, children: ['Window'] },
      { tag: 'option', attributes: { value: 'side-panel' }, children: ['Side Panel'] },
      { tag: 'option', attributes: { value: 'modal' }, children: ['Modal'] }
    ]
  });
  add('components-xcheckbox', 'x-checkbox', 'x-checkbox', 'Boolean-Settings fuer Shell Preferences.', '<x-checkbox name="remember" checked>Layout wiederherstellen</x-checkbox>', {
    attributes: { name: 'remember', checked: true },
    children: ['Layout wiederherstellen']
  });
  add('components-xtoggle', 'x-toggle', 'x-toggle', 'Switch-Control fuer binaere Einstellungen.', '<x-toggle name="notifications" value="enabled" checked label="Benachrichtigungen"></x-toggle>', {
    attributes: { name: 'notifications', value: 'enabled', checked: true, label: 'Benachrichtigungen' }
  });
  add('components-xradio', 'x-radio', 'x-radio', 'Einzeloptionen fuer kompakte Einstellbereiche.', '<div class="docs-demo-actions"><x-radio name="density" value="compact" checked>Compact</x-radio><x-radio name="density" value="comfortable">Comfortable</x-radio></div>', {
    attributes: { name: 'density', value: 'compact', checked: true },
    children: ['Compact']
  });
  add('components-xtextarea', 'x-textarea', 'x-textarea', 'Mehrzeilige Eingabe fuer Prompts, Notes oder Config-Fragmente.', '<x-textarea name="notes" rows="4" placeholder="Lifecycle notes">Hydrate shell, then schedule content.</x-textarea>', {
    attributes: { name: 'notes', rows: '4', placeholder: 'Lifecycle notes' },
    children: ['Hydrate shell, then schedule content.']
  });
  add('components-xcalendar', 'x-calendar', 'x-calendar', 'Datumsauswahl mit Grid-Interaktion.', '<x-calendar></x-calendar>');
  add('components-xstatus', 'x-status', 'x-status', 'Statuszeilen fuer Shell- und Lifecycle-Zustaende.', '<x-status type="success" state="ready" message="Surface stack synchronized">Surface stack synchronized</x-status>', {
    attributes: { type: 'success', state: 'ready', message: 'Surface stack synchronized' },
    children: ['Surface stack synchronized']
  });
  add('components-xprogress', 'x-progress', 'x-progress', 'Fortschritt fuer Hydration, Import und Scheduler-Arbeit.', '<x-progress value="68" max="100" label="Hydration" status="68 Prozent">68 Prozent</x-progress>', {
    attributes: { value: '68', max: '100', label: 'Hydration', status: '68 Prozent' },
    children: ['68 Prozent']
  });
  add('components-xalert', 'x-alert', 'x-alert', 'Inline Feedback mit A11y-Live-Region.', '<x-alert type="info" closable>RMT shell rendered, Parsedown content scheduled.</x-alert>', {
    attributes: { type: 'info', closable: true },
    children: ['RMT shell rendered, Parsedown content scheduled.']
  });
  add('components-xtoast', 'x-toast', 'x-toast', 'Toast Feedback per API oder direktes Element.', '<div class="docs-demo-actions"><x-button data-demo-action="toast" variant="primary">Toast anzeigen</x-button></div>', {
    attributes: { type: 'success', duration: '3000' },
    children: ['Gespeichert'],
    actions: ['toast']
  });
  add('components-xmodal', 'x-modal', 'x-modal', 'Modales Overlay mit Focus Trap, Escape und xstate-Sync.', '<div class="docs-demo-actions"><x-button data-demo-action="open-modal" variant="primary">Modal testen</x-button></div><x-modal id="docs-demo-modal" title="Release Check" content="XTend Modal laeuft in der Docs Shell." overlay></x-modal>', {
    attributes: { id: 'docs-demo-modal', title: 'Release Check', content: 'XTend Modal laeuft in der Docs Shell.', overlay: true },
    actions: ['open-modal']
  });
  add('components-xdialog', 'x-dialog', 'x-dialog', 'Dialog-Surface fuer bestaetigende UI-Flows.', '<div class="docs-demo-actions"><x-button data-demo-action="open-dialog" variant="secondary">Dialog testen</x-button></div><x-dialog id="docs-demo-dialog" title="Dialog Surface" width="420px" height="220px" overlay>RMT kann Dialoge als Shell-Surfaces beschreiben.</x-dialog>', {
    attributes: { id: 'docs-demo-dialog', title: 'Dialog Surface', width: '420px', height: '220px', overlay: true },
    children: ['RMT kann Dialoge als Shell-Surfaces beschreiben.'],
    actions: ['open-dialog']
  });
  add('components-xdrawer', 'x-drawer', 'x-drawer', 'Drawer mit Trigger-Slot fuer Tooling- und Navigationsflaechen.', '<x-drawer id="docs-demo-drawer" label="Inspector" placement="right"><x-button slot="trigger" variant="secondary">Drawer oeffnen</x-button><p>Inspector-Panel fuer Shell-Metadaten.</p></x-drawer>', {
    attributes: { id: 'docs-demo-drawer', label: 'Inspector', placement: 'right' },
    children: [
      { tag: 'x-button', attributes: { slot: 'trigger', variant: 'secondary' }, children: ['Drawer oeffnen'] },
      { tag: 'p', children: ['Inspector-Panel fuer Shell-Metadaten.'] }
    ]
  });
  add('components-xpopover', 'x-popover', 'x-popover', 'Kontextpanel mit Trigger, Placement und optionaler Modalitaet.', '<x-popover id="docs-demo-popover" placement="bottom"><x-button slot="trigger" variant="secondary">Popover</x-button><p>Microcopy, Actions oder kurze Settings.</p></x-popover>', {
    attributes: { id: 'docs-demo-popover', placement: 'bottom' },
    children: [
      { tag: 'x-button', attributes: { slot: 'trigger', variant: 'secondary' }, children: ['Popover'] },
      { tag: 'p', children: ['Microcopy, Actions oder kurze Settings.'] }
    ]
  });
  add('components-xtooltip', 'x-tooltip', 'x-tooltip', 'Nicht-modale Hilfe am Control.', '<span id="docs-demo-tooltip-anchor">Hover oder Fokus</span><x-tooltip for="docs-demo-tooltip-anchor" placement="top" label="Tooltip">Kontext ohne Layoutsprung.</x-tooltip>', {
    attributes: { for: 'docs-demo-tooltip-anchor', placement: 'top', label: 'Tooltip' },
    children: ['Kontext ohne Layoutsprung.']
  });
  add('components-xtabs', 'x-tabs', 'x-tabs', 'Tab-Shell fuer dichte Tool- oder Contentbereiche.', '<x-tabs selected="0"><x-tab name="Preview">Preview</x-tab><x-tab name="RMT">RMT Descriptor</x-tab><x-tab name="Events">Events</x-tab></x-tabs>', {
    attributes: { selected: '0' },
    children: [
      { tag: 'x-tab', attributes: { name: 'Preview' }, children: ['Preview'] },
      { tag: 'x-tab', attributes: { name: 'RMT' }, children: ['RMT Descriptor'] },
      { tag: 'x-tab', attributes: { name: 'Events' }, children: ['Events'] }
    ]
  });
  add('components-xsummary', 'x-summary', 'x-summary', 'Disclosure-Control fuer progressive Detailtiefe.', '<x-summary type="info" open><span slot="summary">Contract Details</span><p>Shell-first, component-managed, RMT-schedulbar.</p></x-summary>', {
    attributes: { type: 'info', open: true },
    children: [
      { tag: 'span', attributes: { slot: 'summary' }, children: ['Contract Details'] },
      { tag: 'p', children: ['Shell-first, component-managed, RMT-schedulbar.'] }
    ]
  });
  add('components-xcode', 'x-code', 'x-code', 'Copy-faehiger Codebereich fuer Beispiele und Snippets.', '<x-code lang="html"><template><x-button variant="primary">Ship it</x-button></template></x-code>', {
    attributes: { lang: 'html' },
    children: [
      { tag: 'template', children: ['<x-button variant="primary">Ship it</x-button>'] }
    ]
  });
  add('components-xsection', 'x-section', 'x-section', 'Layout-Sektion als RMT-Shell-Baustein.', '<x-section label="Demo Section" bordered><strong>Shell Slot</strong><p>Content, Aside und Footer bleiben komponierbar.</p></x-section>', {
    attributes: { label: 'Demo Section', bordered: true },
    children: [
      { tag: 'strong', children: ['Shell Slot'] },
      { tag: 'p', children: ['Content, Aside und Footer bleiben komponierbar.'] }
    ]
  });
  add('components-xcards', 'x-cards', 'x-cards', 'Kompakte Kartenlisten fuer wiederholte Inhalte.', '<x-cards columns="2" gap="0.75rem"><article><strong>Surface</strong><p>Window</p></article><article><strong>Lane</strong><p>visible</p></article></x-cards>', {
    attributes: { columns: '2', gap: '0.75rem' },
    children: [
      { tag: 'article', children: [{ tag: 'strong', children: ['Surface'] }, { tag: 'p', children: ['Window'] }] },
      { tag: 'article', children: [{ tag: 'strong', children: ['Lane'] }, { tag: 'p', children: ['visible'] }] }
    ]
  });
  add('components-xhero', 'x-hero', 'x-hero', 'First-viewport Signal fuer App-Shells.', '<x-hero background-light="#f8fbff" background-dark="#050506" font-color-light="#162033" font-color-dark="#f8fafc" align="block"><h2>XTend Shell</h2><p>RMT orchestrated.</p></x-hero>', {
    attributes: { 'background-light': '#f8fbff', 'background-dark': '#050506', 'font-color-light': '#162033', 'font-color-dark': '#f8fafc', align: 'block' },
    children: [{ tag: 'h2', children: ['XTend Shell'] }, { tag: 'p', children: ['RMT orchestrated.'] }]
  });
  add('components-xtype', 'x-type', 'x-type', 'Typographische Microanimation fuer Status- oder Hero-Zeilen.', '<x-type texts="[&quot;App Shell&quot;,&quot;RMT&quot;,&quot;Lifecycle&quot;]" speed="40" pause="900" cursor></x-type>', {
    attributes: { texts: '["App Shell","RMT","Lifecycle"]', speed: '40', pause: '900', cursor: true }
  });
  add('components-xmasonry', 'x-masonry', 'x-masonry', 'Dichte Content-Galerien ohne externes Layout-Framework.', '<x-masonry columns="2" gap="0.6rem"><div>Window</div><div>Panel</div><div>Overlay</div></x-masonry>', {
    attributes: { columns: '2', gap: '0.6rem' },
    children: [{ tag: 'div', children: ['Window'] }, { tag: 'div', children: ['Panel'] }, { tag: 'div', children: ['Overlay'] }]
  });
  const lightboxLogoUrl = getDocsAssetUrl('lightboxLogo', getDocsBasePath() + '/index.php?xtend-docs-asset=xtend-logo.png');
  add('components-xlightbox', 'x-lightbox', 'x-lightbox', 'Medien-Fokus ohne Shell-Kontext zu verlieren.', `<x-lightbox id="docs-demo-lightbox" src="${escapeDocsHtmlAttribute(lightboxLogoUrl)}" alt="XTend Logo"><x-button slot="trigger" variant="secondary">Logo ansehen</x-button></x-lightbox>`, {
    attributes: { id: 'docs-demo-lightbox', src: lightboxLogoUrl, alt: 'XTend Logo' },
    children: [{ tag: 'x-button', attributes: { slot: 'trigger', variant: 'secondary' }, children: ['Logo ansehen'] }]
  });
  add('components-xsidepanel', 'x-side-panel', 'x-side-panel', 'SidePanel-Surface fuer near-native App-Shells.', '<div class="docs-demo-surface-zone"><x-side-panel surface-id="docs.demo.panel" label="Docs Inspector" open active mode="docked" placement="right" initial-width="18rem"><p>Related Links und Demo-Code leben hier.</p></x-side-panel></div>', {
    attributes: { 'surface-id': 'docs.demo.panel', label: 'Docs Inspector', open: true, active: true, mode: 'docked', placement: 'right', 'initial-width': '18rem' },
    children: [{ tag: 'p', children: ['Related Links und Demo-Code leben hier.'] }]
  });
  add('components-xsurfacewindow', 'x-surface-window', 'x-surface-window', 'Window-Surface fuer Multi-Window SPAs.', '<div class="docs-demo-surface-zone"><x-surface-window surface-id="docs.demo.window" label="Preview Window" open active initial-x="16" initial-y="16" initial-width="18rem" initial-height="10rem" resizable draggable><p>Window Content</p></x-surface-window></div>', {
    attributes: { 'surface-id': 'docs.demo.window', label: 'Preview Window', open: true, active: true, 'initial-x': '16', 'initial-y': '16', 'initial-width': '18rem', 'initial-height': '10rem', resizable: true, draggable: true },
    children: [{ tag: 'p', children: ['Window Content'] }]
  });
  add('components-xsurfacemanager', 'x-surface-manager', 'x-surface-manager', 'Surface-Wurzel fuer Windows, Panels und Overlays.', '<div class="docs-demo-surface-zone"><x-surface-manager manager-id="docs.demo.manager" layout="workbench"><x-surface-window slot="windows" surface-id="docs.manager.window" label="Window" open initial-width="16rem" initial-height="9rem"><p>Managed Window</p></x-surface-window><x-side-panel slot="panels" surface-id="docs.manager.panel" label="Panel" open mode="docked" placement="right"><p>Managed Panel</p></x-side-panel></x-surface-manager></div>', {
    attributes: { 'manager-id': 'docs.demo.manager', layout: 'workbench' },
    children: [
      { tag: 'x-surface-window', attributes: { slot: 'windows', 'surface-id': 'docs.manager.window', label: 'Window', open: true, 'initial-width': '16rem', 'initial-height': '9rem' }, children: [{ tag: 'p', children: ['Managed Window'] }] },
      { tag: 'x-side-panel', attributes: { slot: 'panels', 'surface-id': 'docs.manager.panel', label: 'Panel', open: true, mode: 'docked', placement: 'right' }, children: [{ tag: 'p', children: ['Managed Panel'] }] }
    ]
  });

  return demos;
}

function resolveDocsToastApi() {
  const xtendToast = window.XTend && window.XTend.toast;
  if (xtendToast && typeof xtendToast.show === 'function') return xtendToast;
  if (window.XToast && typeof window.XToast.show === 'function') return window.XToast;
  return null;
}

async function waitForDocsToastApi() {
  let toastApi = resolveDocsToastApi();
  if (toastApi) return toastApi;
  if (window.__XTendLoaderBootPromise) await Promise.resolve(window.__XTendLoaderBootPromise).catch(() => null);
  toastApi = resolveDocsToastApi();
  if (toastApi) return toastApi;
  return new Promise((resolve) => {
    const dispose = bindDocsLifecycle(window, 'xtend-api-ready', () => {
      dispose();
      resolve(resolveDocsToastApi());
    }, { once: true });
  });
}

window.xtendShowToast = async function(message, type = 'info', duration = 3000) {
  const toastApi = await waitForDocsToastApi();
  if (toastApi) return toastApi.show(message, type, duration);
  window.dispatchEvent(new CustomEvent('xtend-docs-toast-dropped', {
    detail: { schema: 'xtend.docs.toast-bridge.v1', reason: 'xtend-toast-api-unavailable' }
  }));
  return null;
};

function getDocsRmtDocument() {
  return window.xtendDocsRmtDocument && typeof window.xtendDocsRmtDocument === 'object'
    ? window.xtendDocsRmtDocument
    : {};
}

function getDocsSsrPrehydration() {
  return window.xtendDocsSsrPrehydration && typeof window.xtendDocsSsrPrehydration === 'object'
    ? window.xtendDocsSsrPrehydration
    : null;
}

function getAdoptedDocsContentPayload(root, shell, slug, locale, rmtMeta = {}) {
  const prehydration = getDocsSsrPrehydration();
  const proof = prehydration && prehydration.schema === 'xtend.docs.php-ssr-prehydration.v2'
    ? prehydration.document
    : null;
  if (
    !proof
    || proof.htmlAlreadyInDom !== true
    || !root
    || !shell
    || !shell.mdContent
    || root.getAttribute('data-docs-ssr-proof-consumed') === 'true'
  ) return null;
  const normalizedLocale = normalizeDocsLocale(locale);
  const hostHash = root.getAttribute('data-xrouter-content-sha256') || '';
  const shellHash = shell.section.getAttribute('data-rmt-content-sha256') || '';
  const contentHash = shell.mdContent.getAttribute('data-rmt-content-sha256') || '';
  const hostDomHash = root.getAttribute('data-xrouter-dom-sha256') || '';
  const contentDomHash = shell.mdContent.getAttribute('data-rmt-dom-sha256') || '';
  const domHashBasis = root.getAttribute('data-xrouter-dom-hash-basis') || '';
  const hostStructureHash = root.getAttribute('data-xrouter-dom-structure-sha256') || '';
  const contentStructureHash = shell.mdContent.getAttribute('data-rmt-dom-structure-sha256') || '';
  const structureHashBasis = root.getAttribute('data-xrouter-dom-structure-hash-basis') || '';
  const matches = proof.slug === slug
    && normalizeDocsLocale(proof.locale) === normalizedLocale
    && root.getAttribute('data-docs-route-slug') === slug
    && normalizeDocsLocale(root.getAttribute('data-docs-route-locale')) === normalizedLocale
    && proof.sha256
    && proof.sha256 === hostHash
    && hostHash === shellHash
    && shellHash === contentHash
    && proof.domSha256
    && proof.domSha256 === hostDomHash
    && hostDomHash === contentDomHash
    && proof.domHashBasis === 'normalized-text-content.v1'
    && domHashBasis === proof.domHashBasis
    && shell.mdContent.getAttribute('data-rmt-dom-hash-basis') === domHashBasis
    && proof.domStructureSha256
    && proof.domStructureSha256 === hostStructureHash
    && hostStructureHash === contentStructureHash
    && proof.domStructureHashBasis === 'sensitive-element-sequence-attributes.v1'
    && structureHashBasis === proof.domStructureHashBasis
    && shell.mdContent.getAttribute('data-rmt-dom-structure-hash-basis') === structureHashBasis
    && shell.mdContent.getAttribute('data-rmt-sanitized') === 'true'
    && shell.mdContent.getAttribute('data-rmt-sanitizer') === 'xtend.security.trusted-dom-sanitizer.v1'
    && shell.mdContent.getAttribute('data-rmt-trust-boundary') === proof.trustBoundary;
  if (!matches) return null;
  root.setAttribute('data-docs-ssr-proof-consumed', 'true');
  return {
    ok: true,
    slug,
    locale: normalizedLocale,
    requestedLocale: normalizedLocale,
    resolvedLocale: normalizedLocale,
    fallbackLocale: getDocsI18nConfig().fallbackLocale,
    translationAvailable: true,
    html: null,
    meta: rmtMeta,
    source: 'ssr-adopted',
    cacheHit: true,
    contentProof: proof,
    skeletonLoader: 'xtend.loader.skeleton-loader.v1'
  };
}

function invalidateDocsSsrContentProof(root, shell, reason = 'csr-content') {
  if (!root || !shell || !shell.mdContent) return;
  [
    'data-xrouter-prerendered-route',
    'data-xrouter-route-path',
    'data-xrouter-route-id',
    'data-xrouter-route-component',
    'data-xrouter-route-locale',
    'data-xrouter-content-sha256',
    'data-xrouter-content-bytes',
    'data-xrouter-dom-sha256',
    'data-xrouter-dom-hash-basis',
    'data-xrouter-dom-structure-sha256',
    'data-xrouter-dom-structure-hash-basis',
    'data-xrouter-trust-boundary',
    'data-xrouter-sanitizer',
    'data-xrouter-sanitized'
  ].forEach((name) => root.removeAttribute(name));
  shell.section.removeAttribute('data-rmt-content-sha256');
  [
    'data-rmt-content-sha256',
    'data-rmt-content-bytes',
    'data-rmt-dom-sha256',
    'data-rmt-dom-hash-basis',
    'data-rmt-dom-structure-sha256',
    'data-rmt-dom-structure-hash-basis'
  ].forEach((name) => shell.mdContent.removeAttribute(name));
  root.setAttribute('data-docs-ssr-proof-consumed', 'true');
  root.setAttribute('data-docs-ssr-proof-invalidated', reason);
}

function findPrehydratedDocsShell(root, slug) {
  if (!root || typeof root.querySelector !== 'function') return null;
  const selectors = [
    '[data-rmt-shell-prehydrated="true"][data-rmt-shell="docs.app.shell"]',
    '[data-rmt-shell-prehydrated="true"].docs-app-shell',
    '[data-rmt-hydration-mode="server_prerender_hydrate"][data-rmt-shell="docs.app.shell"]'
  ];
  const shell = root.querySelector(selectors.join(','));
  if (!shell) return null;
  if (slug) shell.setAttribute('data-docs-route-slug', slug);
  return shell;
}

function adoptPrehydratedDocsShell(shell, rmtMeta = {}) {
  if (!shell || typeof shell.querySelector !== 'function') return null;
  shell.classList.add('docs-app-shell');
  shell.setAttribute('data-rmt-ssr-reused', 'true');
  shell.setAttribute('data-rmt-shell-prehydrated', 'true');
  shell.setAttribute('data-rmt-hydration-mode', 'server_prerender_hydrate');
  const layout = shell.querySelector('[data-rmt-layout="main-sidebar"], .docs-shell-layout');
  const article = shell.querySelector('[data-rmt-slot="article"], .docs-article-surface');
  const mdContent = shell.querySelector('[data-rmt-slot="content"], #md-content') || document.createElement('div');
  const download = shell.querySelector('[data-rmt-action="docs.download.markdown"], #download-link') || document.createElement('x-button');
  const sidebar = shell.querySelector('[data-rmt-slot="sidebar"], #docs-page-sidebar');
  const relatedSlot = shell.querySelector('[data-rmt-slot="related"], #docs-related-links');
  const demoSlot = shell.querySelector('[data-rmt-slot="component-demo"], #docs-component-demo');
  const richSlot = shell.querySelector('[data-rmt-slot="rich-content"], #docs-rich-content');
  const diagnosticsSlot = shell.querySelector('[data-rmt-slot="diagnostics"], #docs-rmt-diagnostics');
  if (!layout || !article || !sidebar || !relatedSlot || !demoSlot) return null;
  ensureDocsRelatedSidebarScaffold(relatedSlot);
  if (!mdContent.id) mdContent.id = 'md-content';
  if (!download.id) download.id = 'download-link';
  configureDocsIconButton(download, {
    icon: 'download',
    pack: 'core',
    label: 'Download als Markdown'
  });
  return {
    section: shell,
    layout,
    article,
    mdContent,
    sidebar,
    relatedSlot,
    demoSlot,
    download,
    richSlot,
    diagnosticsSlot,
    shellTemplate: getRmtTemplate(rmtMeta.shellTemplate || DOCS_RMT_DEFAULT_SHELL_TEMPLATE),
    prehydrated: true
  };
}

function indexRmtRecords(records) {
  return new Map((Array.isArray(records) ? records : [])
    .filter((record) => record && typeof record === 'object')
    .map((record) => [record.id || record.qualifiedId || record.templateId, record]));
}

function findRmtRecord(records, id) {
  if (!id) return null;
  const byId = indexRmtRecords(records);
  if (byId.has(id)) return byId.get(id);
  return (Array.isArray(records) ? records : []).find((record) => (
    record
    && typeof record === 'object'
    && (record.id === id || record.qualifiedId === id || record.templateId === id)
  )) || null;
}

function getRmtTemplate(templateId) {
  const documentRecord = getDocsRmtDocument();
  return findRmtRecord(documentRecord.templates, templateId);
}

function getRmtSchedule(scheduleId) {
  const documentRecord = getDocsRmtDocument();
  return findRmtRecord(documentRecord.schedules, scheduleId);
}

function getDocsRmtProductionHardening() {
  if (window.xtendDocsRmtProductionHardening && typeof window.xtendDocsRmtProductionHardening === 'object') {
    return window.xtendDocsRmtProductionHardening;
  }
  const documentRecord = getDocsRmtDocument();
  const metadata = documentRecord.manifest && documentRecord.manifest.metadata;
  return metadata && metadata.productionHardening && typeof metadata.productionHardening === 'object'
    ? metadata.productionHardening
    : {};
}

function getTemplateDescriptorNodes(template) {
  if (!template || typeof template !== 'object') return [];
  if (Array.isArray(template.nodes)) return template.nodes;
  const descriptor = template.metadata && template.metadata.descriptor;
  if (descriptor && Array.isArray(descriptor.nodes)) return descriptor.nodes;
  return [];
}

function renderRmtDomTemplate(templateId, model = {}) {
  const template = getRmtTemplate(templateId);
  const fragment = document.createDocumentFragment();
  const nodes = getTemplateDescriptorNodes(template);
  nodes.forEach((node) => fragment.appendChild(docsRmtDescriptorRenderer.renderNode(node, { model })));
  return { template, fragment, rendered: nodes.length > 0 };
}

function getDocsPageMeta(slug, locale = getCurrentDocsLocale()) {
  const localized = getLocalizedDocsMap('xtendDocsLocalizedPagesMeta', locale);
  if (localized && localized[slug]) return localized[slug];
  return window.xtendDocsPagesMeta && window.xtendDocsPagesMeta[slug]
    ? window.xtendDocsPagesMeta[slug]
    : null;
}

function createDocsSidebarHeading(iconName, label, options = {}) {
  const heading = document.createElement('h2');
  heading.className = 'docs-sidebar-heading';
  const icon = document.createElement('x-icon');
  icon.setAttribute('name', iconName || 'link');
  icon.setAttribute('pack', 'lucide');
  icon.setAttribute('decorative', '');
  icon.setAttribute('size', '1rem');
  const text = document.createElement('span');
  if (options.demoTitle) text.setAttribute('data-demo-title', '');
  text.textContent = label;
  heading.appendChild(icon);
  heading.appendChild(text);
  return heading;
}

function ensureDocsRelatedSidebarScaffold(relatedSlot) {
  if (!relatedSlot || typeof relatedSlot.querySelector !== 'function') return null;
  let heading = relatedSlot.querySelector('.docs-sidebar-heading');
  if (!heading) {
    heading = createDocsSidebarHeading('link', 'Read Further');
    relatedSlot.insertBefore(heading, relatedSlot.firstChild);
  }
  let list = relatedSlot.querySelector('[data-rmt-slot="related-links"], .docs-related-list');
  if (!list) {
    const directLinks = Array.from(relatedSlot.children).filter((child) => child.matches('.docs-related-link'));
    list = document.createElement('div');
    list.className = 'docs-related-list';
    list.setAttribute('data-rmt-slot', 'related-links');
    directLinks.forEach((link) => list.appendChild(link));
    relatedSlot.appendChild(list);
  } else {
    list.classList.add('docs-related-list');
    list.setAttribute('data-rmt-slot', 'related-links');
  }
  return list;
}

function ensureDocsShellScopedStyles(root) {
  if (!root || !root.host || typeof root.getElementById !== 'function' || typeof root.appendChild !== 'function') {
    return;
  }
  if (root.getElementById(DOCS_SHELL_SHADOW_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = DOCS_SHELL_SHADOW_STYLE_ID;
  style.setAttribute('data-rmt-style-scope', 'docs.shell');
  style.textContent = DOCS_SHELL_SCOPED_CSS;
  root.appendChild(style);
}

function createFallbackDocsShell() {
  const section = document.createElement('section');
  section.className = 'docs-app-shell';
  section.setAttribute('aria-label', 'XTend Developer Center Content Shell');
  section.setAttribute('data-rmt-shell', DOCS_RMT_DEFAULT_SHELL_TEMPLATE);
  section.setAttribute('data-rmt-shell-mode', 'shell-first');
  section.setAttribute('data-xtend-layout-reserve', 'shell route');
  section.setAttribute('data-xtend-cls-anchor', 'docs.page.shell');

  const layout = document.createElement('div');
  layout.className = 'docs-shell-layout';
  layout.setAttribute('data-rmt-layout', 'main-sidebar');
  layout.setAttribute('data-rmt-component', 'docs.shellLayout');
  layout.setAttribute('data-xtend-layout-reserve', 'shell route');

  const article = document.createElement('article');
  article.className = 'docs-article-surface';
  article.setAttribute('data-rmt-slot', 'article');
  article.setAttribute('data-rmt-component', 'docs.article');
  article.setAttribute('data-xtend-layout-reserve', 'route content');
  article.setAttribute('data-xtend-cls-anchor', 'docs.article');

  const toolbar = document.createElement('div');
  toolbar.className = 'docs-shell-toolbar';
  toolbar.setAttribute('data-rmt-slot', 'actions');

  const download = document.createElement('x-button');
  download.className = 'download-link';
  download.id = 'download-link';
  download.setAttribute('type', 'button');
  download.setAttribute('data-rmt-action', 'docs.download.markdown');
  configureDocsIconButton(download, {
    icon: 'download',
    pack: 'core',
    label: 'Download als Markdown'
  });

  const mdContent = document.createElement('div');
  mdContent.id = 'md-content';
  mdContent.setAttribute('data-rmt-slot', 'content');
  mdContent.setAttribute('data-rmt-extension-slot', 'docs.slot.content');
  mdContent.setAttribute('data-rmt-content-kind', 'parsedownHtml');
  mdContent.setAttribute('data-rmt-trust-boundary', DOCS_RMT_TRUST_BOUNDARY);
  mdContent.setAttribute('data-xtend-layout-reserve', 'content');

  const sidebar = document.createElement('aside');
  sidebar.id = 'docs-page-sidebar';
  sidebar.className = 'docs-page-sidebar';
  sidebar.setAttribute('data-rmt-slot', 'sidebar');
  sidebar.setAttribute('data-rmt-extension-slot', 'docs.slot.sidebar');
  sidebar.setAttribute('data-rmt-component', 'docs.sidebar');
  sidebar.setAttribute('aria-label', 'Seitliche Dokumentationswerkzeuge');

  const relatedSlot = document.createElement('section');
  relatedSlot.id = 'docs-related-links';
  relatedSlot.className = 'docs-sidebar-section docs-related-section';
  relatedSlot.setAttribute('data-rmt-slot', 'related');
  relatedSlot.setAttribute('data-rmt-component', 'docs.relatedLinks');
  relatedSlot.setAttribute('data-rmt-schedule', 'docs.related.prepare');
  ensureDocsRelatedSidebarScaffold(relatedSlot);

  const demoSlot = document.createElement('section');
  demoSlot.id = 'docs-component-demo';
  demoSlot.className = 'docs-sidebar-section docs-component-demo';
  demoSlot.hidden = true;
  demoSlot.setAttribute('data-rmt-slot', 'component-demo');
  demoSlot.setAttribute('data-rmt-component', 'docs.componentDemo');
  demoSlot.setAttribute('data-rmt-schedule', 'docs.demo.prepare');
  demoSlot.appendChild(createDocsSidebarHeading('play', 'Hands-on Demo', { demoTitle: true }));
  const demoCopy = document.createElement('p');
  demoCopy.className = 'docs-sidebar-copy';
  demoCopy.setAttribute('data-demo-description', '');
  demoCopy.textContent = 'Direkt testen, danach HTML und RMT uebernehmen.';
  const demoPreview = document.createElement('div');
  demoPreview.className = 'docs-demo-preview';
  demoPreview.setAttribute('data-demo-preview', '');
  const demoCode = document.createElement('div');
  demoCode.className = 'docs-demo-code-grid';
  demoCode.setAttribute('data-demo-code', '');
  demoSlot.appendChild(demoCopy);
  demoSlot.appendChild(demoPreview);
  demoSlot.appendChild(demoCode);

  const richSlot = document.createElement('aside');
  richSlot.id = 'docs-rich-content';
  richSlot.hidden = true;
  richSlot.setAttribute('data-rmt-slot', 'rich-content');
  richSlot.setAttribute('data-rmt-extension-slot', 'docs.slot.rich-content');
  richSlot.setAttribute('data-rmt-content-kinds', 'richHtml,xplayerTutorial');
  richSlot.setAttribute('data-rmt-schedule', 'docs.rich-content.prepare');
  richSlot.setAttribute('data-rmt-media-schedule', 'docs.media.lazy');
  richSlot.setAttribute('data-rmt-production-hardening', DOCS_RMT_PRODUCTION_HARDENING_SCHEMA);

  const diagnosticsSlot = document.createElement('div');
  diagnosticsSlot.id = 'docs-rmt-diagnostics';
  diagnosticsSlot.hidden = true;
  diagnosticsSlot.setAttribute('data-rmt-slot', 'diagnostics');
  diagnosticsSlot.setAttribute('data-rmt-extension-slot', 'docs.slot.diagnostics');
  diagnosticsSlot.setAttribute('data-rmt-schedule', DOCS_RMT_DEFAULT_DIAGNOSTICS_SCHEDULE);
  diagnosticsSlot.setAttribute('data-rmt-content-kind', 'diagnostics');
  diagnosticsSlot.setAttribute('data-rmt-production-hardening', DOCS_RMT_PRODUCTION_HARDENING_SCHEMA);

  toolbar.appendChild(download);
  article.appendChild(toolbar);
  article.appendChild(mdContent);
  sidebar.appendChild(relatedSlot);
  sidebar.appendChild(demoSlot);
  sidebar.appendChild(richSlot);
  sidebar.appendChild(diagnosticsSlot);
  layout.appendChild(article);
  layout.appendChild(sidebar);
  section.appendChild(layout);

  return {
    section,
    layout,
    article,
    mdContent,
    sidebar,
    relatedSlot,
    demoSlot,
    download,
    richSlot,
    diagnosticsSlot,
    shellTemplate: null
  };
}

function createRmtDocsShell(slug, rmtMeta = {}) {
  const shellTemplateId = rmtMeta.shellTemplate || (window.xtendDocsRmtPilot && window.xtendDocsRmtPilot.shellTemplate) || DOCS_RMT_DEFAULT_SHELL_TEMPLATE;
  const shellSchedule = rmtMeta.schedules && rmtMeta.schedules.shell ? rmtMeta.schedules.shell : 'docs.shell.render';
  const rendered = renderRmtDomTemplate(shellTemplateId, {
    slug,
    source: rmtMeta.source || '',
    contentKind: rmtMeta.contentKind || 'parsedownHtml',
    shellSchedule
  });

  if (!rendered.rendered) {
    const fallback = createFallbackDocsShell();
    fallback.shellTemplate = rendered.template;
    return fallback;
  }

  const section = rendered.fragment.querySelector
    ? rendered.fragment.querySelector('[data-rmt-shell], .docs-app-shell')
    : null;
  const shell = section || rendered.fragment.firstElementChild || createFallbackDocsShell().section;
  shell.classList.add('docs-app-shell');
  const layout = shell.querySelector('[data-rmt-layout="main-sidebar"], .docs-shell-layout');
  const article = shell.querySelector('[data-rmt-slot="article"], .docs-article-surface');
  const mdContent = shell.querySelector('[data-rmt-slot="content"], #md-content') || document.createElement('div');
  const download = shell.querySelector('[data-rmt-action="docs.download.markdown"], #download-link') || document.createElement('x-button');
  const sidebar = shell.querySelector('[data-rmt-slot="sidebar"], #docs-page-sidebar');
  const relatedSlot = shell.querySelector('[data-rmt-slot="related"], #docs-related-links');
  const demoSlot = shell.querySelector('[data-rmt-slot="component-demo"], #docs-component-demo');
  const richSlot = shell.querySelector('[data-rmt-slot="rich-content"], #docs-rich-content');
  const diagnosticsSlot = shell.querySelector('[data-rmt-slot="diagnostics"], #docs-rmt-diagnostics');

  if (!layout || !article || !sidebar || !relatedSlot || !demoSlot) {
    const fallback = createFallbackDocsShell();
    fallback.shellTemplate = rendered.template;
    fallback.section.setAttribute('data-rmt-shell-fallback', 'missing-sidebar-slots');
    return fallback;
  }

  ensureDocsRelatedSidebarScaffold(relatedSlot);
  if (!mdContent.id) mdContent.id = 'md-content';
  if (!download.id) download.id = 'download-link';
  configureDocsIconButton(download, {
    icon: 'download',
    pack: 'core',
    label: 'Download als Markdown'
  });
  if (!download.parentNode) shell.insertBefore(download, shell.firstChild);
  if (!mdContent.parentNode) shell.appendChild(mdContent);

  return {
    section: shell,
    layout,
    article,
    mdContent,
    sidebar,
    relatedSlot,
    demoSlot,
    download,
    richSlot,
    diagnosticsSlot,
    shellTemplate: rendered.template
  };
}

function configureDocsIconButton(button, options = {}) {
  if (!button) return;
  const label = options.label || button.getAttribute('aria-label') || 'Aktion ausfuehren';
  const iconName = options.icon || 'download';
  const pack = options.pack || 'core';
  button.classList.add('docs-icon-button');
  button.setAttribute('type', 'button');
  button.setAttribute('variant', button.getAttribute('variant') || 'secondary');
  button.setAttribute('aria-label', label);
  button.setAttribute('title', label);

  const existingIcon = button.querySelector('x-icon');
  const existingLabel = button.querySelector('.docs-visually-hidden');
  if (existingIcon) {
    existingIcon.setAttribute('name', iconName);
    existingIcon.setAttribute('pack', pack);
    existingIcon.setAttribute('decorative', '');
    if (!existingIcon.getAttribute('size')) existingIcon.setAttribute('size', '1.1rem');
  }
  if (existingLabel) {
    existingLabel.textContent = label;
  }
  if (existingIcon && existingLabel) return;

  button.textContent = '';
  const icon = document.createElement('x-icon');
  icon.setAttribute('name', iconName);
  icon.setAttribute('pack', pack);
  icon.setAttribute('decorative', '');
  icon.setAttribute('size', '1.1rem');
  const hiddenLabel = document.createElement('span');
  hiddenLabel.className = 'docs-visually-hidden';
  hiddenLabel.textContent = label;
  button.appendChild(icon);
  button.appendChild(hiddenLabel);
}

function setDocsButtonBusy(button, busy) {
  if (!button) return;
  if (busy) {
    button.setAttribute('disabled', '');
    button.setAttribute('aria-busy', 'true');
  } else {
    button.removeAttribute('disabled');
    button.removeAttribute('aria-busy');
  }
}

function bindDocsButtonAction(button, handler) {
  if (!button || typeof handler !== 'function') return;
  const activationEvent = button.tagName === 'X-BUTTON' ? 'button-interaction' : 'click';
  return bindDocsLifecycle(button, activationEvent, handler);
}

function applyRmtPageMetadata(section, mdContent, richSlot, diagnosticsSlot, rmtMeta = {}, sidebar = null, relatedSlot = null, demoSlot = null) {
  const schedules = rmtMeta.schedules || {};
  const endpoints = rmtMeta.endpoints || {};
  const shellSchedule = schedules.shell || 'docs.shell.render';
  const mediaSchedule = schedules.media || 'docs.media.lazy';
  const richSchedule = schedules.rich || 'docs.rich-content.prepare';
  const diagnosticsSchedule = schedules.diagnostics || DOCS_RMT_DEFAULT_DIAGNOSTICS_SCHEDULE;
  const hardening = getDocsRmtProductionHardening();

  section.style.background = 'var(--section-bg, #fff)';
  section.style.color = 'var(--text-color, #222)';
  section.setAttribute('data-rmt-component', rmtMeta.component || 'docs.page');
  section.setAttribute('data-rmt-shell', rmtMeta.shellTemplate || DOCS_RMT_DEFAULT_SHELL_TEMPLATE);
  section.setAttribute('data-rmt-shell-first', 'true');
  section.setAttribute('data-rmt-production-hardening', hardening.schema || DOCS_RMT_PRODUCTION_HARDENING_SCHEMA);
  section.setAttribute('data-rmt-shell-schedule', shellSchedule);
  section.setAttribute('data-rmt-route-schedule', schedules.route || 'docs.route.render');
  section.setAttribute('data-rmt-hydrate-schedule', schedules.hydrate || 'docs.page.hydrate');
  section.setAttribute('data-rmt-route-title', rmtMeta.title || '');
  section.setAttribute('data-rmt-document-title', rmtMeta.documentTitle || '');
  section.setAttribute('data-rmt-title-template', rmtMeta.titleTemplate || '{{title}} | XTend Dokumentation');
  section.setAttribute('data-xtend-layout-reserve', section.getAttribute('data-xtend-layout-reserve') || 'shell route');
  section.setAttribute('data-xtend-cls-anchor', section.getAttribute('data-xtend-cls-anchor') || 'docs.page.shell');

  if (sidebar) {
    sidebar.setAttribute('data-rmt-slot', 'sidebar');
    sidebar.setAttribute('data-rmt-extension-slot', 'docs.slot.sidebar');
    sidebar.setAttribute('data-rmt-component', 'docs.sidebar');
    sidebar.setAttribute('data-rmt-shell-schedule', shellSchedule);
  }

  if (relatedSlot) {
    relatedSlot.setAttribute('data-rmt-slot', 'related');
    relatedSlot.setAttribute('data-rmt-extension-slot', 'docs.slot.related');
    relatedSlot.setAttribute('data-rmt-component', 'docs.relatedLinks');
    relatedSlot.setAttribute('data-rmt-schedule', 'docs.related.prepare');
  }

  if (demoSlot) {
    demoSlot.setAttribute('data-rmt-slot', 'component-demo');
    demoSlot.setAttribute('data-rmt-extension-slot', 'docs.slot.component-demo');
    demoSlot.setAttribute('data-rmt-component', 'docs.componentDemo');
    demoSlot.setAttribute('data-rmt-schedule', 'docs.demo.prepare');
  }

  mdContent.setAttribute('data-rmt-slot', mdContent.getAttribute('data-rmt-slot') || 'content');
  mdContent.setAttribute('data-rmt-extension-slot', 'docs.slot.content');
  mdContent.setAttribute('data-rmt-template', rmtMeta.template || '');
  mdContent.setAttribute('data-rmt-template-adapter', rmtMeta.adapter || 'docs.parsedown');
  mdContent.setAttribute('data-rmt-parse-schedule', schedules.parse || 'docs.markdown.parse');
  mdContent.setAttribute('data-rmt-parse-endpoint', endpoints.parse || DOCS_RMT_PARSEDOWN_ENDPOINT);
  mdContent.setAttribute('data-rmt-markup-class', rmtMeta.markupClass || 'parsedownHtml');
  mdContent.setAttribute('data-rmt-content-kind', rmtMeta.contentKind || 'parsedownHtml');
  mdContent.setAttribute('data-rmt-trust-boundary', rmtMeta.trustBoundary || DOCS_RMT_TRUST_BOUNDARY);
  mdContent.setAttribute('data-xtend-layout-reserve', mdContent.getAttribute('data-xtend-layout-reserve') || 'content');

  if (richSlot) {
    richSlot.setAttribute('data-rmt-extension-slot', 'docs.slot.rich-content');
    richSlot.setAttribute('data-rmt-schedule', richSchedule);
    richSlot.setAttribute('data-rmt-media-schedule', mediaSchedule);
    richSlot.setAttribute('data-rmt-content-kinds', 'richHtml,xplayerTutorial');
    richSlot.setAttribute('data-rmt-trust-boundary', rmtMeta.trustBoundary || DOCS_RMT_TRUST_BOUNDARY);
    richSlot.setAttribute('data-rmt-production-hardening', hardening.schema || DOCS_RMT_PRODUCTION_HARDENING_SCHEMA);
  }

  if (diagnosticsSlot) {
    diagnosticsSlot.setAttribute('data-rmt-slot', 'diagnostics');
    diagnosticsSlot.setAttribute('data-rmt-extension-slot', 'docs.slot.diagnostics');
    diagnosticsSlot.setAttribute('data-rmt-schedule', diagnosticsSchedule);
    diagnosticsSlot.setAttribute('data-rmt-content-kind', 'diagnostics');
    diagnosticsSlot.setAttribute('data-rmt-production-hardening', hardening.schema || DOCS_RMT_PRODUCTION_HARDENING_SCHEMA);
  }
}

function createDocsRmtProductionRenderSnapshot(slug, rmtMeta, shell) {
  const hardening = getDocsRmtProductionHardening();
  const schedules = rmtMeta.schedules || {};
  const extensionSlots = Array.isArray(hardening.extensionSlots)
    ? hardening.extensionSlots.slice()
    : DOCS_RMT_EXTENSION_SLOTS.slice();
  return {
    schema: hardening.renderSchema || DOCS_RMT_PRODUCTION_HARDENING_SCHEMA,
    slug,
    shellFirst: true,
    parsedownOrchestrated: true,
    parsedownEmbeddedInRmtKernel: false,
    extensionSlots,
    contentSlot: rmtMeta.contentSlot || 'content',
    sidebarSlotAvailable: Boolean(shell.sidebar),
    relatedSlotAvailable: Boolean(shell.relatedSlot),
    componentDemoSlotAvailable: Boolean(shell.demoSlot),
    richSlotAvailable: Boolean(shell.richSlot),
    diagnosticsSlotAvailable: Boolean(shell.diagnosticsSlot),
    parseSchedule: schedules.parse || 'docs.markdown.parse',
    richSchedule: schedules.rich || 'docs.rich-content.prepare',
    mediaSchedule: schedules.media || 'docs.media.lazy',
    diagnosticsSchedule: schedules.diagnostics || DOCS_RMT_DEFAULT_DIAGNOSTICS_SCHEDULE,
    trustBoundary: rmtMeta.trustBoundary || DOCS_RMT_TRUST_BOUNDARY,
    trustedDomProofSchema: DOCS_RMT_TRUSTED_DOM_PROOF_SCHEMA,
    trustedDomSanitizer: DOCS_RMT_TRUSTED_DOM_SANITIZER,
    sanitizerRequired: true,
    kernelBoundary: hardening.kernelBoundary || 'Parsedown, PHP execution and Sanitizing stay in the Docs host adapter.',
    nextWorkpackage: hardening.nextWorkpackage || 'WP-E13-13'
  };
}

function wireDownloadButton(download, slug) {
  if (!download) return;
  download.__xtendDocsDownloadSlug = slug;
  if (download.__xtendDocsDownloadBound) return;
  download.__xtendDocsDownloadBound = true;
  configureDocsIconButton(download, {
    icon: 'download',
    pack: 'core',
    label: getCurrentDocsLocale() === 'en' ? 'Download as Markdown' : 'Download als Markdown'
  });
  download.setAttribute('type', 'button');
  bindDocsButtonAction(download, async function(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (download.hasAttribute('disabled')) return;
    const activeSlug = download.__xtendDocsDownloadSlug || slug;
    const locale = getCurrentDocsLocale();
    setDocsButtonBusy(download, true);
    try {
      const resp = await fetch(`?download=${encodeURIComponent(activeSlug)}&locale=${encodeURIComponent(locale)}`);
      if (!resp.ok) throw new Error('Download fehlgeschlagen');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${activeSlug}.md`;
      document.body.appendChild(a);
      a.click();
      scheduleDocsAfterPaint(() => {
        a.remove();
        URL.revokeObjectURL(url);
      });
      await window.xtendShowToast(locale === 'en' ? 'Download complete.' : 'Download erfolgreich!', 'success', 3000);
    } catch (err) {
      await window.xtendShowToast(getCurrentDocsLocale() === 'en' ? 'Download failed.' : 'Download fehlgeschlagen!', 'error', 3000);
    } finally {
      setDocsButtonBusy(download, false);
    }
  });
}

function ensureMainBackgroundBinding() {
  document.documentElement.setAttribute('data-docs-theme-owned', 'x-theme');
}

function getDocsPageSlugs() {
  const menuSlugs = Array.isArray(window.xtendMenuConfig)
    ? window.xtendMenuConfig.map((entry) => entry && entry.slug).filter(Boolean)
    : [];
  if (menuSlugs.length) return menuSlugs;
  const localizedMeta = getLocalizedDocsMap('xtendDocsLocalizedPagesMeta', getCurrentDocsLocale());
  const metaSlugs = Object.keys(localizedMeta || {});
  if (metaSlugs.length) return metaSlugs;
  const localizedPages = getExactLocalizedDocsMap('xtendDocsLocalizedPages', getCurrentDocsLocale());
  const pageSlugs = Object.keys(localizedPages || {});
  if (pageSlugs.length) return pageSlugs;
  const legacyMetaSlugs = Object.keys(window.xtendDocsPagesMeta || {});
  if (legacyMetaSlugs.length) return legacyMetaSlugs;
  return Object.keys(window.xtendDocsPages || {});
}

function getDocsPageEndpoint() {
  const endpoint = window.xtendDocsPageEndpoint || '';
  return typeof endpoint === 'string' && endpoint ? endpoint : '';
}

function buildDocsPagePayloadUrl(slug, locale = getCurrentDocsLocale()) {
  const endpoint = getDocsPageEndpoint();
  if (!endpoint) return '';
  if (endpoint.includes('{slug}') || endpoint.includes('{locale}')) {
    return endpoint
      .replace('{slug}', encodeURIComponent(slug))
      .replace('{locale}', encodeURIComponent(normalizeDocsLocale(locale)));
  }
  const separator = endpoint.includes('?') ? '&' : '?';
  return endpoint + encodeURIComponent(slug) + separator + 'locale=' + encodeURIComponent(normalizeDocsLocale(locale));
}

function rememberDocsPagePayload(slug, payload = {}, locale = getCurrentDocsLocale()) {
  const normalizedLocale = normalizeDocsLocale(payload.resolvedLocale || payload.locale || locale);
  if (!window.xtendDocsPages || typeof window.xtendDocsPages !== 'object') {
    window.xtendDocsPages = {};
  }
  if (!window.xtendDocsLocalizedPages || typeof window.xtendDocsLocalizedPages !== 'object') {
    window.xtendDocsLocalizedPages = {};
  }
  if (!window.xtendDocsLocalizedPages[normalizedLocale]) {
    window.xtendDocsLocalizedPages[normalizedLocale] = {};
  }
  if (typeof payload.html === 'string') {
    window.xtendDocsPages[slug] = payload.html;
    window.xtendDocsLocalizedPages[normalizedLocale][slug] = payload.html;
  }
  if (payload.meta && typeof payload.meta === 'object') {
    window.xtendDocsPagesMeta = {
      ...(window.xtendDocsPagesMeta || {}),
      [slug]: {
        ...(window.xtendDocsPagesMeta && window.xtendDocsPagesMeta[slug] || {}),
        ...payload.meta
      }
    };
    window.xtendDocsLocalizedPagesMeta = {
      ...(window.xtendDocsLocalizedPagesMeta || {}),
      [normalizedLocale]: {
        ...((window.xtendDocsLocalizedPagesMeta && window.xtendDocsLocalizedPagesMeta[normalizedLocale]) || {}),
        [slug]: {
          ...(((window.xtendDocsLocalizedPagesMeta && window.xtendDocsLocalizedPagesMeta[normalizedLocale]) || {})[slug] || {}),
          ...payload.meta
        }
      }
    };
  }
  return payload;
}

function getDocsPageFallbackMarkup(locale, reason = 'not-found') {
  const english = normalizeDocsLocale(locale) === 'en';
  if (reason === 'load-error') {
    return english
      ? '<em>The page could not be loaded.</em>'
      : '<em>Seite konnte nicht geladen werden.</em>';
  }
  return english
    ? '<em>Page not found</em>'
    : '<em>Seite nicht gefunden</em>';
}

function loadDocsParsedownContent(slug, rmtMeta = {}, locale = getCurrentDocsLocale()) {
  const normalizedLocale = normalizeDocsLocale(locale);
  const localizedPages = getExactLocalizedDocsMap('xtendDocsLocalizedPages', normalizedLocale);
  const inlineHtml = localizedPages && typeof localizedPages[slug] === 'string'
    ? localizedPages[slug]
    : null;
  if (inlineHtml !== null) {
    return Promise.resolve({
      schema: 'xtend.docs.parsedown-rmt-page-payload.v1',
      ok: true,
      slug,
      locale: normalizedLocale,
      requestedLocale: normalizedLocale,
      resolvedLocale: normalizedLocale,
      fallbackLocale: getDocsI18nConfig().fallbackLocale,
      translationAvailable: true,
      html: inlineHtml,
      meta: rmtMeta,
      source: 'inline',
      cacheHit: true,
      skeletonLoader: 'xtend.loader.skeleton-loader.v1'
    });
  }

  const promiseKey = normalizedLocale + ':' + slug;
  if (DOCS_ROUTE_PAYLOAD_PROMISES.has(promiseKey)) {
    return DOCS_ROUTE_PAYLOAD_PROMISES.get(promiseKey);
  }

  const url = buildDocsPagePayloadUrl(slug, normalizedLocale);
  if (!url) {
    return Promise.resolve({
      schema: 'xtend.docs.parsedown-rmt-page-payload.v1',
      ok: false,
      slug,
      locale: normalizedLocale,
      requestedLocale: normalizedLocale,
      resolvedLocale: getDocsI18nConfig().fallbackLocale,
      fallbackLocale: getDocsI18nConfig().fallbackLocale,
      translationAvailable: false,
      html: getDocsPageFallbackMarkup(normalizedLocale),
      meta: rmtMeta,
      source: 'missing-endpoint',
      cacheHit: false,
      skeletonLoader: 'xtend.loader.skeleton-loader.v1'
    });
  }

  const promise = fetch(url, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json'
    }
  })
    .then((response) => {
      if (!response.ok) throw new Error(`Docs page payload failed with HTTP ${response.status}`);
      return response.json();
    })
    .then((payload) => rememberDocsPagePayload(slug, {
      ...payload,
      cacheHit: false
    }, normalizedLocale))
    .catch((error) => ({
      schema: 'xtend.docs.parsedown-rmt-page-payload.v1',
      ok: false,
      slug,
      locale: normalizedLocale,
      requestedLocale: normalizedLocale,
      resolvedLocale: getDocsI18nConfig().fallbackLocale,
      fallbackLocale: getDocsI18nConfig().fallbackLocale,
      translationAvailable: false,
      html: getDocsPageFallbackMarkup(normalizedLocale),
      meta: rmtMeta,
      source: 'fetch-error',
      cacheHit: false,
      error: error && error.message ? error.message : String(error),
      skeletonLoader: 'xtend.loader.skeleton-loader.v1'
    }))
    .finally(() => {
      DOCS_ROUTE_PAYLOAD_PROMISES.delete(promiseKey);
    });
  DOCS_ROUTE_PAYLOAD_PROMISES.set(promiseKey, promise);
  return promise;
}

function prefetchDocsLocalePage(slug = getCurrentDocsSlug(), locale = getCurrentDocsLocale()) {
  const normalizedSlug = slug || 'readme';
  const normalizedLocale = normalizeDocsLocale(locale);
  const localizedPages = getExactLocalizedDocsMap('xtendDocsLocalizedPages', normalizedLocale);
  if (localizedPages && typeof localizedPages[normalizedSlug] === 'string') {
    return Promise.resolve({
      schema: 'xtend.docs.locale-prefetch.v1',
      slug: normalizedSlug,
      locale: normalizedLocale,
      source: 'inline',
      cacheHit: true
    });
  }
  const rmtMeta = getDocsPageMeta(normalizedSlug, normalizedLocale) || {};
  return loadDocsParsedownContent(normalizedSlug, rmtMeta, normalizedLocale).then((payload) => ({
    schema: 'xtend.docs.locale-prefetch.v1',
    slug: normalizedSlug,
    locale: normalizedLocale,
    source: payload && payload.source ? payload.source : 'unknown',
    cacheHit: payload && payload.cacheHit === true,
    translationAvailable: payload ? payload.translationAvailable !== false : false
  }));
}

function prefetchAlternateDocsLocales(slug = getCurrentDocsSlug()) {
  const config = getDocsI18nConfig();
  const current = getCurrentDocsLocale();
  config.available.forEach((locale) => {
    if (normalizeDocsLocale(locale) !== current) {
      prefetchDocsLocalePage(slug, locale).catch(() => {});
    }
  });
}

function normalizeMarkdownLinks(html) {
  return String(html || '').replace(/<a href=["']([^"'#?]+)["']>(.*?)<\/a>/g, function(match, href, text) {
    if (!href.endsWith('.md')) return match;
    let norm = href.replace(/^\.\//, '').replace(/^\.\./, '').replace(/^\./, '').replace(/\\/g, '/');
    let foundSlug = null;

    for (const s of getDocsPageSlugs()) {
      let candidate = '';
      if (norm.startsWith('components/')) {
        candidate = 'components-' + norm.slice('components/'.length).replace(/\//g, '-').replace(/\.md$/, '').toLowerCase();
      } else {
        candidate = norm.replace(/\//g, '-').replace(/\.md$/, '').toLowerCase();
      }
      if (s === candidate) {
        foundSlug = s;
        break;
      }
    }

    if (!foundSlug) {
      const base = norm.split('/').pop().replace(/\.md$/, '').toLowerCase();
      for (const s of getDocsPageSlugs()) {
        if (s.endsWith('-' + base) || s === base) {
          foundSlug = s;
          break;
        }
      }
    }

    if (!foundSlug) {
      if (norm.startsWith('components/')) {
        foundSlug = 'components-' + norm.slice('components/'.length).replace(/\//g, '-').replace(/\.md$/, '').toLowerCase();
      } else {
        foundSlug = norm.replace(/\//g, '-').replace(/\.md$/, '').toLowerCase();
      }
    }
    return `<x-link href='${getLocalizedDocsPath(foundSlug)}'>${text}</x-link>`;
  });
}

function isDocsTrustedDomUrlAllowed(value) {
  const normalized = String(value || '').trim().replace(/[\u0000-\u001F\u007F\s]+/g, '').toLowerCase();
  if (!normalized) return true;
  if (normalized.startsWith('#') || normalized.startsWith('/') || normalized.startsWith('./') || normalized.startsWith('../')) return true;
  if (normalized.startsWith('data:')) return normalized.startsWith('data:image/');
  return !(
    normalized.startsWith('javascript:')
    || normalized.startsWith('vbscript:')
    || normalized.startsWith('data:text/html')
    || normalized.startsWith('data:text/javascript')
  );
}

function decodeDocsParsedownCodeEntities(value) {
  const text = String(value || '');
  if (!/&(?:amp|lt|gt|quot|#0?39|#x0?27);/i.test(text)) return text;
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", '#039': "'", '#x27': "'", '#x027': "'" };
  return text.replace(/&(amp|lt|gt|quot|#0?39|#x0?27);/gi, (match, entity) => entities[String(entity).toLowerCase()] ?? match);
}

function normalizeDocsParsedownCodeEntities(root) {
  let normalizedCount = 0;
  Array.from(root.querySelectorAll('code')).forEach((node) => {
    const original = node.textContent || '';
    const decoded = decodeDocsParsedownCodeEntities(original);
    if (decoded === original) return;
    node.textContent = decoded;
    node.setAttribute('data-parsedown-code-normalized', 'true');
    normalizedCount += 1;
  });
  return normalizedCount;
}

function normalizeDocsCodeLanguage(value) {
  const raw = String(value || 'text').trim().toLowerCase();
  const aliases = {
    js: 'javascript',
    html: 'markup',
    xml: 'markup',
    svg: 'markup',
    md: 'markdown',
    txt: 'text',
    plaintext: 'text',
    'rmt-vnext': 'rmt',
    xtendrmt: 'rmt'
  };
  return aliases[raw] || raw || 'text';
}

function readDocsCodeLanguage(node) {
  const className = String(node.getAttribute('class') || '');
  const match = className.match(/(?:^|\s)(?:language|lang)-([A-Za-z0-9_+-]+)/);
  return normalizeDocsCodeLanguage(node.getAttribute('data-language') || (match && match[1]) || 'text');
}

function upgradeDocsParsedownCodeFences(root, options = {}) {
  const schedule = options.schedule || 'docs.syntax.highlight';
  const scope = root && root.querySelectorAll ? root : document;
  let count = 0;
  Array.from(scope.querySelectorAll('pre > code')).forEach((codeNode) => {
    const pre = codeNode.parentElement;
    if (!pre || pre.closest('x-code') || pre.hasAttribute('data-docs-code-fence-upgraded')) return;
    const language = readDocsCodeLanguage(codeNode);
    const codeElement = document.createElement('x-code');
    codeElement.className = 'docs-code-fence';
    codeElement.setAttribute('lang', language);
    codeElement.setAttribute('data-docs-code-fence-upgraded', 'true');
    codeElement.setAttribute('data-rmt-component', 'docs.codeFence');
    codeElement.setAttribute('data-rmt-schedule', schedule);
    codeElement.setAttribute('data-rmt-syntax-language', language);
    const template = document.createElement('template');
    template.setAttribute('data-x-code-mode', 'text');
    template.content.appendChild(document.createTextNode(codeNode.textContent || ''));
    codeElement.appendChild(template);
    pre.replaceWith(codeElement);
    count += 1;
  });
  return {
    schema: 'xtend.docs.xcode-fence-upgrade.v1',
    upgraded: count,
    schedule
  };
}

function sanitizeDocsTrustedDomHtml(html, options = {}) {
  const runtime = window.xtendDocsTrustedDomRuntime;
  if (!runtime || typeof runtime.sanitize !== 'function') {
    throw new Error('RMT Trusted DOM host is unavailable.');
  }
  const result = runtime.sanitize(String(html || ''), options);
  return {
    ...result,
    schema: DOCS_RMT_TRUSTED_DOM_PROOF_SCHEMA,
    sanitizer: DOCS_RMT_TRUSTED_DOM_SANITIZER,
    sanitized: true,
    boundary: options.trustBoundary || result.boundary || DOCS_RMT_TRUST_BOUNDARY,
    markupClass: options.markupClass || 'parsedownHtml',
    normalizedCodeEntityCount: 0,
    source: options.source || 'docs.parsedown'
  };
}

function prepareDocsTrustedDomHtml(slug, html, options = {}) {
  const cacheKey = createDocsRouteContentCacheKey(slug, html, {
    ...options,
    locale: options.locale || getCurrentDocsLocale()
  });
  const cached = DOCS_ROUTE_CONTENT_CACHE.get(cacheKey);
  if (cached) return cloneDocsSanitizeResult(cached, true);

  const normalizedHtml = normalizeMarkdownLinks(html);
  const result = sanitizeDocsTrustedDomHtml(normalizedHtml, options);
  result.cacheKey = cacheKey;
  result.cacheHit = false;
  rememberDocsCacheEntry(cacheKey, result);
  return cloneDocsSanitizeResult(result, false);
}

function applyDocsTrustedDomHtml(target, html, options = {}) {
  const result = prepareDocsTrustedDomHtml(options.slug || '', html, options);
  const runtime = window.xtendDocsTrustedDomRuntime;
  if (!runtime || typeof runtime.commit !== 'function') {
    throw new Error('RMT Trusted DOM host is unavailable.');
  }
  const commitResult = runtime.commit(target, result.html, {
    rootId: options.slug ? `docs-content-${options.slug}` : 'docs-parsedown-content',
    templateQualifiedId: 'docs.parsedown.content',
    source: options.source || 'docs.parsedown'
  });
  result.kernelCommit = {
    schema: commitResult.schema,
    boundary: commitResult.boundary,
    verdict: commitResult.verdict
  };
  result.normalizedCodeEntityCount = normalizeDocsParsedownCodeEntities(target);
  const codeFenceUpgrade = upgradeDocsParsedownCodeFences(target, {
    schedule: options.syntaxSchedule || 'docs.syntax.highlight'
  });
  result.codeFenceUpgrade = codeFenceUpgrade;
  result.upgradedCodeFenceCount = codeFenceUpgrade.upgraded;
  target.setAttribute('data-docs-code-enhancement', codeFenceUpgrade.upgraded > 0 ? 'csr-committed' : 'not-needed');
  if (codeFenceUpgrade.upgraded > 0) target.setAttribute('data-docs-code-enhancement-trigger', 'csr');
  else target.removeAttribute('data-docs-code-enhancement-trigger');
  target.setAttribute('data-rmt-sanitized', 'true');
  target.setAttribute('data-rmt-sanitizer', DOCS_RMT_TRUSTED_DOM_SANITIZER);
  target.setAttribute('data-rmt-trusted-dom-proof', DOCS_RMT_TRUSTED_DOM_PROOF_SCHEMA);
  target.setAttribute('data-docs-code-fence-upgraded', String(codeFenceUpgrade.upgraded));
  target.setAttribute('data-rmt-content-cache-hit', result.cacheHit ? 'true' : 'false');
  window.xtendDocsTrustedDomLastSanitize = result;
  return result;
}

window.xtendDocsTrustedDomBoundary = Object.freeze({
  schema: DOCS_RMT_TRUSTED_DOM_PROOF_SCHEMA,
  sanitizer: DOCS_RMT_TRUSTED_DOM_SANITIZER,
  trustBoundary: DOCS_RMT_TRUST_BOUNDARY,
  sanitize: sanitizeDocsTrustedDomHtml,
  apply: applyDocsTrustedDomHtml,
  upgradeCodeFences: upgradeDocsParsedownCodeFences
});

function upgradeRoutedLinks(root) {
  Array.from(root.querySelectorAll('x-link')).forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const href = node.getAttribute('href');
    const text = node.textContent;
    const real = document.createElement('x-link');
    if (href) real.setAttribute('href', href);
    real.textContent = text;
    node.replaceWith(real);
  });
}

function syncActiveHeaderLink(slug) {
  const header = document.querySelector('x-header');
  if (!header) return;
  const locale = getCurrentDocsLocale();
  const localizedHref = getLocalizedDocsPath(slug, locale);
  header.querySelectorAll('[data-docs-menu-link]').forEach((link) => {
    const href = link.getAttribute('href');
    const active = href === localizedHref || href === `#${localizedHref}` || href === `#/${slug}` || href === `/${slug}`;
    link.toggleAttribute('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function updateDocsLocaleBusyUi(transition = window.__xtendDocsLocaleTransition || window.__xtendDocsLocaleLastTransition || null) {
  const busy = Boolean(transition && transition.busy);
  const locale = transition && transition.targetLocale ? transition.targetLocale : getCurrentDocsLocale();
  const control = document.querySelector('[data-docs-language-control]');
  const status = document.querySelector('[data-docs-language-status]');
  const label = document.querySelector('[data-docs-language-status-label]');
  if (control) {
    control.toggleAttribute('data-docs-locale-busy', busy);
    control.setAttribute('aria-busy', busy ? 'true' : 'false');
  }
  if (status) {
    status.hidden = !busy;
  }
  if (label) {
    label.textContent = locale === 'en' ? 'Loading' : 'Lädt';
  }
}

function updateDocsLocaleUi(locale = getCurrentDocsLocale(), options = {}) {
  const targetLocale = normalizeDocsLocale(locale);
  const isEnglish = targetLocale === 'en';
  const shouldPublish = options.publish !== false;
  const normalized = !shouldPublish
    ? targetLocale
    : window.xtendDocsCurrentLocale && normalizeDocsLocale(window.xtendDocsCurrentLocale) === targetLocale
    ? targetLocale
    : publishDocsLocale(targetLocale, window.__xtendDocsLocaleUserSelected ? 'user' : 'route');
  syncLegacyDocsGlobals(normalized, { slug: options.slug || getCurrentDocsSlug() });
  const headerTitle = document.querySelector('x-header [slot="title"]');
  if (headerTitle) {
    headerTitle.textContent = isEnglish ? 'XTend Documentation' : 'XTend Dokumentation';
  }
  const homeLink = document.querySelector('[data-docs-home-logo]');
  if (homeLink) {
    homeLink.setAttribute('href', getLocalizedDocsPath('readme', normalized));
    homeLink.setAttribute('aria-label', isEnglish ? 'Open the Docs home page' : 'Docs-Startseite öffnen');
    homeLink.setAttribute('title', isEnglish ? 'Docs home' : 'Docs-Startseite');
  }
  const searchLabel = document.querySelector('label[for="search-input"]');
  if (searchLabel) {
    searchLabel.textContent = isEnglish ? 'Search documentation' : 'Dokumentation durchsuchen';
  }
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.setAttribute('placeholder', isEnglish ? 'Search documentation' : 'Dokumentation durchsuchen');
  }
  const searchPopover = document.getElementById('docs-search-popover');
  if (searchPopover) {
    searchPopover.setAttribute('label', isEnglish ? 'Search results' : 'Suchergebnisse');
  }
  const searchResults = document.getElementById('search-results');
  if (searchResults) {
    searchResults.setAttribute('aria-label', isEnglish ? 'Documentation search results' : 'Suchergebnisse der Dokumentation');
  }
  const control = document.querySelector('[data-docs-language-control]');
  if (control) {
    control.setAttribute('aria-label', isEnglish ? 'Change language' : 'Sprache wechseln');
  }
  const select = document.getElementById('docs-language-select');
  if (select && select.getAttribute('value') !== normalized) {
    select.setAttribute('value', normalized);
    if ('value' in select) {
      try { select.value = normalized; } catch (error) {}
    }
  }
  if (select) {
    select.setAttribute('label', isEnglish ? 'Language' : 'Sprache');
  }
  updateDocsLocaleBusyUi(options.busy === false ? { busy: false, targetLocale: normalized } : window.__xtendDocsLocaleTransition);
  document.querySelectorAll('[data-docs-locale-label]').forEach((node) => {
    const text = node.getAttribute('data-docs-locale-label-' + normalized);
    if (text) node.textContent = text;
  });
  return normalized;
}

function navigateDocsLocale(locale, source = 'user') {
  const normalized = normalizeDocsLocale(locale);
  const slug = getCurrentDocsSlug();
  const currentRoute = parseDocsRoutePath();
  if (source === 'user') {
    window.__xtendDocsLocaleUserSelected = true;
    writeStoredDocsLocale(normalized);
  }
  if (normalized === getCurrentDocsLocale() && currentRoute.localized && currentRoute.locale === normalized && !window.__xtendDocsLocaleTransition) {
    completeDocsLocaleTransition(normalized, slug, { source, status: 'ready' });
    updateDocsLocaleUi(normalized, { publish: false, busy: false, slug });
    return;
  }
  beginDocsLocaleTransition(normalized, { source, slug });
  const shellRuntime = window.xtendDocsShellRuntime;
  if (shellRuntime && typeof shellRuntime.prepareLocaleRoutes === 'function') {
    shellRuntime.prepareLocaleRoutes(normalized);
  }
  syncLegacyDocsGlobals(normalized, { slug });
  prefetchDocsLocalePage(slug, normalized).catch(() => {});
  window.__xtendDocsPendingLocaleRoute = window.__xtendDocsLocaleTransition;
  const nextPath = getLocalizedDocsPath(slug, normalized);
  if (normalizeDocsPathForCompare(location.pathname) !== normalizeDocsPathForCompare(nextPath)) {
    const router = document.querySelector('x-router');
    if (router && typeof router.navigate === 'function') {
      router.navigate(nextPath, { source: 'locale-change' });
    } else {
      history.pushState({ source: 'locale-change', locale: normalized, slug }, '', nextPath);
      window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
    }
  } else {
    const page = document.querySelector('xtend-doc-page');
    if (page && typeof page.updateRoute === 'function') {
      page.updateRoute({ path: getLocalizedDocsPath(slug, normalized), source: 'locale-change' });
    }
  }
  updateDocsLocaleUi(normalized, { publish: false, busy: true, slug });
}

function ensureDocsLanguageSelectBinding() {
  if (window.__xtendDocsLanguageSelectBound) return;
  window.__xtendDocsLanguageSelectBound = true;
  updateDocsLocaleUi(getCurrentDocsLocale());
  const maybePrefetchLanguageTarget = (event) => {
    const control = event.target && event.target.closest
      ? event.target.closest('[data-docs-language-control], #docs-language-select')
      : null;
    if (!control) return;
    prefetchAlternateDocsLocales(getCurrentDocsSlug());
  };
  bindDocsLifecycle(document, 'pointerdown', maybePrefetchLanguageTarget, { passive: true });
  bindDocsLifecycle(document, 'focusin', maybePrefetchLanguageTarget);
  bindDocsLifecycle(document, 'select-changed', (event) => {
    const select = event.target && event.target.closest
      ? event.target.closest('#docs-language-select')
      : null;
    if (!select) return;
    const value = event.detail && event.detail.value ? event.detail.value : select.getAttribute('value');
    navigateDocsLocale(value, 'user');
  });
  bindDocsLifecycle(window, 'popstate', () => {
    const parsed = parseDocsRoutePath();
    updateDocsLocaleUi(parsed.locale, {
      publish: false,
      busy: Boolean(window.__xtendDocsLocaleTransition),
      slug: parsed.slug || getCurrentDocsSlug()
    });
  });
  if (window.xstate && typeof window.xstate.subscribe === 'function') {
    const config = getDocsI18nConfig();
    window.xstate.subscribe((key, value) => {
      if (key === config.stateKeys.locale && value && normalizeDocsLocale(value) !== getCurrentDocsLocale()) {
        navigateDocsLocale(value, 'xstate');
      }
    }, config.stateKeys.locale);
  }
}

function docsPageExists(slug) {
  if (Array.isArray(window.xtendMenuConfig) && window.xtendMenuConfig.some((entry) => entry && entry.slug === slug)) return true;
  const localized = getLocalizedDocsMap('xtendDocsLocalizedPagesMeta', getCurrentDocsLocale());
  if (localized && localized[slug]) return true;
  return Boolean(slug && (
    window.xtendDocsPages && window.xtendDocsPages[slug] ||
    window.xtendDocsPagesMeta && window.xtendDocsPagesMeta[slug]
  ));
}

function docsTitleForSlug(slug) {
  const menuEntry = Array.isArray(window.xtendMenuConfig)
    ? window.xtendMenuConfig.find((entry) => entry && entry.slug === slug)
    : null;
  if (menuEntry) {
    const labels = menuEntry.labels && typeof menuEntry.labels === 'object' ? menuEntry.labels : {};
    return labels[getCurrentDocsLocale()] || labels.de || labels.en || menuEntry.label || slug;
  }
  const localizedTitles = getLocalizedDocsMap('xtendDocsLocalizedTitles', getCurrentDocsLocale());
  return (localizedTitles && localizedTitles[slug]) ||
    (window.xtendDocsTitles && window.xtendDocsTitles[slug]) ||
    (slug ? slug.replace(/^components-/, '').replace(/-/g, ' ') : '');
}

function isGenericRelatedLinkLabel(value) {
  return /^(?:verwandter artikel|related article)$/i.test(String(value || '').trim());
}

function normalizeDocsSlugFromHref(href) {
  if (!href) return '';
  let value = String(href).trim();
  if (!value || value.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(value)) return '';
  value = value.split('#')[0].split('?')[0];
  value = value.replace(/^#\/?/, '').replace(/^\/+/, '').replace(/^\.\//, '');
  while (value.startsWith('../')) value = value.slice(3);
  if (value.startsWith('docs/')) value = value.slice('docs/'.length);
  if (value.startsWith('components/')) {
    value = 'components-' + value.slice('components/'.length);
  }
  value = value.replace(/\.md$/i, '').replace(/\//g, '-').toLowerCase();
  if (docsPageExists(value)) return value;
  const base = value.split('-').pop();
  const match = getDocsPageSlugs().find((slug) => slug === value || slug.endsWith('-' + base));
  return match || value;
}

function collectRelatedLinksFromNode(node) {
  const links = [];
  Array.from(node.querySelectorAll('x-link, a')).forEach((link) => {
    const href = link.getAttribute('href') || '';
    const slug = normalizeDocsSlugFromHref(href);
    const authoredLabel = (link.textContent || '').trim();
    const label = slug && isGenericRelatedLinkLabel(authoredLabel)
      ? docsTitleForSlug(slug)
      : (authoredLabel || (slug ? docsTitleForSlug(slug) : href));
    if (slug && docsPageExists(slug)) {
      links.push({
        slug,
        href: '/' + slug,
        label: label || docsTitleForSlug(slug),
        source: 'parsedown'
      });
      return;
    }
    if (href && isDocsTrustedDomUrlAllowed(href)) {
      links.push({
        href,
        label: label || href,
        source: 'parsedown'
      });
    }
  });
  return links;
}

function isRelatedText(value) {
  const text = String(value || '');
  return /(siehe auch|weiterfuehr|weiterführ|verwandte)/i.test(text)
    || /\b(?:read further|related|see also)\b/i.test(text);
}

function headingLevel(node) {
  return /^H[1-6]$/i.test(node.tagName || '') ? Number(node.tagName.slice(1)) : 0;
}

function extractDocsRelatedLinks(contentRoot) {
  if (!contentRoot) return [];
  const links = [];

  Array.from(contentRoot.querySelectorAll('blockquote')).forEach((node) => {
    if (!isRelatedText(node.textContent)) return;
    links.push(...collectRelatedLinksFromNode(node));
    node.remove();
  });

  Array.from(contentRoot.querySelectorAll('p')).forEach((node) => {
    if (!isRelatedText(node.textContent)) return;
    const nodeLinks = collectRelatedLinksFromNode(node);
    if (!nodeLinks.length) return;
    links.push(...nodeLinks);
    node.remove();
  });

  Array.from(contentRoot.querySelectorAll('h2, h3, h4')).forEach((heading) => {
    if (!heading.isConnected || !isRelatedText(heading.textContent)) return;
    const baseLevel = headingLevel(heading);
    let cursor = heading.nextElementSibling;
    const remove = [heading];
    while (cursor) {
      const level = headingLevel(cursor);
      if (level && level <= baseLevel) break;
      links.push(...collectRelatedLinksFromNode(cursor));
      remove.push(cursor);
      cursor = cursor.nextElementSibling;
    }
    remove.forEach((node) => node.remove());
  });

  const seen = new Set();
  return links.filter((link) => {
    const key = link.slug || link.href;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fallbackRelatedLinksForSlug(slug, excludedSlugs = [], limit = 7) {
  const menu = Array.isArray(window.xtendMenuConfig) && window.xtendMenuConfig.length
    ? window.xtendMenuConfig
    : [];
  const canonicalSlug = resolveCanonicalDocsSlug(slug);
  const current = menu.find((entry) => entry && entry.slug === canonicalSlug);
  const candidates = [];
  const sorted = (entries) => entries.slice().sort((left, right) => (
    Number(right.rank || 0) - Number(left.rank || 0)
    || docsTitleForSlug(left.slug).localeCompare(docsTitleForSlug(right.slug), getCurrentDocsLocale())
    || left.slug.localeCompare(right.slug)
  ));
  const append = (entries, source) => sorted(entries).forEach((entry) => {
    if (!entry || entry.slug === canonicalSlug) return;
    candidates.push({ slug: entry.slug, label: docsTitleForSlug(entry.slug), source });
  });
  if (current) {
    if (current.parent) append(menu.filter((entry) => entry.slug === current.parent), 'navigation-parent');
    append(menu.filter((entry) => entry.parent === canonicalSlug), 'navigation-child');
    if (current.parent) append(menu.filter((entry) => entry.parent === current.parent), 'navigation-sibling');
    append(menu.filter((entry) => entry.section === current.section), 'navigation-section');
    append(menu.filter((entry) => entry.trunk === current.trunk), 'navigation-trunk');
  }

  const seen = new Set([canonicalSlug, ...excludedSlugs.map(resolveCanonicalDocsSlug)]);
  return candidates
    .filter((entry) => docsPageExists(entry.slug))
    .filter((entry) => {
      if (seen.has(entry.slug)) return false;
      seen.add(entry.slug);
      return true;
    })
    .slice(0, Math.max(0, limit));
}

function mergeDocsRelatedLinks(slug, explicitLinks = [], recommendationResults = [], options = {}) {
  const minimum = Math.max(0, Number(options.minimum || 3));
  const maximum = Math.max(minimum, Math.min(7, Number(options.maximum || 7)));
  const canonicalSlug = resolveCanonicalDocsSlug(slug);
  const merged = [];
  const seen = new Set([canonicalSlug]);
  const append = (entry) => {
    if (!entry || merged.length >= maximum) return;
    const canonical = entry.slug ? resolveCanonicalDocsSlug(entry.slug) : '';
    const key = canonical || String(entry.href || '');
    if (!key || seen.has(key) || (canonical && !docsPageExists(canonical))) return;
    seen.add(key);
    merged.push({
      ...entry,
      slug: canonical || undefined,
      label: entry.label || (canonical ? docsTitleForSlug(canonical) : entry.href)
    });
  };
  explicitLinks.forEach(append);
  recommendationResults.forEach(append);
  if (merged.length < minimum) {
    fallbackRelatedLinksForSlug(canonicalSlug, Array.from(seen), maximum - merged.length).forEach(append);
  }
  return merged.slice(0, maximum);
}

function createRelatedLink(entry) {
  const link = document.createElement('x-link');
  link.className = 'docs-related-link';
  const href = entry.href || (entry.slug ? getLocalizedDocsPath(entry.slug) : '#');
  link.setAttribute('href', href);
  link.setAttribute('data-rmt-component', 'docs.relatedLinks');
  link.setAttribute('data-related-source', entry.source || 'unknown');
  if (Number.isFinite(Number(entry.score))) link.setAttribute('data-related-score', String(entry.score));
  if (entry.slug) {
    link.setAttribute('data-rmt-route-ref', 'docs.' + entry.slug.replace(/-/g, '.'));
  }

  const icon = document.createElement('x-icon');
  icon.setAttribute('name', 'arrow-up-right');
  icon.setAttribute('pack', 'lucide');
  icon.setAttribute('decorative', '');
  icon.setAttribute('size', '1rem');

  const label = document.createElement('span');
  label.textContent = entry.label || (entry.slug ? docsTitleForSlug(entry.slug) : href);

  const chevron = document.createElement('x-icon');
  chevron.setAttribute('name', 'chevron-right');
  chevron.setAttribute('pack', 'lucide');
  chevron.setAttribute('decorative', '');
  chevron.setAttribute('size', '1rem');

  link.appendChild(icon);
  link.appendChild(label);
  link.appendChild(chevron);
  return link;
}

function renderDocsRelatedSidebar(relatedSlot, slug, linksInput) {
  if (!relatedSlot) return;
  const list = ensureDocsRelatedSidebarScaffold(relatedSlot);
  if (!list) return;
  while (list.firstChild) list.removeChild(list.firstChild);
  const links = Array.isArray(linksInput) ? linksInput : mergeDocsRelatedLinks(slug);
  links.forEach((entry) => list.appendChild(createRelatedLink(entry)));
  relatedSlot.hidden = links.length === 0;
  relatedSlot.setAttribute('data-related-count', String(links.length));
}

function createDemoCodeBlock(title, lang, code, mode = 'html') {
  const block = document.createElement('div');
  block.className = 'docs-demo-code-block';
  const heading = document.createElement('h3');
  heading.textContent = title;
  const codeElement = document.createElement('x-code');
  codeElement.setAttribute('lang', lang);
  const template = document.createElement('template');
  const snippetCode = code == null ? '' : String(code);
  template.setAttribute('data-x-code-mode', 'text');
  template.content.appendChild(document.createTextNode(snippetCode));
  codeElement.appendChild(template);
  block.appendChild(heading);
  block.appendChild(codeElement);
  return block;
}

function ensureDocsDemoScaffold(demoSlot) {
  let title = demoSlot.querySelector('[data-demo-title]');
  if (!title) {
    let heading = demoSlot.querySelector('.docs-sidebar-heading');
    if (!heading) {
      heading = createDocsSidebarHeading('play', 'Hands-on Demo', { demoTitle: true });
      demoSlot.insertBefore(heading, demoSlot.firstChild);
      title = heading.querySelector('[data-demo-title]');
    } else {
      title = document.createElement('span');
      title.setAttribute('data-demo-title', '');
      heading.appendChild(title);
    }
  }

  let description = demoSlot.querySelector('[data-demo-description]');
  if (!description) {
    description = document.createElement('p');
    description.className = 'docs-sidebar-copy';
    description.setAttribute('data-demo-description', '');
    demoSlot.appendChild(description);
  }

  let preview = demoSlot.querySelector('[data-demo-preview]');
  if (!preview) {
    preview = document.createElement('div');
    preview.className = 'docs-demo-preview';
    preview.setAttribute('data-demo-preview', '');
    demoSlot.appendChild(preview);
  }

  let code = demoSlot.querySelector('[data-demo-code]');
  if (!code) {
    code = document.createElement('div');
    code.className = 'docs-demo-code-grid';
    code.setAttribute('data-demo-code', '');
    demoSlot.appendChild(code);
  }

  return { title, description, preview, code };
}

function hydrateDocsCodeBlocks(root, metadata = {}) {
  const scope = root || document;
  const codeBlocks = Array.from(scope.querySelectorAll ? scope.querySelectorAll('x-code') : []);
  if (!codeBlocks.length) {
    return Promise.resolve({
      schema: 'xtend.docs.code-hydration.v1',
      hydrated: 0,
      count: 0,
      skipped: 'no-code-blocks'
    });
  }

  const publishHydration = (loaderSnapshot = {}) => {
    const hydrated = Number.isFinite(loaderSnapshot.hydrated)
      ? loaderSnapshot.hydrated
      : codeBlocks.filter((codeBlock) => typeof codeBlock.hydrate === 'function').length;

    const snapshot = {
      schema: 'xtend.docs.code-hydration.v1',
      slug: metadata.slug || '',
      reason: metadata.reason || 'route-render',
      schedule: metadata.schedule || 'docs.page.hydrate',
      count: codeBlocks.length,
      hydrated,
      componentDefined: Boolean(customElements.get('x-code')),
      loader: loaderSnapshot.schema || null
    };
    window.xtendDocsLastCodeHydration = snapshot;
    window.dispatchEvent(new CustomEvent('xtend-docs-code-hydrated', { detail: snapshot }));
    return snapshot;
  };

  if (window.XTendLoader && typeof window.XTendLoader.hydrateTree === 'function') {
    return window.XTendLoader.hydrateTree(scope, {
      tags: ['x-code'],
      source: 'docs.component-demo',
      reason: metadata.reason || 'route-render',
      schedule: metadata.schedule || 'docs.page.hydrate'
    }).then(publishHydration);
  }

  return new Promise((resolve) => {
    const commit = () => {
      codeBlocks.forEach((codeBlock) => {
        if (typeof codeBlock.hydrate === 'function') codeBlock.hydrate();
      });
      resolve(publishHydration());
    };
    scheduleDocsAfterPaint(commit);
  });
}

function scheduleDocsSsrCodeEnhancement(root, metadata = {}) {
  if (!root || typeof window === 'undefined') return () => {};
  const codeFenceCount = root.querySelectorAll ? root.querySelectorAll('pre > code').length : 0;
  if (codeFenceCount === 0) {
    root.setAttribute('data-docs-code-fence-upgraded', '0');
    root.setAttribute('data-docs-code-enhancement', 'not-needed');
    root.removeAttribute('data-docs-code-enhancement-trigger');
    return () => {};
  }
  let disposed = false;
  let enhanced = false;
  let componentReady = Boolean(customElements.get('x-code'));
  let interactionRequested = false;
  let idleDisposer = null;
  const listeners = [];
  const isActive = typeof metadata.isActive === 'function' ? metadata.isActive : () => true;
  const scheduleId = metadata.schedule || 'docs.syntax.highlight';
  const schedule = getRmtSchedule(scheduleId);
  const endpointName = schedule && schedule.endpointName ? schedule.endpointName : scheduleId;
  const deadlineMs = Number(schedule && schedule.deadlineMs) > 0 ? Number(schedule.deadlineMs) : 280;
  const removeListeners = () => {
    listeners.splice(0).forEach(({ type, listener }) => {
      window.removeEventListener(type, listener, true);
    });
  };
  const cancelIdleEnhancement = () => {
    if (typeof idleDisposer !== 'function') return;
    const dispose = idleDisposer;
    idleDisposer = null;
    dispose();
  };
  const enhance = (trigger = 'idle') => {
    if (disposed || enhanced || !isActive()) return false;
    if (!componentReady) {
      if (trigger === 'interaction') interactionRequested = true;
      return false;
    }
    enhanced = true;
    cancelIdleEnhancement();
    removeListeners();
    const normalizedCodeEntityCount = normalizeDocsParsedownCodeEntities(root);
    const codeFenceUpgrade = upgradeDocsParsedownCodeFences(root, { schedule: scheduleId });
    root.setAttribute('data-docs-code-fence-upgraded', String(codeFenceUpgrade.upgraded));
    root.setAttribute('data-docs-code-enhancement', `${trigger}-committed`);
    root.setAttribute('data-docs-code-enhancement-trigger', trigger);
    hydrateDocsCodeBlocks(root, metadata).catch(() => {});
    root.setAttribute('data-docs-code-normalized-count', String(normalizedCodeEntityCount));
    return true;
  };
  const scheduleIdleEnhancement = () => {
    if (disposed || enhanced || idleDisposer || !componentReady || !isActive()) return;
    idleDisposer = docsBrowserScheduler.scheduleEndpoint(endpointName, window.location.pathname, () => {
      cancelIdleEnhancement();
      enhance('idle');
    }, { kind: 'idle', timeout: deadlineMs });
  };
  const prepare = window.XTendLoader && typeof window.XTendLoader.ensureComponent === 'function'
    ? window.XTendLoader.ensureComponent('x-code', {
        source: 'docs.ssr-code-enhancement',
        reason: 'ssr-code-enhancement-prepare',
        schedule: scheduleId
      })
    : customElements.whenDefined('x-code').then(() => true);
  Promise.resolve(prepare).then(() => {
    if (disposed || !isActive()) return;
    componentReady = Boolean(customElements.get('x-code'));
    if (!componentReady) {
      root.setAttribute('data-docs-code-enhancement', 'component-unavailable');
      removeListeners();
      return;
    }
    if (interactionRequested) enhance('interaction');
    else scheduleIdleEnhancement();
  }).catch(() => {
    if (disposed || !isActive()) return;
    root.setAttribute('data-docs-code-enhancement', 'component-unavailable');
    removeListeners();
  });
  ['pointerdown', 'keydown'].forEach((type) => {
    const listener = () => {
      interactionRequested = true;
      enhance('interaction');
    };
    listeners.push({ type, listener });
    window.addEventListener(type, listener, { capture: true, passive: true });
  });
  root.setAttribute('data-docs-code-enhancement', 'idle-pending');
  root.removeAttribute('data-docs-code-enhancement-trigger');
  return () => {
    disposed = true;
    cancelIdleEnhancement();
    removeListeners();
  };
}

function bindDocsDemoInteractions(container, demo) {
  if (!container || !demo || !Array.isArray(demo.actions)) return;
  if (demo.actions.includes('toast')) {
    container.querySelectorAll('[data-demo-action="toast"]').forEach((button) => {
      bindDocsButtonAction(button, () => window.xtendShowToast('XTend Demo Toast', 'success', 2800));
    });
  }
  if (demo.actions.includes('open-modal')) {
    container.querySelectorAll('[data-demo-action="open-modal"]').forEach((button) => {
      bindDocsButtonAction(button, () => {
        const modal = container.querySelector('#docs-demo-modal');
        if (modal && typeof modal.open === 'function') modal.open();
        else if (modal) modal.setAttribute('open', '');
      });
    });
  }
  if (demo.actions.includes('open-dialog')) {
    container.querySelectorAll('[data-demo-action="open-dialog"]').forEach((button) => {
      bindDocsButtonAction(button, () => {
        const dialog = container.querySelector('#docs-demo-dialog');
        if (dialog && typeof dialog.open === 'function') dialog.open();
        else if (dialog) dialog.setAttribute('open', '');
      });
    });
  }
}

function renderDocsComponentDemo(demoSlot, slug) {
  if (!demoSlot) return;
  const demo = DOCS_COMPONENT_DEMOS[slug];
  if (!demo) {
    demoSlot.hidden = true;
    demoSlot.removeAttribute('data-demo-component');
    return;
  }

  demoSlot.hidden = false;
  demoSlot.setAttribute('data-demo-component', demo.tag);
  const { title, description, preview, code } = ensureDocsDemoScaffold(demoSlot);
  if (title) title.textContent = `${demo.title} Hands-on`;
  if (description) description.textContent = demo.description;
  if (preview) {
    docsRmtDescriptorRenderer.render(preview, demo.descriptor, { source: { inputKind: 'docs-component-demo', slug } });
    bindDocsDemoInteractions(preview, demo);
  }
  if (code) {
    while (code.firstChild) code.removeChild(code.firstChild);
    code.appendChild(createDemoCodeBlock('HTML', 'html', demo.html, 'html'));
    code.appendChild(createDemoCodeBlock('RMT', 'rmt', demo.rmt, 'text'));
  }
}

function createDocsRmtPlaygroundElement(tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => {
    if (value === false || value === null || value === undefined) return;
    element.setAttribute(name, value === true ? '' : String(value));
  });
  if (text !== '') element.textContent = String(text);
  return element;
}

function createDocsRmtPlaygroundButton(label, iconName, attributes = {}) {
  const button = createDocsRmtPlaygroundElement('x-button', attributes);
  button.appendChild(createDocsRmtPlaygroundElement('x-icon', {
    name: iconName,
    pack: 'lucide',
    decorative: '',
    size: '1rem'
  }));
  button.appendChild(createDocsRmtPlaygroundElement('span', {}, label));
  return button;
}

function getDocsRmtPlaygroundCopy(locale = getCurrentDocsLocale()) {
  const copy = {
    de: {
      title: 'RMT Playground',
      workbench: 'RMT Playground Arbeitsbereich',
      info: 'Anleitung',
      related: 'Weiterlesen',
      editor: 'RMT-Quelle',
      diagnostics: 'Diagnosen',
      output: 'Core-JSON',
      preview: 'Sichere Preview',
      preset: 'Template',
      maracaPreview: 'Maraca Runtime',
      maracaLoading: 'Maraca startet...',
      maracaBlocked: 'Maraca Preview blockiert.',
      maracaPlanned: 'geplant',
      maracaRunning: 'läuft',
      maracaActive: 'aktiv',
      maracaRendered: 'gerendert',
      maracaOff: 'aus',
      run: 'Kompilieren',
      resetLayout: 'Layout zurücksetzen',
      ready: 'Bereit',
      analyzing: 'LSP prüft...',
      compiling: 'Compiler läuft...',
      compiled: 'Kompiliert',
      blocked: 'Preview blockiert, bis die Quelle sicher kompiliert.',
      noDiagnostics: 'Keine Diagnosen.',
      noPreview: 'Keine Surface in der kompilierten Ausgabe gefunden.',
      noRelated: 'Keine weiteren Links für diese Route.',
      tooLarge: 'Die Quelle ist größer als 64 KB.',
      failed: 'Kompilierung fehlgeschlagen.'
    },
    en: {
      title: 'RMT Playground',
      workbench: 'RMT Playground workspace',
      info: 'Guide',
      related: 'Read further',
      editor: 'RMT source',
      diagnostics: 'Diagnostics',
      output: 'Core JSON',
      preview: 'Safe preview',
      preset: 'Template',
      maracaPreview: 'Maraca Runtime',
      maracaLoading: 'Maraca booting...',
      maracaBlocked: 'Maraca preview blocked.',
      maracaPlanned: 'planned',
      maracaRunning: 'running',
      maracaActive: 'active',
      maracaRendered: 'rendered',
      maracaOff: 'off',
      run: 'Compile',
      resetLayout: 'Reset layout',
      ready: 'Ready',
      analyzing: 'LSP checking...',
      compiling: 'Compiler running...',
      compiled: 'Compiled',
      blocked: 'Preview is blocked until the source compiles safely.',
      noDiagnostics: 'No diagnostics.',
      noPreview: 'No surface found in the compiled output.',
      noRelated: 'No further links for this route.',
      tooLarge: 'Source is larger than 64 KB.',
      failed: 'Compilation failed.'
    }
  };
  return copy[normalizeDocsLocale(locale)] || copy.en;
}

function getDocsRmtPlaygroundEndpoint() {
  const base = getDocsBasePath();
  return `${base || ''}/index.php?xtend-rmt-playground=compile`;
}

function getDocsRmtPlaygroundDiagnosticsEndpoint() {
  const base = getDocsBasePath();
  return `${base || ''}/index.php?xtend-rmt-playground=diagnostics`;
}

function getDocsRmtPlaygroundPresetEndpoint(name) {
  const base = getDocsBasePath();
  return `${base || ''}/index.php?xtend-rmt-playground=preset&name=${encodeURIComponent(String(name || ''))}`;
}

function getDocsRmtPlaygroundSourceBytes(source) {
  const text = String(source || '');
  if (window.TextEncoder) return new TextEncoder().encode(text).length;
  return unescape(encodeURIComponent(text)).length;
}

function hashDocsRmtPlaygroundSource(source) {
  const text = String(source == null ? '' : source);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function docsRmtPlaygroundIsland(key) {
  return DOCS_RMT_PLAYGROUND_ISLANDS[key] || null;
}

function docsRmtPlaygroundIslandSelector(island) {
  return island && island.id ? `[data-rmt-hydration-island="${island.id}"]` : '';
}

function decorateDocsRmtPlaygroundIslandAttributes(attributes = {}, key, state = 'idle') {
  const island = docsRmtPlaygroundIsland(key);
  if (!island) return attributes;
  return {
    ...attributes,
    'data-rmt-hydration-island': island.id,
    'data-rmt-surface-role': island.role,
    'data-rmt-hydration-state': state,
    'data-fabric-lane': island.lane,
    'data-rmt-hydrate-schedule': island.schedule
  };
}

function dispatchDocsRmtPlaygroundCrossSurfaceEvent(root, name, detail = {}) {
  const eventDetail = {
    schema: 'xtend.docs.rmt-playground.cross-surface-event.v1',
    name,
    source: 'docs-rmt-playground',
    emittedAt: new Date().toISOString(),
    ...detail
  };
  const event = new CustomEvent('docs-rmt-playground-cross-surface-event', {
    bubbles: true,
    composed: true,
    detail: eventDetail
  });
  if (root && typeof root.dispatchEvent === 'function') root.dispatchEvent(event);
  window.dispatchEvent(new CustomEvent('xtend-docs-rmt-playground-cross-surface-event', { detail: eventDetail }));
  return eventDetail;
}

function updateDocsRmtPlaygroundIslandState(root, key, state, detail = {}) {
  const island = docsRmtPlaygroundIsland(key);
  if (!root || !island) return null;
  const target = typeof root.querySelector === 'function'
    ? root.querySelector(docsRmtPlaygroundIslandSelector(island))
    : null;
  const sourceHash = detail && detail.sourceHash ? String(detail.sourceHash) : '';
  if (target) {
    target.setAttribute('data-rmt-hydration-state', state);
    target.setAttribute('data-rmt-hydrated-at', new Date().toISOString());
    target.setAttribute('data-rmt-hydration-reason', detail.reason || state);
    if (sourceHash) target.setAttribute('data-source-hash', sourceHash);
  }
  dispatchDocsLaneComplete({
    lane: island.lane,
    schedule: island.schedule,
    operation: `rmt-playground.${key}.${state}`,
    hydrationIsland: island.id,
    surfaceId: island.surfaceId,
    sourceHash,
    reason: detail.reason || state
  });
  return dispatchDocsRmtPlaygroundCrossSurfaceEvent(root, 'island-state-changed', {
    island: island.id,
    surfaceId: island.surfaceId,
    role: island.role,
    lane: island.lane,
    schedule: island.schedule,
    state,
    sourceHash
  });
}

function dispatchDocsRmtPlaygroundSourceChanged(root, source = '', reason = 'editor-input') {
  const sourceText = String(source == null ? '' : source);
  const sourceHash = hashDocsRmtPlaygroundSource(sourceText);
  updateDocsRmtPlaygroundIslandState(root, 'editor', 'dirty', { reason, sourceHash });
  updateDocsRmtPlaygroundIslandState(root, 'preview', 'stale', { reason, sourceHash });
  return dispatchDocsRmtPlaygroundCrossSurfaceEvent(root, 'source-changed', {
    sourceHash,
    sourceBytes: getDocsRmtPlaygroundSourceBytes(sourceText),
    lane: DOCS_RMT_PLAYGROUND_ISLANDS.editor.lane,
    schedule: DOCS_RMT_PLAYGROUND_ISLANDS.editor.schedule,
    sourceIsland: DOCS_RMT_PLAYGROUND_ISLANDS.editor.id,
    affectedIslands: [
      DOCS_RMT_PLAYGROUND_ISLANDS.preview.id,
      DOCS_RMT_PLAYGROUND_ISLANDS.output.id,
      DOCS_RMT_PLAYGROUND_ISLANDS.diagnostics.id
    ]
  });
}

function getDocsRmtPlaygroundNativeTextarea(editor) {
  if (!editor || !editor.shadowRoot || typeof editor.shadowRoot.querySelector !== 'function') return null;
  return editor.shadowRoot.querySelector('textarea, [part~="control"]');
}

function getDocsRmtPlaygroundEditorValue(editor) {
  if (!editor) return DOCS_RMT_PLAYGROUND_DEFAULT_SOURCE;
  const control = getDocsRmtPlaygroundNativeTextarea(editor);
  if (control && typeof control.value === 'string') return control.value;
  const value = typeof editor.value === 'string'
    ? editor.value
    : editor.getAttribute('value');
  return value == null ? '' : String(value);
}

function setDocsRmtPlaygroundEditorValue(editor, value) {
  if (!editor) return;
  const next = value == null ? '' : String(value);
  const control = getDocsRmtPlaygroundNativeTextarea(editor);
  if (control && control.value !== next) control.value = next;
  editor.setAttribute('value', next);
  try {
    editor.value = next;
  } catch (error) {
    editor.__xtendDocsRmtPlaygroundValue = next;
  }
}

function setDocsRmtPlaygroundStatus(statusNode, message, state = 'idle') {
  if (!statusNode) return;
  statusNode.textContent = message || '';
  statusNode.setAttribute('data-state', state);
}

function normalizeDocsRmtPlaygroundDiagnosticSeverity(value) {
  if (value === 1 || value === '1') return 'error';
  if (value === 2 || value === '2') return 'warning';
  if (value === 3 || value === '3') return 'info';
  if (value === 4 || value === '4') return 'hint';
  const severity = String(value || 'info').toLowerCase();
  return ['error', 'warning', 'info', 'hint'].includes(severity) ? severity : 'info';
}

function normalizeDocsRmtPlaygroundDiagnosticItem(diagnostic = {}) {
  return {
    ...diagnostic,
    severity: normalizeDocsRmtPlaygroundDiagnosticSeverity(diagnostic && diagnostic.severity),
    source: diagnostic && diagnostic.source || 'xtend-rmt-language-server',
    code: diagnostic && diagnostic.code || 'rmt.diagnostic',
    message: diagnostic && diagnostic.message || 'RMT diagnostic',
    range: diagnostic && diagnostic.range || null
  };
}

function setDocsRmtPlaygroundEditorDiagnosticState(root, diagnostics = []) {
  const editor = root && root.querySelector ? root.querySelector('[data-rmt-playground-editor]') : null;
  if (!editor) return;
  const items = Array.isArray(diagnostics) ? diagnostics.map(normalizeDocsRmtPlaygroundDiagnosticItem) : [];
  const firstError = items.find((diagnostic) => diagnostic.severity === 'error');
  editor.toggleAttribute('invalid', Boolean(firstError));
  if (firstError) {
    editor.setAttribute('aria-invalid', 'true');
    editor.setAttribute('title', firstError.message);
  } else {
    editor.setAttribute('aria-invalid', 'false');
    editor.removeAttribute('title');
  }
}

function renderDocsRmtPlaygroundDiagnostics(target, diagnostics = [], copy = getDocsRmtPlaygroundCopy()) {
  if (!target) return;
  const items = Array.isArray(diagnostics)
    ? diagnostics.map(normalizeDocsRmtPlaygroundDiagnosticItem)
    : [];
  if (!items.length) {
    target.replaceChildren(createDocsRmtPlaygroundElement('p', {}, copy.noDiagnostics));
    return;
  }
  const nodes = items.map((diagnostic) => {
    const severity = normalizeDocsRmtPlaygroundDiagnosticSeverity(diagnostic && diagnostic.severity);
    const message = String(diagnostic && diagnostic.message || 'Diagnostic');
    const range = diagnostic && diagnostic.range && diagnostic.range.start ? diagnostic.range.start : null;
    const location = range
      ? `L${Number(range.line || 0) + 1}:C${Number(range.character || 0) + 1}`
      : '';
    const card = createDocsRmtPlaygroundElement('article', {
      class: 'docs-rmt-playground-diagnostic',
      'data-severity': severity
    });
    card.appendChild(createDocsRmtPlaygroundElement('strong', {}, severity.toUpperCase()));
    card.appendChild(createDocsRmtPlaygroundElement('span', {}, message));
    card.appendChild(createDocsRmtPlaygroundElement('small', {}, [diagnostic && diagnostic.code, location].filter(Boolean).join(' · ')));
    return card;
  });
  target.replaceChildren(...nodes);
}

function formatDocsRmtPlaygroundCore(payload = {}) {
  if (payload && typeof payload.coreJson === 'string' && payload.coreJson.trim() !== '') {
    try {
      return JSON.stringify(JSON.parse(payload.coreJson), null, 2);
    } catch (error) {
      return payload.coreJson;
    }
  }
  return JSON.stringify({
    schema: payload.schema || DOCS_RMT_PLAYGROUND_SCHEMA,
    ok: payload.ok === true,
    status: payload.status || 'unknown',
    diagnostics: Array.isArray(payload.diagnostics) ? payload.diagnostics : []
  }, null, 2);
}

function setDocsRmtPlaygroundOutputPending(root, source = '', copy = getDocsRmtPlaygroundCopy()) {
  const output = root && root.querySelector ? root.querySelector('[data-rmt-playground-output]') : null;
  if (!output) return;
  const sourceText = String(source == null ? '' : source);
  const sourceHash = hashDocsRmtPlaygroundSource(sourceText);
  output.textContent = JSON.stringify({
    schema: DOCS_RMT_PLAYGROUND_SCHEMA,
    ok: false,
    status: 'pending_compile',
    message: copy && copy.compiling ? copy.compiling : 'Compiler running...',
    sourceBytes: getDocsRmtPlaygroundSourceBytes(sourceText),
    sourceHash
  }, null, 2);
  output.setAttribute('data-output-state', 'pending');
  output.setAttribute('data-source-hash', sourceHash);
  updateDocsRmtPlaygroundIslandState(root, 'output', 'hydrating', { reason: 'pending-compile', sourceHash });
}

function isDocsRmtPlaygroundDescriptorPreview(preview = {}) {
  return Boolean(
    preview
    && typeof preview === 'object'
    && preview.renderMode === 'dom_descriptor'
    && preview.descriptor
    && typeof preview.descriptor === 'object'
  );
}

function collectDocsRmtPlaygroundDescriptorTags(descriptor, tags = new Set()) {
  if (!descriptor || typeof descriptor !== 'object') return tags;
  const tag = String(descriptor.tag || '').toLowerCase();
  if (/^[a-z][a-z0-9]*-[a-z0-9][a-z0-9-]*$/.test(tag)) tags.add(tag);
  const children = Array.isArray(descriptor.children || descriptor.nodes)
    ? descriptor.children || descriptor.nodes
    : [];
  children.forEach((child) => collectDocsRmtPlaygroundDescriptorTags(child, tags));
  return tags;
}

function ensureDocsRmtPlaygroundRenderer() {
  return Promise.resolve(docsRmtDescriptorRenderer);
}

function normalizeDocsRmtPlaygroundPreviewBounds(bounds = {}) {
  if (!bounds || typeof bounds !== 'object') return null;
  const normalized = {
    x: Number(bounds.x),
    y: Number(bounds.y),
    width: Number(bounds.width),
    height: Number(bounds.height)
  };
  if (!Number.isFinite(normalized.width) || !Number.isFinite(normalized.height)) return null;
  normalized.x = Number.isFinite(normalized.x) ? normalized.x : 0;
  normalized.y = Number.isFinite(normalized.y) ? normalized.y : 0;
  normalized.width = Math.max(80, normalized.width);
  normalized.height = Math.max(60, normalized.height);
  return normalized;
}

function createDocsRmtPlaygroundDescriptorPreviewFrame(surface = {}) {
  const preview = surface && surface.componentPreview && typeof surface.componentPreview === 'object'
    ? surface.componentPreview
    : null;
  if (!isDocsRmtPlaygroundDescriptorPreview(preview)) return null;
  const frame = createDocsRmtPlaygroundElement('div', {
    class: 'docs-rmt-playground-preview-component-frame',
    'data-rmt-playground-descriptor-preview': '',
    'data-rmt-playground-preview-tag': String(preview.tag || surface.component || '').toLowerCase()
  });
  const bounds = normalizeDocsRmtPlaygroundPreviewBounds(surface.bounds);
  if (bounds) {
    frame.setAttribute('data-bounded', 'true');
    frame.style.left = `${bounds.x}px`;
    frame.style.top = `${bounds.y}px`;
    frame.style.width = `${bounds.width}px`;
    frame.style.height = `${bounds.height}px`;
    frame.__xtendRmtPreviewBounds = bounds;
  }
  frame.__xtendRmtDescriptor = preview.descriptor;
  frame.__xtendRmtDescriptorOptions = {
    model: preview.model && typeof preview.model === 'object' ? preview.model : {},
    source: {
      inputKind: 'docs-rmt-playground-preview',
      surfaceId: surface.surfaceId || surface.id || ''
    }
  };
  return frame;
}

function renderDocsRmtPlaygroundDescriptorPreviews(target) {
  if (!target) return Promise.resolve();
  const frames = Array.from(target.querySelectorAll('[data-rmt-playground-descriptor-preview]'));
  if (!frames.length) return Promise.resolve();
  const tags = new Set();
  frames.forEach((frame) => collectDocsRmtPlaygroundDescriptorTags(frame.__xtendRmtDescriptor, tags));
  return ensureDocsRmtPlaygroundRenderer().then((renderer) => {
    frames.forEach((frame) => {
      const descriptor = frame.__xtendRmtDescriptor;
      if (!descriptor || typeof descriptor !== 'object') return;
      try {
        renderer.render(frame, descriptor, frame.__xtendRmtDescriptorOptions || {});
      } catch (error) {
        frame.replaceChildren(createDocsRmtPlaygroundElement('p', {}, error && error.message ? error.message : 'Preview render failed.'));
      }
    });
    return hydrateDocsRmtPlaygroundElements(target, Array.from(tags));
  }).catch((error) => {
    frames.forEach((frame) => {
      frame.replaceChildren(createDocsRmtPlaygroundElement('p', {}, error && error.message ? error.message : 'Preview renderer failed.'));
    });
  });
}

function createDocsRmtPlaygroundMaracaBadge(label, enabled, status = '') {
  return createDocsRmtPlaygroundElement('span', {
    class: 'docs-rmt-playground-maraca-badge',
    'data-enabled': enabled ? 'true' : 'false'
  }, `${label}: ${status || (enabled ? 'on' : 'off')}`);
}

function formatDocsRmtPlaygroundMaracaPlanStatus(status = '', enabled = true, copy = getDocsRmtPlaygroundCopy()) {
  if (!enabled) return copy.maracaOff || 'off';
  const normalized = String(status || '').trim().toLowerCase();
  if (!normalized || normalized === 'enabled') return copy.maracaActive || 'active';
  if (normalized === 'planned') return copy.maracaPlanned || 'planned';
  if (normalized === 'booted' || normalized === 'running') return copy.maracaRunning || 'running';
  return status;
}

function formatDocsRmtPlaygroundMaracaRuntimeStatus(feature, enabled, copy = getDocsRmtPlaygroundCopy()) {
  if (!enabled) return copy.maracaOff || 'off';
  if (feature === 'hydration') return copy.maracaRendered || 'rendered';
  return copy.maracaActive || 'active';
}

function renderDocsRmtPlaygroundMaracaToolbar(maraca = {}, copy = getDocsRmtPlaygroundCopy(), options = {}) {
  const features = maraca.features && typeof maraca.features === 'object' ? maraca.features : {};
  const runtime = options.runtime || null;
  const phase = options.phase || (runtime ? 'runtime' : 'plan');
  const toolbar = createDocsRmtPlaygroundElement('div', {
    class: 'docs-rmt-playground-maraca-toolbar',
    'data-rmt-playground-maraca-toolbar': ''
  });
  const runtimeSnapshot = runtime && typeof runtime.snapshot === 'function'
    ? runtime.snapshot()
    : (runtime && typeof runtime === 'object' ? runtime : null);
  const rootStatus = phase === 'runtime'
    ? (copy.maracaRunning || 'running')
    : formatDocsRmtPlaygroundMaracaPlanStatus(maraca.status || 'unknown', maraca.ok === true, copy);
  toolbar.setAttribute('data-maraca-phase', phase);
  toolbar.appendChild(createDocsRmtPlaygroundMaracaBadge(copy.maracaPreview, maraca.ok === true, rootStatus));
  ['kernel', 'hydration', 'validation', 'transitions'].forEach((feature) => {
    const entry = features[feature] || {};
    const enabled = entry.enabled === true;
    const runtimeEnabled = feature === 'kernel'
      ? Boolean(runtimeSnapshot && runtimeSnapshot.kernel && runtimeSnapshot.kernel.enabled)
      : feature === 'validation'
        ? Boolean(runtimeSnapshot && runtimeSnapshot.validation)
        : feature === 'transitions'
          ? Boolean(runtimeSnapshot && runtimeSnapshot.transitions)
          : enabled;
    const status = phase === 'runtime'
      ? formatDocsRmtPlaygroundMaracaRuntimeStatus(feature, runtimeEnabled, copy)
      : formatDocsRmtPlaygroundMaracaPlanStatus(entry.status || 'unknown', enabled, copy);
    toolbar.appendChild(createDocsRmtPlaygroundMaracaBadge(feature, phase === 'runtime' ? runtimeEnabled : enabled, status));
  });
  return toolbar;
}

async function bootDocsRmtPlaygroundMaracaPreview(target, payload = {}, copy = getDocsRmtPlaygroundCopy()) {
  if (!target || payload?.ok !== true || payload?.maraca?.ok !== true || !payload.maraca.plan) return null;
  const maraca = payload.maraca;
  const appRoot = createDocsRmtPlaygroundElement('div', {
    class: 'docs-rmt-playground-maraca-root',
    'data-rmt-playground-maraca-root': '',
    'data-maraca-root': ''
  });
  target.replaceChildren(renderDocsRmtPlaygroundMaracaToolbar(maraca, copy), appRoot);
  const previous = target.__xtendDocsMaracaPlanRuntime;
  if (previous && typeof previous.dispose === 'function') previous.dispose();
  const runtime = createMaracaPlanRuntime({
    plan: maraca.plan,
    root: appRoot,
    moduleUrls: DOCS_RMT_PLAYGROUND_MARACA_RUNTIME_MODULES.map((modulePath) => new URL(modulePath, window.location.origin).href),
    componentRegistry: {
      ensureTags(tags) { return hydrateDocsRmtPlaygroundElements(appRoot, tags); },
      hydrate(root, tags) { return hydrateDocsRmtPlaygroundElements(root, tags); }
    },
    hostServices: Object.freeze({
      emit(name, detail) { window.dispatchEvent(new CustomEvent(name, { detail })); }
    }),
    documentTarget: document,
    windowTarget: window,
    globalTarget: window,
    xUtils: window.XUtils,
    xstate: window.xstate
  });
  await runtime.boot();
  window.xtendDocsRmtPlaygroundLastMaraca = runtime.snapshot();
  target.__xtendDocsMaracaPlanRuntime = runtime;
  const playgroundRoot = target.closest('[data-rmt-playground-root]');
  if (playgroundRoot) playgroundRoot.__xtendDocsMaracaPlanRuntime = runtime;
  const toolbar = target.querySelector('[data-rmt-playground-maraca-toolbar]');
  if (toolbar) toolbar.replaceWith(renderDocsRmtPlaygroundMaracaToolbar(maraca, copy, { phase: 'runtime', runtime }));
  window.dispatchEvent(new CustomEvent('xtend-docs-rmt-playground-maraca-boot', { detail: runtime.snapshot() }));
  return runtime;
}

function renderDocsRmtPlaygroundPreview(target, payload = {}, copy = getDocsRmtPlaygroundCopy()) {
  if (!target) return;
  if (!payload || payload.ok !== true) {
    target.replaceChildren(createDocsRmtPlaygroundElement('p', {}, copy.blocked));
    return;
  }
  if (payload.maraca && payload.maraca.ok === true && payload.maraca.plan) {
    target.replaceChildren(createDocsRmtPlaygroundElement('p', {}, copy.maracaLoading));
    bootDocsRmtPlaygroundMaracaPreview(target, payload, copy)
      .then((runtime) => {
        if (runtime && typeof runtime.snapshot === 'function') {
          window.xtendDocsRmtPlaygroundLastMaraca = runtime.snapshot();
        }
      })
      .catch((error) => {
        target.replaceChildren(
          renderDocsRmtPlaygroundMaracaToolbar(payload.maraca, copy),
          createDocsRmtPlaygroundElement('p', {}, error && error.message ? error.message : copy.maracaBlocked)
        );
      });
    return;
  }
  if (payload.maraca) {
    const status = String(payload.maraca.status || 'bridge-error');
    const diagnostics = Array.isArray(payload.maraca.diagnostics) ? payload.maraca.diagnostics : [];
    const message = diagnostics.find((entry) => entry && entry.message)?.message || copy.maracaBlocked;
    target.replaceChildren(
      renderDocsRmtPlaygroundMaracaToolbar(payload.maraca, copy),
      createDocsRmtPlaygroundElement('p', {
        'data-rmt-playground-maraca-blocked': '',
        'data-maraca-status': status
      }, message)
    );
    window.xtendDocsRmtPlaygroundLastMaraca = Object.freeze({
      schema: DOCS_RMT_PLAYGROUND_MARACA_SCHEMA,
      phase: 'blocked',
      status,
      diagnosticCount: diagnostics.length
    });
    return;
  }
  const preview = payload.preview && typeof payload.preview === 'object' ? payload.preview : {};
  const surfaces = Array.isArray(preview.surfaces) ? preview.surfaces : [];
  if (!surfaces.length) {
    target.replaceChildren(createDocsRmtPlaygroundElement('p', {}, copy.noPreview));
    return;
  }
  const descriptorFrames = [];
  const fallbackCards = [];
  surfaces.slice(0, 12).forEach((surface) => {
    const descriptorPreview = createDocsRmtPlaygroundDescriptorPreviewFrame(surface);
    if (descriptorPreview) {
      descriptorFrames.push(descriptorPreview);
      return;
    }
    const card = createDocsRmtPlaygroundElement('article', { class: 'docs-rmt-playground-preview-card' });
    card.appendChild(createDocsRmtPlaygroundElement('strong', {}, surface.id || surface.surfaceId || 'surface'));
    card.appendChild(createDocsRmtPlaygroundElement('small', {}, [
      surface.kind ? `kind: ${surface.kind}` : '',
      surface.component ? `component: ${surface.component}` : ''
    ].filter(Boolean).join(' · ')));
    const lanes = Array.isArray(surface.lanes) ? surface.lanes.map((lane) => {
      if (typeof lane === 'string') return lane;
      return [lane && lane.name, lane && lane.weight ? `weight ${lane.weight}` : ''].filter(Boolean).join(' ');
    }).filter(Boolean) : [];
    card.appendChild(createDocsRmtPlaygroundElement('small', {}, lanes.length ? `lanes: ${lanes.join(', ')}` : 'lanes: none'));
    fallbackCards.push(card);
  });
  const nodes = [];
  if (descriptorFrames.length) {
    const appRoot = createDocsRmtPlaygroundElement('div', { class: 'docs-rmt-playground-preview-app' });
    const boundedFrames = descriptorFrames
      .map((frame) => frame.__xtendRmtPreviewBounds)
      .filter(Boolean);
    if (boundedFrames.length) {
      const maxX = Math.max(...boundedFrames.map((bounds) => bounds.x + bounds.width));
      const maxY = Math.max(...boundedFrames.map((bounds) => bounds.y + bounds.height));
      appRoot.setAttribute('data-bounded', 'true');
      appRoot.style.minWidth = `${Math.ceil(maxX + 24)}px`;
      appRoot.style.minHeight = `${Math.ceil(maxY + 24)}px`;
    }
    descriptorFrames.forEach((frame) => appRoot.appendChild(frame));
    nodes.push(appRoot);
  }
  nodes.push(...fallbackCards);
  target.replaceChildren(...nodes);
  renderDocsRmtPlaygroundDescriptorPreviews(target);
}

function updateDocsRmtPlaygroundDiagnostics(root, diagnostics, copy) {
  const target = root && root.querySelector ? root.querySelector('[data-rmt-playground-diagnostics]') : null;
  renderDocsRmtPlaygroundDiagnostics(target, diagnostics, copy);
  setDocsRmtPlaygroundEditorDiagnosticState(root, diagnostics);
  const source = root && root.querySelector ? getDocsRmtPlaygroundEditorValue(root.querySelector('[data-rmt-playground-editor]')) : '';
  updateDocsRmtPlaygroundIslandState(root, 'diagnostics', 'hydrated', {
    reason: 'diagnostics-render',
    sourceHash: hashDocsRmtPlaygroundSource(source)
  });
}

function updateDocsRmtPlaygroundFromPayload(root, payload, copy) {
  const output = root.querySelector('[data-rmt-playground-output]');
  const preview = root.querySelector('[data-rmt-playground-preview]');
  const diagnostics = Array.isArray(payload && payload.lspDiagnostics) && payload.lspDiagnostics.length
    ? payload.lspDiagnostics
    : payload && payload.diagnostics;
  updateDocsRmtPlaygroundDiagnostics(root, diagnostics, copy);
  if (output) {
    const sourceHash = payload && payload.clientCompile && payload.clientCompile.sourceHash
      ? payload.clientCompile.sourceHash
      : '';
    output.textContent = formatDocsRmtPlaygroundCore(payload || {});
    output.setAttribute('data-output-state', payload && payload.ok === true ? 'compiled' : 'diagnostics');
    if (sourceHash) output.setAttribute('data-source-hash', sourceHash);
    else output.removeAttribute('data-source-hash');
    updateDocsRmtPlaygroundIslandState(root, 'output', payload && payload.ok === true ? 'hydrated' : 'diagnostics', {
      reason: 'compile-response',
      sourceHash
    });
  }
  renderDocsRmtPlaygroundPreview(preview, payload || {}, copy);
  updateDocsRmtPlaygroundIslandState(root, 'preview', payload && payload.ok === true ? 'hydrated' : 'blocked', {
    reason: 'compile-response',
    sourceHash: payload && payload.clientCompile && payload.clientCompile.sourceHash
  });
  hydrateDocsRmtPlaygroundElements(preview);
}

function setDocsRmtPlaygroundWindowBounds(surface, bounds = {}) {
  if (!surface) return;
  const next = {
    x: Math.max(0, Math.round(Number(bounds.x) || 0)),
    y: Math.max(0, Math.round(Number(bounds.y) || 0)),
    width: Math.max(280, Math.round(Number(bounds.width) || 640)),
    height: Math.max(180, Math.round(Number(bounds.height) || 420))
  };
  surface.setAttribute('initial-x', String(next.x));
  surface.setAttribute('initial-y', String(next.y));
  surface.setAttribute('initial-width', String(next.width));
  surface.setAttribute('initial-height', String(next.height));
  surface.style.setProperty('--surface-window-x', `${next.x}px`);
  surface.style.setProperty('--surface-window-y', `${next.y}px`);
  surface.style.setProperty('--surface-window-width', `${next.width}px`);
  surface.style.setProperty('--surface-window-height', `${next.height}px`);
  surface.removeAttribute('minimized');
  surface.removeAttribute('maximized');
  surface.setAttribute('open', '');
}

function setDocsRmtPlaygroundPanelSize(surface, size = {}) {
  if (!surface) return;
  const width = Math.max(240, Math.round(Number(size.width) || 320));
  const height = Math.max(180, Math.round(Number(size.height) || 720));
  surface.setAttribute('initial-width', String(width));
  surface.setAttribute('initial-height', String(height));
  surface.style.setProperty('--side-panel-width', `${width}px`);
  surface.style.setProperty('--side-panel-height', `${height}px`);
  surface.toggleAttribute('collapsed', size.collapsed === true);
  surface.setAttribute('open', '');
}

function resetDocsRmtPlaygroundLayout(root) {
  if (!root) return;
  const manager = root.querySelector('[data-rmt-playground-manager]');
  const rect = manager && typeof manager.getBoundingClientRect === 'function'
    ? manager.getBoundingClientRect()
    : null;
  const width = Math.max(360, Math.round(rect && rect.width || manager && manager.clientWidth || 1280));
  const height = Math.max(520, Math.round(rect && rect.height || manager && manager.clientHeight || 760));
  const gap = 16;
  const compact = width < 1040;
  const editorWidth = compact
    ? Math.min(360, Math.max(300, Math.round(width * 0.42)))
    : Math.min(540, Math.max(400, Math.round(width * 0.32)));
  const relatedWidth = compact
    ? 56
    : Math.min(320, Math.max(260, Math.round(width * 0.2)));
  const workspaceX = editorWidth + gap * 2;
  const workspaceRightInset = relatedWidth + gap * 2;
  const workspaceWidth = Math.max(320, width - workspaceX - workspaceRightInset);
  const workspaceHeight = Math.max(360, height - gap * 2);
  const stackedLower = workspaceWidth < 760;
  const minimumLowerHeight = stackedLower ? 180 + gap + 180 : 180;
  const preferredPreviewHeight = Math.round(workspaceHeight * (stackedLower ? 0.4 : 0.48));
  const previewLimit = Math.max(220, height - gap * 4 - minimumLowerHeight);
  const previewHeight = Math.max(220, Math.min(preferredPreviewHeight, previewLimit));
  const lowerY = gap + previewHeight + gap;
  const lowerHeight = Math.max(180, height - lowerY - gap);
  const outputWidth = stackedLower ? workspaceWidth : Math.max(320, Math.round(workspaceWidth * 0.62));
  const diagnosticsWidth = stackedLower ? workspaceWidth : Math.max(280, workspaceWidth - outputWidth - gap);
  const outputHeight = stackedLower ? Math.max(180, Math.min(Math.round(lowerHeight * 0.52), lowerHeight - gap - 180)) : lowerHeight;
  const diagnosticsY = stackedLower ? lowerY + outputHeight + gap : lowerY;
  const diagnosticsHeight = stackedLower ? Math.max(180, height - diagnosticsY - gap) : lowerHeight;
  const infoWidth = Math.min(460, Math.max(320, Math.round(workspaceWidth * 0.42)));
  const infoHeight = Math.min(360, Math.max(240, Math.round(workspaceHeight * 0.38)));

  setDocsRmtPlaygroundPanelSize(root.querySelector('[data-rmt-playground-editor-panel]'), {
    width: editorWidth,
    height
  });
  setDocsRmtPlaygroundPanelSize(root.querySelector('[data-rmt-playground-related-panel]'), {
    width: relatedWidth,
    height,
    collapsed: compact
  });
  setDocsRmtPlaygroundWindowBounds(root.querySelector('[data-rmt-playground-preview-window]'), {
    x: workspaceX,
    y: gap,
    width: workspaceWidth,
    height: previewHeight
  });
  setDocsRmtPlaygroundWindowBounds(root.querySelector('[data-rmt-playground-output-window]'), {
    x: workspaceX,
    y: lowerY,
    width: outputWidth,
    height: outputHeight
  });
  setDocsRmtPlaygroundWindowBounds(root.querySelector('[data-rmt-playground-diagnostics-window]'), {
    x: stackedLower ? workspaceX : workspaceX + outputWidth + gap,
    y: diagnosticsY,
    width: diagnosticsWidth,
    height: diagnosticsHeight
  });
  setDocsRmtPlaygroundWindowBounds(root.querySelector('[data-rmt-playground-info-window]'), {
    x: compact ? workspaceX + gap : Math.max(workspaceX + gap, width - relatedWidth - infoWidth - gap * 2),
    y: gap * 2,
    width: infoWidth,
    height: infoHeight
  });

  if (manager && typeof manager.resetSurfaceLayout === 'function') {
    manager.resetSurfaceLayout({ source: 'docs.rmt-playground.reset' });
  }
}

async function runDocsRmtPlaygroundLanguageDiagnostics(root, locale = getCurrentDocsLocale()) {
  if (!root) return null;
  const copy = getDocsRmtPlaygroundCopy(locale);
  const editor = root.querySelector('[data-rmt-playground-editor]');
  const diagnostics = root.querySelector('[data-rmt-playground-diagnostics]');
  const source = getDocsRmtPlaygroundEditorValue(editor);
  const requestId = (Number(root.__xtendDocsRmtPlaygroundDiagnosticsRequestId || 0) + 1);
  root.__xtendDocsRmtPlaygroundDiagnosticsRequestId = requestId;

  if (getDocsRmtPlaygroundSourceBytes(source) > DOCS_RMT_PLAYGROUND_MAX_SOURCE_BYTES) {
    const items = [{
      severity: 'error',
      code: 'docs.rmt.playground.source_too_large',
      source: 'xtend-rmt-language-server',
      message: copy.tooLarge
    }];
    updateDocsRmtPlaygroundDiagnostics(root, items, copy);
    return {
      schema: DOCS_RMT_PLAYGROUND_SCHEMA,
      ok: false,
      status: 'too_large',
      diagnostics: items
    };
  }

  if (diagnostics) {
    diagnostics.setAttribute('data-diagnostics-source', 'xtend-rmt-language-server');
    diagnostics.setAttribute('data-diagnostics-state', 'loading');
    updateDocsRmtPlaygroundIslandState(root, 'diagnostics', 'hydrating', {
      reason: 'lsp-diagnostics-request',
      sourceHash: hashDocsRmtPlaygroundSource(source)
    });
    if (!diagnostics.querySelector('.docs-rmt-playground-diagnostic')) {
      diagnostics.replaceChildren(createDocsRmtPlaygroundElement('p', {}, copy.analyzing));
    }
  }

  const response = await fetch(getDocsRmtPlaygroundDiagnosticsEndpoint(), {
    method: 'POST',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      source,
      locale: normalizeDocsLocale(locale),
      version: requestId
    })
  });
  const payload = await response.json();
  if (root.__xtendDocsRmtPlaygroundDiagnosticsRequestId !== requestId) return payload;
  const items = Array.isArray(payload && payload.diagnostics) ? payload.diagnostics : [];
  updateDocsRmtPlaygroundDiagnostics(root, items, copy);
  if (diagnostics) {
    diagnostics.setAttribute('data-diagnostics-state', payload.ok === false ? 'error' : 'ready');
    diagnostics.setAttribute('data-language-mode', payload.languageMode || 'unknown');
  }
  window.xtendDocsRmtPlaygroundLastDiagnostics = {
    schema: DOCS_RMT_PLAYGROUND_SCHEMA,
    locale: normalizeDocsLocale(locale),
    source: 'xtend-rmt-language-server',
    ok: payload.ok === true,
    status: payload.status || '',
    languageMode: payload.languageMode || 'unknown',
    diagnosticCount: items.length
  };
  return payload;
}

async function compileDocsRmtPlayground(root, locale = getCurrentDocsLocale()) {
  if (!root) return null;
  const copy = getDocsRmtPlaygroundCopy(locale);
  const editor = root.querySelector('[data-rmt-playground-editor]');
  const status = root.querySelector('[data-rmt-playground-status]');
  const source = getDocsRmtPlaygroundEditorValue(editor);
  const sourceHash = hashDocsRmtPlaygroundSource(source);
  const requestId = (Number(root.__xtendDocsRmtPlaygroundCompileRequestId || 0) + 1);
  root.__xtendDocsRmtPlaygroundCompileRequestId = requestId;
  if (getDocsRmtPlaygroundSourceBytes(source) > DOCS_RMT_PLAYGROUND_MAX_SOURCE_BYTES) {
    const payload = {
      schema: DOCS_RMT_PLAYGROUND_SCHEMA,
      ok: false,
      status: 'too_large',
      clientCompile: {
        requestId,
        sourceHash,
        sourceBytes: getDocsRmtPlaygroundSourceBytes(source)
      },
      diagnostics: [{
        severity: 'error',
        code: 'docs.rmt.playground.source_too_large',
        message: copy.tooLarge
      }]
    };
    updateDocsRmtPlaygroundFromPayload(root, payload, copy);
    setDocsRmtPlaygroundStatus(status, copy.tooLarge, 'error');
    return payload;
  }

  setDocsRmtPlaygroundStatus(status, copy.compiling, 'loading');
  const response = await fetch(getDocsRmtPlaygroundEndpoint(), {
    method: 'POST',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      source,
      locale: normalizeDocsLocale(locale),
      playgroundMode: DOCS_RMT_PLAYGROUND_MARACA_MODE,
      maraca: {
        orchestration: 'auto',
        kernel: 'auto',
        hydration: 'auto',
        validation: 'auto',
        transitions: 'auto'
      },
      clientCompile: {
        requestId,
        sourceHash
      }
    })
  });
  const payload = await response.json();
  const currentSourceHash = hashDocsRmtPlaygroundSource(getDocsRmtPlaygroundEditorValue(editor));
  if (root.__xtendDocsRmtPlaygroundCompileRequestId !== requestId || currentSourceHash !== sourceHash) {
    return {
      schema: DOCS_RMT_PLAYGROUND_SCHEMA,
      ok: false,
      status: 'stale_compile_ignored',
      ignored: true,
      clientCompile: {
        requestId,
        sourceHash,
        currentSourceHash
      }
    };
  }
  payload.clientCompile = {
    requestId,
    sourceHash,
    sourceBytes: getDocsRmtPlaygroundSourceBytes(source)
  };
  updateDocsRmtPlaygroundFromPayload(root, payload, copy);
  setDocsRmtPlaygroundStatus(status, payload.ok ? copy.compiled : copy.failed, payload.ok ? 'ready' : 'error');
  window.xtendDocsRmtPlaygroundLastCompile = {
    schema: DOCS_RMT_PLAYGROUND_SCHEMA,
    locale: normalizeDocsLocale(locale),
    ok: payload.ok === true,
    status: payload.status || '',
    requestId,
    sourceHash,
    diagnosticCount: Array.isArray(payload.diagnostics) ? payload.diagnostics.length : 0,
    maraca: payload.maraca ? {
      ok: payload.maraca.ok === true,
      status: payload.maraca.status || '',
      summary: payload.maraca.summary || {},
      diagnosticCount: Array.isArray(payload.maraca.diagnostics) ? payload.maraca.diagnostics.length : 0
    } : null
  };
  return payload;
}

function hydrateDocsRmtPlaygroundElements(root, extraTags = []) {
  if (!root || !window.XTendLoader || typeof window.XTendLoader.hydrateTree !== 'function') return;
  const tags = Array.from(new Set([
    ...DOCS_RMT_PLAYGROUND_HYDRATION_TAGS,
    ...(
      Array.isArray(extraTags)
        ? extraTags.map((tag) => String(tag || '').toLowerCase()).filter(Boolean)
        : []
    )
  ]));
  window.XTendLoader.hydrateTree(root, {
    tags,
    source: 'docs.rmt-playground',
    reason: 'rmt-playground-route-render',
    schedule: 'docs.rmt-playground.hydrate'
  }).catch(() => {});
}

async function prepareDocsRmtPlaygroundLayoutElements() {
  const loader = window.XTendLoader;
  if (!loader || typeof loader.ensureComponent !== 'function' || !window.customElements) return false;
  const results = await Promise.all(DOCS_RMT_PLAYGROUND_LAYOUT_TAGS.map((tag) => (
    loader.ensureComponent(tag, {
      source: 'docs.rmt-playground',
      reason: 'rmt-playground-layout-before-commit',
      schedule: 'docs.rmt-playground.hydrate'
    }).catch(() => false)
  )));
  return results.every(Boolean) && DOCS_RMT_PLAYGROUND_LAYOUT_TAGS.every((tag) => Boolean(customElements.get(tag)));
}

function getDocsRmtPlaygroundPresetLabel(id, locale = getCurrentDocsLocale()) {
  const labels = {
    de: {
      minimal: 'Minimal RMT',
      'kernel-form': 'Kernel Form',
      transitions: 'Transitions',
      'customer-service-kernel': 'Customer Service Kernel'
    },
    en: {
      minimal: 'Minimal RMT',
      'kernel-form': 'Kernel Form',
      transitions: 'Transitions',
      'customer-service-kernel': 'Customer Service Kernel'
    }
  };
  const copy = labels[normalizeDocsLocale(locale)] || labels.en;
  return copy[id] || id;
}

async function loadDocsRmtPlaygroundPreset(id) {
  const preset = DOCS_RMT_PLAYGROUND_PRESETS.find((entry) => entry.id === id) || DOCS_RMT_PLAYGROUND_PRESETS[0];
  if (preset.source) return preset;
  const response = await fetch(getDocsRmtPlaygroundPresetEndpoint(preset.endpoint || preset.id), {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Accept: 'application/json'
    }
  });
  const payload = await response.json();
  if (!payload || payload.ok !== true || typeof payload.source !== 'string') {
    throw new Error(payload && payload.diagnostics && payload.diagnostics[0] && payload.diagnostics[0].message || 'Preset unavailable.');
  }
  return {
    ...preset,
    source: payload.source,
    filePath: payload.sourcePath || preset.filePath
  };
}

function renderDocsRmtPlayground(container, locale = getCurrentDocsLocale(), relatedLinks = []) {
  if (!container) return null;
  const existing = container.querySelector('[data-rmt-playground-root]');
  if (existing) {
    if (typeof existing.__xtendDocsDispose === 'function') existing.__xtendDocsDispose();
    existing.remove();
  }
  const articleFragment = document.createDocumentFragment();
  Array.from(container.childNodes).forEach((node) => {
    if (node.nodeType === 1 && node.matches && node.matches('[data-rmt-playground-root]')) return;
    articleFragment.appendChild(node.cloneNode(true));
  });
  const copy = getDocsRmtPlaygroundCopy(locale);
  const root = createDocsRmtPlaygroundElement('section', {
    class: 'docs-rmt-playground',
    'data-rmt-playground-root': '',
    'data-schema': DOCS_RMT_PLAYGROUND_SCHEMA,
    'aria-label': copy.workbench
  });

  const manager = createDocsRmtPlaygroundElement('x-surface-manager', {
    class: 'docs-rmt-playground-manager',
    'manager-id': 'docs-rmt-playground-workspace',
    'data-rmt-playground-manager': '',
    'data-rmt-hydration-islands': Object.values(DOCS_RMT_PLAYGROUND_ISLANDS).map((island) => island.id).join(' '),
    'data-fabric-lanes': Object.values(DOCS_RMT_PLAYGROUND_ISLANDS).map((island) => island.lane).join(' '),
    'data-rmt-cross-surface-events': 'source-changed island-state-changed',
    'surface-skeleton': 'false',
    'surface-layout-gap': '16',
    'surface-layout-snap': '8'
  });

  const editorPanel = createDocsRmtPlaygroundElement('x-side-panel', decorateDocsRmtPlaygroundIslandAttributes({
    slot: 'panels',
    'surface-id': 'docs.rmt.playground.editor',
    label: copy.editor,
    placement: 'left',
    mode: 'docked',
    resizable: true,
    open: true,
    'data-rmt-playground-editor-panel': ''
  }, 'editor'));
  const editorBody = createDocsRmtPlaygroundElement('div', { class: 'docs-rmt-playground-editor' });
  const editor = createDocsRmtPlaygroundElement('x-textarea', {
    label: copy.editor,
    rows: 22,
    fill: true,
    density: 'compact',
    'syntax-highlight': true,
    'line-numbering': 'true',
    lang: 'rmt',
    maxlength: DOCS_RMT_PLAYGROUND_MAX_SOURCE_BYTES,
    'data-rmt-playground-editor': ''
  });
  setDocsRmtPlaygroundEditorValue(editor, DOCS_RMT_PLAYGROUND_DEFAULT_SOURCE);
  const templateBar = createDocsRmtPlaygroundElement('div', {
    class: 'docs-rmt-playground-template-bar',
    'data-rmt-playground-template-bar': ''
  });
  const presetSelect = createDocsRmtPlaygroundElement('x-select', {
    label: copy.preset,
    value: 'minimal',
    density: 'compact',
    'data-rmt-playground-preset': ''
  });
  DOCS_RMT_PLAYGROUND_PRESETS.forEach((preset) => {
    presetSelect.appendChild(createDocsRmtPlaygroundElement('option', {
      value: preset.id,
      selected: preset.id === 'minimal'
    }, getDocsRmtPlaygroundPresetLabel(preset.id, locale)));
  });
  const actions = createDocsRmtPlaygroundElement('div', { class: 'docs-rmt-playground-actions' });
  const runButton = createDocsRmtPlaygroundButton(copy.run, 'play', {
    type: 'button',
    variant: 'primary',
    'data-rmt-playground-run': ''
  });
  const resetButton = createDocsRmtPlaygroundButton(copy.resetLayout, 'rotate-ccw', {
    type: 'button',
    variant: 'secondary',
    'data-rmt-playground-reset': ''
  });
  const status = createDocsRmtPlaygroundElement('span', {
    class: 'docs-rmt-playground-status',
    'data-rmt-playground-status': ''
  }, copy.ready);
  templateBar.appendChild(presetSelect);
  actions.appendChild(runButton);
  actions.appendChild(resetButton);
  actions.appendChild(status);
  editorBody.appendChild(templateBar);
  editorBody.appendChild(editor);
  editorBody.appendChild(actions);
  editorPanel.appendChild(editorBody);

  const previewWindow = createDocsRmtPlaygroundElement('x-surface-window', decorateDocsRmtPlaygroundIslandAttributes({
    slot: 'windows',
    'surface-id': 'docs.rmt.playground.preview',
    label: copy.preview,
    draggable: true,
    resizable: true,
    open: true,
    'data-rmt-playground-preview-window': ''
  }, 'preview'));
  previewWindow.appendChild(createDocsRmtPlaygroundElement('div', {
    class: 'docs-rmt-playground-preview',
    'data-rmt-playground-preview': ''
  }, copy.blocked));

  const diagnosticsWindow = createDocsRmtPlaygroundElement('x-surface-window', decorateDocsRmtPlaygroundIslandAttributes({
    slot: 'windows',
    'surface-id': 'docs.rmt.playground.diagnostics',
    label: copy.diagnostics,
    draggable: true,
    resizable: true,
    open: true,
    'data-rmt-playground-diagnostics-window': ''
  }, 'diagnostics'));
  diagnosticsWindow.appendChild(createDocsRmtPlaygroundElement('div', {
    class: 'docs-rmt-playground-diagnostics',
    'data-rmt-playground-diagnostics': ''
  }, copy.noDiagnostics));

  const outputWindow = createDocsRmtPlaygroundElement('x-surface-window', decorateDocsRmtPlaygroundIslandAttributes({
    slot: 'windows',
    'surface-id': 'docs.rmt.playground.output',
    label: copy.output,
    draggable: true,
    resizable: true,
    open: true,
    'data-rmt-playground-output-window': ''
  }, 'output'));
  outputWindow.appendChild(createDocsRmtPlaygroundElement('pre', {
    class: 'docs-rmt-playground-output',
    'data-rmt-playground-output': ''
  }, '{}'));

  const infoWindow = createDocsRmtPlaygroundElement('x-surface-window', {
    slot: 'windows',
    'surface-id': 'docs.rmt.playground.guide',
    label: copy.info,
    draggable: true,
    resizable: true,
    open: true,
    'data-rmt-playground-info-window': ''
  });
  const infoBody = createDocsRmtPlaygroundElement('div', {
    class: 'docs-rmt-playground-article',
    'data-rmt-playground-article': ''
  });
  if (articleFragment.childNodes.length) {
    infoBody.appendChild(articleFragment);
  } else {
    infoBody.appendChild(createDocsRmtPlaygroundElement('p', {}, copy.title));
  }
  infoWindow.appendChild(infoBody);

  const relatedPanel = createDocsRmtPlaygroundElement('x-side-panel', {
    slot: 'panels',
    'surface-id': 'docs.rmt.playground.related',
    label: copy.related,
    placement: 'right',
    mode: 'docked',
    resizable: true,
    open: true,
    'data-rmt-playground-related-panel': ''
  });
  const relatedBody = createDocsRmtPlaygroundElement('div', {
    class: 'docs-rmt-playground-related',
    'data-rmt-playground-related': ''
  });
  const relatedList = createDocsRmtPlaygroundElement('div', { class: 'docs-related-list' });
  const links = Array.isArray(relatedLinks) && relatedLinks.length ? relatedLinks : mergeDocsRelatedLinks('learn-rmt-playground');
  links.forEach((entry) => relatedList.appendChild(createRelatedLink(entry)));
  if (links.length) {
    relatedBody.appendChild(relatedList);
  } else {
    relatedBody.appendChild(createDocsRmtPlaygroundElement('p', {
      class: 'docs-rmt-playground-empty-related'
    }, copy.noRelated));
  }
  relatedPanel.appendChild(relatedBody);

  manager.appendChild(editorPanel);
  manager.appendChild(previewWindow);
  manager.appendChild(outputWindow);
  manager.appendChild(diagnosticsWindow);
  manager.appendChild(infoWindow);
  manager.appendChild(relatedPanel);
  root.appendChild(manager);
  container.replaceChildren(root);

  let compileDisposer = null;
  let diagnosticsDisposer = null;
  const lifecycleDisposers = [];
  const cancelScheduledWork = () => {
    if (compileDisposer) compileDisposer();
    if (diagnosticsDisposer) diagnosticsDisposer();
    compileDisposer = null;
    diagnosticsDisposer = null;
  };
  const scheduleDiagnostics = () => {
    if (diagnosticsDisposer) diagnosticsDisposer();
    diagnosticsDisposer = docsBrowserScheduler.scheduleEndpoint('docs.playground.diagnostics', window.location.pathname, () => {
      diagnosticsDisposer = null;
      runDocsRmtPlaygroundLanguageDiagnostics(root, locale).catch((error) => {
        updateDocsRmtPlaygroundDiagnostics(root, [{
          severity: 'error',
          code: 'docs.rmt.playground.lsp_client_error',
          source: 'xtend-rmt-language-server',
          message: error && error.message ? error.message : copy.failed
        }], copy);
      });
    }, { kind: 'delay', delayMs: DOCS_RMT_PLAYGROUND_DIAGNOSTIC_DEBOUNCE_MS });
  };
  const scheduleCompile = () => {
    setDocsRmtPlaygroundOutputPending(root, getDocsRmtPlaygroundEditorValue(editor), copy);
    setDocsRmtPlaygroundStatus(status, copy.compiling, 'loading');
    if (compileDisposer) compileDisposer();
    compileDisposer = docsBrowserScheduler.scheduleEndpoint('docs.playground.compile', window.location.pathname, () => {
      compileDisposer = null;
      compileDocsRmtPlayground(root, locale).catch((error) => {
        const payload = {
          schema: DOCS_RMT_PLAYGROUND_SCHEMA,
          ok: false,
          status: 'client_error',
          diagnostics: [{
            severity: 'error',
            code: 'docs.rmt.playground.client_error',
            message: error && error.message ? error.message : copy.failed
          }]
        };
        updateDocsRmtPlaygroundFromPayload(root, payload, copy);
        setDocsRmtPlaygroundStatus(status, copy.failed, 'error');
      });
    }, { kind: 'delay', delayMs: DOCS_RMT_PLAYGROUND_DEBOUNCE_MS });
  };
  lifecycleDisposers.push(bindDocsLifecycle(editor, 'textarea-changed', (event) => {
    if (event && event.detail && typeof event.detail.value === 'string') {
      setDocsRmtPlaygroundEditorValue(editor, event.detail.value);
    }
    dispatchDocsRmtPlaygroundSourceChanged(root, getDocsRmtPlaygroundEditorValue(editor), 'textarea-changed');
    scheduleDiagnostics();
    scheduleCompile();
  }));
  lifecycleDisposers.push(bindDocsLifecycle(editor, 'input', (event) => {
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    const control = path.find((node) => node && node.localName === 'textarea') || getDocsRmtPlaygroundNativeTextarea(editor);
    if (control && editor.shadowRoot && editor.shadowRoot.contains(control)) return;
    if (control && typeof control.value === 'string') {
      setDocsRmtPlaygroundEditorValue(editor, control.value);
    }
    dispatchDocsRmtPlaygroundSourceChanged(root, getDocsRmtPlaygroundEditorValue(editor), 'native-input');
    scheduleDiagnostics();
    scheduleCompile();
  }));
  lifecycleDisposers.push(bindDocsLifecycle(runButton, 'click', () => {
    cancelScheduledWork();
    setDocsRmtPlaygroundOutputPending(root, getDocsRmtPlaygroundEditorValue(editor), copy);
    runDocsRmtPlaygroundLanguageDiagnostics(root, locale).catch(() => {});
    compileDocsRmtPlayground(root, locale).catch(() => setDocsRmtPlaygroundStatus(status, copy.failed, 'error'));
  }));
  const applyPresetSelection = (presetId) => {
    cancelScheduledWork();
    setDocsRmtPlaygroundStatus(status, copy.compiling, 'loading');
    loadDocsRmtPlaygroundPreset(presetId || presetSelect.value)
      .then((preset) => {
        if (preset && preset.id) presetSelect.value = preset.id;
        setDocsRmtPlaygroundEditorValue(editor, preset.source || DOCS_RMT_PLAYGROUND_DEFAULT_SOURCE);
        dispatchDocsRmtPlaygroundSourceChanged(root, getDocsRmtPlaygroundEditorValue(editor), `preset:${preset.id}`);
        setDocsRmtPlaygroundOutputPending(root, getDocsRmtPlaygroundEditorValue(editor), copy);
        return Promise.all([
          runDocsRmtPlaygroundLanguageDiagnostics(root, locale).catch(() => null),
          compileDocsRmtPlayground(root, locale)
        ]);
      })
      .catch((error) => {
        const payload = {
          schema: DOCS_RMT_PLAYGROUND_SCHEMA,
          ok: false,
          status: 'preset_error',
          diagnostics: [{
            severity: 'error',
            code: 'docs.rmt.playground.preset_error',
            message: error && error.message ? error.message : copy.failed
          }]
        };
        updateDocsRmtPlaygroundFromPayload(root, payload, copy);
        setDocsRmtPlaygroundStatus(status, copy.failed, 'error');
      });
  };
  lifecycleDisposers.push(bindDocsLifecycle(presetSelect, 'select-changed', (event) => {
    applyPresetSelection(event && event.detail && event.detail.value ? event.detail.value : presetSelect.value);
  }));
  lifecycleDisposers.push(bindDocsLifecycle(presetSelect, 'change', () => {
    applyPresetSelection(presetSelect.value);
  }));
  lifecycleDisposers.push(bindDocsLifecycle(resetButton, 'click', () => {
    resetDocsRmtPlaygroundLayout(root);
  }));
  root.__xtendDocsDispose = () => {
    cancelScheduledWork();
    lifecycleDisposers.splice(0).forEach((dispose) => dispose());
    const runtime = root.__xtendDocsMaracaPlanRuntime;
    if (runtime && typeof runtime.dispose === 'function') runtime.dispose();
  };
  hydrateDocsRmtPlaygroundElements(root);
  resetDocsRmtPlaygroundLayout(root);
  scheduleDocsAfterPaint(() => resetDocsRmtPlaygroundLayout(root));
  runDocsRmtPlaygroundLanguageDiagnostics(root, locale).catch(() => {});
  compileDocsRmtPlayground(root, locale).catch(() => setDocsRmtPlaygroundStatus(status, copy.failed, 'error'));
  return root;
}

function docsAnimationEngineDemoCopy(locale = getCurrentDocsLocale()) {
  return normalizeDocsLocale(locale) === 'de'
    ? {
        title: 'AnimationEngine ausprobieren',
        label: 'Interaktive AnimationEngine-Demo',
        loading: 'Steuerung wird nach dem Artikelinhalt geladen',
        unavailable: 'Die interaktive Demo ist nicht verfügbar. Der Artikel und seine Beispiele bleiben vollständig nutzbar.'
      }
    : {
        title: 'Try AnimationEngine',
        label: 'Interactive AnimationEngine demo',
        loading: 'Controls load after the article content',
        unavailable: 'The interactive demo is unavailable. The article and its examples remain fully usable.'
      };
}

function createDocsAnimationEngineDemoSkeleton(locale = getCurrentDocsLocale()) {
  const copy = docsAnimationEngineDemoCopy(locale);
  const root = document.createElement('section');
  root.id = 'docs-animation-engine-demo';
  root.className = 'docs-animation-engine-demo';
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', copy.label);
  root.setAttribute('aria-busy', 'true');
  root.setAttribute('tabindex', '0');
  root.setAttribute('data-docs-animation-engine-demo', '');
  root.setAttribute('data-schema', DOCS_ANIMATION_ENGINE_DEMO_SCHEMA);
  root.setAttribute('data-rmt-hydration-island', 'docs.rmt.animation-engine.demo');
  root.setAttribute('data-rmt-hydration-state', 'skeleton');
  root.setAttribute('data-rmt-surface-role', 'controls');
  root.setAttribute('data-fabric-lane', 'idle');
  root.setAttribute('data-rmt-hydrate-schedule', DOCS_ANIMATION_ENGINE_DEMO_SCHEDULE);
  root.setAttribute('data-xtend-layout-reserve', 'demo');
  root.setAttribute('data-xtend-cls-anchor', 'docs.animation-engine.demo');

  const heading = document.createElement('h2');
  heading.className = 'docs-animation-engine-demo-heading';
  heading.textContent = copy.title;
  const controls = document.createElement('div');
  controls.className = 'docs-animation-engine-demo-skeleton-controls';
  controls.setAttribute('aria-hidden', 'true');
  controls.setAttribute('data-slot-layout', 'fixed-responsive-grid');
  const createSlot = (name, content) => {
    const slot = document.createElement('div');
    slot.className = 'docs-animation-engine-demo-control-slot';
    slot.setAttribute('data-slot', name);
    slot.setAttribute('data-rmt-slot', `docs.animation-engine.demo.controls.${name}`);
    slot.appendChild(content);
    return slot;
  };
  ['effect', 'duration', 'easing', 'motion'].forEach((name) => {
    const field = document.createElement('span');
    field.className = 'docs-animation-engine-demo-skeleton-field';
    controls.appendChild(createSlot(name, field));
  });
  const action = document.createElement('span');
  action.className = 'docs-animation-engine-demo-skeleton-action';
  const status = document.createElement('span');
  status.className = 'docs-animation-engine-demo-skeleton-status';
  controls.append(createSlot('replay', action), createSlot('status', status));
  const loading = document.createElement('span');
  loading.className = 'docs-animation-engine-demo-assistive';
  loading.textContent = copy.loading;
  root.append(heading, controls, loading);
  return root;
}

function reconcileDocsAnimationEngineDemoSlot(article, mdContent, slug, locale) {
  if (!article || !mdContent) return null;
  const existing = article.querySelector('[data-docs-animation-engine-demo]');
  if (existing && existing.__xtendDocsAnimationEngineDemo && typeof existing.__xtendDocsAnimationEngineDemo.dispose === 'function') {
    existing.__xtendDocsAnimationEngineDemo.dispose();
  }
  if (existing) existing.remove();
  if (slug !== DOCS_ANIMATION_ENGINE_DEMO_SLUG) return null;
  const root = createDocsAnimationEngineDemoSkeleton(locale);
  article.insertBefore(root, mdContent);
  return root;
}

function docsAnimationEngineSameOriginUrl(relativePath) {
  const url = new URL(relativePath, window.location.origin);
  if (url.origin !== window.location.origin) throw new Error('AnimationEngine demo assets must use the inspected docs origin.');
  return url;
}

function loadDocsAnimationEngineDemoModule() {
  if (!docsAnimationEngineDemoModulePromise) {
    const moduleUrl = docsAnimationEngineSameOriginUrl(DOCS_ANIMATION_ENGINE_DEMO_MODULE);
    docsAnimationEngineDemoModulePromise = import(moduleUrl.href).catch((error) => {
      docsAnimationEngineDemoModulePromise = null;
      throw error;
    });
  }
  return docsAnimationEngineDemoModulePromise;
}

function loadDocsAnimationEngineDemoArtifact() {
  if (!docsAnimationEngineDemoArtifactPromise) {
    const artifactUrl = docsAnimationEngineSameOriginUrl(DOCS_ANIMATION_ENGINE_DEMO_ARTIFACT);
    docsAnimationEngineDemoArtifactPromise = fetch(artifactUrl.href, {
      method: 'GET',
      cache: 'force-cache',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    }).then(async (response) => {
      if (!response.ok) throw new Error(`AnimationEngine demo plan returned ${response.status}.`);
      const artifact = await response.json();
      if (!artifact || artifact.schema !== DOCS_ANIMATION_ENGINE_DEMO_SCHEMA) {
        throw new Error(`AnimationEngine demo plan must use ${DOCS_ANIMATION_ENGINE_DEMO_SCHEMA}.`);
      }
      return artifact;
    }).catch((error) => {
      docsAnimationEngineDemoArtifactPromise = null;
      throw error;
    });
  }
  return docsAnimationEngineDemoArtifactPromise;
}

function renderDocsAnimationEngineDemoFailure(root, locale, error) {
  if (!root) return;
  const copy = docsAnimationEngineDemoCopy(locale);
  const heading = document.createElement('h2');
  heading.className = 'docs-animation-engine-demo-heading';
  heading.textContent = copy.title;
  const message = document.createElement('p');
  message.textContent = copy.unavailable;
  const diagnostic = document.createElement('code');
  diagnostic.textContent = error && error.message ? error.message : String(error || 'AnimationEngine demo unavailable');
  root.replaceChildren(heading, message, diagnostic);
  root.removeAttribute('tabindex');
  root.setAttribute('aria-busy', 'false');
  root.setAttribute('data-rmt-hydration-state', 'degraded');
  root.setAttribute('data-animation-engine-ready', 'false');
}

function scheduleDocsAnimationEngineDemoHydration(options = {}) {
  const root = options.root;
  const target = options.target;
  const locale = options.locale || getCurrentDocsLocale();
  if (!root || !target) return () => {};
  let disposed = false;
  let controller = null;
  let observer = null;
  let layoutShiftObserver = null;
  let idleDisposer = null;
  let loadPromise = null;
  let cumulativeLayoutShift = 0;
  let replayLayoutShift = 0;
  let consoleErrorCount = 0;
  const captureLayoutShiftDiagnostics = new URL(window.location.href).searchParams.get('animation-engine-smoke') === '1';
  if (captureLayoutShiftDiagnostics) root.__xtendDocsAnimationEngineLayoutShifts = [];
  const updateConsoleErrors = () => {
    consoleErrorCount += 1;
    root.setAttribute('data-console-errors', String(consoleErrorCount));
  };
  root.setAttribute('data-console-errors', '0');
  root.setAttribute('data-demo-cls', '0');
  root.setAttribute('data-demo-replay-cls', '0');
  const disposeConsoleError = bindDocsLifecycle(window, 'error', updateConsoleErrors);
  const disposeConsoleRejection = bindDocsLifecycle(window, 'unhandledrejection', updateConsoleErrors);
  if (typeof PerformanceObserver === 'function') {
    try {
      layoutShiftObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.hadRecentInput) return;
          const value = Number(entry.value) || 0;
          cumulativeLayoutShift += value;
          if (root.hasAttribute('data-replay-layout-stage')) {
            replayLayoutShift += value;
            root.setAttribute('data-demo-replay-cls', String(Math.round(replayLayoutShift * 100000) / 100000));
          }
          if (captureLayoutShiftDiagnostics) {
            root.__xtendDocsAnimationEngineLayoutShifts.push({
              value,
              replayStage: root.getAttribute('data-replay-layout-stage') || '',
              sources: Array.from(entry.sources || []).map((source) => {
                const node = source && source.node;
                const nodeRoot = node && typeof node.getRootNode === 'function' ? node.getRootNode() : null;
                return {
                  tag: node && node.localName || '',
                  id: node && node.id || '',
                  className: node && typeof node.className === 'string' ? node.className : '',
                  rootHost: nodeRoot && nodeRoot.host && nodeRoot.host.localName || '',
                  previous: source && source.previousRect
                    ? { x: source.previousRect.x, y: source.previousRect.y, width: source.previousRect.width, height: source.previousRect.height }
                    : null,
                  current: source && source.currentRect
                    ? { x: source.currentRect.x, y: source.currentRect.y, width: source.currentRect.width, height: source.currentRect.height }
                    : null
                };
              })
            });
          }
        });
        root.setAttribute('data-demo-cls', String(Math.round(cumulativeLayoutShift * 100000) / 100000));
      });
      layoutShiftObserver.observe({ type: 'layout-shift', buffered: false });
    } catch (error) {
      layoutShiftObserver = null;
    }
  }

  const hydrate = (reason = 'visible-idle') => {
    if (disposed || loadPromise) return loadPromise;
    if (observer) observer.disconnect();
    if (idleDisposer) {
      idleDisposer();
      idleDisposer = null;
    }
    root.setAttribute('data-rmt-hydration-state', 'loading');
    root.setAttribute('data-demo-load-reason', reason);
    root.setAttribute('data-demo-requested-at', String(docsPerfNow()));
    const skeletonHeight = root.getBoundingClientRect().height;
    root.setAttribute('data-demo-skeleton-height', String(Math.round(skeletonHeight * 100) / 100));
    loadPromise = Promise.all([
      loadDocsAnimationEngineDemoModule(),
      loadDocsAnimationEngineDemoArtifact()
    ]).then(([moduleApi, artifact]) => {
      if (disposed || !root.isConnected) return null;
      return moduleApi.hydrateDocsAnimationEngineDemo({ root, target, artifact, locale });
    }).then((value) => {
      if (disposed || !value) return null;
      controller = value;
      const hydratedHeight = root.getBoundingClientRect().height;
      const targetRect = target.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      root.setAttribute('data-demo-hydrated-height', String(Math.round(hydratedHeight * 100) / 100));
      root.setAttribute('data-demo-geometry-stable', String(Math.abs(hydratedHeight - skeletonHeight) <= 8));
      root.setAttribute('data-demo-content-overlap', String(rootRect.bottom > targetRect.top + 1));
      root.setAttribute('data-demo-hydrated-at', String(docsPerfNow()));
      dispatchDocsLaneComplete({
        lane: 'idle',
        schedule: DOCS_ANIMATION_ENGINE_DEMO_SCHEDULE,
        operation: 'animation-engine-demo.hydrated',
        hydrationIsland: 'docs.rmt.animation-engine.demo',
        surfaceId: 'docs.animation.engine.demo',
        reason
      });
      return value;
    }).catch((error) => {
      if (!disposed) {
        renderDocsAnimationEngineDemoFailure(root, locale, error);
        dispatchDocsLaneComplete({
          lane: 'idle',
          schedule: DOCS_ANIMATION_ENGINE_DEMO_SCHEDULE,
          operation: 'animation-engine-demo.degraded',
          hydrationIsland: 'docs.rmt.animation-engine.demo',
          surfaceId: 'docs.animation.engine.demo',
          reason: error && error.message ? error.message : String(error)
        });
      }
      return null;
    });
    return loadPromise;
  };

  const queueIdleHydration = () => {
    if (disposed || loadPromise || idleDisposer) return;
    root.setAttribute('data-rmt-hydration-state', 'queued');
    idleDisposer = scheduleDocsIdle(() => hydrate('visible-idle'));
  };
  const requestImmediateHydration = () => hydrate('user-intent');
  const disposePointerHydration = bindDocsLifecycle(root, 'pointerdown', requestImmediateHydration, { once: true });
  const disposeFocusHydration = bindDocsLifecycle(root, 'focusin', requestImmediateHydration, { once: true });

  if (typeof IntersectionObserver === 'function') {
    observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting || entry.intersectionRatio > 0)) queueIdleHydration();
    }, { root: null, rootMargin: '160px', threshold: 0 });
    observer.observe(root);
  } else {
    queueIdleHydration();
  }

  return () => {
    disposed = true;
    if (observer) observer.disconnect();
    if (layoutShiftObserver) layoutShiftObserver.disconnect();
    if (idleDisposer) idleDisposer();
    disposeConsoleError();
    disposeConsoleRejection();
    disposePointerHydration();
    disposeFocusHydration();
    if (controller && typeof controller.dispose === 'function') controller.dispose();
  };
}

function resolveDocsSlugFromRouteContext(context = {}) {
  const explicit = context.slug || context.path || context.to || '';
  const parsed = parseDocsRoutePath(explicit ? String(explicit) : undefined);
  publishDocsLocale(parsed.locale, parsed.localized ? 'route' : 'compat-route');
  let slug = parsed.slug || 'readme';
  if (slug === '' || slug === '/') slug = 'readme';
  slug = resolveCanonicalDocsSlug(slug);
  if (!parsed.localized) {
    const localizedPath = getLocalizedDocsPath(slug, parsed.locale);
    if (normalizeDocsPathForCompare(location.pathname) !== normalizeDocsPathForCompare(localizedPath)) {
      history.replaceState(history.state || null, '', localizedPath);
    }
  }
  return slug;
}

class XtendDocPage extends HTMLElement {
  constructor() {
    super();
    this.__xtendDocsShell = null;
    this.__xtendDocsRouteToken = 0;
    this.__xtendDocsScheduledDisposers = [];
  }

  connectedCallback() {
    if (this.hasAttribute('data-xrouter-adoption-pending')) return;
    this.renderRoute({ source: 'connected-callback' });
  }

  disconnectedCallback() {
    this.cancelScheduledRouteWork();
  }

  updateRoute(context = {}) {
    return this.renderRoute({ ...context, source: context.source || 'x-router-reuse' });
  }

  adoptRoute(context = {}) {
    this.removeAttribute('data-xrouter-adoption-pending');
    return this.renderRoute({ ...context, adopted: true, reused: true, source: 'x-router-adoption' });
  }

  cancelScheduledRouteWork() {
    this.__xtendDocsScheduledDisposers.splice(0).forEach((dispose) => {
      if (typeof dispose === 'function') dispose();
    });
  }

  scheduleRouteWork(dispose) {
    if (typeof dispose === 'function') this.__xtendDocsScheduledDisposers.push(dispose);
  }

  isActiveRouteToken(token) {
    return this.isConnected && this.__xtendDocsRouteToken === token;
  }

  ensureRouteShell(slug, rmtMeta) {
    if (!this.__xtendDocsShell) {
      const ssrPrehydration = getDocsSsrPrehydration();
      const documentPrehydrated = Boolean(
        ssrPrehydration
        && ssrPrehydration.schema === 'xtend.docs.php-ssr-prehydration.v2'
        && ssrPrehydration.document
        && ssrPrehydration.document.htmlAlreadyInDom === true
      );
      const prehydratedShell = ssrPrehydration && (ssrPrehydration.ok !== false || documentPrehydrated)
        ? adoptPrehydratedDocsShell(findPrehydratedDocsShell(this, slug), rmtMeta)
        : null;
      if (prehydratedShell) {
        this.__xtendDocsShell = prehydratedShell;
        this.setAttribute('data-docs-shell-reused', 'ssr');
        this.setAttribute('data-rmt-ssr-reused', 'true');
        return this.__xtendDocsShell;
      }
      this.__xtendDocsShell = createRmtDocsShell(slug, rmtMeta);
      this.replaceChildren(this.__xtendDocsShell.section);
      this.setAttribute('data-docs-shell-reused', 'false');
      return this.__xtendDocsShell;
    }
    this.setAttribute('data-docs-shell-reused', 'true');
    return this.__xtendDocsShell;
  }

  renderRoute(context = {}) {
    this.cancelScheduledRouteWork();
    const token = this.__xtendDocsRouteToken + 1;
    this.__xtendDocsRouteToken = token;

    const slug = resolveDocsSlugFromRouteContext(context);
    const locale = getCurrentDocsLocale();
    syncLegacyDocsGlobals(locale, { slug });
    const pendingLocaleRoute = window.__xtendDocsPendingLocaleRoute;
    const localeRouteFastPath = context.source === 'locale-change' || Boolean(
      pendingLocaleRoute &&
      pendingLocaleRoute.slug === slug &&
      pendingLocaleRoute.targetLocale === locale &&
      docsPerfNow() - Number(pendingLocaleRoute.startedAtMs || 0) < 8000
    );
    if (localeRouteFastPath) {
      window.__xtendDocsPendingLocaleRoute = null;
    }
    const docsRouteStartedAt = new Date().toISOString();
    const routePerfStartedAt = docsPerfNow();
    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reused = context.source === 'x-router-reuse' || context.source === 'locale-change' || context.reused === true;

    this.setAttribute('data-docs-route-state', reducedMotion ? 'ready' : 'loading');
    this.setAttribute('data-docs-route-slug', slug);
    this.setAttribute('data-docs-route-locale', locale);
    this.setAttribute('data-docs-route-reused', reused ? 'true' : 'false');
    this.setAttribute('aria-busy', 'true');
    ensureDocsShellScopedStyles(this.getRootNode());

    const rmtMeta = getDocsPageMeta(slug, locale) || {};
    const hadShell = Boolean(this.__xtendDocsShell);
    const shell = this.ensureRouteShell(slug, rmtMeta);
    applyRmtPageMetadata(shell.section, shell.mdContent, shell.richSlot, shell.diagnosticsSlot, rmtMeta, shell.sidebar, shell.relatedSlot, shell.demoSlot);
    wireDownloadButton(shell.download, slug);
    const animationEngineDemoRoot = reconcileDocsAnimationEngineDemoSlot(shell.article, shell.mdContent, slug, locale);

    const parseSchedule = rmtMeta.schedules && rmtMeta.schedules.parse ? rmtMeta.schedules.parse : 'docs.markdown.parse';
    const routeSchedule = rmtMeta.schedules && rmtMeta.schedules.route ? rmtMeta.schedules.route : 'docs.route.render';
    const hydrateSchedule = rmtMeta.schedules && rmtMeta.schedules.hydrate ? rmtMeta.schedules.hydrate : 'docs.page.hydrate';
    const shellSchedule = rmtMeta.schedules && rmtMeta.schedules.shell ? rmtMeta.schedules.shell : 'docs.shell.render';
    const richSchedule = rmtMeta.schedules && rmtMeta.schedules.rich ? rmtMeta.schedules.rich : 'docs.rich-content.prepare';
    const mediaSchedule = rmtMeta.schedules && rmtMeta.schedules.media ? rmtMeta.schedules.media : 'docs.media.lazy';
    const diagnosticsSchedule = rmtMeta.schedules && rmtMeta.schedules.diagnostics ? rmtMeta.schedules.diagnostics : DOCS_RMT_DEFAULT_DIAGNOSTICS_SCHEDULE;
    const relatedSchedule = 'docs.related.prepare';
    const demoSchedule = 'docs.demo.prepare';
    const laneDurations = [];

    const measuredLane = (lane, schedule, operation, callback) => runDocsMeasuredLane({
      slug,
      lane,
      schedule,
      operation,
      routeRef: rmtMeta.routeId || ('docs.' + slug.replace(/-/g, '.')),
      routeToken: token,
      reused
    }, () => {
      const startedAt = docsPerfNow();
      const result = callback();
      laneDurations.push({ lane, schedule, operation, durationMs: docsRoundDuration(docsPerfNow() - startedAt) });
      return result;
    });

    window.xtendDocsRmtLastRender = {
      schema: DOCS_RMT_RENDER_SCHEMA,
      slug,
      locale,
      shellFirst: true,
      shellReused: hadShell,
      shellPrehydrated: Boolean(shell && shell.prehydrated),
      phpSsrPrehydration: getDocsSsrPrehydration(),
      routeReuse: reused,
      insularHydration: true,
      productionHardeningSchema: DOCS_RMT_PRODUCTION_HARDENING_SCHEMA,
      shellTemplate: rmtMeta.shellTemplate || DOCS_RMT_DEFAULT_SHELL_TEMPLATE,
      shellSchedule,
      shellEndpoint: getRmtSchedule(shellSchedule) ? getRmtSchedule(shellSchedule).endpointName : 'xtendrmt.shell.render',
      searchTemplate: rmtMeta.searchTemplate || DOCS_RMT_DEFAULT_SEARCH_TEMPLATE,
      title: rmtMeta.title || '',
      documentTitle: rmtMeta.documentTitle || '',
      titleTemplate: rmtMeta.titleTemplate || '',
      metaDescription: rmtMeta.metaDescription || '',
      metaKeywords: rmtMeta.metaKeywords || [],
      template: rmtMeta.template || '',
      adapter: rmtMeta.adapter || 'docs.parsedown',
      parseSchedule,
      routeSchedule,
      hydrateSchedule,
      richSchedule,
      mediaSchedule,
      relatedSchedule,
      demoSchedule,
      diagnosticsSchedule,
      markupClass: rmtMeta.markupClass || 'parsedownHtml',
      contentKind: rmtMeta.contentKind || 'parsedownHtml',
      contentSlot: rmtMeta.contentSlot || 'content',
      extensionSlots: DOCS_RMT_EXTENSION_SLOTS.slice(),
      sidebarSlotAvailable: Boolean(shell.sidebar),
      relatedSlotAvailable: Boolean(shell.relatedSlot),
      componentDemoSlotAvailable: Boolean(shell.demoSlot),
      diagnosticsSlotAvailable: Boolean(shell.diagnosticsSlot),
      trustBoundary: rmtMeta.trustBoundary || DOCS_RMT_TRUST_BOUNDARY
    };
    window.xtendDocsRmtProductionLastRender = createDocsRmtProductionRenderSnapshot(slug, rmtMeta, shell);

    ensureMainBackgroundBinding();

    syncActiveHeaderLink(slug);
    const adoptedContentPayload = getAdoptedDocsContentPayload(this, shell, slug, locale, rmtMeta);
    if (context.adopted === true && !adoptedContentPayload) {
      invalidateDocsSsrContentProof(this, shell, 'router-adoption-rejected');
      this.setAttribute('data-docs-route-state', 'adoption-rejected');
      this.removeAttribute('aria-busy');
      return false;
    }
    let routeSkeleton = null;
    if (adoptedContentPayload) {
      shell.mdContent.setAttribute('data-docs-content-state', 'server-rendered');
      shell.mdContent.removeAttribute('data-docs-stale-content-preserved');
    } else {
      invalidateDocsSsrContentProof(this, shell, 'csr-route-load');
      shell.mdContent.setAttribute('data-docs-content-state', 'loading');
      routeSkeleton = showDocsSkeleton(shell.mdContent, {
        profile: 'docs-article',
        variant: 'article',
        lines: 11,
        minHeight: '24rem',
        label: locale === 'en' ? 'Documentation content is loading' : 'Dokumentationsinhalt wird geladen',
        source: 'docs.parsedown',
        schedule: parseSchedule
      });
      shell.mdContent.toggleAttribute('data-docs-stale-content-preserved', !routeSkeleton);
    }

    const contentPayloadPromise = adoptedContentPayload
      ? Promise.resolve(adoptedContentPayload)
      : loadDocsParsedownContent(slug, rmtMeta, locale);
    const recommendationPromise = window.xtendDocsShellRuntime && typeof window.xtendDocsShellRuntime.recommendRelated === 'function'
      ? window.xtendDocsShellRuntime.recommendRelated({ slug, locale, resultLimit: 10 }).catch(() => ({
          status: 'degraded', source: 'navigation-fallback', fallback: true, results: []
        }))
      : Promise.resolve({ status: 'unavailable', source: 'navigation-fallback', fallback: true, results: [] });
    const playgroundLayoutPromise = slug === 'learn-rmt-playground'
      ? prepareDocsRmtPlaygroundLayoutElements().catch(() => false)
      : Promise.resolve(true);
    let relatedLinks = [];
    let contentCommitted = false;

    const commitParsedownContent = async () => {
      if (!this.isActiveRouteToken(token) || contentCommitted) return false;
      const payload = await contentPayloadPromise;
      if (!this.isActiveRouteToken(token) || contentCommitted) return false;
      contentCommitted = true;
      const ssrAdopted = Boolean(payload && payload.source === 'ssr-adopted');
      const html = payload && typeof payload.html === 'string'
        ? payload.html
        : (ssrAdopted ? null : getDocsPageFallbackMarkup(locale));
      const payloadMeta = payload && payload.meta && typeof payload.meta === 'object'
        ? payload.meta
        : rmtMeta;
      applyRmtPageMetadata(shell.section, shell.mdContent, shell.richSlot, shell.diagnosticsSlot, payloadMeta, shell.sidebar, shell.relatedSlot, shell.demoSlot);
      const trustedDomResult = ssrAdopted
        ? measuredLane('visible', parseSchedule, 'article.ssr-adopt', () => {
            shell.mdContent.setAttribute('data-docs-ssr-adopted', 'true');
            shell.mdContent.setAttribute('data-docs-code-fence-upgraded', '0');
            return {
              schema: shell.mdContent.getAttribute('data-rmt-trusted-dom-proof') || DOCS_RMT_TRUSTED_DOM_PROOF_SCHEMA,
              sanitizer: shell.mdContent.getAttribute('data-rmt-sanitizer') || DOCS_RMT_TRUSTED_DOM_SANITIZER,
              sanitized: true,
              removedCount: 0,
              boundary: shell.mdContent.getAttribute('data-rmt-trust-boundary') || DOCS_RMT_TRUST_BOUNDARY,
              markupClass: 'parsedownHtml',
              cacheHit: true,
              normalizedCodeEntityCount: 0,
              codeFenceUpgrade: {
                schema: 'xtend.docs.xcode-fence-upgrade.v1',
                upgraded: 0,
                schedule: 'docs.syntax.highlight'
              }
            };
          })
        : measuredLane('visible', parseSchedule, 'article.trusted-dom-commit', () => applyDocsTrustedDomHtml(shell.mdContent, html, {
            slug,
            locale,
            source: payloadMeta.source || rmtMeta.source || 'docs.parsedown',
            markupClass: payloadMeta.markupClass || rmtMeta.markupClass || 'parsedownHtml',
            trustBoundary: payloadMeta.trustBoundary || rmtMeta.trustBoundary || DOCS_RMT_TRUST_BOUNDARY,
            syntaxSchedule: 'docs.syntax.highlight'
          }));
      hideDocsSkeleton(shell.mdContent);
      shell.mdContent.setAttribute('data-docs-content-state', 'ready');
      shell.mdContent.removeAttribute('data-docs-stale-content-preserved');
      window.xtendDocsRmtLastRender.lazyPayload = payload && !['inline', 'ssr-adopted'].includes(payload.source);
      window.xtendDocsRmtLastRender.payloadSource = payload ? payload.source : 'unknown';
      window.xtendDocsRmtLastRender.requestedLocale = payload ? payload.requestedLocale : locale;
      window.xtendDocsRmtLastRender.resolvedLocale = payload ? payload.resolvedLocale : locale;
      window.xtendDocsRmtLastRender.translationAvailable = payload ? payload.translationAvailable !== false : true;
      window.xtendDocsRmtLastRender.skeletonLoader = 'xtend.loader.skeleton-loader.v1';
      window.xtendDocsRmtProductionLastRender.trustedDom = {
        schema: trustedDomResult.schema,
        sanitizer: trustedDomResult.sanitizer,
        sanitized: trustedDomResult.sanitized,
        removedCount: trustedDomResult.removedCount,
        boundary: trustedDomResult.boundary,
        markupClass: trustedDomResult.markupClass,
        cacheHit: trustedDomResult.cacheHit === true
      };

      relatedLinks = measuredLane('visible', relatedSchedule, 'article.related-extract', () => {
        if (!ssrAdopted) upgradeRoutedLinks(shell.mdContent);
        return extractDocsRelatedLinks(shell.mdContent);
      });
      return true;
    };

    let transitionCompleted = false;
    const finishTransition = (status = 'ready', error = null) => {
      if (!this.isActiveRouteToken(token) || transitionCompleted) return;
      transitionCompleted = true;
      this.setAttribute('data-docs-route-state', 'ready');
      this.removeAttribute('aria-busy');
      completeDocsLocaleTransition(locale, slug, {
        status,
        error,
        source: context.source || 'route'
      });
      window.dispatchEvent(new CustomEvent('xtend-docs-route-transition', {
        detail: {
          schema: 'xtend.docs.route-transition.v1',
          slug,
          locale,
          reducedMotion,
          reused,
          insularHydration: true,
          startedAt: docsRouteStartedAt,
          completedAt: new Date().toISOString(),
          durationMs: docsRoundDuration(docsPerfNow() - routePerfStartedAt),
          laneDurations: laneDurations.slice(),
          routeRef: rmtMeta.routeId || ('docs.' + slug.replace(/-/g, '.')),
          routeId: rmtMeta.routeId || ('docs.' + slug.replace(/-/g, '.')),
          componentRef: 'xtend-doc-page',
          rmtComponentId: 'docs.page',
          schedule: routeSchedule,
          routeSchedule,
          hydrateSchedule,
          localeStatus: status,
          relatedSchedule,
          demoSchedule,
          diagnosticsSchedule,
          shellSchedule,
          parseSchedule,
          metadata: window.xtendDocsRmtLastRender || null
        }
      }));
    };

    const completeParsedownCommit = () => {
      if (!this.isActiveRouteToken(token)) return;
      commitParsedownContent().then(async (committed) => {
        if (!committed || !this.isActiveRouteToken(token)) return;
        const recommendation = await recommendationPromise;
        if (!this.isActiveRouteToken(token) || recommendation && recommendation.superseded) return;
        const explicitCount = relatedLinks.length;
        const automaticLinks = recommendation && Array.isArray(recommendation.results) ? recommendation.results : [];
        relatedLinks = mergeDocsRelatedLinks(slug, relatedLinks, automaticLinks);
        const fallbackUsed = relatedLinks.some((entry) => String(entry.source || '').startsWith('navigation-'));
        window.xtendDocsDevApi && window.xtendDocsDevApi.update({
          recommendations: {
            slug,
            locale,
            durationMs: Number(recommendation && recommendation.durationMs || 0),
            resultCount: relatedLinks.length,
            explicitCount,
            source: fallbackUsed ? 'compact-index-with-navigation-fallback' : (recommendation && recommendation.source || 'explicit'),
            scores: automaticLinks.map((entry) => Number(entry.score || 0)),
            fallback: fallbackUsed || Boolean(recommendation && recommendation.fallback)
          }
        });
        if (slug === 'learn-rmt-playground') {
          if (shell.relatedSlot) {
            shell.relatedSlot.hidden = true;
            shell.relatedSlot.setAttribute('data-related-count', '0');
          }
        } else {
          measuredLane('idle', relatedSchedule, 'sidebar.related-render', () => renderDocsRelatedSidebar(shell.relatedSlot, slug, relatedLinks));
        }
        window.dispatchEvent(new CustomEvent('xtend-docs-content-ready', {
          detail: {
            schema: 'xtend.docs.content-ready.v1',
            slug,
            locale,
            requestedLocale: window.xtendDocsRmtLastRender.requestedLocale,
            resolvedLocale: window.xtendDocsRmtLastRender.resolvedLocale,
            translationAvailable: window.xtendDocsRmtLastRender.translationAvailable,
            routeRef: rmtMeta.routeId || ('docs.' + slug.replace(/-/g, '.')),
            root: shell.mdContent,
            schedule: hydrateSchedule,
            syntaxSchedule: 'docs.syntax.highlight',
            reused,
            insularHydration: true,
            skeletonLoader: 'xtend.loader.skeleton-loader.v1',
            skeletonProfile: 'docs-article',
            contentCommitDurationMs: Number((laneDurations.find((entry) => entry.operation === 'article.trusted-dom-commit') || {}).durationMs || 0)
          }
        }));
        const codeHydrationMetadata = {
          slug,
          reason: 'parsedown-code-fence-syntax-highlight',
          schedule: 'docs.syntax.highlight'
        };
        if (adoptedContentPayload) {
          const codeEnhancementDisposer = scheduleDocsSsrCodeEnhancement(shell.mdContent, {
            ...codeHydrationMetadata,
            isActive: () => this.isActiveRouteToken(token)
          });
          this.scheduleRouteWork(codeEnhancementDisposer);
        } else {
          hydrateDocsCodeBlocks(shell.mdContent, codeHydrationMetadata);
        }
        if (animationEngineDemoRoot) {
          animationEngineDemoRoot.setAttribute('data-content-committed-at', String(docsPerfNow()));
          const animationDemoDisposer = scheduleDocsAnimationEngineDemoHydration({
            root: animationEngineDemoRoot,
            target: shell.mdContent,
            locale
          });
          this.scheduleRouteWork(animationDemoDisposer);
        }
        if (slug === 'learn-rmt-playground') {
          const playgroundLayoutReady = await playgroundLayoutPromise;
          if (!this.isActiveRouteToken(token)) return;
          if (playgroundLayoutReady) {
            const playgroundRoot = measuredLane('idle', richSchedule, 'rmt-playground.render', () => renderDocsRmtPlayground(shell.mdContent, locale, relatedLinks));
            if (playgroundRoot && typeof playgroundRoot.__xtendDocsDispose === 'function') {
              this.scheduleRouteWork(() => playgroundRoot.__xtendDocsDispose());
            }
          } else {
            shell.mdContent.setAttribute('data-rmt-playground-enhancement-state', 'component-definition-unavailable');
          }
        }
        finishTransition();
      }).catch((error) => {
        if (!this.isActiveRouteToken(token)) return;
        if (animationEngineDemoRoot) renderDocsAnimationEngineDemoFailure(animationEngineDemoRoot, locale, error);
        hideDocsSkeleton(shell.mdContent);
        applyDocsTrustedDomHtml(shell.mdContent, getDocsPageFallbackMarkup(locale, 'load-error'), {
          slug,
          locale,
          source: 'docs.error-fallback',
          markupClass: 'htmlFragment',
          trustBoundary: DOCS_RMT_TRUST_BOUNDARY
        });
        shell.mdContent.setAttribute('data-docs-content-state', 'error');
        shell.mdContent.removeAttribute('data-docs-stale-content-preserved');
        window.dispatchEvent(new CustomEvent('xtend-docs-content-error', {
          detail: {
            schema: 'xtend.docs.content-error.v1',
            slug,
            locale,
            schedule: parseSchedule,
            message: error && error.message ? error.message : String(error)
          }
        }));
        finishTransition('error', error && error.message ? error.message : String(error));
      });
    };
    if (localeRouteFastPath) {
      let cancelled = false;
      Promise.resolve().then(() => {
        if (!cancelled) completeParsedownCommit();
      });
      this.scheduleRouteWork(() => {
        cancelled = true;
      });
    } else {
      const afterPaintDisposer = scheduleDocsAfterPaint(completeParsedownCommit);
      this.scheduleRouteWork(afterPaintDisposer);
    }

    const idleDisposer = scheduleDocsIdle(() => {
      if (!this.isActiveRouteToken(token)) return;
      measuredLane('idle', demoSchedule, 'component-demo.render', () => renderDocsComponentDemo(shell.demoSlot, slug));
      hydrateDocsCodeBlocks(shell.demoSlot, {
        slug,
        reason: 'component-demo-idle-route-render',
        schedule: demoSchedule
      });
    });
    this.scheduleRouteWork(idleDisposer);

    return true;
  }
}

if (!customElements.get('xtend-doc-page')) {
  customElements.define('xtend-doc-page', XtendDocPage);
}

window.xtendDocsI18n = {
  ...getDocsI18nConfig(),
  normalizeLocale: normalizeDocsLocale,
  getCurrentLocale: getCurrentDocsLocale,
  getTransition: () => window.__xtendDocsLocaleTransition || window.__xtendDocsLocaleLastTransition || null,
  navigate: navigateDocsLocale,
  sync: syncLegacyDocsGlobals
};
publishDocsLocale(getCurrentDocsLocale(), 'initial');
syncLegacyDocsGlobals(getCurrentDocsLocale());
ensureDocsLanguageSelectBinding();
