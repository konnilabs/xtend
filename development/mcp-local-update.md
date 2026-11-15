# Lokales MCP Update nach den RMT Backendkorrekturen

Stand: **15. November 2026**. Dieser Bericht unterscheidet den Workspace-Server mit Compilerwerkzeugen vom separat betriebenen Hosted-Knowledge-Service. Die aktualisierte Codebase ist ein lokaler Worktree auf Ausgangscommit `02dcd815ebe4ddca196e82163191fe7360b95a05`; ein Deployment dieses Stands ist keine Veröffentlichung auf GitHub main.

## Betriebswege und Versionsgrenzen

| Betriebsweg | Aufgabe | Version und Zugriff |
| --- | --- | --- |
| Workspace MCP | Aktuelle Dokumente, RMT-Diagnosen, Compile-Check, Maraca-Plan und Repair-Plan | MCP 0.1, sechs Standardtools, stdio, Workspace-Schreibrechte weiterhin aus |
| Hosted MCP | Dokumente, Kontextsuche und versionierte Rezeptlisten | Hosted-Service 0.2.0, drei Read-only-Tools, HTTP auf `127.0.0.1:31415` |
| Lokales Deployment-Bundle | Kanonische Wissensdateien und deren Quellnachweis | Deskriptorformat 1 / Version 1.0.0, ausdrücklich `local-worktree` |
| Hosted-Rezeptkatalog | Snapshotgebundene Paginierung | Lokaler Herkunftsvertrag v2; bisherige explizit angefragte Upstream-Snapshots behalten v1 |

Der Hosted-Service wurde nicht durch den anders ausgestatteten Workspace-Server ersetzt. Sein Token-, Port-, Read-only-, Snapshotheader- und Rezeptvertrag bleibt erhalten. Im lokalen Modus ist die Herkunft in Readiness und Provenienz ausdrücklich sichtbar: `sourceKind`, `commitKind`, `sourceFingerprint`, `baseCommit` und `worktreeDirty`. Das bestehende Feld `commit` dient dort als opake Snapshot-ID aus dem Inhaltsfingerprint; es behauptet keinen GitHub-Commit.

## Wissensbuild und Quellbindung

Zuerst wird das kanonische RMT AI Developer Kit durch seinen Producer exportiert, anschließend wird das MCP-Bundle erzeugt. Der Knowledge-Builder prüft jetzt zusätzlich alle 43 deklarierten Kit-Quellhashes. Ein konsistentes, aber veraltetes Kit kann dadurch nicht mehr unbemerkt kopiert werden. Der Build erfolgt in einem Stagingverzeichnis; Validierungsfehler erhalten den vorherigen generierten Bestand. `--check` bleibt schreibfrei für die kanonischen Quellen.

Der aktualisierte Bestand enthält 356 vollständige Dokumente, 178 pro Sprache, 32 Referenzrecords und sechs Rezepte. Die Kit-Einträge bleiben ein kuratierter Einstieg und werden nicht als vollständige Grammatik ausgegeben. Die überarbeiteten Operatorreferenzen und der aktuelle Compiler definieren die jeweiligen Fähigkeiten.

Der [lokale Exporter](../products/xtend-mcp/scripts/export-local-bundle.mjs) bindet:

- sämtliche kanonischen Dokumente, das Menü und die sechs kanonischen Kit-Artefakte;
- die 43 vom Kit deklarierten kanonischen Inputs;
- ausdrückliche Compiler-/Action-/Event-/Surface-/Renderer-/Maraca-Pins;
- die kuratierte Kernel-Mitgliedschaft aus dem generierten Manifest einschließlich aller 79 Modul-Quellhashes, der Registry, der drei kanonischen Core-/Runtime-Bundles und der erzeugten Typ-/Schema-/Manifestdateien.

Veraltete Registry-, Modul- oder Ausgabecaptures werden abgewiesen. Es wird weder die gesamte Home-Umgebung exportiert noch eine Zugriffsdaten-Datei in das Bundle aufgenommen. Der Hosted-Service validiert den Export nochmals und verwendet für Retrieval eine private Kopie der bereits geprüften Artefaktbytes. Eine spätere Änderung am gemounteten Hostverzeichnis wird dadurch nicht zur stillen neuen Quelle.

```sh
node products/xtend-mcp/scripts/build-knowledge.mjs --check
node products/xtend-mcp/scripts/export-local-bundle.mjs --out /absoluter/deployment/pfad/bundle
```

## Workspace Server und dauerhafte SDK Auflösung

Die Repository-Konfiguration `.vscode/mcp.json` startet die Workspace-CLI über `${execPath}` und `ELECTRON_RUN_AS_NODE=1`. Auf diesem Rechner ist das der Code-Electron unter `/usr/share/code/code` mit **Node 24.22.1**; die globale Shell-Node-Version 22 wird dafür nicht verwendet.

Die fehlenden SDKs wurden ausschließlich für diesen Workspace unter `/home/konni/.local/share/xtend-mcp/workspace-runtime` installiert. Die Versionen stammen aus dem bestehenden Repository-Lock: Client 2.3.0, Node-Transport 2.1.2, Server 2.4.0 und Zod 4.6.6. Zwei zuvor fehlende, ignorierte Workspace-Verknüpfungen (`node_modules/@modelcontextprotocol` und `node_modules/zod`) zeigen auf diese dauerhafte Installation. Es gibt keinen temporären Loader und keine globale Node-/Paketaktualisierung.

Die exakt konfigurierte Startzeile wurde tatsächlich ausgeführt: MCP-Initialisierung, Discovery aller sechs Tools, ein erfolgreicher Compile-Check und ein erfolgreicher Maraca-Plan für die wiederholte Komponentenreferenz `scoped-products.rmt`. Die Installationsmetadaten samt vorherigem Zustand liegen in `workspace-runtime/installation.json`. Ein reguläres Workspace-`npm ci` kann die Verknüpfungen später durch normale lockkonforme Abhängigkeiten ersetzen.

## Hosted Dienst und Rückweg

Der bestehende Dienst verwendet das Compose-Verzeichnis `/home/konni/Documents/Codex/2026-10-15/kan/outputs/xtend-mcp`. Vor dem Update war ein auf GitHub main synchronisierender Snapshot vom 7. November aktiv; die Synchronisierung meldete `upstream_http_403`. Das lokale Profil ist deshalb ein ausdrücklicher Betriebsmodus, kein verdeckter Netzwerkfallback. Es synchronisiert nicht mit GitHub.

Vor einem Containerersatz wurden das bisherige Image separat getaggt, beide Compose-Dateien gesichert und das Knowledge-Volume aus einem nur lesenden Mount archiviert:

- Backup: `/home/konni/Documents/Codex/2026-10-15/kan/outputs/xtend-mcp/local-refresh/backups/20261115T191427Z`.
- Rollback-Image: `xtend-mcp:rollback-20261115t191427z`.
- Knowledge-Archiv: `knowledge.tar.gz`, SHA-256 `4e8454e5f3bbbd4f39a3251f153da01b8ab37016fb4c3c2cbc820c44f288f883`.

Das lokale Profil mountet das neue Bundle und das bestehende Knowledge-Volume nur lesend. Bisherige gültige Snapshot-Pins bleiben lesbar; sie erhalten weiterhin ihre historische Upstream-Provenienz. Der ursprüngliche Volume-Pointer wird nicht verändert. Der bestehende MCP-Zugriffstoken und die `.env` werden nicht rotiert. Der im lokalen Modus unnötige GitHub-Zugriffstoken wird dem neuen Prozess nicht mehr übergeben; die ursprüngliche Konfiguration für einen Rückweg bleibt gesichert.

Für einen gewöhnlichen Rückweg werden die gesicherte `compose.override.yaml` und das alte Image wieder aktiviert. Eine Datenrestauration ist bei unverändertem Volume nicht erforderlich:

```sh
mcp_deploy_dir=/home/konni/Documents/Codex/2026-10-15/kan/outputs/xtend-mcp
cp "$mcp_deploy_dir/local-refresh/backups/20261115T191427Z/compose.override.yaml" "$mcp_deploy_dir/compose.override.yaml"
docker tag xtend-mcp:rollback-20261115t191427z xtend-mcp:local
docker compose --project-directory "$mcp_deploy_dir" --env-file "$mcp_deploy_dir/.env" -f "$mcp_deploy_dir/compose.yaml" -f "$mcp_deploy_dir/compose.override.yaml" up --detach --no-build --force-recreate --no-deps --wait --wait-timeout 60 mcp
```

Die dauerhafte SDK-Installation ist davon unabhängig. Für ihren Rückweg werden ausschließlich die beiden dokumentierten Verknüpfungen entfernt, sofern sie noch auf die protokollierten Ziele zeigen. Andere Workspace-Abhängigkeiten und andere MCP-Server bleiben unberührt.

## Prüfung und Betriebsnachweis

Der aktuelle Knowledge-Driftcheck und alle **27 Workspace-MCP-Tests** bestehen. Dazu gehören die zuvor fehlgeschlagene Quellen-/Knowledge-Prüfung, die Catfoodingkonfiguration, die echten SDK-stdio-/HTTP-Grenzen und drei neue lokale Exportregressionen. Die vorbereitete Hosted-Implementierung besteht **20 Tests**, einschließlich expliziter lokaler Provenienz, Byte-/Mitgliedschaftsmanipulation, Snapshot-Pins, Authentifizierung und Paginierung.

Der abgenommene Kandidat wurde anschließend tatsächlich unter demselben Compose-Dienstnamen aktiviert. Der Container ist **healthy**; die automatische Rückkehr zur Sicherung musste nicht verwendet werden.

| Gegenstand | Tatsächlich aktivierter Stand |
| --- | --- |
| Container | `09552b8c03c75b3eab88ca9e3a5f1ed317ea823bfb44b6a5049754d5f17eac80` |
| Image | `sha256:571acb6f31002bf8b0e6b1a7cd728c9df83d363a3e7af28d1b9511f499c9bac9` |
| Snapshot-ID | `e53ee924e6024d7821ab913ad4d2fb3a6af4c077` |
| Quellfingerprint | `e53ee924e6024d7821ab913ad4d2fb3a6af4c077f7f33b07109d8e81546174de` |
| Captures | 485 Dateien, darunter 90 kuratierte Kernelquellen und 79 geprüfte Modul-Quellhashes |
| Persistentes Deployment | `local-refresh/e53ee924e602-ac6324b0cd59` im bestehenden Compose-Verzeichnis |

Die Live-Abnahme prüfte acht Ressourcen bytegenau gegen das aktuelle Bundle: die drei überarbeiteten Operatorseiten und die MCP-Seite in beiden Sprachen. Weiter bestanden Initialize/Discovery, Knowledge-Suche, lokaler Rezeptkatalog v2, Paginierung mit Snapshotbindung, ein bisheriger expliziter Upstream-Pin mit Rezeptkatalog v1, Authentifizierung, Host-/Originprüfung, die bestehende 64-KiB-Bodygrenze und ein erfolgreicher Folgeaufruf nach Ablehnung. Diese Hosted-Grenze ist unabhängig von der 4-MiB-Grenze des Workspace-HTTP-Servers.

Portbindung `127.0.0.1:31415`, Zugriffstoken und `.env` sind unverändert. Das historische Knowledge-Volume wurde nach dem Recreate Datei für Datei mit dem zuvor erzeugten Archiv verglichen und blieb bytegenau erhalten. Der ausführliche [Betriebsnachweis](mcp-local-update-evidence.json) enthält IDs, Ressourcenhashes, Source-Capture und Testergebnisse, aber keine Zugangsdaten. Zusätzliche operative Prüfdateien und die tatsächlich verwendeten Hosted-Quellen liegen im persistenten Deployment-Verzeichnis.
