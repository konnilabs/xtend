# XCommand and XKeymap Plan

XCommand is planned as a kernel layer for native app-shell keyboard commands. It will normalize keyboard input, support single shortcuts and GitHub-like key chords, and communicate with XState and Fabric through explicit contracts instead of DOM events or component internals.

## Runtime contract

The planned `xtend.xcommand.kernel-contract.v1` boundary contains three record types:

- `XCommandRegistration` declares an id, scope, keyboard sequence, i18n label, optional icon, action/event/effect reference, Fabric lane and keymap metadata.
- `XCommandKeyStroke` is the host-normalized keyboard input shape. Browser `KeyboardEvent` objects stay inside the host adapter.
- `XCommandDispatchResult` reports `invoked`, `pending-chord`, `blocked`, `conflict`, `timeout` or `ignored` outcomes for diagnostics and XState writes.

## XState and Fabric integration

XCommand reads command scope, focus context and enabled state through XState selectors. It writes only command lifecycle state such as invocation, blocked commands, chord timeout and keymap modal visibility. Fabric receives scheduler intent, lane priority, cancellation and telemetry records, but never raw DOM keyboard events.

## RMT syntax sketch

```rmt
xcommand "global.save" {
  keys: "Mod+S"
  label: i18n("commands.save", "Save")
  icon: "save"
  action: action.saveDocument
  lane: interaction
  keymap: group("file") visible(true)
}

xcommand "navigation.go-to-file" {
  keys: "g f"
  label: i18n("commands.goToFile", "Go to file")
  icon: "file-search"
  event: event.openQuickFile
  scope: "app-shell"
  keymap: group("navigation") order(20)
}
```

## XKeymap modal

XKeymap is planned as an app-shell modal that can be generated from registered `xcommand` records. It groups commands, shows icons, renders localized labels, maps platform-specific key labels such as `Mod`, and exposes CSS custom properties for shell-level theming.

Planned CSS hooks include `--xkeymap-backdrop`, `--xkeymap-surface`, `--xkeymap-border`, `--xkeymap-key-bg`, `--xkeymap-key-color` and `--xkeymap-group-title-color`.

## Quality sequence

1. Freeze contracts for XCommand, XState, Fabric and RMT.
2. Add parser and compiler fixtures for `xcommand` declarations and invalid command conflicts.
3. Implement the kernel sequence buffer, timeout handling, scope matching and deterministic dispatch results.
4. Add the XState/Fabric bridge and diagnostics.
5. Build the XKeymap modal with i18n labels, icons, theme hooks, accessibility and focus restore.
6. Integrate app-shell authoring and scope filtering.
7. Add unit, parser, keyboard, browser, accessibility and visual gates.

## Implemented baseline

The first code baseline ships `xcommand/xcommand.js` and `xcommand/xcommand.d.ts` as the public kernel contract. The runtime supports registration, deterministic dispatch results, scoped key chords, timeout reset writes, XState mirroring, Fabric scheduling records, RMT `xcommand` extraction and generated XKeymap entries.

The app-shell surface baseline ships `components/xkeymap.js` as the `x-keymap` Web Component. It renders a dialog-style cheat sheet from keymap entries, supports Escape/backdrop/button close behavior, restores focus, exposes `part` names for shell styling and includes CSS custom properties for themeable keymap surfaces.

## Browser fixture

`tests/browser/fixtures/xcommand-keymap-app-shell.html` is the first self-contained XTend fixture app for XCommand. It creates a simple app shell, parses local RMT `xcommand` declarations, updates an accessible command indicator for classic shortcuts and key chords, and renders an `x-keymap` modal from the generated keymap entries without external dependencies.
