# XTend Native-First Feature Adoption Observatory Contract

- Status: `accepted-internal-intake`
- Datum: 17. August 2026
- Intake Contract: `xtend.native-first.observatory-intake.v1`
- Review Contract: `xtend.native-first.observatory-review.v1`
- Run Index Contract: `xtend.native-first.observatory-run-index.v1`
- Lab Contract: `xtend.native-first.observatory-lab.v1`
- Adoption Decision Contract: `xtend.native-first.observatory-adoption-decisions.v1`
- Browser Primitive Radar: `xtend.native-first.browser-primitive-radar.v1`
- Adoption Gate: `xtend.native-first.primitive-adoption-gate.v1`
- Boundary: `ai-output-is-untrusted-intake`
- Boundary: `interop-participation-is-not-shipping-evidence`
- Boundary: `standards-evidence-is-not-engine-shipping-evidence`
- Boundary: `no-automatic-radar-or-runtime-mutation`

## Zweck

Das Observatory sammelt KI-generierte Hinweise, entscheidet aber nicht ueber Browser-Support oder Produktadoption. Jede Eingabe bleibt unveraendert, wird per SHA-256 gebunden und erhaelt genau einen menschlich verantworteten Review-Record. Erst Radar und Adoption ADR duerfen Produktarbeit autorisieren.

## Intake

`xtend.native-first.observatory-intake.v1` verlangt eine stabile Intake-ID, den internen Raw-Pfad, Quell-SHA-256, Repository-Copy-SHA-256, Unveraenderlichkeitsmarker, Agent-/Modellangabe, Erstellungs- beziehungsweise Berichtsdatum, Zugriffsdatum und die geordnete Liste aller Finding-IDs. Fehlende Provenienz wird als `unknown-unreported` erfasst und nicht erfunden. Fuegt die Textablage genau einen terminalen Zeilenumbruch hinzu, wird dies als `single-terminal-newline-added` deklariert; das Gate prueft sowohl den abgelegten Byte-Hash als auch den Quell-Hash nach Entfernung genau dieses Transportzeichens.

Raw-Felder wie `verdict`, `maturity`, `impact`, `prototype` und `browserSupport` sind untrusted Vorschlaege. Sie duerfen weder Radarzeilen ueberschreiben noch Runtime, Package-Exports, RMT-Syntax oder Defaults veraendern.

## Run Index und Carry-over

`xtend.native-first.observatory-run-index.v1` fuehrt alle unveraenderlichen Wochenlaeufe in aufsteigender Reihenfolge. `currentRun` muss auf den neuesten Report zeigen; die kompatiblen Package-Aliase `intake` und `review` muessen denselben Run referenzieren. Historische Runs, Reviews, Labs und ADRs bleiben adressierbar und werden nicht vom aktuellen Lauf ueberschrieben.

Wiederholte Finding-IDs erhalten im neuen Review `previousReviewRef` und `rawDelta`. Das Gate berechnet den Top-Level-Diff selbst und lehnt verschwiegene oder erfundene Aenderungen ab. Ein als `classificationOnly` markierter Carry-over darf ausschliesslich das untrusted Raw-Feld `category` aendern und niemals Radar-Kategorie, Status oder Adoption ausloesen.

## Review Ledger

Jeder `xtend.native-first.observatory-review.v1` Record enthaelt:

- genau eine Raw-Finding-ID
- getrennte `facts` und `xtendHypotheses`
- HTTPS-Quellen mit Source-Kind
- engine- und versionsbezogene Browser-Evidence
- existierende Repo-Pfade und reale Symbole
- Radar-Refs oder fuer Investigations bewusst keine Radar-Ref
- Outcome, Owner und Wiedervorlage

Erlaubte Review-Outcomes sind `corroborates-existing`, `corrected-candidate`, `new-radar-candidate`, `investigation-only` und `rejected`. `investigation-only` und `rejected` duerfen keinen neuen Browser-Primitive-Radar-Eintrag erzeugen.

## Quellen- und Claim-Regeln

Erlaubte URLs verwenden ausschliesslich HTTPS. Credentials, Localhost, IP-Literale, Fragmente mit Zugangsdaten und nicht freigegebene Hosts werden abgewiesen. Die Allowlist umfasst die reviewten Engine-, Standard- und Issue-Quellen auf `github.com`, `developer.chrome.com`, `developer.mozilla.org`, `hacks.mozilla.org`, `v8.dev`, `webkit.org`, `bugzilla.mozilla.org`, `tc39.es` und `www.w3.org`.

Ein Interop- oder Standardsprogramm darf koordinierte Browserarbeit belegen, aber kein Shipping. `shipping` und `behind-flag` brauchen eine engine-nahe Primaerquelle der Typen `engine-release` oder `engine-docs`; eine Technology-Preview-Release wird als eigene Source-Klasse `technology-preview` erfasst und darf niemals Stable Shipping belegen. `beta` und `technology-preview` bleiben ausdruecklich Vorab-Evidence. `in-development` braucht `engine-issue` oder `engine-docs`. Kompatibilitaetsdokumentation darf einen expliziten Baseline-Claim belegen. `standards-spec` und `standards-recommendation` belegen Normstatus oder Autorenkonformitaet, aber keinen Engine-Support. Fehlende Engine-Artefakte bleiben `insufficient-evidence` und blockieren Adoption.

## Lab-Grenzen

Observatory-Labs liegen ausschliesslich unter `tests/`. Sie sind opt-in, dependency-frei und koennen keine oeffentlichen Package-Exports, RMT-Syntax oder Defaultpfade einfuehren. Owned XTend-Pfade bleiben Source of Truth und Fallback. RMT-Lanes, Cancellation, Backpressure, Surface-Ownership, Events, Fokus-, A11y- und Security-Contracts bleiben unveraendert.

## Gates

```bash
node scripts/run_xtend_tests.js browser-primitive-radar --json
node scripts/run_xtend_tests.js primitive-adoption-gate --json
node scripts/run_xtend_tests.js observatory-adoption-labs --json
node scripts/run_xtend_tests.js aria-in-html-conformance --json
```

`browser-primitive-radar` prueft Run Index, beide Intakes, SHA, Carry-over-Deltas, Review-Vollstaendigkeit, Quellen, Repo-Symbole, Radar-IDs und Claim-Evidence. `primitive-adoption-gate` prueft die Adoption ADRs, Outcomes, per-Decision Review-Refs, Evidence, Fallback, Security, RMT-Neutralitaet und fehlende Runtime-Abhaengigkeiten. `observatory-adoption-labs` prueft die opt-in Strategien, 500-Unit-Scheduler-Scheiben, Registry-Isolation, Overlay-Ownership, Navigation-Fallbacks, Explicit Resource Management und die Engine-Evidence-Matrix. `aria-in-html-conformance` prueft eine versionierte Teilmenge der W3C-Autorenregeln ohne AOM- oder AT-Supportclaim.

## Produktisierungsgrenze

Nach jedem Prototyp ist genau eines der Outcomes `adopt-native`, `wrap-as-xtend-primitive`, `defer-with-watch` oder `reject-for-now` in einer Adoption ADR erforderlich. Erst danach darf ein produktives Workpackage entstehen.
