# xsummary - XTend Komponente

## Uebersicht

`<x-summary>` ist eine ausklappbare Disclosure-Komponente fuer kompakte Detailbereiche. Sie nutzt native `<details>`/`<summary>` Semantik, spiegelt ihren Open-State in `xstate` und eignet sich fuer FAQ-Bloecke, technische Details, Inline-Hilfen oder Dashboard-Zusammenfassungen.

## Verwendung

```html
<x-summary id="billing-details" type="info" open>
  <span slot="title">Abrechnungsdetails</span>
  <p>Alle Rechnungspositionen werden nach Projekt und Zeitraum gruppiert.</p>
</x-summary>
```

## Attribute

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `open` | boolean | oeffnet den Detailbereich |
| `type` | string | visuelle Variante: `info`, `success`, `warning`, `danger` |

## Slots

| Slot | Beschreibung |
|------|--------------|
| `title` | Inhalt des klickbaren Summary-Kopfs |
| default | ausklappbarer Inhalt |

## Events

| Event | Beschreibung |
|-------|--------------|
| `open` | wird beim Oeffnen ausgelöst |
| `close` | wird beim Schliessen ausgeloest |

Das Event-Detail enthaelt:

```js
{
  open: true
}
```

## State-Contract

Die Instanz nutzt einen kompatiblen `xstate`-Key:

```js
xsummary-open-<id>
```

Wenn keine `id` gesetzt ist, erzeugt die Komponente eine stabile Runtime-ID fuer die aktuelle Instanz. Externe State-Aenderungen auf den Key koennen die Komponente oeffnen oder schliessen.

Die Synchronisierung ist reentrant-sicher: Attribute, nativer `<details>`-State und `xstate` werden ueber eine zentrale Open-State-Routine abgeglichen. Unveraenderte Werte werden nicht erneut in `xstate` publiziert, damit externe State-Updates keine rekursive `open()`/`close()`-Schleife ausloesen.

## A11y

- Das native `<summary>` bleibt die primaere Tastatur- und Screenreader-Oberflaeche.
- `Enter` und `Space` toggeln den Zustand.
- `aria-expanded` wird mit dem aktuellen Open-State synchronisiert.
- Der Summary-Kopf ist fokussierbar und besitzt einen sichtbaren Fokuszustand.

## Hinweise

- `x-summary` ist eine interaktive Display-Komponente und seit `ER-WP-33` component-suite-gated.
- Die Catalog Coverage Matrix fuehrt die Komponente nun als `contract-gated`.
- Weitere Contract-Haertung fuer Performance, Browser-Regression und Long-Tail-Abdeckung folgt in `ER-WP-35`; Public Types und Event Details sind seit `ER-WP-34` vorhanden.

## Layout Display Media UX Profil

`x-summary` stellt ab `WP-E11-12` das Profil `xtend.component.layout-display-media-ux-profile.v1` bereit. Die Komponente bleibt Disclosure-Display-Shell und nutzt den State-Key `xsummary-open-<id>`.

- Profil-Getter: `xtendLayoutDisplayMediaUxProfile`
- Schedule: `component.visible.mount`
- Events: `open`, `close`
- Snapshot: `snapshot()`
- CSS Parts: `container`, `summary`, `content`
