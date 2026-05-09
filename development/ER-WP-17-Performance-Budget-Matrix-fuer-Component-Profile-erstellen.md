# ER-WP-17 - Performance Budget Matrix fuer Component-Profile erstellen

- Status: `completed`
- Datum: 5. Mai 2026
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Contract: `xtend.enterprise.er-wp-17.performance-budget-matrix.v1`
- Zielcontract: `development/XTend-Performance-Budget-Matrix.md`
- Budget Matrix Contract: `xtend.performance.budget-matrix.v1`
- Component Profile Contract: `xtend.performance.component-profile.v1`
- Measurement Contract: `xtend.performance.measurement.v1`
- Bezug:
  - `development/XTend-Enterprise-Reife-Implementierungsplan.md`
  - `development/XTend-Fiber-und-Lane-Contract.md`
  - `development/XTend-Testpflicht-und-Scaffold-Anschluss.md`
  - `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
  - `tests/references/reference_path_suite.js`

## Ziel

`ER-WP-17` legt Performance-by-design als Budgetmatrix fuer Component-Profile fest.

Das Paket implementiert noch keine Messpunkte, keine Runtime-Instrumentierung und keine Regression Suite. Es definiert die Budgetbegriffe, Profile, Messphasen, Gate-Stufen und Handoffs, damit `ER-WP-18`, `ER-WP-19`, `ER-WP-20` und `ER-WP-21` ohne neue Architekturentscheidung starten koennen.

## Ergebnisartefakt

Der verbindliche Contract liegt in:

```text
development/XTend-Performance-Budget-Matrix.md
```

Er traegt:

- `xtend.performance.budget-matrix.v1`
- `xtend.performance.component-profile.v1`
- `xtend.performance.measurement.v1`

## Profilmatrix

Die Kernmatrix deckt die Roadmap-Pflichtprofile ab:

| Profil | Default-Lane | Budgetklasse | Zweck |
|--------|--------------|--------------|-------|
| `display` | `visible` | `interactive` | sichtbarer DOM-Vertrag ohne schwere Interaktion |
| `interactive` | `user-blocking` | `critical` | Events, Fokus und Tastaturpfade |
| `overlay` | `user-blocking` | `critical` | Dialoge, Modals, Fokusfallen und Escape |
| `routing` | `transition` | `interactive` | Navigation und Route Render |
| `form` | `user-blocking` | `critical` | Value, Validation und Submit-/Change-Events |
| `media` | `visible` | `interactive` | Medienzustand, Controls und Fallbacks |

Zusaetzlich sind die bereits im Scaffold/Teststandard vorhandenen Profile aufgenommen:

- `stateful`
- `feedback`
- `theme`

Damit bleibt die Matrix kompatibel mit `xtend-builder/scaffold.config.js` und `development/XTend-Testpflicht-und-Scaffold-Anschluss.md`.

## Messphasen

`ER-WP-17` definiert diese Phasen fuer spaetere Messwerte:

- `load`
- `define`
- `mount`
- `hydrate`
- `render`
- `update`
- `event`
- `route`
- `teardown`
- `diagnostics`

Der Measurement Contract `xtend.performance.measurement.v1` muss spaeter mindestens `profile`, `componentRef`, `fiberId`, `lane`, `phase`, `durationMs`, `budgetMs`, `status` und `sampleKind` tragen.

## Gate-Stufen

Die spaetere Regression Suite startet dreistufig:

| Status | Bedingung | Wirkung |
|--------|-----------|---------|
| `pass` | `durationMs <= budgetMs` | keine Aktion |
| `warn` | `durationMs <= budgetMs * 1.5` | sichtbar im Report |
| `fail` | `durationMs > budgetMs * 1.5` | Gate-Fail fuer priorisierte Kernpfade |

Damit koennen die Initialbudgets eingefuehrt werden, ohne sofort instabile harte Release-Blocker zu erzeugen.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Budgetmatrix pro Component-Profil ist definiert | erfuellt: Kern- und Erweiterungsprofile dokumentiert |
| Hydration-Strategie pro Profil ist vorbereitet | erfuellt: `visible`, `visible-or-idle`, `idle`/`background` Regeln |
| Messphasen fuer Loader/Hydration/Render/Route sind benannt | erfuellt: Mark-Liste fuer `ER-WP-18` |
| Regression-Gate-Modus ist definiert | erfuellt: `pass`, `warn`, `fail` |
| Fabric/RMT-Korrelation ist vorbereitet | erfuellt: `fiberId`, `lane`, `budgetClass`, `deadlineMs`, `durationMs` |

## Handoff an Folgepakete

| Folgepaket | Startstatus nach ER-WP-17 | Handoff |
|------------|---------------------------|---------|
| `ER-WP-18` | completed | Loader- und Hydration-Messpunkte setzen auf Matrix, Phasen und Telemetry Snapshots auf |
| `ER-WP-19` | ready | Regression Suite kann auf `xtend.performance.measurement.v1` aufsetzen |
| `ER-WP-20` | completed | Hydration Policies nutzen Lane Mapping und Messpunkte |
| `ER-WP-21` | completed | Autorendoku nutzt Matrix, Hydration Policies und erste Gate-Erfahrung |
| `ER-WP-23` | next nach A11y-Contract | Scaffold kann spaeter Performance-Profilfelder aufnehmen |

## Verifikation

Mindestgate fuer dieses Paket:

```bash
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

`ER-WP-17` ist abgeschlossen. XTend hat eine initiale Performance Budget Matrix fuer Component-Profile, Messphasen, Gate-Stufen und Fabric-/RMT-Korrelation. `ER-WP-18` kann nach Loader-Basis auf die definierten Messpunkte aufsetzen.
