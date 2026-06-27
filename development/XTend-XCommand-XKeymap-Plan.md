# XTend XCommand und XKeymap Plan

- Status: `implemented`
- Datum: 27. Juni 2026
- Contract: `xtend.xcommand.kernel-contract.v1`
- Keymap Contract: `xtend.xkeymap.surface-contract.v1`
- RMT Schema: `xtend.rmt.xcommand.v1`
- Modus: `QS`
- Lokaler Gate: `node scripts/run_xtend_tests.js xcommand-kernel --json`

## Zielbild

XCommand wird als neue Kernel-Schicht zwischen RMT, XState und Fabric eingefuehrt. Die Schicht registriert Keyboard Commands, verarbeitet mehrstufige Key Chords nach GitHub-Muster, schreibt nur validierte Command-Resultate in XState zurueck und uebergibt Scheduling-, Lane- und Diagnostic-Signale an Fabric. XKeymap ist die zugehoerige App-Shell-Surface: ein i18n-faehiges, thembares Cheat-Sheet-Modal, das die in einer App registrierten Commands mit Icons, Labels, Scopes und Tastenkombinationen erklaert.

## Kernel-Grenzen

| Grenze | Entscheidung |
|--------|--------------|
| Eingabequelle | Browser-Host-Adapter normalisiert `KeyboardEvent` zu `XCommandKeyStroke`. |
| Registrierung | RMT, App-Shell-Code oder sichere Host-Adapter liefern `XCommandRegistration` Records. |
| Ausfuehrung | XCommand loest nur registrierte `actionRef`, `eventRef` oder `effectRef` aus. |
| XState | XCommand liest Scope-, Fokus- und Enabled-State ueber Selector-Contracts und schreibt nur `command.invoked`, `command.blocked`, `command.chord.timeout` und Keymap-UI-State. |
| Fabric | Fabric erhaelt Scheduler-Intent, Lane-Prioritaet, Cancellation- und Telemetrie-Signale, aber keine DOM-KeyboardEvents. |
| UI | XKeymap rendert ueber App-Shell-/Modal-Primitives und importiert keine Kernel-Interna. |

## Contracts

### `XCommandRegistration`

```ts
type XCommandRegistration = {
  id: string;
  scope?: string;
  when?: string;
  sequence: string[];
  label: { i18nKey: string; fallback: string };
  icon?: string;
  actionRef?: string;
  eventRef?: string;
  effectRef?: string;
  lane?: 'input' | 'interaction' | 'background';
  keymap?: { group: string; visible?: boolean; order?: number };
};
```

### `XCommandKernelApi`

```ts
type XCommandKernelApi = {
  register(record: XCommandRegistration): () => void;
  dispatch(stroke: XCommandKeyStroke): XCommandDispatchResult;
  resetChord(reason: 'timeout' | 'escape' | 'blur' | 'scope-change'): void;
  getKeymap(scope?: string): XKeymapEntry[];
};
```

### RMT Erweiterung

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

## XKeymap Modal

XKeymap wird als App-Shell-Modal mit den vorhandenen Overlay-, Escape-, Focus-Restore- und Theme-Konventionen geplant. Der Entwickler kann es per CSS Custom Properties stylen:

- `--xkeymap-backdrop`
- `--xkeymap-surface`
- `--xkeymap-border`
- `--xkeymap-key-bg`
- `--xkeymap-key-color`
- `--xkeymap-group-title-color`

Die Surface rendert Gruppen, Icons, lokalisierte Labels, Plattform-Varianten (`Mod` -> `⌘`/`Ctrl`) und optional Konflikt-/Disabled-Hinweise.

## QS-Umsetzungsplan

1. `contract-first`: Kernel-, XState-, Fabric- und RMT-Contracts als stabile Typen und Docs einfrieren. (implemented)
2. `parser-fixture`: RMT Parser um `xcommand` Records und negative Diagnostics fuer Konflikte erweitern. (implemented)
3. `kernel-runtime`: Sequenzpuffer, Timeout, Scope Matching, Chord Reset und deterministische Dispatch-Ergebnisse implementieren. (implemented)
4. `xstate-fabric-bridge`: Selector Reads, Command Result Writes, Fabric Lane Scheduling und Diagnostics anbinden. (implemented)
5. `xkeymap-surface`: Modal-Surface mit i18n Labels, Icons, CSS Theme Hooks, A11y und Focus Restore bauen. (implemented)
6. `app-shell-integration`: Native App Shell kann Commands deklarieren, Keymap oeffnen und scopespezifische Commands filtern. (implemented via public APIs)
7. `quality-gates`: Unit-, Parser-, Keyboard- und Surface-Contract-Gates in `scripts/run_xtend_tests.js` aufnehmen. (implemented)

## Akzeptanzkriterien

- Key Chords wie `g f` funktionieren mit Timeout, Escape, Blur und Scope-Wechsel als Reset-Gruende.
- Einfache Commands wie `Mod+S` blockieren Browser-Defaults nur bei registrierter, aktiver Command Policy.
- XState und Fabric kommunizieren ausschliesslich ueber dokumentierte Contracts.
- XKeymap kann vollstaendig aus registrierten `xcommand` Records generiert werden.
- Labels sind i18n-faehig, Icons optional, und Styles bleiben ueber CSS Custom Properties theme-faehig.
- Konflikte, unbekannte Action-Refs und ungueltige Sequenzen erzeugen Diagnostics statt Runtime-Ausfuehrung.

## Nicht-Ziele fuer den ersten Schnitt

- Freie Ausfuehrung unregistrierter Tastaturfolgen.
- Framework-spezifische Keyboard-APIs.
- Globale DOM-Listener ausserhalb des Host-Adapters.
- Persistierte User-Keybindings ohne separates Policy- und Migration-Design.
