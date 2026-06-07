# Epic18 RMT App Platform Release Handoff

- Schema: `xtend.epic18.rmt-app-platform-release-handoff.v1`
- Local Gate: `node scripts/run_xtend_tests.js epic18-rmt-app-platform --json`

Epic18 ist abgeschlossen. Release Owner pruefen `npm run test:pr:report`, `npm run test:release:full:report` und `npm run pack:dry-run`, bevor ein Publish-Schritt freigegeben wird.

## Release Boundary

Das Handoff beschreibt den Punkt, an dem Epic18 von aktiver App-Platform-Arbeit in Release-Bewertung uebergeht. Der Scope umfasst RMT-App-DSL, domain-neutrale Fixtures, Media-Manager-Anschluss, Surface Manager Integrationen und die Editor-/Tooling-Evidence aus dem aktuellen Releasepfad. Er umfasst nicht die Freigabe neuer externer UI-Frameworks, keinen produktiven Vendor-Default und keine stillen Loader-Brueche. Solche Themen bleiben Residuals oder werden in eine eigene Epic-Grenze verschoben.

Release Owner lesen dieses Dokument zusammen mit dem JSON-Report aus `epic18-rmt-app-platform`. Der Report bestaetigt, dass die App-Platform-Varianten einen gemeinsamen Contract tragen, dass Fixture-Namen wie `generic-catalog`, `admin-queue` und `content-board` domain-neutral bleiben, und dass die Handoff-Aussagen im Package-Metadata auffindbar sind. Die Seite ist deshalb kein Marketingabschluss, sondern eine Pruefliste fuer den letzten technischen Entscheid vor Publish.

## Required Evidence

`npm run test:pr:report` prueft die schnelle Regressionslinie: Runtime-Basics, References, RMT-Tooling, Maraca, Native-First und Owned-RMT-Releasepfade. `npm run test:release:full:report` erweitert diese Linie um den vollen Release-Schnitt und schreibt das zentrale JSON-Artefakt fuer Owner. `npm run pack:dry-run` bestaetigt, dass das npm-Paket die erwarteten Dateien enthaelt und keine unbewerteten Build-Artefakte in den Publish-Kandidaten rutschen.

Wenn einer dieser Befehle faellt, wird das Handoff nicht durch manuelle Zustimmung ersetzt. Der verantwortliche Owner ordnet den Fehler einem Contract zu, dokumentiert den Residual oder repariert die Evidence. Bei App-Platform-Aenderungen ist besonders wichtig, dass RMT-Quellen deklarativ bleiben und XTend-Komponenten weiterhin ueber owned Loader- und Manifest-Pfade gebunden werden. Ein gruenes Handoff sagt also nicht nur "Tests bestanden", sondern auch "die Architekturgrenze ist weiterhin lesbar".

## Publish Decision

Vor dem Publish muss der Release Owner drei Dinge sehen: den letzten erfolgreichen Gate-Report, eine nachvollziehbare Packliste und eine klare Aussage zu offenen Residuals. Epic18 darf abgeschlossen werden, wenn die Residuals bekannt, nicht release-blockierend und einem naechsten Owner zugeordnet sind. Nicht akzeptiert sind versteckte Abhaengigkeiten, fehlende Docs fuer sichtbare Guides oder neue Host-Annahmen, die im Gate nicht beschrieben werden. Diese Seite bleibt der Anker fuer diese Entscheidung.
