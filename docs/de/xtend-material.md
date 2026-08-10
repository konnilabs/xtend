# XTend Material

Erstelle ruhige, barrierearme App Shells mit XTend-Komponenten, RMT und einem optionalen lokalen Tailwind-Compiler.

Contract-Schema: `xtend.material.design-kit.v1`  
Supportstatus: `supported-opt-in`

## Hier beginnst du

XTend Material ist ein Design Kit für Dashboards, Administrationswerkzeuge, Content-Anwendungen, Einstellungsseiten und kleine Utility-Produkte. Es gibt diesen Anwendungen eine konsistente Flächenhierarchie, Typografie, Abstände und eine responsive Shell, ohne ein zweites Komponenten-Framework einzuführen.

Drei Schichten arbeiten zusammen:

1. XTend-Komponenten besitzen Verhalten, Tastaturbedienung, Barrierefreiheit, Slots und öffentliche CSS Parts.
2. RMT besitzt App-Zustand, Actions, Validierung, Übergänge und Surface-Orchestrierung.
3. XTend Material besitzt die visuelle Komposition über semantische Klassen wie `xtm-app-shell`, `xtm-dashboard` und `xtm-form-flow`.

Tailwind CSS ist ein Implementierungswerkzeug hinter dem Maraca CSS Provider. Es läuft lokal während des Builds und wird nie zur Browser-Abhängigkeit. Anwendungscode verwendet `xtm-*`-Namen statt langer Tailwind-Utility-Listen.

XTend Material ist weder Angular Material noch Material Web und verspricht keine vollständige Google-Material-Design-Parität. Der Name bezeichnet XTends eigene neutrale Designsprache für alltägliche Produktoberflächen.

## Wann passt das Design Kit?

Wähle XTend Material, wenn du eine RMT-first-Maraca-App mit einer brauchbaren Standarddarstellung entwickeln möchtest und am ersten Tag keine individuelle Produktsprache benötigst. Interne Dashboards, operative Werkzeuge und schnell bereitgestellte Utility-Anwendungen sind besonders geeignete Einsatzfelder.

Behalte ein vorhandenes Designsystem, wenn das Produkt bereits sorgfältig angepasste Markenregeln oder spezielle Layoutlogik besitzt. Verwende reine XTend-Komponenten, wenn du deren Verhalten brauchst, aber jede visuelle Entscheidung selbst treffen möchtest. Das Design Kit ist optional: Die Installation von XTend oder Maraca aktiviert es nicht.

Der aktuelle Supportstatus bedeutet, dass die dokumentierten Package Exports, Recipes, Themes, Dichtevarianten, der native Fallback und der Maraca Provider bei ausdrücklicher Auswahl unterstützt werden. Der Standard-CSS-Provider anderer Anwendungen ändert sich nicht.

## Erstelle deine erste App

Du benötigst Node.js 24 oder neuer sowie einen lokalen XTend-Checkout oder installierte XTend-Pakete. Mit dem Standard `--server both` erzeugt der Scaffold-Befehl dreizehn Artefakte: RMT-Source, Tailwind-Input, typisierte Browser- und Node-AppServices, eine PHP-Callable-Registry, den gemanagten Node-App-Host, strikte TypeScript-Konfiguration, HTML-/Runtime-Hosts, DEV-API-Brücke, Maraca-Konfiguration, Package-Metadaten und Smoke-Test. Mit `--server none`, `node` oder `php` entfallen nicht benötigte Backendziele.

```bash
xt create app --runtime maraca --design-kit material --name operations-console --out operations-console --write
cd operations-console
npm install
npm run plan
npm run serve
npm test
```

Das erzeugte Paket verwendet `@xtend-material/core`, `@xtend-material/maraca-tailwind`, `@ccslabs/xtend-maraca` und die XTend CLI. Die Datei `maraca.config.json` deklariert jede CSS-Quelle ausdrücklich, deaktiviert Tailwind Preflight und blockiert einen stillen Provider-Fallback:

```json
{
  "schema": "xtend.maraca.build-config.v1",
  "options": {
    "source": "src/app.rmt",
    "out": "dist",
    "css": "external",
    "cssProvider": "tailwind",
    "cssInput": "src/app.css",
    "cssSources": ["src/app.rmt", "src/app.css"],
    "cssPreflight": "disabled",
    "cssProviderFallback": "none"
  }
}
```

`npm run plan` ist der schnellste Diagnoseschritt. Er validiert RMT und das Source-Inventar, ohne einen Browser als Compiler zu verwenden. `npm run serve` führt zuerst den deterministischen Maraca-Build aus und schreibt `dist/`. Bei `--server node` oder `both` startet es danach ausschließlich den gemanagten `server/index.mjs`; der öffentliche Maraca-Node-App-Host liefert die generierte `site/index.html` unter `http://127.0.0.1:4173/` aus. Bei `none` oder `php` bleibt `xt serve` der statische Entwicklungsserver. `npm run test:catfood` erzwingt denselben Build-first-Vertrag vor den App-Tests. Ein direkt mit einer `file:`-URL geöffnetes ESM-Bundle ist kein unterstütztes Deployment-Modell.

## Arbeite mit semantischen Recipes

Ein RMT-State kann über `viewTemplate` genau eine stabile Material-Klasse tragen. Der Klassenname beschreibt die Layoutabsicht und bleibt im Review verständlich:

```rmt
state operations.dashboard type object preserve {
  initial {
    id "operations-dashboard"
    title "Operations"
    viewTemplate { class "xtm-dashboard" }
  }
}
```

Ersetze diese Klasse nicht durch `grid gap-4 p-6 lg:grid-cols-3`. Rohe Utilities sind private Implementierungsdetails der Recipes. Das Source-Inventar blockiert unbekannte Klassen, dynamisch erzeugte Namen, Varianten, Slash-Modifikatoren und beliebige Werte vor der Tailwind-Kompilierung.

Das Foundation-Vokabular deckt häufige Layout- und Typografieaufgaben ab:

| Zweck | Recipes |
| --- | --- |
| Layout | `xtm-page`, `xtm-stack`, `xtm-stack-compact`, `xtm-cluster`, `xtm-grid` |
| Flächen | `xtm-surface`, `xtm-card`, `xtm-toolbar` |
| Typografie | `xtm-title`, `xtm-heading`, `xtm-body`, `xtm-muted`, `xtm-plain-text` für Plain Text mit erhaltenen Zeilenumbrüchen |
| Aktionen | `xtm-actions`, `xtm-primary-action` |

Zusammengesetzte Shell-Recipes beschreiben stabile App-Regionen:

| Recipe | Einsatzzweck | Typische XTend-Komponenten |
| --- | --- | --- |
| `xtm-app-shell` | vollständiger App-Rahmen | `x-surface-manager`, `x-header`, `x-router`, `x-drawer` |
| `xtm-top-app-bar` | Titel und globale Aktionen | `x-header`, `x-button`, `x-icon` |
| `xtm-workspace` | Navigation, Haupt- und Detailbereich | `x-surface-region`, `x-section`, `x-side-panel` |
| `xtm-navigation-rail` | responsive App-Navigation | `x-drawer`, `x-menu` |
| `xtm-detail-pane` | kontextbezogene Details | `x-side-panel`, `x-section` |

Flow-Recipes komponieren vertraute Produktaufgaben:

| Recipe | Einsatzzweck |
| --- | --- |
| `xtm-form-flow` | beschriftete Controls, Validierungsstatus und Aktionen |
| `xtm-feedback-stack` | dauerhafter Status, Fortschritt und vorübergehendes Feedback |
| `xtm-dashboard` | Zusammenfassungen, Kennzahlen und ergänzender Content |
| `xtm-content-page` | inhaltsorientierte Seiten mit Header, Body und Aside |
| `xtm-settings-page` | gruppierte Einstellungen und Speicheraktionen |
| `xtm-empty-state` | ein leeres Ergebnis mit hilfreicher nächster Aktion |
| `xtm-confirmation-flow` | eine durch RMT koordinierte Bestätigungsfläche |

Recipes erzeugen kein Interaktionsverhalten. Ein `xtm-form-flow` benötigt weiterhin `x-form`, passende Controls und eine RMT-Validierung. Ein `xtm-confirmation-flow` benötigt weiterhin Dialogsemantik, Fokuswiederherstellung und eine RMT-Action oder Transition. Diese Ownership-Grenze verhindert, dass visuelles CSS zu einer unzugänglichen Verhaltensschicht wird.

## Tokens, Themes und Dichte

`--xtend-*`-Custom-Properties sind die einzige produktive Token-Quelle. XTend Material bildet seine Recipes darauf ab und führt keine unabhängige Palette ein. Lade bei Verwendung des nativen Pfads oder einer Host-CSS-Pipeline beide öffentlichen Stylesheets:

```css
@import "@xtend-material/core/tokens.css";
@import "@xtend-material/core/styles.css";
```

Wähle Präsentationspaket und Dichte an einem stabilen App-Vorfahren:

```html
<html data-theme="light" data-material-pack="enterprise" data-density="comfortable">
```

`enterprise` mit `comfortable` ist die robuste Kombination für allgemeine Anwendungen. `utility` mit `compact` passt zu fokussierten Werkzeugen mit häufigen Aktionen. `dense` ist für informationsreiche Expertenoberflächen verfügbar; die Variante darf weder Zielgrößen noch sichtbaren Fokus oder lesbare Labels entfernen.

Theme-Wechsel bleiben Eigentum von `x-theme`. Unterstützt werden Light, Dark, High Contrast und Forced Colors. Recipes verwenden Token-Fallbackketten und Reduced-Motion-Regeln. Ein Theme-Wechsel benötigt deshalb weder neu erzeugtes RMT noch dynamische Klassennamen.

Passe semantische XTend-Tokens an der Produktgrenze an, wenn Branding erforderlich ist:

```css
:root {
  --xtend-surface-page: #f6f8fb;
  --xtend-surface-panel: #ffffff;
  --xtend-text-primary: #172033;
  --xtend-focus-ring: #155eef;
}
```

Bearbeite weder generiertes Tailwind-CSS noch private Utility-Expansionen. Ein Token-Override überlebt den Wechsel zum nativen Provider; ein kopierter generierter Selektor nicht.

## Build, Tune und Evidence

Verwende den normalen Maraca-Lifecycle. Produktionsanwendungen sollten erst dann getunt werden, wenn Source-Topologie und Routen repräsentativ sind:

```bash
xt maraca plan --config maraca.config.json --json
xt maraca build --config maraca.config.json --json
xt maraca tune src/app.rmt --config maraca.tuned.config.json --out dist --write --json
```

Tune bewertet die unterstützten Kombinationen aus Profil, Lazy Loading und CSS-Ausgabe und sperrt dabei semantische Optionen wie CSS Provider, Source-Liste, Validierung und Transitions. Committe die erzeugte Tune-Konfiguration und verwende `--check` in Regressionstests. Ein Tune-Ergebnis gehört zur konkreten App-Source; die Auswahl eines anderen Produkts zu kopieren ist kein gleichwertiger Nachweis.

Prüfe `xtend.maraca.report.json` auf Provider-Identität, ausdrückliches Source-Inventar, Toolchain-Versionen, Output-Fingerprint und Supply-Chain-Evidence. Ein gesunder Material-Build meldet keinen Netzwerkzugriff, keine temporären Compilerdateien, deaktiviertes Preflight und null Tailwind-Runtime-Bytes.

## Unterstützte Syntax und Grenzen

Der RMT-Authoring-Vertrag akzeptiert statische, in Anführungszeichen gesetzte `xtm-*`-Klassennamen aus der Recipe Registry. Absichtlich nicht unterstützt werden:

- rohe Utilities wie `flex`, `p-4` oder `grid-cols-3`;
- Varianten wie `hover:`, `dark:` oder responsive Präfixe;
- beliebige Werte wie `w-[37rem]`;
- Slash-Modifikatoren und Opacity-Kürzel;
- String-Interpolation oder zur Laufzeit zusammengesetzte Klassen;
- ausführbare Tailwind-Konfiguration und Tailwind-Plugins von Drittanbietern;
- automatische Monorepo-Source-Erkennung;
- Browser-Imports aus `tailwindcss` oder `@tailwindcss/node`.

Wenn ein Produkt ein wiederverwendbares visuelles Muster benötigt, das der Registry fehlt, komponiere zunächst vorhandene Recipes und Komponenten. Ergänze ein Design-Kit-Recipe nur dann, wenn das Muster allgemein ist, Token-, Responsive-, Accessibility- und Native-Fallback-Verhalten besitzt und als öffentliches Vokabular unterstützt werden kann. Produktspezifisches Branding gehört normalerweise in die Token-Schicht des Produkts.

## Kompatibilität

| Bereich | Unterstützter Vertrag |
| --- | --- |
| Node.js | 24 oder neuer |
| Tailwind CSS | exakt geprüfte Baseline `4.3.2` |
| XTend Material | `@xtend-material/core` `0.1.x` |
| Maraca Adapter | `@xtend-material/maraca-tailwind` `0.1.x` |
| XTend-/Maraca-Peers | `^0.6.1` |
| Tailwind-Browser-Runtime | nicht unterstützt |
| Tailwind Preflight | deaktiviert |
| Rückweg zum nativen CSS Provider | unterstützt |
| Angular-Material- oder Material-Web-APIs | keine kompatiblen APIs |

Version `0.1.x` bedeutet, dass das Paket über die dokumentierte Oberfläche einsetzbar ist, während Recipe-Ergänzungen und Verbesserungen vor 1.0 weiterlaufen können. Das Entfernen oder Ändern eines dokumentierten Recipes, Exports oder Verhaltens benötigt innerhalb der 0.x-Linie eine Minor-Version mit Migrationshinweisen. Patch-Versionen bleiben kompatiblen Korrekturen und Dokumentationsverbesserungen vorbehalten.

## Fehlerbehebung

**Der Plan meldet eine unbekannte Material-Klasse.** Prüfe die Schreibweise und vergleiche die Klasse mit den Tabellen oben. Ergänze keine Tailwind-Safelist. Verwende ein öffentliches Recipe oder schlage ein owned Recipe mit nativem Fallback vor.

**Der Adapter wird nicht aufgelöst.** Installiere `@xtend-material/maraca-tailwind` neben der Anwendung und kontrolliere, ob `tailwind` als Provider konfiguriert ist. Das Framework lädt oder ersetzt den Adapter niemals still aus dem Netzwerk.

**Eine RMT-Klasse erzeugt kein CSS.** Kontrolliere, ob RMT- und CSS-Pfad beide unter `cssSources` stehen, innerhalb des Projektverzeichnisses liegen und `src/app.css` die Tailwind-Layer für Theme und Utilities importiert.

**Controls sehen falsch aus oder verhalten sich unerwartet.** Material-Recipes ersetzen keine Komponentenregistrierung. Prüfe, ob die RMT-Surface eine bekannte XTend-Komponente referenziert, und lies deren öffentliche Attribute, Slots und Events. Greife niemals auf einen privaten Shadow Root zu, um die Darstellung zu reparieren.

**Die Anwendung benötigt eine eigene Marke.** Überschreibe semantische `--xtend-*`-Tokens. Behalte Layout-Recipes, solange deren Struktur passt; ersetze ein Recipe nur bei einer tatsächlich abweichenden Komposition.

**Tailwind soll entfernt werden.** Folge dem bidirektionalen [XTend-Material-Migrationsleitfaden](./xtend-material-migration.md). Dieselben semantischen Klassen können das öffentliche native Stylesheet verwenden, ohne RMT-Business-Records zu verändern.

## Nächste Schritte

- [Zu oder von XTend Material migrieren](./xtend-material-migration.md)
- [XTend Maraca verstehen](./xtend-maraca.md)
- [RMT-Anwendungen entwickeln](./rmt-vnext-authoring.md)
- [Design Tokens anpassen](./design-tokens.md)
- [XTend-Komponenten durchsuchen](./components.md)
