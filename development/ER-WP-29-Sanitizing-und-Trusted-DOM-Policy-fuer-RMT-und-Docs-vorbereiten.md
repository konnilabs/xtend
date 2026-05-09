# ER-WP-29 - Sanitizing-/Trusted-DOM-Policy fuer RMT und Docs vorbereiten

- Status: `completed`
- Datum: 5. Mai 2026
- Contract: `xtend.enterprise.er-wp-29.trusted-dom-sanitizing.v1`
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Policy: `development/XTend-Trusted-DOM-und-Sanitizing-Policy.md`
- Modul: `security/trusted-dom-policy.js`
- Abhaengigkeit: `ER-WP-27`

## Ziel

RMT `html_fragment`, RMT Template Authoring und die Parsedown-basierte Docs-App brauchen eine klare Markup-Trust-Regel, bevor spaetere Runtime-, Sanitizer- oder Docs-RMT-Pilotpakete daran arbeiten. Dieses Paket bereitet die Boundary vor und macht sie gatebar.

## Umgesetzte Artefakte

| Artefakt | Ergebnis |
|----------|----------|
| Policy | `development/XTend-Trusted-DOM-und-Sanitizing-Policy.md` |
| Maschinenlesbarer Contract | `security/trusted-dom-policy.js` |
| Entwicklerdoku | `docs/trusted-dom-sanitizing.md` |
| Docs-Menue | `docs/menu.json` mit `trusted-dom-sanitizing` |
| RMT-Doku | `docs/xtendrmt-native-authoring.md`, `docs/xtendrmt-parsedown-scheduling.md`, `docs/xtendrmt-app-dsl.md` |
| Referenz-Gate | `tests/references/reference_path_suite.js` prueft Contracts, Doku und Policy-Modul |

## Contract IDs

- `xtend.security.trusted-dom-policy.v1`
- `xtend.security.sanitizing-boundary.v1`
- `xtend.security.markup-classification.v1`
- `xtend.security.trusted-dom-sink.v1`
- `xtend.enterprise.er-wp-29.trusted-dom-sanitizing.v1`

## Definition of Done

- RMT `html_fragment` ist als DOM-untrusted klassifiziert.
- Parsedown HTML ist trotz SafeMode als DOM-untrusted klassifiziert.
- Strukturierte RMT `dom_descriptor` Templates bleiben der bevorzugte DOM-Pfad.
- Erlaubte, eingeschraenkte und verbotene DOM-Sinks sind dokumentiert.
- `innerHTML`, `insertAdjacentHTML` und `template.innerHTML` sind nur innerhalb einer Trusted-DOM-Boundary erlaubt.
- `eval`, `new Function`, Inline-Handler und dynamische Script-Tags sind verboten.
- Reference-Gates pruefen Policy, Docs und Roadmap-Status.

## Validierung

```bash
node --check security/trusted-dom-policy.js
node scripts/run_xtend_tests.js references --json
npm test
```

## Handoff

`ER-WP-29` ist abgeschlossen. `ER-WP-28` kann die Loader-/Manifest-Importverweigerung technisch haerten, sobald die CDN-Fallback-Entkopplung abgeschlossen ist. `ER-WP-30` kann Dependency- und Supply-Chain-Gates aufnehmen. `ER-WP-40` darf die Docs-App mit RMT Parsedown Scheduling nur entlang dieser Trusted-DOM-Boundary pilotieren.
