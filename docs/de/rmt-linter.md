# RMT Linter

Diagnostik, JSON-Ausgabe und Agent Repair Reports für RMT Quellen.

## Worum es geht

Der RMT Linter liest Source, Parserdiagnosen und semantische Regeln und gibt stabile, maschinenlesbare Findings aus. Er verändert keine Quelldatei und kompiliert trotz schwerer Fehler keine scheinbar gültige App.

## Öffentliche Bausteine

- `tools/rmt-linter/cli.js` ist der Kommandozeilen-Einstieg.
- `tools/rmt-language/diagnostics.js` normalisiert Codes, Felder und Severity.
- `tools/rmt-language/rules/` enthält die regelbasierten Prüfungen.

- `xt rmt lint app.rmt`.
- `--json` für Tools.
- `--agent` für Repair Reports.
## CLI

```bash
xt rmt lint app.rmt
xt rmt lint app.rmt --json
xt rmt lint app.rmt --agent
xt rmt lint app.rmt --fail-on warning
node scripts/run_xtend_tests.js rmt-language-regression --json
```

Der Agent Report enthält `repairPlan`, `fixOrder`, `relatedDiagnostics`, erklärte `No-Op` Einträge und Diagnostiken wie `rmt.document.extension.fallback-used`. Das öffentliche Schema ist `xtend.rmt.tooling-docs.v1`; Reports können `xtend.rmt.linter.report.v1` und `xtend.rmt.ai-agent-repair-report.v1`.

AnimationEngine-Diagnosen decken unbekannte Effekte, ungültige `interrupt`- oder `reducedMotion`-Policies, fehlende `layoutKey` bei `shared-element`/`layout-flip`, unsichere Keyframe-Properties und fehlendes Filter-Opt-in bei `fade-blur` ab. Code Actions können unsichere Enum-Werte auf sichere Defaults setzen und fehlende Motion-Policy-Felder ergänzen, wenn die Diagnose auf einen konkreten Record zeigt.

## Empfohlener Ablauf

Linte die Source vor dem Compile. Behebe Syntaxfehler zuerst, danach unbekannte Referenzen und Policies; verwende Auto-Fixes nur, wenn der Report die konkrete Textänderung ausweist.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Reference](./rmt-reference.md)
- [RMT Language Server](./rmt-language-server.md)
