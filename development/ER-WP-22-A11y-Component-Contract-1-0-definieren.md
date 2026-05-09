# ER-WP-22 - A11y Component Contract 1.0 definieren

- Status: `completed`
- Datum: 5. Mai 2026
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Contract: `xtend.enterprise.er-wp-22.a11y-component-contract.v1`
- Zielcontract: `development/XTend-A11y-Component-Contract.md`
- A11y Contract: `xtend.a11y.component-contract.v1`
- Profile Contract: `xtend.a11y.profile.v1`
- Test Contract: `xtend.a11y.test-contract.v1`
- Bezug:
  - `development/XTend-Enterprise-Reife-Implementierungsplan.md`
  - `development/XTend-Testpflicht-und-Scaffold-Anschluss.md`
  - `development/XTend-Component-Level-Teststandard.md`
  - `development/XTend-Accessibility-Hydration-Testregeln.md`
  - `development/XTend-Fiber-und-Lane-Contract.md`
  - `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
  - `tests/references/reference_path_suite.js`

## Ziel

`ER-WP-22` legt A11y-by-design als verbindlichen Component Contract fest.

Das Paket implementiert noch keine neuen Browser-Smokes und passt noch keine Scaffold-Templates an. Es definiert die Pflichtoberflaeche fuer Rolle, Name, Fokusstrategie, Keyboard, ARIA-State, Screenreader, Motion und Contrast, damit `ER-WP-23` bis `ER-WP-26` ohne weitere Grundsatzentscheidung starten koennen.

## Ergebnisartefakt

Der verbindliche Contract liegt in:

```text
development/XTend-A11y-Component-Contract.md
```

Er traegt:

- `xtend.a11y.component-contract.v1`
- `xtend.a11y.profile.v1`
- `xtend.a11y.test-contract.v1`

## Pflichtdimensionen

Jede neue oder modernisierte sichtbare Komponente muss diese Dimensionen beschreiben oder begruendet ausnehmen:

- Rolle/Semantik
- zugaenglicher Name
- Fokusstrategie
- Keyboard Contract
- ARIA-State
- Screenreader-/Live-Region-Strategie
- Reduced-Motion-Regel
- Contrast-/Focus-Visible-Regel
- lokale Gates und Test-Refs

## Profilmatrix

Der Contract deckt die bestehenden XTend-Profile ab:

| Profil | A11y-Schwerpunkt |
|--------|------------------|
| `display` | Semantik, Region/Landmark bei Bedarf, keine stille Statusaenderung |
| `interactive` | Name, Fokus, `Enter`/`Space`, ARIA-State |
| `stateful` | State darf Fokus und ARIA nicht entkoppeln |
| `feedback` | `status`/`alert`, `aria-live`, Dismissal, Live-Region |
| `overlay` | `dialog`, `aria-modal`, Initialfokus, Fokusfalle, Escape, Fokus-Rueckgabe |
| `routing` | Navigation-Semantik, Fokus nach Navigation, `aria-current` |
| `theme` | sichtbarer Fokus und zugaengliche Theme-Controls |
| `form` | Labels, Fehler, `aria-invalid`, `aria-describedby`, Fehlerfokus |
| `media` | Control-Labels, Ladezustand, Tastatur, Fallbacks |

## Fabric- und Lane-Anschluss

A11y-relevante UI-Arbeit ist nicht nachrangig.

Der Contract legt fest:

- Screenreader-Announcements, Fokusreparaturen und ARIA-State-Korrekturen nutzen die Fabric-Lane `a11y`.
- Kritische Fokus- und Keyboardarbeit darf `user-blocking` nutzen.
- A11y-Diagnostics muessen mit `componentRef`, `fiberId`, `lane`, `phase` oder `correlationId` korrelierbar sein.

## Handoff an Folgepakete

| Folgepaket | Startstatus nach ER-WP-22 | Handoff |
|------------|---------------------------|---------|
| `ER-WP-23` | ready | Scaffold-Blueprints koennen A11y-Profilfelder, Testpflichten und Docs-Abschnitte erzeugen |
| `ER-WP-24` | blocked | browsernahe Fokus- und Keyboard-Smokes warten auf Scaffold-Pflichten |
| `ER-WP-25` | completed | Screenreader-Signal-Contracts bauen auf browsernahen A11y-Smokes aus `ER-WP-24` auf |
| `ER-WP-26` | completed | Reduced-Motion und High-Contrast Gates bauen auf dem A11y-Smoke-Ausbau aus `ER-WP-24` auf |
| `ER-WP-31` | planned | Catalog Coverage kann spaeter A11y-Profile einfordern |

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Rolle/Semantik ist als Pflichtdimension definiert | erfuellt |
| Zugaenglicher Name ist als Pflichtdimension definiert | erfuellt |
| Fokusstrategie ist als Pflichtdimension definiert | erfuellt |
| Keyboard Contract ist definiert | erfuellt |
| ARIA-State und Screenreader sind vorbereitet | erfuellt |
| Reduced-Motion und Contrast sind vorbereitet | erfuellt |
| `ER-WP-23` kann starten | erfuellt |

## Verifikation

Mindestgate fuer dieses Paket:

```bash
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js a11y-hydration --json
npm test
```

## Ergebnis

`ER-WP-22` ist abgeschlossen. XTend hat einen verbindlichen A11y Component Contract 1.0 fuer neue, modernisierte und scaffolded Komponenten. `ER-WP-23` ist startbereit.
