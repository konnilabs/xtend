# XTend A11y Component Contract

- Status: Accepted
- Datum: 5. Mai 2026
- Contract: `xtend.a11y.component-contract.v1`
- Profile Contract: `xtend.a11y.profile.v1`
- Test Contract: `xtend.a11y.test-contract.v1`
- Roadmap-Paket: `ER-WP-22`
- Bezug:
  - `development/ROADMAP-XTend-Enterprise-Reife.md`
  - `development/XTend-Enterprise-Reife-Implementierungsplan.md`
  - `development/XTend-Testpflicht-und-Scaffold-Anschluss.md`
  - `development/XTend-Component-Level-Teststandard.md`
  - `development/XTend-Accessibility-Hydration-Testregeln.md`
  - `development/XTend-Fiber-und-Lane-Contract.md`
  - `development/XTend-Motion-und-Contrast-Policy.md`
  - `xtend-builder/scaffold.config.js`
  - `a11y/motion-contrast-policy.js`
  - `tests/components/accessibility_hydration_suite.js`
  - `tests/a11y/motion_contrast_suite.js`

## Zweck

Dieser Contract macht A11y-by-design fuer XTend-Komponenten verbindlich.

Neue, modernisierte oder scaffolded Komponenten muessen ein A11y-Profil besitzen. Das Profil beschreibt, welche Rolle, welcher zugaengliche Name, welche Fokusstrategie, welche Tastaturpfade, welche ARIA-States und welche Screenreader-Signale die Komponente bereitstellt oder bewusst nicht braucht.

## Nicht-Ziele

Dieser Contract ersetzt nicht:

- eine vollstaendige WCAG-Zertifizierung
- browsernahe Fokus- und Keyboard-Smokes aus `ER-WP-24` unter `xtend.a11y.browser-keyboard-smoke.v1`
- dedizierte Screenreader-Signal-Contracts aus `ER-WP-25` unter `xtend.a11y.screenreader-signals.v1`
- dedizierte Reduced-Motion- und High-Contrast-Policy-Contracts aus `ER-WP-26` unter `xtend.a11y.motion-contrast-policy.v1`
- manuelle UX-/A11y-Reviews fuer komplexe Enterprise-Anwendungen

Er definiert die Mindestoberflaeche, auf der diese Pakete aufbauen.

## A11y-Profil Mindestform

Der Profile Contract lautet:

```text
xtend.a11y.profile.v1
```

Eine Komponente muss spaeter in Docs, Scaffold-Plan oder Suite mindestens diese Felder beschreiben koennen:

```json
{
  "schema": "xtend.a11y.profile.v1",
  "componentRef": "x-modal",
  "profiles": ["overlay", "stateful"],
  "role": "dialog",
  "accessibleName": {
    "source": "aria-labelledby",
    "required": true
  },
  "focusStrategy": {
    "initial": "dialog",
    "trap": true,
    "restore": true
  },
  "keyboard": ["Escape", "Tab"],
  "ariaState": ["aria-modal", "aria-hidden", "aria-labelledby"],
  "screenreader": {
    "signals": ["dialog-context"],
    "liveRegion": "none"
  },
  "motion": {
    "reducedMotion": "required"
  },
  "contrast": {
    "focusVisible": "required"
  },
  "testRefs": ["components", "a11y-hydration"]
}
```

## Pflichtfelder

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| `schema` | ja | immer `xtend.a11y.profile.v1` |
| `componentRef` | ja | Custom Element Tag, Manifest-ID oder Component Ref |
| `profiles` | ja | Component-Profile aus Scaffold/Teststandard |
| `role` | ja | native Semantik oder explizite Rolle |
| `accessibleName` | ja | Quelle des zugaenglichen Namens |
| `focusStrategy` | ja | Fokusziel, Fokusfalle, Rueckgabe oder `not-applicable` |
| `keyboard` | ja | relevante Tastenpfade oder `none` |
| `ariaState` | ja | relevante ARIA-States oder `none` |
| `screenreader` | ja | Live-Region, Announcement oder Kontextsignal |
| `motion` | ja | Reduced-Motion-Regel |
| `contrast` | ja | Fokus- und Kontrastregel |
| `testRefs` | ja | lokale Gates oder Suite-Refs |
| `exceptions` | nein | begruendete Nicht-Anwendbarkeit |

## Profilmatrix

| Profil | Rolle/Semantik | Name | Fokus | Keyboard | ARIA-State | Screenreader |
|--------|----------------|------|-------|----------|------------|--------------|
| `display` | native Semantik oder passende Landmark/Region | erforderlich bei nicht eindeutigem Inhalt | kein Fokuszwang | keine eigene Bedienung | nur bei Status/Selection | keine stille Statusaenderung |
| `interactive` | Button, Link, Tab, Menuitem oder gleichwertig | immer erforderlich | sichtbar und erreichbar | `Enter`/`Space` oder profilspezifisch | Zustand wie `aria-expanded`, `aria-selected`, `aria-pressed` | Statusaenderungen wahrnehmbar |
| `stateful` | wie Basisprofil | Name darf nicht durch State verschwinden | externe State-Aenderung darf Fokus nicht verlieren | State-Aenderung darf Tastaturpfad nicht brechen | State spiegelt ARIA | State-Sync darf Screenreader nicht fluten |
| `feedback` | `status` oder `alert` | Kontext oder explizites Label | nur bei Overlay/Action | Dismissal erreichbar | `aria-live`, optional `aria-busy` | Live-Region Pflicht |
| `overlay` | `dialog` oder `alertdialog` | `aria-labelledby` oder `aria-label` | Initialfokus, Trap, Rueckgabe | `Escape`, `Tab`, Dismissal | `aria-modal`, `aria-hidden`, Label-Refs | Dialogkontext wahrnehmbar |
| `routing` | `navigation`, Link, Tablist oder Route Region | Route-/Link-Name | Fokus nach Navigation definiert | Link-/Tab-/Menu-Navigation | `aria-current`, `aria-selected`, `aria-controls` nach Bedarf | Routenwechsel darf nicht still bleiben, wenn Inhalt ersetzt wird |
| `theme` | keine falsche Rolle | Theme-Control braucht Name | Fokus sichtbar bei Toggle/Selector | Toggle/Selector bedienbar | `aria-pressed`, `aria-selected` oder `aria-expanded` nach Bedarf | Theme-Wechsel darf Status melden, wenn UI-Kontext sich wesentlich aendert |
| `form` | native Form-Semantik bevorzugt | Label Pflicht | Fehlerfokus definiert | Eingabe, Submit, Reset | `aria-invalid`, `aria-describedby`, `aria-required` | Fehler- und Hilfetext wahrnehmbar |
| `media` | native Mediencontrols oder gleichwertig | Control-Labels Pflicht | Controls erreichbar | Play/Pause, Lautstaerke, Navigation nach Bedarf | `aria-busy`, `aria-valuetext`, Status nach Bedarf | Ladezustand/Fallback wahrnehmbar |

Komponenten mit mehreren Profilen muessen die Vereinigungsmenge der strengsten Pflichten erfuellen.

## Zugaenglicher Name

Jede interaktive oder statusrelevante Komponente braucht einen stabilen zugaenglichen Namen.

Erlaubte Quellen:

- sichtbarer Text
- `aria-label`
- `aria-labelledby`
- korrekt verknuepftes `<label>`
- dokumentierter Slot mit Fallback

Nicht erlaubt:

- Icon-only Controls ohne Name
- Placeholder als einziger Name
- wechselnde Namen ohne State- oder Announcement-Strategie
- dekorative SVGs ohne `aria-hidden="true"` oder gleichwertige Ausblendung

## Fokusstrategie

Jede Komponente muss eine Fokusstrategie angeben.

Erlaubte Werte:

- `none`: rein statische Komponente ohne interaktive Ziele
- `visible`: Fokus bleibt sichtbar, aber wird nicht programmatisch verschoben
- `initial`: Komponente setzt beim Oeffnen einen Initialfokus
- `trap`: offene Overlay-Komponente haelt Tab-Fokus im aktiven Kontext
- `restore`: Fokus kehrt nach Schliessen zum Ursprung zurueck
- `repair`: Komponente darf Fokus korrigieren, z.B. nach Route Render oder A11y-Fehler

Overlay-Komponenten muessen `initial`, `trap` und `restore` abdecken.

## Keyboard Contract

Der Test Contract lautet:

```text
xtend.a11y.test-contract.v1
```

Mindesttasten:

| Taste | Pflicht fuer |
|-------|--------------|
| `Tab` | interaktive, overlay-, form- und navigation-nahe Komponenten |
| `Shift+Tab` | Overlays und Fokusfallen |
| `Enter` | Buttons, Links, Menuitems, Submit-Controls |
| `Space` | Buttons, Checkboxen, Toggles, Tabs nach Pattern |
| `Escape` | Dialoge, Modals, Menus, Lightboxen und dismissible Overlays |
| Pfeiltasten | Tabs, Menus, Listboxen, Slider, Calendar oder vergleichbare Composite Widgets |

Wenn ein Tastenpfad nicht anwendbar ist, muss die Ausnahme dokumentiert werden.

## ARIA-State und Screenreader

ARIA darf nicht dekorativ eingesetzt werden. Jede ARIA-Angabe muss einen Zustand oder eine Beziehung korrekt spiegeln.

Pflichtregeln:

- `aria-expanded` muss sichtbare Expansion spiegeln.
- `aria-selected` muss Auswahl spiegeln.
- `aria-current` muss aktuelle Navigation spiegeln.
- `aria-hidden` darf fokussierbare Inhalte nicht versehentlich verstecken.
- `aria-modal` ist nur fuer aktive modale Dialoge erlaubt.
- `aria-live` braucht eine klare Politeness-Strategie.
- `aria-describedby` muss auf existierenden Hilfs- oder Fehlertext zeigen.

Screenreader-Signale sind seit `ER-WP-25` ueber `xtend.a11y.screenreader-signals.v1` vertieft. Feedback-, Form-, Overlay- und Routing-Komponenten duerfen relevante Zustandswechsel nicht still verlieren und muessen ihre Status-, Error- oder Kontextsignale deklarieren.

## Motion und Contrast

A11y-by-design umfasst auch Bewegung und Sichtbarkeit.

Pflichten:

- Animationen muessen `prefers-reduced-motion` respektieren.
- Fokus muss sichtbar sein.
- Fokus-Styles duerfen nicht nur ueber Farbe unterscheidbar sein, wenn das Profil interaktiv ist.
- High-Contrast- und Theme-Tokens duerfen Fokus-, Fehler- und Statuszustaende nicht unsichtbar machen.

Seit `ER-WP-26` sind diese Regeln gatebar. Der kombinierte Contract lautet:

```text
xtend.a11y.motion-contrast-policy.v1
```

Die Sub-Contracts lauten:

- `xtend.a11y.motion-policy.v1`
- `xtend.a11y.contrast-policy.v1`
- `xtend.a11y.motion-contrast-test.v1`

Komponenten mit Animation, Fokus, Status, Overlay, Feedback oder Formverhalten muessen `prefers-reduced-motion: reduce` und `forced-colors: active` in Source, Scaffold-Profil oder dokumentierter Ausnahme sichtbar machen. Preference-Arbeit laeuft ueber die Fabric-Lane `a11y`, Fiber `a11y.preference` und Schedule-Referenz `a11y.user-blocking.preference`.

## Fabric- und Lane-Anschluss

A11y-Arbeit ist user-facing und darf nicht als nachrangige Hintergrundarbeit behandelt werden.

Pflichten:

- Screenreader-Announcements, Fokusreparaturen und ARIA-State-Korrekturen laufen ueber die Fabric-Lane `a11y`.
- Kritische Fokus- und Keyboardarbeit darf `user-blocking` nutzen.
- Relevante Diagnostics muessen `source: "a11y"`, `phase`, `componentRef`, `fiberId` oder `correlationId` tragen koennen.
- A11y-Fibers verwenden `a11y.announce` oder namespaced Erweiterungen.

## Scaffold- und Testpflicht

`ER-WP-23` hat Scaffold-Blueprints so erweitert, dass neue Komponenten mindestens erzeugen oder deklarieren:

- `a11yProfile`
- Rolle/Semantik
- zugaenglicher Name
- Fokusstrategie
- Keyboard Contract
- ARIA-State-Liste
- Screenreader-/Live-Region-Strategie
- Reduced-Motion-/Contrast-Regel
- Motion-/Contrast-Policy mit `motionContrast`
- lokale Gates: `components`, `a11y-hydration`, `screenreader-signals`, `motion-contrast`, `references`

Der bestehende Gate bleibt:

```bash
node scripts/run_xtend_tests.js a11y-hydration
node scripts/run_xtend_tests.js motion-contrast
```

## Handoff an Folgepakete

- `ER-WP-23` hat Scaffold-Blueprints um A11y-Pflichten erweitert.
- `ER-WP-24` hat browsernahe Fokus- und Keyboard-Smokes fuer Routing, Overlay, Form/Input und Tabs umgesetzt.
- `ER-WP-25` hat dedizierte Screenreader-Signal-Contracts eingefuehrt.
- `ER-WP-26` hat Reduced-Motion und High-Contrast Regeln gatebar gemacht.
- `ER-WP-31` kann die Component Catalog Coverage Matrix gegen A11y-Profile pruefen.

## Verifikation

Mindestgate fuer diesen Contract:

```bash
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js a11y-hydration --json
node scripts/run_xtend_tests.js motion-contrast --json
npm test
```

## Ergebnis

`xtend.a11y.component-contract.v1` ist akzeptiert. XTend hat damit eine verbindliche A11y-by-design-Oberflaeche fuer neue und modernisierte Komponenten. `ER-WP-23` hat Scaffold-Blueprints auf diese Pflichten ausgerichtet; `ER-WP-24` hat die browsernahen Fokus-/Keyboard-Smokes unter `xtend.a11y.browser-keyboard-smoke.v1` ergaenzt; `ER-WP-25` hat `xtend.a11y.screenreader-signals.v1` fuer Live-Regionen, Statusregionen, Errorregionen und Announcements eingefuehrt; `ER-WP-26` hat `xtend.a11y.motion-contrast-policy.v1` fuer Reduced Motion, Forced Colors und High Contrast gatebar angeschlossen.
