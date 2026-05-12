# XTendRMT vNext Event Governance Contract

- Status: `accepted by WP-E16-07`
- Datum: 12. Mai 2026
- Epic: `EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry`
- Contract: `xtend.rmt.vnext-event-governance-policy.v1`
- Governance Event Record: `xtend.rmt.vnext-event-governance-event.v1`
- Report Schema: `xtend.rmt.vnext-event-governance-report.v1`
- Workpackage: `WP-E16-07`
- Depends on:
  - `xtend.rmt.vnext-cross-surface-event-protocol.v1`
  - `xtend.rmt.vnext-enterprise-surface-registry.v1`
  - `xtend.rmt.vnext-event-action-contract.v1`
- Boundary: `no-implicit-global-event-bus`
- Boundary: `governance-reports-do-not-deliver-runtime-events`
- Zielzustand: `rmt-vnext-event-governance-ready`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-event-governance --json`
- Package Script: `npm run test:rmt-vnext-event-governance`

## Zweck

Contract marker:

```text
schema: "xtend.rmt.vnext-event-governance-policy.v1"
```

Dieser Contract macht Cross Surface Events operativ reviewbar. Er definiert Delivery Policies, Ownership-Regeln und Governance Diagnostics, ohne einen Runtime Event Bus zu implementieren. Der Report beantwortet fuer jedes Event:

- welche Delivery-Semantik gilt
- wie lange ein Event gueltig ist
- ob correlationId und idempotencyKey verpflichtend sind
- welche Sensitivity gilt
- wer Event-Version und Payload Schema besitzt
- welche Surface Owner durch den Event gekoppelt werden
- ob Cross-Team-Kopplung reviewed und genehmigt ist

## Delivery Policy

```json
{
  "schema": "xtend.rmt.vnext-event-governance-policy.v1",
  "event": "checkout.cart.updated.v1",
  "owner": "checkout-platform",
  "versionOwner": "checkout-platform",
  "payloadOwner": "checkout-platform",
  "delivery": {
    "mode": "queued",
    "ttlMs": 30000,
    "correlationId": "required",
    "idempotencyKey": "required",
    "sensitivity": "internal",
    "crossTeamReview": "approved"
  }
}
```

## Required Controls

| Control | Regel |
| --- | --- |
| Delivery Mode | nur `sync`, `queued`, `replayable` oder `drop-if-stale` |
| TTL | `ttlMs` ist im strikten Governance Gate Pflicht |
| Correlation | `correlationId` muss als required markiert sein |
| Idempotency | `idempotencyKey` muss als required markiert sein |
| Sensitivity | nur `public`, `internal`, `confidential` oder `restricted` |
| Owner Catalog | Event Owner muss bekannt sein und Event Namespace besitzen |
| Version Owner | Version Owner muss dem Event Owner entsprechen und Namespace besitzen |
| Payload Owner | Payload Owner muss dem Event Owner entsprechen und Payload Schema besitzen |
| Cross-Team Review | Cross-Team-Kopplung braucht `crossTeamReview: "approved"` |
| Protocol Status | blockierte Cross Surface Event Reports blockieren Governance |

## Diagnostics

| Code | Bedeutung |
| --- | --- |
| `rmt.vnext.event_governance.delivery_policy_missing` | Event hat keine Governance- oder Delivery Policy |
| `rmt.vnext.event_governance.delivery_mode_invalid` | Delivery Mode ist nicht erlaubt |
| `rmt.vnext.event_governance.ttl_missing` | TTL fehlt oder ist nicht positiv |
| `rmt.vnext.event_governance.correlation_id_missing` | correlationId ist nicht required |
| `rmt.vnext.event_governance.idempotency_key_missing` | idempotencyKey ist nicht required |
| `rmt.vnext.event_governance.sensitivity_missing` | Sensitivity fehlt oder ist ungueltig |
| `rmt.vnext.event_governance.owner_unknown` | Event Owner ist nicht im Owner Catalog autorisiert |
| `rmt.vnext.event_governance.version_owner_mismatch` | Version Owner widerspricht Event Owner oder Namespace |
| `rmt.vnext.event_governance.payload_owner_mismatch` | Payload Owner besitzt das Payload Schema nicht |
| `rmt.vnext.event_governance.implicit_coupling` | Cross-Team-Kopplung hat keine Review-Entscheidung |
| `rmt.vnext.event_governance.cross_team_review_missing` | Cross-Team-Review ist nicht approved |
| `rmt.vnext.event_governance.protocol_blocked` | vorgelagerter Cross Surface Event Report ist blockiert |

## Artefakte

| Artefakt | Pfad |
| --- | --- |
| Modul | `tools/rmt-language/vnext-event-governance.js` |
| Suite | `tests/rmt-language/rmt_vnext_event_governance_suite.js` |
| Fixture | `tests/rmt-language/fixtures/vnext-event-governance-fixture.json` |
| Workpackage | `development/WP-E16-07-Event-Ownership-Delivery-Policy-und-Governance-Diagnostics-bauen.md` |

## Gate

```bash
node scripts/run_xtend_tests.js rmt-vnext-event-governance --json
```

Das Gate prueft Delivery Modes, TTL, correlationId, idempotencyKey, Sensitivity, Owner Catalog, Version Owner, Payload Owner, Cross-Team-Kopplung, blockierte Protokolle, Package-Metadaten, Runner-Integration und deterministische Serialisierung.
