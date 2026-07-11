# Changelog

This page explains how to classify public changes to XTend. The installed version lives in `package.json`; exports, declarations, and migration notes are the authoritative sources for integrators.

## Identify the installed version

Do not read the version from a generated banner or screenshot. Query the package directly:

```bash
node -p "require('./package.json').version"
```

Then compare `package.json` with the files that are actually installed. `api.d.ts`, `components/manifest.json`, and declarations under `components/*.d.ts` describe the public surface for that version.

## Classify a change

- **Additive:** A new export, optional attribute, or versioned schema expands the surface without breaking existing calls.
- **Behavioral:** Defaults, scheduling, hydration, or failure status change. Such a change needs an executable example and an updated gate report.
- **Migration:** A name, contract, or supported path is replaced. The old path remains for the documented transition or returns an explicit diagnostic.
- **Security fix:** Import, integrity, CSP, or trust rules become stricter. A silent compatibility fallback must not bypass that fix.

## Evidence required for a release

A release is more than a version number. The export-lock check must agree with TypeScript declarations, the pack dry run must exclude internal artifacts, and relevant browser and runtime gates must pass. [Release Verification](./release-verification.md) explains the sequence and how to read each report.

## Upgrade path

Identify affected public symbols before upgrading. Use the [RMT vNext Migration Notes](./rmt-vnext-migration-notes.md), [Component Long-Tail Migration](./component-long-tail-migration.md), or [XTensions Coexistence Guide](./xtensions-migration-coexistence-guide.md) for the relevant surface. Update source, fixture, and tests together instead of replacing compiled output alone.
