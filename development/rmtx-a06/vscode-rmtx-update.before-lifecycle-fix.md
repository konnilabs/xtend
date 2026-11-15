# VS-Code-Update für RMT Classic und RMTX

Stand: **15. November 2026**. Lokale Erweiterung **0.2.1**, installiert über die offizielle CLI von **VS Code 1.145.2**. Die [Syntaxentscheidung](syntax-decision.md) ist angenommen. Der vollständige [Installations- und Hostnachweis](vscode-rmtx-update.json) bindet Paket, Quellen, Dateiicons und tatsächliche Editorprüfungen.

## Installierter Stand

Der vorherige Installationsstand `ccs networks.xtend-rmt-language@0.1.0-rc.2` wurde im normalen lokalen Profil durch den geprüften [VSIX 0.2.1](../../tools/rmt-editor/vscode/xtend-rmt-language-0.2.1.vsix) ersetzt. Das Paket hat **25.225.940 Bytes** und SHA256:

```text
9fa813f2291081a7285b6b2ad2dfae77603c8ef225f5d94688598897f83e533d
```

Ausgeführt wurde:

```sh
code --install-extension /home/konni/Downloads/xtend-dev/xtend/tools/rmt-editor/vscode/xtend-rmt-language-0.2.1.vsix --force
```

Die CLI meldet erfolgreiche Installation und Exitcode 0. Die Registrierung verweist auf `/home/konni/.vscode/extensions/ccs networks.xtend-rmt-language-0.2.1`. Alle **5040 installierten Archivdateien** wurden gegen den VSIX geprüft, ohne Abweichung. Bei `package.json` wurde ausschließlich das von VS Code zusätzlich eingefügte `__metadata` normalisiert. Erweiterungscode, RMTX-Sprachkonfiguration, beide RMTX-Grammatiken, die RMTX-Snippets und alle vier SVGs stimmen zusätzlich exakt mit den Repoquellen überein.

Der echte Hosttest fand vor dem Abschluss einen Aktivierungsfehler im vorläufigen Paket 0.2.0: Der Builtinordner heißt `typescript-basics`, seine tatsächliche Extension-ID lautet jedoch `vscode.typescript`. **0.2.1 verwendet die richtige ID und aktiviert erfolgreich.** Der fehlerhafte Zwischen-VSIX wurde aus dem Worktree entfernt.

## Echte Editor- und Iconprüfung

Ein separater **Headless-VS-Code-Extension-Testhost** wurde mit temporärem Userprofil, eigener Extensiondirectory und dem tatsächlich installierten Paketpfad gestartet. Der Benutzerhost wurde dabei nicht neu gestartet. Der echte Host **VS Code 1.145.2 / Electron-Node 24.22.1** beendet die Prüfung mit Exitcode 0.

Die 13 Hostprüfungen sind grün:

- Das installierte Paket wird gefunden und tatsächlich aktiviert.
- Die vorhandene `.rmtx`-Fixture erhält den Sprachmodus `rmtx`; `rmt` bleibt registriert.
- Der RMTX-Grammatikbeitrag mit `source.rmtx` ist vorhanden.
- Aktive Classic-Lint- und Buildbefehle weisen die RMTX-Datei zurück, ohne sie an Classic zu delegieren.
- Für die RMTX-Fixture entstehen keine Classic- oder anderen Diagnosen.
- Alle vier Light-/Dark-Dateiicons sind im tatsächlichen installierten Paket vorhanden.
- Alle drei neuen Snippets werden im echten Editor mit `vscode.SnippetString` eingefügt; selbstschließende, gepaarte und Expressionformen sind gültiges TSX ohne Parsefehler.
- `workbench.action.restartExtensionHost` ist im echten Host registriert.

Die Syntax-Tokenisierung wird zusätzlich durch den separaten TextMate-/Oniguruma-Test der Erweiterung geprüft. Diese Hostabnahme behauptet keine bereits implementierte allgemeine RMTX-Typ-/Rename-/Completionintegration und keinen produktiven RMTX-Compiler.

Die Icons sind als **Language-default-icons** über `contributes.languages[].icon` registriert. Es wurde **kein Icon-Theme und keine User-/Workspace-Einstellung geändert**. Die bestehende Userkonfiguration setzt kein eigenes Icon-Theme; eine Workspace-Override ist nicht vorhanden. Der wirksame Default wurde im echten Testhost als `vs-seti` bestätigt. Das installierte Seti-Theme besitzt keine eigenen `rmt`-/`rmtx`-Mappings und deaktiviert Language-Icons nicht. Damit bleibt der bestehende Iconbestand erhalten und die beiden neuen Sprachicons ergänzen ihn. Eine manuelle Explorer-Pixelprüfung wurde nicht durchgeführt. Der offizielle [Language-default-icon-Vertrag](https://code.visualstudio.com/api/extension-guides/file-icon-theme#language-default-icons) beschreibt diesen Ergänzungsweg.

## Übernahme in der bereits laufenden Instanz

**Installiert und in einem echten isolierten Host aktiviert ist 0.2.1. Die aktuelle VS-Code-/Codex-Sitzung wurde nicht erzwungen neu gestartet.** Im Benutzerlog ist bislang nur die frühere RMT-Aktivierung vom 15. November um 17:49:53 beobachtet; eine erneute Aktivierung des aktualisierten Codes in diesem laufenden Host wurde nicht behauptet.

Für die Übernahme im bereits laufenden Host kann der Updatebutton **Restart Extensions** verwendet werden. Alternativ in der Befehlspalette ausführen:

```text
Developer: Restart Extension Host
```

Die ID **`workbench.action.restartExtensionHost`** und der Titel sind in der installierten VS-Code-Anwendung belegt; die ID wurde im echten Testhost zusätzlich als registriert geprüft. Diese Aktion startet den Extensionhost. Sie wurde hier nicht auf die laufende Codex-Sitzung angewandt. Das offizielle [VS-Code-Updateverfahren](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace#_update-an-extension-manually) benennt den Restart nach dem Extensionupdate; die [CLI-Dokumentation](https://code.visualstudio.com/docs/configure/command-line#_working-with-extensions) belegt den verwendeten lokalen VSIX-Updatepfad.

## Lokaler Betriebsnachweis

Die vollständige vorherige Extension und ihr Registrierungseintrag sind vor dem ersten Installationsschritt temporär gesichert unter `/tmp/xtend-vscode-rmtx-update/previous-extension-0.1.0-rc.2.tar.gz` und `previous-extension-registration.json`. Der vorherige Verzeichnisstand wurde nicht manuell gelöscht. Die Sicherung ist ein temporärer lokaler Betriebsbeleg, kein separat veröffentlichtes Releasepaket.

Die isolierten Logs und der tatsächliche Testharness liegen unter `/tmp/xtend-vscode-rmtx-update/`. Der eingecheckte [JSON-Nachweis](vscode-rmtx-update.json) enthält die beobachteten Hostdaten, alle Prüfnamen, die eingefügten Snippettexte und die zugehörigen Quellen-/Paket-/Loghashes. Die native Headerabnahme bleibt ein eigener [Gatebericht](native-header-check.md) und ist durch diesen erfolgreichen Editorlauf nicht automatisch freigegeben.
