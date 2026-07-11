# RMT Component Template Primitives

Template-Primitives für wiederverwendbare komponentennahe UI-Strukturen.

## Worum es geht

Component Template Primitives beschreiben wiederverwendbare UI-Strukturen als deklarative Records. Sie binden einen bekannten Custom-Element-Tag, Properties, Slots und Events, ohne Komponentenklassen in den RMT Kernel zu importieren.

## Öffentliche Bausteine

- `tests/fixtures/rmt-component-template-primitives.rmt` enthält die unterstützten Primitive.
- `tests/fixtures/rmt-component-template-primitives.core.json` zeigt ihre Core-Repräsentation.
- `components/manifest.json` entscheidet, ob ein referenzierter Tag lokal verfügbar ist.

## Empfohlener Ablauf

Definiere zuerst ein kleines Template mit einem registrierten Tag. Binde nur öffentliche Attribute und Events, kompiliere den Descriptor und prüfe ihn anschließend gegen die Komponentenreferenz.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
