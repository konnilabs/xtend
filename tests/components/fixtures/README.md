# Component Test Fixtures

Component fixtures host minimal DOM examples for Component-Level-Tests.

Naming convention:

```text
<tag>.component.html
```

Rules:

- keep fixtures local and deterministic
- do not load production components from CDN when repo-local files exist
- expose a small result object only when browser execution is required
- keep test data separate from production code
- document intentionally unsupported slots, attributes or states in the owning component suite
