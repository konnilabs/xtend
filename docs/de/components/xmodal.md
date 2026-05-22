# xmodal - XTend Komponente

## Uebersicht

`<x-modal>` ist die state-getriebene Modal-Komponente fuer XTend. Sie wird vor allem ueber `window.XModal.show()` verwendet, kann aber auch direkt im DOM mit Attributen und Slots betrieben werden.

## Verwendung

```html
<x-modal title="Hinweis" open>
  <p>Modal-Inhalt</p>
</x-modal>
```

## Attribute

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `open` | boolean | Modal ist geoeffnet |
| `overlay` | boolean | zeigt einen Overlay-Hintergrund |
| `title` | string | Titel des Modals |
| `content` | string | textueller Inhalt |
| `actions` | string | JSON-Array fuer Action-Buttons |

## Slots

| Slot | Beschreibung |
|------|--------------|
| default | Hauptinhalt des Modals |
| `actions` | optionaler Action-Bereich |

## Events

| Event | Beschreibung |
|-------|--------------|
| `modal-opened` | nach erfolgreichem Oeffnen |
| `modal-closed` | nach erfolgreichem Schliessen |
| `modal-action` | wenn ein konfigurierte Action ausgewaehlt wird |

## API

- `element.open()`
- `element.close()`

Open-State wird ueber dieselben Pfade gefuehrt:

- `xtend.component.x-modal.<id>.open`
- `modal-open-<id>`

## Runtime-Contract

- API-gemanagte Modals lesen Titel, Inhalt und Aktionen aus `xstate.get('ui').modals`
- ESC, Overlay-Klick und Close-Button schreiben den Open-State zurueck
- API-gemanagte Modals entfernen sich nach dem Schliessen aus `ui.modals` und aus dem DOM
- direkt eingebettete Overlay-Modals werden waehrend `open` in eine `document.body` Portal-Schicht gehoben, damit Blur und Overlay den gesamten Viewport abdecken

## Hinweise

- `modal-action` enthaelt die ausgewaehlte Action-Definition im Event-Detail
- fuer API-gemanagte Modals ist `window.XModal.show()` der bevorzugte Einstieg
- der Focus-Ruecksprung zum zuletzt aktiven Element ist Teil des Standardverhaltens

## Overlay Interaction UX Profil

Seit `WP-E11-11` deklariert `<x-modal>` das Runtime-Profil `xtend.component.overlay-interaction-ux-profile.v1` ueber `xtendOverlayInteractionUxProfile`.

| Feld | Wert |
|------|------|
| Family | `modal-dialog` |
| State Key | `modal-open-<id>` |
| Schedule | `overlay.stack.open` |
| Commands | `open`, `close`, `focus-trap`, `apply-inert`, `lock-scroll`, `snapshot` |

Das Profil legt Focus Trap, Rueckfokus, Escape-Topmost-Regel, Background-Inert, balanced Scroll Lock und eine dokumentweite Portal-Schicht fest. RMT beschreibt diese Regeln shell-first ueber `tests/fixtures/rmt-overlay-interaction-ux.rmt`; der RMT-Kernel importiert weiterhin keine XTend-Typen.

Die Portal-Schicht ist dokumentweit: Wenn ein Modal mit `overlay` in verschachtelten App-Shells, XRouter-Routen oder transformierten Layout-Containern geoeffnet wird, wird der Host temporaer unter `document.body` geparkt und nach dem Schliessen an seine urspruengliche Position zurueckgesetzt. Dadurch bleibt die Slot-Faehigkeit erhalten, waehrend Overlay und Blur nicht auf den lokalen `main`- oder Route-Container begrenzt sind.

## ECH-WP-06 Overlay-Paritaet

`x-modal` expose `surface`, `backdrop`, `close` und `content` als gemeinsame Overlay-Parts. `overlay` bleibt als Alias fuer `backdrop` erhalten. Host-Themes koennen Backdrop, Surface, Text, Elevation, Radius, Z-Index, Action-Text, Close-Flaeche und Focus Ring ueber `--xtend-overlay-*`, `--modal-*` oder `--xmodal-*` Tokens steuern.

`x-modal` ist modal: Focus Trap, Background-Inert, Scroll Lock, Escape und Rueckfokus sind Teil des Standardpfads. Ein Modal ohne `overlay` behält die Surface-Parts, rendert aber keinen visuellen Backdrop.
