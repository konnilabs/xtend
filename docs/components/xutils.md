# xutils - XTend Utility-Modul

## Uebersicht

`x-utils` ist ein Manifest-geführtes Utility-Modul und keine eigene Custom-Element-Oberflaeche. Das Modul exportiert `XUtils` und stellt im Browser zusaetzlich `window.XUtils` bereit. Es sammelt kleine DOM-, Event-, A11y-, Format- und Low-Code-Helfer fuer XTend-Komponenten und Demos.

## Import

```js
import { XUtils } from './components/xutils.js';

const button = XUtils.create('button', {
  textContent: 'Speichern'
});
```

Im Browser ist nach dem Laden des Moduls verfuegbar:

```js
window.XUtils.find('[data-action="save"]');
```

## DOM- und Event-API

| Methode | Beschreibung |
|---------|--------------|
| `find(selector, root?)` | gibt das erste passende Element zurueck |
| `findAll(selector, root?)` | gibt alle passenden Elemente als Array zurueck |
| `create(tag, props?)` | erzeugt ein Element und weist Properties zu |
| `on(el, type, handler, opts?)` | registriert einen Listener und gibt eine Cleanup-Funktion zurueck |
| `delegate(root, selector, type, handler)` | delegiert Events innerhalb eines Containers |

## A11y- und UI-Helfer

| Methode | Beschreibung |
|---------|--------------|
| `setAria(el, attrs)` | setzt `aria-*` Attribute aus einem Objekt |
| `focusTrap(container)` | fokussiert das erste fokussierbare Element im Container |
| `fadeIn(el, duration?)` | einfache Opacity-Animation |
| `fadeOut(el, duration?)` | einfache Opacity-Animation |
| `isMobile()` | prueft den lokalen Mobile-Breakpoint |

## Format- und Datenhelfer

| Methode | Beschreibung |
|---------|--------------|
| `hexToRgb(hex)` | wandelt Hex-Farben in RGB-Werte |
| `contrastColor(hex)` | liefert Schwarz oder Weiss als Kontrastfarbe |
| `formatDate(date, locale?)` | formatiert ein Datum |
| `formatNumber(num, locale?)` | formatiert eine Zahl |
| `uniqueId(prefix?)` | erzeugt eine einfache Runtime-ID |
| `deepClone(obj)` | erzeugt eine JSON-basierte Kopie |

## XTemplate Recipes

`XUtils.XTemplate` enthaelt kleine Low-Code-Rezepte fuer einfache DOM-Fragmente:

```js
const card = XUtils.XTemplate.card({
  title: 'Status',
  content: 'Alle Systeme bereit'
});

const action = XUtils.XTemplate.button({
  label: 'Aktualisieren',
  onClick: () => window.location.reload()
});
```

Aktuelle Rezepte:

| Recipe | Beschreibung |
|--------|--------------|
| `card(opts)` | erzeugt eine einfache Card-Struktur |
| `button(opts)` | erzeugt einen Button |
| `modal(opts)` | erzeugt eine einfache Modal-Struktur |

## Contract

- `x-utils` ist als Manifest-Eintrag vorhanden, bleibt aber ein Utility-Modul.
- Es registriert kein `customElements.define()`.
- Die Datei `docs/components/xutils.md` ist der kanonische Docs-Slug zum Source-Basename `xutils.js`.
- Runtime-Tag und Manifest-Key bleiben fuer die Catalog Matrix `x-utils`.

## Utility Boundary Contract

Seit `WP-E12-09` ist `x-utils` als nicht-visuelle Utility-Boundary gatebar:

- Utility Schema: `xtend.utility.module-contract.v1`
- Import Policy Schema: `xtend.utility.import-policy.v1`
- Import Policy Result Schema: `xtend.utility.import-policy-result.v1`
- Boundary Probe Schema: `xtend.utility.boundary-probe.v1`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

Die Runtime stellt dafuer drei explizite Contract-APIs bereit:

| Methode | Beschreibung |
|---------|--------------|
| `getUtilityContract()` | liefert Kategorien, Exports, Globals und Methoden der Utility-Oberflaeche |
| `snapshotUtilityContract()` | liefert einen stabilen Boundary-Snapshot fuer Fixtures und Catalog-Gates |
| `assertLocalImport(specifier)` | prueft, ob ein Import-Specifier lokal und policy-konform ist |

```js
const local = XUtils.assertLocalImport('/components/xbutton.js');
const blocked = XUtils.assertLocalImport('https://cdn.ccs-networks.de/xtend/components/xstate.js');

console.log(local.allowed);   // true
console.log(blocked.allowed); // false
```

`assertLocalImport()` dispatcht im Browser zusaetzlich `xutils:import-policy-check`. Das Event ist fuer Test-, Fabric- und Security-Harnesses gedacht; der RMT Kernel importiert `x-utils` weiterhin nicht.

## Hinweise

- Neue Komponenten sollten fuer produktive UI-Vertraege bevorzugt eigene Component-APIs und XTend-Fabric-Gates nutzen.
- `x-utils` bleibt ein kleiner Hilfsmodul-Pfad fuer Bestand, Demos und einfache DOM-Arbeit.
- Suite, Fixture und Utility-Typisierung sind seit `WP-E12-09` vorhanden. Offen bleibt ein explizites Performance-Profil fuer die Utility-Boundary.
- Die verbliebene Performance-Entscheidung bleibt im `ER-WP-35` Regression-Priority-Plan sichtbar.
