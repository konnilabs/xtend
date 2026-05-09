# ER-WP-21 - Performance-Doku fuer Komponentenautoren schreiben

- Status: `completed`
- Datum: 6. Mai 2026
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Contract: `xtend.enterprise.er-wp-21.performance-authoring-docs.v1`
- Docs Contract: `xtend.docs.performance-authoring.v1`
- Scaffold Policy: `xtend.scaffold.performance-policy.v1`
- Bezug:
  - `docs/performance.md`
  - `development/XTend-Performance-Budget-Matrix.md`
  - `development/XTend-Performance-Messpunkte-und-Snapshots.md`
  - `development/XTend-Performance-Regression-Gate.md`
  - `development/XTend-Hydration-Policy-Contract.md`
  - `xtend-builder/performance/component-performance-profile.js`
  - `xtend-builder/scaffold.config.js`

## Ziel

`ER-WP-21` macht Performance-by-design fuer Komponentenautoren praktisch. DOM-Zugriffe, Events, Shadow DOM, Layout, Animation und Hydration sollen nicht als spaete Optimierung behandelt werden, sondern im Component-Scaffold, in Docs und in lokalen Gates dieselbe Performance Policy referenzieren.

## Umgesetzte Artefakte

| Artefakt | Status | Beschreibung |
|----------|--------|--------------|
| `docs/performance.md` | completed | offizieller Autorenleitfaden mit DOM-, Event-, Shadow-DOM-, Layout-, Animation- und Hydration-Regeln |
| `xtend-builder/performance/component-performance-profile.js` | completed | maschinenlesbares Component Performance Profile `xtend.performance.component-profile.v1` |
| `xtend-builder/scaffold.config.js` | completed | Scaffold Policy `xtend.scaffold.performance-policy.v1` und Referenzen zu Budget, Docs und Gates |
| `xtend-builder/templates/component/*.template.*` | completed | Source, Docs, Tests, Types und Manifest rendern Performance-Profil-Metadaten |
| `xtend-builder/blueprints/component-blueprint.contract.js` | completed | Blueprint fordert Performance-Profil in Source, Docs, Tests, Types und Manifest |
| `development/XTend-Dokumentations-und-Demo-Referenzpfade.md` | completed | Referenzpfade und Handoff aktualisiert |

## Policy-Ergebnis

| Contract | Zweck |
|----------|-------|
| `xtend.scaffold.performance-policy.v1` | Scaffold-Policy fuer Performance-Profile, Dokuabschnitte und lokale Gates |
| `xtend.performance.component-profile.v1` | pro Komponente ableitbares Profil mit `budgetClass`, `lane`, `hydrationPolicy` und kritischen Messpunkten |
| `xtend.performance.budget-matrix.v1` | Budget-Quelle fuer Profile und Phasen |
| `xtend.performance.measurement.v1` | Runtime-Messpunkte fuer Loader, Component, Event und Route |
| `xtend.performance.regression-gate.v1` | lokaler Gate fuer deterministische Regressionen |
| `xtend.fabric.hydration-policy.v1` | Hydration-Policy fuer `visible`, `idle` und `lazy` |

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Autorendokumentation existiert | erfuellt |
| DOM-, Event-, Shadow-DOM-, Layout- und Animationsregeln sind beschrieben | erfuellt |
| Scaffold und Docs referenzieren dieselbe Performance Policy | erfuellt |
| Component-Dry-Runs tragen Performance-Profil-Metadaten | erfuellt |
| lokale Gates sind dokumentiert | erfuellt |

## Verifikation

```bash
node --check xtend-builder/performance/component-performance-profile.js
node --check xtend-builder/generators/component-plan.js
node --check xtend-builder/generators/component-files.js
node scripts/run_xtend_tests.js references --json
npm test -- --json
```

## Handoff

| Folgepaket | Startstatus nach ER-WP-21 | Handoff |
|------------|---------------------------|---------|
| `ER-WP-25` | completed | Screenreader-Signale sind mit Performance-Profilen und `a11y` Fibers verbindbar |
| `ER-WP-26` | completed | Reduced-Motion- und High-Contrast-Gates stuetzen sich auf dieselbe Profil- und Lane-Sprache |
| `ER-WP-31` | next | kann Component Catalog Coverage um Performance-Profil-Sichtbarkeit erweitern |

## Ergebnis

`ER-WP-21` ist abgeschlossen. XTend besitzt jetzt eine offizielle Performance-Autorendoku und eine Scaffold-Policy, die neue Komponenten mit denselben Profil-, Budget-, Hydration- und Gate-Begriffen versieht wie die Runtime- und Regressionsebene.
