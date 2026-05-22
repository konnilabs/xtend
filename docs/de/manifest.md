# XTend Manifest

## Übersicht

Das XTend Manifest ist eine zentrale JSON-Datei, die alle verfügbaren XTend-Komponenten und deren Pfade definiert. Es dient als "Single Source of Truth" für den Loader und die API, um Komponenten dynamisch und modular zu laden.

---

## Speicherort & Name

- Standardpfad: `components/manifest.json`
- Der Pfad kann beim Initialisieren des Loaders angepasst werden.

---

## Struktur des Manifests

Das Manifest ist ein einfaches JSON-Objekt. Die meisten Schlüssel entsprechen dem kanonischen Tag-Namen einer XTend-Komponente; zusätzlich gibt es reservierte Bootstrap-Keys wie `xstate`. Der Wert ist jeweils eine konkrete ES-Modul-Adresse.

### Beispiel

```json
{
  "xstate": "./xstate.js",
  "x-theme": "./xtheme.js",
  "x-button": "./xbutton.js",
  "x-input": "./xinput.js",
  "x-router": "./xrouter.js",
  "x-link": "./xlink.js"
}
```

### Konventionen
- Custom-Element-Tags sind kanonisch **kleingeschrieben, hyphenated und beginnen mit `x`** (z.B. `x-button`, `x-input`, `x-router`).
- Reservierte Bootstrap-Keys wie `xstate` sind zulässige Ausnahmen und werden nicht als DOM-Tag interpretiert.
- Werte dürfen **relativ**, **root-relativ** oder **same-origin/loopback-lokal absolut** sein.
- Der Loader löst relative Einträge relativ zur Manifest-URL auf.
- Der Default-Manifestpfad bleibt repo-lokal; CDN-URLs sind kein Standard- oder Testpfad.
- Seit `ER-WP-28` werden externe Manifest-/Modul-URLs, `javascript:`, `data:`, `blob:`, Path-Traversal und nicht-JavaScript-Module durch `xtend.security.manifest-policy.v1` und `xtend.security.import-policy.v1` verweigert.
- Kommentare sind im JSON-Standard nicht erlaubt und im echten Manifest unzulässig.

---

## Pflicht- und optionale Einträge

- **Pflicht:**
  - `xstate` als Bootstrap-Basismodul
- **Optional:**
  - `x-theme` (Theme-Engine)
  - Weitere eigene Komponenten

---

## Erweiterbarkeit

- Das Manifest kann beliebig viele Komponenten enthalten.
- Eigene Komponenten können einfach durch Hinzufügen weiterer Schlüssel/Werte ergänzt werden.
- Für experimentelle oder Beta-Komponenten empfiehlt sich eine eigene Namenskonvention (z.B. `x-section-beta`).

## Abgrenzung zu XTendRMT

Das XTend Manifest beschreibt aufloesbare ES-Modul-Pfade fuer XTend-Komponenten. Es ist nicht dasselbe wie ein `.rmt` Dokument.

| Datei/Format | Aufgabe |
|--------------|---------|
| `components/manifest.json` | XTend Loader und Component URL-Aufloesung |
| `xtendrmt/rmt.schema.json` | Schema-Referenz fuer RMT-Dokumente |
| `.rmt` | Native App-DSL mit `adapters`, `components`, `routes`, `schedules`, `templates` |
| `xtendrmt/rmt-manifest.json` | XTendRMT Produktmanifest, Entry Points und Artefakt-Paritaet |

RMT-Component-Records duerfen ein XTend Manifest fuer Manifest Lookup
referenzieren, aber der RMT Kernel liest daraus keine XTend Runtime. Die
Aufloesung gehoert in Host-Adapter und die RMT vNext Component Capability
Registry. Sie nutzt das Manifest als Import-Quelle, verbindet es mit
Component Contracts und RMT-Metadaten und erzeugt daraus Descriptor-
Faehigkeiten fuer den DOM Descriptor Renderer.

Native RMT-Dateien sollten mit `application/vnd.xtendrmt.rmt+json` ausgeliefert werden. Der JSON-Fallback bleibt fuer Sonderhosts moeglich, ist aber kein empfohlener Authoring-Pfad.

---

## Best Practices

- Das Manifest ist die **Single Source of Truth** für auflösbare Komponenten-URLs.
- Das Manifest sollte stets aktuell gehalten werden, um Dead Links und Ladefehler zu vermeiden.
- Für die Produktion empfiehlt sich ein minimiertes Manifest ohne ungenutzte Komponenten.
- `xstate` sollte immer explizit vorhanden sein; `x-theme` folgt direkt danach, wenn Theme-Funktionen genutzt werden.

---

## Validierung

- Vor dem Laden prüft der Loader, ob das Manifest und alle Modul-URLs gültig sind.
- Nicht-string Werte werden ignoriert.
- Fehler beim Parsen oder Laden werden im Konsolen-Log ausgegeben.
- Security Refusals erzeugen `xtend-loader-diagnostic` Events mit `xtend.security.loader.refused`, `xtend.security.manifest.invalid` oder `xtend.security.import.refused`.
- Der lokale Gate lautet `node scripts/run_xtend_tests.js manifest-import-policy --json`.
- Nach Core-Aenderungen kann `node scripts/verify_xtend_core_contracts.js` den Bootstrap-Contract gegen Manifest, API und Doku querpruefen.

---

## Weiterführende Themen
- [XTend Loader](./xtend-loader.md)
- [Manifest Import Policy](./manifest-import-policy.md)
- [Komponenten-Entwicklung](./components.md)
- [RMT vNext Component Primitives und XTend UI](./rmt-vnext-component-primitives.md)
- [API-Integration](./api.md)
- [XTendRMT App-DSL Reference](./xtendrmt-app-dsl.md)

---

*Letzte Aktualisierung: 22. Mai 2026*
