# ADR Template - XTend Native Primitive Adoption

- Status: `template`
- Datum: `<YYYY-MM-DD>`
- Contract: `xtend.native-first.primitive-adoption-adr.v1`
- Gate Contract: `xtend.native-first.primitive-adoption-gate.v1`
- Decision ID: `<native-primitive-decision-id>`
- Primitive Name: `<browser primitive or platform capability>`
- Primitive Category: `<dom|component|form|layout|navigation|animation|scheduling|observability|storage|security|network|media|other>`
- Target Surface: `<runtime|component|rmt|fabric|docs|tooling|security>`
- Decision Outcome: `<adopt-native|wrap-as-xtend-primitive|build-owned-primitive|keep-existing-owned-path|defer-with-watch|allow-runtime-dependency-exception|reject-for-now>`
- Owner: `<owner or owner-role>`
- Review Date: `<YYYY-MM-DD>`
- Primitive Radar Ref: `<NFM-BPR-###; pre-radar only for historical ADRs before NFM-WP-02>`
- Workpackage: `<NFM-WP-xx or other WP>`
- Related Contracts:
  - `xtend.native-first.mission-source-of-truth.v1`
  - `xtend.native-first.browser-primitive-radar.v1`
  - `xtend.native-first.primitive-adoption-gate.v1`

## Kontext

Beschreibe das UI-, Runtime-, Component-, RMT-, Security- oder Tooling-Problem, das diese Primitive-Entscheidung ausloest.

Pflichtfragen:

- Welche konkrete Faehigkeit fehlt oder ist zu komplex?
- Welche Browser-native Primitive oder Platform-Faehigkeit wird bewertet?
- Welche bestehende XTend-Loesung ist betroffen?
- Welche App-, Component- oder RMT-Autoren wuerden die Entscheidung spueren?

## Entscheidung

Beschreibe die Entscheidung in einem Satz.

Erlaubte Outcomes:

- `adopt-native`
- `wrap-as-xtend-primitive`
- `build-owned-primitive`
- `keep-existing-owned-path`
- `defer-with-watch`
- `allow-runtime-dependency-exception`
- `reject-for-now`

## Native-First Precedence Check

| Rang | Option | Bewertung |
|------|--------|-----------|
| `1` | Browser-native Primitive direkt nutzen | `<accepted|insufficient|not-applicable>` |
| `2` | Browser-native Primitive als XTend-Primitive wrappen | `<accepted|insufficient|not-applicable>` |
| `3` | eigenes XTend-Primitive bauen | `<accepted|insufficient|not-applicable>` |
| `4` | Build-, Dev- oder Test-Dependency nutzen | `<accepted|insufficient|not-applicable>` |
| `5` | Runtime-Dependency zulassen | `<accepted|blocked|not-applicable>` |

Begruendung:

- Warum reichen fruehere Optionen oder warum reichen sie nicht?
- Welche Option reduziert XTend-Komplexitaet am staerksten?

## Evidence

| Evidence | Entscheidung | Notizen |
|----------|--------------|---------|
| `browserSupport` | `<pass|risk|fail|not-applicable>` | Zielbrowser, Baseline, Degradation |
| `performanceImpact` | `<pass|risk|fail|not-applicable>` | Mount, Hydration, Interaction, Scheduler, Bundle |
| `complexityImpact` | `<pass|risk|fail|not-applicable>` | entfernte Abstraktion, neue Adapterlast |
| `a11yImpact` | `<pass|risk|fail|not-applicable>` | Keyboard, Focus, ARIA, Screenreader, Motion, Contrast |
| `securityImpact` | `<pass|risk|fail|not-applicable>` | DOM, URL, Attribute, Property, Event, Supply Chain |
| `rmtImpact` | `<pass|risk|fail|not-applicable>` | Core Record, Syntax, Adapter, Source Map, Diagnostics |
| `contractParity` | `<pass|risk|fail|not-applicable>` | Contract, Runtime, Test, Docs, Report |
| `fallbackAndDegradation` | `<pass|risk|fail|not-applicable>` | Fallback, Degradation, Kill-Switch |
| `migrationImpact` | `<pass|risk|fail|not-applicable>` | Compatibility, SemVer, opt-in, residuals |

## Browser Support

- Zielbrowser:
- Mindestversionen oder Baseline:
- Known Gaps:
- Degradation:
- Review Date:

## Performance und Complexity

- Erwarteter Bundle-Effekt:
- Erwarteter Mount-/Hydration-Effekt:
- Erwarteter Interaction-Effekt:
- Scheduler-/Lane-Auswirkung:
- Entfernte XTend-Komplexitaet:
- Neue Adapter- oder Maintenance-Last:

## A11y

- Fokusmodell:
- Keyboard-Verhalten:
- ARIA-/Role-Auswirkung:
- Screenreader-Signal:
- Reduced-Motion-/Contrast-Auswirkung:
- Browser-Smoke oder manuelle Evidence:

## Security

| Sink | Beruehrt? | Policy |
|------|-----------|--------|
| `html` | `<yes|no>` | Trusted DOM oder Sanitizing |
| `attribute` | `<yes|no>` | Allowlist, URL Policy, Diagnostics |
| `url` | `<yes|no>` | Protokoll-, Origin- und Navigation-Grenze |
| `property` | `<yes|no>` | Property Policy oder No-Write-Begruendung |
| `event` | `<yes|no>` | typed Payload, keine Handler-Strings |
| `style` | `<yes|no>` | Token-, CSS-Property- oder Style-Sink-Policy |
| `import` | `<yes|no>` | Loader-/Manifest-Policy, Supply Chain |

## RMT Boundary

- RMT Core Record erforderlich: `<yes|no>`
- RMT Syntax erforderlich: `<yes|no>`
- Adapter Contract erforderlich: `<yes|no>`
- Source Maps erforderlich: `<yes|no>`
- Diagnostics erforderlich: `<yes|no>`
- Kernel importiert Host-/DOM-/Component-Typen: `no`

Begruendung:

- Wie bleibt der RMT-Kernel host-neutral?
- Welche Daten erreichen Core Records?
- Welche Runtime-Arbeit bleibt in Adapter, Fabric oder Component?

## Contract Parity

| Parity | Pfad oder Entscheidung |
|--------|------------------------|
| Contract | `<development/...>` |
| Runtime Artifact | `<runtime path or not-applicable>` |
| Tests | `<test command or planned gate>` |
| Docs | `<docs path or planned guide>` |
| Report/Evidence | `<report path or not-applicable>` |

## Fallback und Degradation

- Fallback-Strategie:
- Degradation-Status:
- Kill-Switch oder Feature-Flag:
- No-Fallback-Begruendung:
- User-facing Verhalten:

## Dependency-Auswirkung

- Neue Runtime-Dependency: `<yes|no>`
- Neue Dev-/Build-/Test-Dependency: `<yes|no>`
- Supply-Chain-Auswirkung:
- Exit-Plan, falls Dependency:

## Migration und Compatibility

- Bestehende Pfade betroffen:
- Migration opt-in oder default:
- SemVer-Auswirkung:
- Residuals:
- Rollback:

## Gate-Entscheidung

| Kriterium | Ergebnis |
|-----------|----------|
| ADR-Pflichtfelder vorhanden | `<pass|fail>` |
| Decision Outcome erlaubt | `<pass|fail>` |
| Browser Evidence dokumentiert | `<pass|fail>` |
| Performance-/Complexity-Evidence dokumentiert | `<pass|fail>` |
| A11y Evidence dokumentiert | `<pass|fail>` |
| Security Evidence dokumentiert | `<pass|fail>` |
| RMT Boundary dokumentiert | `<pass|fail>` |
| Contract Parity dokumentiert | `<pass|fail>` |
| Fallback/Degradation dokumentiert | `<pass|fail>` |
| Exit Plan bei Dependency vorhanden | `<pass|not-applicable|fail>` |

## Handoff

- Naechstes Workpackage:
- Naechstes Review:
- Blocker:
- Owner-Entscheidung:
