# RMT vNext Migration Notes

These notes help teams move existing XTendRMT JSON documents toward the additive vNext syntax without destabilizing the production host. The path is intentionally reviewable: analyze first, produce a preview, then decide which records should really become `.rmt` sources.

## When this page matters

Use this page when a project already owns classic RMT documents, `docs/xtendrmt-docs-shell-vnext.rmt` examples or host adapters and wants to evaluate the new authoring path. Migration does not mean the runtime adapter changes. The compiler still emits Core records, source maps and diagnostics; the production adapter decision stays with the host.

The public contract is deliberately conservative:

- Existing JSON sources remain valid while the host keeps accepting them.
- vNext sources are additive and can be carried in parallel as `preview` output.
- Automatic migration must not silently hide lossy domains.
- The kernel stays free of host imports and UI component types.

## Compatibility matrix

The compatibility check is implemented by `tools/rmt-language/vnext-compatibility.js` and reports the schema `xtend.rmt.vnext-compatibility-matrix.v1`. It separates three questions that are often conflated in integration work: can the source be read, can it be represented semantically as vNext, and is the roundtrip to the previous Core shape stable enough for review?

Important anchors:

- `tools/rmt-language/vnext-compatibility.js`
- `tests/rmt-language/rmt_vnext_compatibility_suite.js`
- `xtendrmt/rmt-vnext-reference-demo.rmt`
- `xtendrmt/rmt-vnext-reference-demo.core.json`
- `docs/en/rmt-vnext-authoring.md`
- `docs/en/rmt-vnext-migration-notes.md`

The matrix is not a formatter. It is an audit artifact that integrators can read in pull requests. If it reports a `warning` or `error`, treat the migration as an engineering decision rather than a mechanical rewrite.

## report-only as the safe start

The first run should always be `report-only`. In this mode the tooling emits diagnostics, a domain mapping and a preview of the target syntax, but it does not rewrite working files. That matters when a project has custom adapters, historic schedule names or manifest keys that have not been normalized yet.

```bash
node scripts/run_xtend_tests.js rmt-vnext-compatibility --json
node scripts/run_xtend_tests.js rmt-vnext-regression --json
```

A green signal means the parser, compiler, compatibility matrix and regression gate can read the referenced sources. It does not mean every production app should automatically move to vNext. Review the source maps and diagnosed domains next.

## preview and apply plan

A `preview` is the right next step when the matrix has no blocking domains. It shows which `template`, `surface`, `lane`, `slot`, `when`, `trust boundary`, `sanitize`, `stream` and `on ... -> action` records would be produced from the legacy shape. The apply plan should become productive only after a developer confirms the domain mapping.

Copyable target shape:

```rmt
template xtend.vnext.reference {
  surface root {
    lane critical weight 10 {
      hydrate app-shell
      hydrate hero-panel when route.visible == true
    }
  }
}
```

If a host already uses Maraca, this preview is still a language migration. The bundle is still produced through `xt maraca build app.rmt --orchestration strict --kernel strict --transitions strict --json`; the migration only decides whether the source is a valid vNext authoring document. Existing `transition` blocks remain compatible. Add `animation` presets, `use animation`, `interrupt`, `reducedMotion`, `timeline` and `layoutKey` incrementally when an app needs richer motion.

## Lossy domains

The most important warning is `rmt.vnext.migration.lossy_domain`. It appears when a legacy domain can be read but cannot be represented in vNext without losing meaning. Common causes are free-form host extensions, implicit adapter conventions, unnamed schedule endpoints or records that only make sense through application code.

Treat this warning as a review blocker for automatic changes:

- Document the domain that would lose meaning.
- Decide whether the host needs an explicit vNext extension.
- Add missing payload contracts or resource ownership before a build becomes strict.
- Keep the legacy source as the source of truth until the new `.rmt` source explains the same Core output.

## Minimal verification path

Migration review stays local and network-free:

```bash
node scripts/run_xtend_tests.js rmt-vnext-parser rmt-vnext-compiler rmt-vnext-compatibility rmt-vnext-regression --json
node scripts/run_xtend_tests.js rmt-vnext-release --json
```

The release gate also checks that the migration notes, authoring guide and handoff document agree. If only this article changes, `rmt-vnext-release` is the shortest proof that the public terms did not drift.

## Specific failure modes

- If `rmt.document.extension.fallback-used` appears, the source was probably read from `.rmt.json`. That is allowed, but it should not be documented as the target path.
- If `rmt.vnext.migration.opt_in_required` appears, the explicit decision to create a preview or migration is missing.
- If `rmt.vnext.migration.lossy_domain` appears, an automatic apply is not reviewable.
- If the Core output in `xtendrmt/rmt-vnext-reference-demo.core.json` drifts, explain the compiler change first; then update docs and golden output together.

## Related reading

The authoring guide provides the target syntax used by every migration step on this page. [Related article](./rmt-vnext-authoring.md)
