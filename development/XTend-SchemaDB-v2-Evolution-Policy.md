# XTend SchemaDB v2 Evolution and Consolidation Policy

- Status: `accepted for SchemaDB v2 MVP`
- Inventory: `tests/schemas/xtend-schema-inventory.json`
- Scanner: `scripts/scan_schema_inventory.js`
- Gate: `node scripts/run_xtend_tests.js schema-inventory --json`
- Duplicate audit: `node scripts/scan_schema_inventory.js --audit-duplicates --json`
- Runtime boundary: `governance-index-not-runtime-registry`

## Purpose

SchemaDB v2 governs schema identity, exact aliases, version families and staged
migrations across XTend. It does not make runtime decisions and it is never
loaded by shipped modules. Small domain-local projections may expose constants
or compatibility resolvers, but the inventory remains their source of truth and
the schema-inventory gate verifies parity.

## Exact equality

Two identifiers are mergeable only when all of the following are true:

1. Their complete authoritative fingerprint sets are equal.
2. Every fingerprint is based on a complete formal schema, declared type or
   declared JSDoc contract.
3. Field names, nesting, requiredness, nullability, literals, enums, tuples,
   collection members and validation constraints are equal.
4. A domain owner confirms the same semantic role and invariants.

Runtime observations, tests, documentation, generated mirrors, unresolved type
references and partial shapes are review evidence. They can identify similarity
but cannot establish exact equality.

## Relationships

- `aliasOf` means identical contract identity and requires an equal released
  authoritative fingerprint set.
- `replacedBy` means a real contract migration. It targets a higher major
  version in the same family and requires compatibility and migration metadata.
- Alias targets are canonical entries. Alias chains and cycles are forbidden.
- Retired identifiers remain reserved tombstones and cannot silently reappear.

The scan-derived `status` remains separate from lifecycle state. Lifecycle uses
`active`, `deprecated` and `retired`; rollout uses `planned`, `dual-read`,
`canonical-write` and `complete`.

## Version policy

Schema identifiers use `vN` major-only versions. A new family begins with `v1`.
Any released structural or validation change creates the next major schema ID.
Descriptions, examples, defaults and governance notes may change without a new
schema version because they do not alter the accepted contract.

Exactly one managed version is current per family. Older versions either remain
supported explicitly or carry a replacement and sunset decision.

## Consolidation decisions

Every complete authoritative equality group has one curated decision:

- `consolidate`: introduce or select a canonical ID and migrate all members.
- `distinct-contract`: retain separate IDs and document semantic invariants not
  represented by the structural fingerprint.
- `defer-insufficient-evidence`: retain separate IDs until complete declared
  evidence and an owner decision exist.

An unreviewed authoritative equality group blocks the gate. Shape overlaps and
incomplete candidates remain reportable review items.

## Cleanup MVP

The five seven-field XTensions cleanup identifiers consolidate into
`xtend.xtensions.host-resource-cleanup-record.v1`:

- `xtend.xtensions.chart-cleanup-record.v1`
- `xtend.xtensions.leaflet-cleanup-record.v1`
- `xtend.xtensions.react-host-controller-cleanup-record.v1`
- `xtend.xtensions.three-cleanup-record.v1`
- `xtend.xtensions.vue-host-controller-cleanup-record.v1`

The shared record contains `hostId`, `surfaceId`, `xtensionId`, `resource`,
`status`, `sequence` and `timestamp` in addition to its canonical `schema`
discriminator. `xtend.xtensions.host-controller-cleanup-record.v1` remains a
separate six-field contract because it has no `xtensionId`.

Producers use the canonical ID. Readers may resolve the five legacy IDs for two
minor release windows. Removal is allowed only in a later major release; retired
IDs remain reserved in SchemaDB.

## Rollout waves

1. The cleanup family proves canonical write and legacy read behavior.
2. Same-domain diagnostics, negative fixtures, enterprise findings and RMT
   diagnostics receive declared contracts and owner decisions.
3. Reports and workpackage records are considered only after common declared
   contracts exist. Generic `{ ok, errors }` observations are not merged by
   shape alone.

## Required evidence

```bash
node scripts/scan_schema_inventory.js --audit-duplicates --json
node scripts/run_xtend_tests.js schema-inventory --json
node scripts/run_xtend_tests.js xtensions-imperative-host-pocs xtensions-react-host-controller-poc xtensions-vue-host-controller-poc xtensions-three-render-loop-poc --json
npm run test:pr:report -- --json
npm run test:release:full:report -- --json
```
