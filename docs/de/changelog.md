# Changelog

Diese Seite erklärt, wie öffentliche Änderungen an XTend eingeordnet werden. Die installierte Version steht in `package.json`; Exports, Deklarationen und Migrationshinweise sind die maßgeblichen Quellen für Integratoren.

## Versionsstand ermitteln

Lies die Version nicht aus einem generierten Banner oder Screenshot. Ermittle sie direkt aus dem Package:

```bash
node -p "require('./package.json').version"
```

Vergleiche anschließend `package.json` mit den tatsächlich installierten Dateien. `api.d.ts`, `components/manifest.json` und die Deklarationen unter `components/*.d.ts` zeigen, welche öffentliche Oberfläche zu diesem Stand gehört.

## Änderungen bewerten

- **Additiv:** Ein neuer Export, ein optionales Attribut oder ein neues versioniertes Schema erweitert die Oberfläche, ohne bestehende Aufrufe zu brechen.
- **Verhaltensänderung:** Defaults, Scheduling, Hydration oder Fehlerstatus ändern sich. Solche Änderungen brauchen ein ausführbares Beispiel und einen aktualisierten Gate-Report.
- **Migration:** Ein Name, ein Vertrag oder ein unterstützter Pfad wird ersetzt. Der alte Pfad bleibt mindestens für den dokumentierten Übergang erhalten oder liefert eine eindeutige Diagnose.
- **Security Fix:** Import-, Integrity-, CSP- oder Trust-Regeln werden verschärft. Ein solcher Fix darf nicht durch einen stillen Kompatibilitätsfallback umgangen werden.

## Was ein Release belegen muss

Ein Release ist mehr als eine Versionsnummer. Die Export-Lock-Prüfung muss zu den TypeScript-Deklarationen passen, der Pack-Dry-Run darf keine internen Artefakte veröffentlichen und die relevanten Browser- sowie Runtime-Gates müssen grün sein. [Release Verification](./release-verification.md) beschreibt die Reihenfolge und die Bedeutung der Reports.

## Upgrade-Pfad

Prüfe vor dem Upgrade zuerst die betroffenen öffentlichen Symbole. Bei RMT vNext helfen die [Migration Notes](./rmt-vnext-migration-notes.md), für Komponenten die [Long-Tail Migration](./component-long-tail-migration.md) und für XTensions der [Coexistence Guide](./xtensions-migration-coexistence-guide.md). Passe Source, Fixture und Tests gemeinsam an, statt nur einen kompilierten Output zu ersetzen.
