# xtabs – XTend Komponente

> **Siehe auch:** [xsection](./xsection.md), [xstate](./xstate.md)

## Übersicht

`<x-tabs>` ist eine Komponente für Tab-Navigation und strukturierte Inhalte. Sie unterstützt dynamische Tabs, Theming und State-Integration.

---

## Features
- Dynamische Tab-Navigation
- Slot für Tab-Inhalte
- State-Integration via xstate
- Theming via CSS Custom Properties

---

## Verwendung

```html
<x-tabs selected="0">
  <x-tab name="Tab 1">Inhalt 1</x-tab>
  <x-tab name="Tab 2">Inhalt 2</x-tab>
</x-tabs>
```

---

## Attribute
| Attribut    | Typ     | Beschreibung                        |
|-------------|---------|-------------------------------------|
| –           | –       | –                                   |

---

## Events
| Event         | Beschreibung                        |
|---------------|-------------------------------------|
| `tab-selected` | Tab-Wechsel mit `{ index }`, `bubbles: true`, `composed: true` |

---

## API
- **Tabs per Slot einfügen**
- **State-Integration:** Automatisch via xstate

---

## Beispiel: Dynamisch per JS

```js
const tabs = document.createElement('x-tabs');
tabs.innerHTML = '<div slot="tab" label="A">A</div>';
document.body.appendChild(tabs);
```

---

## Styling & Theming

```css
x-tabs {
  --tab-active-bg: #007bff;
}
```

---

## Accessibility

`x-tabs` rendert einen `role="tablist"` Header, erzeugt pro Button `role="tab"` und verbindet Buttons und Panels ueber `aria-controls` sowie `aria-labelledby`.

Die Keyboard-Navigation nutzt roving `tabindex`:

| Taste | Verhalten |
|-------|-----------|
| `ArrowRight` | naechster Tab |
| `ArrowLeft` | vorheriger Tab |
| `Home` | erster Tab |
| `End` | letzter Tab |
| `Enter` / `Space` | fokussierten Tab aktivieren |

Aktive Panels tragen `role="tabpanel"` und `aria-hidden="false"`; inaktive Panels werden mit `hidden` und `aria-hidden="true"` aus der sichtbaren Navigation genommen.

## Performance-Profil ab WP-E12-02

`x-tabs` besitzt ein explizites `xtendScaffoldPerformanceProfile` unter `xtend.performance.component-profile.v1`.

| Feld | Wert |
|------|------|
| Budget-Klasse | `critical` |
| Lane | `user-blocking` |
| Hydration Policy | `visible` |
| Tab-Switch Budget | `16 ms` |
| Keyboard Budget | `16 ms` |
| Render Update Budget | `28 ms` |

RMT-Shells koennen `x-tabs` ueber `ui.user-blocking.tabs`, `route.transition.tab`, `component.visible.hydrate` und `diagnostics.snapshot` schedulen. Der RMT-Kernel bleibt dabei framework-agnostisch; die XTend-spezifischen Daten liegen im Component-Adapter-Metadatenprofil.

Die Runtime stellt `getPerformanceBudget()` und `snapshotPerformance()` bereit. `snapshotPerformance()` liefert lokale Messpunkte fuer Hydration, Render, Tab-Switch und Keyboard-Interaktionen, damit Fabric oder ein spaeterer Reporter die Daten aufnehmen kann.

## Component-Level-Contract ab ER-WP-33

- `selected` bestimmt den aktiven Tab-Index.
- `text-color` synchronisiert die Textfarbe in den Tab-Header.
- `tab-selected` wird nach einem Tabwechsel mit `{ index }` emittiert.
- `xtabs-selected` ist der kanonische `xstate`-Key fuer externe Tabwechsel.
- Keyboard-Navigation umfasst `ArrowRight`, `ArrowLeft`, `Home`, `End`, `Enter` und `Space`.
- `data-rmt-schedule="ui.user-blocking.tabs"` und `data-xtend-lane="user-blocking"` bilden die Fixture-Linie fuer RMT/Fabric-Scheduling.
- `snapshotPerformance()` macht das WP-E12-02 Runtime-Budget testbar.
- Seit `WP-E12-03` sind Browser-Smoke und Theme-Matrix explizit auf `x-tabs` Keyboard-, ARIA- und Theme-Shell-Journeys erweitert.

---

*Letzte Aktualisierung: 7. Mai 2026*

## ECH-WP-09 Token-Tabelle und Navigation States

`signatureDesign`: `x-tabs` erzeugt eine eigenstaendige Enterprise-Tabnavigation mit sichtbarer Selected-Schiene, wrap-sicheren Labels und frei austauschbarer Typografie. Active/Current/Selected, Hover, Focus und Disabled sind ueber gemeinsame Navigationstokens themebar.

| Token | Zweck |
| --- | --- |
| `--xtend-nav-surface` | Tablist-Surface |
| `--xtend-nav-text` | Tab-Text |
| `--xtend-nav-border-color` | Tab- und Tablist-Kanten |
| `--xtend-nav-radius` | Tab-Radius |
| `--xtend-nav-gap` | Abstand zwischen Tabs |
| `--xtend-nav-font-family` | Tab-Typografie |
| `--xtend-nav-font-size` | Tab-Textgroesse |
| `--xtend-nav-active-surface` | Selected-Flaeche |
| `--xtend-nav-active-text` | Selected-Text |
| `--xtend-nav-current-indicator` | nicht farb-only Selected-Indikator |
| `--xtend-nav-hover-surface` | Hover-Flaeche |
| `--xtend-nav-focus-ring` | Tastaturfokus |
| `--xtend-nav-disabled-opacity` | Disabled-Dimmung |

## ECH-WP-09 Keyboard-Verhalten

`ArrowRight`, `ArrowLeft`, `Home`, `End`, `Enter` und `Space` bleiben die verbindlichen Tasten. Disabled Tabs werden nicht fokussiert oder aktiviert. Active/Current/Selected wird ueber `aria-selected="true"` am Tab und `role="tabpanel"` am Panel gespiegelt; Route-Tabs koennen zusaetzlich `aria-current="page"` durch Host-Logik tragen.

## ECH-WP-09 Fremdtheme

```css
[data-xtend-nav-theme="enterprise-foreign"] x-tabs {
  --xtend-nav-surface: #f3f0e8;
  --xtend-nav-text: #202520;
  --xtend-nav-border-color: rgba(32, 37, 32, 0.24);
  --xtend-nav-radius: 0.35rem;
  --xtend-nav-gap: 0.4rem;
  --xtend-nav-font-family: "Aptos", "Segoe UI", sans-serif;
  --xtend-nav-font-size: 0.95rem;
  --xtend-nav-active-surface: #243c34;
  --xtend-nav-active-text: #fff9ed;
  --xtend-nav-current-indicator: #a65f2d;
  --xtend-nav-hover-surface: rgba(166, 95, 45, 0.14);
  --xtend-nav-focus-ring: 3px solid #a65f2d;
  --xtend-nav-disabled-opacity: 0.42;
}
```
