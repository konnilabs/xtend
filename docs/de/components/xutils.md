# x-utils

x-utils ist eine öffentliche XTend Komponentenreferenz für Drittanbieter, die die Komponente ohne internes Projektwissen einbinden müssen.

## Was es löst

x-utils ist eine Infrastrukturgrenze und kein dekoratives Widget. Importiere sie bewusst und halte den Manifest-Eintrag lokal. Die Komponente wird aus `components/xutils.js` geladen, über `components/manifest.json` deklariert und über `components/xutils.d.ts` typisiert. Damit ist diese Seite ein praktischer Vertrag: Ein Host sieht, welche Attribute stabil sind, welche Events abonniert werden können, welche Methoden aufrufbar sind und welche CSS-Hooks zur Anpassung vorgesehen sind.

Nutze diese Seite, wenn du XTend in eine Produktshell, ein Micro Frontend, eine CMS-Seite oder eine RMT Surface integrierst. Der Fokus liegt auf der öffentlichen Oberfläche und nicht auf internen Details; externe Teams können die Hinweise deshalb direkt als Integrationsbasis verwenden.

## Einsatz

Setze `x-utils` ein, wenn du das Verhalten aus dem Profil `utility` brauchst und eine lokale Web Component mit XTend Theming, Accessibility und Scheduling-Konventionen verwenden möchtest. Das passt besonders gut, wenn der Host framework-neutral bleiben, Komponenten lokal laden und CDN-Abhängigkeiten vermeiden soll.

Drittanbieter sollten zuerst die dokumentierten Attribute, Slots, Events und Methoden verwenden. Wrapper sind möglich, sollten die öffentliche API aber durchreichen und nicht in den Shadow DOM greifen.

## Nicht einsetzen, wenn

Vermeide `x-utils`, wenn du Verhalten brauchst, das nicht durch die dokumentierte API abgedeckt ist, oder wenn dein Host `xtend-loader.js` und `components/manifest.json` nicht laden kann. Verlasse dich nicht auf private Klassennamen, erzeugte interne Knoten oder nicht gelistete State-Keys. Für Designvarianten sind Tokens, CSS Parts oder Slots stabiler als ein Fork der Laufzeitdatei.

## Laden und registrieren

Lade den XTend Loader einmal pro Seite. Der Loader liest das lokale Manifest und löst `x-utils` auf `./xutils.js` auf. Die Manifest-URL sollte same-origin bleiben, sofern deine Sicherheitsrichtlinie keine andere Quelle erlaubt.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<script type="module">
  import { XUtils } from '/components/xutils.js';

  // x-utils is the utility boundary listed in components/manifest.json.
  XUtils.assertLocalImport('./components/xbutton.js');
  console.log(XUtils.snapshotUtilityContract());
</script>
```

## Beispiele

Das Integrationsbeispiel zeigt das Host-Muster: Element abfragen, das erste öffentliche Event abonnieren, sofern eines existiert, und eine öffentliche Methode erst nach dem Upgrade aufrufen. So bleiben Hydration und RMT-Materialisierung nachvollziehbar.

```js
import { XUtils } from '/components/xutils.js';

const policy = XUtils.assertLocalImport('./components/xbutton.js');
const effects = XUtils.resolveUiEffects({ tag: 'ui-effects', source: 'x-utils' });

document.addEventListener('xutils:ui-effects-change', (event) => {
  console.log(policy.ok, effects.bodyAttribute, event.detail);
});
```

Für produktive Oberflächen sollten IDs stabil bleiben, wenn State-Keys oder Diagnoseeinträge `<id>` enthalten. Stabile IDs machen Ereignisprotokolle, RMT Schedules und Browser-Tests zwischen Deployments vergleichbar.

## API-Referenz

Attribute:
- Keine komponentenspezifischen Attribute außer Standard-HTML-Attributen.

Events:
- `xutils:import-policy-check`
- `xutils:ui-effects-change`

Methoden:
- Keine öffentlichen Methoden außer HTMLElement-Methoden.

Slots:
- Keine benannten Slots; nutze den Standardinhalt, wenn die Komponente Kinder rendert.

CSS Parts:
- Keine öffentlichen CSS Parts in der aktuellen Laufzeit erkannt.

CSS Custom Properties:
- Keine komponentenspezifischen CSS Custom Properties in der aktuellen Laufzeit erkannt.

## Integrationshinweise

- RMT Hosts nutzen diese Seite als Integrationshinweis für die serviceartige Laufzeitgrenze.
- Browser-Utility-Surface: `window.XUtils`, `focusTrap(container)`, `assertLocalImport(specifier)` und `snapshotUtilityContract()` sind die stabilen Integrationspunkte.
- x-utils registriert kein `customElements.define()`; Hosts importieren das Modul als Utility und verwenden keine Element-Instanz.

RMT Hosts sollten die Komponente als Custom-Element-Grenze behandeln: Attribute werden als Component Props gesetzt, DOM-Events werden an Commands gebunden, und Scheduling-Metadaten bleiben außerhalb der Komponente. Reine HTML-Hosts verwenden dieselben Attribute und Events ohne RMT Compiler.

Theming sollte zuerst über XTend Design Tokens laufen. CSS Parts sind für gezieltes Skinning freigegebener Controls gedacht, während CSS Custom Properties breitere Anpassungen an Farbe, Abstand, Radius und Bewegung abdecken. Accessibility-Hooks wie Labels, Live-Regionen und Fokusverhalten sollten beim Komponieren erhalten bleiben.

## Fehlerbehebung

- Wenn `x-utils` nicht upgradet, prüfe, ob `xtend-loader.js` geladen wurde und `components/manifest.json` `x-utils` enthält.
- Wenn Events fehlen, lausche erst nach `customElements.whenDefined('x-utils')` und prüfe, ob die Interaktion deaktiviert oder durch Validierung blockiert ist.
- Wenn Styling nicht greift, nutze dokumentierte CSS Variablen und Parts; Shadow-DOM-Interna sind absichtlich nicht stabil.
- Wenn ein RMT Host veralteten Zustand rendert, prüfe zuerst State-Key und Schedule Records aus dieser Seite.

## Nächste Schritte

- [Komponenten-Entwicklung](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
