# RMT Kernel Security Hardening Migration

- Contract: `xtend.rmt.kernel-migration-authoring-incident-handoff.v1`
- Workpackage: `RKSH-WP-11`
- Status: `completed`
- Local gate: `node scripts/run_xtend_tests.js rmt-kernel-handoff-docs --json`

Dieses Dokument beschreibt die Migration fuer Hosts und RMT-Authoring, die bisher implizit erlaubte Runtime-Outputs genutzt haben. Seit der Kernel-Haertung gilt: HTML, Attribute, Properties und Remote Outputs werden erst committed, wenn die Trust-Schicht ein `RmtKernelRuntimeTrustVerdict` erzeugt hat.

## Wann eine Trust Boundary erforderlich ist

| Output | Trust Boundary | Migration |
|--------|----------------|-----------|
| `slot.html`, `prerender.html`, `fallback.html` | HTML muss vor jedem DOM-Commit bewertet werden. | `commitTrustedHtml` mit `sanitize html`, `html_fragment` und `safeFallbackHtml` nutzen. |
| Direkte DOM-HTML-Sinks wie `innerHTML`, `insertAdjacentHTML` und `template.innerHTML` | Diese Sinks bleiben privilegierte Trusted-DOM-Sinks. | Direkte Writes entfernen und den Runtime Trust-Sink-Adapter verwenden. |
| Attribute wie `href`, `src`, `srcset`, `action`, `formaction` und `srcdoc` | URL- und Sandbox-Policy entscheidet vor dem Commit. | `commitTrustedAttribute` verwenden und gefaehrliche Protokolle wie `javascript:` blockieren. |
| Event-nahe Attribute wie `onclick`, `onload` oder `onerror` | Event-Attribute sind keine erlaubten Markup-Outputs. | Commands oder registrierte Event-Handler statt HTML-Attributen verwenden. |
| Style- und DOM-Property-Writes wie `style`, `innerHTML`, `outerHTML`, `srcdoc` | Property-Policy bewertet Nebenwirkungen und DOM-Clobbering-Risiko. | `commitTrustedProperty` nur fuer explizit erlaubte Properties nutzen. |
| Remote Outputs und Adapter Outputs | Remote Surface Boundaries brauchen Scope, Origin, Capability und Integrity-Kontext. | Remote Outputs als `remote-surface` oder `adapter-output` scope in die Trust Authority geben. |

## Legacy-Pfade ersetzen

1. Direkte HTML-Commits aus Komponenten, Adaptern und Host-Bridges entfernen. Der Kernel darf `innerHTML`, `insertAdjacentHTML` oder Template-HTML nur ueber `commitTrustedHtml` erreichen.
2. HTML, das weiterhin erlaubt sein soll, als `html_fragment` markieren und durch `sanitize html` fuehren. Der Sanitizer muss `script`, `iframe`, `srcdoc`, `on*`, `javascript:` und vergleichbare gefaehrliche Patterns entfernen oder blockieren.
3. Reine Texte als Text schreiben: `textContent` ist fuer Labels, Status, Fehlermeldungen und User Content der bevorzugte Pfad.
4. Attribute trennen: `data-*` und `aria-*` bleiben normale strukturierte Attribute, URL-Attribute laufen durch `commitTrustedAttribute`.
5. Properties trennen: nur explizit erlaubte Properties laufen durch `commitTrustedProperty`; HTML-nahe Properties bleiben blockiert.
6. Fallbacks wie `fallback.html` nicht privilegieren. Recovery-Fallbacks muessen dieselbe Policy wie normale Outputs erfuellen und ein `safeFallbackHtml` besitzen.
7. Diagnose und Regression pruefen: `listTrustVerdicts()`, `rmt.kernel.panic`, `rmt.kernel.recovery` und `node scripts/run_xtend_tests.js rmt-kernel-security-regression --json` muessen nach der Migration gruen bleiben.

## SemVer-Auswirkung

Blockierte Legacy-Outputs koennen ein Breaking Change sein, wenn veroeffentlichte Hosts bisher bewusst unsicheres Markup gerendert haben und dieses Verhalten Teil der dokumentierten Integrationsoberflaeche war.

| Aenderung | SemVer |
|-----------|--------|
| Unsichere HTML-, URL- oder Event-Attribute werden neu blockiert und bestehende Apps koennen dadurch sichtbaren Content verlieren. | `major` |
| Unsichere Pfade erhalten Warnungen, Diagnostics oder Opt-in-Fallbacks, aber der bisher sichere Output bleibt sichtbar. | `minor` |
| Nur Docs, Tests, Report-Felder oder strengere Diagnostics ohne Output-Aenderung werden ergaenzt. | `patch` |

Release Notes muessen fuer behavior-changing Blocks mindestens die betroffenen Sinks, den Reason Code, den Recovery-Pfad und die empfohlene Migration nennen.

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-kernel-handoff-docs --json
node scripts/run_xtend_tests.js rmt-kernel-security-regression --json
node scripts/verify_xtendrmt_artifact_parity.js --json
```

