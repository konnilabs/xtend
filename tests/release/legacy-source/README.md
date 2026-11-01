# Historical v1 audit reference

The six compressed source files are byte-for-byte copies of the commit recorded
in `binding.json`. The test-only loader checks every decompressed SHA-256 before
compilation. They preserve the old artifact, candidate, canary and pipeline
envelopes while exercising current shared candidate-integrity, product evidence,
ownership, archive and Union validators. Productive Core modules never import
this loader. Core v2 acceptance is tested separately in `core-contracts.test.cjs`.

Two explicit audit integrations in `legacy-runtime.cjs` strengthen the historical
reference: the current complete Demo pin verifier and exact raw app-file transfer.
They are not changes to the archived source bytes or evidence of an unchanged
historical release implementation. Tests compare actual archive/manifest bytes,
SRI and digest binding, invalid inputs, raw receipt transfer, and exact direct
versus pipeline Union guard errors. Core rejects these v1 envelopes.

Publisher registry tests use an explicitly scoped in-memory evidence boundary.
Their positive results prove state transitions; they do not grant production
source authority, FirstRelease retirement, CI acceptance or publication approval.
