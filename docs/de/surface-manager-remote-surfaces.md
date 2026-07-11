# SurfaceManager Remote Surfaces

Eine Remote Surface ist ein registrierter Kandidat, kein automatisch ausführbares Modul. Der Host prüft statische Manifest-Fakten und SurfaceManager-Policy, bevor die Runtime Code lädt oder einen Container öffnet.

## Erforderliche Fakten

Ein Record benennt `surfaceId`, Owner, Version, Origin, Entry, Integrity, benötigte Capabilities und einen lokalen Fallback. `remote-origin-allowlist` und `remote-capabilities` am Manager begrenzen den Host. Die Source of Truth für die Browserentscheidung liegt in `components/xsurfacemanager.js`; RMT-Manifeste werden zuvor durch `tools/rmt-language/vnext-remote-security.js` bewertet.

## Policy-Ablauf

`evaluateRemoteSurfacePolicy()` liefert zunächst einen Report ohne Ausführung. `registerRemoteSurface()` registriert nur einen akzeptierten Record. Materialisierung lädt das bekannte Entry, bindet es an einen hosteigenen Container und publiziert `remote-surface-mounted`. Die Remote Surface erhält keine impliziten Router-, Storage- oder Netzwerkfähigkeiten.

Cross-Surface Events passieren `governRemoteSurfaceEvent()`. Owner, Version und Payload müssen zum Vertrag passen. Ein globaler Eventbus oder geteilte Framework-Contexts umgehen diese Grenze und sind nicht unterstützt.

## Degradation und Security

Origin-, Integrity- oder Capability-Fehler führen zu `remote-surface-refused`; ein Fehler nach akzeptierter Registrierung führt zu `remote-surface-degraded`. In beiden Fällen bleibt der lokale Fallback sichtbar und die Diagnose nennt den Grund. Die Runtime rekonstruiert keine Tokens und lädt keine alternative URL aus Remote-Eingaben.

Same-Realm-Ausführung ist keine harte Sicherheitsisolation. Sensible oder nicht vertrauenswürdige Inhalte brauchen eine stärkere Host-Grenze außerhalb dieser Surface Runtime.

## Verwandte Seiten

- [RMT Remote Surfaces](./rmt-vnext-remote-surfaces.md)
- [Surface Registry](./rmt-vnext-surface-registry-enterprise.md)
- [SurfaceManager Runtime](./surface-manager-runtime.md)
