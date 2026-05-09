# ER-WP-27 - Security ADR fuer Loader, Manifest, Templates und Events schreiben

- Status: `completed`
- Datum: 5. Mai 2026
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Contract: `xtend.enterprise.er-wp-27.security-trust-boundaries.v1`
- ADR: `development/ADR-XTend-Security-Trust-Boundaries.md`
- Security Contract: `xtend.security.trust-boundaries.adr.v1`
- Loader Policy Contract: `xtend.security.loader-policy.v1`
- Manifest Policy Contract: `xtend.security.manifest-policy.v1`
- Trusted DOM Policy Contract: `xtend.security.trusted-dom-policy.v1`
- Event Policy Contract: `xtend.security.event-policy.v1`
- Bezug:
  - `development/XTend-Enterprise-Reife-Implementierungsplan.md`
  - `development/ADR-XTend-Loader-und-Lokale-Entwicklung.md`
  - `development/ADR-XTend-Fabric.md`
  - `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
  - `tests/references/reference_path_suite.js`

## Ziel

`ER-WP-27` legt die Security Trust Boundaries fuer dynamische XTend-Arbeit fest.

Das Paket implementiert noch keine Loader-Allowlist, keinen Sanitizer und keine Supply-Chain-Gates. Es definiert die Sicherheitsentscheidungen, damit `ER-WP-28`, `ER-WP-29` und `ER-WP-30` ohne neue Grundsatzklaerung starten koennen. `ER-WP-29` und `ER-WP-30` sind inzwischen abgeschlossen.

## Ergebnisartefakt

Die akzeptierte Entscheidung liegt in:

```text
development/ADR-XTend-Security-Trust-Boundaries.md
```

Sie traegt:

- `xtend.security.trust-boundaries.adr.v1`
- `xtend.security.loader-policy.v1`
- `xtend.security.manifest-policy.v1`
- `xtend.security.trusted-dom-policy.v1`
- `xtend.security.event-policy.v1`

## Pflichtgrenzen

| Bereich | Entscheidung |
|---------|--------------|
| Loader | `xtend-loader.js` bleibt kanonischer Sink; lokale URLs sind Default; CDN ist kein Default- oder Testpfad |
| Manifest | Manifest Records sind Daten und muessen validiert werden, bevor sie Module oder Custom Elements beeinflussen |
| Dynamic Imports | `import()` darf nur erlaubte lokale URLs ausfuehren; Refusals werden diagnostiziert |
| RMT Templates | strukturierte Templates erzeugen Nodes; rohe HTML-Fragmente brauchen Trusted-DOM-Boundary |
| Parsedown Docs | Markdown-Content ist nicht automatisch sicherer HTML-Sink |
| Events | Event Bindings nutzen typed Payloads und Action-Refs, keine JavaScript-Strings |
| Fabric Diagnostics | Security- und Fehlerdaten werden redigiert, bevor Reporter sie erhalten |

## Erlaubte Sinks

Die ADR setzt diese Sink-Regeln fuer Folgepakete:

- `textContent` fuer Text
- `setAttribute` nur fuer erlaubte Attribute und sichere URLs
- `append`/`replaceChildren` mit Nodes als bevorzugter DOM-Pfad
- `innerHTML`, `insertAdjacentHTML` und `template.innerHTML` nur innerhalb einer Trusted-DOM-Boundary
- `eval`, `new Function`, dynamische Script-Tags und Inline-Handler sind kein XTend-Default-Pfad

## Handoff an Folgepakete

| Folgepaket | Startstatus nach ER-WP-27 | Handoff |
|------------|---------------------------|---------|
| `ER-WP-28` | next | Loader-/Manifest-Allowlist und Import Refusal koennen auf `xtend.security.loader-policy.v1` und `xtend.security.manifest-policy.v1` aufsetzen, warten weiter auf `ER-WP-03` |
| `ER-WP-29` | ready | Trusted-DOM- und Sanitizing-Policy kann auf `xtend.security.trusted-dom-policy.v1` starten |
| `ER-WP-30` | completed | Dependency-, License- und Vulnerability-Gates nehmen Security Boundary und Package-/Release-Strategie auf |
| `ER-WP-39` | completed | Enterprise Adoption Guide dokumentiert Security Boundary, Loader Policy und Trusted-DOM-Regeln |
| `ER-WP-40` | completed | Docs-App RMT Pilot respektiert Security Boundary und Trusted-DOM-Regeln |

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Trust Boundary fuer Loader ist definiert | erfuellt: lokale Loader Policy und Import Refusal festgelegt |
| Trust Boundary fuer Manifest ist definiert | erfuellt: Manifest Records sind Daten, keine ausfuehrbare Konfiguration |
| Trust Boundary fuer Templates und Parsedown ist definiert | erfuellt: strukturierter DOM-Pfad bevorzugt, HTML-Fragmente nur Trusted DOM |
| Event-Sicherheitsregeln sind festgelegt | erfuellt: typed Payloads und Action-Refs, keine Code-Strings |
| Fabric-/Reporter-Privacy ist angebunden | erfuellt: redigierte Diagnostics sind Pflicht |
| `ER-WP-28` und `ER-WP-29` koennen ohne Security-Unklarheit starten | erfuellt |

## Verifikation

Mindestgate fuer dieses Paket:

```bash
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

`ER-WP-27` ist abgeschlossen. XTend hat eine akzeptierte Security Trust Boundary fuer Loader, Manifest, Dynamic Imports, RMT Templates, Parsedown Docs, Events, Trusted DOM und Fabric Diagnostics. `ER-WP-28`, `ER-WP-29` und `ER-WP-30` sind inzwischen abgeschlossen; Manifest-/Import-Haertung, Trusted DOM und Supply-Chain-Gates sind lokal gatebar vorbereitet.
