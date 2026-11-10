# A04.3.1 – Gepinnte lokale Provider-Modulgraphen

Stand: 2026-11-10. Statische lokale ESM-Abhängigkeiten sind im expliziten Begleiter und im regulären asynchronen Maraca-/CLI-Build einschließlich Browser-Boot implementiert. RMTX und XTensions 2.0 bleiben für 0.9.0 `preparing`; Lazy-/CSP-/Peer-Ladestrategien, HTTP-Integrität und vollständige Feature-Abnahme folgen eigenständig.

## Vertrag und Versionen

| Vertrag | Neuer Einstieg | Weiterhin unterstützt |
| --- | --- | --- |
| Kompositionsmanifest | `xtend.maraca.xtension-composition-manifest.v2` | v1: importfreie Provider |
| Kompositionsartefakt | `xtend.maraca.xtension-composition-artifact.v3`, API `3.0.0` | v1/API 1 und v2/API 2 |
| Kompositions-Build-Bericht | `xtend.maraca.xtension-composition-build-report.v3`, API `3.0.0` | v1/API 1 und v2/API 2 |
| Öffentliche Build-/Kompositions-API | `3.0.0` | nimmt auch die vollständigen bisherigen Datenverträge an |

Manifest v2 erweitert den bisherigen Vertrag um `modules`: eine vollständige, eindeutige Liste aller erreichbaren lokalen Quelldateien einschließlich der Provider-Entries. Jeder Eintrag enthält `module` als kanonischen projektbezogenen Pfad und `sha256` als exakten Digest der ursprünglichen Bytes. Der Entry-Digest muss zusätzlich zum bisherigen `provider.integrity.sha256` passen. Fehlende und ungenutzte Einträge werden zurückgewiesen. Das Inventar ist auf 256 Module begrenzt; jedes Modul darf höchstens 256 statische Imports enthalten.

```js
{
  schema: 'xtend.maraca.xtension-composition-manifest.v2',
  providers: [/* bisherige Entry-, Framework-, Peer- und Integritätsangaben */],
  hosts: [/* bisherige deklarationsgebundene Capability-Anforderungen */],
  modules: [
    { module: './ui/panel.mjs', sha256: '<64 Hex-Zeichen>' },
    { module: './ui/component.mjs', sha256: '<64 Hex-Zeichen>' },
    { module: './ui/format.mjs', sha256: '<64 Hex-Zeichen>' }
  ]
}
```

Die bestehenden Plan-/Config-v5-Verträge transportieren das explizit versionierte verschachtelte Manifest. Browser-Root v6, PlanRuntime v8, Kompositionsport v1, Host-API 6 und Größenbericht v2 behalten ihre bisherigen äußeren Datenformen. Die neue API verarbeitet beide Manifest-Versionen; Manifest v1 erzeugt weiterhin Artefakt/Bericht v1 für Plan v4 und v2 für Plan v5. Manifest v2 erzeugt Artefakt/Bericht v3 für beide Planversionen. Es gibt keine automatische Umdeutung alter Manifeste.

## Ausführungs- und Auflösungsregeln

- Zulässig sind benannte statische Imports einschließlich lokaler Aliase und Namespace-Imports. Importziele müssen explizite relative `.mjs`-/`.js`-Dateien sein. `../` ist nur innerhalb desselben Projektroots zulässig. Paketnamen, URLs, implizite Erweiterungen, Query-/Fragment-/kodierte Pfade und Importattribute werden abgewiesen.
- Alle Module bestehen auf oberster Ebene aus synchronen benannten Funktionsdeklarationen, den erlaubten Imports und benannten Exporten lokaler Funktionen. Default-Imports/-Exporte, Reexports und reine Nebenwirkungsimports werden im ersten Abschnitt abgewiesen. Importierte benannte Exporte werden vor der Ausgabe auf tatsächliches Vorhandensein geprüft.
- Top-Level-Aufrufe, Variableninitialisierer und Klassen sind im gesamten Graphen ausgeschlossen. Dynamische Imports, `require` und `import.meta` werden auch in verschachtelten Funktionskörpern abgewiesen. Asynchrone und Generator-Funktionsdeklarationen auf Modulebene sind ausgeschlossen.
- Zyklen werden vor jeder Ausgabemutation zurückgewiesen. Damit bleiben die rekursiven Ausgabeidentitäten eindeutig; eine spätere Erweiterung benötigt einen eigenen Vertrag.
- Quelldateien müssen reguläre Dateien unter ihrem kanonischen realen Projektpfad sein. Symlink-Ausbrüche und interne Symlink-Aliase sind ausgeschlossen.

Die Module werden beim nativen ESM-Import instanziiert. Dabei sind ausschließlich Deklarationen und Bindungen zulässig; Komponentenfactorys und Framework-Initialisierung laufen erst im bereits zugelassenen Mount-Job über **Kernel → Fabric → Peer-Lader → Providerfactory**. Peers bleiben extern und werden ausschließlich über den expliziten Anwendungslader und die bisherigen Versionsprüfungen bereitgestellt. Autoritätsentzug und Cancellation sperren verspätete Factory-Aufrufe. Das ist ein Vertrag für vertrauenswürdigen Anwendungscode, keine JavaScript-Sandbox für bösartige Funktionskörper.

## Quell- und Ausgabeprovenienz

Der Builder liest und prüft sämtliche gepinnten Originalbytes vor der ersten Ausgabemutation. Er arbeitet danach ausschließlich mit diesem Capture. Originalquellen werden weder ausgeführt noch während der Ausgabe erneut gelesen.

Die Ausgabe erhält pro kanonischem Quellmodul eine eigene native ESM-Datei unter `providers/modules/<Quellpfad>-<Ausgabe-SHA256>.mjs`. Nur die Stringliterale statischer Imports werden auf die erzeugten Abhängigkeiten umgeschrieben. Module ohne Imports behalten ihre exakten Bytes. Der Digest einer transformierten Datei ist ausdrücklich vom ursprünglichen Quell-Digest getrennt. Eine Änderung an einem Blatt verändert die Importreferenzen und damit die Ausgabeidentitäten seiner Vorfahren sowie die Manifest-gebundene Begleiteridentität. Bestehende adressierte Dateien dürfen nur bei identischen Bytes wiederverwendet werden.

Artefakt v3 enthält für jedes Modul `module`, `sha256`, `sourceBytes`, `fileName`, `outputSha256`, `outputBytes` und die ursprünglichen Importkanten `{specifier, module}`. Provider-Records verknüpfen Entry-Quell-Digest und transformierte Ausgabedatei. Der Laufzeitvertrag prüft Vollständigkeit, Pfade, Versionen, Kanten, Erreichbarkeit, Zyklen und die Bindung an den kompilierten Plan. Er behandelt diese Daten weiterhin als Build-Provenienz und behauptet keinen Browser-Byte-Nachweis.

Mehrere Imports derselben kanonischen Datei teilen deren ESM-Modulinstanz. Unterschiedliche Quelldateien behalten auch bei identischen Bytes getrennte Modulidentitäten. Eine allgemeine Deduplizierung nach Inhalt würde beobachtbare Funktionsidentitäten verändern und findet deshalb nicht statt.

## Größenbudget und Nachweise

Der bestehende Größenbericht v2 zählt jede tatsächlich erfasste Quellmoduldatei einmal, mit ihren ursprünglichen Bytes und ihrem Quell-Digest. Die gesamte transformierte Ausgabe einschließlich aller gemeinsamen Module wird anhand der tatsächlichen Dateien gemessen. Gemeinsam genutzte Abhängigkeiten werden einmal ausgegeben und einmal gezählt. Das private Producer-Capture, der vollständige Dateisatz und die erneute Prüfung der Ausgabedigests bleiben verbindlich; serialisierte Pläne können die Quellenautorität nicht rekonstruieren.

[`graph-inspect.cjs`](graph-inspect.cjs) prüft positive und negative Graph-/Build-Verträge sowie strikte React-/Vue-/Mixed-Builds. [`graph-evidence.json`](graph-evidence.json) bindet die Nachweise an die aktuellen Quellen. Die festen Referenzgrenzen bleiben **2.200.000 Framework-Bytes** und **240.000 XTension-Laufzeitbytes**; Gesamt- und XTension-Vergleich sind unabhängig.

Die tatsächliche jsdom-/Chromium-Suite verwendet die regulär erzeugten mehrteiligen Providergraphen für alle A04.2-Integrationsfälle und ergänzt fünf A04.3.1-Fälle für verzögerte Factorys, Cancellation und einen gemeinsamen React-/Vue-Graphen. Dadurch sind **305 Laufzeitfälle je Umgebung** und weiterhin **88 Compilerprüfungen** verpflichtend. Der Browser lädt die generierten Dateien als native HTTP-ESM-Module. Gepackte Root-/Compiler-/Maraca-Consumer bauen und booten den neuen Graphvertrag und prüfen die öffentlichen Typen ohne implizite Frameworkinstallation.

Das Vorbereitungs-Gate umfasst nun 14 blockierende Prüfungen. Historische Schemainventare und alle bisherigen autoritativen/veröffentlichten Fingerprint-Sets bleiben erhalten. API-/Schema-Versionen belegen den neuen Vertrag; sie erklären A04 oder Release 0.9 nicht für vollständig abgenommen.

## Nächste Grenze

A04.3 führt mit expliziten Ladeplänen, Peer-Auflösung und Lazy-/CSP-/Auslieferungsnachweisen weiter. Framework-SSR/Adoption bleibt A05; RMTX-Syntax und DX bleiben A06. Angular, Vanilla und eine abweichende übergeordnete owning Surface benötigen eigene Integrationsnachweise.
