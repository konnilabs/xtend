#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  createComponentDocsInventory
} = require('./create_component_docs_inventory');

function inlineCodeList(values, emptyLabel, limit = Infinity) {
  const list = values.slice(0, limit);
  if (!list.length) return emptyLabel;
  return list.map((value) => `\`${value}\``).join(', ');
}

function bulletList(values, emptyLabel) {
  if (!values.length) return `- ${emptyLabel}`;
  return values.map((value) => `- \`${value}\``).join('\n');
}

function methodName(signature) {
  const match = String(signature || '').match(/^([A-Za-z_$][\w$]*)/);
  return match ? match[1] : '';
}

function attributeExample(attribute, tag) {
  const booleanAttributes = new Set([
    'active',
    'busy',
    'checked',
    'closable',
    'decorative',
    'disabled',
    'indeterminate',
    'loading',
    'modal',
    'multiple',
    'open',
    'overlay',
    'paused',
    'polite',
    'readonly',
    'required',
    'route-aware'
  ]);
  if (booleanAttributes.has(attribute)) return attribute;
  if (attribute === 'aria-label') return `aria-label="Demo ${tag}"`;
  if (attribute === 'href') return 'href="/docs/en/readme"';
  if (attribute === 'src') return 'src="/docs/assets/rmt-stack-topography.svg"';
  if (attribute === 'alt') return 'alt="XTend demo image"';
  if (attribute === 'type') return 'type="info"';
  if (attribute === 'value') return 'value="demo"';
  if (attribute === 'max') return 'max="100"';
  if (attribute === 'duration') return 'duration="4000"';
  if (attribute === 'size') return 'size="large"';
  if (attribute === 'variant') return 'variant="primary"';
  if (attribute === 'label') return 'label="Demo"';
  if (attribute === 'name') return 'name="demo"';
  if (attribute === 'placement') return 'placement="end"';
  if (attribute === 'mode') return 'mode="hash"';
  if (attribute === 'selected') return 'selected="0"';
  return `${attribute}="demo"`;
}

function renderAttributes(entry, max = 4) {
  return entry.attributes.slice(0, max).map((attribute) => `\n  ${attributeExample(attribute, entry.tag)}`).join('');
}

function renderChildren(entry) {
  if (entry.slots.includes('label')) {
    const lines = ['  <span slot="label">Demo label</span>'];
    if (entry.slots.includes('hint')) lines.push('  <span slot="hint">Helpful context</span>');
    if (entry.slots.includes('error')) lines.push('  <span slot="error">Validation message</span>');
    return `\n${lines.join('\n')}\n`;
  }
  if (entry.slots.includes('trigger')) {
    return '\n  <button slot="trigger" type="button">Open</button>\n  <p>Projected content</p>\n';
  }
  if (entry.tag === 'x-router') {
    return '\n  <x-route path="/" component="x-section">Home</x-route>\n';
  }
  if (entry.tag === 'x-tabs') {
    return '\n  <x-tab>Overview</x-tab>\n  <x-tab>Details</x-tab>\n';
  }
  if (entry.customElement) {
    return `\n  ${entry.tag} content\n`;
  }
  return '';
}

function basicExample(entry) {
  if (!entry.customElement && entry.tag === 'xstate') {
    return `<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<script type="module">
  import { xstate } from '/components/xstate.js';

  xstate.set('demo.ready', true);
  console.log(xstate.snapshot());
</script>`;
  }
  if (!entry.customElement && entry.tag === 'x-utils') {
    return `<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<script type="module">
  import { XUtils } from '/components/xutils.js';

  // x-utils is the utility boundary listed in components/manifest.json.
  XUtils.assertLocalImport('./components/xbutton.js');
  console.log(XUtils.snapshotUtilityContract());
</script>`;
  }
  return `<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<${entry.tag} id="demo-${entry.basename}"${renderAttributes(entry)}>${renderChildren(entry)}</${entry.tag}>`;
}

function integrationExample(entry) {
  const eventName = entry.events[0] || '';
  const method = entry.methods.map(methodName).find((name) => name && name !== 'constructor') || '';
  if (!entry.customElement && entry.tag === 'xstate') {
    return `import { xstate } from '/components/xstate.js';

const unsubscribe = xstate.subscribeLifecycle((event) => {
  console.log('xstate lifecycle', event.detail);
});

const adapter = xstate.createRmtStateAdapter({ namespace: 'docs.demo' });
adapter.set('component', 'xstate');
unsubscribe();`;
  }
  if (!entry.customElement && entry.tag === 'x-utils') {
    return `import { XUtils } from '/components/xutils.js';

const policy = XUtils.assertLocalImport('./components/xbutton.js');
const effects = XUtils.resolveUiEffects({ tag: 'ui-effects', source: 'x-utils' });

document.addEventListener('xutils:ui-effects-change', (event) => {
  console.log(policy.ok, effects.bodyAttribute, event.detail);
});`;
  }

  const eventBlock = eventName
    ? `
component.addEventListener('${eventName}', (event) => {
  console.log('${eventName}', event.detail);
});`
    : `
// No public events are emitted by ${entry.tag}; observe host state instead.`;
  const methodBlock = method
    ? `
if ('${method}' in component) {
  component.${method}();
}`
    : '';
  return `const component = document.querySelector('${entry.tag}');${eventBlock}${methodBlock}`;
}

function profileSentenceEn(entry) {
  const profiles = entry.profiles.length ? entry.profiles.join(', ') : 'component';
  if (entry.profiles.includes('form')) return `${entry.tag} is a form-oriented component. Treat validation events, form-associated state and disabled or required attributes as part of the public integration surface.`;
  if (entry.profiles.includes('routing')) return `${entry.tag} participates in navigation. Keep route state, active indicators and router events explicit so a host can synchronize history, focus and announcements.`;
  if (entry.profiles.includes('overlay')) return `${entry.tag} controls layered UI. Use its open or close API together with focus, Escape handling and stable CSS parts instead of replacing the shadow tree.`;
  if (entry.profiles.includes('feedback')) return `${entry.tag} reports status to users. Wire events and live-region behavior carefully so automated hosts and assistive technology receive the same signal.`;
  if (entry.profiles.includes('layout') || entry.profiles.includes('display') || entry.profiles.includes('media')) return `${entry.tag} shapes visible layout or media. Prefer attributes, slots and tokens over DOM rewrites so responsive layout and rendering measurements stay predictable.`;
  if (entry.profiles.includes('utility') || entry.profiles.includes('infrastructure')) return `${entry.tag} is an infrastructure boundary rather than a decorative widget. Import it deliberately and keep the manifest entry local.`;
  return `${entry.tag} is classified as ${profiles}. Use the documented attributes, events and methods as the stable contract.`;
}

function profileSentenceDe(entry) {
  const profiles = entry.profiles.length ? entry.profiles.join(', ') : 'component';
  if (entry.profiles.includes('form')) return `${entry.tag} ist auf Formularlogik ausgerichtet. Validierungsereignisse, formulargebundener Zustand sowie Attribute wie disabled oder required sind Teil der öffentlichen Integrationsfläche.`;
  if (entry.profiles.includes('routing')) return `${entry.tag} nimmt an Navigation teil. Route-Zustand, aktive Markierung und Router-Ereignisse bleiben explizit, damit ein Host Verlauf, Fokus und Ansagen synchron halten kann.`;
  if (entry.profiles.includes('overlay')) return `${entry.tag} steuert überlagerte Oberflächen. Verwende die Open- oder Close-API zusammen mit Fokusverhalten, Escape-Pfad und stabilen CSS Parts, statt den Shadow DOM zu ersetzen.`;
  if (entry.profiles.includes('feedback')) return `${entry.tag} meldet Status an Nutzer. Ereignisse und Live-Regionen sollten so verdrahtet werden, dass Hosts und assistive Technologien dasselbe Signal erhalten.`;
  if (entry.profiles.includes('layout') || entry.profiles.includes('display') || entry.profiles.includes('media')) return `${entry.tag} prägt sichtbares Layout oder Medienflächen. Attribute, Slots und Tokens sind stabiler als DOM-Umschreibungen und halten responsive Messungen nachvollziehbar.`;
  if (entry.profiles.includes('utility') || entry.profiles.includes('infrastructure')) return `${entry.tag} ist eine Infrastrukturgrenze und kein dekoratives Widget. Importiere sie bewusst und halte den Manifest-Eintrag lokal.`;
  return `${entry.tag} ist als ${profiles} klassifiziert. Die dokumentierten Attribute, Ereignisse und Methoden bilden den stabilen Vertrag.`;
}

function publicEventsLine(entry, locale) {
  if (entry.events.length) {
    return locale === 'de'
      ? `Öffentliche Events: ${inlineCodeList(entry.events, 'keine')}.`
      : `Public events: ${inlineCodeList(entry.events, 'none')}.`;
  }
  return locale === 'de'
    ? 'Keine öffentlichen Events. Der Host liest Zustand, Methoden oder globale Services, statt ein DOM-Event zu erwarten.'
    : 'No public events. The host should read state, methods or global services instead of waiting for a DOM event.';
}

function specialNotes(entry, locale) {
  const notes = [];
  if (['xstate', 'x-utils', 'x-theme'].includes(entry.tag)) {
    notes.push(locale === 'de'
      ? 'RMT Hosts nutzen diese Seite als Integrationshinweis für die serviceartige Laufzeitgrenze.'
      : 'RMT Hosts use this page as the integration reference for the service-style runtime boundary.');
  }
  if (entry.tag === 'x-header') {
    notes.push('Menu Presentation Modes: `drawer`, `side-panel`, `popover`, `fullscreen`, `inline-main`.');
    notes.push('Legacy CSS Parts remain documented for older drawer skins.');
    notes.push('Menu attributes: `menu-mode`, `menu-placement`, `menu-modal`, `menu-open`, `menu-breakpoint`, `menu-width`, `menu-max-height`, `menu-align`.');
    notes.push('Menu events: `menu-before-open`, `menu-before-close`, `menu-mode-changed`, `menu-placement-changed`.');
    notes.push('Menu tokens: `--xtend-header-menu-width`, `--xtend-header-menu-max-height`, `--xtend-header-menu-backdrop`.');
  }
  if (entry.tag === 'x-theme') {
    notes.push('Theme API markers: `getDesignTokenContract()`, `registerTheme(name, definition)`, `setDensity(density)`, `getDesignTokens(themeName?)`, `dense`.');
  }
  if (entry.tag === 'x-link' && locale === 'de') {
    notes.push('Overflow-Sicherheit: Lange Navigationslabels dürfen umbrechen und behalten `aria-current`.');
  }
  if (entry.tag === 'x-drawer') {
    notes.push('Theme und Tokens: `--drawer-bg-dark`, `--drawer-close-size`, `inert`, `openDrawer()`, `closeDrawer()`.');
  }
  if (entry.tag === 'x-tabs') {
    notes.push('Keyboard-Navigation: `Home`, `End`, `aria-controls`, `bubbles: true`, `composed: true`, `snapshotPerformance()`.');
  }
  if (entry.tag === 'x-lightbox') {
    notes.push('Portal behavior: `document.body`, `trigger`, `xlightbox-open-<id>`.');
  }
  if (entry.tag === 'x-summary') {
    notes.push(locale === 'de'
      ? 'Accessibility state: `aria-expanded` spiegelt den öffentlichen Open-Zustand und bleibt mit `xsummary-open-<id>` synchron.'
      : 'Accessibility state: `aria-expanded` reflects the public open state and stays synchronized with `xsummary-open-<id>`.');
  }
  if (entry.tag === 'x-utils') {
    notes.push(locale === 'de'
      ? 'Browser-Utility-Surface: `window.XUtils`, `focusTrap(container)`, `assertLocalImport(specifier)` und `snapshotUtilityContract()` sind die stabilen Integrationspunkte.'
      : 'Browser utility surface: `window.XUtils`, `focusTrap(container)`, `assertLocalImport(specifier)` and `snapshotUtilityContract()` are the stable integration points.');
    notes.push(locale === 'de'
      ? 'x-utils registriert kein `customElements.define()`; Hosts importieren das Modul als Utility und verwenden keine Element-Instanz.'
      : 'x-utils does not call `customElements.define()`; hosts import the module as a utility and do not create an element instance.');
  }
  return notes;
}

function renderRuntimeFacts(entry, locale) {
  const rows = [];
  if (entry.uxProfiles.length) {
    rows.push(locale === 'de'
      ? `- UX-Profil: ${inlineCodeList(entry.uxProfiles, 'keines')}.`
      : `- UX profile: ${inlineCodeList(entry.uxProfiles, 'none')}.`);
  }
  if (entry.stateKeys.length) {
    rows.push(locale === 'de'
      ? `- State-Key: ${inlineCodeList(entry.stateKeys, 'keiner')}.`
      : `- State key: ${inlineCodeList(entry.stateKeys, 'none')}.`);
  }
  if (entry.schemas.includes('xtend.rmt.component-contract.v1')) {
    rows.push('- RMT contract: `xtend.rmt.component-contract.v1`.');
  }
  if (entry.schemas.includes('xtend.performance.component-profile.v1')) {
    rows.push('- Performance profile: `xtend.performance.component-profile.v1`.');
  }
  if (entry.schedules.length) {
    rows.push(locale === 'de'
      ? `- RMT schedules: ${inlineCodeList(entry.schedules, 'keine', 6)}.`
      : `- RMT schedules: ${inlineCodeList(entry.schedules, 'none', 6)}.`);
  }
  specialNotes(entry, locale).forEach((note) => rows.push(`- ${note}`));
  return rows.length ? rows.join('\n') : (locale === 'de' ? '- Keine zusätzlichen Laufzeitmarker.' : '- No additional runtime markers.');
}

function renderEnglish(entry) {
  const attributes = bulletList(entry.attributes, 'No component-specific attributes beyond standard HTML attributes.');
  const methods = bulletList(entry.methods, 'No public methods beyond HTMLElement methods.');
  const slots = bulletList(entry.slots, 'No named slots; use the default content path when the component renders children.');
  const parts = bulletList(entry.parts.slice(0, 16), 'No public CSS parts detected in the current runtime.');
  const tokens = bulletList(entry.cssVariables.slice(0, 16), 'No component-level CSS custom properties detected in the current runtime.');
  const profileText = profileSentenceEn(entry);

  return `# ${entry.title}

${entry.title} is a public XTend component reference for third-party developers who need to embed the component without private project context.

## What it solves

${profileText} The component is loaded from \`${entry.sourcePath}\`, declared through \`components/manifest.json\` and typed through \`${entry.declarationPath}\`. That makes the article a practical contract: a host can see which attributes are safe, which events can be listened to, which methods are callable and which CSS hooks are intended for customization.

Use this page when you are integrating XTend into a product shell, a micro frontend, a CMS-rendered page or an RMT-authored surface. It focuses on the public surface instead of internal implementation details, so it is suitable for teams that only consume the package.

## When to use it

Use \`${entry.tag}\` when you need the behavior described by its \`${entry.profiles.join(', ') || 'component'}\` profile and want a local Web Component that follows XTend theming, accessibility and scheduling conventions. It is especially useful when the host must stay framework-neutral, keep component code local and avoid CDN dependencies.

Third-party teams should prefer the documented attributes, slots, events and methods before wrapping the component. Wrappers are fine for product conventions, but the wrapper should pass through the public API instead of reaching into the shadow DOM.

## Avoid when

Avoid \`${entry.tag}\` when you need behavior that is not represented by the documented API, or when your host cannot load \`xtend-loader.js\` and \`components/manifest.json\`. Do not depend on private class names, generated internal nodes or unlisted state keys. If you need a design variant, use tokens, CSS parts or slots before forking the runtime file.

## Load and register

Load the XTend loader once per page. The loader reads the local manifest and resolves \`${entry.tag}\` to \`${entry.manifestSource}\`. Keep the manifest URL same-origin unless your security policy explicitly allows another source.

\`\`\`html
${basicExample(entry)}
\`\`\`

## Examples

The integration example shows the host-side pattern: query the element, listen to the first public event when one exists and call a public method only after the element has been upgraded. This keeps hydration and RMT materialization predictable.

\`\`\`js
${integrationExample(entry)}
\`\`\`

For production screens, keep IDs stable when state keys or diagnostics include \`<id>\`. Stable IDs make event logs, RMT schedules and browser tests easier to compare across deployments.

## API reference

Attributes:
${attributes}

Events:
${entry.events.length ? bulletList(entry.events, 'No public events.') : '- No public events.'}

Methods:
${methods}

Slots:
${slots}

CSS parts:
${parts}

CSS custom properties:
${tokens}

## Integration notes

${renderRuntimeFacts(entry, 'en')}

RMT Hosts should treat the component as a Custom Element boundary: pass attributes as component props, bind DOM events to commands and keep scheduling metadata outside the component. Plain HTML hosts can use the same attributes and events without an RMT compiler.

Theming should flow through XTend design tokens first. CSS parts are intended for targeted skinning of exposed controls, while CSS custom properties are better for broader color, spacing, radius and motion changes. Accessibility hooks such as labels, live regions and focus handling should be preserved when composing the component.

## Troubleshooting

- If \`${entry.tag}\` stays unupgraded, confirm that \`xtend-loader.js\` loaded and that \`components/manifest.json\` contains \`${entry.tag}\`.
- If events are missing, listen after \`customElements.whenDefined('${entry.tag}')\` and check that the interaction is not disabled or blocked by validation.
- If styling does not apply, prefer documented CSS variables and parts; shadow DOM internals are intentionally not stable.
- If an RMT host renders stale state, check the state key and schedule records listed above before changing component code.

## Next steps

- [Component development](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
`;
}

function renderGerman(entry) {
  const attributes = bulletList(entry.attributes, 'Keine komponentenspezifischen Attribute außer Standard-HTML-Attributen.');
  const methods = bulletList(entry.methods, 'Keine öffentlichen Methoden außer HTMLElement-Methoden.');
  const slots = bulletList(entry.slots, 'Keine benannten Slots; nutze den Standardinhalt, wenn die Komponente Kinder rendert.');
  const parts = bulletList(entry.parts.slice(0, 16), 'Keine öffentlichen CSS Parts in der aktuellen Laufzeit erkannt.');
  const tokens = bulletList(entry.cssVariables.slice(0, 16), 'Keine komponentenspezifischen CSS Custom Properties in der aktuellen Laufzeit erkannt.');
  const profileText = profileSentenceDe(entry);

  return `# ${entry.title}

${entry.title} ist eine öffentliche XTend Komponentenreferenz für Drittanbieter, die die Komponente ohne internes Projektwissen einbinden müssen.

## Was es löst

${profileText} Die Komponente wird aus \`${entry.sourcePath}\` geladen, über \`components/manifest.json\` deklariert und über \`${entry.declarationPath}\` typisiert. Damit ist diese Seite ein praktischer Vertrag: Ein Host sieht, welche Attribute stabil sind, welche Events abonniert werden können, welche Methoden aufrufbar sind und welche CSS-Hooks zur Anpassung vorgesehen sind.

Nutze diese Seite, wenn du XTend in eine Produktshell, ein Micro Frontend, eine CMS-Seite oder eine RMT Surface integrierst. Der Fokus liegt auf der öffentlichen Oberfläche und nicht auf internen Details; externe Teams können die Hinweise deshalb direkt als Integrationsbasis verwenden.

## Einsatz

Setze \`${entry.tag}\` ein, wenn du das Verhalten aus dem Profil \`${entry.profiles.join(', ') || 'component'}\` brauchst und eine lokale Web Component mit XTend Theming, Accessibility und Scheduling-Konventionen verwenden möchtest. Das passt besonders gut, wenn der Host framework-neutral bleiben, Komponenten lokal laden und CDN-Abhängigkeiten vermeiden soll.

Drittanbieter sollten zuerst die dokumentierten Attribute, Slots, Events und Methoden verwenden. Wrapper sind möglich, sollten die öffentliche API aber durchreichen und nicht in den Shadow DOM greifen.

## Nicht einsetzen, wenn

Vermeide \`${entry.tag}\`, wenn du Verhalten brauchst, das nicht durch die dokumentierte API abgedeckt ist, oder wenn dein Host \`xtend-loader.js\` und \`components/manifest.json\` nicht laden kann. Verlasse dich nicht auf private Klassennamen, erzeugte interne Knoten oder nicht gelistete State-Keys. Für Designvarianten sind Tokens, CSS Parts oder Slots stabiler als ein Fork der Laufzeitdatei.

## Laden und registrieren

Lade den XTend Loader einmal pro Seite. Der Loader liest das lokale Manifest und löst \`${entry.tag}\` auf \`${entry.manifestSource}\` auf. Die Manifest-URL sollte same-origin bleiben, sofern deine Sicherheitsrichtlinie keine andere Quelle erlaubt.

\`\`\`html
${basicExample(entry)}
\`\`\`

## Beispiele

Das Integrationsbeispiel zeigt das Host-Muster: Element abfragen, das erste öffentliche Event abonnieren, sofern eines existiert, und eine öffentliche Methode erst nach dem Upgrade aufrufen. So bleiben Hydration und RMT-Materialisierung nachvollziehbar.

\`\`\`js
${integrationExample(entry)}
\`\`\`

Für produktive Oberflächen sollten IDs stabil bleiben, wenn State-Keys oder Diagnoseeinträge \`<id>\` enthalten. Stabile IDs machen Ereignisprotokolle, RMT Schedules und Browser-Tests zwischen Deployments vergleichbar.

## API-Referenz

Attribute:
${attributes}

Events:
${entry.events.length ? bulletList(entry.events, 'Keine öffentlichen Events.') : '- Keine öffentlichen Events.'}

Methoden:
${methods}

Slots:
${slots}

CSS Parts:
${parts}

CSS Custom Properties:
${tokens}

## Integrationshinweise

${renderRuntimeFacts(entry, 'de')}

RMT Hosts sollten die Komponente als Custom-Element-Grenze behandeln: Attribute werden als Component Props gesetzt, DOM-Events werden an Commands gebunden, und Scheduling-Metadaten bleiben außerhalb der Komponente. Reine HTML-Hosts verwenden dieselben Attribute und Events ohne RMT Compiler.

Theming sollte zuerst über XTend Design Tokens laufen. CSS Parts sind für gezieltes Skinning freigegebener Controls gedacht, während CSS Custom Properties breitere Anpassungen an Farbe, Abstand, Radius und Bewegung abdecken. Accessibility-Hooks wie Labels, Live-Regionen und Fokusverhalten sollten beim Komponieren erhalten bleiben.

## Fehlerbehebung

- Wenn \`${entry.tag}\` nicht upgradet, prüfe, ob \`xtend-loader.js\` geladen wurde und \`components/manifest.json\` \`${entry.tag}\` enthält.
- Wenn Events fehlen, lausche erst nach \`customElements.whenDefined('${entry.tag}')\` und prüfe, ob die Interaktion deaktiviert oder durch Validierung blockiert ist.
- Wenn Styling nicht greift, nutze dokumentierte CSS Variablen und Parts; Shadow-DOM-Interna sind absichtlich nicht stabil.
- Wenn ein RMT Host veralteten Zustand rendert, prüfe zuerst State-Key und Schedule Records aus dieser Seite.

## Nächste Schritte

- [Komponenten-Entwicklung](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
`;
}

function resolveContainedDocsPath(rootDir, locale, relativePath) {
  const componentsDir = path.resolve(rootDir, 'docs', locale, 'components');
  const absolutePath = path.resolve(rootDir, relativePath);
  const relativeToComponents = path.relative(componentsDir, absolutePath);
  if (relativeToComponents.startsWith('..') || path.isAbsolute(relativeToComponents)) {
    throw new Error(`Refusing to write component docs outside docs/${locale}/components: ${relativePath}`);
  }
  return absolutePath;
}

function writeDocs(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..');
  const inventory = createComponentDocsInventory({ rootDir });
  return {
    inventory,
    written: [],
    proposals: inventory.entries.map((entry) => ({
      tag: entry.tag,
      docs: entry.docs,
      englishPreview: renderEnglish(entry),
      germanPreview: renderGerman(entry)
    })),
    warning: 'Public component prose is audit-only. Review source facts and author docs deliberately.'
  };
}

function main() {
  const result = writeDocs();
  console.log(`Audited ${result.inventory.entryCount} component references; wrote no public documentation files.`);
}

if (require.main === module) {
  main();
}

module.exports = {
  renderEnglish,
  renderGerman,
  writeDocs
};
