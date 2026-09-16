# Observatory API intake

The weekly producer and repository intake run sequentially in the existing
**XTend Web Platform Watch** task: research, GitHub grounding, publish,
read-back, intake, validation, pull request. The Monday schedule remains
09:00 Europe/Berlin. Intake starts after successful publication and read-back,
not at a guessed second clock time.

## Live handoff validated on 2026-09-16

- API: `https://xtend-platform-observatory.konnilabs.chatgpt.site/api/findings`
- Schema: `/api/findings/schema`
- Both authenticated GETs returned HTTP 200 and JSON.
- Exact response: 66,050 bytes, SHA-256
  `07a0094dd902a5e2c0bf6af0e51865991dbae9092b11698068438cdd339a5529`.
- Snapshot: 21 findings, including five new IDs dated September 7 and 14.
  The other 16 objects equal the August 31 snapshot, including nested values.
- API payload validated against the retrieved JSON Schema, including formats.
- Repository grounding: `f4499db66f403c476d25690db528e2941757c2af`.
- All 21 IDs have a review proposal; all referenced paths and symbols exist.
  The five new findings were checked against their primary release sources.
  Unchanged findings retain explicitly dated historical browser evidence.
- `NFM-OBS-2026-09-14` uses the latest finding update date. This is a cumulative
  API snapshot, including the September 7 backlog, not a reconstructed weekly
  batch. The API exposes neither a run ID nor a producer-completion flag.
  The live run validates snapshot transport and intake; it does not assert an
  unavailable historical producer-completion signal.

## Recurring procedure

1. Resolve the existing Site through Sites and read its current machine token.
   Send it only to that Site in `OAI-Sites-Authorization: Bearer ...` and
   `Authorization: Bearer ...`. Never log or commit it; do not rotate it.
2. After every publication batch succeeds, fetch the API JSON and verify every
   published finding ID and grounded commit against the producer's complete
   expected set. A partial or failed publication is not a completed handoff.
   If there is no new publication, process only previously verified, completed
   handoffs that remain absent from the repository. Do not infer completion
   from a date or HTTP 200 alone.
3. Read `main`, the run index and existing PRs. Compare finding IDs and content,
   not response ordering alone. Reuse an existing PR for the same report/hash;
   skip unchanged snapshots and reports already ingested. A closed, unmerged
   PR needs investigation before creating a replacement.
4. Preserve the full response bytes under `raw/`. Never reconstruct an old
   weekly batch from a mutable cumulative feed. Record the actual source,
   access date, report-date basis, both hashes and missing producer provenance.
   Validate individual findings against the API schema; its POST batch limit
   of 25 does not limit a cumulative GET snapshot.
5. Create exactly one review proposal per finding in raw order. Verify changed
   claims against primary sources and current repository code. Link repeated
   IDs to their most recent prior occurrence and declare the exact top-level
   delta, even when intervening runs contain different IDs. Keep browser
   shipping, beta, preview, trials and missing evidence separate.
6. Propose a terminal disposition for additional product work. Without the
   required adoption evidence, use `reject-for-now` with a concrete reason and
   review trigger. This does not revoke existing accepted primitives. Never
   manufacture human sign-off, cross-engine evidence or a new Radar entry.
7. Append the run index and update only the package's current-run/intake/review
   aliases. Preserve historical raw files, reviews, ADRs and the September
   product-adoption baseline. Validate using the existing profile:

   ```bash
   node scripts/run_xtend_tests.js --profile feature-adoption-observatory
   git diff --check
   ```

8. When validation passes and there is a real diff, push a dedicated branch and
   open a PR against `main`. Include report identity, snapshot hash, new and
   changed findings, evidence corrections, validation and architecture decisions.
   Merging remains the owner's review step. If delivery or validation fails,
   report the concrete failure and retain the payload for a later retry.

The existing scheduled task executes these instructions. This directory does
not add a second scheduler or a GitHub Actions cron.

## Architecture review from this snapshot

| Finding | Decision needed | Current disposition |
| --- | --- | --- |
| HTML streaming insertion, Chrome 154 Beta | Can a safe native parser sink preserve descriptor ownership, Trusted Types, cancellation and hydration identity? Evaluate an isolated lab before designing an adapter. | Significant design opportunity; no production sink authorized. |
| WebTransport send groups, Firefox 155 | Decide transport/server support, Fabric priority mapping, fairness, cancellation and fallback before choosing a new transport. | Separate ADR if pursued; current transport retained. |
| Module retry recovery, Firefox 155 | Separate transient network/MIME failures from evaluation and policy failures; retain bounded retries and SRI. | Browser regression lab candidate. |
| Fetch response delivery, WebKit TP 252 | Measure first-frame latency and cancellation with delayed NDJSON frames in preview and stable engines. | Preview fix; no stable-Safari claim or timeout change. |
| Camera/microphone capability elements, Chrome 153 | Establish a capture use case and explicit permission/track ownership before adding a component. | No new capture component authorized. |

Primary sources are attached to each review record. Notify the owner when new
evidence materially changes security, ownership, fallback requirements,
deprecations or an existing ADR, with concrete affected paths, options and the
smallest validating experiment. The HTML sink is the main design question in
this live intake; it does not create an immediate migration obligation.
