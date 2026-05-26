# XTend Loader Types

XTend Loader Types beschreiben die öffentliche TypeScript-Oberfläche des lokalen Loaders, der Style Registry und des Skeleton Loaders. Der Artikel ist für Teams gedacht, die `xtend-loader.js` in einem Host verwenden und dabei klare Editor-Hinweise, stabile globale APIs und überprüfbare Event-Namen benötigen. Die Deklarationen liegen bewusst neben der JavaScript-Runtime: Der Browser lädt keine Typdateien, während Paketnutzer trotzdem vollständige IntelliSense und Compiler-Signale erhalten.

## Öffentliche Deklarationen

Die zentralen Dateien sind `./xtend-loader.d.ts` und `./xtend-dev.d.ts`. `xtend-loader.d.ts` beschreibt `XTendLoaderApi`, `XTendStyleRegistryApi` und `XTendSkeletonLoaderApi`. `xtend-dev.d.ts` bleibt als Kompatibilitätsbrücke bestehen und exportiert dieselben Loader-Typen erneut, damit ältere Integrationen nicht umgestellt werden müssen. Die Paket-Exports `.`, `./loader` und `./legacy-loader` zeigen deshalb auf die passenden `types` Conditions, ohne den Runtime-Pfad zu verändern.

Die Typen decken Methoden wie `ensureComponent`, `hydrateTree`, `ensureRuntimeStyles`, `defineComponentStyle`, `adoptStyle`, `showSkeleton` und `hideSkeleton` ab. Für Host-Code ist das wichtig, weil der Loader häufig vor einer Anwendung initialisiert wird und Fehler früh sichtbar sein sollen. Wenn ein Host zum Beispiel eine Komponente vorlädt oder einen Shadow Root hydriert, zeigen die Deklarationen direkt, welche Argumente erlaubt sind und welche Ergebnisstruktur zurückkommt.

## Events und globale APIs

Die Loader-Deklarationen erweitern `WindowEventMap` um `xtend-loader-diagnostic`, `xtend-loader-performance` und `xtend-loader-tree-hydrated`. Diese Events sind Teil der Diagnoseoberfläche und dürfen von Monitoring, Tests oder lokalen Debug-Panels abonniert werden. Zusätzlich werden die globalen Namen `XTendLoader`, `XTendStyleRegistry`, `XTendSkeletonLoader` und `__XTendLoaderBootPromise` beschrieben, damit ein Host sie nutzen kann, ohne eigene Ambient Declarations zu pflegen.

Die Style Registry bleibt bewusst schmal. Sie beschreibt Laufzeit-Styles, Component-Styles und Adopted-StyleSheet-Unterstützung, ohne `xtend.css` als Pflichtdatei zu deklarieren. Das Paket kann deshalb als lokaler Runtime-Baustein installiert werden, während Themes weiterhin optional bleiben. Der relevante Vertrag lautet: `xtend.css bleibt optional` und `standardFileName: 'xtend.css'` ist nur der bekannte Theme-Dateiname, nicht ein harter Import.

## Lokale Prüfung

Die Loader-Type-Prüfung vergleicht Runtime-Methoden, globale Namen, Event-Namen und Paket-Metadaten mit den Deklarationen. Führe sie aus, wenn du `xtend-loader.js`, `xtend-loader.d.ts`, `xtend-dev.d.ts`, Package Exports oder Release-Metadaten änderst.

```bash
node scripts/run_xtend_tests.js type-exports-loader --json
```

```txt
schema: xtend.type-exports.loader-declarations.v1
local gate: node scripts/run_xtend_tests.js type-exports-loader --json
report: .xtend-test-results/xtend-type-exports-loader-report.json
```

## Pflegehinweise

Ändere zuerst die Runtime oder die Deklaration, dann die Paket-Metadaten und zuletzt die Dokumentation. Der Check bleibt grün, wenn alle drei Ebenen dieselben Namen kennen. Wird eine Methode entfernt, muss der Host-Vertrag neu bewertet werden; wird eine Methode ergänzt, braucht sie einen Typ, eine Test-Erwartung und eine kurze Dokumentation. Auf diese Weise bleiben Loader, Style Registry und Skeleton Loader für Drittanbieter stabil, ohne dass intern auf TypeScript umgestellt werden muss.
