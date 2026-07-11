# RMT App Platform Fixture

- Schema: `xtend.epic18.rmt-app-platform-fixture.v1`
- Local Gate: `node scripts/run_xtend_tests.js rmt-app-platform-fixture --json`

The fixture covers `generic-catalog`, `admin-queue`, and `content-board` as domain-neutral RMT App Platform variants without manual `innerHTML` hosts.

## Purpose

The RMT App Platform Fixture shows how XTend checks app structure without committing to a specific industry or product shape. `generic-catalog`, `admin-queue`, and `content-board` are deliberately generic variants. They include common app building blocks such as lists, actions, status regions, navigation and empty states, but they avoid customer-domain language that could be mistaken for a product default later. This lets the gate verify App Platform behavior while the actual product semantics remain open.

The second purpose is the Trusted DOM boundary. The fixture must not require manual `innerHTML` hosts because RMT sources are expected to stay declarative. When a surface, collection or action is rendered, it flows through descriptors, loaders and owned components. The host can then decide which DOM sinks are allowed, and the app remains compatible with Native-First and Trusted DOM policies.

## Variants

`generic-catalog` checks a read-oriented app with a collection, detail region and light filter actions. This variant is useful when a team wants to know whether resources, selectors and surfaces connect cleanly. `admin-queue` focuses on tasks, status changes and executable actions. It proves that a command is bound to a clear RMT action and that the resulting state is written back into the surface. `content-board` checks an editorial view with grouped cards, preview behavior and an empty state without turning the fixture into a full CMS.

All three variants use the same evidence style: read the source, compile RMT, evaluate the runtime shape and confirm the host boundaries. An extension should enter the fixture only when it proves a new App Platform capability. Pure text or color changes belong in docs or visual examples, not in this gate fixture.

## Extension Rules

When adding a new variant, name the behavior before the domain. Good names describe structure, such as queue, board, catalog or review, and stay free of customer vocabulary. Then define which resource, surface, action and event prove the case. The local `rmt-app-platform-fixture` gate must run the case without network access, without an external renderer and without hidden build prerequisites. Only then does the variant count as release evidence.

## Related reading

The tooling guide shows how to lint and compile the fixture before running browser checks. [Related article](./rmt-app-platform-tooling.md)

## Run the fixture

```bash
node scripts/run_xtend_tests.js rmt-app-platform-fixture --json
```

On failure, inspect the suite, diagnostic code, and affected variant in the JSON report. Change `tests/fixtures/rmt-app-platform-fixture.rmt` next; regenerate core JSON only from an intentional source change.
