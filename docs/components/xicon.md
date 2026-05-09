# xicon – XTend Komponente

> **Siehe auch:** [xbutton](./xbutton.md), [xtheme](./xtheme.md), [xrouter](./xrouter.md)

## Uebersicht

`<x-icon>` ist der universelle Ikonographie-Adapter fuer XTend Apps. Die Komponente rendert lokale Inline-SVG-Icons, registrierte Icon-Packs oder kontrollierte URL-Quellen und bleibt dabei framework-agnostisch, RMT-kompatibel und CDN-frei.

Das mitgelieferte `core` Pack deckt die wichtigsten XTend-UI-Symbole ab. Der lokale `lucide` Adapter dient als groesseres Superset, wird aus lokalen ESM-Artefakten geladen und vermeidet externe CDN-Abhaengigkeiten, FCP-Bremsen und Datenschutzprobleme.

## Features

- lokales `core` Icon-Pack mit Basis-Icons fuer Shell, Docs, Status und Navigation
- lokaler `lucide` IconPack Adapter als Superset ohne Remote Runtime Import
- globale Registry `window.XTend.icons` fuer Custom Icon Packs und Corporate-Design-Sets
- direkte Quellen ueber `src` fuer SVG-Dateien aus Repo, App-Bundle oder CDN-Policies des Hosts
- rohe SVG-Pack-Eintraege werden vor dem Rendern auf erlaubte Knoten und Attribute reduziert
- A11y-Modus fuer dekorative und semantische Icons
- State-Integration ueber `xicon-state-<id>`
- RMT Shell Authoring ueber `xtend.rmt.component-contract.v1`
- Performance-Profil `xtend.performance.component-profile.v1` mit `display-micro` Budget

## Verwendung

```html
<x-icon name="search" label="Suche"></x-icon>
<x-icon name="gauge" pack="lucide" size="1.25rem" label="Performance"></x-icon>
<x-icon src="/assets/icons/company.svg" label="Corporate Icon"></x-icon>
<x-icon name="chevron-right" decorative></x-icon>
```

## Attribute

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `name` | String | Icon-Name oder Alias aus der Registry |
| `pack` | String | optionales Icon-Pack, z.B. `core` oder `lucide` |
| `src` | String | kontrollierte URL-Quelle fuer ein Icon aus Repo, App-Bundle oder Host-Policy |
| `label` | String | zugänglicher Name fuer Screenreader |
| `size` | String | CSS-Groesse, z.B. `1em`, `20px`, `1.25rem` |
| `stroke-width` | String | Strichstaerke fuer Inline-SVG-Pfade |
| `color` | String | CSS-Farbwert; Standard ist `currentColor` |
| `decorative` | Boolean | setzt `aria-hidden` und entfernt semantische Bildrolle |

## Events

| Event | Beschreibung |
|-------|--------------|
| `icon-ready` | Icon wurde aus Pack oder `src` aufgeloest |
| `icon-missing` | Registry konnte `name`/`pack` nicht aufloesen |
| `icon-pack-registered` | ein Pack wurde in der globalen Registry registriert |

## API

| Methode | Zweck |
|---------|-------|
| `setIcon(name, options?)` | setzt Icon, Pack, Label oder `src` programmatisch |
| `registerPack(pack, options?)` | registriert ein Pack ueber die Komponente |
| `snapshot()` | liefert `xtend.component.x-icon.state.v1` inklusive Registry-Snapshot |
| `window.XTend.icons.register(pack, options?)` | globale Pack-Registrierung |
| `window.XTend.icons.resolve(name, options?)` | globale Aufloesung ohne Rendering |
| `window.XTend.icons.snapshot()` | Registry-Snapshot fuer Diagnostics |

## Custom Icon Packs

```js
window.XTend.icons.register({
  id: 'brand',
  label: 'Corporate Design Icons',
  cdnAllowed: false,
  icons: {
    product: {
      aliases: ['logo-mark'],
      nodes: [
        { tag: 'path', attrs: { d: 'M12 3 21 8v8l-9 5-9-5V8Z' } }
      ]
    }
  }
});
```

Packs koennen eigene SVG-Node-Descriptoren, einzelne Path-Strings, inline SVG-Records oder URL-Records enthalten. Remote-Quellen sind nicht Default von XTend; sie muessen bewusst vom Host als `src` oder Pack-URL bereitgestellt werden.

## RMT und Fabric

`x-icon` deklariert `xtendRmtMetadata` mit `adapter: 'xtend.component'`, `templateMode: 'dom_descriptor'`, `shellAuthoring.attributes` und der Boundary `no-rmt-kernel-import-of-xtend-types`. RMT kann Icons dadurch in App Shells, Navigationen, Buttons oder Docs-Templates authoren, ohne den XTend-Kernel oder einen Icon-Vendor zu importieren.

Fabric konsumiert:

- `icon-ready`
- `icon-missing`
- `icon-pack-registered`
- State-Key `xicon-state-<id>`
- `snapshot()`

## Styling & Theming

```css
x-icon {
  --xtend-icon-size: 1rem;
  --xtend-icon-color: currentColor;
  --xtend-icon-stroke-width: 2;
}
```

Das Icon folgt `currentColor` und integriert sich dadurch in `x-theme`, `x-header`, `x-button`, `x-menu` und eigene Corporate-Design-Tokens. Im Forced-Colors-Modus bleibt die Komponente ueber Systemfarben lesbar.

## Accessibility

- mit `label` rendert der Host `role="img"` und `aria-label`
- ohne Label oder mit `decorative` rendert die Komponente `aria-hidden`
- URL-Icons erhalten ein leeres `alt`, wenn sie dekorativ sind
- `icon-missing` ist als diagnostisches Event verfuegbar, ohne Screenreader mit Fehlersignalen zu belasten
