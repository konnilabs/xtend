# xdialog - XTend Komponente

## Uebersicht

`<x-dialog>` ist die state-getriebene Dialog-Komponente fuer XTend. Sie verbindet Attributsteuerung, `xstate`-Open-Flags und den aggregierten `ui.dialogs`-State zu einem gemeinsamen Overlay-Contract.

## Verwendung

```html
<x-dialog overlay title="Beispieldialog" width="400px">
  <p>Inhalt</p>
  <div slot="actions">
    <button onclick="this.closest('x-dialog').close()">Schliessen</button>
  </div>
</x-dialog>
```

## Attribute

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `open` | boolean | Dialog ist geoeffnet |
| `overlay` | boolean | zeigt einen Overlay-Hintergrund |
| `title` | string | Titelzeile des Dialogs |
| `width` | string | Zielbreite des Dialogs |
| `height` | string | Zielhoehe des Dialogs |

## Slots

| Slot | Beschreibung |
|------|--------------|
| default | Hauptinhalt des Dialogs |
| `actions` | Aktionen im Footer |

## Events

| Event | Beschreibung |
|-------|--------------|
| `dialog-opened` | nach erfolgreichem Oeffnen |
| `dialog-closed` | nach erfolgreichem Schliessen |

Die Events liefern:

```js
{
  id: 'dialog-abc123',
  open: false,
  source: 'button'
}
```

## API

- `element.open()`
- `element.close()`

API- und XState-gesteuerte Dialoge verwenden dieselben Open-Flags:

- `xtend.component.x-dialog.<id>.open`
- `dialog-open-<id>`
- `xdialog-open-<id>`

## Runtime-Contract

- API-gemanagte Dialoge lesen Titel, Inhalt und Aktionen aus `xstate.get('ui').dialogs`
- Benutzerinteraktionen wie ESC, Overlay-Klick und Close-Button schreiben den Open-State zurueck
- API-gemanagte Dialoge entfernen sich nach dem Schliessen aus `ui.dialogs` und aus dem DOM

## Hinweise

- direkte DOM-Nutzung ueber Slots bleibt unterstuetzt
- fuer API-gemanagte Dialoge ist `window.XDialog.show()` der bevorzugte Einstieg
- Fokusfalle, Rueckfokus und ARIA-Rollen sind Teil des Standardverhaltens

## Overlay Interaction UX Profil

Seit `WP-E11-11` deklariert `<x-dialog>` das Runtime-Profil `xtend.component.overlay-interaction-ux-profile.v1` ueber `xtendOverlayInteractionUxProfile`.

| Feld | Wert |
|------|------|
| Family | `dialog` |
| State Key | `dialog-open-<id>` |
| Schedule | `overlay.stack.open` |
| Commands | `open`, `close`, `focus-trap`, `apply-inert`, `lock-scroll`, `snapshot` |

Das Profil standardisiert Focus Trap, Rueckfokus, Escape-Topmost-Regel, Background-Inert, balanced Scroll Lock und host-lokale Portal-Semantik. RMT kann den Dialog in Shell-first Templates planen, waehrend der RMT-Kernel durch `no-rmt-kernel-import-of-xtend-types` framework-agnostisch bleibt.

## ECH-WP-06 Overlay-Paritaet

`x-dialog` expose `surface`, `backdrop`, `close` und `content` als gemeinsame Overlay-Parts. `overlay` bleibt als Alias fuer `backdrop` erhalten. Surface, Text, Backdrop, Elevation, Radius, Z-Index, Action-Farben, Close-Flaeche und Focus Ring sind ueber `--xtend-overlay-*`, `--dialog-*` oder `--xdialog-*` Tokens ueberschreibbar.

`x-dialog` ist modal: Focus Trap, Background-Inert, Scroll Lock, Escape und Rueckfokus bleiben im Standardpfad aktiv. Dialoge ohne `overlay` behalten die Surface-Parts, verzichten aber auf den visuellen Backdrop.
