# WP-13 - Dokumentation und Migrationshinweise aktualisieren

- Status: Completed
- Datum: 24. Maerz 2026
- Epic: `EPIC-01-XTend-Core-Standardisierung-und-Konsolidierung`

## Ziel

Die Core-Dokumentation auf den tatsaechlichen Runtime-Contract ziehen und einen expliziten Migrationspfad fuer Legacy-Call-Sites bereitstellen.

## Umgesetzte Aenderungen

- `docs/core-migration-guide.md` als oeffentliche Migrationsreferenz angelegt
- `docs/api.md` dokumentiert jetzt die produktive Compliance-API
- `docs/components/xtheme.md` beschreibt zentrale XTend-Tokens und `getDesignTokens()`
- `docs/manifest.md`, `docs/xtend-loader.md` und `docs/components/xrouter.md` verweisen auf den Verify-Check
- `docs/XTend-ADR.md` wurde um den aktuellen Umsetzungsstand des Epic erweitert
- Menue und Doku-Startseite verlinken den Core Migration Guide

## Betroffene Dateien

- `docs/core-migration-guide.md`
- `docs/api.md`
- `docs/components/xtheme.md`
- `docs/components/xrouter.md`
- `docs/manifest.md`
- `docs/xtend-loader.md`
- `docs/en/README.md`
- `docs/menu.json`
- `docs/XTend-ADR.md`

## Verifikation

- alle verlinkten Doku-Dateien werden durch den Verify-Script gegen zentrale Marker geprueft
- `docs/menu.json` und `docs/en/README.md` sind auf denselben oeffentlichen Stand gebracht

## Ergebnis

`WP-13` ist abgeschlossen. Core-Doku, Migrationspfad und Entwicklungsartefakte beschreiben jetzt denselben produktiven XTend-Core-Contract.
