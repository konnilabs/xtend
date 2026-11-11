# A04.3.3 – Gemeinsame Peer-Auflösung mit getrennten Host-Lifetimes

Stand: 2026-11-11. Exakt kompatible React-/Vue-Provider teilen innerhalb einer konkreten Host-Factory einen Peer-Ladeversuch und dessen erfolgreiches Ergebnis. Der Einstieg ist explizit versioniert. RMTX und XTensions 2.0 bleiben für 0.9.0 `preparing`; CSP-/HTTP-Integrität und die vollständige Feature-Abnahme bleiben offen.

## Versionierter Vertrag

| Vertrag | Neue Version | Vollständig weiter unterstützt |
| --- | --- | --- |
| Kompositionsmanifest | `xtend.maraca.xtension-composition-manifest.v4` | v1/v2/v3 einschließlich ihrer Ladearten |
| Kompositionsartefakt | `xtend.maraca.xtension-composition-artifact.v5`, API `5.0.0` | v1/v2/v3/v4 |
| Kompositions-Build-Bericht | `xtend.maraca.xtension-composition-build-report.v5`, API `5.0.0` | v1/v2/v3/v4 mit ursprünglichen API-Versionen |
| Ladeplan | `xtend.maraca.xtension-load-plan.v2` | v1 mit Peer-Anforderungen je Provider |
| Öffentliche Build-/Kompositions-API | `5.0.0` | Verarbeitung aller bisherigen Datenversionen |

Manifest v4 übernimmt die gepinnten lokalen Providergraphen und das verzögerte Provider-Laden aus [A04.3.2](loading.md). Es verlangt:

```js
loading: { provider: 'on-mount', peers: 'shared' }
```

Manifest v3 behält `peers: 'per-host'` und `loadPeers({provider, signal})`. Gemeinsames Laden verwendet ausschließlich den neuen Anwendungslader:

```js
await app.boot({
  fabric,
  xtensions: {
    grants,
    async loadPeerGroup({ group, signal }) {
      // group: { id, framework, versions, providerIds }
      // Vertrauenswürdige Anwendung liefert exakt passende externe Peers.
      return resolveApplicationPeers(group.framework, group.versions, signal);
    }
  }
});
```

`loadPeerGroup` liefert `{React, ReactDOM}` oder `{Vue}`. Gruppenmetadaten und der Aufrufkontext sind eingefroren. Fehlende, vertauschte oder gleichzeitig angegebene Loader-Ports werden zurückgewiesen. Der Kompositionsport erfasst die Anwendungscallbacks synchron vor dem asynchronen Boot. Provider und Framework-Peers werden weiterhin weder implizit installiert noch aus Manifest-URLs geladen.

Plan-/Config-v5, Browser-Root-v6, PlanRuntime-v8, Kompositionsport-v1, Host-API-6 und Größenbericht-v2 behalten ihre äußeren Datenformen. Der neue verschachtelte Vertrag führt eigene Versionen. Root-Exports bleiben bei 214 mit unverändertem Fingerprint.

## Ableitung und Zulassung

Ladeplan v2 enthält `peerGroups` mit `id`, `framework`, `versions` und sortierten `providerIds`. Genau gleiches Framework und genau gleiche vollständige Peer-Versionstupel ergeben eine Gruppe. Eigene Provider-Versionen und Provider-IDs verhindern das Teilen kompatibler Peers nicht. Abweichende Frameworks oder Peer-Versionen bleiben getrennt; SemVer-Bereiche werden nicht aufgelöst. Gruppen-IDs werden deterministisch aus der sortierten Menge dieser Tupel vergeben und gelten innerhalb des jeweiligen Artefakts.

Die bisherigen Providerzeilen behalten Dateien, vollständige transitive Modulabschlüsse, Exporte und die Phase `kernel.fabric.mount`. Ihr Peer-Feld lautet jetzt `{mode: 'shared', groupId}`. Der Laufzeitvertrag leitet den gesamten Ladeplan erneut aus Manifest und geprüftem Modulgraphen ab und verlangt kanonische Gleichheit. Manipulierte Gruppen, Mitglieder, Versionsbindungen oder Provider-Zuordnungen können keine Ladeautorität hinzufügen.

Der tatsächliche Pfad bleibt **Host-Rechteprüfung → echter Kernel-Mount-Job → Fabric → nativer Provider-Import → gemeinsame Peer-Auflösung → exakter Versionsabgleich → eigene synchrone Komponentenfactory → eigener Framework-Root**. Jeder Host benötigt seine eigenen Grants und erhält weiterhin nur seine begrenzten Fähigkeiten. Teilen von Peers vereinigt weder Host-Identitäten noch Ressourcenleases, Komponenten, Framework-Roots oder Work-Budgets.

## Cache, Abbruch und Wiederholung

Der Cache gehört ausschließlich einer konkreten Host-Factory. Es gibt keinen prozessweiten, globalen oder Boot-übergreifenden Cache. Der erste zugelassene Verbraucher installiert den gemeinsamen Promise-Eintrag vor dem synchronen Loader-Aufruf. Weitere zugelassene Hosts können denselben laufenden oder erfolgreichen Versuch verwenden, auch über verschiedene kompatible Provider hinweg.

Jeder Host wartet mit seinem eigenen Lifetime-Signal und bleibt nach erfolgreichem Mount als Verbraucher registriert. Sein Dispose entfernt ausschließlich seine Teilnahme. Solange ein Geschwister lebt, bleiben der gemeinsame Cache und dessen eigenes Signal gültig. Beim letzten Verbraucher wird der Eintrag verworfen und das Gruppensignal abgebrochen. Eine spätere Host-Inkarnation erhält einen neuen Ladeversuch; ein neuer Boot eine neue Factory.

Das Gruppensignal erlaubt kooperative Bereinigung im Anwendungslader. Der logische Drain wartet nicht darauf, dass ein Lader das Signal beachtet. Ein verspätetes Ergebnis eines verworfenen Versuchs wird vor Normalisierung, Cache-Veröffentlichung und Factory-Aufruf abgefangen. Ein verspäteter Fehler darf einen neueren Eintrag derselben Gruppe nicht entfernen. Native Provider-Imports behalten ihre Transportgrenze aus A04.3.2.

Loader-Fehler, ungültige Peer-Strukturen und Versionsabweichungen entfernen den fehlgeschlagenen Versuch. Ein späterer zugelassener Host darf innerhalb derselben Factory erneut laden. Es gibt keine automatische Endlosschleife oder Zusage einer Netzwerkreparatur. Vor der Cache-Veröffentlichung werden die tatsächlichen Peers normalisiert und exakt geprüft. Der Cache speichert eine eingefrorene Hülle um die Framework-Referenzen; Framework-Interna werden nicht tief eingefroren. Vor jeder Host-Factory erfolgt erneut der Versionsabgleich, sodass nachträglich veränderte Runtime-Versionen keine Factory-Ausführung erhalten.

## Nachweise und Grenzen

[`peer-inspect.cjs`](peer-inspect.cjs) und [`peer-evidence.json`](peer-evidence.json) belegen **26** Vertrags-/Build-Fälle: deterministische Gruppen, kompatible verschiedene Provider, getrennte exakte Versionen, manipulierte Pläne, Loader-Ports, reservierte `then`-Exporte, reguläre Builds und CLI. Die React-/Vue-/Mixed-Referenzen halten weiterhin die festen Grenzen von **2.200.000 Framework-Bytes** und **240.000 XTension-Laufzeitbytes** ein. Alle erzeugten Dateien zählen unabhängig vom Ladezeitpunkt.

Die tatsächlichen jsdom-/Chromium-Prüfungen ergänzen **23 A04.3.3-Fälle**. Verpflichtend sind damit **341 Laufzeitfälle je Umgebung** sowie **88 Compilerprüfungen**. Sie prüfen gemeinsame laufende und erfolgreiche Versuche, verschiedene Provider, unabhängige Roots, den einzelnen und letzten Abbruch, Fehler-/Versionswiederholung, verspätete Ergebnisse und Fehler, erneute Versionsprüfung, fehlende Grants, synchrone Callback-Erfassung und frische Boots. Chromium lädt die erzeugten ESM-Dateien nativ über HTTP; die bisherigen A04.3.2-Fälle verlangen weiterhin Peer-Aufrufe je Host.

Gepackte Root-/Compiler-/Maraca-Consumer bauen und booten den neuen Vertrag mit tatsächlichen externen React-/Vue-Peers und prüfen die öffentlichen Typen. Das Vorbereitungs-Gate umfasst **16** blockierende Prüfungen. Historische Inventare und bisherige autoritative/veröffentlichte Fingerprint-Sets bleiben erhalten.

Nächster A04.3-Schritt sind explizite CSP-/Auslieferungsregeln und belastbare HTTP-Provenienz. Build-Digests und erfolgreiche native HTTP-Imports attestieren weiterhin keine unveränderten Laufzeitbytes. SSR/Adoption bleibt A05, RMTX-Syntax/DX A06; Angular-/Vanilla-Integration und vollständige 0.9-Abnahme benötigen eigene Nachweise.
