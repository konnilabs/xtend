# XTensions Security, CSP, Supply Chain and Integrity Gates Contract

- Workpackage: `XTN-11`
- Status: `accepted-by-XTN-11`
- Gate Schema: `xtend.xtensions.security-integrity-gate.v1`
- Policy Schema: `xtend.xtensions.security-policy.v1`
- CSP Requirements Schema: `xtend.xtensions.security-csp-requirements.v1`
- Supply Chain Classification Schema: `xtend.xtensions.security-supply-chain-classification.v1`
- Manifest Report Schema: `xtend.xtensions.security-manifest-report.v1`
- Report Schema: `xtend.xtensions.security-report.v1`
- Diagnostic Schema: `xtend.xtensions.security-diagnostic.v1`
- Local Gate: `node scripts/run_xtend_tests.js xtensions-security-integrity-gate --json`

## Ziel

XTN-11 haertet XTensions an der Grenze zwischen Maraca-Artefakt, Runtime-Registry und HostController. Das Gate ist strict by default: Ein Manifest wird erst als ladbar betrachtet, wenn Owner, Version, expliziter Contract, SHA256-Integrity, CSP, Dependency-Klassifikation, erlaubte Capabilities und sichtbarer Runtime-Fallback zusammenpassen.

Der Gate-Lauf fuehrt keinen Framework-Code aus. React, Vue, Three.js, Leaflet, Chart.js und aehnliche Runtimes duerfen in Testdaten nur als Peer-/Optional-Metadaten erscheinen. Sie werden nicht installiert, importiert, vendored oder als XTend-Package-Dependency deklariert.

## Policy

Die Default-Policy ist konservativ:

- `remoteArtifactsAllowed: false`
- `allowCdnForLocalFixtures: false`
- `dynamicImportRequiresIntegrity: true`
- `denyByDefaultCapabilities: true`
- `requireOwner: true`
- `requireVersion: true`
- `requireContract: true`
- `requireIntegrity: true`
- `requireFallback: true`
- `requireCsp: true`

Remote-faehige Artefakte bleiben standardmaessig blockiert. Eine spaetere Remote-Strategie braucht eine explizite E16-/Enterprise-Policy und darf nicht durch einzelne XTension-Manifeste implizit aktiviert werden.

## CSP

Jede XTension deklariert ihre CSP-Anforderungen als Daten:

- `scriptSrc` fuer Dynamic Import und optional WASM
- `connectSrc` fuer erlaubte Host-Kommunikation
- `workerSrc` fuer Worker-Grenzen
- `imgSrc` fuer Bilder, Canvas-Texturen und Map Tiles
- `styleSrc` optional fuer Style-Isolation

`*`, `http:`, `https:`, `unsafe-inline`, `unsafe-eval` und nicht begruendete `wasm-unsafe-eval`-Nutzung blockieren das Strict Gate. Lokale Fixtures duerfen kein CDN voraussetzen. `data:` ist nur fuer `imgSrc` als lokaler Fixture-Fall erlaubt.

## Supply Chain

XTN-11 normalisiert Dependencies auf diese Klassifikation:

- `core`
- `peer`
- `optional`
- `dev/test`
- `remote`

Framework-Runtimes muessen `peer` oder `optional` bleiben. `vendored`, `root-runtime`, `bundled`, `policy-blocked`, `packageIncluded` oder paketierte Framework-Artefakte blockieren das Gate. Damit koennen Testkomponenten fuer React/Vue/Three/Leaflet/Chart.js spaeter extern opt-in laufen, ohne dass XTend selbst Framework-Dependencies bekommt.

## Capabilities

Capabilities sind deny-by-default. Erlaubt sind nur Host-orchestrierte, XTend-native Faehigkeiten wie:

- `host.lifecycle.mount`
- `host.lifecycle.update`
- `host.lifecycle.suspend`
- `host.lifecycle.resume`
- `host.lifecycle.unmount`
- `signal.downstream`
- `event.upstream`
- `loading.dynamic-import`
- `fallback.native-placeholder`
- `diagnostics.emit`
- `scheduler.hints`
- `fabric.lane.default`
- `fabric.lane.interactive`
- `fabric.lane.background`
- `fabric.lane.animation`
- `imperative.host-bridge`
- `render.loop.host-fiber`

Breite Faehigkeiten wie globale DOM-Kontrolle, unbeschraenkter Netzwerkzugriff, Eval, Filesystem oder ungepruefte Worker sind keine XTensions-Default-Capabilities.

## Fallback

Ein fehlender Peer, ein blockiertes Artefakt oder eine Policy-Abweichung darf die App Shell nicht verdecken. Jede XTension muss einen sichtbaren Fallback mit Mode und Message deklarieren. Die Runtime kann daraus `native-placeholder`, `host-error-boundary`, `skip` oder andere bereits definierte Fallback-Pfade ableiten.

## Diagnostics

Das Gate erzeugt strukturierte Diagnostics fuer:

- fehlenden Owner
- fehlende Version
- fehlenden Contract
- fehlende oder ungueltige Integrity
- fehlende CSP-Direktiven
- unsichere CSP-Quellen
- nicht erlaubte Remote-/CDN-Quellen
- nicht erlaubte Capabilities
- ungueltige Dependency-Klassifikation
- paketierte Framework-Dependencies
- fehlenden Fallback
- Policy Drift
- echte Framework-Imports in Gate-Quellen

Die Reports sind CI- und DevTools-lesbar und koennen von AI-Agenten ausgewertet werden, ohne Framework-Quellcode zu starten.

## Artefakte

- `tools/xtensions/security-integrity-gate.js`
- `tools/xtensions/security-integrity-gate.d.ts`
- `tests/fixtures/xtensions/security-integrity-gate-valid.json`
- `tests/xtensions/xtensions_security_integrity_gate_suite.js`

## Definition of Done

- Unsichere XTension-Manifeste werden im Strict Gate blockiert.
- Lokale Fixtures brauchen kein CDN und kein Netzwerk.
- Runtime-Fallback ist strukturiert und sichtbar.
- Frameworks bleiben Peer-/Optional-Metadaten und werden nicht zu XTend-Dependencies.
