# RMT Remote Surfaces

Remote UI-Bereiche sicher beschreiben, laden und degradieren.

## Worum es geht

Remote Surfaces sind registrierte UI-Kandidaten mit Owner, Version, Origin, Integrity, Capabilities und Fallback. Die Registry beschreibt sie; erst der Host entscheidet nach Policy, ob ein Modul geladen wird.

## Öffentliche Bausteine

- `tools/rmt-language/vnext-remote-manifest.js` liest statische Manifest-Fakten.
- `tools/rmt-language/vnext-remote-security.js` bewertet Trust und Capabilities.
- `tools/rmt-language/vnext-remote-compiler.js` erzeugt hostneutrale Core-Records.

## Empfohlener Ablauf

Registriere zuerst einen lokalen Fallback. Validiere dann Origin, Version und Integrity, erteile nur benötigte Capabilities und lade das Remote-Modul erst nach einem positiven Policy-Report.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT vNext Enterprise Surface Registry](./rmt-vnext-surface-registry-enterprise.md)
- [RMT vNext Enterprise MFE Vertrag](./rmt-vnext-remote-surfaces.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)

## Remote Surface Vertrag

Eine Remote Surface ist ein deklarierter Bereich, nicht die Ausführung fremder Runtime im Kernel. Das Schema `xtend.rmt.vnext-remote-surface.v1` beschreibt die Surface selbst; `xtend.rmt.vnext-remote-surface-manifest.v1` beschreibt Version, Integrity, Fallback und Owner. Sicherheitsentscheidungen laufen über `xtend.rmt.vnext-remote-security-policy.v1`; Compiler-Normalisierung und Tooling verwenden `xtend.rmt.vnext-remote-compiler.v1`.

```rmt
remote surface checkout.cart from remote {
  owner commerce.checkout
  version "1.0.0"
  shellTarget "checkout"
  fallback surface checkout.cart.fallback
}
```

Der wichtigste Boundary-Satz lautet `no-remote-runtime-execution-in-rmt-kernel`. Der Kernel sieht Records, Policies, Schedules und Diagnostics; das Laden, Cachen oder Ausführen produktiver Remote-Bundles bleibt Host-Adapter-Logik.

## Architekturschichten

Remote-Surface-Architektur verwendet explizite Schichten, damit Hosts den passenden Orchestrierungspfad wählen können:

1. **XScaler Preflight** ist das statische Gate. Es akzeptiert oder verwirft den Surface-Plan anhand von Manifest-, Policy-, Integrity-, Fallback- und Host-Capability-Fakten, bevor Remote-Code läuft.
2. **XScaler ATC** startet erst nach akzeptierter Preflight-Response. ATC besitzt die Flight-Session, Client/Server-Kommunikation, die Übergabe in die Host-Runtime und Lifecycle-Orchestrierung wie Attach, Detach, Cancel, Fallback und Diagnostics.
3. **Maraca Runtime** läuft im Client. Sie nimmt den übergebenen Stream an, verarbeitet Runtime Records, führt deklarierte Actions aus, routet Events und materialisiert Surfaces über sichere DOM-Descriptor- oder Component-Renderer.
4. **XSurface Shard Server Layer** ist die serverseitige Remote-Surface-Orchestrierungsschicht. Sie kann Remote Surfaces nach Shards partitionieren, serverseitigen Lifecycle-State koordinieren, Stream-Fragmente veröffentlichen und ATC-kompatible Übergabesignale bereitstellen.
5. **Generische Server-Endpunkte** sind der Fallback-Pfad, wenn kein XSurface Shard Server und keine Remote Surface Orchestration verfügbar sind. Sie stellen normale Daten-, Action- oder SSR-Endpunkte bereit; der Client konsumiert sie als generische Ressourcen statt als orchestrierte Remote Surfaces.
6. **RMT Kernel/Fabric** wertet Policies aus, erzeugt Schedules, weist Lanes zu und emittiert Diagnostics. Es beobachtet Records und Orchestrierungssignale, aber die Invariante bleibt `no-remote-runtime-execution-in-rmt-kernel`: Private Remote-Ausführung gehört zu Host-Adaptern, Shard Servern oder generischen Endpunkten, niemals in den Kernel.

## Enterprise Fixture

Die prüfbare Enterprise-Strecke liegt in `demos/xtendrmt/fixtures/enterprise-mfe/source.rmt`. Dieses Fixture kombiniert lokale Surfaces, eine Remote Surface, Degradation, Remote Security und Cross-Surface Events. Der Core-Output `demos/xtendrmt/fixtures/enterprise-mfe/generated/core.json` ist das Golden-Artefakt für Reviews; der Browser-Smoke `tests/browser/fixtures/rmt-vnext-enterprise-mfe-smoke.html` bleibt offline und darf weder `fetch(` noch dynamische Imports brauchen.

Führe diese Gates aus, wenn Remote-Surface-Records oder Manifest-Regeln geändert werden:

```bash
node scripts/run_xtend_tests.js rmt-vnext-remote-manifest rmt-vnext-remote-security rmt-vnext-enterprise-fixtures --json
node scripts/run_xtend_tests.js rmt-vnext-enterprise-release --json
```

Ein grünes Ergebnis bestätigt, dass Remote-Surface-Records, Manifest-Schema, Sicherheitsregeln und Enterprise-Smoke-Artefakte zusammenpassen.
