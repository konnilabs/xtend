# XTend Signature UI und Typografie Designrichtung

- Status: Completed
- Datum: 13. Mai 2026
- Workpackage: `ECH-WP-00`
- Contract: `xtend.signature-ui.direction.v1`
- Zielstatus: `enterprise-design-system-ready`
- Bezug:
  - `development/XTend-Enterprise-Component-Flexibilitaets-und-Theme-Hardening-Backlog.md`
  - `development/XTend-Component-Styling-Token-und-Part-Contract.md`
  - `development/XTend-Runtime-A11y-UX-Contract.md`
  - `development/XTend-Enterprise-Design-System-Token-Contract.md`
  - `design-tokens/themes/xtend-signature.json`

## Zweck

`ECH-WP-00` definiert die sichtbare Designrichtung fuer XTend-Komponenten. Das Ziel ist ein Default-Design, das als eigenstaendige Premium-Enterprise-UI wahrgenommen wird und gleichzeitig eine robuste Ausgangsbasis fuer Corporate Design Systeme bleibt.

Die Designrichtung ersetzt nicht den Styling Contract. Sie ergaenzt ihn um visuelle Qualitaetskriterien: XTend-Komponenten muessen nicht nur tokenisiert und themebar sein, sondern im Default-Theme hochwertig, ruhig, praezise und wiedererkennbar wirken.

## Leitentscheidung

XTend Default UI ist ein Produktmerkmal.

Ab ECH-WP-00 gilt:

- XTend hat eine sichtbare Signature, nicht nur neutrale Skinning-Flaechen.
- Enterprise-Anmutung entsteht durch Praezision, Rhythmus, Typografie und kontrollierte Tiefe, nicht durch generische Kartenstapel.
- Corporate Themes duerfen die Optik stark veraendern, aber Lesbarkeit, Dichte, Fokus, Zustandsklarheit und Flaechenhierarchie bleiben Qualitaetsinvarianten.
- Typografie ist eine Designsystem-Schicht mit Rollen und Tokens, kein einzelner Font-Fallback.
- Die Default-UI darf nicht nach austauschbarer SaaS- oder Tailwind-Standardkomposition aussehen.

## Signature Principles

### 1. Quiet Precision

XTend soll ruhig und sicher wirken. Visuelle Energie entsteht aus exakter Ausrichtung, stimmigen Proportionen, feiner Tiefe und klaren Zustaenden.

Pflichten:

- sichtbare optische Achsen zwischen Labels, Controls, Icons und Actions
- klare Grid- und Stack-Rhythmen
- keine zufaelligen Einzelabstaende
- Interaktionen wirken schnell und kontrolliert
- Focus und Active States sind sichtbar, aber nicht grell

### 2. Material ohne Dekor

XTend verwendet Flaechen, Kanten und Tiefe als Orientierungshilfe. Dekorative Effekte duerfen die Struktur nicht ersetzen.

Pflichten:

- Elevation ist sparsam und hierarchisch
- Border und Shadow ergaenzen sich, statt doppelt zu schreien
- Glassmorphism ist kein universeller Default
- Backdrops und Overlays haben klare Funktion
- transparente Flaechen brauchen kontrastsichere Fallbacks

### 3. Productive Density

XTend ist fuer echte Enterprise-Arbeit gemacht: Monitoring, Admin, Content, Workflows, technische UIs, RMT Authoring und App-Shells.

Pflichten:

- `comfortable` wirkt offen und hochwertig
- `compact` wirkt produktiv und fokussiert
- `dense` bleibt lesbar und nicht billig
- Dichte reduziert Abstaende kontrolliert, nicht wahllos
- Text, Icon und Hit Target bleiben proportional

### 4. Strong Defaults, Strong Overrides

Die XTend Signature ist ein starker Default, kein Lock-in.

Pflichten:

- jedes Signature-Merkmal hat einen Token- oder Part-Pfad
- Corporate Themes koennen Farbe, Radius, Tiefe, Typografie und Layout veraendern
- Overrides duerfen nicht gegen A11y- und Contrast-Invarianten arbeiten
- Komponentendokus zeigen Signature Default und Corporate Override nebeneinander

### 5. Distinct Enterprise Voice

XTend darf nicht generisch wirken.

Vermeiden:

- gleichfoermige `rounded-xl shadow-sm border bg-white`-Aesthetik
- Dashboard aus austauschbaren Karten ohne Informationshierarchie
- Einheitsblau als einzige Markenhandlung
- uebermaessige Gradients als Premium-Signal
- wahllose 12px/16px Spacing-Muster ohne Rolle
- typografische Einheitsgroesse

Anstreben:

- ruhige Oberflaechen mit feinen Kanten
- markante, aber sparsame Typografie-Akzente
- aktive Bereiche mit praeziser Statussprache
- Menues und Overlays mit hochwertiger Innenarchitektur
- Form Controls mit klarer Input-Wuerde, nicht nur Browser-Reset

## Signature Token Layers

XTend nutzt drei Ebenen:

1. Product Tokens: globale `--xtend-*` Tokens fuer Produktsemantik.
2. Signature Tokens: globale Rollen fuer sichtbare XTend-Handschrift.
3. Component Tokens: `--xtend-<component>-*` als konkrete Override-Flaeche.

Beispiel:

```css
:root {
  --xtend-signature-surface-raised: #f7f8fb;
  --xtend-signature-edge-subtle: rgba(34, 42, 56, 0.14);
  --xtend-signature-shadow-panel: 0 18px 48px rgba(22, 27, 38, 0.16);
}

x-header {
  --xtend-header-menu-surface: var(--xtend-signature-surface-raised, var(--xtend-surface));
  --xtend-header-menu-border-color: var(--xtend-signature-edge-subtle, var(--xtend-border-color));
  --xtend-header-menu-elevation: var(--xtend-signature-shadow-panel, var(--xtend-shadow));
}
```

Pflicht-Tokens fuer die Signature-Schicht:

```css
--xtend-signature-surface-page
--xtend-signature-surface-raised
--xtend-signature-surface-panel
--xtend-signature-surface-inset
--xtend-signature-edge-subtle
--xtend-signature-edge-strong
--xtend-signature-ink
--xtend-signature-ink-muted
--xtend-signature-accent
--xtend-signature-accent-soft
--xtend-signature-shadow-control
--xtend-signature-shadow-panel
--xtend-signature-shadow-overlay
```

## Typography System

Typografie ist die wichtigste sichtbare Differenzierungsschicht fuer XTend. Die Default-Stimme soll praezise, technisch, elegant und lesbar sein.

### Typografische Rollen

| Rolle | Zweck | Default-Richtung |
|-------|-------|------------------|
| `display` | seltene grosse Marken- oder Produktmomente | markant, eng kontrolliert, nicht herohaft in Tools |
| `heading` | Abschnitts- und Panelstruktur | eigenstaendig, ruhige Spannung, klare Hierarchie |
| `body` | laengerer Inhalt | neutral, sehr lesbar, robuste Fallbacks |
| `label` | Form- und Control-Bezeichnungen | kompakt, leicht verdichtet, nicht farb-only |
| `control` | Button, Select, Menu Item, Tab | praezise, mittleres Gewicht, klare Hit-Zone |
| `caption` | Metadaten, Hints, Nebeninfos | kleiner, aber kontrast- und rhythmusstabil |
| `numeric` | Messwerte, Counts, Statuszahlen | tabellarisch, scanbar, stabil |
| `code` | RMT, Tokens, technische Werte | integriert, nicht fremd wirkend |

### Typography Tokens

Pflicht-Tokens fuer die Signature-Schicht:

```css
--xtend-font-family-body
--xtend-font-family-heading
--xtend-font-family-control
--xtend-font-family-code
--xtend-font-size-display
--xtend-font-size-heading-lg
--xtend-font-size-heading-md
--xtend-font-size-heading-sm
--xtend-font-size-body
--xtend-font-size-label
--xtend-font-size-control
--xtend-font-size-caption
--xtend-line-height-display
--xtend-line-height-heading
--xtend-line-height-body
--xtend-line-height-control
--xtend-font-weight-heading
--xtend-font-weight-body
--xtend-font-weight-label
--xtend-font-weight-control
--xtend-font-weight-strong
--xtend-font-feature-numeric
```

Regeln:

- Keine viewport-skalierte Schriftgroesse.
- Keine negativen Letter-Spacing-Defaults.
- Heading darf charaktervoller sein als Body.
- Controls verwenden eigene Typografie-Rolle, nicht blind Body.
- Dense UI reduziert Groessen vorsichtig, nicht die Lesbarkeit.
- Corporate Fonts werden ueber Tokens injiziert.
- Fallbacks muessen ohne Layoutsprung akzeptabel bleiben.

### Default-Font-Strategie

XTend darf keine externe Font-Abhaengigkeit erzwingen. Die Signature bleibt lokal und performant.

Default-Kette:

```css
--xtend-font-family-body: "Aptos", "Inter", "Segoe UI", system-ui, sans-serif;
--xtend-font-family-heading: "Aptos Display", "Inter", "Segoe UI", system-ui, sans-serif;
--xtend-font-family-code: "Cascadia Code", "SFMono-Regular", Consolas, monospace;
```

Corporate Theme Beispiel:

```css
:root {
  --xtend-font-family-body: var(--corp-font-text, "Source Sans 3", system-ui, sans-serif);
  --xtend-font-family-heading: var(--corp-font-display, var(--corp-font-text));
  --xtend-font-family-control: var(--corp-font-ui, var(--corp-font-text));
}
```

## Color und Surface Direction

XTend Signature ist nicht einfarbig. Die Palette ist ruhig, aber materialreich.

Default-Richtung:

- Base Surface: warm-neutrales, leicht technisches Off-White
- Raised Surface: minimal kuehler fuer Panels und Menues
- Ink: dunkles Graphit statt reines Schwarz
- Accent: klares Cyan/Blue als Energiepunkt, nicht Flaechenflut
- State Colors: direkt, kontrastreich, nicht pastellig verwaschen
- Dark Mode: tiefe neutrale Flaechen mit klarer Edge-Sprache, nicht nur invertiertes Light Theme

Regeln:

- Akzentfarbe darf nicht jede aktive Flaeche dominieren.
- Active State kombiniert Farbe, Gewicht, Kante oder Markierung.
- Status nutzt Icon/Form/Label-Mechanik und nicht nur Hintergrundfarbe.
- Corporate Themes duerfen Hue und Materialitaet aendern, muessen aber Kontrast halten.

## Shape, Edge und Elevation

XTend braucht ein konsistentes Formsystem.

Default-Richtung:

- Radius ist moderat und rollenbasiert.
- Kleine Controls duerfen praeziser sein als grosse Panels.
- Panels nutzen Kante plus sparsame Tiefe.
- Menues und Overlays haben sichtbare Innenstruktur.
- Keine universelle Pill-Optik fuer alles.

Shape Tokens:

```css
--xtend-radius-xs
--xtend-radius-sm
--xtend-radius-md
--xtend-radius-lg
--xtend-radius-panel
--xtend-radius-control
```

Elevation Tokens:

```css
--xtend-elevation-0
--xtend-elevation-1
--xtend-elevation-2
--xtend-elevation-3
--xtend-elevation-focus
```

## Interaction Direction

Interaktionen sollen hochwertig und unmittelbar wirken.

Regeln:

- Hover veraendert Flaeche oder Kante subtil.
- Active wirkt gedrueckt oder verankert, nicht nur dunkler.
- Focus ist klar sichtbar und kontrastsicher.
- Disabled reduziert Interaktionsversprechen, bleibt aber lesbar.
- Loading und Busy behalten Layoutstabilitaet.
- Motion ist kurz, funktional und reduced-motion-sicher.

Motion Tokens:

```css
--xtend-motion-duration-instant
--xtend-motion-duration-fast
--xtend-motion-duration-base
--xtend-motion-easing-standard
--xtend-motion-easing-enter
--xtend-motion-easing-exit
```

## Component Signature Notes

### x-header

Rolle: App-Shell-Anker, Branding, Navigation und Orientierung.

Signature:

- praezise Brand/Search/Actions-Achse
- hochwertiger Menu Trigger
- Menue-Surfaces mit klarer Kante und Innenrhythmus
- Typografie fuer Brand und Navigation sichtbar differenziert
- `drawer`, `side-panel`, `popover`, `fullscreen`, `inline-main` wirken wie Varianten desselben Systems

Corporate Override:

- Logo, Farbe, Radius, Typografie, Menu Placement, Surface Material und Dichte duerfen stark variieren.
- Fokus, Hit Targets, Navigation-Semantik und Textkontrast bleiben invariant.

### x-button

Rolle: Aktionstraeger.

Signature:

- kontrollierte Flaechen statt generischem Pill-Button
- Icon/Text-Proportionen stabil
- Primary ist eindeutig, aber nicht grell
- Quiet/Ghost Varianten behalten Kante und Fokusqualitaet

Corporate Override:

- Farbe, Shape, Gewichtung, Icon-Pack und Motion duerfen angepasst werden.

### x-menu

Rolle: scanbare Navigation und Befehlsstruktur.

Signature:

- klare Gruppe/Item/Active-Hierarchie
- Active State nicht nur Hintergrundfarbe
- Disclosure Icons als echte Icon Controls
- lange Labels umbrechen kontrolliert

Corporate Override:

- Dichte, Indentation, Active Marker und Typografie duerfen stark angepasst werden.

### x-drawer und x-side-panel

Rolle: schwere Navigation, Inspektion, Einstellungen und sekundaire Workflows.

Signature:

- Surface mit praeziser Kante und Innenlayout
- Close und Dock Controls als hochwertige Iconbuttons
- modale und nicht-modale Modi visuell unterscheidbar
- Header/Content/Footer-Zonen klar

Corporate Override:

- Breite, Placement, Backdrop, Radius, Elevation und Typografie duerfen variieren.

### x-modal und x-dialog

Rolle: fokussierte Entscheidung, Warnung oder Editor.

Signature:

- kein generischer Center-Card-Look
- Titel, Body, Actions und Close Control bilden eine ruhige Hierarchie
- Warnung/Error hat klare Semantik ohne Schreien
- Fokusfalle und Escape sind sichtbar verstaendlich

Corporate Override:

- Surface, Radius, Action Layout und Statussprache duerfen angepasst werden.

### x-popover

Rolle: leichte Kontextflaeche.

Signature:

- kompakt, praezise, nahe am Ausloeser
- keine Modal-Anmutung, wenn nicht modal
- klare Kante und guter Textkontrast

Corporate Override:

- Arrow, Placement, Width, Surface und Kante duerfen angepasst werden.

### x-toast

Rolle: nicht-blockierendes Feedback.

Signature:

- ruhige Statusinformation mit Icon, Text und optionaler Aktion
- kein greller Notification-Look
- Close Control als Iconbutton
- Stack bleibt lesbar und kontrolliert

Corporate Override:

- Statusfarben, Placement, Motion und Radius duerfen angepasst werden.

### x-input

Rolle: Dateneingabe in dichten Enterprise-Flows.

Signature:

- Label, Control, Helper und Error bilden eine klare vertikale Einheit
- Focus wirkt praezise, nicht dekorativ
- Invalid/Error ist strukturell sichtbar, nicht nur rot
- Dense Mode bleibt vertrauenswuerdig

Corporate Override:

- Border, Surface, Radius, Font, Error-Sprache und Dichte duerfen angepasst werden.

## Signature Theme Reference

Das begleitende Theme-Pack `design-tokens/themes/xtend-signature.json` ist ein Referenzartefakt fuer diese Richtung. Es ist bewusst nicht als finaler Produkt-Export markiert. Es dient als Zielbild fuer:

- Token-Namen und Alias-Ketten
- typografische Rollen
- Signature Surface und Edge Defaults
- P0-Komponenten-Fixtures
- spaetere Visual-Quality-Gates

## Corporate Theme Bridge

Corporate Themes duerfen XTend stark veraendern. Der empfohlene Pfad ist:

1. Corporate globale Tokens definieren.
2. XTend Product Tokens auf Corporate Tokens mappen.
3. Signature Tokens auf Corporate Materialsystem mappen.
4. Component Tokens nur fuer echte Abweichungen setzen.

Beispiel:

```css
:root {
  --corp-brand-primary: #005a9c;
  --corp-surface-page: #f4f6f8;
  --corp-surface-panel: #ffffff;
  --corp-text-main: #17202a;
  --corp-radius-control: 6px;

  --xtend-color-primary: var(--corp-brand-primary);
  --xtend-surface: var(--corp-surface-page);
  --xtend-signature-surface-raised: var(--corp-surface-panel);
  --xtend-text: var(--corp-text-main);
  --xtend-radius-control: var(--corp-radius-control);
}
```

## Anti-Pattern Gates

ECH-WP-10 soll spaeter reporten, wenn Default-Komponenten in diese Muster kippen:

- zu viele gleichartige Karten ohne Informationshierarchie
- dominante Einheitsfarbe ohne Surface-System
- Shadow-only Hierarchie
- uebermaessige Rundungen ohne Rolle
- unmotivierte Gradients oder Glass-Effekte
- Typografie ohne Rollen
- Buttons, Tabs und Menu Items mit identischer Formensprache
- Focus nur als duenne Browser-Outline ohne Designsystem-Anschluss
- Dense Mode als blosses Zusammenschieben

## Signature Fixture Matrix

P0 Signature Fixtures muessen mindestens diese Zustaende zeigen:

- Default Light
- Default Dark
- Corporate Override
- Comfortable
- Compact
- Dense
- Hover
- Focus
- Active/Selected
- Disabled
- Empty
- Loading/Busy
- Error/Invalid

P0-Komponenten fuer die erste Fixture-Welle:

- `x-header`
- `x-button`
- `x-menu`
- `x-drawer`
- `x-side-panel`
- `x-modal`
- `x-dialog`
- `x-popover`
- `x-toast`
- `x-input`

## Definition of Done fuer ECH-WP-00

ECH-WP-00 gilt als fachlich gestartet, wenn:

- dieses Designrichtungsdokument vorliegt
- ein Signature Theme Referenzpack vorliegt
- Typografie-Rollen und Tokens definiert sind
- P0-Komponenten Signature Notes besitzen
- Corporate Theme Bridge dokumentiert ist
- Anti-Patterns fuer spaetere Gates benannt sind

ECH-WP-00 ist abgeschlossen, weil:

- `signature-ui-visual-quality` als lokaler Gate existiert
- `tests/browser/fixtures/xtend-signature-ui-smoke.html` die Signature Richtung sichtbar prueft
- `x-header` als Pilot Signature-Tokens sichtbar konsumiert
- die P0-Komponentenwelle in `ECH-WP-02` bis `ECH-WP-10` konkrete Folgepakete besitzt

## Handoff

Direkte Folgepakete:

- `ECH-WP-02`: Style- und Control-Audit muss `signatureDesign` und Typography Tokens als Kategorien kennen.
- `ECH-WP-03`: XTheme Token Alias Layer muss `xtend-signature` und Corporate Bridge aufnehmen.
- `ECH-WP-05`: XHeader Menu Modes muessen die Signature-Anforderungen sichtbar umsetzen.
- `ECH-WP-10`: Visual Quality Gate muss die Anti-Patterns und Fixture Matrix produktisieren.
