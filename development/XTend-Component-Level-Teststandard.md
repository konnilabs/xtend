# XTend Component-Level-Teststandard

- Status: Verbindlicher Standard fuer Epic 02
- Datum: 4. Mai 2026
- Bezug:
  - `development/EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`
  - `development/BACKLOG-EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`
  - `development/WP-E02-07-Component-Level-Teststandard-definieren.md`
  - `development/XTend-Architecture-Gate-Regeln.md`
  - `development/XTend-Testpflicht-und-Scaffold-Anschluss.md`
  - `development/EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md`

## Zweck

Dieser Standard legt fest, wie XTend-Komponenten auf Component-Level getestet werden. Er ist der verbindliche Rahmen fuer `WP-08`, fuer kuenftige Komponentenmodernisierung und fuer `XTend-Scaffold`.

Component-Level-Tests pruefen den oeffentlichen Vertrag einer Komponente. Sie duerfen Implementation Details nur dann pruefen, wenn diese Teil des XTend-Contracts sind, zum Beispiel kanonische `xstate` Keys, Custom Events, Rollen, Slots oder dokumentierte CSS Custom Properties.

## Testziele

Jede moderne XTend-Komponente muss auf Component-Level zeigen, dass sie:

- registrierbar und importierbar ist
- Attribute und Properties deterministisch verarbeitet
- Slots oder Light-DOM-Inhalte stabil rendert
- dokumentierte Custom Events emittiert
- Accessibility-Mindestanforderungen erfuellt
- `xstate` nur ueber kanonische Keys nutzt, falls sie State besitzt
- Hydration und Rehydration ohne doppelte Handler oder lokale Drift uebersteht
- keine versteckten globalen Helper oder impliziten Nebenpfade einfuehrt

## Komponentenprofile

Der Teststandard unterscheidet Profile. Eine Komponente kann mehrere Profile besitzen.

| Profil | Beispiele | Pflichtfokus |
|--------|-----------|--------------|
| `display` | `x-section`, `x-cards`, `x-code` | Slots, Attribute, Shadow DOM, sichtbarer Zustand |
| `interactive` | `x-button`, `x-tabs`, `x-menu` | Events, Tastatur, Fokus, ARIA |
| `stateful` | `x-alert`, `x-dialog`, `x-modal` | kanonischer `xstate` Sync, Lifecycle, Rehydration |
| `feedback` | `x-toast`, `x-alert` | sichtbares Rendering, Event-Contract, Dismissal |
| `overlay` | `x-dialog`, `x-modal`, `x-lightbox` | Open-State, Fokus, Escape, Overlay-Klick |
| `routing` | `x-router`, `x-link` | Navigation, Params, Query, State Bridge |
| `theme` | `x-theme`, theme-nahe Komponenten | CSS Custom Properties, Theme-State, Events |
| `form` | `x-input`, `x-form` | Value, Validation, Labels, Fehlermeldungen |
| `media` | `x-player`, `x-lightbox` | Ladezustand, Controls, Tastatur, Fallback |

## Dateikonvention

Neue Component-Level-Tests folgen dieser Struktur:

```text
tests/components/
  <tag>.component_suite.js
  fixtures/
    <tag>.component.html
```

Beispiele:

```text
tests/components/xalert.component_suite.js
tests/components/fixtures/xalert.component.html
```

Der Suite-Export muss konsistent sein:

```js
module.exports = {
  runXAlertComponentSuite,
  printXAlertComponentReport
};
```

Die konkrete Suite-ID folgt dem Tag:

```js
createSuiteContext({
  id: 'component:x-alert',
  label: 'x-alert component contract'
});
```

## Pflichtchecks

### C1 - Registrierung und Import

Pflicht fuer alle Komponenten:

- produktive Datei existiert unter `components/<tag>.js`
- Manifest enthaelt den Tag, falls die Komponente runtime-ladbar sein soll
- `customElements.define('<tag>'` ist vorhanden oder bewusst als API-Modul dokumentiert
- kein Test importiert produktive Komponenten ueber CDN, wenn ein lokaler Pfad existiert
- Syntaxcheck laeuft ueber `tests/utils/process.js`

### C2 - Attribute und Properties

Pflicht fuer alle Komponenten mit Attributen oder Properties:

- dokumentierte Attribute sind in `observedAttributes` oder im Contract dokumentiert
- Default-Werte sind deterministisch
- ungueltige Werte werden normalisiert oder ignoriert
- Property-Setter und Attribute bleiben konsistent, falls beide existieren
- Aenderungen nach `connectedCallback` loesen kein doppeltes Rendering mit Drift aus

### C3 - Slots und DOM-Vertrag

Pflicht fuer alle DOM-Komponenten:

- Default-Slot rendert erwarteten Light-DOM-Inhalt
- benannte Slots sind dokumentiert und testbar
- Shadow DOM wird nur dann vorausgesetzt, wenn die Komponente es besitzt
- sichtbare Kernstruktur kann per DOM-Selektor oder Rolle gefunden werden
- leere Slots besitzen einen dokumentierten Fallback oder bleiben bewusst leer

### C4 - Events

Pflicht fuer interaktive, stateful, feedback, overlay und routing Komponenten:

- jedes dokumentierte Custom Event wird getestet
- Event-Name, `detail`, `bubbles` und `composed` sind Teil des Contracts
- Legacy-Events werden nur getestet, wenn sie als Kompatibilitaets-Fassade dokumentiert sind
- Event-Handler werden bei Rehydration nicht mehrfach registriert

### C5 - State-Sync

Pflicht fuer stateful, feedback, overlay, routing und theme Komponenten:

- kanonische `xstate` Keys werden getestet
- Legacy-Keys duerfen nur als dokumentierte Kompatibilitaets-Fassade existieren
- lokale UI-Flags duerfen nicht zur zweiten Wahrheitsquelle werden
- State-Aenderungen von aussen werden verarbeitet, falls die Komponente das verspricht
- Disconnect entfernt Subscriptions oder Listener deterministisch
- SSOT- und Digital-Twin-Mindestregeln sind in `development/XTend-Architecture-Gate-Regeln.md` konkretisiert

### C6 - Accessibility

Pflicht fuer sichtbare und interaktive Komponenten:

- Rollen, Labels und `aria-*` Attribute sind pruefbar
- Fokusverhalten ist fuer interaktive Komponenten definiert
- Tastaturpfade decken mindestens `Enter`, `Space`, `Escape` oder `Tab` ab, sofern relevant
- Overlays setzen `aria-modal`, Fokusziel und Rueckgabe des Fokus
- `prefers-reduced-motion` wird respektiert, wenn Animationen existieren
- Mindestregeln sind in `development/XTend-Accessibility-Hydration-Testregeln.md` konkretisiert

### C7 - Hydration und Rehydration

Pflicht fuer alle Custom Elements:

- `connectedCallback` erzeugt reproduzierbaren DOM-Zustand
- mehrfaches Attach/Detach verdoppelt keine Listener, Timer oder Subscriptions
- Shadow DOM oder Light DOM bleiben nach Attributwechsel konsistent
- Komponenten ohne JavaScript-Fallback dokumentieren diese Grenze explizit
- Hydration-Gates sind in `tests/components/accessibility_hydration_suite.js` angebunden

## Optionale Checks

Optionale Checks werden eingesetzt, wenn eine Komponente das Risiko besitzt:

- visuelle Regression ueber stabile Snapshot-Fragmente
- Performance-Budget fuer grosse Listen oder Medien
- Resize- und IntersectionObserver-Verhalten
- externe Datenquellen und Fehlerszenarien
- SSR-/Prerendering-Export
- TypeScript-Definitionen fuer komplexe APIs

## Standard-Testablauf

Eine Component-Suite soll in dieser Reihenfolge pruefen:

1. Source- und Manifest-Contract
2. Syntax und oeffentliche Registrierung
3. Fixture-Struktur und lokale Imports
4. Attribute/Properties
5. Slots/DOM
6. Events
7. State-Sync
8. Accessibility
9. Hydration/Rehydration
10. Profil-spezifische Sonderchecks

Diese Reihenfolge sorgt dafuer, dass schnelle Contract-Fehler vor teureren DOM- oder Browser-Pfaden sichtbar werden.

## Definition of Done fuer Component-Tests

Ein Component-Level-Test ist abgeschlossen, wenn:

- Pflichtprofil der Komponente bestimmt ist
- alle fuer das Profil relevanten Pflichtchecks umgesetzt oder begruendet als nicht anwendbar dokumentiert sind
- lokale Test-Fixture keine Netzwerkabhaengigkeit besitzt
- Suite ueber den lokalen Runner oder einen dokumentierten Einzelbefehl startbar ist
- Tests klare Pass/Fail-Ausgabe und Exit-Codes liefern
- Dokumentation der Komponente auf die getesteten Contracts passt

## Checkliste fuer neue oder modernisierte Komponenten

- [ ] Komponententag, Profil und Manifest-Status sind benannt
- [ ] produktive Datei liegt unter `components/<tag>.js`
- [ ] Doku liegt unter `docs/components/<tag-ohne-x>.md`
- [ ] Component-Suite liegt unter `tests/components/<tag>.component_suite.js`
- [ ] Component-Fixture liegt unter `tests/components/fixtures/<tag>.component.html`, falls DOM/Hydration geprueft wird
- [ ] Attribute und Properties sind dokumentiert und getestet
- [ ] Slots oder Content-Fallbacks sind dokumentiert und getestet
- [ ] Custom Events sind mit Name, Detail, Bubbling und Composed-Verhalten getestet
- [ ] `xstate` Keys sind kanonisch oder als Legacy-Fassade dokumentiert
- [ ] SSOT-/Digital-Twin-Regeln sind erfuellt oder begruendet nicht anwendbar
- [ ] Accessibility-Mindestchecks sind umgesetzt
- [ ] Hydration/Rehydration ist geprueft
- [ ] `prefers-reduced-motion` ist geprueft, falls Animationen existieren
- [ ] TypeScript-Definitionen sind vorhanden, falls die Komponente eine oeffentliche JS-API besitzt
- [ ] Doku-Beispiele stimmen mit den getesteten Contracts ueberein

## Mapping zu XTend-Scaffold

`XTend-Scaffold` muss diesen Standard als Blueprint verwenden. Ein Scaffold fuer neue Komponenten erzeugt perspektivisch:

| Scaffold-Artefakt | Zielpfad | Bezug zum Teststandard |
|-------------------|----------|------------------------|
| Komponente | `components/<tag>.js` | Registrierung, Lifecycle, Attribute, Events |
| Doku | `docs/components/<name>.md` | oeffentlicher Contract und Beispiele |
| Test-Suite | `tests/components/<tag>.component_suite.js` | Pflichtchecks nach Profil |
| Fixture | `tests/components/fixtures/<tag>.component.html` | DOM-, Slot-, Hydration- und Browserpfade |
| Typdefinition | `components/<tag>.d.ts` oder zentraler Typ-Pfad | oeffentliche JS-API |
| Manifest-Patch | `components/manifest.json` | Loader- und Hydrationspfad |
| Demo | spaeterer Demo-/Preview-Pfad | Referenz fuer `WP-11` |

Der Scaffold darf keine Testdatei als Platzhalter ohne pruefbare Assertions erzeugen. Wenn ein Check nicht anwendbar ist, muss der generierte Test oder die generierte Doku dies explizit begruenden.

## Verbindliche Testpflicht ab WP-13

Die operative Testpflicht fuer neue, modernisierte und scaffolded Komponenten liegt unter `development/XTend-Testpflicht-und-Scaffold-Anschluss.md`. Dieses Dokument ist der Review-Vertrag fuer Menschen, AI-Agenten und spaetere Scaffold-Generatoren.

Eine Komponentenarbeit darf nur als abgeschlossen gelten, wenn die dort definierten Mindestartefakte, Profilchecks, lokalen Runner-Pfade und Ausnahmebegruedungen erfuellt oder dokumentiert sind.

## Pilot-Vorschlag fuer WP-08

Fuer `WP-08` sollen die ersten Pilot-Komponenten bewusst unterschiedliche Profile abdecken:

- `x-alert`: feedback + stateful
- `x-toast`: feedback + interactive dismissal
- `x-modal`: overlay + stateful + accessibility
- `x-button`: interactive baseline
- `x-router`: routing + state bridge

Mindestens drei davon sollen in `WP-08` als echte Component-Level-Tests umgesetzt werden.

Die initiale Umsetzung in `WP-08` startet mit `x-alert`, `x-toast` und `x-modal`. `x-button` und `x-router` bleiben als Erweiterungskandidaten fuer spaetere Component-Level-Ausbaupakete erhalten.

## Nicht-Ziele

Dieser Standard implementiert noch keine Pilot-Komponententests. Die Umsetzung der ersten Component-Suites gehoert zu `WP-08`. Der Standard fuehrt auch keinen neuen externen Runner ein; er nutzt die bestehende Epic-02-Harness-Richtung.
