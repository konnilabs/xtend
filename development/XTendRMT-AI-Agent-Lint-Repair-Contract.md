# XTendRMT AI-Agent Lint Repair Contract

- Status: `accepted`
- Datum: 8. Mai 2026
- Contract: `xtend.rmt.ai-agent-repair-report.v1`
- Workpackage: `WP-E14-11`
- Epic: `EPIC-14-XTendRMT-DSL-Linter-und-Language-Server`
- Modul: `tools/rmt-linter/reporter.js`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-agent-report --json`
- Boundary: `no-rmt-kernel-import-of-xtend-types`

## Zweck

Der AI-Agent Repair Report ist die maschinenlesbare Schicht oberhalb von RMT-Linter und RMT-Code-Actions.

Er soll Agenten, IDEs und CI-Systemen nicht nur sagen, dass ein RMT-Dokument defekt ist, sondern:

- welche Diagnosen vorliegen
- welche Fixes sicher und in welcher Reihenfolge anwendbar sind
- welche Fixes bewusst nicht automatisiert werden
- welche Confidence und welchen Impact ein Schritt hat
- welche verwandten Diagnosen am selben Pointer mitbetrachtet werden muessen

Der Report ist kein neuer Diagnosekern. Er nutzt ausschliesslich:

- `xtend.rmt.linter.report.v1`
- `xtend.rmt.code-action-provider.v1`
- `xtend.rmt.workspace-edit.v1`

## Report Shape

```json
{
  "schema": "xtend.rmt.ai-agent-repair-report.v1",
  "status": "failed",
  "failOn": "error",
  "files": 1,
  "diagnostics": [],
  "repairPlan": [],
  "fixOrder": [],
  "noOps": [],
  "actionableCount": 3,
  "noOpCount": 2
}
```

Pflichtfelder:

- `schema`
- `status`
- `ok`
- `failOn`
- `files`
- `fileReports`
- `diagnostics`
- `repairPlan`
- `fixOrder`
- `noOps`
- `actionableCount`
- `noOpCount`
- Diagnosezaehler

## Repair Step Shape

```json
{
  "schema": "xtend.rmt.ai-agent-repair-step.v1",
  "order": 1,
  "title": "Schedule \"route.render\" anlegen",
  "diagnosticCode": "rmt.ref.schedule.unresolved",
  "pointer": "/routes/0/schedule",
  "severity": "error",
  "impact": "high",
  "confidence": "high",
  "safe": true,
  "repairKind": "create-schedule",
  "applyMode": "workspace-edit",
  "edit": {},
  "command": null,
  "relatedDiagnostics": []
}
```

`applyMode` ist:

- `workspace-edit` fuer direkte Dokument-Edits
- `command` fuer Operationen ausserhalb des Dokuments
- `manual` fuer zukuenftige manuelle Schritte

## No-Op Shape

```json
{
  "schema": "xtend.rmt.ai-agent-noop.v1",
  "diagnosticCode": "rmt.template.inline-script.refused",
  "pointer": "/templates/0",
  "severity": "error",
  "impact": "critical",
  "confidence": "none",
  "repairable": false,
  "reason": "unsafe-automatic-edit",
  "explanation": "Die Diagnose betrifft Security- oder Kernel-Boundary-Verhalten. Automatisches Entfernen waere zu riskant und benoetigt Review.",
  "relatedDiagnostics": []
}
```

Erlaubte MVP-Reasons:

- `source-not-parseable`
- `unsafe-automatic-edit`
- `component-stub-needs-authoring-context`
- `covered-by-related-repair`
- `no-safe-mvp-fix`

## Fix-Reihenfolge

Die Reihenfolge wird deterministisch sortiert:

1. Severity (`error`, `warning`, `info`, `hint`)
2. Reparaturtyp
3. Pointer
4. Titel

Damit koennen Agenten den Plan stabil Schritt fuer Schritt anwenden und nach jedem Schritt erneut linten.

## Confidence und Impact

Impact:

- `critical`: Security- oder Kernel-Boundary-Verletzung
- `high`: blockierende Fehler
- `medium`: Warnungen
- `low`: Infos und Hints

Confidence:

- `high`: sicherer Workspace-Edit oder expliziter Command aus dem Code-Action-Provider
- `none`: kein automatischer Fix

## CLI

```bash
xt rmt lint app.rmt --agent
```

`--agent` impliziert JSON-Ausgabe und erzeugt den AI-Agent Repair Report.

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Report ist stabil versioniert | accepted |
| Fix-Reihenfolge ist deterministisch | accepted |
| Confidence und Impact sind vorhanden | accepted |
| No-Op-Erklaerungen sind vorhanden | accepted |
| CLI kann Agent-Report ausgeben | accepted |
| keine neue RMT-Semantik im Reporter | accepted |
