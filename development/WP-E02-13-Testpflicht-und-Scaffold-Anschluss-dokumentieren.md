# WP-E02-13 - Testpflicht und Scaffold-Anschluss dokumentieren

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `development/EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`
- Backlog: `development/BACKLOG-EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`

## Ziel

`WP-E02-13` legt fest, wann neue, modernisierte und scaffolded XTend-Komponenten als testseitig abgeschlossen gelten duerfen. Das Paket verbindet den Component-Level-Teststandard mit `XTend-Scaffold`, sodass kuenftige Generatoren nicht nur Komponenten-Code, sondern auch Doku-, Test-, Fixture-, Typ- und Manifest-Artefakte erzeugen koennen.

## Umgesetzte Artefakte

- `development/XTend-Testpflicht-und-Scaffold-Anschluss.md` als verbindliche Testpflicht-Dokumentation angelegt
- `xtend-builder/scaffold.config.js` um Testpflicht-, Artefakt- und Runner-Metadaten erweitert
- `development/EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md` an die Epic-02-Testpflicht angebunden
- `docs/best-practices.md` um konkrete Testpflichten fuer Komponenten erweitert
- `tests/components/README.md` um Scaffold-/Review-Regeln erweitert
- `development/XTend-Component-Level-Teststandard.md` mit dem WP-13-Anschluss verknuepft
- `tests/references/reference_path_suite.js` um einen pruefbaren Gate fuer Testpflicht und Scaffold-Anschluss erweitert

## Entscheidungen

- Die Testpflicht bleibt profilbasiert und nutzt die bestehenden Profile aus dem Component-Level-Teststandard.
- `XTend-Scaffold` wird noch nicht implementiert, bekommt aber eine konkrete Contract-Schnittstelle ueber `xtend-builder/scaffold.config.js`.
- Ausnahmen sind erlaubt, muessen aber in Workpackage, Suite oder Doku begruendet werden.
- AI-Agenten und menschliche Entwickler folgen denselben Review-Kriterien.

## Lokaler Testpfad

Pflichtpfad fuer WP-13:

```bash
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js references
node scripts/run_xtend_tests.js
```

Zusaetzlich bleibt der Legacy-Core-Verify-Pfad kompatibel:

```bash
node scripts/verify_xtend_core_contracts.js
```

## Ergebnis

`WP-E02-13` ist abgeschlossen. Epic 02 besitzt nun eine dokumentierte Testpflicht und einen konkreten Scaffold-Anschluss, der in Epic 03 ohne grundlegenden Refactor aufgegriffen werden kann.
