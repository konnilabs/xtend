# VS-Code-Update für RMT Classic und RMTX

Stand: **15. November 2026**. Lokale Erweiterung **0.2.2**, installiert über die offizielle CLI von **VS Code 1.145.2**. Das Update übernimmt die korrigierte native Surface-/View-Lifecycle-Runtime, die regulär neu erzeugten öffentlichen Kerneloutputs sowie das aktualisierte AI-Kit und Knowledge-Paket. [Der vollständige Nachweis](vscode-rmtx-update.json) bindet Paket, tatsächliche Installation, Backendquellen und Editorprüfungen.

Die [Syntaxentscheidung](syntax-decision.md) bleibt angenommen. RMTX-Sprachmodus, TSX-Highlighting, Snippets und die eigenen RMT-/RMTX-Dateiicons bleiben erhalten. Das allgemeine produktive RMTX-Frontend und dessen semantischer Language Server sind mit diesem Editorupdate noch nicht implementiert.

## Paket und Installation

Der vorherige Installationsstand `ccs networks.xtend-rmt-language@0.2.1` wurde im normalen lokalen Profil durch den geprüften [VSIX 0.2.2](../../tools/rmt-editor/vscode/xtend-rmt-language-0.2.2.vsix) aktualisiert. Das Paket hat **25.240.059 Bytes** und SHA256:

```text
d9d3a116eacbaec9bd8f02399644ab5110642f1d86e6a7ea0c21369b4f3d0839
```

Ausgeführt wurde:

```sh
code --install-extension /home/konni/Downloads/xtend-dev/xtend/tools/rmt-editor/vscode/xtend-rmt-language-0.2.2.vsix --force
```

Die CLI beendet die Installation erfolgreich mit Exitcode 0. Die Registrierung des Defaultprofils führt Version **0.2.2** unter `/home/konni/.vscode/extensions/ccs networks.xtend-rmt-language-0.2.2`. Alle **5040 installierten Archivdateien** sind paketgleich. Bei `package.json` wurde ausschließlich das von VS Code zusätzlich eingefügte `__metadata` aus dem Vergleich ausgeschlossen.

Zusätzlich wurden **27 gezielt ausgewählte Paketdateien** gegen ihre tatsächlichen Repoquellen geprüft. Dazu gehören Renderer, View-Projection-Adapter, Surface Resource Graph und Planruntime jeweils samt Typen, die öffentlichen Kerneloutputs und `rmt-manifest.json`, Knowledge-/Dokumentartefakte, AI-Kit-Manifeste sowie Sprachkonfiguration, Grammatiken, Snippets und alle vier SVGs. Alle geprüften Bytes stimmen überein. Der interne `rmt-kernel-module-manifest.json` ist gemäß der unveränderten veröffentlichten Package-Dateiliste kein VSIX-Mitglied; die öffentlichen Ausgaben und das veröffentlichte `rmt-manifest.json` werden verglichen.

Die frühere [Installation 0.2.1](vscode-rmtx-update.before-lifecycle-fix.md) und ihr [JSON-Nachweis](vscode-rmtx-update.before-lifecycle-fix.json) bleiben bytegenau als historischer Stand erhalten. Auch der gültige [VSIX 0.2.1](../../tools/rmt-editor/vscode/xtend-rmt-language-0.2.1.vsix) wurde beibehalten.

## Tatsächliche Prüfungen

Ein separater **Headless-VS-Code-Extension-Testhost** lädt den tatsächlichen installierten Paketpfad in einem temporären Profil. Er aktiviert Version **0.2.2** unter VS Code **1.145.2 / Electron-Node 24.22.1** und beendet die Prüfung mit Exitcode 0.

Die **13 echten Hostprüfungen** bestehen: Paketentdeckung und Aktivierung, `.rmtx`-Sprachmodus, weiterhin vorhandenes Classic, RMTX-Grammatik, Abweisung der Classic-Lint-/Buildpfade für RMTX, keine Classic-Diagnosen, vier vorhandene Light-/Dark-Dateiicons, drei echte Editor-Snippet-Insertionen mit gültigem TSX und die registrierte Aktion zum Extensionhost-Neustart.

Zusätzlich sind grün:

- **11 RMTX-Editor-Untertests je Node 24.18.0 und Node 26.5.0**, ohne Fehler oder Skips.
- **16 echte TextMate-/Oniguruma- und Builtin-Abhängigkeitsprüfungen** unter VS Codes Electron-Node.
- **243 Assertions der vorhandenen Editor-Packaging-Suite**.
- Der **gebündelte MCP** startet über Electron im Node-Modus ohne `NODE_OPTIONS`: Initialize, sechs Tools, erfolgreicher Compile-Check mit Status `compiled` und der tatsächliche Scoped-Products-Maraca-Plan mit Status `planned`.

Die Dateiicons bleiben über **`contributes.languages[].icon`** eingebunden. Der echte Testhost bestätigt `vs-seti`; es wurden **keine User-/Workspace-Settings und kein Theme geändert**. Eine zusätzliche manuelle Explorer-Pixelabnahme wird nicht behauptet. Der offizielle [Language-default-icon-Vertrag](https://code.visualstudio.com/api/extension-guides/file-icon-theme#language-default-icons) beschreibt diesen Ergänzungsweg.

## Bereits laufende Instanz

**Installiert und im isolierten echten Host aktiviert ist 0.2.2. Der laufende Benutzerhost wurde nicht durch den Agenten neu gestartet.** Der zuvor vom Nutzer ausgelöste Neustart und die Aktivierung von 0.2.1 um **21:38:09** wurden separat beobachtet. Für die nun installierte Version 0.2.2 wird keine Aktivierung in dieser laufenden Codex-Sitzung vorweggenommen.

Wenn der aktualisierte Code in der laufenden Instanz übernommen werden soll, steht der Updatebutton **Restart Extensions** oder folgende Befehlspalettenaktion zur Verfügung:

```text
Developer: Restart Extension Host
```

Die registrierte ID lautet **`workbench.action.restartExtensionHost`**. Ihre Existenz wurde im echten Testhost erneut geprüft. Das offizielle [VS-Code-Updateverfahren](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace#_update-an-extension-manually) und die [CLI-Dokumentation](https://code.visualstudio.com/docs/configure/command-line#_working-with-extensions) beschreiben Update und Übernahme. Die Aktion wurde während des laufenden Agentenauftrags nicht auf die Benutzersitzung angewandt.

## Belege und Abnahmegrenze

Build-, Paritäts-, Unit-, Highlighting- und MCP-Belege liegen unter `/tmp/xtend-vscode-lifecycle-022/`; der tatsächliche Headless-Hostharness und sein `final-022`-Log unter `/tmp/xtend-vscode-rmtx-update/`. Der eingecheckte [JSON-Nachweis](vscode-rmtx-update.json), Format 1 / Version **1.1.0**, enthält die beobachteten Ergebnisse und zugehörigen Quell-/Paket-/Loghashes einschließlich der neuen Backend-Closure-Bindung.

Die [native Headerabnahme](native-header-check.md) bleibt ein gesonderter Runtime-Nachweis. Der Editor- und Pakettest ersetzt weder diese Abnahme noch die vollständige Releasefreigabe von RMTX und XTensions 2.0.
