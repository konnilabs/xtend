# Performance fuer Komponentenautoren

- Docs Contract: `xtend.docs.performance-authoring.v1`
- Scaffold Policy: `xtend.scaffold.performance-policy.v1`
- Component Profile Contract: `xtend.performance.component-profile.v1`
- Budget Matrix: `xtend.performance.budget-matrix.v1`
- Measurement Contract: `xtend.performance.measurement.v1`
- Regression Gate: `xtend.performance.regression-gate.v1`
- Hydration Policy: `xtend.fabric.hydration-policy.v1`
- Seit: `ER-WP-21`

Dieses Dokument uebersetzt die Performance-Budget-Matrix in konkrete Autorenregeln. Neue Komponenten sollen nicht erst nachtraeglich optimiert werden, sondern ihr Performance-Profil bereits im Scaffold, in der Component-Doku, in Fabric Measurements und im lokalen Regression Gate sichtbar machen.

## Performance-Profil

Jede neue Scaffold-Komponente erhaelt `xtendScaffoldPerformanceProfile` im Source, `performanceProfile` im Manifest-Patch-Plan und die Docs-Abschnitte `Performance-Profil` sowie `Performance-Regeln`. Diese Artefakte referenzieren dieselbe Policy `xtend.scaffold.performance-policy.v1`.

| Profil | Lane | Budgetklasse | Hydration | Kritische Phasen |
|--------|------|--------------|-----------|------------------|
| `display` | `visible` | `interactive` | `visible` | load, mount, hydrate, render, update |
| `interactive` | `user-blocking` | `critical` | `visible` | hydrate, render, update, event |
| `overlay` | `user-blocking` | `critical` | `visible` | mount, hydrate, render, event |
| `routing` | `transition` | `interactive` | `visible` | route navigate, route render, hydrate, event |
| `form` | `user-blocking` | `critical` | `visible` | hydrate, update, event |
| `media` | `visible` | `interactive` | `visible-or-idle` | mount, hydrate, render, event |
| `stateful` | `user-blocking` | `critical` | `visible` | update, event, state sync |
| `feedback` | `a11y` | `critical` | `visible` | render, update, event, announcement |
| `theme` | `visible` | `interactive` | `visible` | render, update, theme apply |

Komponenten mit mehreren Profilen verwenden die strengste Budgetklasse und die hoechstpriorisierte Lane. `feedback` darf eine eigene `a11y` Fiber nutzen; `media` darf nicht sichtbare Arbeit auf `idle` verschieben.

## DOM-Regeln

- DOM-Suchen muessen auf `this.shadowRoot`, den Host oder einen bekannten Container begrenzt sein.
- `document.querySelectorAll` und globale DOM-Loops brauchen eine begruendete Ausnahme und ein Budget.
- Statische Referenzen duerfen gecacht werden; dynamische Node-Listen duerfen nicht unkontrolliert wachsen.
- Wiederholte Voll-Renderings sind nur fuer kleine, statische Komponenten akzeptabel. Groessere Komponenten muessen gezielt updaten.
- `MutationObserver`, `ResizeObserver`, Timer und Subscriptions muessen in `disconnectedCallback` bereinigt werden.

## Event-Regeln

- `interactive`, `overlay` und `form` behandeln User Events als `critical`; der synchrone Handler-Zielwert ist 16 ms.
- Handler duerfen keine synchronen Netzwerk-, Storage- oder grossen DOM-Scan-Arbeiten ausfuehren.
- High-frequency Events wie `input`, `scroll`, `pointermove` und `resize` muessen gedrosselt, zusammengefasst oder auf `requestAnimationFrame` gelegt werden.
- Event-Daten sollen in kanonischen State oder lokale Render-Caches ueberfuehrt werden; abgeleitete DOM-Arbeit erfolgt danach gebuendelt.

## Shadow DOM

- Styles sollten statisch bleiben. Wiederholtes Einfuegen identischer `<style>` Bloecke im Update-Pfad ist ein Review-Signal.
- Wo moeglich werden CSS Custom Properties und Parts genutzt, damit Theme-Arbeit nicht ueber JS-Layout-Loops laeuft.
- `slotchange` muss budgetiert sein und darf keine unbeschraenkten DOM-Scans ausloesen.
- Shadow-DOM-Updates sollen kleine Teilbaeume austauschen, statt bei jeder State-Aenderung die gesamte Oberflaeche neu zu schreiben.

## Layout und Animation

- Layout-Reads passieren vor Layout-Writes. Gemischte Read/Write-Schleifen in derselben Sync-Phase sind verboten.
- Animationen sollen `transform` und `opacity` bevorzugen und `prefers-reduced-motion` respektieren.
- Messbare sichtbare Arbeit muss mit `componentRef`, `fiberId`, `lane`, `phase` und `durationMs` korrelierbar sein.
- Nicht sichtbare Arbeit nutzt `idle`, `background` oder `diagnostics`; sie darf keine `user-blocking` Lane beanspruchen.

## Hydration

`visible` ist der Default fuer sichtbare UI. `idle` ist fuer nicht sofort benoetigte, aber bald erwartete Arbeit geeignet. `lazy` ist fuer Arbeit reserviert, die erst bei Bedarf oder Sichtbarkeit aktiviert wird. Nicht sichtbare Hydration darf nicht als `user-blocking` geplant werden.

Die operative Policy steht in [Hydration Policies](./hydration-policies.md). Die Messpunkte und Gate-Auswertung stehen in [Performance Measurements](./performance-measurements.md) und [Performance Regression](./performance-regression.md).

## Scaffold-Pflicht

Neue Scaffold-Ausgaben muessen diese Daten sichtbar machen:

- `performanceProfile`
- `budgetClass`
- `lane`
- `hydrationPolicy`
- `criticalMeasurements`
- `idleOrBackgroundAllowed`
- `requiresA11yFiber`

Die Policy ist in `xtend-builder/scaffold.config.js` unter `performance` hinterlegt. Der Generator spiegelt sie in `xtend-builder/performance/component-performance-profile.js`, den Component-Templates und dem Manifest-Patch-Plan.

## Gates

```bash
node scripts/run_xtend_tests.js fabric-performance-measurements --json
node scripts/run_xtend_tests.js performance-regression --json
node scripts/run_xtend_tests.js hydration-policy --json
node scripts/run_xtend_tests.js references --json
```

`performance-regression` darf lokale Warnungen erzeugen, wenn ein deterministischer Fixture-Pfad sein Budget ueberschreitet. Harte Failures bleiben fuer priorisierte Kernpfade und dokumentierte Budgetverletzungen reserviert.

## Handoff

`ER-WP-25` ist abgeschlossen und verbindet Screenreader-Signale mit Performance-Fibers und der `a11y` Lane. `ER-WP-26` ist ebenfalls abgeschlossen: Reduced-Motion- und High-Contrast-Regeln nutzen dieselbe Profil-, Lane- und Gate-Sprache ueber `xtend.a11y.motion-contrast-policy.v1`.
