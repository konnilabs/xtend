# Epic18 RMT App Platform Release Handoff

- Schema: `xtend.epic18.rmt-app-platform-release-handoff.v1`
- Local Gate: `node scripts/run_xtend_tests.js epic18-rmt-app-platform --json`

Epic18 is complete. Release owners review `npm run test:pr:report`, `npm run test:release:full:report`, and `npm run pack:dry-run` before any publish step is approved.

## Release Boundary

This handoff marks the point where Epic18 moves from active App Platform work into release review. The scope covers the RMT App DSL, domain-neutral fixtures, Media Manager integration, Surface Manager connections and the editor/tooling evidence on the current release path. It does not approve new external UI framework defaults, does not create a production vendor default and does not allow silent loader breaks. Those items remain residuals or move into a separate epic boundary.

Release owners read this page together with the JSON report from `epic18-rmt-app-platform`. The report confirms that the App Platform variants share a contract, that fixture names such as `generic-catalog`, `admin-queue` and `content-board` stay domain-neutral, and that handoff claims are discoverable in package metadata. The page is therefore not a marketing wrap-up. It is the final technical checklist before publish approval.

## Required Evidence

`npm run test:pr:report` checks the fast regression line: runtime basics, references, RMT tooling, Maraca, Native-First and Owned RMT release paths. `npm run test:release:full:report` expands that line into the full release slice and writes the central JSON artifact for owners. `npm run pack:dry-run` confirms that the npm package contains the expected files and that unreviewed build artifacts do not slip into the publish candidate.

If any command fails, manual approval does not replace the handoff. The responsible owner maps the failure to a contract, documents the residual or repairs the evidence. For App Platform changes it is especially important that RMT sources remain declarative and that XTend components continue to be connected through owned loader and manifest paths. A green handoff says more than "tests passed"; it says the architecture boundary is still readable.

## Publish Decision

Before publishing, the release owner needs three signals: the latest successful gate report, a traceable package dry run and a clear statement about open residuals. Epic18 can close when residuals are known, not release-blocking and assigned to a next owner. Hidden dependencies, missing docs for visible guides or new host assumptions that are not described by a gate are not accepted. This page remains the anchor for that decision.
