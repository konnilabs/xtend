# RMT vNext Releasevertrag

Dieser Releasevertrag beschreibt, was als `rmt-vnext-release-ready` akzeptiert ist und welche Grenzen bewusst an Folgearbeiten übergeben wurden. Er ist für Drittentwickler gedacht, die wissen müssen, welche lokalen Gates den Sprachlayer absichern und welche Artefakte sie in Reviews vergleichen können.

## Status und Vertrag

Der stabile Vertrag ist `xtend.rmt.vnext-release-handoff.v1`. Der Report nutzt `xtend.rmt.vnext-release-handoff-report.v1`, die Matrix `xtend.rmt.vnext-release-gate-matrix.v1`. Die Prüfung läuft über `tools/rmt-language/vnext-release.js` sowie `tests/rmt-language/rmt_vnext_release_handoff_suite.js`.

Oeffentliche Anker:

- `docs/de/rmt-vnext-authoring.md`
- `docs/de/rmt-vnext-migration-notes.md`
- `docs/de/rmt-vnext-release-handoff.md`
- `xtendrmt/rmt-vnext-reference-demo.rmt`
- `xtendrmt/rmt-vnext-reference-demo.core.json`

Die Release-Entscheidung lautet: Der vNext-Sprachlayer ist source-ready, dokumentiert und lokal gatebar. Eine produktive Runtime-Freigabe oder ein Public-Package-Publish bleibt einem Folge-Epic mit Runtime-Owner vorbehalten.

## Referenzdemo

Die Referenzdemo `xtendrmt/rmt-vnext-reference-demo.rmt` ist die kleinste vollständige Quelle für den Release-Review. Sie deckt `template`, `surface`, `lane`, `when`, `slot`, `stream`, `trust boundary`, `sanitize html` und `on submit -> action ...` ab. Der erwartete Compiler-Output liegt in `xtendrmt/rmt-vnext-reference-demo.core.json` und muss byte-stabil bleiben, solange keine absichtliche Compiler-Änderung dokumentiert wird.

```rmt
import "./shared/*.rmt"

template xtend.vnext.reference {
  surface root {
    lane critical weight 10 {
      hydrate app-shell
      hydrate hero-panel when route.visible == true
    }
  }
}
```

Wenn dieses Beispiel driftet, prüfe zuerst den Compiler und die Source Maps. Danach werden Golden Output, Authoring Guide und Releasevertrag gemeinsam aktualisiert.

## Required gate matrix

Die lokale Release-Matrix ist netzwerkfrei und deckt Sprachlayer, Core Output, Kompatibilität und Referenzen ab:

```bash
npm run test:rmt-vnext-parser
npm run test:rmt-semantic-graph
npm run test:rmt-vnext-compiler
npm run test:rmt-vnext-lifecycle
npm run test:rmt-vnext-scheduler
npm run test:rmt-vnext-surfaces
npm run test:rmt-vnext-conditions
npm run test:rmt-vnext-composition
npm run test:rmt-vnext-imports
npm run test:rmt-vnext-events
npm run test:rmt-vnext-security
npm run test:rmt-vnext-streaming
npm run test:rmt-vnext-tooling
npm run test:rmt-vnext-compatibility
npm run test:rmt-vnext-primitives:report
npm run test:rmt-vnext-regression
npm run test:browser
npm run test:references
```

Der kürzeste zusammenfassende Befehl für diesen Releasevertrag ist:

```bash
node scripts/run_xtend_tests.js rmt-vnext-release --json
```

## Optionale Browser-Evidence

Die Source-to-Sea Gates sind optional, weil sie Browser- und Driver-Umgebung brauchen. Sie liefern trotzdem wertvolle Evidenz, wenn ein Release-Kandidat die komplette Strecke von `.rmt` Quelle bis Browser-Probe zeigen soll.

```bash
npm run test:rmt-vnext-source-to-sea
npm run test:rmt-vnext-source-to-sea:evidence
npm run test:rmt-vnext-source-to-sea:chromedriver
npm run test:rmt-vnext-source-to-sea:firefox
npm run test:rmt-vnext-source-to-sea:validate-artifact
```

Ein fehlender optionaler Browserlauf blockiert den Sprachlayer nicht. Ein fehlschlagender optionaler Lauf sollte aber vor einem produktiven Runtime-Adapter-Epic triagiert werden.

## Accepted Residuals

Diese Restpunkte sind akzeptiert und bewusst außerhalb der Sprachlayer-Abschlussentscheidung:

- `rmt-vnext-runtime-adapters`: vNext Core an produktive Runtime Adapter anbinden.
- `rmt-vnext-formatter-writer`: Format-preserving Edits, Writer API und LSP-Formatierung produktisieren.
- `rmt-vnext-project-index`: Workspace-Index, Rename und References über mehrere Dateien.
- `rmt-vnext-editor-distribution`: VS Code, JetBrains, Neovim und Helix Packages ausliefern.

Sie sind keine versteckten Defekte im Releasevertrag. Sie markieren die Grenze zwischen fertigem Sprachvertrag und noch nicht freigegebener Produktivruntime.

## Minimaler Pruefpfad

Für Änderungen an diesem Dokument oder an der Release-Matrix genügt:

```bash
node scripts/run_xtend_tests.js rmt-vnext-release --json
npm run test:rmt-vnext-primitives:report
```

Wenn die Änderung auch globale Navigation oder das Developer Center berührt, führe zusätzlich `npm run test:pr:report` aus. Damit werden Docs-Linkqualität, Referenzpfade, Architekturanker und Maraca-Docs gemeinsam geprüft.

## Spezifische Fehlerbilder

- Wenn `rmt-vnext-release` ein fehlendes Dokument meldet, pruefe `docs/menu.json` und beide Locale-Dateien.
- Wenn die Referenzdemo kompiliert, aber der Core Output driftet, vergleiche `tools/rmt-language/vnext-compiler.js` mit dem Golden Output.
- Wenn ein Gate in der Matrix fehlt, aktualisiere `tools/rmt-language/vnext-release.js`, `package.json` und diesen Releasevertrag zusammen.
- Wenn Runtime-Adapter-Fragen auftauchen, gehören sie in `rmt-vnext-runtime-adapters`, nicht in die Sprachlayer-Abschlussentscheidung.
