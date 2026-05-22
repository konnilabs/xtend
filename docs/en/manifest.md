# XTend Manifest

## Overview

The XTend Manifest is the central JSON file that defines all available XTend
components and their module paths. It acts as the single source of truth for the
loader and the API when components are loaded dynamically and modularly.

---

## Location and Name

- Default path: `components/manifest.json`
- The path can be changed when the loader is initialized.

---

## Manifest Structure

The manifest is a plain JSON object. Most keys match the canonical tag name of
an XTend component; reserved bootstrap keys such as `xstate` are allowed as
well. Each value is a concrete ES module address.

### Example

```json
{
  "xstate": "./xstate.js",
  "x-theme": "./xtheme.js",
  "x-button": "./xbutton.js",
  "x-input": "./xinput.js",
  "x-router": "./xrouter.js",
  "x-link": "./xlink.js"
}
```

### Conventions

- Custom element tags are canonical, **lowercase, hyphenated, and start with
  `x`** (for example `x-button`, `x-input`, `x-router`).
- Reserved bootstrap keys such as `xstate` are valid exceptions and are not
  interpreted as DOM tags.
- Values may be **relative**, **root-relative**, or **same-origin/loopback-local
  absolute** URLs.
- The loader resolves relative entries relative to the manifest URL.
- The default manifest path stays repo-local; CDN URLs are not the default or
  test path.
- Since `ER-WP-28`, external manifest/module URLs, `javascript:`, `data:`,
  `blob:`, path traversal, and non-JavaScript modules are refused by
  `xtend.security.manifest-policy.v1` and
  `xtend.security.import-policy.v1`.
- Comments are not allowed by the JSON standard and are invalid in a real
  manifest.

---

## Required and Optional Entries

- **Required:**
  - `xstate` as the bootstrap base module
- **Optional:**
  - `x-theme` (theme engine)
  - Additional custom components

---

## Extensibility

- The manifest can contain any number of components.
- Custom components are added by appending more key/value pairs.
- Experimental or beta components should use an explicit naming convention
  such as `x-section-beta`.

## Difference from XTendRMT

The XTend Manifest describes resolvable ES module paths for XTend components.
It is not the same as a `.rmt` document.

| File/Format | Responsibility |
|--------------|----------------|
| `components/manifest.json` | XTend Loader and component URL resolution |
| `xtendrmt/rmt.schema.json` | Schema reference for RMT documents |
| `.rmt` | Native app DSL with `adapters`, `components`, `routes`, `schedules`, `templates` |
| `xtendrmt/rmt-manifest.json` | XTendRMT product manifest, entry points, and artifact parity |

RMT component records may reference an XTend Manifest for manifest lookup, but
the RMT kernel does not read XTend runtime code from it. Resolution belongs to
`createRmtXtendComponentAdapter`.

Native RMT files should be served as `application/vnd.xtendrmt.rmt+json`. The
JSON fallback remains possible for special hosts, but it is not the recommended
authoring path.

---

## Best Practices

- The manifest is the **single source of truth** for resolvable component URLs.
- Keep the manifest current to avoid dead links and load failures.
- Production manifests should be minimized and omit unused components.
- `xstate` should always be present explicitly; `x-theme` follows directly
  after it when theme features are used.

---

## Validation

- Before loading, the loader verifies that the manifest and all module URLs are
  valid.
- Non-string values are ignored.
- Parsing and loading errors are written to the console log.
- Security refusals emit `xtend-loader-diagnostic` events with
  `xtend.security.loader.refused`, `xtend.security.manifest.invalid`, or
  `xtend.security.import.refused`.
- The local gate is `node scripts/run_xtend_tests.js manifest-import-policy --json`.
- After core changes, `node scripts/verify_xtend_core_contracts.js` can
  cross-check the bootstrap contract against manifest, API, and docs.

---

## Related Topics

- [XTend Loader](./xtend-loader.md)
- [Manifest Import Policy](./manifest-import-policy.md)
- [Component Development](./components.md)
- [API Integration](./api.md)
- [XTendRMT App DSL Reference](./xtendrmt-app-dsl.md)

---

*Last updated: May 5, 2026*
