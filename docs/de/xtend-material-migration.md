# XTend-Material-Migration

Migriere eine vorhandene Maraca Shell zu semantischen Material-Recipes oder entferne den Tailwind Provider, ohne das App-Verhalten zu verändern.

Migrationsvertrag: `xtend.material.migration.v1`

## Wähle die Richtung

Dieser Leitfaden behandelt zwei unabhängige Änderungen:

- **Design Kit einführen:** Ersetze handgeschriebenes Shell- und Flow-Layout-CSS durch öffentliche `xtm-*`-Recipes und kompiliere diese Recipes mit dem lokalen Maraca Tailwind Provider.
- **Zum nativen CSS zurückkehren:** Behalte semantische Recipes und RMT-Business-Records, entferne den Tailwind Adapter und lade das native Stylesheet aus `@xtend-material/core`.

Keine Richtung verlangt Änderungen an Component APIs, State-IDs, Selectors, Actions, Validierungs- oder Transition-Records. Behandle eine Verhaltensänderung während dieser Migration als unabhängige App-Änderung und prüfe sie getrennt.

Stelle vor der Bearbeitung sicher, dass die aktuelle Anwendung baut. Sichere Bundle-Report, CSS-Bytezahl und repräsentative Browser-Screenshots. Eine Migration lässt sich besser beurteilen, wenn Layoutänderungen nicht mit unabhängigen Features vermischt werden.

## Inventarisiere die vorhandene Shell

Beginne mit einem Ownership-Inventar. Notiere zu jedem handgeschriebenen Selektor seinen Zweck, die verwendende Komponente oder RMT-Surface und ob er visuelle Komposition oder Verhalten steuert.

```text
.app-shell          vollständiger Seitenrahmen
.app-header         globales Header-Layout
.sidebar            App-Navigation
.content-grid       Dashboard-Content-Layout
.profile-form       Feld- und Aktionslayout
.save-message       Statusdarstellung
```

Verschiebe ausschließlich visuelle Komposition in Material-Recipes. Fokus, Validierung, Dialog, Tastaturbedienung und Live Regions bleiben bei Komponenten oder RMT. Entferne jeden Workaround, der auf einen privaten Shadow Root zugreift, statt ihn zu übertragen.

Eine häufige erste Zuordnung ist:

| Vorhandener Selektor | Material-Recipe | Prüfhinweis |
| --- | --- | --- |
| `.app-shell` | `xtm-app-shell` | benötigt klare Banner-, Navigations- und Main-Regionen |
| `.app-header` | `xtm-top-app-bar` | Header-Verhalten bleibt bei `x-header` |
| `.sidebar` | `xtm-navigation-rail` | responsives Drawer-Verhalten gehört den Navigationskomponenten |
| `.workspace` | `xtm-workspace` | Source-Reihenfolge für kompakte Layouts erhalten |
| `.content-grid` | `xtm-dashboard` oder `xtm-grid` | Flow-Absicht statt bloßer Ähnlichkeit wählen |
| `.profile-form` | `xtm-form-flow` | RMT-Validierung bleibt erforderlich |
| `.save-message` | `xtm-feedback-stack` | komponenteneigene Statussemantik verwenden |

Ordne einen Selektor nicht allein aufgrund eines ähnlichen Screenshots zu. Lies die Slot-, Responsive- und Accessibility-Absicht im [XTend-Material-Leitfaden](./xtend-material.md).

## Führe XTend Material ein

### 1. Pakete ergänzen

Installiere exakt kompatible Paketlinien. Committe den Lockfile in derselben Änderung.

```bash
npm install @xtend-material/core@0.1 @xtend-material/maraca-tailwind@0.1 @ccslabs/xtend-maraca@^0.6.1
```

Tailwind ist bereits eine Paketabhängigkeit von Design Kit und Adapter. Ergänze weder Browser-Script noch CDN-Stylesheet, `npx`-Buildschritt oder eine zweite Tailwind-Konfiguration.

### 2. Owned CSS Input anlegen

Erstelle `src/app.css`:

```css
@layer theme, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities);
```

Preflight fehlt absichtlich. Vorhandene XTend-Komponenten- und Theme-Baselines behalten die Verantwortung für Element-Normalisierung.

### 3. Maraca konfigurieren

Ergänze die CSS-Provider-Einstellungen in der vorhandenen Build-Konfiguration. Erhalte bestehende Optionen für Orchestrierung, Kernel, Hydration, Validierung und Transitions.

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

Ausdrückliche `cssSources` machen Review und air-gapped Kompilierung deterministisch. Verwende keine automatische Source-Erkennung, um fehlende Pfade zu verdecken.

### 4. Selektoren Region für Region ersetzen

Beginne mit der äußeren Shell, danach folgen Navigation, Hauptinhalt und Flows. Halte jede Zwischenrevision buildbar.

Vorher:

```rmt
state app.shell type object preserve {
  initial {
    id "app-shell"
    viewTemplate { class "app-shell" }
  }
}
```

Nachher:

```rmt
state app.shell type object preserve {
  initial {
    id "app-shell"
    viewTemplate { class "xtm-app-shell" }
  }
}
```

State-ID und sämtliche Business-Records bleiben unverändert. Wiederhole die Ersetzung bei Klassen mit eindeutig passendem öffentlichem Recipe. Lege markenspezifische Token-Overrides in ein kleines Produkt-Stylesheet, anstatt generierte Recipe-Selektoren zu kopieren.

### 5. Ersetztes CSS entfernen

Lösche einen Legacy-Selektor erst, wenn alle Consumer migriert sind und die Browserprüfung grün ist. Behalte App-CSS, das echte Produktidentität, inhaltsspezifische Typografie oder ein Layout ohne öffentliches Recipe beschreibt. Das Ziel ist klare Ownership, nicht eine App ohne eigenes CSS.

Suche vor dem Entfernen nach verbliebenen Referenzen:

```bash
rg -n "app-shell|app-header|sidebar|content-grid|profile-form|save-message" src site tests
```

### 6. Planen, bauen und tunen

```bash
xt maraca plan --config maraca.config.json --json
xt maraca build --config maraca.config.json --json
xt maraca tune src/app.rmt --config maraca.tuned.config.json --out dist --write --json
```

Behebe Inventar-Diagnostics an der Source. Eine Safelist oder ein Ausweg über rohe Utilities versteckt ein Ownership-Problem und gehört nicht zur unterstützten Migration.

### 7. Sichtbares Verhalten prüfen

Prüfe mindestens einen Desktop- und einen kompakten Viewport. Teste Tastaturreihenfolge, sichtbaren Fokus, Validierung, Öffnen und Schließen von Dialogen, Fokuswiederherstellung, Status-Announcements, Dark Theme, Forced Colors und Reduced Motion. Vergleiche neue CSS-Bytes und Maraca-Report mit der aufgezeichneten Baseline.

Die Migration ist abgeschlossen, wenn jeder verbleibende App-Selektor einen erklärten Produktgrund besitzt und das Source-Inventar jede neue `xtm-*`-Klasse erkennt.

## Kehre zum nativen Provider zurück

Der Exit-Pfad ist absichtlich kürzer als die Einführung. Er weist nach, dass Tailwind weder App-Runtime noch Business-Logic-Abhängigkeit ist.

### 1. Semantische Klassen behalten

Schreibe `xtm-app-shell`, `xtm-dashboard` und andere öffentliche Recipes nicht um. `@xtend-material/core/styles.css` implementiert dieselbe semantische Oberfläche als nativen Fallback.

### 2. Öffentliche native Styles laden

Importiere Token Bridge und natives Stylesheet über die CSS-Pipeline des Hosts:

```css
@import "@xtend-material/core/tokens.css";
@import "@xtend-material/core/styles.css";
```

### 3. Tailwind-Provider-Optionen entfernen

Entferne `cssProvider: "tailwind"`, `cssInput`, `cssSources`, `cssPreflight` und die Tailwind-spezifische Fallback-Einstellung aus der Maraca-Konfiguration. Wähle den normalen nativen CSS-Pfad des Hosts. Alle unabhängigen Build- und Orchestrierungsoptionen bleiben erhalten.

### 4. Adapter entfernen

```bash
npm uninstall @xtend-material/maraca-tailwind
```

Behalte `@xtend-material/core`, denn dieses Paket besitzt Recipe-Metadaten, Tokens und natives Stylesheet. Entferne eine direkte `tailwindcss`-Abhängigkeit nur dann, wenn kein anderes lokales Build-Werkzeug sie verwendet.

### 5. Parität nachweisen

Baue erneut und vergleiche RMT-Source-Fingerprint, ausgewählte Komponenten, Actions, Validierung und Transition-Records. Diese Records müssen identisch bleiben. CSS-Fingerprints unterscheiden sich wegen des geänderten Compilerpfads; semantische Klassenabdeckung und Browserverhalten bleiben gleichwertig.

```bash
xt maraca plan --config maraca.config.json --json
xt maraca build --config maraca.config.json --json
```

Das Browser-Bundle enthält vor und nach der Migration keinen Tailwind-Runtime-Code.

## Rollback-Strategie

Halte Paketänderung, Konfiguration, RMT-Klassenersetzung und Legacy-CSS-Entfernung in gut prüfbaren Commits. Schlägt die visuelle Prüfung fehl, stelle für die zuletzt bearbeitete Region Legacy-Selektor und RMT-Klasse wieder her, während bereits geprüfte Regionen erhalten bleiben. Erzeuge keinen Hybridselektor aus kopiertem Tailwind-Output und Legacy-CSS; ihm fehlt eine stabile Ownership und er erschwert den späteren nativen Exit.

Schlägt der Provider selbst fehl, kehre wie oben beschrieben zum nativen Provider zurück. Aktiviere weder stillen Netzwerkzugriff noch eine ungeprüfte Tailwind-Version.

## Häufige Migrationsfehler

**Eine rohe Tailwind-Klasse steht in RMT.** Ersetze sie durch ein öffentliches Recipe. Wenn kein Recipe die Absicht ausdrückt, behalte eine produkteigene semantische Klasse, bis ein wiederverwendbarer Vertrag existiert.

**Ein Dialog sieht richtig aus, aber die Tastaturbedienung ist schlechter.** Stelle Component- und RMT-Ownership wieder her. Material darf den Confirmation Flow gestalten, aber Fokusbegrenzung, Escape und Fokuswiederherstellung sind keine CSS-Aufgaben.

**Das kompakte Layout läuft über.** Prüfe semantische Source-Reihenfolge und Recipe-Slots, bevor du einen Breakpoint ergänzt. Shell-Recipes degradieren Navigation und Detailregionen absichtlich; manuelle feste Breiten verhindern dieses Verhalten häufig.

**Der native Exit verändert Business-Records.** Stoppe und nimm diese RMT-Änderungen zurück. Eine Provider-Migration betrifft nur CSS-Konfiguration und Paketabhängigkeiten.

**Generiertes CSS wurde manuell bearbeitet.** Verschiebe die gewünschte Markenänderung in ein `--xtend-*`-Token oder einen produkteigenen semantischen Selektor, generiere den Output neu und verwirf das bearbeitete Artefakt.

## Migrationscheckliste

- [ ] Baseline-Build-Report, CSS-Bytes und Browser-Screenshots sind aufgezeichnet.
- [ ] Legacy-Selektoren besitzen Zweck- und Ownership-Notizen.
- [ ] Pakete und Lockfile verwenden kompatible exakte Linien.
- [ ] Maraca-Sources sind ausdrücklich deklariert und Preflight ist deaktiviert.
- [ ] RMT enthält ausschließlich bekannte statische `xtm-*`-Klassen.
- [ ] Komponentenverhalten und RMT-Business-Records sind unverändert.
- [ ] Produkttoken-Overrides sind von generiertem CSS getrennt.
- [ ] Desktop-, Compact-, Tastatur-, Theme- und Accessibility-Prüfungen sind grün.
- [ ] Tune-Output gehört zur migrierten Source.
- [ ] Der Rückweg zum nativen Provider wurde ausgeführt.

## Verwandte Leitfäden

- [XTend Material](./xtend-material.md)
- [XTend Maraca](./xtend-maraca.md)
- [Design Tokens](./design-tokens.md)
- [RMT Authoring](./rmt-vnext-authoring.md)
