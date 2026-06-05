# Native-First Authoring Guide

Dieser Guide ist der Einstieg für Autoren, die XTend-Komponenten oder App-Bausteine schreiben. Der stabile Pfad lautet: zuerst Browser-Primitive prüfen, dann XTend-eigene Primitives nutzen, danach RMT deklarativ ausdrücken und jeden Produktclaim an einen registrierten Contract binden.

## Entscheidungsreihenfolge

| Frage | Erwartung |
| --- | --- |
| Gibt es ein Browser-Primitive? | Nutze es direkt oder über ein dünnes XTend-Primitive, wenn Sicherheit, Scheduling oder Fallbacks nötig sind. |
| Braucht die Oberfläche eine Framework-Fähigkeit? | Nutze XTend-eigene Primitives für Theme, State, Events, Slots, Scheduler, Dialoge, Fokus, Formulare, Navigation und Media. |
| Reicht RMT aus? | Beschreibe die UI als RMT-Records, damit Source Maps, Diagnostics, Actions, Resources und DOM Descriptor Renderer erhalten bleiben. |
| Ist ein Produktclaim belegt? | Verweise auf eine registrierte Contract-ID und die passende lokale Prüfung. |
| Entsteht eine Runtime-Abhängigkeit? | Behandle sie als Ausnahme mit Audit, Exit-Plan und Budget-Nachweis. |

## Native-First Definition

Ein Native-First XTend-Baustein erfüllt diese Bedingungen:

- Er bevorzugt Browser-native Primitives, zum Beispiel Custom Elements, DOM Events, Form APIs, Dialog, Popover, CSS Containment, URL, Fetch und standardisierte Fokusregeln.
- Er kapselt Browser-Komplexität nur dort, wo XTend einen klaren Hebel liefert: Contracts, Scheduler-Lanes, Security Boundaries, Source Maps oder wiederverwendbare UI-Primitives.
- Er fügt keine produktive UI-Framework-Runtime hinzu.
- Er bleibt mit der Contract Registry nachweisbar.
- Er kann als RMT-first Oberfläche beschrieben oder aus einer RMT-Recipe abgeleitet werden.

Relevante Contracts:

- `xtend.native-first.mission-source-of-truth.v1`
- `xtend.native-first.dependency-diet-policy.v1`
- `xtend.native-first.contract-registry.v1`
- `xtend.native-first.performance-complexity-bundle-budget-gates.v1`
- `xtend.native-first.docs-authoring-guides.v1`

## Component Authoring

Beginne mit der kleinsten sichtbaren Oberfläche. Ein Button, ein Formularfeld, eine Navigation, ein Dialog oder ein Media-Preview sollen direkt über Browser-Events, Attribute, Properties und CSS steuerbar bleiben. XTend-eigene Wrapper sind sinnvoll, wenn sie wiederholte A11y-Regeln, Fokusmanagement, Scheduler-Lanes oder Trusted-DOM-Grenzen bündeln.

Der Standard für DOM-Ausgabe ist der DOM Descriptor Renderer. Er macht Tag, Attribute, Properties, URL-Felder, Text und Event-Routing explizit. Freie HTML-Sinks, Inline-JavaScript und direkte Host-Shell-Workarounds sind kein Authoring-Komfort. Wenn HTML bewusst verarbeitet werden muss, führt der Weg über Trusted DOM und Sanitizing.

Weiterlesen:

- [Trusted DOM und Sanitizing](./trusted-dom-sanitizing.md)
- [Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md)
- [RMT DOM Descriptor Renderer](./rmt-dom-descriptor-renderer.md)
- [RMT Component Template Primitives](./rmt-component-template-primitives.md)

## App Authoring

Für App Shells, Dashboards, Formulare, Overlays, Navigation, Data Display, Command/Search, Media und Docs Flow beginnt der Pfad bei RMT Recipes. Die Recipe beschreibt Struktur, State, Actions, Effects, Data Sources, Resources, Slots, Regionen und Surfaces. Der Renderer erzeugt daraus DOM Descriptor Records, damit die Oberfläche auditierbar bleibt.

Nutze den [Native-First RMT Recipes](./native-first-rmt-recipes.md) Guide, wenn eine UI aus mehreren Flächen besteht oder wenn eine manuelle Host-Shell verlockend wirkt. Für bestehende vendor-backed, legacy oder non-native Pfade führt der [Native-First Migration Guide](./native-first-migration-guide.md) durch Alternative, Prüfung und SemVer-Regel. Erst wenn eine Recipe einen echten Gap zeigt, wird ein neues XTend-Primitive oder eine Syntax-Erweiterung geprüft.

## Nachweis vor Freigabe

Vor einem produktiven Native-First-Claim müssen diese Signale vorhanden sein:

- Contract-ID ist in der Registry auffindbar.
- Lokale Prüfung ist benannt, zum Beispiel `contract-registry`, `native-first-budget-gates`, `rmt-complete-ui-recipes` oder `rmt-renderer-dom-descriptor-proofs`.
- Bundle-, Performance-, Interaktions- und Visual-Claims haben Budget-Nachweise.
- Browser-Lab- oder Visual-Claims nennen ein Artefakt oder bleiben als Residual sichtbar.
- Dependency-Ausnahmen besitzen Security-, Supply-Chain- und Exit-Plan-Nachweise.

Für die Freigabeprüfung nutze [Native-First Release Review](./native-first-release-review.md).

## Blockierte Claims

- Eine externe UI-Framework-Runtime ist kein Default.
- Runtime-Abhängigkeiten ohne Exit-Plan sind blockiert.
- Unsafe HTML, Inline-JavaScript, Eval und manuelle Raw-DOM-Sinks sind blockiert.
- Ein visueller Browser-Claim ohne Artefakt ist blockiert.
- Ein Contract-Claim ohne Registry-Eintrag ist blockiert.

## Minimaler Prüfpfad

```bash
node scripts/run_xtend_tests.js native-first-docs-authoring --json
node scripts/run_xtend_tests.js contract-registry --json
node scripts/run_xtend_tests.js native-first-budget-gates --json
node scripts/run_xtend_tests.js docs-public-quality --json
```

Erwartetes Signal: Die Guides, Contract-IDs, Menüeinträge und Budget-/Registry-Pflichten bleiben synchron.
