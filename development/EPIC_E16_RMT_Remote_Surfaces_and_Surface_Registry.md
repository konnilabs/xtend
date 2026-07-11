# XTend Epic 16 - RMT vNext Remote Surfaces, Surface Registry und Enterprise Degradation

- Status: `completed / Epic 16 Enterprise MFE Release Handoff accepted`
- Datum: 13. Mai 2026
- Typ: Epic / Enterprise-MFE-Contract und Implementierungsplan
- Contract: `xtend.rmt.vnext-remote-surfaces.v1`
- WP-E16-01 Contract: `xtend.epic16.wp01.remote-surfaces-threat-model.v1`
- WP-E16-02 Contract: `xtend.epic16.wp02.remote-surface-manifest-core.v1`
- WP-E16-03 Contract: `xtend.epic16.wp03.enterprise-surface-registry.v1`
- WP-E16-04 Contract: `xtend.epic16.wp04.degradation-policy.v1`
- WP-E16-05 Contract: `xtend.epic16.wp05.remote-security-policy.v1`
- WP-E16-06 Contract: `xtend.epic16.wp06.cross-surface-event-protocol.v1`
- WP-E16-07 Contract: `xtend.epic16.wp07.event-governance.v1`
- WP-E16-08 Contract: `xtend.epic16.wp08.remote-compiler-core.v1`
- WP-E16-09 Contract: `xtend.epic16.wp09.remote-tooling.v1`
- WP-E16-10 Contract: `xtend.epic16.wp10.remote-surface-migration.v1`
- WP-E16-11 Contract: `xtend.epic16.wp11.enterprise-mfe-fixtures.v1`
- WP-E16-12 Contract: `xtend.epic16.wp12.enterprise-mfe-release-handoff.v1`
- Threat Model Contract: `xtend.rmt.vnext-remote-surfaces-threat-model.v1`
- Remote Surface Manifest Contract: `xtend.rmt.vnext-remote-surface-manifest.v1`
- Remote Surface Contract: `xtend.rmt.vnext-remote-surface.v1`
- Enterprise Surface Registry Contract: `xtend.rmt.vnext-enterprise-surface-registry.v1`
- Cross Surface Event Protocol: `xtend.rmt.vnext-cross-surface-event-protocol.v1`
- Event Governance Contract: `xtend.rmt.vnext-event-governance-policy.v1`
- Remote Compiler Contract: `xtend.rmt.vnext-remote-compiler.v1`
- Remote Tooling Contract: `xtend.rmt.vnext-remote-tooling.v1`
- Remote Migration Contract: `xtend.rmt.vnext-remote-surface-migration.v1`
- Enterprise Fixture Contract: `xtend.rmt.vnext-enterprise-fixture.v1`
- Enterprise Release Handoff Contract: `xtend.rmt.vnext-enterprise-release-handoff.v1`
- Degradation Contract: `xtend.rmt.vnext-degradation-policy.v1`
- Remote Security Contract: `xtend.rmt.vnext-remote-security-policy.v1`
- Depends on:
  - `xtend.rmt.vnext-release-handoff.v1`
  - `xtend.rmt.vnext-surface-registry.v1`
  - `xtend.rmt.vnext-event-action-contract.v1`
  - `xtend.rmt.vnext-security-policy-contract.v1`
  - `xtend.rmt.vnext-compatibility-matrix.v1`
- Zielreife: `rmt-vnext-enterprise-mfe-ready`
- Boundary: `no-remote-runtime-execution-in-rmt-kernel`
- Boundary: `no-implicit-global-event-bus`
- Boundary: `remote-surfaces-require-explicit-owner-version-integrity-and-fallback`
- Primaerer Dateityp: `.rmt`
- Compiler-Ziel: JSON-kompatible vNext Core-Erweiterungen fuer Remote Surface, Registry, Event Protocol und Degradation Records
- Bezug:
  - `development/EPIC_E15_RMT_vNext_Syntax.md`
  - `development/XTendRMT-vNext-Release-Handoff-Contract.md`
  - `development/XTendRMT-vNext-Remote-Surfaces-Threat-Model-Contract.md`
  - `development/XTendRMT-vNext-Remote-Surface-Manifest-Contract.md`
  - `development/XTendRMT-vNext-Enterprise-Surface-Registry-Contract.md`
  - `development/XTendRMT-vNext-Degradation-Policy-Contract.md`
  - `development/XTendRMT-vNext-Remote-Security-Policy-Contract.md`
  - `development/XTendRMT-vNext-Cross-Surface-Event-Protocol-Contract.md`
  - `development/XTendRMT-vNext-Event-Governance-Contract.md`
  - `development/XTendRMT-vNext-Remote-Compiler-Core-Contract.md`
  - `development/XTendRMT-vNext-Remote-Tooling-Contract.md`
  - `development/XTendRMT-vNext-Remote-Surface-Migration-Contract.md`
  - `development/XTendRMT-vNext-Enterprise-MFE-Fixtures-Contract.md`
  - `development/XTendRMT-vNext-Enterprise-MFE-Release-Handoff-Contract.md`
  - `development/XTendRMT-vNext-Surface-Registry-Contract.md`
  - `development/XTendRMT-vNext-Event-Action-DataSource-Contract.md`
  - `development/XTendRMT-vNext-Security-Policy-Contract.md`
  - `development/XTendRMT-vNext-Compatibility-Migration-Contract.md`
  - `development/XTend-SurfaceManager-Contract-und-RMT-Authoring-Model.md`
  - `development/XTend-SurfaceManager-Native-RMT-Surfaces-Domain-Contract.md`
  - `development/WP-E16-01-Epic-Identity-Threat-Model-und-Source-of-Truth-einfrieren.md`
  - `development/WP-E16-02-Remote-Surface-Manifest-und-Core-Contract-definieren.md`
  - `development/WP-E16-03-Enterprise-surface-registry-fuer-Ownership-und-Discoverability-ausbauen.md`
  - `development/WP-E16-04-Versionierung-Compatibility-und-Graceful-Degradation-modellieren.md`
  - `development/WP-E16-05-Remote-Trust-Boundaries-Manifest-Integrity-und-Sandbox-Policies-haerten.md`
  - `development/WP-E16-06-Cross-Surface-Event-Protocol-fuer-Lane-und-Shell-Scopes-definieren.md`
  - `development/WP-E16-07-Event-Ownership-Delivery-Policy-und-Governance-Diagnostics-bauen.md`
  - `development/WP-E16-08-Parser-Compiler-und-Core-Erweiterungen-fuer-Remote-Surfaces-integrieren.md`
  - `development/WP-E16-09-Tooling-LSP-Snippets-und-Agent-Reports-fuer-Enterprise-MFE-erweitern.md`
  - `development/WP-E16-10-Compatibility-Migration-und-Legacy-Surface-Roundtrip-absichern.md`
  - `development/WP-E16-11-Enterprise-Fixture-Remote-Reference-Demo-und-Browser-Smoke-Probe-bauen.md`
  - `development/WP-E16-12-Docs-Release-Gates-und-Enterprise-MFE-Handoff-finalisieren.md`
  - `docs/rmt-vnext-authoring.md`
  - `development/docs-evidence/legacy-routes/en/rmt-vnext-release-handoff.md`
  - `docs/rmt-vnext-remote-surfaces.md`
  - `docs/rmt-vnext-surface-registry-enterprise.md`
  - `docs/rmt-vnext-cross-surface-events.md`
  - `development/docs-evidence/legacy-routes/en/rmt-vnext-enterprise-mfe-handoff.md`
  - `xtendrmt/rmt-vnext-reference-demo.rmt`
  - `xtendrmt/rmt-vnext-enterprise-mfe-demo.rmt`
  - `xtendrmt/rmt-vnext-enterprise-mfe-demo.core.json`
  - `tests/browser/fixtures/rmt-vnext-enterprise-mfe-smoke.html`

## Status

Epic 16 ist abgeschlossen. `WP-E16-12` hat Docs, Release Gate Matrix und Enterprise-MFE-Handoff akzeptiert. Remote Surface Authoring, Enterprise `surface.registry`, Cross Surface Events, Versionierung, Degradation, Remote Security, Migration, Demo, Core Output und Browser-Smoke sind dokumentiert und ueber `node scripts/run_xtend_tests.js rmt-vnext-enterprise-release --json` gatebar.

Naechste startbare Pakete:

- Keine E16-Pakete offen.

# Vision

RMT vNext soll Remote Surfaces, Cross Surface Events und Surface Discoverability so ausdruecken, dass Micro-Frontend-Organisationen produktiv arbeiten koennen, ohne die Stabilitaets- und Sicherheitsansprueche des XTend-Oekosystems zu unterlaufen.

Das Epic erweitert RMT nicht zu einem freien Remote-Code-Loader. RMT bleibt deklarativ und host-neutral. Remote Surfaces werden als auditierbare Contracts beschrieben:

- welches Team besitzt die Surface
- welche Version und welche Remote-Manifest-Quelle ist erlaubt
- welche Shell Targets und Lanes werden angebunden
- welche Events duerfen ein- und ausgehen
- welche Payload Shapes und Owners gelten
- welche Trust Boundary, Integrity und Sandbox Policy sind erforderlich
- welcher Fallback greift bei Inkompatibilitaet, Ladefehler oder Policy-Verletzung

Der Runtime Host darf daraus konkrete Lade-, Mount-, Rollback- und Isolation-Entscheidungen ableiten. Der RMT-Kernel fuehrt keine Remote Runtime aus.

---

# Scope Freeze

## In Scope

- Remote Surface Authoring-Contract fuer produktive MFE-Szenarien
- Remote Manifest Records mit Version Range, Integrity, Origin, Capability und Adapter Boundary
- Enterprise Surface Registry Snapshot fuer Ownership, Discoverability, aktive Versionen, Shell Targets, Lanes, Events und Fallbacks
- Cross Surface Event Protocol mit typisierten Events, klarer Ownership, Richtung und Shell-/Lane-Scope
- Versionierungs- und Graceful-Degradation-Modell als verpflichtendes Qualitaetsmerkmal
- Security Policies fuer Remote Surface Trust Boundaries, Manifest Integrity, CSP, Sandbox und Capability Deny-by-Default
- vNext Core-Erweiterungen fuer Remote Surface, Registry, Events und Degradation Records
- Tooling Diagnostics, LSP-/Snippet-Erweiterungen und AI-Agent-Reports
- Fixture Matrix, Golden Tests, Browser-Smoke-Probe und Reference Demo
- Authoring Guide, Migration Notes und Release Handoff fuer Enterprise-MFE-Adoption

## Out of Scope

- direkte Module-Federation-, ESM- oder Script-Ausfuehrung im RMT-Kernel
- ein impliziter globaler Event Bus ohne Owner, Payload Shape und Richtung
- Event-Wildcards fuer produktive Cross Surface Events
- unsignierte oder nicht integritaetsgepruefte Remote Surface Manifeste
- Remote Surfaces ohne Fallback oder Degradation Policy
- SurfaceManager-spezifische Runtime-Kopplung im Sprachkern
- Host-spezifische React-, Vue-, DOM- oder Browser-Sonderlogik in `tools/rmt-language/`
- automatische Migration bestehender Surface-Dokumente ohne expliziten Preview-/Report-Modus

## Security Baseline

Remote Surfaces sind per Default nicht vertrauenswuerdig.

Eine produktive Remote Surface ist nur gueltig, wenn folgende Fakten explizit oder ueber einen validierten Catalog ableitbar sind:

- `owner`
- `version`
- `remote`
- `origin`
- `integrity`
- `trust boundary`
- `allowed capabilities`
- `shell targets`
- `event emits/consumes`
- `payload schemas`
- `fallback`
- `degradation policy`

Fehlende Fakten erzeugen Hard Errors im strikten Gate. Hosts duerfen unsichere oder unvollstaendige Remote Surface Records nicht still laden.

---

# Vorgeschlagene Authoring-Richtung

Die finale Grammatik wird in den E16-Workpackages stabilisiert. Dieses Beispiel zeigt die Zielsemantik:

```rmt
remote surface checkout.cart from remote "@xtend/checkout-cart" {
  owner team "checkout-platform"
  version "^2.4"
  origin "https://cdn.xtend.example"
  integrity sha256 "sha256-REPLACE_WITH_MANIFEST_DIGEST"

  trust boundary "xtend.security.remote-surface.v1"
  fallback surface checkout.cart.fallback

  exposes lane critical -> shell.slot "sidebar.cart"
  exposes lane idle -> shell.slot "background.prefetch"

  emits checkout.cart.updated.v1 {
    owner "checkout-platform"
    direction outbound
    lane critical
    payload "xtend.schemas.cartUpdated.v1"
  }

  consumes user.session.changed.v1 {
    owner "identity-platform"
    direction inbound
    from shell.session
    lane critical
    payload "xtend.schemas.sessionChanged.v1"
  }
}
```

## Core-Zielbild

Der Compiler soll daraus host-neutrale Core Records erzeugen:

```json
{
  "schema": "xtend.rmt.vnext-remote-surface.v1",
  "surfaceId": "remoteSurface:checkout.cart",
  "name": "checkout.cart",
  "owner": {
    "kind": "team",
    "id": "checkout-platform"
  },
  "remote": {
    "id": "@xtend/checkout-cart",
    "origin": "https://cdn.xtend.example",
    "versionRange": "^2.4",
    "integrity": {
      "algorithm": "sha256",
      "digest": "sha256-REPLACE_WITH_MANIFEST_DIGEST"
    }
  },
  "security": {
    "trustBoundary": "xtend.security.remote-surface.v1",
    "sandboxRequired": true,
    "capabilityMode": "deny-by-default"
  },
  "shellBindings": [
    {
      "lane": "critical",
      "target": "shell.slot:sidebar.cart"
    }
  ],
  "fallback": {
    "kind": "surface",
    "ref": "checkout.cart.fallback"
  },
  "status": "ready",
  "diagnostics": []
}
```

---

# Architekturziel

## 1. Remote Surface Manifest

Remote Surfaces werden ueber ein Manifest beschrieben, nicht ueber freie Runtime-Imports. Ein Manifest beschreibt Version, Integrity, Origins, Exposes, Events, Capabilities, Security und Degradation.

Der Manifest-Contract ist maschinenlesbar und kann aus Package-Metadaten, einem Remote Catalog oder einer signierten Registry stammen. RMT verweist darauf deklarativ.

## 2. Enterprise Surface Registry

`surface.registry` wird von einem lokalen Surface-Typ-Snapshot zu einem Enterprise-Snapshot erweitert.

Der Snapshot beantwortet:

- welche Surfaces existieren
- welche davon remote sind
- welches Team sie besitzt
- welche Version aktiv ist
- welche Version erwartet wird
- welche Shell Targets und Lanes betroffen sind
- welche Events sie senden und konsumieren
- welche Data Sources und Capabilities genutzt werden
- welcher Fallback fuer jede Surface existiert
- ob die Surface `full`, `compatible`, `degraded` oder `blocked` ist

## 3. Cross Surface Event Protocol

Cross Surface Events sind kein globaler Bus. Sie sind Registry-Records mit Richtung, Owner, Payload Shape und Scope.

Pflichtfelder:

- Event ID, z. B. `checkout.cart.updated.v1`
- Owner Team
- Richtung: `inbound`, `outbound`, `shell`
- Source Scope: Surface, Lane oder Shell Target
- Target Scope: Surface, Lane oder Shell Target
- Payload Schema
- Version
- Delivery Policy
- Sensitivity Classification

## 4. Versionierung und Graceful Degradation

Versionierung und Degradation sind Qualitaetsmerkmale, keine optionalen Features.

Ein Remote Surface Record ist nur produktionsfaehig, wenn er beschreibt:

- welche Shell- und Registry-Version mindestens noetig ist
- welche Capabilities optional oder verpflichtend sind
- wie fehlende Capabilities behandelt werden
- welcher Fallback angezeigt wird
- welche Events bei Degradation weiter erlaubt bleiben
- welche Events geblockt werden
- welche Diagnostics fuer Operatoren und Agenten sichtbar sind

## 5. Runtime Boundary

Der Runtime Host implementiert Laden, Caching, Isolation, Rollback und Telemetrie. RMT definiert nur die Contracts.

Damit bleibt die Architektur kompatibel mit:

- Browser Shell
- Server-driven Shell
- Desktop Shell
- Test Harness
- AI-Agent-Analyse
- zukuenftigen Runtime-Adaptern

---

# Source-of-Truth-Matrix

| Artefaktklasse | Fuehrende Rolle in Epic 16 | Schutzregel |
|----------------|----------------------------|-------------|
| `development/EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry.md` | Epic-Plan, WP-Backlog, Scope, Security Baseline und Handoff | darf Zielbild fuehren, aber keine Implementierungsdetails als einzige Quelle verstecken |
| `development/WP-E16-*.md` | einzelne Workpackage-Contracts und Abnahmen | jedes abgeschlossene WP benennt Gate, Artefakte und Folgepaket |
| `tools/rmt-language/` | gemeinsame Sprachebene fuer Parser-, Compiler-, Registry-, Event-, Degradation- und Diagnostic-Fakten | keine Host-Runtime-Ausfuehrung und keine SurfaceManager-Sonderlogik |
| `tools/rmt-linter/` | CLI-/CI-Adapter fuer Diagnosen und Reports | nutzt `tools/rmt-language/`, fuehrt keine Remote Loads aus |
| `tools/rmt-language-server/` | LSP-Adapter fuer Completion, Hover, Symbols, Definitions und Code Actions | nutzt dieselben Contract-Fakten wie CLI |
| `xtendrmt/` | Reference Demos und Core-Ausgaben | Demos duerfen Remote Contracts zeigen, aber keine echten Netzwerklasten erzwingen |
| `tests/rmt-language/` | Contract-, Parser-, Compiler-, Registry- und Event-Gates | positive und negative Remote-/Event-/Degradation-Fixtures sind Pflicht |
| `tests/browser/fixtures/` | statische Browser-Smoke-Probes | keine produktive Remote Runtime als Testvoraussetzung |
| `docs/` | oeffentliche Authoring-, Migration- und Handoff-Dokumentation | muss Security- und Degradation-Pflichten sichtbar machen |

---

# Prioritaetslogik

- `P0`: schafft Threat Model, Manifest-, Registry- oder Core-Fundament
- `P1`: implementiert Security, Degradation, Event Protocol, Compiler oder Tooling
- `P2`: haertet Migration, Tests, Doku, Demos, Release-Gates und Handoff

## Statuslogik

- `ready`: kann sofort gestartet werden
- `next`: ist fachlich als naechstes sinnvoll, benoetigt aber einen Vorgaenger
- `blocked`: wartet auf benannte Abhaengigkeiten
- `in_progress`: ist in Bearbeitung
- `completed`: Contract, Artefakt und Gate sind akzeptiert

## Naechste startbare Workpackages

- Keine E16-Pakete offen.

---

# Workpackage-Uebersicht

| ID | Prioritaet | Status | Workstream | Titel | Abhaengigkeiten |
|----|------------|--------|------------|-------|-----------------|
| `WP-E16-01` | P0 | completed | WS0 | Epic-Identity, Threat Model und Source-of-Truth einfrieren | `WP-E15-18` |
| `WP-E16-02` | P0 | completed | WS1 | Remote Surface Manifest und Core Contract definieren | `WP-E16-01` |
| `WP-E16-03` | P0 | completed | WS1 | Enterprise surface.registry fuer Ownership und Discoverability ausbauen | `WP-E16-01`, `WP-E16-02`, `WP-E15-08` |
| `WP-E16-04` | P1 | completed | WS2 | Versionierung, Compatibility und Graceful Degradation modellieren | `WP-E16-02`, `WP-E16-03`, `WP-E15-16` |
| `WP-E16-05` | P1 | completed | WS2 | Remote Trust Boundaries, Manifest Integrity und Sandbox Policies haerten | `WP-E16-02`, `WP-E16-04`, `WP-E15-13` |
| `WP-E16-06` | P1 | completed | WS3 | Cross Surface Event Protocol fuer Lane- und Shell-Scopes definieren | `WP-E16-03`, `WP-E15-12` |
| `WP-E16-07` | P1 | completed | WS3 | Event Ownership, Delivery Policy und Governance Diagnostics bauen | `WP-E16-06` |
| `WP-E16-08` | P1 | completed | WS4 | Parser, Compiler und Core-Erweiterungen fuer Remote Surfaces integrieren | `WP-E16-02`, `WP-E16-03`, `WP-E16-04`, `WP-E16-06` |
| `WP-E16-09` | P1 | completed | WS4 | Tooling, LSP, Snippets und Agent Reports fuer Enterprise-MFE erweitern | `WP-E16-08`, `WP-E15-15` |
| `WP-E16-10` | P2 | completed | WS5 | Compatibility, Migration und Legacy Surface Roundtrip absichern | `WP-E16-04`, `WP-E16-08`, `WP-E15-16` |
| `WP-E16-11` | P2 | completed | WS5 | Enterprise Fixture, Remote Reference Demo und Browser-Smoke-Probe bauen | `WP-E16-05`, `WP-E16-07`, `WP-E16-09` |
| `WP-E16-12` | P2 | completed | WS5 | Docs, Release Gates und Enterprise-MFE-Handoff finalisieren | `WP-E16-10`, `WP-E16-11` |

## Workstreams

| Workstream | Zweck |
|------------|-------|
| WS0 | Scope, Threat Model, Source-of-Truth und Epic-Handoff |
| WS1 | Remote Manifest, Surface Registry und Discoverability |
| WS2 | Versionierung, Degradation, Security und Integrity |
| WS3 | Cross Surface Events, Ownership und Delivery Governance |
| WS4 | Parser, Compiler, Core, Diagnostics und Tooling |
| WS5 | Compatibility, Demos, Browser-Probes, Dokumentation und Release-Gates |

---

# Workpackages im Detail

### WP-E16-01 - Epic-Identity, Threat Model und Source-of-Truth einfrieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - Epic 16 als Enterprise-MFE-Epic stabilisieren und die Sicherheitsgrenzen fuer Remote Surfaces, Cross Surface Events und Degradation festlegen
- Scope:
  - Contract-Name `xtend.rmt.vnext-remote-surfaces.v1`
  - Threat Model fuer Remote Manifest, Remote Surface, Event Protocol und Registry Snapshot
  - Source-of-Truth-Matrix fuer Language Layer, Registry, Tests, Docs und Runtime-Adapter-Grenze
  - klare Abgrenzung zu SurfaceManager- und Host-Runtime-Implementierungen
- Zielartefakte:
  - Workpackage-Dokument `development/WP-E16-01-Epic-Identity-Threat-Model-und-Source-of-Truth-einfrieren.md`
  - Threat Model Contract `development/XTendRMT-vNext-Remote-Surfaces-Threat-Model-Contract.md`
  - aktualisierter Epic-Header mit akzeptierter Scope-Entscheidung
- Ergebnis:
  - Epic 16 ist als Enterprise-MFE-Epic aktiv
  - Threat Model Contract `xtend.rmt.vnext-remote-surfaces-threat-model.v1` ist akzeptiert
  - Kernel-Boundary `no-remote-runtime-execution-in-rmt-kernel` ist verbindlich
  - Cross-Surface-Boundary `no-implicit-global-event-bus` ist verbindlich
  - Remote Surfaces benoetigen Owner, Version, Integrity und Fallback
  - `WP-E16-02` ist startbar
- Gate:
  - Dokumentationsreview gegen E15 Release Handoff, Security Policy und Surface Registry Contract
- Definition of Done:
  - Remote-Ausfuehrung im RMT-Kernel ist explizit ausgeschlossen
  - Deny-by-default, Integrity, Owner, Version und Fallback sind als Pflichtprinzipien festgelegt
  - `WP-E16-02` ist startbar; `WP-E16-03` ist fachlich vorbereitet und wartet auf den Manifest-Contract

### WP-E16-02 - Remote Surface Manifest und Core Contract definieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - Remote Surface Manifeste als deklarative, auditierbare Contract Records spezifizieren
- Scope:
  - Manifest Schema `xtend.rmt.vnext-remote-surface-manifest.v1`
  - Remote Surface Core Record `xtend.rmt.vnext-remote-surface.v1`
  - Felder fuer Owner, Remote ID, Origin, Version Range, Integrity, Exposes, Capabilities und Adapter Boundary
  - negative Diagnostics fuer fehlende Owner, Version, Integrity, Origin und Capability-Boundary
- Zielartefakte:
  - Contract-Dokument `development/XTendRMT-vNext-Remote-Surface-Manifest-Contract.md`
  - maschinenlesbarer Adapter in `tools/rmt-language/`
  - positive und negative Fixtures
- Ergebnis:
  - Manifest Contract `xtend.rmt.vnext-remote-surface-manifest.v1` ist akzeptiert
  - Remote Surface Core Record `xtend.rmt.vnext-remote-surface.v1` ist akzeptiert
  - Modul `tools/rmt-language/vnext-remote-manifest.js` normalisiert und validiert Remote Manifeste
  - positive und negative Fixtures liegen unter `tests/rmt-language/fixtures/`
  - Package Export `./rmt-language/vnext-remote-manifest` ist verfuegbar
  - `WP-E16-03` ist startbar
- Gate:
  - `node scripts/run_xtend_tests.js rmt-vnext-remote-manifest --json`
- Definition of Done:
  - Manifest Records sind deterministisch serialisierbar
  - fehlende Sicherheitsfakten erzeugen Hard Errors
  - Runtime Loader bleibt ausserhalb des RMT-Kernels

### WP-E16-03 - Enterprise surface.registry fuer Ownership und Discoverability ausbauen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - `surface.registry` zu einem Enterprise-Snapshot fuer lokale und remote Surfaces erweitern
- Scope:
  - Registry Schema `xtend.rmt.vnext-enterprise-surface-registry.v1`
  - Ownership, Team, Version, Remote Status, Shell Targets, Lanes, Events, Data Sources, Capabilities und Fallbacks
  - aktive, erwartete und degradierte Versionen
  - Discoverability Report fuer Operatoren, Tooling und AI-Agenten
- Zielartefakte:
  - Contract-Dokument `development/XTendRMT-vNext-Enterprise-Surface-Registry-Contract.md`
  - Registry-Modul in `tools/rmt-language/`
  - Registry-Fixture mit lokalen und remote Surfaces
- Ergebnis:
  - Enterprise Registry Contract `xtend.rmt.vnext-enterprise-surface-registry.v1` ist akzeptiert
  - Enterprise Surface Record `xtend.rmt.vnext-enterprise-surface.v1` ist akzeptiert
  - Modul `tools/rmt-language/vnext-enterprise-registry.js` normalisiert lokale und remote Surfaces
  - gemischtes Fixture `tests/rmt-language/fixtures/vnext-enterprise-registry-fixture.json` beweist Owner, Version, Shell Targets und Remote Discoverability
  - `WP-E16-04` und `WP-E16-06` sind startbar
- Gate:
  - `node scripts/run_xtend_tests.js rmt-vnext-enterprise-registry --json`
- Definition of Done:
  - jede Surface ist auffindbar, besitzbar und versionierbar
  - unbekannte oder ownerlose Surfaces erzeugen Diagnostics
  - Registry bleibt host-neutral

### WP-E16-04 - Versionierung, Compatibility und Graceful Degradation modellieren

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Degradation als Pflichtqualitaet fuer Enterprise-RMT etablieren
- Scope:
  - Degradation Schema `xtend.rmt.vnext-degradation-policy.v1`
  - Zustandsmodell `full`, `compatible`, `degraded`, `blocked`
  - Version Range, min Shell Version, Capability Checks und Fallback Resolution
  - Event- und DataSource-Verhalten unter Degradation
- Zielartefakte:
  - Contract-Dokument `development/XTendRMT-vNext-Degradation-Policy-Contract.md`
  - Degradation-Modul in `tools/rmt-language/`
  - Compatibility-Fixtures fuer kompatible, degradierte und blockierte Remote Surfaces
- Ergebnis:
  - Degradation Contract `xtend.rmt.vnext-degradation-policy.v1` ist akzeptiert
  - Degradation Surface Record `xtend.rmt.vnext-degradation-surface.v1` ist akzeptiert
  - Modul `tools/rmt-language/vnext-degradation.js` erzeugt deterministische Reports fuer `full`, `compatible`, `degraded` und `blocked`
  - Fixture `tests/rmt-language/fixtures/vnext-degradation-policy-fixture.json` beweist Version Range, Shell-Version, Capabilities, Fallback und Event Policy
  - `WP-E16-05` ist abgeschlossen; `WP-E16-06` ist startbar
- Gate:
  - `node scripts/run_xtend_tests.js rmt-vnext-degradation --json`
- Definition of Done:
  - Remote Surfaces ohne Fallback sind im strikten Modus ungueltig
  - Degradation Reports sind deterministisch und agentenlesbar
  - Versionierungsfehler werden nicht als Warnung versteckt

### WP-E16-05 - Remote Trust Boundaries, Manifest Integrity und Sandbox Policies haerten

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Hochsicherheits-Infrastruktur fuer Remote Surfaces auf Contract-Ebene absichern
- Scope:
  - Trust Boundary `xtend.security.remote-surface.v1`
  - Manifest Integrity, allowed Origins, CSP, Trusted Types, Sandbox und Capability Deny-by-Default
  - Security Posture fuer Remote Loads und Remote Event Payloads
  - Diagnostics fuer unsichere Origins, fehlende Integrity, Sandbox-Konflikte und Capability Escalation
- Zielartefakte:
  - Contract-Dokument `development/XTendRMT-vNext-Remote-Security-Policy-Contract.md`
  - Security-Modulerweiterung in `tools/rmt-language/`
  - negative Sicherheits-Fixtures
- Ergebnis:
  - Remote Security Contract `xtend.rmt.vnext-remote-security-policy.v1` ist akzeptiert
  - Remote Security Posture `xtend.rmt.vnext-remote-security-posture.v1` ist akzeptiert
  - Modul `tools/rmt-language/vnext-remote-security.js` prueft Remote Trust Boundary, allowed Origins, Manifest Integrity, CSP, Trusted Types, Sandbox, Capabilities, Event Payloads und blockierte Degradation
  - Fixture `tests/rmt-language/fixtures/vnext-remote-security-policy-fixture.json` beweist deny-by-default Remote Security fuer `remoteSurface:checkout.cart`
  - `WP-E16-06` ist startbar
- Gate:
  - `node scripts/run_xtend_tests.js rmt-vnext-remote-security --json`
- Definition of Done:
  - Remote Surface Security ist strenger als lokale Surface Security
  - keine Remote Capability wird implizit erlaubt
  - unsichere Flows blockieren den Registry Snapshot

### WP-E16-06 - Cross Surface Event Protocol fuer Lane- und Shell-Scopes definieren

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Cross Surface Events als typisiertes, owned und scoping-bewusstes Protokoll definieren
- Scope:
  - Event Protocol Schema `xtend.rmt.vnext-cross-surface-event-protocol.v1`
  - `emits` und `consumes` Records mit Owner, Richtung, Payload Schema, Version und Scope
  - Scope-Typen `surface`, `lane`, `shell.slot`, `shell.route`, `shell.session`
  - Verbot impliziter globaler Events
- Zielartefakte:
  - Contract-Dokument `development/XTendRMT-vNext-Cross-Surface-Event-Protocol-Contract.md`
  - Event-Protokoll-Modul in `tools/rmt-language/`
  - Fixtures fuer gueltige, richtungsfalsche und ownerlose Events
- Ergebnis:
  - Cross Surface Event Protocol `xtend.rmt.vnext-cross-surface-event-protocol.v1` ist akzeptiert
  - Event Record `xtend.rmt.vnext-cross-surface-event.v1` ist akzeptiert
  - Binding Record `xtend.rmt.vnext-cross-surface-event-binding.v1` ist akzeptiert
  - Modul `tools/rmt-language/vnext-cross-surface-events.js` prueft Owner, Richtung, Payload Schema, Version, Pairing und Surface-/Lane-/Shell-Scopes
  - Fixture `tests/rmt-language/fixtures/vnext-cross-surface-events-fixture.json` beweist Checkout- und Session-Events ueber lokale und remote Surfaces
  - `WP-E16-07` ist abgeschlossen; `WP-E16-08` ist startbar
- Gate:
  - `node scripts/run_xtend_tests.js rmt-vnext-cross-surface-events --json`
- Definition of Done:
  - jedes Cross Surface Event hat Owner, Richtung und Payload Shape
  - Shell- und Lane-Scopes sind referenziell pruefbar
  - ein globaler Bus ohne Contract ist unmoeglich

### WP-E16-07 - Event Ownership, Delivery Policy und Governance Diagnostics bauen

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Cross Surface Events operativ kontrollierbar und diagnosefaehig machen
- Scope:
  - Delivery Policies fuer `sync`, `queued`, `replayable`, `drop-if-stale`
  - TTL, correlationId, idempotencyKey und sensitivity facts
  - Ownership-Regeln fuer Event-Versionen und Payload-Schemas
  - Governance Diagnostics fuer implizite Kopplung und Cross-Team-Verletzungen
- Zielartefakte:
  - Governance Contract `development/XTendRMT-vNext-Event-Governance-Contract.md`
  - Diagnostic-Modulerweiterung
  - Governance-Fixtures
- Ergebnis:
  - Event Governance Contract `xtend.rmt.vnext-event-governance-policy.v1` ist akzeptiert
  - Governance Event Record `xtend.rmt.vnext-event-governance-event.v1` ist akzeptiert
  - Modul `tools/rmt-language/vnext-event-governance.js` prueft Delivery Mode, TTL, correlationId, idempotencyKey, Sensitivity, Owner Catalog, Version Owner, Payload Owner und Cross-Team-Reviews
  - Fixture `tests/rmt-language/fixtures/vnext-event-governance-fixture.json` beweist Governance fuer Checkout- und Session-Events
  - `WP-E16-08` ist startbar
- Gate:
  - `node scripts/run_xtend_tests.js rmt-vnext-event-governance --json`
- Definition of Done:
  - Event-Kopplung ist im Registry Report sichtbar
  - fehlende Delivery Policies koennen im strikten Modus blockieren
  - Governance Reports sind fuer Review und CI nutzbar

### WP-E16-08 - Parser, Compiler und Core-Erweiterungen fuer Remote Surfaces integrieren

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - die E16-Syntax in Parser, Compiler und Source Maps integrieren
- Scope:
  - `remote surface ... from remote ...` Syntax
  - `owner`, `version`, `origin`, `integrity`, `fallback`, `exposes`, `emits`, `consumes`
  - Core Mapping zu Remote Surface, Registry, Event und Degradation Records
  - Source Maps und Diagnostics fuer alle neuen Konstrukte
- Zielartefakte:
  - Parser-/Compiler-Erweiterungen in `tools/rmt-language/`
  - Compiler-Fixtures und Golden Core Outputs
  - aktualisierte Snippet-Basis fuer Folge-WP
- Ergebnis:
  - Parser `tools/rmt-language/vnext-parser.js` akzeptiert `remote surface ... from remote ...`
  - Compiler `tools/rmt-language/vnext-compiler.js` erzeugt `coreDocument.remoteSurfaces[]` inklusive Source Maps
  - Remote Compiler `tools/rmt-language/vnext-remote-compiler.js` erzeugt Remote Manifest, Enterprise Registry, Cross-Surface-Event-Protokoll, Event Governance und Degradation Report
  - Contract `development/XTendRMT-vNext-Remote-Compiler-Core-Contract.md` ist akzeptiert
  - Fixtures `tests/rmt-language/fixtures/vnext-remote-compiler-valid.rmt`, `tests/rmt-language/fixtures/vnext-remote-compiler-invalid.rmt` und `tests/rmt-language/fixtures/vnext-remote-compiler-valid.core.json` decken positive, negative und Golden-Core-Faelle ab
  - `WP-E16-09` und `WP-E16-10` sind startbar
- Gate:
  - `node scripts/run_xtend_tests.js rmt-vnext-remote-compiler --json`
- Definition of Done:
  - E16 Authoring kompiliert deterministisch in JSON-kompatible Core Records
  - negative Syntax- und Semantikfaelle sind abgedeckt
  - bestehende E15-Fixtures bleiben gruen

### WP-E16-09 - Tooling, LSP, Snippets und Agent Reports fuer Enterprise-MFE erweitern

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Remote Surface Authoring fuer Entwickler sichtbar, reparierbar und reviewbar machen
- Scope:
  - Linter-Regeln fuer Owner, Version, Fallback, Integrity, Event Direction und Payload Shape
  - LSP Completion/Hover/Symbols fuer Remote Surfaces, Shell Targets und Events
  - Snippets fuer Remote Surface, emits/consumes, fallback und degradation
  - Agent Reports fuer Registry-, Security- und Degradation-Status
- Zielartefakte:
  - Tooling Contract `development/XTendRMT-vNext-Remote-Tooling-Contract.md`
  - aktualisierte Snippets und LSP-Fakten
  - Tooling-Suite
- Ergebnis:
  - Remote Tooling Contract `xtend.rmt.vnext-remote-tooling.v1` ist akzeptiert
  - Modul `tools/rmt-language/vnext-remote-tooling.js` liefert Analyse, Lint, Completion, Hover, Document Symbols und Agent Report
  - Linter-Regeln fuer Owner, Version, Integrity, Fallback, Event Direction und Payload Schema enthalten Reparatur- oder Handoff-Hinweise
  - Snippets `rmt-vnext-remote-surface`, `rmt-vnext-remote-event`, `rmt-vnext-remote-fallback` und `rmt-vnext-remote-degradation` sind in Source- und VS-Code-Package-Snippets synchron
  - Negative Fixture `tests/rmt-language/fixtures/vnext-remote-tooling-invalid.rmt` prueft actionable Diagnostics
  - `WP-E16-10` und `WP-E16-11` sind startbar
- Gate:
  - `node scripts/run_xtend_tests.js rmt-vnext-remote-tooling --json`
- Definition of Done:
  - Entwickler koennen E16-Konstrukte ohne implizites Wissen authoren
  - Diagnostics enthalten klare Repairs oder Handoff-Hinweise
  - Snippets bleiben mit Compiler-Syntax synchron

### WP-E16-10 - Compatibility, Migration und Legacy Surface Roundtrip absichern

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - bestehende Surface-/MFE-nahe Dokumente kontrolliert in E16-Reports einordnen
- Scope:
  - report-only Migration fuer bestehende Surface Records
  - Preview-Projektion zu Remote Surface Authoring, wo sicher moeglich
  - Roundtrip-Grenzen fuer Legacy SurfaceManager- und native RMT-Surface-Domains
  - Diagnostics fuer nicht migrierbare Runtime-Fakten
- Zielartefakte:
  - Migration Contract `development/XTendRMT-vNext-Remote-Surface-Migration-Contract.md`
  - Compatibility Matrix
  - Legacy- und Preview-Fixtures
- Ergebnis:
  - Remote Migration Contract `xtend.rmt.vnext-remote-surface-migration.v1` ist akzeptiert
  - Modul `tools/rmt-language/vnext-remote-compatibility.js` liefert Migration Reports, Compatibility Matrix, Legacy Roundtrip und Remote Authoring Preview
  - Migration bleibt per Default `report-only`; Preview ist opt-in via `migrationMode: "preview"`
  - SurfaceManager-, Runtime- und Layout-Fakten werden als nicht migrierbare Diagnostics sichtbar
  - sichere Preview-Projektionen werden ueber den WP-E16-08 Remote Compiler validiert
  - Legacy Fixture `tests/rmt-language/fixtures/vnext-remote-compatibility-legacy-surface.rmt` und Preview Fixture `tests/rmt-language/fixtures/vnext-remote-compatibility-preview.rmt` decken beide Migrationspfade ab
  - `WP-E16-11` bleibt startbar; `WP-E16-12` bleibt bis `WP-E16-11` blockiert
- Gate:
  - `node scripts/run_xtend_tests.js rmt-vnext-remote-compatibility --json`
- Definition of Done:
  - Migration bleibt opt-in und report-only per Default
  - nicht migrierbare Runtime-Fakten werden sichtbar
  - E15 Compatibility Gate bleibt unverletzt

### WP-E16-11 - Enterprise Fixture, Remote Reference Demo und Browser-Smoke-Probe bauen

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - E16 als nachvollziehbares Enterprise-MFE-Szenario demonstrieren
- Scope:
  - Reference Demo mit Shell, lokaler Surface, Remote Surface, Cross Surface Event und Fallback
  - stabiler Core Output
  - Browser-Smoke-Probe ohne echte Netzwerklast
  - Golden Hashes fuer Registry, Event Protocol und Degradation Reports
- Zielartefakte:
  - `xtendrmt/rmt-vnext-enterprise-mfe-demo.rmt`
  - `xtendrmt/rmt-vnext-enterprise-mfe-demo.core.json`
  - Browser Fixture in `tests/browser/fixtures/`
  - Regression Matrix
- Ergebnis:
  - Enterprise Fixture Contract `xtend.rmt.vnext-enterprise-fixture.v1` ist akzeptiert
  - Modul `tools/rmt-language/vnext-enterprise-fixtures.js` erzeugt Demo-Bundle, Enterprise Registry, Degradation Report, Browser Probe und Golden Hashes
  - Demo `xtendrmt/rmt-vnext-enterprise-mfe-demo.rmt` kombiniert Shell, lokale Workspace Surface, lokale Fallback Surface und Remote Surface `checkout.cart`
  - Core Output `xtendrmt/rmt-vnext-enterprise-mfe-demo.core.json` ist byte-stabil
  - Browser Fixture `tests/browser/fixtures/rmt-vnext-enterprise-mfe-smoke.html` ist offline, statisch und fuehrt keine Remote Runtime aus
  - Regression Matrix `tests/rmt-language/fixtures/vnext-enterprise-mfe-fixture-matrix.json` pinnt Hashes fuer Core, Remote Bundle, Registry, Event Protocol, Governance und Degradation
  - `WP-E16-12` ist startbar
- Gate:
  - `node scripts/run_xtend_tests.js rmt-vnext-enterprise-fixtures --json`
- Definition of Done:
  - Demo beweist Remote Surface, Event Protocol, Versionierung und Fallback
  - Browser-Smoke bleibt offline und deterministisch
  - alle Golden Outputs sind stabil

### WP-E16-12 - Docs, Release Gates und Enterprise-MFE-Handoff finalisieren

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - Epic 16 releasefaehig dokumentieren und gatebar machen
- Scope:
  - Authoring Guide fuer Remote Surfaces
  - Surface Registry und Event Protocol Reference
  - Migration Notes und Operational Handoff
  - Package Metadata, Exports und Release Gate Matrix
- Zielartefakte:
  - `docs/rmt-vnext-remote-surfaces.md`
  - `docs/rmt-vnext-surface-registry-enterprise.md`
  - `docs/rmt-vnext-cross-surface-events.md`
  - `development/docs-evidence/legacy-routes/en/rmt-vnext-enterprise-mfe-handoff.md`
  - Release-Handoff Contract
- Ergebnis:
  - Enterprise Release Handoff Contract `xtend.rmt.vnext-enterprise-release-handoff.v1` ist akzeptiert
  - Modul `tools/rmt-language/vnext-enterprise-release.js` erzeugt Handoff Plan, Release Gate Matrix, Docs Report und Demo Release Report
  - Suite `tests/rmt-language/rmt_vnext_enterprise_release_suite.js` prueft Package Metadata, Exports, Runner, Docs, Demo, Browser-Smoke und Referenzpfade
  - Docs `docs/rmt-vnext-remote-surfaces.md`, `docs/rmt-vnext-surface-registry-enterprise.md`, `docs/rmt-vnext-cross-surface-events.md` und `development/docs-evidence/legacy-routes/en/rmt-vnext-enterprise-mfe-handoff.md` sind im Docs-Menue und README referenziert
  - Release Gate Matrix umfasst alle E16-Gates sowie `references` und `browser`
  - Zielreife `rmt-vnext-enterprise-mfe-ready` ist akzeptiert
- Gate:
  - `node scripts/run_xtend_tests.js rmt-vnext-enterprise-release --json`
- Definition of Done:
  - alle E16-Gates sind in Package-Metadaten sichtbar
  - Docs, Demo, Core Output und Contracts sind referenziert
  - Zielreife `rmt-vnext-enterprise-mfe-ready` ist akzeptiert

---

# Release-Gate-Zielmatrix

Epic 16 gilt erst als abgeschlossen, wenn die Release Matrix mindestens diese Gates umfasst:

```bash
node scripts/run_xtend_tests.js rmt-vnext-remote-manifest --json
node scripts/run_xtend_tests.js rmt-vnext-enterprise-registry --json
node scripts/run_xtend_tests.js rmt-vnext-degradation --json
node scripts/run_xtend_tests.js rmt-vnext-remote-security --json
node scripts/run_xtend_tests.js rmt-vnext-cross-surface-events --json
node scripts/run_xtend_tests.js rmt-vnext-event-governance --json
node scripts/run_xtend_tests.js rmt-vnext-remote-compiler --json
node scripts/run_xtend_tests.js rmt-vnext-remote-tooling --json
node scripts/run_xtend_tests.js rmt-vnext-remote-compatibility --json
node scripts/run_xtend_tests.js rmt-vnext-enterprise-fixtures --json
node scripts/run_xtend_tests.js rmt-vnext-enterprise-release --json
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js browser --json
```

---

# Accepted Residuals fuer Epic-Start

| Residual | Entscheidung | Folgepfad |
| --- | --- | --- |
| produktiver Remote Runtime Loader | nicht Teil des RMT-Kernels | Runtime Adapter Epic oder Host-spezifisches Paket |
| echte Netzwerk-Integration in Tests | nicht fuer Language-Layer-Gates erforderlich | spaeterer Runtime-/E2E-Gate |
| Public Package Distribution fuer Remote Manifeste | nicht im Scope des ersten E16-Schnitts | Release-/Registry-Distribution Folgepaket |
| organisatorisches Team Directory | als Catalog Input modellierbar, nicht Kernbestandteil | Enterprise Governance Integration |

# Startentscheidung

Epic 16 ist abgeschlossen.

Threat Model, Remote Manifest, Enterprise Registry, Degradation, Remote Security, Cross Surface Event Protocol, Event Governance, Remote Compiler, Remote Tooling, Remote Compatibility/Migration, Enterprise Fixtures und Enterprise-MFE Release Handoff sind akzeptiert. Folgepfade koennen jetzt Host-spezifische Runtime Adapter, echte Netzwerk-E2E-Gates und Remote-Manifest-Distribution priorisieren.
