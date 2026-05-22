# XTend Scaffold Previews

- Status: Scaffold-Preview-Konvention
- Referenz-Gate: `node scripts/run_xtend_tests.js references`
- Generator: `node xtend-builder/scaffold.js preview --tag x-example --profile display --feature state --json`

## Zweck

Dieses Verzeichnis ist fuer gescaffoldete Component-Preview-Plaene reserviert. Ein Preview-Plan ist eine lokale Markdown-Referenz, die generierte Component-Quellen, Docs, Fixture, Typen und Manifest-Patch-Ausgabe mit der Dokumentations- und Demo-Referenzregistrierung verbindet.

## Mindestvertrag

- Preview-Pfade folgen `docs/previews/<name>.preview.md`.
- Preview-Plaene muessen in `development/XTend-Dokumentations-und-Demo-Referenzpfade.md` gelistet sein, bevor sie automatisierte Referenzen werden.
- Preview-Plaene muessen repo-lokale Component-, Fixture- und Manifest-Pfade verwenden.
- Externe Netzwerkabhaengigkeiten sind fuer automatisierte Scaffold-Previews nicht erlaubt.
- Produktive Preview-Schreibvorgaenge bleiben review-first, bis ein spaeteres Paket einen Schreibmodus einfuehrt.
