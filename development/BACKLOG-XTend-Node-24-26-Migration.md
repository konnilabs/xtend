# XTend Node 24/26 Migration Backlog

- Initiative: `N26`
- Status: `stage-a-implementation-complete-ci-evidence-pending`
- Stand: 19. Juli 2026
- Source of Truth: dieses Backlog, Paketmanifeste und ausführbare CI-/Release-Gates

## Zielbild

XTend trennt die veröffentlichte Mindestversion von der vorlaufenden CI-Version:

- **Stage A:** Node.js `>=24` ist die unterstützte Floor für öffentliche Pakete, Tooling, Produkte und neu generierte Apps.
- **Current-Evidence:** Node 26 bleibt bis zu seinem LTS-Eintritt ein zusätzlicher CI-/Kompatibilitätskandidat und keine stillschweigende öffentliche Mindestversion.
- **Stage B:** Eine alleinige Node-26-Floor wird erst nach LTS-Eintritt, vollständiger Matrix-Evidence und einer expliziten SemVer-/Release-Entscheidung freigegeben.
- Neu generierte Apps deklarieren zusätzlich `packageManager: npm@11.17.0`, damit lokale und CI-nahe npm-Semantik reproduzierbar bleibt.

Node 18 ist keine tragfähige Supportbasis mehr. Die Stage-A-Floor folgt der aktiven LTS-Linie, während Node 26 kontrolliert gegen denselben Source-, Build-, Package- und Browserpfad geprüft wird.

## Grenzen

- Eine Engine-Änderung ersetzt keine Laufzeitevidenz. Native Binaries, Electron, VS Code/LSP, Pack, SBOM und Publish-Dry-Run benötigen eigene Gates.
- `engines.node` ist ein öffentlicher Supportvertrag. Eine spätere Node-26-Floor ist deshalb eine bewusste Releaseentscheidung und kein beiläufiges Tooling-Update.
- Historische Roadmaps und abgeschlossene Evidenz bleiben unverändert; nur aktive Verträge und aktuelle Authoring-Dokumentation werden fortgeschrieben.
- Lockfiles werden nur durch das dafür verantwortliche Arbeitspaket aktualisiert.

## Kanonischer Vertrag

| Feld | Stage A | Stage B |
| --- | --- | --- |
| Öffentliche Engine | `>=24` | frühestens `>=26` |
| Contributor-/Publish-Default | `24.18.0` | aktuelle signierte Node-26-LTS-Patchversion |
| Pflicht-Canary | `26.5.0` | entfällt nach freigegebenem Cutover |
| npm | `11.17.0` | beim Cutover erneut exakt festlegen |
| Node-Typen | `@types/node` 24 | `@types/node` 26 |
| Frühester Cutover | nicht anwendbar | 28. Oktober 2026 und 14 aufeinanderfolgende grüne Tage |

Der Vertrag gilt für CLI, Build, Node-SSR, AppServices-Server, Tests und Host-Installation. Browser, PHP sowie die von Electron und VS Code eingebetteten Runtimes gehören nicht zu dieser Projekt-Node. Deren Version wird separat berichtet und bleibt upstream-owned.

## Abhängigkeiten und Status

| ID | Prio | Status | Abhängig von | Ergebnis | Kanonische Evidenz |
| --- | --- | --- | --- | --- | --- |
| N26-00 | P0 | implemented | – | Supportvertrag, Scope und Stage-A-/Stage-B-ADR | `package.json#xtend.nodeRuntimePolicy`, dieses Backlog |
| N26-01 | P0 | implemented | N26-00 | Manifeste, Locks, Scaffolds und aktive Dokumentation auf `>=24`; npm-Pin | `node-runtime-policy`, Scaffold-Suites |
| N26-02 | P0 | implemented; CI run pending | N26-00, N26-01 | exakte blockierende 24/26-CI-Matrix, npm 11, Runtime-Evidence, SHA-gepinnte Actions | `.xtend-test-results/runtime/xtend-node-runtime-*.json` |
| N26-03 | P0 | implemented; CI run pending | N26-02 | Toolchain-, SSR-, Pack-, Fetch-/NDJSON- und Warning/Deprecation-Härtung | `xtend-node-native-toolchain-smoke.json`, Gate-Reports, `xtend-node-warnings-*.jsonl` |
| N26-04 | P0 | implemented; CI run pending | N26-02, N26-03 | Cross-OS-Native-Smokes und Electron-Catfood mit realer Sharp-/ONNX-Ausführung | `xtend-node-native-smoke-*`, `products/xtend-llm/.xtend-llm-results/*` |
| N26-05 | P0 | date-gated | N26-01 bis N26-04 | koordinierter Node-26-LTS-Cutover als Breaking Release | 14-Tage-Ledger, Release-Entscheid, Migration Guide |
| N26-06 | P1 | deferred | N26-03 | Vite ausschließlich als Dev-/HMR-Provider neu bewerten | `development/XMS-13-Vite-Dev-HMR-Spike.md` |

`implemented; CI run pending` bedeutet: Der ausführbare Gate-Pfad ist im Repository vorhanden, eine Freigabe darf aber erst erfolgen, nachdem GitHub ihn unter der angegebenen realen Runtime ausgeführt und die Artefakte gespeichert hat. Eine statische Workflow-Prüfung zählt nicht als Laufzeitevidenz.

## N26-00 – Supportvertrag und ADR

Der Ausgangszustand hatte zwei unterschiedliche Wahrheiten: CI verwendete eine bewegliche Node-26-Linie, während veröffentlichte Manifeste und Guides Node 18 versprachen. Zugleich lagen Vite 7 und Electron bereits oberhalb der alten Floor. N26-00 friert daher folgende Regeln ein:

1. Node 18 und Node 20 werden nicht mehr unterstützt und nicht als ungetesteter Fallback angeboten.
2. Node 24 ist in Stage A die kleinste unterstützte Runtime; Node 26 liefert verpflichtende vorlaufende Compatibility-Evidence.
3. Publish läuft bis zum LTS-Cutover ausschließlich unter Node 24.
4. Supportclaims ändern sich nur atomar mit Manifesten, Locks, Generatoren, Typen, Tests und Release-Dokumentation.
5. Electron- und VS-Code-Versionen werden separat ausgewiesen; aus ihrer eingebetteten Node-Version folgt keine Host-Supportaussage.

**DoD:** Root-Metadaten enthalten Floor, exakte Lanes, npm-Pin, Scope, Ausnahmen, frühestes Cutover-Datum und Mindestdauer der grünen Evidence.

## N26-01 – Manifeste, Scaffolds und Dokumentation

- Root, veröffentlichte Workspaces und private Workbenches deklarieren `engines.node: ">=24"`; XTend LLM besitzt erstmals denselben expliziten Hostvertrag.
- Root und XTend LLM verwenden `packageManager: "npm@11.17.0"` sowie fehlschlagende `devEngines` für die beiden Contributor-Linien.
- `.nvmrc` pinnt den Stage-A-Default `24.18.0`; `@types/node` bleibt auf Major 24.
- Provider-neutrale RMT- und XTM-Templates erzeugen Engine und Package-Manager ohne Nacharbeit.
- `COMPATIBILITY.node`, Node-SSR-Metadaten, Assertions sowie aktive DE-/EN-Guides spiegeln denselben Vertrag. Historische Roadmaps bleiben als Historie erhalten.

**DoD:** `node-runtime-policy` findet in allen normativen Quellen keinen Node-18-Supportclaim; die Root-Records beider Lockfiles stimmen mit den Manifesten überein; beide Scaffold-Suites prüfen den generierten Vertrag.

## N26-02 – Reproduzierbare CI-Matrix

- PR-, Full-Release-, Pack-, Conditional-Network- und Nightly-Jobs laufen blockierend unter exakt `24.18.0` und `26.5.0`; Publish bleibt auf `24.18.0`.
- Jede Lane installiert exakt npm `11.17.0` aus `${{ runner.temp }}`, damit ein bereits strikter Repository-`devEngines`-Vertrag den Bootstrap nicht blockiert; anschließend verwendet sie `npm ci` und erzeugt vor Projektkommandos fail-closed Runtime-Evidence für Node, npm, V8, OpenSSL, Module-ABI und Node-API.
- Checkout, Setup-Node und Artifact-Upload sind auf unveränderliche Commit-SHAs des v7-Vertrags gepinnt. Die eingebettete Action-Runtime ist kein Projekt-Node-Supportclaim.
- Artefaktnamen tragen `node-24-18-0` oder `node-26-5-0`; Node-26-Evidence überschreibt keine Node-24-Evidence.

**DoD:** Falsche oder unbekannte Lanes brechen vor dem Build ab; alle Uploads enthalten die Runtime-Evidence; Audit/SBOM verwenden keinen npm-10-Seitenpfad; Publish hängt von Full Release, Pack, Conditional Network und Native Smoke ab.

## N26-03 – Toolchain- und Runtime-Härtung

- `scripts/smoke_node_native_toolchain.mjs` führt einen vollständigen TypeScript-Programmbuild, Rollup-Bundle, Terser-Minifizierung, Esbuild-/Vite-Transformation und Lightning-CSS-Native-Transformation aus.
- Die regulären Matrix-Gates decken Maraca-Browser-/Servergraphen, Node-SSR, Package-Dry-Runs sowie ESM-/CJS-Consumer-Imports ab.
- AppServices-Fixtures prüfen Abort vor Headers, Abort während NDJSON, bytefragmentierte Frames, Disconnect während Backpressure, verspätete Frames, Terminal-Deduplizierung, Timeout und Dispose ohne Assertions auf instabile Undici-Fehlermeldungen.
- `--trace-warnings --trace-deprecation` ist in CI aktiv. Projektframes setzen den Exit-Status auf Fehler; Drittanbieterframes werden fingerprinted und report-only klassifiziert. Meldungstexte werden nicht in Evidenzartefakte geschrieben.
- Vite bleibt außerhalb des produktiven Rollup-Pfads.

**DoD:** Beide Lanes liefern identische semantische Gate-Ergebnisse; Warnungsreports enthalten keine Secret-Werte; Browser-, PHP-, Wire- und RMT-Verträge bleiben unverändert.

## N26-04 – Native Komponenten und eingebettete Runtimes

Die blockierende Matrix umfasst `ubuntu-24.04` x64, `windows-2025` x64 und `macos-15` arm64, jeweils unter Node 24 und 26. Plattform und Architektur werden vor dem Build fail-closed geprüft.

Der XTend-LLM-Produktgate führt in dieser Reihenfolge aus:

1. fokussierte N26-Vertrags- und Portable-Launcher-Tests,
2. AppServices-/Layout-Catfood,
3. getrennte Host-/Electron-Runtime-Evidence,
4. Sharp Decode/Resize/PNG,
5. eine echte `onnxruntime-node`-`InferenceSession` mit deterministischem, offline im Speicher erzeugtem Identity-ModelProto.

Der portable Node-Launcher entfernt `ELECTRON_RUN_AS_NODE`, bewahrt Argumente, spiegelt Exit-Code und Signale und nutzt nie einen POSIX-only-`env -u`-Pfad. Fehlende oder inkompatible Electron-, Sharp- oder ONNX-Bindings blockieren das Gate. Ein ONNX-Fehler führt zu einem isolierten Transformers-/ONNX-Upgrade und nie zu einem stillen Source-Build.

**DoD:** Sechs grüne Cross-OS-Lanes; reale native Operationen statt reiner Imports; Electron-Major und eingebetteter Node-Major separat belegt; AppServices-/Layout- und ONNX-Evidence im selben Produktgate.

## N26-05 – Node-26-LTS-Cutover und Release

N26-05 ist vor dem 28. Oktober 2026 nicht ausführbar. Danach sind mindestens 14 aufeinanderfolgende grüne Tage, grüne Full-Release-Gates in beiden Lanes sowie grüne Native-Smokes auf allen drei Betriebssystemen erforderlich.

Erst dann werden in einem koordinierten Breaking Release alle Engines und Templates auf `>=26`, Contributor-/Publish-Default auf eine zu diesem Zeitpunkt aktuelle signierte Node-26-LTS-Patchversion und `@types/node` auf 26 gesetzt. Die Node-24-Hostlane wird entfernt; Electrons eingebettete Node-24-Runtime darf als sichtbare Upstream-Ausnahme weiterbestehen. Migration Guide, Changelog und Release Notes nennen den Support-Drop ausdrücklich.

**Rollbackregel:** Bei einem Node-26-Blocker bleibt `>=24` die freigegebene Floor. Node 18 wird nicht wiedereingeführt.

## Abnahme und Evidenzbefehle

```sh
node scripts/run_xtend_tests.js node-runtime-policy xtend-rmt-app-scaffold xtend-material-scaffold xsurface-shard --json
node scripts/run_xtend_tests.js maraca-app-services-runtime --json
npm run test:node-native-toolchain
npm run test:pr:report
npm run test:release:full:report
npm run pack:dry-run
```

Die letzten vier Befehle müssen für die Freigabe aus einem frischen `npm ci` in beiden CI-Lanes stammen. Lokale Läufe unter einer nicht unterstützten Runtime und reine Workflow-Textprüfungen sind Diagnose, keine Freigabeevidenz.
