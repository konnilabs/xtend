# Native-First Release Review

Dieser Guide beschreibt die öffentliche Prüfung für Native-First-Claims. Er hilft Verantwortlichen für Freigaben, Produkt-, Doku- und Audit-Nachweise zusammenzuführen, ohne interne Planungssprache vorauszusetzen.

## Prüfziel

Eine Native-First-Freigabe ist belastbar, wenn Autoren und Reviewer diese Fragen beantworten können:

- Welche Contract-ID belegt den Claim?
- Welche lokale Prüfung deckt die Contract-ID ab?
- Welche RMT Recipe oder welches owned Primitive erzeugt die Oberfläche?
- Welche Budget-Nachweise belegen Bundle, Performance, Interaktion und visuelle Stabilität?
- Welche Browser-Lab- oder Visual-Residuals bleiben sichtbar?
- Welche Dependency-Ausnahmen besitzen Security-, Supply-Chain- und Exit-Plan-Nachweise?

Relevante Contracts:

- `xtend.native-first.contract-registry.v1`
- `xtend.native-first.audit-evidence-pack.v1`
- `xtend.native-first.performance-complexity-bundle-budget-gates.v1`
- `xtend.native-first.rmt-renderer-dom-descriptor-proofs.v1`
- `xtend.native-first.docs-authoring-guides.v1`

## Review-Reihenfolge

| Schritt | Erwartetes Signal |
| --- | --- |
| Registry | Contract-ID, Status, Owner-Rolle, lokaler Check und Doku-Pfad sind auffindbar. |
| Authoring | Der Guide verweist auf Native-First Authoring oder RMT Recipes. |
| Sicherheit | Trusted DOM, URL, Property, Attribute und Event-Grenzen sind getrennt. |
| Budgets | Bundle-, Render-, Interaction-, Complexity- und Visual-Claims haben Schwellen oder Residuals. |
| Evidence | Audit Evidence Pack, Supply Chain und Redaction-Regeln decken release-nahe Nachweise ab. |
| Migration | Non-native, vendor-backed oder legacy Pfade bleiben als kontrollierte Folgearbeit sichtbar. |

## Budget- und Browser-Nachweise

Produktive Performance- oder Visual-Claims brauchen einen benannten lokalen Check. Wenn echte Browser-Artefakte lokal nicht verfügbar sind, muss der Claim als Residual sichtbar bleiben. Ein Screenshot, eine Viewport-Korrelation oder ein Browser-Lab-Bericht darf nicht stillschweigend simuliert werden.

Minimal relevante Checks:

```bash
node scripts/run_xtend_tests.js native-first-budget-gates --json
node scripts/run_xtend_tests.js native-first-evidence-pack --json
node scripts/run_xtend_tests.js contract-registry --json
node scripts/run_xtend_tests.js native-first-docs-authoring --json
node scripts/run_xtend_tests.js references --json
```

## Security- und Dependency-Prüfung

Die Prüfung blockiert Claims, wenn eine neue produktive Runtime-Abhängigkeit ohne Exit-Plan eingeführt wird, wenn ein unsicherer HTML-Sink genutzt wird oder wenn URL-, Property- und Event-Grenzen nicht über DOM Descriptor Records nachvollziehbar sind.

Akzeptabel sind Build-, Test- oder Doku-Abhängigkeiten nur dann, wenn sie nicht als Runtime-Default in das Frontend wandern und in den Audit-Nachweisen sichtbar bleiben.

## Review-Ergebnis

| Ergebnis | Bedeutung |
| --- | --- |
| `accepted` | Claim ist durch Contract, lokale Prüfung und Nachweise abgedeckt. |
| `accepted-with-residuals` | Claim ist nutzbar, aber Browser-, Visual-, Migration- oder Dependency-Residuals bleiben explizit. |
| `needs-migration-plan` | Claim zeigt einen vendor-backed, legacy oder non-native Pfad, der vor breiter Nutzung geplant werden muss. |
| `blocked` | Contract-ID, lokale Prüfung, Security-Grenze oder Budget-Nachweis fehlen. |

## Blockierte Freigaben

- Contract-Claim ohne Registry-Eintrag
- Runtime-Abhängigkeit ohne Exit-Plan
- Visueller Browser-Claim ohne Artefakt oder Residual
- Unsafe HTML, Inline-JavaScript, Eval oder Raw-DOM-Sink
- Framework-Parity-Claim ohne XTend-eigenes Primitive oder RMT Recipe

Weiterlesen:

- [Native-First Authoring Guide](./native-first-authoring-guide.md)
- [Native-First RMT Recipes](./native-first-rmt-recipes.md)
- [Native-First Migration Guide](./native-first-migration-guide.md)
- [Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md)
