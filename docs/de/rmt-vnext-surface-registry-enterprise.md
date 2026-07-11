# RMT vNext Enterprise Surface Registry

Die Enterprise Surface Registry beschreibt, welche lokalen und remote Surfaces ein Host finden darf, ohne daraus einen Runtime-Manager zu machen. Sie ist ein Discovery- und Audit-Artefakt für Micro-Frontend-Shells: Owner, Shell Target, Fallback, Version, Integrity und Governance werden hier zusammengeführt.

## Oeffentlicher Vertrag

Das stabile Schema ist `xtend.rmt.vnext-enterprise-surface-registry.v1`. Im RMT-Dokument erscheint die Registry als `surface.registry`. Drittentwickler können sich darauf verlassen, dass die Registry nach Owner und Shell Target indexierbar ist; die konkreten Indizes heissen `byOwner` und `byShellTarget`.

Nicht Teil des Vertrags ist die Ausführung eines Remote Bundles. Die Registry sagt, welche Surface als Kandidat bekannt ist. Laden, Netzwerk, Cache, Sandbox und Rollout bleiben Host-Adapter-Entscheidungen.

## Registry Records

```rmt
surface.registry commerce.enterprise {
  surface checkout.cart owner commerce.checkout shellTarget "checkout"
  surface commerce.summary owner commerce shellTarget "summary"
}
```

Ein Record muss mindestens die Surface-ID, den Owner und das Shell Target sichtbar machen. Für Remote-Surfaces kommen Version, Integrity und Fallback aus dem Remote Manifest hinzu. Für lokale Surfaces reicht die Zuordnung zur Shell, solange das Core-Dokument die Surface selbst beschreibt.

## Enterprise Readiness

Der Zielzustand für diesen Pfad ist `rmt-vnext-enterprise-mfe-ready`. Er bedeutet:

- Remote Surface Manifest und Enterprise Registry sind lokal prüfbar.
- Degradation und Remote Security sind als Policies im Core sichtbar.
- Cross-Surface Events haben explizite Owner, Versionen und Payload Contracts.
- Der Browser-Smoke bleibt offline und führt keine Remote Runtime im Kernel aus.

Die dazugehörigen Dateien sind:

- `xtendrmt/rmt-vnext-enterprise-mfe-demo.rmt`
- `xtendrmt/rmt-vnext-enterprise-mfe-demo.core.json`
- `tests/browser/fixtures/rmt-vnext-enterprise-mfe-smoke.html`
- `tests/rmt-language/fixtures/vnext-enterprise-mfe-fixture-matrix.json`

## Indizes für Hosts

`byOwner` beantwortet die Frage, welche Surfaces zu einem verantwortlichen Team oder Package gehören. `byShellTarget` beantwortet, welche Surfaces in einen Shell-Bereich eingesetzt werden dürfen. Beide Indizes müssen deterministisch bleiben, weil Reviews und Tooling sonst nicht erkennen, ob eine Surface nur verschoben oder fachlich geändert wurde.

Ein Host kann die Registry lesen, um eine Route oder einen Slot vorzubereiten. Er darf daraus aber keine implizite globale Surface-Verwaltung bauen. Wenn mehrere Remote Surfaces denselben Shell Target beanspruchen, muss die Degradation-Policy entscheiden, welche Fallbacks aktiv werden.

## Minimaler Prüfpfad

```bash
node scripts/run_xtend_tests.js rmt-vnext-enterprise-registry --json
node scripts/run_xtend_tests.js rmt-vnext-enterprise-fixtures rmt-vnext-enterprise-release --json
```

Wenn der erste Befehl scheitert, ist die Registry selbst unvollständig. Wenn der zweite Befehl scheitert, passen Registry, Fixture, Core Output oder Browser-Smoke nicht mehr zusammen.

## Spezifische Fehlerbilder

- Fehlender `byOwner` Index: Owner-Zuordnung im `surface.registry` Record prüfen.
- Fehlender `byShellTarget` Index: Shell Target im Surface-Record ergänzen.
- Doppelte Surface-ID: Registry und Core-Dokument müssen dieselbe ID-Auflösung verwenden.
- Drift im Core Output: `xtendrmt/rmt-vnext-enterprise-mfe-demo.core.json` nur zusammen mit der Quelle und dem Releasevertrag aktualisieren.

## Weiterführend

Der Remote-Surface-Leitfaden wendet Ownership, Integrity, Fallback und Capabilities aus der Registry zur Laufzeit an. [Verwandter Artikel](./rmt-vnext-remote-surfaces.md)
