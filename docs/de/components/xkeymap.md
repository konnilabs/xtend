# x-keymap

`x-keymap` zeigt die registrierten Tastaturbefehle einer App-Shell als zugänglichen Dialog. Die Komponente gruppiert Einträge, formatiert Tastensequenzen für die gewählte Plattform und gibt den Fokus beim Schließen an das zuvor aktive Element zurück.

## Was es löst

Eine Command-Palette und eine Tastaturhilfe haben unterschiedliche Aufgaben: Die Palette führt Befehle aus, die Keymap erklärt verfügbare Shortcuts. `x-keymap` übernimmt diese erklärende Oberfläche und kann Modelle aus `XCommand.createXKeymapModel()` verwenden. Ohne XCommand-Runtime rendert sie die übergebenen Einträge in einer allgemeinen Gruppe.

Die Runtime liegt in `components/xkeymap.js`, die öffentlichen Typen in `components/xkeymap.d.ts`, und `components/manifest.json` registriert das Element als `x-keymap`.

## Einsatz

Verwende `x-keymap`, wenn deine App mehrere Shortcuts oder Tastensequenzen anbietet und Nutzer eine zentrale, per Tastatur erreichbare Übersicht brauchen. Typische Trigger sind ein Hilfe-Button oder ein globaler Shortcut wie `?`.

Die Komponente eignet sich auch für RMT-Shells: Ihre Events können an Commands gebunden werden, während die Tastaturregistrierungen selbst im XCommand-Layer bleiben.

## Nicht einsetzen, wenn

Für ein oder zwei lokale Shortcuts reicht Hilfetext am jeweiligen Control. `x-keymap` registriert oder dispatcht keine Befehle und ersetzt keine Command-Palette. Übergib nur Shortcuts, die im aktuellen Scope tatsächlich aktiv oder bewusst sichtbar sind.

## Laden und registrieren

Der XTend Loader löst das Element aus dem lokalen Manifest auf:

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>

<button id="shortcut-help" type="button">Tastaturhilfe</button>
<x-keymap id="shortcuts" title="Tastaturkürzel" locale="de" platform="linux"></x-keymap>
```

`open` steuert den sichtbaren Zustand. `title` benennt den Dialog, `locale` und `platform` beeinflussen das von XCommand erzeugte Modell. Das Attribut `entries` erwartet JSON; für dynamische Daten ist die Property `entries` weniger fehleranfällig.

## Beispiele

Übergib strukturierte Einträge und öffne die Hilfe über die öffentliche Methode:

```js
const keymap = document.querySelector('x-keymap');
const trigger = document.querySelector('#shortcut-help');

keymap.entries = [
  { id: 'file.save', label: 'Speichern', icon: 'save', sequence: ['Mod', 'S'], group: 'Datei' },
  { id: 'navigation.search', label: 'Suchen', icon: 'search', sequence: ['Mod', 'K'], group: 'Navigation' }
];

trigger.addEventListener('click', () => keymap.open());
keymap.addEventListener('xkeymap-close', (event) => {
  console.log(event.detail.reason);
});
```

`close(reason)` meldet den Grund `api`, `escape`, `button` oder `backdrop` über `xkeymap-close`. Das Event ist `bubbles: true` und `composed: true`, sodass auch ein Shell-Host außerhalb des Shadow DOM reagieren kann.

## API-Referenz

Attribute:

- `open`: zeigt Dialog und Backdrop.
- `title`: sichtbarer Dialogtitel.
- `entries`: JSON-kodierte `XKeymapEntry[]`.
- `locale`: Locale für das Keymap-Modell, Standard `en`.
- `platform`: Plattformhinweis für Tastennamen.

Properties und Methoden:

- `entries: XKeymapEntry[]`
- `isOpen(): boolean`
- `open(entries?: XKeymapEntry[]): void`
- `close(reason?: string): void`

Events:

- `xkeymap-close` mit `{ reason }`
- `click`
- `keydown`

Slots:

- Keine öffentlichen Slots. Inhalte entstehen aus `entries`.

CSS Parts:

- `backdrop`, `surface`, `close`, `title`, `empty`
- `group`, `group-title`, `commands`, `command`
- `icon`, `label`, `keys`, `key`

CSS Custom Properties:

- `--xkeymap-backdrop`, `--xkeymap-z-index`, `--xkeymap-padding`
- `--xkeymap-border`, `--xkeymap-radius`, `--xkeymap-surface`, `--xkeymap-color`, `--xkeymap-shadow`
- `--xkeymap-title-font`, `--xkeymap-group-title-color`, `--xkeymap-group-title-font`
- `--xkeymap-key-bg`, `--xkeymap-key-color`, `--xkeymap-key-font`

## Accessibility und Tastatur

Die Surface verwendet `role="dialog"`, `aria-modal="true"`, einen referenzierten Titel und einen fokussierbaren Dialogcontainer. Beim Öffnen merkt sie sich `document.activeElement`, fokussiert die Surface und registriert Escape im Capture-Mode. Beim Schließen entfernt sie den Listener und stellt den vorherigen Fokus wieder her.

Backdrop und Close-Button sind Mauspfade; Escape ist der gleichwertige Tastaturpfad. Sorge dafür, dass der externe Trigger einen verständlichen Namen und seinen eigenen Shortcut-Hinweis besitzt.

## Integrationshinweise

Die RMT-Metadaten verwenden `xtend.rmt.component-contract.v1`, `dom-event-to-rmt-command` und die Schedules `component.visible.mount`, `ui.user-blocking.input`, `overlay.dialog.transition` und `diagnostics.snapshot`. Die Performance-Messungen heißen `xtend.x-keymap.open`, `xtend.x-keymap.close` und `xtend.x-keymap.render`.

Wenn der Host Einträge nach Scope filtert, aktualisiere die `entries`-Property vor `open()`. So zeigt der Dialog keine inaktiven oder sicherheitsbedingt blockierten Befehle.

## Fehlerbehebung

Bleibt die Keymap unsichtbar, prüfe mit `isOpen()`, ob `open` gesetzt ist, und kontrolliere, ob `x-keymap` über das Manifest geladen wurde.

Erscheint nur eine leere Gruppe, validiere `entries` als Array mit `id`, optionalem `label`, `icon`, `sequence` und `group`. Ungültiges JSON im Attribut wird absichtlich als leere Liste behandelt.

Kehrt der Fokus nicht zurück, entferne das Trigger-Element nicht, solange die Keymap offen ist. Bei einem Shell-Wechsel sollte der Host die Keymap zuerst mit `close('surface-change')` schließen.

## Nächste Schritte

- [Komponenten-Entwicklung](../components.md)
- [A11y Keyboard Smokes](../a11y-keyboard-smokes.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
