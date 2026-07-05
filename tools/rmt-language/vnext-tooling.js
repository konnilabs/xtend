'use strict';

const {
  createRmtSourceModel
} = require('./source-model');
const {
  RMT_VNEXT_CORE_SCHEMA,
  compileRmtVNextSource
} = require('./vnext-compiler');

const RMT_VNEXT_TOOLING_SCHEMA = 'xtend.rmt.vnext-tooling-adapter.v1';
const RMT_VNEXT_TOOLING_REPORT_SCHEMA = 'xtend.rmt.vnext-tooling-report.v1';
const RMT_VNEXT_TOOLING_FORMATTER_SCHEMA = 'xtend.rmt.vnext-formatter.v1';
const RMT_VNEXT_TOOLING_WORKPACKAGE = 'WP-E15-15';
const RMT_VNEXT_PRIMITIVE_AUTHORING_WORKPACKAGE = 'RMT-VNEXT-PRIM-07';
const RMT_VNEXT_TOOLING_MODULE_PATH = 'tools/rmt-language/vnext-tooling.js';
const RMT_VNEXT_TOOLING_SUITE_PATH = 'tests/rmt-language/rmt_vnext_tooling_suite.js';
const RMT_VNEXT_TOOLING_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-tooling';

const RMT_LINTER_REPORT_SCHEMA = 'xtend.rmt.linter.report.v1';
const RMT_LINTER_DIAGNOSTIC_SCHEMA = 'xtend.rmt.linter.diagnostic.v1';
const RMT_COMPLETION_REPORT_SCHEMA = 'xtend.rmt.completion-report.v1';
const RMT_COMPLETION_PROVIDER_SCHEMA = 'xtend.rmt.completion-provider.v1';
const RMT_COMPLETION_ITEM_SCHEMA = 'xtend.rmt.completion-item.v1';
const RMT_HOVER_REPORT_SCHEMA = 'xtend.rmt.hover-report.v1';
const RMT_HOVER_PROVIDER_SCHEMA = 'xtend.rmt.hover-provider.v1';
const RMT_HOVER_SCHEMA = 'xtend.rmt.hover.v1';
const RMT_DOCUMENT_SYMBOLS_REPORT_SCHEMA = 'xtend.rmt.document-symbols-report.v1';
const RMT_DOCUMENT_SYMBOLS_PROVIDER_SCHEMA = 'xtend.rmt.document-symbols-provider.v1';
const RMT_DOCUMENT_SYMBOL_SCHEMA = 'xtend.rmt.document-symbol.v1';
const RMT_DEFINITION_REPORT_SCHEMA = 'xtend.rmt.definition-report.v1';
const RMT_DEFINITION_PROVIDER_SCHEMA = 'xtend.rmt.definition-provider.v1';
const RMT_DEFINITION_TARGET_SCHEMA = 'xtend.rmt.definition-target.v1';
const RMT_VNEXT_PRIMITIVE_CODE_ACTION_PROVIDER_SCHEMA = 'xtend.rmt.vnext.primitive-code-action-provider.v1';
const RMT_VNEXT_PRIMITIVE_CODE_ACTION_REPORT_SCHEMA = 'xtend.rmt.vnext.primitive-code-action-report.v1';
const RMT_VNEXT_PRIMITIVE_CODE_ACTION_PREVIEW_SCHEMA = 'xtend.rmt.vnext.primitive-code-action-preview.v1';
const RMT_VNEXT_PRIMITIVE_FIX_ALL_KIND = 'source.fixAll.rmt.vnext.primitives';
const RMT_VNEXT_PRIMITIVE_COMMAND_HANDOFF_SCHEMA = 'xtend.rmt.vnext.primitive-command-handoff.v1';
const RMT_VNEXT_PRIMITIVE_KERNEL_BOUNDARY_COMMAND = 'xtend.rmt.vnext.extractKernelImport';
const RMT_CODE_ACTION_SCHEMA = 'xtend.rmt.code-action.v1';
const RMT_WORKSPACE_EDIT_SCHEMA = 'xtend.rmt.workspace-edit.v1';

const VNEXT_COMPLETION_KEYWORDS = Object.freeze([
  ['import', 'Statischen vNext Modulimport deklarieren.'],
  ['template', 'Orchestrierungs-Template starten.'],
  ['remote surface', 'Remote Surface mit Manifest-, Owner- und Fallback-Fakten deklarieren.'],
  ['surface', 'Host-neutrale Surface deklarieren.'],
  ['lane', 'Scheduler Lane innerhalb einer Surface deklarieren.'],
  ['mount', 'Lifecycle Operation mount.'],
  ['hydrate', 'Lifecycle Operation hydrate.'],
  ['resumability mode server_prerender_resume', 'SSR-Resumability-Handoff mit Resume-Payload deklarieren.'],
  ['update', 'Lifecycle Operation update.'],
  ['unmount', 'Lifecycle Operation unmount.'],
  ['stream', 'Incremental Rendering Stream deklarieren.'],
  ['from', 'Data Source an eine Operation binden.'],
  ['when', 'Deklarative Condition ohne Runtime-Eval.'],
  ['slot', 'Composition Slot deklarieren.'],
  ['on', 'Event Binding deklarieren.'],
  ['action', 'Action Referenz fuer Event Binding.'],
  ['validation', 'Form Validation Gruppe mit Field Rules und Action Gate deklarieren.'],
  ['animation', 'Wiederverwendbares AnimationEngine-Preset deklarieren.'],
  ['transition', 'Surface Transition zwischen Surface-Gruppen deklarieren.'],
  ['trust boundary', 'Security Trust Boundary setzen.'],
  ['sanitize', 'Sanitize Policy setzen.'],
  ['resumability', 'Serverseitigen Resume-Handoff als Policy deklarieren.']
]);

const VNEXT_PRIMITIVE_KEYWORDS = Object.freeze([
  ['state', 'App-State Primitive in vNext deklarieren.'],
  ['selector', 'Derived Selector aus State oder DataSource ableiten.'],
  ['datasource', 'DataSource Primitive mit Endpoint, Fixture, SSE oder Worker deklarieren.'],
  ['action', 'Action Primitive mit Inputs, Reducern, Effects und Emits deklarieren.'],
  ['portal', 'Portal Root fuer Surface- oder Overlay-Layer deklarieren.'],
  ['overlay', 'Overlay Primitive wie Toast, Tooltip, Popover, Lightbox, Menu oder Dialog deklarieren.'],
  ['resource', 'Lifecycle-owned Resource wie Object URL, Stream, Observer, Timer oder Lazy Import deklarieren.'],
  ['surface', 'Sichtbare oder wiederholbare App-Platform Surface deklarieren.'],
  ['validation', 'Blocking Form Validation mit Field Rules und Action Gate deklarieren.'],
  ['animation', 'AnimationEngine Preset mit Effekt, Keyframes und Reduced Motion deklarieren.'],
  ['transition', 'Surface Transition mit Trigger, Effekt, Dauer und Lane deklarieren.'],
  ['payload', 'Event-Payload Contract aus DOM-, Detail- oder Surface-Kontext mappen.'],
  ['destroy releases', 'Surface-Lifecycle an Resource-Teardown binden.']
]);

const VNEXT_PRIMITIVE_STATE_CLAUSES = Object.freeze([
  ['type', 'State-Datentyp deklarieren.'],
  ['preserve', 'State ueber Surface-Lifecycle hinweg erhalten.'],
  ['initial', 'Initialen State-Wert deklarieren.']
]);

const VNEXT_PRIMITIVE_SELECTOR_CLAUSES = Object.freeze([
  ['from state', 'Selector aus State Record ableiten.'],
  ['from datasource', 'Selector aus DataSource Record ableiten.'],
  ['where', 'Deklarative Filterbedingung.'],
  ['find', 'Einzelnen Datensatz deklarativ auswaehlen.'],
  ['sort by', 'Stabile Sortierung fuer Selector-Ergebnis.'],
  ['output', 'Selector-Output-Contract deklarieren.']
]);

const VNEXT_PRIMITIVE_ACTION_CLAUSES = Object.freeze([
  ['input', 'Typisierten Action-Input deklarieren.'],
  ['status', 'Status-State fuer Loading, Success und Error binden.'],
  ['reduce', 'State-Reducer deklarieren.'],
  ['effect fetch datasource', 'Asynchronen Fetch-Effect gegen eine DataSource deklarieren.'],
  ['on success -> reduce', 'Success-Result in State schreiben.'],
  ['on success -> emit', 'Success-Event emittieren.'],
  ['on error -> overlay', 'Error-Pfad an Overlay-Feedback binden.'],
  ['emit', 'Typed Event mit Payload deklarieren.']
]);

const VNEXT_PRIMITIVE_SURFACE_CLAUSES = Object.freeze([
  ['source selector', 'Surface an Selector-Output binden.'],
  ['repeat from selector', 'Keyed Surface-Repeater aus Selector-Output erzeugen.'],
  ['key', 'Stabilen Surface-Key deklarieren.'],
  ['portal', 'Surface in Portal Root materialisieren.'],
  ['bounds', 'Initiale Surface-Geometrie deklarieren.'],
  ['bounds mode responsive scope viewport x "1rem" y "1rem" width "clamp(20rem, 70vi, 52rem)" height "min(80dvh, 42rem)" minWidth "18rem" maxHeight "48rem"', 'Responsive CSS-native Surface-Geometrie deklarieren.'],
  ['preserve on minimize', 'Surface-State beim Minimieren erhalten.'],
  ['destroy releases resource', 'Surface-Destroy an Resource-Release koppeln.'],
  ['lane visible', 'Sichtbare Fabric-Lane fuer Lifecycle-Operation deklarieren.'],
  ['on click', 'DOM-Event-Binding auf Action deklarieren.'],
  ['resumability mode server_prerender_resume', 'Vollstaendige Resumability fuer diese Operation aktivieren.'],
  ['resumability snapshot surface_state', 'Resume-Snapshot-Grenze fuer SSR deklarieren.'],
  ['resumability event replay intent_queue', 'Event-Replay-Modus fuer Resume deklarieren.'],
  ['payload', 'Event-Payload Contract mappen.']
]);

const VNEXT_PRIMITIVE_VALIDATION_CLAUSES = Object.freeze([
  ['mode blocking', 'Validation-Gruppe blockiert Ziel-Actions, solange Felder ungueltig sind.'],
  ['target action', 'Ziel-Action fuer ein Validation Gate deklarieren.'],
  ['field', 'State-gebundenes Formularfeld mit Regeln deklarieren.'],
  ['required', 'Feld muss einen Wert besitzen.'],
  ['email', 'Feldwert muss eine E-Mail-Adresse sein.'],
  ['minLength', 'Minimale Zeichenanzahl fuer das Feld deklarieren.'],
  ['maxLength', 'Maximale Zeichenanzahl fuer das Feld deklarieren.'],
  ['pattern', 'Pattern-Regel fuer das Feld deklarieren.'],
  ['message', 'Benutzerlesbare Validation-Meldung deklarieren.'],
  ['include', 'Eine andere Validation-Gruppe einbeziehen.']
]);

const VNEXT_PRIMITIVE_TRANSITION_CLAUSES = Object.freeze([
  ['trigger action', 'Action als Ausloeser der Surface Transition deklarieren.'],
  ['from surfaces', 'Ausgehende Surface-Gruppe deklarieren.'],
  ['to surfaces', 'Eingehende Surface-Gruppe deklarieren.'],
  ['use animation', 'Wiederverwendbares AnimationEngine-Preset einbinden.'],
  ['effect', 'Transition-Effekt aus dem XTend Katalog waehlen.'],
  ['durationMs', 'Animationsdauer in Millisekunden deklarieren.'],
  ['easing', 'CSS-Easing fuer die Transition deklarieren.'],
  ['timeline', 'Enter/Exit/Parallel/Stagger Timeline deklarieren.'],
  ['layoutKey', 'Layout- oder Shared-Element-Key deklarieren.'],
  ['interrupt', 'Interrupt-Policy cancel, finish oder replace deklarieren.'],
  ['reducedMotion', 'Reduced-Motion Policy instant, fade oder none deklarieren.'],
  ['lane transition', 'Transition auf die Scheduler-Lane transition legen.']
]);

const VNEXT_PRIMITIVE_ANIMATION_CLAUSES = Object.freeze([
  ['preset', 'Benanntes Preset als Ausgangspunkt deklarieren.'],
  ['effect', 'Animation-Effekt aus dem XTend Katalog waehlen.'],
  ['durationMs', 'Animationsdauer in Millisekunden deklarieren.'],
  ['easing', 'CSS-Easing fuer die Animation deklarieren.'],
  ['spring', 'Deterministisch sampled Spring-Parameter deklarieren.'],
  ['keyframe', 'Sicheren Keyframe mit opacity/transform deklarieren.'],
  ['timeline', 'Animation-Timeline deklarieren.'],
  ['reducedMotion', 'Reduced-Motion Policy instant, fade oder none deklarieren.'],
  ['allowFilter', 'Filter-Keyframes explizit erlauben.']
]);

const VNEXT_PRIMITIVE_RESOURCE_KINDS = Object.freeze([
  ['object-url', 'Object URL Resource mit Revoke-Cleanup.'],
  ['stream', 'Stream Resource mit owner-scoped Close.'],
  ['observer', 'Observer Resource mit Disconnect-Cleanup.'],
  ['timer', 'Timer oder Idle Handle Resource.'],
  ['lazy-import', 'Lazy Component/Module Import als Host-Adapter-Fakt.']
]);

const VNEXT_PRIMITIVE_OVERLAY_KINDS = Object.freeze([
  ['tooltip', 'Viewport-Hint Overlay.'],
  ['toast', 'Nichtmodales Feedback Overlay.'],
  ['popover', 'Anchored Interactive Overlay.'],
  ['lightbox', 'Modaler Media-/Detail-Layer.'],
  ['menu', 'Keyboard-navigierbares Menu.'],
  ['dialog', 'Dialog Overlay.']
]);

const VNEXT_SOURCE_KINDS = Object.freeze([
  ['endpoint', 'Endpoint-basierte Data Source.'],
  ['selector', 'Selector-Output als Quelle binden.'],
  ['state', 'State Record als Quelle binden.'],
  ['datasource', 'DataSource Primitive als Quelle binden.'],
  ['fixture', 'Fixture Record als Quelle binden.'],
  ['resource', 'Owned Resource als Quelle binden.'],
  ['sse', 'Server-Sent-Events Stream.'],
  ['worker', 'Worker-basierte Data Source.']
]);

const VNEXT_VALIDATION_MODES = Object.freeze([
  ['blocking', 'Ungueltige Gruppen blockieren die zugeordneten Actions.']
]);

const VNEXT_VALIDATION_RULES = Object.freeze([
  ['required', 'Feld muss einen Wert besitzen.'],
  ['email', 'Feldwert muss eine E-Mail-Adresse sein.'],
  ['minLength', 'Minimale Zeichenanzahl.'],
  ['maxLength', 'Maximale Zeichenanzahl.'],
  ['pattern', 'RegExp-kompatibler Pattern-Vertrag.']
]);

const VNEXT_TRANSITION_EFFECTS = Object.freeze([
  ['fade', 'Ein-/Ausblenden.'],
  ['crossfade', 'Ausgehende und eingehende Surface-Gruppen ueberblenden.'],
  ['slide-left', 'Nach links gerichteter Surface-Wechsel.'],
  ['slide-right', 'Nach rechts gerichteter Surface-Wechsel.'],
  ['slide-up', 'Nach oben gerichteter Surface-Wechsel.'],
  ['slide-down', 'Nach unten gerichteter Surface-Wechsel.'],
  ['scale', 'Skalierter Surface-Wechsel.'],
  ['pop', 'Kurzer Pop mit Overshoot.'],
  ['zoom', 'Zoom-Transition.'],
  ['flip', 'Perspective Flip.'],
  ['rotate', 'Subtile Rotation.'],
  ['expand', 'Aufklappen entlang der Blockachse.'],
  ['collapse', 'Einklappen entlang der Blockachse.'],
  ['fade-blur', 'Fade mit explizitem Blur-Filter Opt-in.'],
  ['shared-element', 'Shared-Element Transition mit layoutKey.'],
  ['layout-flip', 'FLIP Layout-Transition mit layoutKey.'],
  ['none', 'Sofortiger Wechsel ohne Motion.']
]);

const VNEXT_LANES = Object.freeze([
  ['critical', 'kritische Rendering-Arbeit'],
  ['visible', 'sichtbare Rendering-Arbeit'],
  ['user-blocking', 'User-blocking Interaktion'],
  ['transition', 'Route- oder UI-Transition'],
  ['resource', 'Resource- oder Sucharbeit'],
  ['a11y', 'Assistive-Technology-Feedback'],
  ['idle', 'Idle Hydration oder deferred Work'],
  ['background', 'Hintergrundarbeit'],
  ['diagnostics', 'Diagnostics und Telemetry']
]);

const VNEXT_TRUST_BOUNDARIES = Object.freeze([
  ['xtend.security.sanitizing-boundary.v1', 'HTML-/Endpoint-Ergebnisse vor Rendering absichern.'],
  ['xtend.security.streaming-boundary.v1', 'Inkrementelle Stream-Fragmente absichern.'],
  ['xtend.security.worker-boundary.v1', 'Worker-Resultate an Message- und Sanitizing-Grenze binden.'],
  ['xtend.security.remote-surface.v1', 'Remote Surface an eine host-owned Trust Boundary binden.']
]);

const VNEXT_SNIPPETS = Object.freeze([
  {
    id: 'rmt-vnext-resumability',
    label: 'RMT vNext Resumability Policy',
    prefix: 'rmt-vnext-resumability',
    description: 'SSR-Resumability mit Resume-Snapshot, Event-Replay und Integrity-Handoff deklarieren.',
    body: [
      'hydrate ${1:app-shell} from selector ${2:app.view} {',
      '  hydration mode server_prerender_resume',
      '  resumability mode server_prerender_resume',
      '  resumability snapshot ${3:surface_state}',
      '  resumability event replay ${4:intent_queue}',
      '  resumability integrity ${5:signed_manifest}',
      '}'
    ]
  },
  {
    id: 'rmt-vnext-validation',
    label: 'RMT vNext Validation',
    prefix: 'rmt-vnext-validation',
    description: 'Blocking Validation-Gruppe mit Field Rules und Action Gate.',
    body: [
      'validation ${1:app.contact} {',
      '  mode blocking',
      '  target action ${2:app.next}',
      '  field ${3:app.email} required email message "${4:Enter a valid email address.}"',
      '}'
    ]
  },
  {
    id: 'rmt-vnext-animation',
    label: 'RMT vNext AnimationEngine Preset',
    prefix: 'rmt-vnext-animation',
    description: 'Wiederverwendbares AnimationEngine-Preset mit Effekt, Dauer und Reduced Motion.',
    body: [
      'animation ${1:app.motion.pop} {',
      '  effect ${2|fade,crossfade,slide-left,slide-right,slide-up,slide-down,scale,pop,zoom,flip,rotate,expand,collapse,fade-blur,shared-element,layout-flip,none|}',
      '  durationMs ${3:220}',
      '  easing "${4:cubic-bezier(.2,.8,.2,1)}"',
      '  reducedMotion ${5|fade,instant,none|}',
      '  keyframe enter {',
      '    opacity 0',
      '    transform "${6:scale(.96)}"',
      '    offset 0',
      '  }',
      '}'
    ]
  },
  {
    id: 'rmt-vnext-transition',
    label: 'RMT vNext Surface Transition',
    prefix: 'rmt-vnext-transition',
    description: 'Surface Transition mit Trigger, Surface-Gruppen, Effekt und Dauer.',
    body: [
      'transition ${1:app.contactToIssue} {',
      '  trigger action ${2:app.nextContact}',
      '  from surfaces [${3:app.contact} ${4:app.nextContact}]',
      '  to surfaces [${5:app.issue} ${6:app.backContact}]',
      '  use animation ${7:app.motion.pop}',
      '  effect ${8|fade,crossfade,slide-left,slide-right,slide-up,slide-down,scale,pop,zoom,flip,rotate,expand,collapse,fade-blur,shared-element,layout-flip,none|}',
      '  durationMs ${9:240}',
      '  easing "${10:ease-out}"',
      '  interrupt ${11|replace,cancel,finish|}',
      '  reducedMotion ${12|fade,instant,none|}',
      '  lane transition',
      '}'
    ]
  },
  {
    id: 'rmt-vnext-maraca-orchestration-app',
    label: 'RMT vNext Maraca Orchestration App',
    prefix: 'rmt-vnext-maraca-orchestration-app',
    description: 'Kompakte Maraca App mit State, Action, Validation, Transition und XTend Surfaces.',
    body: [
      'template ${1:app.service} {',
      '  state ${2:app.step} type object preserve {',
      '    initial {',
      '      id "step"',
      '      value "contact"',
      '    }',
      '  }',
      '',
      '  state ${3:app.email} type object preserve {',
      '    initial {',
      '      id "email"',
      '      value ""',
      '    }',
      '  }',
      '',
      '  selector ${2:app.step} from state ${2:app.step} {',
      '    output StepView',
      '  }',
      '',
      '  action ${4:app.nextContact} {',
      '    reduce state.${2:app.step}.value = "issue"',
      '    emit ${5:app.stepChanged} with step "issue"',
      '  }',
      '',
      '  validation ${6:app.contact} {',
      '    mode blocking',
      '    target action ${4:app.nextContact}',
      '    field ${3:app.email} required email message "Enter a valid email address."',
      '  }',
      '',
      '  portal surface.root root "#xtend-maraca-root" layer surface',
      '',
      '  surface ${7:app.contact.surface} kind form component x-input {',
      '    source selector ${2:app.step}',
      '    portal surface.root',
      '    key "contact"',
      '    lane visible weight 80 {',
      '      hydrate contact-email from selector ${2:app.step}',
      '    }',
      '  }',
      '',
      '  surface ${8:app.next.surface} kind action component x-button {',
      '    source selector ${2:app.step}',
      '    portal surface.root',
      '    key "next"',
      '    lane visible weight 80 {',
      '      mount contact-next from selector ${2:app.step}',
      '    }',
      '    on click "#contact-next" -> action ${4:app.nextContact} {',
      '      payload label "Next"',
      '    }',
      '  }',
      '',
      '  transition ${9:app.contactToIssue} {',
      '    trigger action ${4:app.nextContact}',
      '    from surfaces [${7:app.contact.surface} ${8:app.next.surface}]',
      '    to surfaces [${10:app.issue.surface}]',
      '    effect crossfade',
      '    durationMs 240',
      '    easing "ease-out"',
      '    lane transition',
      '  }',
      '}'
    ]
  },
  {
    id: 'rmt-vnext-template',
    label: 'RMT vNext Template',
    prefix: 'rmt-vnext-template',
    description: 'Native vNext Template/Surface/Lane-Struktur.',
    body: [
      'template ${1:app.page} {',
      '  surface root {',
      '    lane ${2|critical,visible,transition,idle,background,diagnostics|} {',
      '      mount ${3:app-shell}',
      '    }',
      '  }',
      '}'
    ]
  },
  {
    id: 'rmt-vnext-stream',
    label: 'RMT vNext Stream',
    prefix: 'rmt-vnext-stream',
    description: 'Stream mit Data Source, Trust Boundary und Sanitizer.',
    body: [
      'stream ${1:live-feed} from ${2|endpoint,sse,worker|} ${3:feed.live} {',
      '  trust boundary "${4:xtend.security.streaming-boundary.v1}"',
      '  sanitize ${5:html}',
      '}'
    ]
  },
  {
    id: 'rmt-vnext-action',
    label: 'RMT vNext Event Action',
    prefix: 'rmt-vnext-action',
    description: 'Event Binding auf eine referenzielle Action.',
    body: [
      'on ${1:submit} -> action ${2:settings.save}'
    ]
  },
  {
    id: 'rmt-vnext-primitive-shell',
    label: 'RMT vNext Primitive Shell',
    prefix: 'rmt-vnext-primitive-shell',
    description: 'Granulare App Shell mit State, Selector, Action, Portal, Surface, Lane und Event nur in vNext.',
    body: [
      'template ${1:app.shell} {',
      '  state ${2:app.status} type object preserve {',
      '    initial {',
      '      id "${3:status}"',
      '      text "${4:Ready}"',
      '    }',
      '  }',
      '',
      '  selector ${2:app.status} from state ${2:app.status} {',
      '    output ${5:AppStatus}',
      '  }',
      '',
      '  action ${6:app.save} {',
      '    input label string',
      '    reduce state.${2:app.status}.text = "${7:Saved}"',
      '    emit ${8:app.saved} with label input.label',
      '  }',
      '',
      '  portal surface.root root "#${9:app-root}" layer surface',
      '',
      '  surface ${10:app.status.card} kind card component ${11:x-status} {',
      '    source selector ${2:app.status}',
      '    key status.id',
      '    portal surface.root',
      '',
      '    lane visible weight 50 {',
      '      hydrate ${12:status-card} from selector ${2:app.status}',
      '    }',
      '',
      '    on click "[data-action=save]" -> action ${6:app.save} {',
      '      payload label from target.dataset.label',
      '    }',
      '  }',
      '}'
    ]
  }
]);

const DOMAIN_CONFIG = Object.freeze({
  templates: { kind: 'template', label: 'Template', childKind: 'template' },
  states: { kind: 'state', label: 'State', childKind: 'variable' },
  selectors: { kind: 'selector', label: 'Selector', childKind: 'function' },
  surfaces: { kind: 'surface', label: 'Surface', childKind: 'namespace' },
  remoteSurfaces: { kind: 'remote-surface', label: 'Remote Surface', childKind: 'namespace' },
  lanes: { kind: 'lane', label: 'Lane', childKind: 'event' },
  operations: { kind: 'operation', label: 'Operation', childKind: 'function' },
  slots: { kind: 'slot', label: 'Slot', childKind: 'namespace' },
  events: { kind: 'event', label: 'Event', childKind: 'event' },
  dataSources: { kind: 'data-source', label: 'Data Source', childKind: 'interface' },
  actions: { kind: 'action', label: 'Action', childKind: 'function' },
  effects: { kind: 'effect', label: 'Effect', childKind: 'function' },
  validations: { kind: 'validation', label: 'Validation', childKind: 'validation' },
  animations: { kind: 'animation', label: 'Animation', childKind: 'transition' },
  transitions: { kind: 'transition', label: 'Transition', childKind: 'transition' },
  portals: { kind: 'portal', label: 'Portal', childKind: 'namespace' },
  overlays: { kind: 'overlay', label: 'Overlay', childKind: 'namespace' },
  resources: { kind: 'resource', label: 'Resource', childKind: 'object' },
  collectionViews: { kind: 'collection-view', label: 'Collection View', childKind: 'array' },
  commandSources: { kind: 'command-source', label: 'Command Source', childKind: 'function' },
  searchSources: { kind: 'search-source', label: 'Search Source', childKind: 'function' },
  securityPolicies: { kind: 'security-policy', label: 'Security Policy', childKind: 'key' },
  sourceMap: { kind: 'source-map', label: 'Source Map', childKind: 'key' }
});

const VNEXT_DOMAINS = Object.freeze(Object.keys(DOMAIN_CONFIG));

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function getInputText(input = {}) {
  return typeof input === 'string' ? input : String(input.text || '');
}

function createSourceModel(input = {}) {
  return createRmtSourceModel(typeof input === 'string' ? { text: input } : input);
}

function isLikelyRmtVNextSource(input = {}, options = {}) {
  if (options.languageMode === 'legacy') return false;
  if (options.languageMode === 'vnext') return true;

  const text = getInputText(input);
  const trimmed = text.trimStart();

  if (!trimmed || trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return false;
  }

  return /^(?:import|template|surface|remote\s+surface|validation|animation|transition)\b/u.test(trimmed)
    || /(?:^|\n)\s*(?:remote\s+surface|template|state|selector|datasource|action|portal|overlay|resource|surface|validation|animation|transition|lane|mount|hydrate|resume|resumability|update|unmount|stream|slot|on\s+\S+\s+->\s+action|trust\s+boundary|sanitize)\b/u.test(text);
}

function sourceRefToRange(sourceMap, sourceRef) {
  const record = toArray(sourceMap).find((entry) => entry && entry.id === sourceRef);
  return record ? record.range : null;
}

function pointerToRange(sourceMap, pointer) {
  const record = toArray(sourceMap).find((entry) => entry && entry.corePointer === pointer);
  return record ? record.range : null;
}

function createIndexRecord(domain, record, index, sourceMap) {
  const pointer = `/${domain}/${index}`;
  const id = normalizeString(record && record.id) || `${domain}:${index}`;
  const sourceRef = record && record.sourceRef || null;
  const range = sourceRefToRange(sourceMap, sourceRef) || pointerToRange(sourceMap, pointer);
  const target = record && record.target && record.target.ref || record && record.target || record && record.name || id;

  return {
    domain,
    index,
    id,
    name: normalizeString(record && record.name) || normalizeString(target) || id,
    detail: describeRecord(domain, record),
    record,
    pointer,
    idPointer: pointer,
    range,
    idRange: range,
    sourceRef
  };
}

function describeRecord(domain, record = {}) {
  if (domain === 'operations') {
    return [record.op || record.kind || 'operation', record.target && record.target.ref].filter(Boolean).join(' ');
  }

  if (domain === 'lanes') {
    return [record.name || 'lane', `${toArray(record.operationRefs).length} operation(s)`].join(' - ');
  }

  if (domain === 'dataSources') {
    return [record.kind || 'source', record.target].filter(Boolean).join(' ');
  }

  if (domain === 'states') {
    return [record.type || 'state', record.preserve ? 'preserve' : 'ephemeral'].filter(Boolean).join(' - ');
  }

  if (domain === 'selectors') {
    return [record.source && record.source.kind || 'source', record.source && record.source.target, record.output ? `output: ${record.output}` : ''].filter(Boolean).join(' ');
  }

  if (domain === 'actions') {
    return [
      `${toArray(record.inputs).length} input(s)`,
      `${toArray(record.reducers).length} reducer(s)`,
      `${toArray(record.effectRefs).length} effect(s)`
    ].join(' - ');
  }

  if (domain === 'effects') {
    return [record.kind || 'effect', record.dataSourceRef || record.target].filter(Boolean).join(' ');
  }

  if (domain === 'portals') {
    return [record.layer || 'portal', record.root].filter(Boolean).join(' ');
  }

  if (domain === 'overlays') {
    return [record.kind || 'overlay', record.portal && record.portal.target ? `portal: ${record.portal.target}` : ''].filter(Boolean).join(' - ');
  }

  if (domain === 'resources') {
    const owner = record.owner ? `${record.owner.kind || 'owner'}:${record.owner.id || record.owner.ref || 'unknown'}` : '';
    return [record.kind || 'resource', owner].filter(Boolean).join(' - ');
  }

  if (domain === 'collectionViews') {
    return [record.source || 'collection', record.itemTemplate ? `item: ${record.itemTemplate}` : ''].filter(Boolean).join(' - ');
  }

  if (domain === 'commandSources') {
    return [record.shortcut || 'command-source', record.surface ? `surface: ${record.surface}` : ''].filter(Boolean).join(' - ');
  }

  if (domain === 'searchSources') {
    return [record.queryState || 'search-source', record.resource ? `resource: ${record.resource}` : ''].filter(Boolean).join(' - ');
  }

  if (domain === 'validations') {
    return [
      record.mode || 'blocking',
      `${toArray(record.fields).length} field(s)`,
      `${toArray(record.targets).length} target(s)`
    ].join(' - ');
  }

  if (domain === 'animations') {
    return [
      record.effect || record.preset || 'animation',
      Number.isFinite(Number(record.durationMs)) ? `${record.durationMs}ms` : '',
      record.reducedMotion ? `reduced: ${record.reducedMotion}` : ''
    ].filter(Boolean).join(' - ');
  }

  if (domain === 'transitions') {
    return [
      record.effect || 'transition',
      Number.isFinite(Number(record.durationMs)) ? `${record.durationMs}ms` : '',
      record.trigger && record.trigger.id ? `trigger: ${record.trigger.id}` : ''
    ].filter(Boolean).join(' - ');
  }

  if (domain === 'surfaces' && record.primitive) {
    return [record.kind || 'surface', record.component ? `component: ${record.component}` : '', record.source && record.source.target ? `source: ${record.source.target}` : ''].filter(Boolean).join(' - ');
  }

  if (domain === 'securityPolicies') {
    return [record.kind || 'policy', record.boundary || record.format].filter(Boolean).join(' ');
  }

  if (domain === 'events') {
    return [record.event || 'event', record.action ? `action: ${record.action}` : ''].filter(Boolean).join(' - ');
  }

  if (domain === 'remoteSurfaces') {
    return [record.name || 'remote surface', record.remote && record.remote.id, record.fallback && record.fallback.ref ? `fallback: ${record.fallback.ref}` : 'fallback missing'].filter(Boolean).join(' - ');
  }

  return record.name || record.id || domain;
}

function buildVNextIndexes(coreDocument) {
  const sourceMap = toArray(coreDocument && coreDocument.sourceMap);
  return VNEXT_DOMAINS.reduce((indexes, domain) => {
    const records = toArray(coreDocument && coreDocument[domain])
      .map((record, index) => createIndexRecord(domain, record, index, sourceMap));
    const byId = new Map(records.map((entry) => [entry.id, entry]));

    indexes[domain] = {
      domain,
      records,
      byId,
      ids: records.map((entry) => entry.id)
    };
    return indexes;
  }, {});
}

function createSourceMapSummary(sourceMap) {
  const records = toArray(sourceMap);
  const byNodeType = records.reduce((summary, record) => {
    const key = record && record.nodeType || 'unknown';
    summary[key] = (summary[key] || 0) + 1;
    return summary;
  }, {});

  return {
    totalCount: records.length,
    corePointerCount: records.filter((record) => record && record.corePointer).length,
    astPointerCount: records.filter((record) => record && record.astPointer).length,
    byNodeType
  };
}

function normalizeDiagnostic(diagnostic = {}, sourceModel = null) {
  return {
    schema: diagnostic.schema || RMT_LINTER_DIAGNOSTIC_SCHEMA,
    source: 'rmt-vnext-tooling',
    code: diagnostic.code || 'rmt.vnext.tooling.diagnostic',
    ruleId: diagnostic.ruleId || `vnext.${diagnostic.code || 'diagnostic'}`,
    severity: diagnostic.severity || 'error',
    category: diagnostic.category || 'vnext',
    message: diagnostic.message || diagnostic.code || 'RMT vNext diagnostic',
    uri: diagnostic.uri || (sourceModel ? sourceModel.uri : null),
    file: diagnostic.file || (sourceModel ? sourceModel.filePath : null),
    pointer: diagnostic.pointer || null,
    range: diagnostic.range || (sourceModel && sourceModel.lineRange ? sourceModel.lineRange(0) : null),
    workpackage: RMT_VNEXT_TOOLING_WORKPACKAGE,
    repair: diagnostic.repair || null,
    relatedInformation: diagnostic.relatedInformation || []
  };
}

function summarizeDiagnostics(diagnostics) {
  return diagnostics.reduce((summary, diagnostic) => {
    const severity = diagnostic.severity || 'info';
    const key = `${severity}Count`;
    summary.totalCount += 1;
    summary[key] = (summary[key] || 0) + 1;
    return summary;
  }, {
    totalCount: 0,
    errorCount: 0,
    warningCount: 0,
    infoCount: 0,
    hintCount: 0
  });
}

function comparePosition(left = {}, right = {}) {
  if ((left.line || 0) !== (right.line || 0)) {
    return (left.line || 0) - (right.line || 0);
  }
  return (left.character || 0) - (right.character || 0);
}

function containsPosition(range, position = {}) {
  if (!range || !range.start || !range.end) return false;
  return comparePosition(position, range.start) >= 0 && comparePosition(position, range.end) <= 0;
}

function rangeSpan(range) {
  if (!range) return Number.MAX_SAFE_INTEGER;
  if (Number.isInteger(range.startOffset) && Number.isInteger(range.endOffset)) {
    return Math.max(0, range.endOffset - range.startOffset);
  }
  return ((range.end.line - range.start.line) * 10000) + (range.end.character - range.start.character);
}

function findRmtVNextPointerAtPosition(analysis, position = {}) {
  const sourceMap = toArray(analysis && analysis.sourceMap);
  const candidates = sourceMap
    .filter((record) => record && record.corePointer && containsPosition(record.range, position))
    .map((record) => ({
      pointer: record.corePointer,
      span: rangeSpan(record.range),
      nodeType: record.nodeType
    }))
    .sort((left, right) => {
      const spanDiff = left.span - right.span;
      return spanDiff !== 0 ? spanDiff : String(left.pointer).localeCompare(String(right.pointer));
    });

  return candidates[0] ? candidates[0].pointer : null;
}

function analyzeRmtVNextToolingSource(input = {}, options = {}) {
  const compileResult = compileRmtVNextSource(input, options);
  const sourceModel = compileResult.parserResult && compileResult.parserResult.sourceModel
    ? compileResult.parserResult.sourceModel
    : createSourceModel(input);
  const coreDocument = compileResult.coreDocument || null;
  const sourceMap = coreDocument ? toArray(coreDocument.sourceMap) : [];
  const diagnostics = toArray(compileResult.diagnostics).map((diagnostic) => normalizeDiagnostic(diagnostic, sourceModel));
  const status = compileResult.ok ? 'indexed' : 'source_unavailable';
  const indexes = coreDocument ? buildVNextIndexes(coreDocument) : buildVNextIndexes({});

  return {
    schema: RMT_VNEXT_TOOLING_SCHEMA,
    reportSchema: RMT_VNEXT_TOOLING_REPORT_SCHEMA,
    workpackage: RMT_VNEXT_TOOLING_WORKPACKAGE,
    languageMode: 'vnext',
    coreSchema: coreDocument && coreDocument.schema || RMT_VNEXT_CORE_SCHEMA,
    ok: compileResult.ok === true,
    status,
    graphStatus: status,
    phase: compileResult.phase,
    sourceModel,
    coreDocument,
    sourceDocument: coreDocument,
    ast: compileResult.parserResult && compileResult.parserResult.ast || null,
    sourceMap,
    sourceMapSummary: createSourceMapSummary(sourceMap),
    indexes,
    diagnostics,
    compileResult,
    findPointerAtPosition(position = {}) {
      return findRmtVNextPointerAtPosition(this, position);
    },
    getDefinition(domain, id) {
      const index = this.indexes && this.indexes[domain];
      return index && index.byId ? index.byId.get(id) || null : null;
    }
  };
}

function lintRmtVNextToolingSource(input = {}, options = {}) {
  const analysis = options.analysis || analyzeRmtVNextToolingSource(input, options);
  const diagnostics = toArray(analysis.diagnostics);
  const summary = summarizeDiagnostics(diagnostics);
  const status = summary.errorCount > 0 ? 'failed' : 'passed';

  return {
    schema: RMT_LINTER_REPORT_SCHEMA,
    engineSchema: RMT_VNEXT_TOOLING_SCHEMA,
    semanticGraphSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_TOOLING_WORKPACKAGE,
    languageMode: 'vnext',
    status,
    ok: status === 'passed',
    files: 1,
    graphStatus: analysis.graphStatus,
    coreSchema: analysis.coreSchema,
    sourceMapSummary: analysis.sourceMapSummary,
    providerCapabilities: ['completion', 'hover', 'symbols', 'definition', 'codeAction', 'format'],
    diagnostics,
    ruleCount: 0,
    rules: [],
    ...summary
  };
}

function createCompletionItem(input = {}) {
  const label = normalizeString(input.label);
  return {
    schema: RMT_COMPLETION_ITEM_SCHEMA,
    label,
    insertText: input.insertText || label,
    kind: input.kind || 'keyword',
    detail: input.detail || '',
    documentation: input.documentation || '',
    source: input.source || 'rmt-vnext-tooling',
    targetDomain: input.targetDomain || null,
    pointer: input.pointer || null,
    range: input.range || null,
    sortText: input.sortText || label
  };
}

function staticCompletionItems(entries, base = {}) {
  return entries.map((entry, index) => createCompletionItem({
    ...base,
    label: entry[0],
    documentation: entry[1] || '',
    sortText: `${String(index).padStart(3, '0')}:${entry[0]}`
  }));
}

function inferCompletionContext(pointer, explicitContext) {
  if (explicitContext) return explicitContext;
  if (/^\/states(?:\/|$)/u.test(pointer)) return 'vnext-primitive-state-clauses';
  if (/^\/selectors(?:\/|$)/u.test(pointer)) return 'vnext-primitive-selector-clauses';
  if (/^\/actions(?:\/|$)/u.test(pointer)) return 'vnext-primitive-action-clauses';
  if (/^\/surfaces(?:\/|$)/u.test(pointer)) return 'vnext-primitive-surface-clauses';
  if (/^\/validations(?:\/|$)/u.test(pointer)) return 'vnext-primitive-validation-clauses';
  if (/^\/animations(?:\/|$)/u.test(pointer)) return 'vnext-primitive-animation-clauses';
  if (/^\/transitions(?:\/|$)/u.test(pointer)) return 'vnext-primitive-transition-clauses';
  if (/^\/resources(?:\/|$)/u.test(pointer)) return 'vnext-primitive-resource-kinds';
  if (/^\/overlays(?:\/|$)/u.test(pointer)) return 'vnext-primitive-overlay-kinds';
  if (/^\/lanes(?:\/|$)/u.test(pointer)) return 'vnext-lanes';
  if (/^\/dataSources(?:\/|$)/u.test(pointer) || /\/source(?:\/|$)/u.test(pointer)) return 'vnext-source-kinds';
  if (/^\/securityPolicies(?:\/|$)/u.test(pointer)) return 'vnext-security';
  if (/^\/operations(?:\/|$)/u.test(pointer)) return 'vnext-operation-keywords';
  return 'vnext-keywords';
}

function normalizePosition(position) {
  if (!position || !Number.isInteger(position.line)) {
    return null;
  }

  return {
    line: Math.max(0, position.line),
    character: Number.isInteger(position.character) ? Math.max(0, position.character) : 0
  };
}

function getLinePrefixAtPosition(text, position) {
  const normalized = normalizePosition(position);

  if (!normalized) {
    return '';
  }

  const lines = getInputText(text).split(/\r\n|\r|\n/u);
  const line = lines[normalized.line] || '';

  return line.slice(0, Math.min(normalized.character, line.length));
}

function inferCompletionPrefixFromLine(linePrefix) {
  const match = String(linePrefix || '').match(/([A-Za-z0-9_.-]+)$/u);
  return match ? match[1] : '';
}

function inferPrimitiveCompletionContextFromLine(linePrefix) {
  const source = String(linePrefix || '');
  const trimmed = source.trimStart();

  if (!trimmed) {
    return 'vnext-primitive-keywords';
  }

  if (/^resource\b/u.test(trimmed) && /\bkind\s+[A-Za-z0-9_.-]*$/u.test(trimmed)) {
    return 'vnext-primitive-resource-kinds';
  }

  if (/^overlay\b/u.test(trimmed) && /\bkind\s+[A-Za-z0-9_.-]*$/u.test(trimmed)) {
    return 'vnext-primitive-overlay-kinds';
  }

  if (/^validation\b/u.test(trimmed) || /^(?:mode|target|field|include)\b/u.test(trimmed)) {
    return /\bmode\s+[A-Za-z0-9_.-]*$/u.test(trimmed)
      ? 'vnext-validation-modes'
      : 'vnext-primitive-validation-clauses';
  }

  if (/^(?:field\b.*\s|required|email|minLength|maxLength|pattern|message)\b/u.test(trimmed)) {
    return 'vnext-validation-rules';
  }

  if (/^animation\b/u.test(trimmed) || /^(?:preset|spring|keyframe|allowFilter)\b/u.test(trimmed)) {
    return /\beffect\s+[A-Za-z0-9_.-]*$/u.test(trimmed)
      ? 'vnext-transition-effects'
      : 'vnext-primitive-animation-clauses';
  }

  if (/^transition\b/u.test(trimmed) || /^(?:trigger|from|to|use|effect|durationMs|easing|timeline|layoutKey|interrupt|reducedMotion)\b/u.test(trimmed)) {
    return /\beffect\s+[A-Za-z0-9_.-]*$/u.test(trimmed)
      ? 'vnext-transition-effects'
      : 'vnext-primitive-transition-clauses';
  }

  if (/^state\b/u.test(trimmed)) {
    return 'vnext-primitive-state-clauses';
  }

  if (/^selector\b/u.test(trimmed)) {
    return 'vnext-primitive-selector-clauses';
  }

  if (/^action\b/u.test(trimmed) || /^(?:input|status|reduce|effect|emit)\b/u.test(trimmed)) {
    return 'vnext-primitive-action-clauses';
  }

  if (/^(?:on\s+(?:success|error)\b|on\s*$)/u.test(trimmed)) {
    return 'vnext-primitive-action-clauses';
  }

  if (/^(?:inp|red|eff|emi)[A-Za-z0-9_.-]*$/u.test(trimmed)) {
    return 'vnext-primitive-action-clauses';
  }

  if (/^surface\b/u.test(trimmed)) {
    return 'vnext-primitive-surface-clauses';
  }

  if (/^(?:source|repeat|key|portal|bounds|preserve|destroy|lane|payload|resumability)\b/u.test(trimmed)) {
    return 'vnext-primitive-surface-clauses';
  }

  if (/^(?:sta|sel|dat|act|ani|por|ove|res|sur|val|tra|pay|des)[A-Za-z0-9_.-]*$/u.test(trimmed)) {
    return 'vnext-primitive-keywords';
  }

  return null;
}

function inferPointerAtPosition(analysis, position) {
  const normalized = normalizePosition(position);

  if (!normalized || !analysis || typeof analysis.findPointerAtPosition !== 'function') {
    return '';
  }

  return normalizeString(analysis.findPointerAtPosition(normalized));
}

function resolveCompletionRequest(input = {}, options = {}, analysis) {
  const position = normalizePosition(options.position || input.position);
  const linePrefix = position ? getLinePrefixAtPosition(input, position) : '';
  const explicitContext = normalizeString(options.context || input.context);
  const explicitPointer = normalizeString(options.pointer || input.pointer);
  const pointer = explicitPointer || inferPointerAtPosition(analysis, position);
  const lineContext = position && !explicitContext ? inferPrimitiveCompletionContextFromLine(linePrefix) : null;
  const context = explicitContext || lineContext || inferCompletionContext(pointer, null);
  const explicitPrefix = normalizeString(options.prefix || input.prefix);
  const prefix = explicitPrefix || (explicitPointer && !lineContext ? '' : inferCompletionPrefixFromLine(linePrefix));

  return {
    pointer,
    context,
    prefix,
    position,
    linePrefix
  };
}

function sortItems(items) {
  return items.slice().sort((left, right) => String(left.sortText || left.label).localeCompare(String(right.sortText || right.label)));
}

function getRmtVNextToolingCompletions(input = {}, options = {}) {
  const analysis = options.analysis || analyzeRmtVNextToolingSource(input, options);
  const request = resolveCompletionRequest(input, options, analysis);
  const { pointer, context, prefix } = request;
  let items = [];

  if (context === 'vnext-lanes') {
    items = staticCompletionItems(VNEXT_LANES, { kind: 'enum', detail: 'vNext Scheduler Lane' });
  } else if (context === 'vnext-source-kinds') {
    items = staticCompletionItems(VNEXT_SOURCE_KINDS, { kind: 'enum', detail: 'vNext Data Source Kind' });
  } else if (context === 'vnext-primitive-keywords') {
    items = staticCompletionItems(VNEXT_PRIMITIVE_KEYWORDS, { kind: 'keyword', detail: 'vNext App-Platform Primitive' });
  } else if (context === 'vnext-primitive-state-clauses') {
    items = staticCompletionItems(VNEXT_PRIMITIVE_STATE_CLAUSES, { kind: 'keyword', detail: 'vNext State Clause' });
  } else if (context === 'vnext-primitive-selector-clauses') {
    items = staticCompletionItems(VNEXT_PRIMITIVE_SELECTOR_CLAUSES, { kind: 'keyword', detail: 'vNext Selector Clause' });
  } else if (context === 'vnext-primitive-action-clauses') {
    items = staticCompletionItems(VNEXT_PRIMITIVE_ACTION_CLAUSES, { kind: 'keyword', detail: 'vNext Action Clause' });
  } else if (context === 'vnext-primitive-surface-clauses') {
    items = staticCompletionItems(VNEXT_PRIMITIVE_SURFACE_CLAUSES, { kind: 'keyword', detail: 'vNext Surface Clause' });
  } else if (context === 'vnext-primitive-validation-clauses') {
    items = staticCompletionItems(VNEXT_PRIMITIVE_VALIDATION_CLAUSES, { kind: 'keyword', detail: 'vNext Validation Clause' });
  } else if (context === 'vnext-primitive-animation-clauses') {
    items = staticCompletionItems(VNEXT_PRIMITIVE_ANIMATION_CLAUSES, { kind: 'keyword', detail: 'vNext Animation Clause' });
  } else if (context === 'vnext-primitive-transition-clauses') {
    items = staticCompletionItems(VNEXT_PRIMITIVE_TRANSITION_CLAUSES, { kind: 'keyword', detail: 'vNext Surface Transition Clause' });
  } else if (context === 'vnext-validation-modes') {
    items = staticCompletionItems(VNEXT_VALIDATION_MODES, { kind: 'enum', detail: 'vNext Validation Mode' });
  } else if (context === 'vnext-validation-rules') {
    items = staticCompletionItems(VNEXT_VALIDATION_RULES, { kind: 'enum', detail: 'vNext Validation Rule' });
  } else if (context === 'vnext-transition-effects') {
    items = staticCompletionItems(VNEXT_TRANSITION_EFFECTS, { kind: 'enum', detail: 'vNext Surface Transition Effect' });
  } else if (context === 'vnext-primitive-resource-kinds') {
    items = staticCompletionItems(VNEXT_PRIMITIVE_RESOURCE_KINDS, { kind: 'enum', detail: 'vNext Resource Kind' });
  } else if (context === 'vnext-primitive-overlay-kinds') {
    items = staticCompletionItems(VNEXT_PRIMITIVE_OVERLAY_KINDS, { kind: 'enum', detail: 'vNext Overlay Kind' });
  } else if (context === 'vnext-security') {
    items = staticCompletionItems(VNEXT_TRUST_BOUNDARIES, { kind: 'reference', detail: 'vNext Trust Boundary' })
      .concat(createCompletionItem({
        label: 'html',
        kind: 'enum',
        detail: 'Sanitize Format',
        documentation: 'HTML Sanitizing fuer unsichere Stream- oder Endpoint-Flows.'
      }));
  } else if (context === 'vnext-snippets') {
    items = VNEXT_SNIPPETS.map((snippet, index) => createCompletionItem({
      label: snippet.label,
      insertText: snippet.body.join('\n'),
      kind: 'snippet',
      detail: snippet.prefix,
      documentation: snippet.description,
      source: 'rmt-vnext-snippet-catalog',
      sortText: `${String(index).padStart(3, '0')}:${snippet.label}`
    }));
  } else {
    items = staticCompletionItems(VNEXT_COMPLETION_KEYWORDS, { kind: 'keyword', detail: 'vNext Keyword' });
  }

  const filtered = prefix ? items.filter((item) => item.label.startsWith(prefix)) : items;

  return {
    schema: RMT_COMPLETION_REPORT_SCHEMA,
    providerSchema: RMT_COMPLETION_PROVIDER_SCHEMA,
    workpackage: RMT_VNEXT_TOOLING_WORKPACKAGE,
    languageMode: 'vnext',
    status: analysis.graphStatus === 'source_unavailable' && context !== 'vnext-keywords' ? 'source_unavailable' : 'completed',
    ok: true,
    context,
    prefix,
    pointer,
    position: request.position,
    itemCount: filtered.length,
    items: sortItems(filtered),
    graphStatus: analysis.graphStatus,
    sourceMapSummary: analysis.sourceMapSummary
  };
}

function createHover(input = {}) {
  const title = input.title || input.kind || 'RMT vNext';
  const lines = [title, input.documentation || '', input.detail || ''].filter(Boolean);
  return {
    schema: RMT_HOVER_SCHEMA,
    kind: input.kind || 'vnext',
    title,
    markdown: lines.join('\n\n'),
    contents: lines,
    pointer: input.pointer || null,
    range: input.range || null,
    target: input.target || null,
    source: 'rmt-vnext-tooling'
  };
}

function findEntryByPointer(analysis, pointer) {
  for (const domain of VNEXT_DOMAINS) {
    const index = analysis.indexes && analysis.indexes[domain];
    const match = toArray(index && index.records).find((entry) => pointer === entry.pointer || pointer.startsWith(`${entry.pointer}/`));
    if (match) return match;
  }
  return null;
}

function getRmtVNextToolingHover(input = {}, options = {}) {
  const analysis = options.analysis || analyzeRmtVNextToolingSource(input, options);
  const pointer = normalizeString(options.pointer || input.pointer);
  const entry = pointer ? findEntryByPointer(analysis, pointer) : null;
  const config = entry ? DOMAIN_CONFIG[entry.domain] : null;
  const hover = entry && config ? createHover({
    kind: config.kind,
    title: `${config.label}: ${entry.name || entry.id}`,
    documentation: entry.detail,
    detail: `Core Pointer: ${entry.pointer}`,
    pointer,
    range: entry.range
  }) : null;

  return {
    schema: RMT_HOVER_REPORT_SCHEMA,
    providerSchema: RMT_HOVER_PROVIDER_SCHEMA,
    hoverSchema: RMT_HOVER_SCHEMA,
    workpackage: RMT_VNEXT_TOOLING_WORKPACKAGE,
    languageMode: 'vnext',
    status: hover ? 'found' : 'not_found',
    ok: !!hover,
    pointer,
    hover,
    graphStatus: analysis.graphStatus,
    sourceMapSummary: analysis.sourceMapSummary
  };
}

function createDocumentSymbol(input = {}) {
  return {
    schema: RMT_DOCUMENT_SYMBOL_SCHEMA,
    name: input.name || '',
    kind: input.kind || 'value',
    detail: input.detail || '',
    pointer: input.pointer || null,
    range: input.range || null,
    selectionRange: input.selectionRange || input.range || null,
    children: toArray(input.children)
  };
}

function getRmtVNextToolingDocumentSymbols(input = {}, options = {}) {
  const analysis = options.analysis || analyzeRmtVNextToolingSource(input, options);
  const symbols = VNEXT_DOMAINS
    .filter((domain) => analysis.indexes && analysis.indexes[domain] && analysis.indexes[domain].records.length > 0)
    .map((domain) => {
      const config = DOMAIN_CONFIG[domain];
      return createDocumentSymbol({
        name: domain,
        kind: 'namespace',
        detail: `vNext ${config.label} Records`,
        pointer: `/${domain}`,
        range: toArray(analysis.indexes[domain].records)[0].range,
        children: analysis.indexes[domain].records.map((entry) => createDocumentSymbol({
          name: entry.name || entry.id,
          kind: config.childKind,
          detail: entry.detail,
          pointer: entry.pointer,
          range: entry.range,
          selectionRange: entry.idRange
        }))
      });
    });

  return {
    schema: RMT_DOCUMENT_SYMBOLS_REPORT_SCHEMA,
    providerSchema: RMT_DOCUMENT_SYMBOLS_PROVIDER_SCHEMA,
    symbolSchema: RMT_DOCUMENT_SYMBOL_SCHEMA,
    workpackage: RMT_VNEXT_TOOLING_WORKPACKAGE,
    languageMode: 'vnext',
    status: analysis.ok ? 'completed' : 'source_unavailable',
    ok: analysis.ok,
    symbolCount: symbols.length,
    symbols,
    graphStatus: analysis.graphStatus,
    sourceMapSummary: analysis.sourceMapSummary
  };
}

function definitionTarget(entry, sourcePointer, relationship) {
  if (!entry) return null;
  return {
    schema: RMT_DEFINITION_TARGET_SCHEMA,
    domain: entry.domain,
    id: entry.id,
    pointer: entry.idPointer,
    range: entry.idRange,
    recordPointer: entry.pointer,
    recordRange: entry.range,
    relationship: relationship || null,
    sourcePointer: sourcePointer || null,
    sourceRange: null,
    source: 'rmt-vnext-tooling'
  };
}

function resolveDefinitionEntry(analysis, pointer) {
  const core = analysis.coreDocument || {};
  const segments = pointer.split('/').filter(Boolean);
  const domain = segments[0];
  const index = Number(segments[1]);
  const field = segments[2];
  const record = Number.isInteger(index) ? toArray(core[domain])[index] : null;

  if (!record) return null;

  if (domain === 'operations') {
    if (field === 'scope' && segments[3] === 'lane') return analysis.indexes.lanes.byId.get(record.scope && record.scope.lane) || null;
    if (field === 'scope' && segments[3] === 'surface') return analysis.indexes.surfaces.byId.get(record.scope && record.scope.surface) || null;
    if (field === 'scope' && segments[3] === 'template') return analysis.indexes.templates.byId.get(record.scope && record.scope.template) || null;
    if (field === 'source' || field === 'sourceRef') return analysis.indexes.dataSources.byId.get(record.source && record.source.ref) || null;
    if (field === 'policyRefs') {
      const policyRef = toArray(record.policyRefs)[Number(segments[3])];
      return analysis.indexes.securityPolicies.byId.get(policyRef) || analysis.indexes.slots.byId.get(policyRef) || null;
    }
  }

  if (field === 'ownerOperation') {
    return analysis.indexes.operations.byId.get(record.ownerOperation) || null;
  }

  if (field === 'operationRefs') {
    const operationRef = toArray(record.operationRefs)[Number(segments[3])];
    return analysis.indexes.operations.byId.get(operationRef) || null;
  }

  const selfEntry = analysis.indexes[domain] && analysis.indexes[domain].records[index];
  return selfEntry && (pointer === selfEntry.pointer || pointer === selfEntry.idPointer) ? selfEntry : null;
}

function getRmtVNextToolingDefinition(input = {}, options = {}) {
  const analysis = options.analysis || analyzeRmtVNextToolingSource(input, options);
  const pointer = normalizeString(options.pointer || input.pointer);
  const targetEntry = pointer ? resolveDefinitionEntry(analysis, pointer) : null;
  const target = definitionTarget(targetEntry, pointer, targetEntry ? 'vnext.core-ref' : null);

  return {
    schema: RMT_DEFINITION_REPORT_SCHEMA,
    providerSchema: RMT_DEFINITION_PROVIDER_SCHEMA,
    workpackage: RMT_VNEXT_TOOLING_WORKPACKAGE,
    languageMode: 'vnext',
    status: target ? 'resolved' : 'not_found',
    ok: !!target,
    pointer,
    domain: targetEntry ? targetEntry.domain : null,
    id: targetEntry ? targetEntry.id : null,
    sourceDomain: pointer ? pointer.split('/').filter(Boolean)[0] || null : null,
    sourceId: null,
    relationship: target ? target.relationship : null,
    target,
    graphStatus: analysis.graphStatus,
    sourceMapSummary: analysis.sourceMapSummary
  };
}

function createTextEdit(range, newText, annotationId = null) {
  return {
    range,
    newText,
    annotationId
  };
}

function createWorkspaceEdit(uri, edits, metadata = {}) {
  return {
    schema: RMT_WORKSPACE_EDIT_SCHEMA,
    changes: {
      [uri]: edits
    },
    metadata
  };
}

function createVNextPrimitiveCodeAction(input = {}) {
  return {
    schema: RMT_CODE_ACTION_SCHEMA,
    title: input.title,
    kind: input.kind || 'quickfix',
    diagnosticCode: input.diagnosticCode || null,
    pointer: input.pointer || null,
    safe: input.safe !== false,
    confidence: input.confidence || 'high',
    source: input.source || 'rmt-vnext-primitive-code-actions',
    diagnostics: toArray(input.diagnostics),
    edit: input.edit || null,
    command: input.command || null,
    preview: input.preview || null,
    fixAllActionCount: input.fixAllActionCount || null,
    diagnosticCodes: toArray(input.diagnosticCodes),
    isPreferred: !!input.isPreferred,
    workpackage: RMT_VNEXT_PRIMITIVE_AUTHORING_WORKPACKAGE
  };
}

function collectWorkspaceEditEntries(edit) {
  return Object.entries(edit && edit.changes ? edit.changes : {}).flatMap(([uri, edits]) => (
    toArray(edits).map((entry, index) => ({
      uri,
      edit: entry,
      index
    }))
  ));
}

function workspaceEditUris(edit) {
  return Array.from(new Set(collectWorkspaceEditEntries(edit).map((entry) => entry.uri))).sort();
}

function applyWorkspaceEditToText(text, edit, uri) {
  const sourceModel = createRmtSourceModel({
    text,
    uri: uri || 'untitled:rmt-document'
  });
  const patches = collectWorkspaceEditEntries(edit)
    .filter((entry) => !uri || entry.uri === uri)
    .map((entry) => {
      const range = entry.edit && entry.edit.range;
      return {
        ...entry,
        start: range ? sourceModel.offsetAt(range.start) : 0,
        end: range ? sourceModel.offsetAt(range.end) : 0,
        newText: entry.edit && typeof entry.edit.newText === 'string' ? entry.edit.newText : ''
      };
    })
    .sort((left, right) => {
      if (left.start !== right.start) return right.start - left.start;
      if (left.end !== right.end) return right.end - left.end;
      return right.index - left.index;
    });
  let nextText = text;

  patches.forEach((patch) => {
    nextText = `${nextText.slice(0, patch.start)}${patch.newText}${nextText.slice(patch.end)}`;
  });

  return nextText;
}

function summarizePreviewLines(beforeText, afterText) {
  const beforeLines = String(beforeText || '').split(/\r\n|\r|\n/u);
  const afterLines = String(afterText || '').split(/\r\n|\r|\n/u);
  const max = Math.max(beforeLines.length, afterLines.length);
  let firstChangedLine = -1;

  for (let index = 0; index < max; index += 1) {
    if ((beforeLines[index] || '') !== (afterLines[index] || '')) {
      firstChangedLine = index;
      break;
    }
  }

  if (firstChangedLine < 0) {
    return {
      changedLineCount: 0,
      firstChangedLine: null,
      before: [],
      after: []
    };
  }

  let changedLineCount = 0;
  for (let index = firstChangedLine; index < max; index += 1) {
    if ((beforeLines[index] || '') !== (afterLines[index] || '')) {
      changedLineCount += 1;
    }
  }

  const end = firstChangedLine + 8;
  return {
    changedLineCount,
    firstChangedLine,
    before: beforeLines.slice(firstChangedLine, end),
    after: afterLines.slice(firstChangedLine, end)
  };
}

function createWorkspaceEditPreview(analysis, action, edit) {
  const sourceModel = analysis && analysis.sourceModel;
  const entries = collectWorkspaceEditEntries(edit);
  const affectedUris = workspaceEditUris(edit);
  const uri = sourceModel && sourceModel.uri;
  const localEntries = uri ? entries.filter((entry) => entry.uri === uri) : [];
  const status = localEntries.length > 0 ? 'ready' : entries.length > 0 ? 'external-uri' : 'empty';
  const beforeText = sourceModel ? sourceModel.text : '';
  const afterText = localEntries.length > 0
    ? applyWorkspaceEditToText(beforeText, {
      schema: RMT_WORKSPACE_EDIT_SCHEMA,
      changes: {
        [uri]: localEntries.map((entry) => entry.edit)
      }
    }, uri)
    : beforeText;
  const summary = summarizePreviewLines(beforeText, afterText);

  return {
    schema: RMT_VNEXT_PRIMITIVE_CODE_ACTION_PREVIEW_SCHEMA,
    status,
    title: action && action.title ? action.title : null,
    kind: action && action.kind ? action.kind : 'quickfix',
    diagnosticCode: action && action.diagnosticCode ? action.diagnosticCode : null,
    safe: !(action && action.safe === false),
    uri: uri || null,
    affectedUris,
    editCount: entries.length,
    localEditCount: localEntries.length,
    changedLineCount: summary.changedLineCount,
    firstChangedLine: summary.firstChangedLine,
    before: summary.before,
    after: summary.after,
    repairKind: edit && edit.metadata ? edit.metadata.repairKind || null : null,
    workpackage: RMT_VNEXT_PRIMITIVE_AUTHORING_WORKPACKAGE
  };
}

function attachVNextPrimitiveActionPreview(analysis, action) {
  if (!action) {
    return null;
  }

  if (!action.edit) {
    return {
      ...action,
      preview: {
        schema: RMT_VNEXT_PRIMITIVE_CODE_ACTION_PREVIEW_SCHEMA,
        status: action.command ? 'manual-command' : 'empty',
        title: action.title || null,
        kind: action.kind || 'quickfix',
        diagnosticCode: action.diagnosticCode || null,
        safe: action.safe !== false,
        uri: analysis && analysis.sourceModel ? analysis.sourceModel.uri : null,
        affectedUris: [],
        editCount: 0,
        localEditCount: 0,
        changedLineCount: 0,
        firstChangedLine: null,
        before: [],
        after: [],
        repairKind: null,
        workpackage: RMT_VNEXT_PRIMITIVE_AUTHORING_WORKPACKAGE
      }
    };
  }

  return {
    ...action,
    preview: createWorkspaceEditPreview(analysis, action, action.edit)
  };
}

function rangeAtOffset(sourceModel, offset) {
  if (!sourceModel || typeof sourceModel.rangeForOffsets !== 'function') {
    return null;
  }

  return sourceModel.rangeForOffsets(offset, offset);
}

function lineIndent(sourceModel, line) {
  const text = sourceModel && typeof sourceModel.lineText === 'function'
    ? sourceModel.lineText(line)
    : '';
  return (text.match(/^\s*/u) || [''])[0];
}

function lineEndInsertRange(sourceModel, line) {
  if (!sourceModel || typeof sourceModel.lineRange !== 'function') {
    return null;
  }

  const lineRange = sourceModel.lineRange(line);
  return lineRange && Number.isInteger(lineRange.endOffset)
    ? rangeAtOffset(sourceModel, lineRange.endOffset)
    : null;
}

function createLineEndInsertAction(analysis, diagnostic, newText, title, metadata = {}) {
  const sourceModel = analysis.sourceModel;
  const range = diagnostic.range || null;
  const line = range && range.start ? range.start.line : 0;
  const insertRange = lineEndInsertRange(sourceModel, line);

  if (!insertRange || !sourceModel || !sourceModel.uri) {
    return null;
  }

  return createVNextPrimitiveCodeAction({
    title,
    diagnosticCode: diagnostic.code,
    pointer: diagnostic.pointer || null,
    diagnostics: [diagnostic],
    edit: createWorkspaceEdit(sourceModel.uri, [
      createTextEdit(insertRange, newText, metadata.annotationId || `vnext-${diagnostic.code}`)
    ], {
      repairKind: metadata.repairKind || 'insert-vnext-primitive-clause',
      workpackage: RMT_VNEXT_PRIMITIVE_AUTHORING_WORKPACKAGE,
      ...metadata
    }),
    isPreferred: metadata.isPreferred !== false
  });
}

function getVNextPrimitiveSemanticGraph(analysis) {
  return analysis
    && analysis.compileResult
    && analysis.compileResult.primitiveSemanticGraph
    ? analysis.compileResult.primitiveSemanticGraph
    : null;
}

function getFirstCatalogId(analysis, key, fallbackDomain) {
  const semanticGraph = getVNextPrimitiveSemanticGraph(analysis);
  const hints = semanticGraph && semanticGraph.catalogHints || {};
  const fromHints = toArray(hints[key])[0];

  if (fromHints) {
    return fromHints;
  }

  const index = analysis && analysis.indexes && analysis.indexes[fallbackDomain];
  return index && index.ids ? index.ids[0] || '' : '';
}

function selectPrimitiveOwner(analysis) {
  const surfaceId = getFirstCatalogId(analysis, 'surfaceIds', 'surfaces');

  if (surfaceId) {
    return {
      kind: 'surface',
      id: surfaceId
    };
  }

  const overlayId = getFirstCatalogId(analysis, 'overlayIds', 'overlays');

  if (overlayId) {
    return {
      kind: 'overlay',
      id: overlayId
    };
  }

  return null;
}

function createResourceOwnerAction(analysis, diagnostic) {
  const sourceModel = analysis.sourceModel;
  const owner = selectPrimitiveOwner(analysis);
  const line = diagnostic.range && diagnostic.range.start ? diagnostic.range.start.line : 0;
  const lineText = sourceModel && typeof sourceModel.lineText === 'function' ? sourceModel.lineText(line) : '';
  const ownerText = owner ? `${owner.kind}.${owner.id}` : '';

  if (!sourceModel || !sourceModel.uri || !ownerText || !/\bresource\b/u.test(lineText)) {
    return null;
  }

  const lineRange = sourceModel.lineRange(line);
  const braceIndex = lineText.indexOf('{');
  const insertOffset = braceIndex >= 0
    ? lineRange.startOffset + braceIndex
    : lineRange.endOffset;
  const insertText = braceIndex >= 0
    ? `owner ${ownerText} `
    : ` owner ${ownerText}`;
  const insertRange = rangeAtOffset(sourceModel, insertOffset);

  if (!insertRange) {
    return null;
  }

  return createVNextPrimitiveCodeAction({
    title: `Resource owner auf ${ownerText} setzen`,
    diagnosticCode: diagnostic.code,
    pointer: diagnostic.pointer || null,
    diagnostics: [diagnostic],
    edit: createWorkspaceEdit(sourceModel.uri, [
      createTextEdit(insertRange, insertText, `vnext-owner-${diagnostic.code}`)
    ], {
      repairKind: 'add-resource-owner',
      owner: ownerText,
      workpackage: RMT_VNEXT_PRIMITIVE_AUTHORING_WORKPACKAGE
    }),
    isPreferred: true
  });
}

function createSurfaceKeyAction(analysis, diagnostic) {
  const sourceModel = analysis.sourceModel;
  const line = diagnostic.range && diagnostic.range.start ? diagnostic.range.start.line : 0;
  const indent = lineIndent(sourceModel, line);

  return createLineEndInsertAction(
    analysis,
    diagnostic,
    `\n${indent}key instance.id`,
    'Surface key-Klausel ergaenzen',
    {
      repairKind: 'add-surface-key-clause',
      insertedClause: 'key instance.id'
    }
  );
}

function createPayloadContractAction(analysis, diagnostic) {
  const sourceModel = analysis.sourceModel;
  const line = diagnostic.range && diagnostic.range.start ? diagnostic.range.start.line : 0;
  const text = sourceModel && typeof sourceModel.lineText === 'function' ? sourceModel.lineText(line) : '';
  const trimmed = text.trim();
  const indent = lineIndent(sourceModel, line);
  const newText = /^emit\b/u.test(trimmed)
    ? ' with value input.value'
    : trimmed.endsWith('{')
      ? `\n${indent}  payload id from target.dataset.id`
      : ` {\n${indent}  payload id from target.dataset.id\n${indent}}`;

  return createLineEndInsertAction(
    analysis,
    diagnostic,
    newText,
    'Event Payload Contract ergaenzen',
    {
      repairKind: 'add-event-payload-contract',
      insertedClause: /^emit\b/u.test(trimmed) ? 'with value input.value' : 'payload id from target.dataset.id'
    }
  );
}

function findAstNodeByPointer(node, pointer) {
  if (!node || typeof node !== 'object' || !pointer) {
    return null;
  }

  if (node.astPointer === pointer) {
    return node;
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        const match = findAstNodeByPointer(entry, pointer);
        if (match) return match;
      }
    } else if (value && typeof value === 'object') {
      const match = findAstNodeByPointer(value, pointer);
      if (match) return match;
    }
  }

  return null;
}

function findTemplateChildForPointer(ast, pointer) {
  const templates = toArray(ast && ast.body).filter((entry) => entry && entry.type === 'RmtTemplateDeclaration');

  for (const template of templates) {
    for (const child of toArray(template.body)) {
      if (child && child.astPointer && pointer.startsWith(child.astPointer)) {
        return child;
      }
    }
  }

  return null;
}

function insertRangeBeforeTemplateChild(analysis, pointer) {
  const sourceModel = analysis.sourceModel;
  const child = findTemplateChildForPointer(analysis.ast, pointer);

  if (!sourceModel || !child || !child.range || !child.range.start) {
    return null;
  }

  const lineRange = sourceModel.lineRange(child.range.start.line);
  return {
    range: rangeAtOffset(sourceModel, lineRange.startOffset),
    indent: lineIndent(sourceModel, child.range.start.line)
  };
}

function getReferenceForDiagnostic(analysis, diagnostic) {
  const semanticGraph = getVNextPrimitiveSemanticGraph(analysis);
  return semanticGraph && typeof semanticGraph.findReferenceAtPointer === 'function'
    ? semanticGraph.findReferenceAtPointer(diagnostic.pointer)
    : null;
}

function createSelectorStubAction(analysis, diagnostic, reference) {
  const sourceModel = analysis.sourceModel;
  const insertion = insertRangeBeforeTemplateChild(analysis, diagnostic.pointer);
  const targetId = normalizeString(reference && reference.targetId);
  const stateId = getFirstCatalogId(analysis, 'stateIds', 'states') || 'app.state';

  if (!sourceModel || !sourceModel.uri || !insertion || !targetId) {
    return null;
  }

  const selectorText = `${insertion.indent}selector ${targetId} from state ${stateId} {\n${insertion.indent}  output GeneratedRecord[]\n${insertion.indent}}\n\n`;

  return createVNextPrimitiveCodeAction({
    title: `Selector "${targetId}" anlegen`,
    diagnosticCode: diagnostic.code,
    pointer: diagnostic.pointer || null,
    diagnostics: [diagnostic],
    edit: createWorkspaceEdit(sourceModel.uri, [
      createTextEdit(insertion.range, selectorText, `vnext-selector-${targetId}`)
    ], {
      repairKind: 'create-selector-stub',
      targetDomain: 'selectors',
      targetId,
      dedupeKey: `selectors:${targetId}`,
      workpackage: RMT_VNEXT_PRIMITIVE_AUTHORING_WORKPACKAGE
    }),
    isPreferred: true
  });
}

function createPortalStubAction(analysis, diagnostic, reference) {
  const sourceModel = analysis.sourceModel;
  const insertion = insertRangeBeforeTemplateChild(analysis, diagnostic.pointer);
  const targetId = normalizeString(reference && reference.targetId);
  const rootId = targetId ? targetId.replace(/[^A-Za-z0-9_-]+/gu, '-').replace(/^-+|-+$/gu, '') : 'generated-portal';

  if (!sourceModel || !sourceModel.uri || !insertion || !targetId) {
    return null;
  }

  const portalText = `${insertion.indent}portal ${targetId} root "#${rootId || 'generated-portal'}" layer surface\n\n`;

  return createVNextPrimitiveCodeAction({
    title: `Portal "${targetId}" anlegen`,
    diagnosticCode: diagnostic.code,
    pointer: diagnostic.pointer || null,
    diagnostics: [diagnostic],
    edit: createWorkspaceEdit(sourceModel.uri, [
      createTextEdit(insertion.range, portalText, `vnext-portal-${targetId}`)
    ], {
      repairKind: 'create-portal-stub',
      targetDomain: 'portals',
      targetId,
      dedupeKey: `portals:${targetId}`,
      workpackage: RMT_VNEXT_PRIMITIVE_AUTHORING_WORKPACKAGE
    }),
    isPreferred: true
  });
}

function createUnknownReferenceAction(analysis, diagnostic) {
  const reference = getReferenceForDiagnostic(analysis, diagnostic);

  if (!reference || reference.resolved) {
    return null;
  }

  if (reference.targetDomain === 'selectors') {
    return createSelectorStubAction(analysis, diagnostic, reference);
  }

  if (reference.targetDomain === 'portals') {
    return createPortalStubAction(analysis, diagnostic, reference);
  }

  return null;
}

function defaultInitialForState(node) {
  const typeValue = normalizeString(node && node.dataType && node.dataType.value).toLowerCase();

  if (typeValue.includes('[]')) {
    return '[]';
  }

  if (typeValue.includes('boolean')) {
    return 'false';
  }

  if (typeValue.includes('number') || typeValue.includes('int') || typeValue.includes('float')) {
    return '0';
  }

  if (typeValue.includes('string')) {
    return '""';
  }

  return '';
}

function createStateInitialAction(analysis, diagnostic) {
  const sourceModel = analysis.sourceModel;
  const node = findAstNodeByPointer(analysis.ast, diagnostic.pointer);
  const line = diagnostic.range && diagnostic.range.start ? diagnostic.range.start.line : 0;
  const text = sourceModel && typeof sourceModel.lineText === 'function' ? sourceModel.lineText(line) : '';
  const indent = lineIndent(sourceModel, line);
  const lineRange = sourceModel && typeof sourceModel.lineRange === 'function' ? sourceModel.lineRange(line) : null;
  const initialValue = defaultInitialForState(node);

  if (!sourceModel || !sourceModel.uri || !lineRange) {
    return null;
  }

  let newText = initialValue ? ` initial ${initialValue}` : ` {\n${indent}  initial {}\n${indent}}`;

  if (text.includes('{')) {
    newText = `\n${indent}  initial {}`;
  }

  return createVNextPrimitiveCodeAction({
    title: 'State initial-Wert ergaenzen',
    diagnosticCode: diagnostic.code,
    pointer: diagnostic.pointer || null,
    diagnostics: [diagnostic],
    edit: createWorkspaceEdit(sourceModel.uri, [
      createTextEdit(rangeAtOffset(sourceModel, lineRange.endOffset), newText, `vnext-initial-${diagnostic.code}`)
    ], {
      repairKind: 'add-state-initial',
      insertedClause: initialValue ? `initial ${initialValue}` : 'initial {}',
      workpackage: RMT_VNEXT_PRIMITIVE_AUTHORING_WORKPACKAGE
    }),
    isPreferred: true
  });
}

function createResourceKindAction(analysis, diagnostic) {
  const sourceModel = analysis.sourceModel;
  const line = diagnostic.range && diagnostic.range.start ? diagnostic.range.start.line : 0;
  const text = sourceModel && typeof sourceModel.lineText === 'function' ? sourceModel.lineText(line) : '';
  const lineRange = sourceModel && typeof sourceModel.lineRange === 'function' ? sourceModel.lineRange(line) : null;
  const match = text.match(/^(\s*resource\s+\S+\s*)/u);

  if (!sourceModel || !sourceModel.uri || !lineRange || !match) {
    return null;
  }

  return createVNextPrimitiveCodeAction({
    title: 'Resource kind auf object-url setzen',
    diagnosticCode: diagnostic.code,
    pointer: diagnostic.pointer || null,
    diagnostics: [diagnostic],
    edit: createWorkspaceEdit(sourceModel.uri, [
      createTextEdit(rangeAtOffset(sourceModel, lineRange.startOffset + match[1].length), 'kind object-url ', `vnext-kind-${diagnostic.code}`)
    ], {
      repairKind: 'add-resource-kind',
      resourceKind: 'object-url',
      workpackage: RMT_VNEXT_PRIMITIVE_AUTHORING_WORKPACKAGE
    }),
    isPreferred: true
  });
}

function insertRangeBeforeNodeEnd(analysis, node) {
  const sourceModel = analysis.sourceModel;

  if (!sourceModel || !node || !node.range || !node.range.end) {
    return null;
  }

  const lineRange = sourceModel.lineRange(node.range.end.line);

  return {
    range: rangeAtOffset(sourceModel, lineRange.startOffset),
    closingIndent: lineIndent(sourceModel, node.range.end.line)
  };
}

function firstActionInputName(node) {
  const input = toArray(node && node.body).find((entry) => entry && entry.type === 'RmtActionInputClause' && entry.name);
  return normalizeString(input && input.name);
}

function createActionReducerAction(analysis, diagnostic) {
  const sourceModel = analysis.sourceModel;
  const node = findAstNodeByPointer(analysis.ast, diagnostic.pointer);
  const insertion = insertRangeBeforeNodeEnd(analysis, node);
  const stateId = getFirstCatalogId(analysis, 'stateIds', 'states') || 'app.state';
  const inputName = firstActionInputName(node);
  const expression = inputName ? `input.${inputName}` : `state.${stateId}`;

  if (!sourceModel || !sourceModel.uri || !insertion) {
    return null;
  }

  return createVNextPrimitiveCodeAction({
    title: `Action Reducer-Ziel auf state.${stateId} setzen`,
    diagnosticCode: diagnostic.code,
    pointer: diagnostic.pointer || null,
    diagnostics: [diagnostic],
    edit: createWorkspaceEdit(sourceModel.uri, [
      createTextEdit(
        insertion.range,
        `${insertion.closingIndent}  reduce state.${stateId} = ${expression}\n`,
        `vnext-action-reducer-${diagnostic.code}`
      )
    ], {
      repairKind: 'add-action-reducer-target',
      stateId,
      inputName: inputName || null,
      workpackage: RMT_VNEXT_PRIMITIVE_AUTHORING_WORKPACKAGE
    }),
    isPreferred: true
  });
}

function createEffectSourceAction(analysis, diagnostic) {
  const dataSourceId = getFirstCatalogId(analysis, 'dataSourceIds', 'dataSources') || 'generated.datasource';

  return createLineEndInsertAction(
    analysis,
    diagnostic,
    ` datasource ${dataSourceId}`,
    `Effect-Quelle datasource ${dataSourceId} ergaenzen`,
    {
      repairKind: 'add-effect-source',
      targetDomain: 'dataSources',
      targetId: dataSourceId
    }
  );
}

function createKernelBoundaryCommandAction(analysis, diagnostic) {
  const sourceModel = analysis.sourceModel;

  return createVNextPrimitiveCodeAction({
    title: 'Kernel/Fabric Import in Host-Adapter auslagern',
    diagnosticCode: diagnostic.code,
    pointer: diagnostic.pointer || null,
    diagnostics: [diagnostic],
    safe: false,
    confidence: 'manual',
    command: {
      title: 'Kernel/Fabric Import in Host-Adapter auslagern',
      command: RMT_VNEXT_PRIMITIVE_KERNEL_BOUNDARY_COMMAND,
      arguments: [{
        uri: sourceModel ? sourceModel.uri : null,
        pointer: diagnostic.pointer || null,
        diagnosticCode: diagnostic.code,
        reason: 'kernel-fabric-boundary'
      }]
    },
    isPreferred: false
  });
}

function createRmtVNextPrimitiveCommandHandoff(input = {}, options = {}) {
  const command = normalizeString(input.command || options.command);
  const args = toArray(input.arguments || options.arguments);
  const firstArg = args[0] && typeof args[0] === 'object' ? args[0] : {};
  const pointer = normalizeString(input.pointer || firstArg.pointer || options.pointer);
  const uri = normalizeString(input.uri || firstArg.uri || options.uri);
  const diagnosticCode = normalizeString(input.diagnosticCode || firstArg.diagnosticCode || options.diagnosticCode);
  const supported = command === RMT_VNEXT_PRIMITIVE_KERNEL_BOUNDARY_COMMAND;

  return {
    schema: RMT_VNEXT_PRIMITIVE_COMMAND_HANDOFF_SCHEMA,
    workpackage: RMT_VNEXT_PRIMITIVE_AUTHORING_WORKPACKAGE,
    languageMode: 'vnext',
    status: supported ? 'manual_handoff' : 'unsupported_command',
    ok: supported,
    command,
    uri: uri || null,
    pointer: pointer || null,
    diagnosticCode: diagnosticCode || null,
    safe: false,
    edit: null,
    commandKind: supported ? 'kernel-boundary-extraction' : null,
    boundary: 'no-kernel-fabric-imports-in-vnext-source',
    hostAdapterTarget: 'xtend-rmt-host-adapter',
    manualSteps: supported ? [
      'Move Kernel/Fabric imports out of the vNext source file.',
      'Expose the runtime dependency through a host adapter or scaffold/runtime boundary.',
      'Keep RMT vNext source limited to primitive declarations and host-neutral references.',
      'Re-run node scripts/run_xtend_tests.js rmt-vnext-tooling --json and the primitive aggregate gate.'
    ] : [],
    reason: normalizeString(input.reason || firstArg.reason || options.reason) || null
  };
}

function createVNextPrimitiveActionForDiagnostic(analysis, diagnostic) {
  if (!diagnostic || !diagnostic.code) {
    return null;
  }

  if (diagnostic.code === 'rmt.vnext.primitive.owner-missing') {
    return createResourceOwnerAction(analysis, diagnostic);
  }

  if (diagnostic.code === 'rmt.vnext.primitive.unkeyed-repeat') {
    return createSurfaceKeyAction(analysis, diagnostic);
  }

  if (diagnostic.code === 'rmt.vnext.primitive.payload-contract-missing') {
    return createPayloadContractAction(analysis, diagnostic);
  }

  if (diagnostic.code === 'rmt.vnext.primitive.unknown-reference') {
    return createUnknownReferenceAction(analysis, diagnostic);
  }

  if (diagnostic.code === 'rmt.vnext.primitive.initial-missing') {
    return createStateInitialAction(analysis, diagnostic);
  }

  if (diagnostic.code === 'rmt.vnext.primitive.resource-kind-missing') {
    return createResourceKindAction(analysis, diagnostic);
  }

  if (diagnostic.code === 'rmt.vnext.primitive.action-reducer-missing') {
    return createActionReducerAction(analysis, diagnostic);
  }

  if (diagnostic.code === 'rmt.vnext.primitive.effect-source-missing') {
    return createEffectSourceAction(analysis, diagnostic);
  }

  if (diagnostic.code === 'rmt.vnext.primitive.kernel-boundary') {
    return createKernelBoundaryCommandAction(analysis, diagnostic);
  }

  return null;
}

function actionKey(action) {
  if (!action) {
    return '';
  }

  const dedupeKey = action.edit && action.edit.metadata && action.edit.metadata.dedupeKey;

  if (dedupeKey) {
    return `${action.diagnosticCode}:${dedupeKey}`;
  }

  const edit = action.edit ? JSON.stringify(action.edit) : '';
  const command = action.command ? JSON.stringify(action.command) : '';

  return `${action.title}:${action.diagnosticCode}:${edit}:${command}`;
}

function uniqueAndSortActions(actions) {
  const seen = new Set();
  const result = [];

  actions.filter(Boolean).forEach((action) => {
    const key = actionKey(action);

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push(action);
  });

  return result.sort((left, right) => {
    const codeDiff = String(left.diagnosticCode || '').localeCompare(String(right.diagnosticCode || ''));
    return codeDiff !== 0 ? codeDiff : String(left.title || '').localeCompare(String(right.title || ''));
  });
}

function mergeWorkspaceEdits(actions) {
  const changes = {};
  const repairKinds = [];
  const diagnosticCodes = [];

  toArray(actions).forEach((action) => {
    if (!action || !action.edit || action.safe === false) {
      return;
    }

    const metadata = action.edit.metadata || {};

    if (metadata.repairKind) {
      repairKinds.push(metadata.repairKind);
    }

    if (action.diagnosticCode) {
      diagnosticCodes.push(action.diagnosticCode);
    }

    collectWorkspaceEditEntries(action.edit).forEach((entry) => {
      if (!changes[entry.uri]) {
        changes[entry.uri] = [];
      }

      changes[entry.uri].push(entry.edit);
    });
  });

  return {
    schema: RMT_WORKSPACE_EDIT_SCHEMA,
    changes,
    metadata: {
      repairKind: 'apply-all-safe-vnext-primitive-code-actions',
      actionCount: toArray(actions).filter((action) => action && action.edit && action.safe !== false).length,
      diagnosticCodes: Array.from(new Set(diagnosticCodes)).sort(),
      repairKinds: Array.from(new Set(repairKinds)).sort(),
      workpackage: RMT_VNEXT_PRIMITIVE_AUTHORING_WORKPACKAGE
    }
  };
}

function createVNextPrimitiveFixAllAction(analysis, actions) {
  const safeActions = toArray(actions).filter((action) => action && action.edit && action.safe !== false);

  if (safeActions.length < 2) {
    return null;
  }

  const diagnosticCodes = Array.from(new Set(safeActions.map((action) => action.diagnosticCode).filter(Boolean))).sort();

  return createVNextPrimitiveCodeAction({
    title: `Alle sicheren vNext-Primitive Quick-Fixes anwenden (${safeActions.length})`,
    kind: RMT_VNEXT_PRIMITIVE_FIX_ALL_KIND,
    diagnosticCode: 'rmt.vnext.primitive.fix-all-safe',
    pointer: null,
    diagnostics: safeActions.flatMap((action) => toArray(action.diagnostics)),
    edit: mergeWorkspaceEdits(safeActions),
    confidence: 'high',
    source: 'rmt-vnext-primitive-fix-all',
    isPreferred: false,
    preview: null,
    safe: true,
    fixAllActionCount: safeActions.length,
    diagnosticCodes
  });
}

function normalizeDiagnosticFilters(diagnostics) {
  return toArray(diagnostics).map((diagnostic) => ({
    code: diagnostic.code || null,
    pointer: diagnostic.pointer || (diagnostic.data && diagnostic.data.pointer) || null
  }));
}

function shouldIncludeDiagnostic(diagnostic, filters) {
  if (filters.length === 0) {
    return true;
  }

  return filters.some((filter) => {
    const codeMatches = !filter.code || filter.code === diagnostic.code;
    const pointerMatches = !filter.pointer || filter.pointer === diagnostic.pointer;

    return codeMatches && pointerMatches;
  });
}

function getRmtVNextToolingCodeActions(input = {}, options = {}) {
  const analysis = options.analysis || analyzeRmtVNextToolingSource(input, options);
  const diagnostics = toArray(options.diagnostics || options.contextDiagnostics).length > 0
    ? toArray(analysis.diagnostics).filter((diagnostic) => shouldIncludeDiagnostic(
      diagnostic,
      normalizeDiagnosticFilters(options.diagnostics || options.contextDiagnostics)
    ))
    : toArray(analysis.diagnostics);
  const quickFixActions = uniqueAndSortActions(diagnostics.map((diagnostic) => createVNextPrimitiveActionForDiagnostic(analysis, diagnostic)))
    .map((action) => attachVNextPrimitiveActionPreview(analysis, action));
  const fixAllAction = attachVNextPrimitiveActionPreview(
    analysis,
    createVNextPrimitiveFixAllAction(analysis, quickFixActions)
  );
  const actions = fixAllAction ? [fixAllAction].concat(quickFixActions) : quickFixActions;
  const previews = actions.map((action) => action && action.preview).filter(Boolean);

  return {
    schema: RMT_VNEXT_PRIMITIVE_CODE_ACTION_REPORT_SCHEMA,
    providerSchema: RMT_VNEXT_PRIMITIVE_CODE_ACTION_PROVIDER_SCHEMA,
    previewSchema: RMT_VNEXT_PRIMITIVE_CODE_ACTION_PREVIEW_SCHEMA,
    actionSchema: RMT_CODE_ACTION_SCHEMA,
    editSchema: RMT_WORKSPACE_EDIT_SCHEMA,
    workpackage: RMT_VNEXT_PRIMITIVE_AUTHORING_WORKPACKAGE,
    languageMode: 'vnext',
    status: analysis.sourceModel ? 'completed' : 'source_unavailable',
    ok: !!analysis.sourceModel,
    actionCount: actions.length,
    quickFixCount: quickFixActions.length,
    fixAllCount: fixAllAction ? 1 : 0,
    previewCount: previews.length,
    actions,
    diagnosticCount: diagnostics.length,
    graphStatus: analysis.graphStatus,
    sourceMapSummary: analysis.sourceMapSummary
  };
}

function formatRmtVNextSource(input = {}, options = {}) {
  const text = getInputText(input);
  const analysis = options.analysis || analyzeRmtVNextToolingSource(input, options);
  const formatted = `${text
    .replace(/\r\n?/gu, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/u, ''))
    .join('\n')
    .replace(/\n{3,}/gu, '\n\n')
    .replace(/\s*$/u, '')}\n`;

  return {
    schema: RMT_VNEXT_TOOLING_FORMATTER_SCHEMA,
    workpackage: RMT_VNEXT_TOOLING_WORKPACKAGE,
    languageMode: 'vnext',
    status: analysis.ok ? 'formatted' : 'syntax_error',
    ok: analysis.ok,
    strategy: 'conservative-source-preserving',
    changed: formatted !== text,
    text: formatted,
    diagnostics: analysis.ok ? [] : analysis.diagnostics,
    sourceMapSummary: analysis.sourceMapSummary
  };
}

function createRmtVNextToolingAdapter(defaultOptions = {}) {
  return Object.freeze({
    schema: RMT_VNEXT_TOOLING_SCHEMA,
    reportSchema: RMT_VNEXT_TOOLING_REPORT_SCHEMA,
    formatterSchema: RMT_VNEXT_TOOLING_FORMATTER_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_TOOLING_WORKPACKAGE,
    analyze: (input = {}, options = {}) => analyzeRmtVNextToolingSource(input, { ...defaultOptions, ...options }),
    lint: (input = {}, options = {}) => lintRmtVNextToolingSource(input, { ...defaultOptions, ...options }),
    complete: (input = {}, options = {}) => getRmtVNextToolingCompletions(input, { ...defaultOptions, ...options }),
    hover: (input = {}, options = {}) => getRmtVNextToolingHover(input, { ...defaultOptions, ...options }),
    documentSymbols: (input = {}, options = {}) => getRmtVNextToolingDocumentSymbols(input, { ...defaultOptions, ...options }),
    definition: (input = {}, options = {}) => getRmtVNextToolingDefinition(input, { ...defaultOptions, ...options }),
    codeActions: (input = {}, options = {}) => getRmtVNextToolingCodeActions(input, { ...defaultOptions, ...options }),
    format: (input = {}, options = {}) => formatRmtVNextSource(input, { ...defaultOptions, ...options })
  });
}

module.exports = {
  RMT_CODE_ACTION_SCHEMA,
  RMT_WORKSPACE_EDIT_SCHEMA,
  RMT_VNEXT_PRIMITIVE_CODE_ACTION_PROVIDER_SCHEMA,
  RMT_VNEXT_PRIMITIVE_CODE_ACTION_PREVIEW_SCHEMA,
  RMT_VNEXT_PRIMITIVE_CODE_ACTION_REPORT_SCHEMA,
  RMT_VNEXT_PRIMITIVE_COMMAND_HANDOFF_SCHEMA,
  RMT_VNEXT_PRIMITIVE_FIX_ALL_KIND,
  RMT_VNEXT_PRIMITIVE_KERNEL_BOUNDARY_COMMAND,
  RMT_VNEXT_TOOLING_FORMATTER_SCHEMA,
  RMT_VNEXT_TOOLING_MODULE_PATH,
  RMT_VNEXT_TOOLING_PACKAGE_SCRIPT,
  RMT_VNEXT_PRIMITIVE_AUTHORING_WORKPACKAGE,
  RMT_VNEXT_TOOLING_REPORT_SCHEMA,
  RMT_VNEXT_TOOLING_SCHEMA,
  RMT_VNEXT_TOOLING_SUITE_PATH,
  RMT_VNEXT_TOOLING_WORKPACKAGE,
  VNEXT_COMPLETION_KEYWORDS,
  VNEXT_LANES,
  VNEXT_PRIMITIVE_ACTION_CLAUSES,
  VNEXT_PRIMITIVE_ANIMATION_CLAUSES,
  VNEXT_PRIMITIVE_KEYWORDS,
  VNEXT_PRIMITIVE_OVERLAY_KINDS,
  VNEXT_PRIMITIVE_RESOURCE_KINDS,
  VNEXT_PRIMITIVE_SELECTOR_CLAUSES,
  VNEXT_PRIMITIVE_STATE_CLAUSES,
  VNEXT_PRIMITIVE_SURFACE_CLAUSES,
  VNEXT_PRIMITIVE_TRANSITION_CLAUSES,
  VNEXT_PRIMITIVE_VALIDATION_CLAUSES,
  VNEXT_SNIPPETS,
  VNEXT_SOURCE_KINDS,
  VNEXT_TRANSITION_EFFECTS,
  VNEXT_TRUST_BOUNDARIES,
  VNEXT_VALIDATION_MODES,
  VNEXT_VALIDATION_RULES,
  analyzeRmtVNextToolingSource,
  createRmtVNextToolingAdapter,
  createRmtVNextPrimitiveCommandHandoff,
  findRmtVNextPointerAtPosition,
  formatRmtVNextSource,
  getRmtVNextToolingCodeActions,
  getRmtVNextToolingCompletions,
  getRmtVNextToolingDefinition,
  getRmtVNextToolingDocumentSymbols,
  getRmtVNextToolingHover,
  isLikelyRmtVNextSource,
  lintRmtVNextToolingSource
};
