# WP-E10-02 - TypeScript Source- und Build-Strategie entscheiden

- Status: `completed`
- Datum: 7. Mai 2026
- Epic: `development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md`
- Backlog: `development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md`
- Contract: `xtend.epic10.wp02.typescript-source-build-strategy.v1`
- Bezug:
  - `development/XTend-TypeScript-Component-Source-Strategie.md`
  - `development/XTend-Component-Maturity-Modell-v2.md`
  - `xtend-builder/scaffold.config.js`
  - `package.json`
  - `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-E10-02` entscheidet, wie TypeScript als fuehrender Source-Pfad fuer neue XTend-Komponenten eingefuehrt wird, ohne die bestehende lokale ESM-Runtime, den kanonischen Loader oder bestehende JavaScript-Komponenten zu brechen.

Das Paket ist ein Fundamentpaket. Es fuehrt bewusst noch keinen produktiven TypeScript-Compilerlauf ein, sondern legt den Source-, Build-, Artefakt- und Migrationsvertrag fest, auf dem `WP-E10-03` und `WP-E10-07` aufbauen.

## Umsetzung

Das Paket erzeugt den akzeptierten Strategiecontract `xtend.typescript.component-source-strategy.v1` in:

```text
development/XTend-TypeScript-Component-Source-Strategie.md
```

Zusaetzlich wurden die Projektmetadaten vorbereitet:

- `package.json` beschreibt `xtend.typescriptComponentSource`.
- `xtend-builder/scaffold.config.js` beschreibt `typescriptSource`.
- das Epic und Backlog markieren `WP-E10-02` als abgeschlossen.
- das Referenzregister listet die neuen Artefakte.
- der Reference-Gate prueft die wichtigsten Strategie-, Config- und Metadata-Anker.

## Entscheidungen

| Bereich | Entscheidung |
|---------|--------------|
| Source Root | `src/components/<tag>/` |
| Runtime Output | `components/<basename>.js` |
| Public Types | `components/<basename>.d.ts` |
| Runtime Format | lokales ESM |
| Loader | `xtend-loader.js` |
| Manifest | `components/manifest.json` |
| Build Mode | `ts-source-to-local-esm-artifacts` |
| Bundler Policy | `no-bundler-required-for-core-components` |
| Runtime Dependencies | `no-new-runtime-dependencies` |
| Network Policy | `no-cdn-no-remote-runtime-imports` |
| Migration | neue Komponenten TypeScript-first, bestehende JS-Komponenten inkrementell |

## Migration Guard

Bestehende `components/*.js` bleiben Source of Truth, bis eine einzelne Komponente explizit migriert wird. Deshalb unterscheidet die Strategie die Zustaende:

- `js-legacy`
- `ts-planned`
- `ts-source`
- `ts-generated-esm`
- `contract-only`

Damit werden vorhandene Komponenten nicht versehentlich als generierte Artefakte behandelt.

## Nicht umgesetzt in diesem Paket

- keine neue TypeScript-Abhaengigkeit
- kein produktiver `tsc`-Build
- kein Bundler
- keine Migration bestehender Komponenten
- keine Aenderung des Loader- oder Manifest-Laufzeitverhaltens

Diese Punkte gehoeren in die Folgepakete, insbesondere `WP-E10-03` und `WP-E10-07`.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| TypeScript Source-Strategie liegt vor | erfuellt: `development/XTend-TypeScript-Component-Source-Strategie.md` |
| Source und Runtime-Artefakte sind getrennt | erfuellt: `src/components/` -> `components/` |
| bestehende JavaScript-Komponenten bleiben lauffaehig | erfuellt: Migration Guard definiert |
| ESM-, Loader- und Manifest-Vertraege bleiben kompatibel | erfuellt |
| keine CDN- oder Runtime-Dependency-Pflicht entsteht | erfuellt |
| RMT Kernel bleibt frei von XTend-spezifischem TypeScript | erfuellt |
| `WP-E10-03` und `WP-E10-07` koennen ableiten | erfuellt |

## Folgepakete

| Paket | Status nach WP-E10-02 | Naechster Nutzen |
|-------|------------------------|------------------|
| `WP-E10-03` | startbar | Component Contract v2 auf TypeScript Source, RMT Metadata und Fabric Boundary abbilden |
| `WP-E10-04` | startbar | RMT-first App Authoring weiter konkretisieren |
| `WP-E10-07` | vorbereitbar | TypeScript Blueprint und Build-/Patch-Plan im `xtend-builder` ableiten |

## Verifikation

Durchgefuehrte lokale Gates:

```bash
node --check xtend-builder/scaffold.config.js
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js rmt-compatibility --json
```

Ergebnis: alle Gates bestanden.

## Ergebnis

`WP-E10-02` ist abgeschlossen. XTend besitzt nun einen verbindlichen TypeScript Source- und Build-Strategievertrag, der neue Komponenten TypeScript-first macht, aber die bestehende lokale ESM-Runtime und die JavaScript-Bestandspflege absichert.
