# A02.5.1 – URL-/History-Vertrag

Stand: 2026-11-09. Dieser Vertrag legt die URL-Semantik für adressierte XTension-State-Slices fest. Die [ausführbare Referenz](reference.js) und ihre [Typen](reference.d.ts) liegen ausschließlich im Entwicklungsbereich. **Produktive Router-/Maraca-Anbindung folgt in A02.5.2.** RMTX und XTensions 2.0 bleiben für 0.9.0 `preparing`. Der Vertrag entscheidet keine RMTX-Quellsyntax.

## 1. Zuständigkeiten und Versionen

Der RMT Model besitzt den Zustand und ist der einzige Writer. XTend State projiziert Model-Commits; kontrollierte Props folgen demselben Commit. Das Framework sendet Intents über die bestehende vertrauenswürdige Command-/Action-Kette. URL-Daten erhalten weder einen Command-Port noch eigene Model-Pfade.

`x-router` beziehungsweise der ausdrücklich zuständige Route-Host ist der einzige URL-/History-Writer. Er besitzt Route, Navigation, History-State und Listener. Der Vertrag liefert nur Restore-Pläne und History-Vorschläge. Er installiert keine Listener und ruft weder `pushState`, `replaceState` noch `location` auf. Insbesondere entsteht kein zweiter History-Owner neben dem Router oder dem bestehenden Docs-Routencontroller.

| Neuer Vertrag | Version | Quelle |
| --- | --- | --- |
| Vertrauenswürdige Freigabepolicy | `xtend.xtensions.url-state-policy.v1` | [Schema](policy.v1.schema.json), [Beispiel](policy.v1.json) |
| Öffentlicher URL-State | `xtend.xtensions.url-state.v1` | [Schema](state.v1.schema.json) |
| Prüfbarer Restore-Plan | `xtend.xtensions.url-state-restore-plan.v1` | [Schema](restore-plan.v1.schema.json) |
| History-Vorschlag | `xtend.xtensions.url-history-proposal.v1` | [Schema](history-proposal.v1.schema.json) |
| Entwicklungsreferenz-API | `1.0.0` | [Implementierung](reference.js), [Deklaration](reference.d.ts) |

Alle vier Datenformate sind geschlossen. Die JSON-Schemata beschreiben Struktur und globale Grenzen; die Referenz prüft zusätzlich Policy, Typen, Adressdomänen, Model-Ziele und Lebensdauer. Neue Schema-Majors werden abgewiesen. Änderungen an einem dieser Verträge benötigen eine neue Major-Schema-ID nach den geltenden Regeln. Bestehende Bindungs-, Compiler-, Maraca- und Classic-AST-Verträge ändern sich in diesem Abschnitt nicht; ihre Versionen bleiben erhalten.

## 2. Explizite Freigabe und Standardwerte

Eine vertrauenswürdige Anwendung übergibt die Policy zusammen mit dem tatsächlich kompilierten Programm und dessen validiertem Bindungs-Sidecar. `exposure: "public-url"` ist Pflicht. Jede Freigabe benennt eine bestehende kontrollierte `surface`/`prop`-Quelle, eine öffentliche Feld-ID und einen expliziten `default`-Wert. Policy-ID, positive Policy-Version und Dokument-ID sind Bestandteil jedes Tokens. Änderungen an Zuordnung, Bedeutung oder Standardwerten erfordern eine höhere Anwendungspolicy-Version; v1 führt keine Migration aus.

Freigaben erlauben ausschließlich typgerechte, endliche JSON-Skalare: String, Zahl, Boolean und bei nullable Quellen `null`. Objekt-/Array-/JSON-Props, Secrets und unbekannte Felder sind ausgeschlossen. Eine Freigabe macht Werte, Feld-IDs und logische Schlüssel öffentlich: Base64url ist keine Verschlüsselung. Die App muss deshalb ausschließlich öffentliche Instanzschlüssel und öffentliche Werte freigeben. Ohne Policy gibt es keine URL-Projektion.

Das Fehlen des Parameters bedeutet **die deklarierten Standardwerte aller aktuell bekannten freigegebenen Instanzen**. Dasselbe gilt innerhalb eines Tokens für ausgelassene Instanzen und Felder. Der Zustand hängt dadurch nicht von einer vorher besuchten Route ab. Standardwerte stammen aus der versionierten Policy, niemals aus einem zufälligen aktuellen oder serverseitigen Model-Snapshot. Private Felder und die Menge der Model-Items bleiben erhalten. Die Anwendung muss diesen Initialisierungsvertrag ausdrücklich übernehmen.

Jeder öffentliche Model-Pfad hat genau einen logischen URL-Owner. Alias-Ziele und überlappende Schreibpfade werden abgewiesen, selbst bei identischen Werten. Gemeinsam genutzter State benötigt eine eindeutige statische Bindung als URL-Owner. Identitätsschlüssel dürfen keine schreibbaren URL-Felder sein. Die Referenz prüft diese Grenzen gegen alle vorhandenen Bindungen, einschließlich nicht freigegebener Wiederholungen.

## 3. Logische Instanzadressen

Eine URL-Adresse besteht aus `declarationId` und dem geordneten typisierten Tupel `keys`, einschließlich Basisschlüsseln und sämtlicher Vorfahren-/Item-Schlüssel. Dokument und Policy stehen im Envelope. Zahl `1` und String `"1"` bleiben verschieden. Weder DOM-Position noch `hostSurfaceId`, `incarnation`, Model-State-ID, Model-Pfad oder Command-Name werden serialisiert.

Die Adresse bezeichnet eine Model-Instanz unabhängig von einem derzeit gemounteten Host. `presence: false` verhindert deshalb keine Wiederherstellung vorhandener Daten. Die Referenz enumeriert logische Model-Instanzen statt ausschließlich aktive Hosts zu materialisieren. Gleiche Deklarations-/Schlüsseldomänen mehrerer Freigaben sind bereits bei leerer Collection unzulässig, wenn sie später mehrdeutig werden könnten.

Unbekannte Deklarationen, falsche Schlüsselpräfixe oder -anzahlen und nicht freigegebene Felder sind Fehler. Ist die Domäne gültig, ein konkreter Schlüssel im Model aber noch nicht vorhanden, wird der **gesamte** Restore `deferred`: keine Teiländerung, keine Standardwertänderung, keine Item-Erzeugung, kein Mount und kein Fetch. Der zuständige Datenfluss kann später Daten liefern und für dieselbe noch aktuelle Navigation einen neuen Plan berechnen. Die Referenz registriert dafür keinen automatischen Retry. Wird ein Schlüssel später wiederverwendet, adressiert der Link diese aktuelle Model-Identität; kurzlebige Inkarnationen gehören nicht in einen Deep Link.

## 4. Codec und Query-Bereich

Der reservierte Parameter heißt `xtend-state`. Das Token hat die Form `1.<base64url>`: kanonisches JSON als UTF-8, ungepaddetes Base64url ohne Kompression. Objektfelder werden rekursiv nach JavaScript-UTF-16-Codeeinheiten sortiert, Arrays behalten ihre Reihenfolge. Die Instanzeinträge werden nach der kanonischen Darstellung von `[declarationId, keys]` sortiert. Es gibt keine Unicode-Normalisierung. Werte gleich dem Policy-Standard und anschließend leere Einträge werden ausgelassen. Ein leerer Gesamtzustand ist als Codec-Payload gültig; die History-Darstellung entfernt dafür den Parameter.

Decoding verlangt Bytegleichheit mit der erneuten kanonischen Kodierung. Unbekannte Versionen, ungültiges UTF-8/JSON, doppelte JSON-Felder, Padding, nicht minimale Base64-Bits, zusätzliche Felder, doppelte Adressen und nicht kanonische Reihenfolgen werden abgewiesen. Ein URL-Fehler verändert weder Model noch bestehende Roots. Er sperrt die History-Veröffentlichung dieser Navigation, bis ein gültiger Restore oder ein ausdrücklicher Reset abgeschlossen ist. Ein Fehler wird nicht still durch aktuelle UI-Werte überschrieben.

`readQuery` und `withToken` erhalten ausschließlich den **aktiven Query-Bereich ohne `?`**. Der Router entscheidet, welcher Bereich aktiv ist: Im History-Modus der Routenquery; im Hash-Modus der vom Router aufgelöste Hash-Routenquery beziehungsweise dessen bestehender Fallback auf den äußeren Query. Diese Entscheidung trifft die Referenz nicht. Unbeteiligte Query-Segmente bleiben einschließlich Reihenfolge und Kodierung unverändert. Reservierte Namen werden dekodiert geprüft; doppelte Parameter, auch kodierte Aliasse, sind Fehler. Abwesend (`null`) und vorhanden, aber leer (`""`, ungültiges Token), sind verschieden.

`withToken(query, null)` entfernt ausdrücklich alle erkennbaren reservierten Segmente, auch bei fehlerhaften Werten oder doppelten Aliasnamen. Diese Reparatur ist nur im unten beschriebenen Reset-Ablauf zulässig. Route, Fragment, Origin und `history.state` bleiben Aufgabe des bestehenden Owners. Der Owner darf sie beim Zusammensetzen des URLs nicht durch eine aus dem Token gelesene Route ersetzen.

## 5. Restore und Commit-Grenze

1. Der Router beginnt eine Navigation, vergibt eine opake Navigations-ID und widerruft die vorherige Lebensdauer. Er liest den reservierten Parameter, ohne bereits eine URL zurückzuschreiben.
2. `planRestore(tokenOrNull, modelSnapshot, { navigationId })` validiert vollständig und berechnet einen eingefrorenen Plan. `ready` enthält ausschließlich freigegebene Änderungen mit vorherigem und neuem Wert. `unchanged` enthält keine Änderungen; auch dieser Plan muss als abgeschlossene Model-Phase bestätigt werden. `deferred` enthält ausschließlich fehlende logische Adressen.
3. Der vertrauenswürdige Host bestätigt unmittelbar vor Ausführung aktuelle Navigation, nicht abgebrochenes Signal und unveränderten vollständigen Model-Snapshot. Änderungen seit der Planung, auch an privaten Feldern, verlangen einen neuen Plan. Ein neuer Plan widerruft den alten auch bei wiederverwendeter Navigations-ID.
4. Alle Änderungen werden in **einer atomaren Model-Transaktion** über den zuständigen vertrauenswürdigen Port übernommen. Private Daten und Schlüssel bleiben erhalten. Es gibt keinen partiellen Restore und keine alleinige XTend-State-Mutation.
5. Anschließend muss der Host den zur aktuellen Model-Version gehörenden Maraca-View- und Framework-Props-Abschluss abwarten. Erst danach darf er die History-Freigabe prüfen. Entfernte Hosts, neue Navigation, Dispose oder fehlgeschlagene Lieferung entziehen die Freigabe.

Die Referenz implementiert Schritt 4 ausschließlich für den vorhandenen **synchronen atomaren RMT-Model-Port außerhalb Maracas**. Sie bündelt die geänderten Model-Roots in einem Port-Aufruf; die komplette ursprüngliche Momentaufnahme und Operationen bleiben privat. Der sichtbare Plan enthält keine Schreibpfade oder privaten Root-Werte. Nur originale, intern versiegelte, aktuelle Pläne können einmalig ausgeführt werden; JSON-Kopien erhalten keine Autorität. Asynchrone Ports gehören nicht zu dieser Referenz-API.

Dies ist kein produktiver Bypass der Maraca-Action-Kette. A02.5.2 muss einen ausdrücklichen Restore-Eingang in deren Transaktions-/Commit-Lebensdauer integrieren und dessen API-/Schemaänderungen versionieren. Die bestehenden SSR-Snapshot-/Adoption-Ports werden dafür nicht wiederverwendet: Deren vollständige Snapshot-Autorität ist für öffentliche URL-Felder zu weitreichend. SSR/Adoption bleibt A05.

## 6. History-Regeln

Nach erfolgreicher Model-Phase berechnet `proposeHistory` aus einem aktuellen Model-Snapshot einen Vorschlag. Unveränderte öffentliche Werte erzeugen `none`. Weitere Regeln:

| Ursache | Modus bei abweichendem Token | Bedeutung |
| --- | --- | --- |
| `initialize` | `replace` | Aktuellen Eintrag kanonisieren, erst nach Restore und View-Abschluss |
| `commit` | `replace` | Laufende kontrollierte Eingaben aktualisieren denselben Eintrag |
| `checkpoint` | `push` | Ausdrücklich von der Anwendung gewählter semantischer Schritt |
| `traverse` | immer `none` | Back/Forward oder externe Navigation wird nie zurückgeschrieben |
| `reset` | immer `replace`, Token `null` | Ausdrückliches Verwerfen ungültiger/alter URL-Daten nach Restore der Policy-Standards |

Ein Reset beginnt mit einem neuen `planRestore(null, ...)`, führt dessen Model-Phase aus und wartet auf die aktuelle View. Erst dann darf `proposeHistory` mit `cause: "reset"` den bisherigen ungültigen Token übergehen. Ohne diese ausdrückliche Ursache ist ein fehlerhafter aktueller Token ein Veröffentlichungsfehler.

`checkHistory` prüft die originale einmalige Vorschlagsversiegelung, aktuelle Navigation, Abort/Dispose, aktuelle öffentliche Werte und den **vom vertrauenswürdigen Host gelieferten** Nachweis `isViewCommitted() === true`. Die Referenz erzeugt diesen Nachweis nicht selbst. `false`/Promises gelten nicht als Bestätigung. Der Owner muss unmittelbar danach synchron den Query zusammensetzen und die freigegebene History-Operation ausführen; dazwischen darf keine asynchrone Lücke entstehen. Ein neuer Vorschlag widerruft den vorherigen derselben Sitzung. Ein `none`-Vorschlag wird ebenfalls konsumiert. Private Model-Änderungen allein erzeugen keinen neuen öffentlichen URL-State.

URL-Restore, Model-Projektion und kontrollierte Props dürfen keinen neuen `checkpoint` auslösen. Ein Zustands-Subscriber darf daher nicht ohne Herkunfts-/Navigationsprüfung auf jeden Commit mit `pushState` reagieren. Nach `traverse` wird auch ein leeres/älteres, aber gültiges Token nicht durch eine neue History-Operation beantwortet.

## 7. Grenzen und Fehlerbehandlung

Die Beispielpolicy begrenzt Token auf 4096 ASCII-Bytes, Einträge auf 32, jeden kanonischen JSON-Skalar auf 512 UTF-8-Bytes und bekannte öffentliche Instanzen auf 128. Globale Schemaobergrenzen: 8192 Tokenbytes, 128 Einträge/Instanzen, 2048 Bytes pro Wert, 32 Freigaben und 32 Schlüssel pro Adresse. Schlüsselzahlen sind nichtnegative sichere Integer; String-Schlüssel haben höchstens 256 Unicode-Codepunkte, Namen höchstens 128. Leere/unsichere Namen und äußere Whitespaces sind unzulässig. Einträge dürfen die Instanzgrenze nicht übersteigen.

Zu große, ungültige oder veraltete Eingaben werden abgewiesen; es gibt kein Abschneiden oder stilles Teilresultat. Die Referenz wirft `TypeError`; ergänzende `code`-Werte sind keine vollständige öffentliche Fehlerklassifikation. Der Route-Host muss dem Nutzer einen Fehler und gegebenenfalls einen ausdrücklichen Reset anbieten. Fehlende gültige Schlüssel werden gesondert als `deferred` gemeldet. Tokens und private Root-Snapshots gehören nicht ungefiltert in Telemetrie. `dispose()` beendet die Sitzung und entzieht allen Plänen/Vorschlägen ihre Autorität.

## 8. Ausführbarer Nachweis und nächste Integration

[`inspect.cjs`](inspect.cjs) führt 70 Vertragsprüfungen mit dem real kompilierten A02.4-Programm und echten RMT-Model-/State-Ports aus. [`evidence.json`](evidence.json) bindet Referenz, Typen, Policy, Schemata und Prüfungen an SHA-256; [`examples.v1.json`](examples.v1.json) zeigt alle vier Datenformate und das kanonische Token. `productionIntegration: false` bleibt explizit. Der verpflichtende Releasevorbereitungs-Gate prüft diese Nachweise mit `--check` auf Drift.

```sh
node development/rmtx-a02/url-history/inspect.cjs --check
```

Vier zusätzliche tatsächliche Runtime-Fälle prüfen in jsdom und Chromium drei React-Roots, die Model-Transaktion und XTend-State-Projektion, typisierte Schlüssel, View-Freigabe, ungültige/deferred Tokens und Traversal-Standards. Sie verwenden den synchronen Model-Referenzpfad und beweisen noch keine Router-/Maraca-Integration. Die bestehenden Runtime-Gates verlangen nun 141 Akzeptanzfälle je Umgebung sowie weiterhin 88 Compiler-/Versionsprüfungen.

**A02.5.2:** Router-/Route-Host-Eingang samt Hash-/History-Modus und Back/Forward anbinden; Restore als versionierten vertrauenswürdigen Maraca-Commit ausführen; Navigationsabbruch und gemeinsame Model-/View-/Props-Barriere verkabeln; URL-Schreiben, Reset und Herkunftsschutz in realen Routennavigationen testen. Erst dieser Nachweis schließt den URL-/History-Teil von A02 ab. A03–A06 bleiben eigenständige offene Arbeitspakete.
