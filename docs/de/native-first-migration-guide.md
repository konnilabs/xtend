# Native-First Migration Guide

Dieser Guide beschreibt, wie XTend bestehende vendor-backed, legacy oder non-native Pfade kontrolliert reduziert. Ziel ist nicht schnelle Entfernung, sondern eine nachvollziehbare Migration mit Alternative, lokaler Prüfung, SemVer-Regel und Freigabeentscheidung.

## Grundregel

Eine alte Oberfläche darf erst abgewertet oder entfernt werden, wenn diese vier Dinge sichtbar sind:

- eine Native-First-Alternative
- ein Migration Guide
- eine lokale Prüfung
- eine Freigabeentscheidung mit SemVer-Regel

Relevante Contracts:

- `xtend.native-first.vendor-legacy-replacement.v1`
- `xtend.native-first.migration-deprecation-plan.v1`
- `xtend.native-first.performance-complexity-bundle-budget-gates.v1`
- `xtend.native-first.docs-authoring-guides.v1`

## Migrationsklassen

| Klasse | Entscheidung | Alternative |
| --- | --- | --- |
| Nicht vertrauenswürdige HTML-String-Sinks | neue normale App-UI blockieren | gepflegtes XTend-Classic-Markup, DOM Descriptor Renderer, Trusted DOM, strukturierte DOM APIs |
| Vendored Utilities | Fassade einfrieren, keine breite öffentliche Oberfläche | owned Docs-Highlighter, structured writer, Sanitizing Boundary |
| Build Tooling | enthalten, aber nicht in Runtime ziehen | lokale Fallbacks, Budget- und Supply-Chain-Nachweise |
| Editor Tooling | im Editor-Scope halten | eigener RMT Language Server über stdio |
| Legacy-Loader-Oberflächen | Kompatibilität halten, Warnfenster planen | XTend Classic über `xtend-loader.js`, RMT Native Shell, App Platform Authoring |
| Kontrollierte Backports | als Guardrail geschlossen halten | Regression-Smokes und owned Component Contracts |
| Owned Adapter | als positives Muster behalten | lokale Packs, keine CDN- oder Vendor-Runtime |

## Manuelle HTML-Pfade

Normale App-UI soll nicht über freie HTML-String-Sinks entstehen. Betroffen sind Muster wie `innerHTML`, `template.innerHTML` und `insertAdjacentHTML`, wenn sie sichtbare Produkt-UI ohne Trusted-DOM-Grenze erzeugen.

Migration:

1. Beschreibe Struktur als RMT Recipe oder DOM Descriptor Record.
2. Trenne Text, Attribute, Properties, URLs und Events.
3. Nutze Trusted DOM nur für bewusst geprüfte HTML-Fragmente.
4. Führe Budget- und Renderer-Nachweise vor einem produktiven Claim.

Lokale Prüfungen:

```bash
node scripts/run_xtend_tests.js rmt-dom-descriptor-renderer --json
node scripts/run_xtend_tests.js rmt-renderer-dom-descriptor-proofs --json
node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json
node scripts/run_xtend_tests.js native-first-migration-deprecation --json
```

## Prism und Turndown

`components/prism.js` und `components/turndown.js` bleiben schmal gefasste lokale Utilities. Sie dürfen nicht zu breiten öffentlichen Vendor-Oberflächen wachsen. Neue produktive Nutzungen brauchen eine owned Alternative oder eine klare Trust Boundary.

Migration:

- Prism: bevorzugt owned Docs-Highlighter oder RMT-aware Semantic Tokens.
- Turndown: bevorzugt structured writer, Markdown AST oder Sanitizing Boundary.
- Beide Pfade bleiben ohne neue Runtime-Abhängigkeit.

Lokale Prüfungen:

```bash
node scripts/run_xtend_tests.js type-exports-vendor --json
node scripts/run_xtend_tests.js supply-chain --json
node scripts/run_xtend_tests.js native-first-migration-deprecation --json
```

## Tooling-Abhängigkeiten

`rollup`, `terser` und `vscode-languageclient` sind kein Frontend-Default. Sie bleiben Build- oder Editor-Tooling und dürfen nicht in die Core Runtime wandern.

Migration:

- Maraca behält lokale Fallbacks für Importgraph und Minifizierung.
- Editor-Integration bleibt an den RMT Language Server über stdio gebunden.
- Bundle-, Size- und Supply-Chain-Nachweise bleiben Pflicht.

## Legacy-Loader-Oberflächen

Nur `xtend-dev.js` und `./legacy-loader` bleiben Legacy-Kompatibilitätsoberflächen. [XTend Classic](./xtend-classic.md) über das kanonische `xtend-loader.js` ist ein unterstützter Produktpfad, ebenso RMT Native Shell und App Platform Authoring. Eine spätere Entfernung einer Kompatibilitätsoberfläche braucht ein Major-Fenster und mindestens zwei vorherige Minor-Warnungen.

Lokale Prüfungen:

```bash
node scripts/run_xtend_tests.js type-exports-loader --json
node scripts/run_xtend_tests.js rmt-native-shell-migration --json
node scripts/run_xtend_tests.js component-long-tail-migration --json
node scripts/run_xtend_tests.js references --json
```

## Schema-IDs und exakte Aliase

Schema-IDs sind Discriminators des Wire-Formats. Eine ID darf nicht allein
deshalb ersetzt werden, weil ein beobachtetes Runtime-Beispiel dieselben Felder
besitzt. SchemaDB verlangt einen vollständigen deklarierten oder formalen
Vertrag, identische authoritative Fingerprint-Mengen und eine ausdrückliche
fachliche Owner-Entscheidung.

Die erste Konsolidierung betrifft den XTensions Host-Resource-Cleanup-Record:

- Canonical: `xtend.xtensions.host-resource-cleanup-record.v1`
- Legacy-Aliase: die Cleanup-Record-IDs für Chart, Leaflet, React
  Host-Controller, Three und Vue Host-Controller
- Separater Vertrag: `xtend.xtensions.host-controller-cleanup-record.v1`
  bleibt unverändert, weil ihm `xtensionId` fehlt

Neue Cleanup-Producer schreiben die Canonical-ID. Reader können den
domainlokalen Resolver der bestehenden XTensions-Module verwenden. Er akzeptiert
die Canonical-ID und die fünf veralteten Aliase und kennzeichnet Legacy-Eingaben.
Unbekannte IDs bleiben ungültig. Die Aliase bleiben zwei Minor-Releases lesbar
und dürfen erst in einem späteren Major-Release entfernt werden.

Schema-Versionen verwenden ausschließlich `vN`-Hauptversionen. Jede strukturelle
oder validierungsrelevante Änderung erzeugt eine neue Hauptversion;
Beschreibungen, Beispiele und Governance-Hinweise nicht.

Lokale Prüfungen:

```bash
node scripts/scan_schema_inventory.js --audit-duplicates --json
node scripts/run_xtend_tests.js schema-inventory --json
```

## Guardrails

Kontrollierte Vendor-Backports und owned Adapter sind keine offenen Deprecations. Sie bleiben als Guardrail sichtbar:

- keine neue Vendor-Kopie
- keine CDN-Runtime
- keine breitere fremde API als öffentlicher XTend-Vertrag
- Regression-Smokes und Component Contracts bleiben aktiv

## Minimaler Prüfpfad

```bash
node scripts/run_xtend_tests.js native-first-migration-deprecation --json
node scripts/run_xtend_tests.js native-first-budget-gates --json
node scripts/run_xtend_tests.js contract-registry --json
```

Weiterlesen:

- [Native-First Authoring Guide](./native-first-authoring-guide.md)
- [Native-First RMT Recipes](./native-first-rmt-recipes.md)
- [Native-First Release Review](./native-first-release-review.md)
