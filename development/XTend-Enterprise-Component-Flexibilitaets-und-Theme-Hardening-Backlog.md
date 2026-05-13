# XTend Enterprise Component Flexibilitaets- und Theme-Hardening Backlog

- Status: Draft
- Datum: 13. Mai 2026
- Contract: `xtend.enterprise.component-flex-hardening.v1`
- Zielstatus: `enterprise-design-system-ready`
- Bezug:
  - `development/XTend-Component-Shell-Contract.md`
  - `development/XTend-Component-Styling-Token-und-Part-Contract.md`
  - `development/XTend-Runtime-A11y-UX-Contract.md`
  - `development/XTend-Overlay-und-Interaction-UX-Reife-Contract.md`
  - `development/XTend-Navigation-und-Routing-UX-Reife-Contract.md`
  - `development/XTend-Epic11-Component-Shell-Visual-Theme-Matrix.md`
  - `development/XTend-Signature-UI-und-Typografie-Designrichtung.md`
  - `design-tokens/themes/xtend-signature.json`
  - `components/xheader.js`
  - `components/xheader.d.ts`
  - `docs/components/xheader.md`

## Zweck

Dieses Dokument definiert die naechste Haertungswelle fuer XTend Web Components: Komponenten sollen nicht nur `enterprise-ready` im Sinne von Contract, Fixture und Typing sein, sondern in echten Drittanbieter-Designsystemen flexibel, themebar, barrierearm und layoutvariabel nutzbar bleiben.

Die Kernforderung lautet:

XTend-Komponenten duerfen kein sichtbares Design erzwingen. Sie muessen ein stabiles, gut aussehendes Default-Theme liefern, aber jeder visuell relevante Wert und jede produktrelevante Layoutentscheidung muss fuer Host-Apps ueber XTend.css, XTheme, CSS Custom Properties, CSS Parts, Slots, Attribute oder RMT-Daten kontrollierbar sein.

## Sichtbare Design-Ambition

Dieses Backlog beruehrt ausdruecklich die sichtbare UI. Ziel ist nicht nur technische Themebarkeit, sondern ein hochwertiges, eigenstaendiges XTend Default-Design, das in Enterprise-Systemen sofort vertrauenswuerdig, elegant und praezise wirkt.

XTend darf nicht wie die 1000. austauschbare SaaS UI aussehen. Das Standarddesign muss sich bewusst von verbreiteten 0815 Tailwind-UIs absetzen: weniger generische Kartenlandschaften, weniger beliebige Blautoene, weniger gleichfoermige Rounded-Rectangle-Fluten, weniger dekorative Gradients als Ersatz fuer Gestaltung. XTend braucht eine erkennbare visuelle Handschrift, die ruhig, produktiv, hochwertig und trotzdem beeindruckend ist.

Die Standard-UI ist dabei kein starres Branding. Sie ist eine anspruchsvolle Ausgangsbasis fuer Unternehmen:

- XTend liefert eine eigene Signature-Aesthetik mit klaren Formen, praezisem Rhythmus, hochwertiger Typografie und kontrollierter Tiefe.
- Externe Unternehmen koennen diese Basis ueber Corporate Tokens, XTheme, CSS Parts und Slots stark modifizieren.
- Die Default-Komponenten muessen auch ohne Corporate Theme wie ein fertiges Premium-Enterprise-Framework wirken.
- Die Customization darf die Qualitaet nicht zerstoeren: Overrides muessen strukturiert, semantisch und kontrastsicher bleiben.
- Visual Quality ist ein Abnahmekriterium, nicht ein spaeter Polish-Schritt.

## Leitentscheidung

Design-System-Kompatibilitaet und sichtbare Produktqualitaet sind Public API.

Ab dieser Haertungswelle gilt:

- Styling ist nicht privat, sondern Teil des Component Contracts.
- XTend bekommt ein eigenes Signature Default Design, das hochwertig, ruhig, elegant und wiedererkennbar ist.
- Anpassbarkeit darf nicht bedeuten, dass die Default-UI generisch oder unfertig wirkt.
- XTheme ist der primaere Theme-Kontext; Host-Tokens und XTend.css muessen gleichwertig funktionieren.
- Komponenten duerfen Light, Dark, High Contrast und Forced Colors nicht nur theoretisch, sondern im Browser lesbar und bedienbar unterstuetzen.
- UI-Steuerelemente verwenden Symbole, SVG oder `x-icon`, keine Textzeichen, Emojis oder Glyph-Tricks.
- Layoutmodi duerfen nicht zufaellig aus CSS entstehen, sondern brauchen dokumentierte Varianten, Attribute, Tokens, Events und Snapshot-Daten.
- Bestehende Defaults bleiben kompatibel, werden aber als ueberschreibbare Modi modelliert.

## Nicht verhandelbare Regeln

### R1: Keine visuell wirksame Hardcodierung ohne Public Override

Jede visuell relevante CSS-Entscheidung braucht mindestens eine stabile Override-Flaeche.

Pflichtbereiche:

- Farbe und Alpha
- Border, Border-Color und Border-Width
- Radius
- Shadow und Elevation
- Spacing, Padding, Gap und Margin
- Typografie, Font Family, Font Size, Font Weight, Line Height und Letter Spacing
- Icon-Farbe, Icon-Groesse und Stroke
- Control-Groesse und Hit Target
- Layoutbreiten, Max-Width, Max-Height, Breakpoints und Grid-Templates
- Motion-Dauer, Timing Function und Transform-Distanz
- Layering, Z-Index und Overlay-Backdrops

Erlaubt sind technische Literale nur, wenn sie keine Designentscheidung darstellen oder ueber einen Public Token kapselbar bleiben.

| Fall | Erlaubt | Bedingung |
|------|---------|-----------|
| Schema-Strings, Eventnamen, Rollen | ja | keine visuelle Wirkung |
| CSS-Fallback in `var()` | ja | Token ist public und dokumentiert |
| Browser-Fix oder Accessibility-Invariant | ja | Kommentar oder Contract-Bezug vorhanden |
| Direkte Farbe wie `#fff`, `rgba(...)` oder `CanvasText` | nur eingeschraenkt | nur als Fallback oder forced-colors Systemfarbe |
| Direkte Pixelwerte fuer Controls | nur eingeschraenkt | public Token fuer Size/Hit Target vorhanden |
| Direkte `font-family` | nein | muss ueber Token laufen |
| Direkte `box-shadow`, `border-radius`, `padding`, `gap` | nein | muss ueber Token laufen |

Minimalmuster:

```css
:host {
  --xtend-header-surface: var(--xtend-surface, var(--section-bg, Canvas));
  --xtend-header-text: var(--xtend-text, CanvasText);
  --xtend-header-radius: var(--xtend-radius-md, 0.75rem);
}

[part="root"] {
  background: var(--xtend-header-surface);
  color: var(--xtend-header-text);
  border-radius: var(--xtend-header-radius);
}
```

Nicht ausreichend:

```css
header {
  background: #ffffff;
  color: #1f2937;
  border-radius: 0.85rem;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12);
}
```

### R2: Tokens folgen einer stabilen Alias-Kette

Komponenten verwenden eine dreistufige Token-Kette:

1. Component Token: `--xtend-<component>-<property>`
2. Global XTend Token: `--xtend-<category>-<name>`
3. sicherer Fallback: Systemfarbe, `currentColor`, `transparent` oder dokumentierter Default

Beispiel:

```css
--xtend-header-menu-hover-surface: var(
  --xtend-color-action-hover-surface,
  color-mix(in srgb, currentColor 12%, transparent)
);
```

Wenn `color-mix()` nicht eingesetzt wird, muss der Fallback trotzdem lesbar bleiben und in der Theme-Matrix getestet werden.

### R3: CSS Parts sind Skinning API

Jede sichtbare Zone braucht einen `part`.

Pflichtparts fuer alle sichtbaren Komponenten:

- `root`
- `control` fuer interaktive Hauptflaechen
- `content`
- `label`, wenn sichtbarer Text gerendert wird
- `icon`, wenn Symbole gerendert werden
- `surface`, wenn eine Flaeche oder ein Panel gerendert wird
- `backdrop`, wenn eine Abdunklung oder Inert-Flaeche existiert

Komponenten duerfen spezifische Parts ergaenzen, zum Beispiel `trigger`, `menu`, `menu-surface`, `menu-item`, `close`, `header`, `footer`, `thumb`, `track`, `option` oder `tab`.

Part-Namen sind Public API. Entfernen oder Umbenennen ist ein Breaking Change oder braucht eine dokumentierte Migration.

### R4: XTheme ist Pflicht, nicht optionaler Komfort

Jede Komponente muss in diesen Modi lesbar und bedienbar bleiben:

- `light`
- `dark`
- `high-contrast`
- `forced-colors`
- `prefers-reduced-motion`
- `comfortable`
- `compact`
- `dense`

Pflichten:

- Text, Icons und Controls muessen Kontrast halten.
- Focus muss sichtbar bleiben.
- Disabled, Active, Selected, Invalid, Error und Busy duerfen nicht nur ueber Farbe kommuniziert werden.
- Icons verwenden `currentColor`, ausser ein dokumentierter Token ueberschreibt das bewusst.
- Transparente Flaechen brauchen einen kontrastsicheren Text- und Border-Fallback.
- Komponenten duerfen keine lokalen Theme-Attribute erfinden, die XTheme umgehen.

### R5: Keine Textzeichen, Emojis oder Glyphen als Controls

Interaktive Steuerelemente duerfen nicht ueber sichtbare Textzeichen gestaltet werden.

Verboten:

- `X`, `x`, `&times;`, `+`, `-`, `...`, `&#9776;`, `&#10003;`, `&#9888;`, Emojis oder vergleichbare Glyphen als sichtbare Control-Grafik
- `innerHTML = "&times;"` oder aehnliche Close-Buttons
- Burger-Menues als Textzeichen
- Statussymbole nur als Emoji

Erlaubt:

- `x-icon` mit Core- oder registriertem Icon-Pack
- Inline-SVG mit `aria-hidden="true"` und `currentColor`
- CSS-gezeichnete Linien, wenn sie als dekorative Grafik in einem echten Button liegen, per Token steuerbar sind und nicht auf Textzeichen basieren

Controls brauchen:

- echten Button oder passende native Semantik
- `aria-label` oder sichtbaren Namen
- `part` fuer Control und Icon
- Focus-Style ueber Token
- `disabled`/`aria-disabled` Verhalten

### R6: Layoutvarianten sind Attribute, Tokens und Snapshots

Wenn eine Komponente mehrere sinnvolle Darstellungsformen haben kann, muss das als explizite Public API modelliert werden.

Pflicht je Layoutvariante:

- Attribut oder Property
- Default und Fallback-Verhalten
- CSS Parts fuer relevante Flaechen
- Tokens fuer Groesse, Abstand, Breite und Positionierung
- Snapshot-Feld
- Event bei Layoutwechsel
- Docs-Beispiel
- Fixture-Abdeckung
- RMT-Authoring-Feld, wenn die Komponente RMT-kompatibel ist

Nicht akzeptabel ist eine einzige fest verdrahtete Variante, wenn Enterprise-Host-Apps realistisch mehrere brauchen.

### R7: Shadow DOM darf Host-Design nicht blockieren

Shadow DOM bleibt erlaubt und bevorzugt, aber nur mit expliziter Skinning-Oberflaeche.

Pflichten:

- alle sichtbaren Zonen per `part`
- alle visuellen Werte per Custom Property
- Slots fuer semantisch sinnvolle Inhalte
- keine globalen Font- oder Body-Annahmen
- keine erzwungenen CDN-, Icon- oder Font-Abhaengigkeiten
- kein globales Z-Index-Rennen ohne Token

### R8: Accessibility gehoert zur Variante

Jede Layout- oder Interaktionsvariante muss A11y separat bestehen.

Beispiele:

- Ein Drawer braucht Escape, Focus Return und passende Navigation-Semantik.
- Ein modales Side Panel braucht Fokusfalle und Background-Inert.
- Ein nicht-modales Side Panel darf den Hauptinhalt nicht unzugaenglich machen.
- Ein Inline-Main-Menue braucht Landmark-/Navigation-Semantik und darf Fokus nicht aus dem Hauptfluss reissen.
- Ein fullscreen Menue braucht klare Close- und Route-Wechsel-Logik.

### R9: Docs zeigen Override-Flaechen, nicht nur Defaults

Jede Komponentendoku muss enthalten:

- Attribute/Properties fuer Varianten
- CSS Custom Properties mit Zweck und Fallback
- CSS Parts
- Slots
- XTheme-Hinweise
- A11y-Verhalten je Variante
- mindestens ein Host-Design-Beispiel mit Drittanbieter-Tokens
- Migrationshinweise fuer Legacy-Defaults

### R10: Gates muessen Drift verhindern

Keine neue oder geaenderte Komponente gilt als abgeschlossen, wenn sie nur manuell im Browser gut aussieht.

Pflichtgates:

- statischer Style-Audit gegen harte visuelle Literale
- Component Contract
- Styling Contract
- Runtime-A11y
- Theme Matrix
- relevante Component-Suite
- Fixture mit mindestens Light und Dark
- Forced-Colors Smoke fuer interaktive Komponenten
- Visual Snapshot oder DOM-basierter Snapshot fuer Layoutvarianten

### R11: Default UI muss eine XTend Signature haben

Die Default-Komponenten muessen sichtbar gestaltet sein, nicht nur neutral zusammengesetzt.

Pflichtqualitaeten:

- praezise Flaechenhierarchie statt beliebiger Card-Stapel
- kontrollierte Tiefe mit sparsamer Elevation statt generischer Shadow-Defaults
- klare Kanten, Radien und Trennlinien mit erkennbarem System
- ruhige, aber nicht langweilige Interaktionszustaende
- produktive Dichte ohne Enge
- hochwertige Empty, Loading, Error und Disabled States
- bewusst gestaltete Icon-, Text- und Control-Proportionen
- konsistente optische Achsen zwischen Header, Navigation, Forms, Overlays und Feedback

Verbotene Default-Anmutungen:

- austauschbares Tailwind-SaaS-Lookalike
- grossflaechige One-Color-Paletten ohne Material- und Hierarchiegefuehl
- beliebige Hero-/Card-Kompositionen fuer operative Enterprise-Komponenten
- uebermaessige Rundungen ohne System
- dekorative Gradients, die echte Struktur ersetzen
- unmotivierte Glassmorphism-Flaechen als universeller Stil
- UI, die nur durch Corporate Re-Skinning hochwertig wirkt

Jede sichtbare P0-Komponente braucht eine kurze `signatureDesign`-Notiz in Docs oder Profilmetadaten:

- Welche visuelle Rolle hat die Komponente?
- Welche XTend-Signature-Merkmale traegt sie?
- Welche Teile duerfen Corporate Themes stark veraendern?
- Welche Qualitaetsinvarianten duerfen Themes nicht brechen?

### R12: Typografie ist ein eigenstaendiges Designsystem

XTend Typografie darf nicht nur ein austauschbarer Systemfont-Fallback sein. Das Default-Theme braucht eine interessante, eigenstaendige typografische Stimme, die trotzdem enterprise-tauglich, performant und internationalisierbar bleibt.

Pflichten:

- typografische Rollen fuer Display, Heading, Body, Label, Control, Code, Numeric und Caption
- Token fuer Font Family, Font Size, Line Height, Font Weight, Optical Rhythm und optional Letter Spacing
- keine viewport-skalierte Schriftgroesse
- keine negativen Letter-Spacing-Defaults
- klare Hierarchie in dichten Komponenten, Overlays und Shells
- Zahlen und Statuswerte mit stabiler Lesbarkeit
- Corporate-Font-Bridge ueber Tokens
- Fallback-Kette ohne Layoutspruenge

Default-Richtung:

- Body und Control Text bleiben ruhig, praezise und langstreckentauglich.
- Headings duerfen eigenstaendiger und markanter sein.
- Labels und Navigation nutzen subtile Gewichtung statt reiner Farbe.
- Code- und technische Werte bekommen eine eigene, aber integrierte Rolle.
- Typografie muss auch in Dense Enterprise UIs hochwertig bleiben.

## Audit-Checkliste je Komponente

Diese Checkliste wird fuer jede sichtbare Komponente abgearbeitet.

### Sichtbare UI und Signature Design

- Wirkt die Komponente im Default-Theme hochwertig und fertig?
- Hat sie eine erkennbare XTend-Handschrift statt generischer SaaS-Anmutung?
- Sind Flaechenhierarchie, Rhythmus, Dichte, Tiefe und Kanten bewusst gestaltet?
- Sind Hover, Active, Focus, Disabled, Error, Empty und Loading sichtbar hochwertig?
- Fuehlt sich die Komponente in einer operativen Enterprise-Shell passend an?
- Bleibt sie als Corporate-Theme-Basis stark modifizierbar?
- Gibt es eine `signatureDesign`-Notiz oder Doku zu visueller Rolle und Qualitaetsinvarianten?

### Typografie

- Nutzt die Komponente typografische Rollen statt Einzelwerte?
- Sind Label, Control, Body, Caption, Status und Code unterscheidbar?
- Sind Font Family, Size, Weight und Line Height tokenisiert?
- Bleibt Text in `compact` und `dense` lesbar?
- Gibt es keine viewport-skalierte Schrift und keine negativen Letter-Spacing-Defaults?
- Funktioniert die Corporate-Font-Bridge ohne Layoutbruch?

### Styling Surface

- Hat die Komponente component-scoped Tokens mit `--xtend-<component>-...`?
- Verweisen diese Tokens auf globale XTend Tokens oder Host Tokens?
- Haben alle Tokens sichere Fallbacks?
- Sind direkte Farben, Schatten, Radien, Font Families, Abstaende und Groessen entfernt oder tokenisiert?
- Sind Hover, Active, Selected, Disabled, Invalid, Error und Busy tokenisiert?
- Sind alle sichtbaren Shadow-Zonen per `part` erreichbar?
- Sind Slots fuer semantisch austauschbare Inhalte vorhanden?

### XTheme und Kontrast

- Funktionieren `light`, `dark`, `high-contrast` und `forced-colors`?
- Bleiben Textlabels, Iconbuttons, Fokus und Statussignale lesbar?
- Funktioniert `prefers-reduced-motion` ohne Funktionsverlust?
- Gibt es keine Flaeche, deren Textfarbe nur zufaellig vom Host erbt?
- Gibt es keine transparenten Layer mit unklarem Kontrast?

### Controls und Iconography

- Werden alle Control-Symbole ueber `x-icon`, Inline-SVG oder CSS-Grafik gerendert?
- Gibt es keine sichtbaren Textzeichen als Close, Menu, Toggle, Status oder Collapse Control?
- Haben Iconbuttons `aria-label` oder eine sichtbare Bezeichnung?
- Nutzen Icons `currentColor`?
- Sind Icon Size, Stroke und Control Size tokenisiert?

### Layout und Responsiveness

- Sind Layoutmodi explizit statt implizit?
- Sind Breakpoints und Grid-/Flex-Templates ueberschreibbar?
- Gibt es stabile Snapshot-Felder fuer aktive Modi?
- Gibt es Events bei Layoutwechseln?
- Koennen lange Labels, Slotted Controls und Host-Menues nicht ueberlaufen?
- Sind Min-/Max-Werte ueber Tokens oder Attribute steuerbar?

### A11y Runtime

- Sind Rolle, Name und State korrekt?
- Funktionieren Keyboard-Pfade?
- Ist Fokus sichtbar?
- Gibt es Focus Return bei Overlays?
- Sind modale Varianten inert oder funktional gleichwertig?
- Sind Screenreader-Signale sinnvoll, aber nicht redundant?

## XHeader Zielbild

`x-header` ist die Pilotkomponente fuer diese Haertungswelle, weil sie Branding, Slots, Navigation, Overlay, Layout und Theme auf engem Raum verbindet.

Der Pilot muss sichtbar zeigen, was XTend unter Premium Enterprise UI versteht: ein ruhiger, praeziser App-Shell-Header mit klarer Flaechenhierarchie, hochwertigem Trigger, starker Typografie fuer Brand und Navigation, eleganten Menue-Surfaces und Corporate-freundlicher Anpassbarkeit. `x-header` darf im Default nicht wie ein beliebiger Tailwind-Navbar-Baukasten wirken.

### Aktuelle Beobachtung

Der aktuelle Stand ist bereits deutlich weiter als eine reine Legacy-Komponente: `x-header` hat Shadow DOM, Slots, CSS Parts, A11y-/Performance-Metadaten, Reduced Motion, Forced Colors, Snapshot und State-Anbindung.

Die Enterprise-Luecken sind trotzdem sichtbar:

- Der Menumodus ist in Source, Typen, Docs und Tests als `fixed-full-width-overlay` festgelegt.
- Mehrere visuelle Werte liegen direkt im Shadow CSS, zum Beispiel RGBA-Flaechen, Schatten, Spacing, Buttongroessen, Link-Padding und Focus-Farbe.
- Die Public Types erlauben nur `drawerMode: 'fixed-full-width-overlay'`.
- Die Layout-Metadaten beschreiben eine feste responsive Strategie statt eine Menge von Menu Presentation Modes.
- Host-Apps koennen Full-Width-Drawer anpassen, aber nicht sauber zwischen Side Panel, Popover, Inline-Main und Fullscreen waehlen.

### Signature-Anforderungen fuer XHeader

- Brand, Navigation, Search und Actions muessen optisch ein bewusstes Shell-System bilden.
- Der Menue-Trigger braucht eine hochwertige Iconbutton-Anmutung, kein generisches Kreisbutton-Pattern ohne Kontext.
- Menue-Surfaces brauchen klare Tiefe, Kante, Innenrhythmus und Typografie.
- Link- und Active-States muessen elegant und scanbar sein, nicht nur farbig hinterlegt.
- Dichteprofile duerfen den Header produktiver machen, aber nicht billiger wirken lassen.
- Corporate Themes duerfen Radius, Farbe, Typografie, Tiefe und Layout stark veraendern, ohne die A11y- und Rhythmus-Invarianten zu brechen.

### Ziel-API

Neue Attribute:

| Attribut | Werte | Default | Zweck |
|----------|-------|---------|-------|
| `menu-mode` | `drawer`, `side-panel`, `popover`, `fullscreen`, `inline-main` | `drawer` | Menu Presentation Mode |
| `menu-placement` | `start`, `end`, `top`, `bottom` | `end` | bevorzugte Position |
| `menu-modal` | Boolean | mode-abhaengig | Fokusfalle/Inert fuer modale Modi |
| `menu-open` | Boolean | `false` | declarative open state |
| `menu-breakpoint` | CSS length token oder Preset | `md` | Wechsel zwischen inline und overlay |
| `menu-width` | CSS length | mode-abhaengig | Breite fuer Panel/Popover |
| `menu-max-height` | CSS length | viewport-abhaengig | Hoehenbegrenzung |
| `menu-align` | `start`, `center`, `end`, `stretch` | `stretch` | Inhalt alignment |

Neue Snapshot-Felder:

```ts
type XHeaderMenuMode = 'drawer' | 'side-panel' | 'popover' | 'fullscreen' | 'inline-main';
type XHeaderMenuPlacement = 'start' | 'end' | 'top' | 'bottom';

interface XHeaderSnapshot {
  menuOpen: boolean;
  menuMode: XHeaderMenuMode;
  menuPlacement: XHeaderMenuPlacement;
  menuModal: boolean;
  compact: boolean;
}
```

Kompatibilitaet:

- `drawerMode: 'fixed-full-width-overlay'` bleibt fuer eine Version als Alias im Snapshot erhalten.
- Ohne neue Attribute rendert `x-header` weiter wie bisher.
- Docs markieren `drawerMode` als Legacy-Snapshot-Feld.

### Menu Presentation Modes

| Mode | Verhalten | A11y | Typische Nutzung |
|------|-----------|------|------------------|
| `drawer` | fixed Overlay unter/nahe Header, optional volle Breite | Navigation, Escape, Focus Return | bestehender Default, Docs-Shell |
| `side-panel` | seitliches Panel links oder rechts | optional modal, Focus Trap bei modal | Enterprise Apps, Settings, lange Navigation |
| `popover` | kompaktes Menu nahe Trigger | nicht modal, Escape, Outside Click | kleine Produktseiten, Utility-Menues |
| `fullscreen` | vollflaechige Navigation | modal, Focus Trap, Close Control | mobile Hauptnavigation |
| `inline-main` | Navigation rendert im Dokumentfluss oder Main-Bereich | keine Overlay-Falle, Landmark sauber | Portale, Dashboard-Shells, breite Desktop-Layouts |

### XHeader Tokens

Pflicht-Tokens fuer `x-header`:

```css
--xtend-header-surface
--xtend-header-text
--xtend-header-border-color
--xtend-header-border-width
--xtend-header-radius
--xtend-header-elevation
--xtend-header-padding-block
--xtend-header-padding-inline
--xtend-header-gap
--xtend-header-font-family
--xtend-header-font-size
--xtend-header-font-weight
--xtend-header-focus-ring
--xtend-header-logo-size
--xtend-header-logo-radius
--xtend-header-logo-surface
--xtend-header-trigger-size
--xtend-header-trigger-radius
--xtend-header-trigger-surface
--xtend-header-trigger-hover-surface
--xtend-header-trigger-icon-size
--xtend-header-trigger-icon-stroke
--xtend-header-menu-surface
--xtend-header-menu-text
--xtend-header-menu-border-color
--xtend-header-menu-radius
--xtend-header-menu-elevation
--xtend-header-menu-padding
--xtend-header-menu-gap
--xtend-header-menu-width
--xtend-header-menu-max-width
--xtend-header-menu-max-height
--xtend-header-menu-backdrop
--xtend-header-menu-item-padding
--xtend-header-menu-item-radius
--xtend-header-menu-item-hover-surface
--xtend-header-menu-item-active-surface
--xtend-header-menu-item-active-text
--xtend-header-z-index
--xtend-header-menu-z-index
--xtend-header-motion-duration
--xtend-header-motion-easing
```

Kompatibilitaets-Aliase wie `--header-bg`, `--header-fg`, `--burger-color` und `--header-menu-bg` duerfen bleiben, muessen aber auf die neuen `--xtend-header-*` Tokens zeigen.

### XHeader Parts

Pflichtparts:

- `root`
- `brand`
- `logo`
- `title`
- `search`
- `actions`
- `utility`
- `trigger`
- `trigger-icon`
- `menu`
- `menu-surface`
- `menu-content`
- `nav`
- `backdrop`, wenn modal oder fullscreen

Legacy-Parts `drawer` und `drawer-surface` bleiben als Alias fuer `menu` und `menu-surface`, solange der bestehende Full-Width-Drawer unterstuetzt wird.

### XHeader Events

Bestehende Events bleiben:

- `header-ready`
- `header-layout-changed`
- `menu-opened`
- `menu-closed`
- `logo-loaded`

Neue Events:

- `menu-mode-changed`
- `menu-placement-changed`
- `menu-before-open`
- `menu-before-close`

`menu-before-*` duerfen cancelbar werden, wenn der Component Network Contract dies fuer Host-Orchestrierung freigibt.

## Backlog-Uebersicht

| ID | Prioritaet | Status | Workstream | Titel | Hauptartefakte |
|----|------------|--------|------------|-------|----------------|
| `ECH-WP-00` | P0 | completed | Visual Design | XTend Signature UI Direction und Typografie definieren | Visual Principles, Typography Tokens, Signature Fixtures |
| `ECH-WP-01` | P0 | completed | Contract | Enterprise Component Flex Hardening Contract ratifizieren | Contract, Validator-Plan, Reference-Link |
| `ECH-WP-02` | P0 | completed | Audit | Statischen Style- und Control-Audit bauen | Gate `enterprise-component-style-audit` |
| `ECH-WP-03` | P0 | completed | Theme | XTheme Token Alias Layer fuer Komponenten normalisieren | Token-Matrix, Theme Fixtures |
| `ECH-WP-04` | P0 | completed | Controls | Glyph- und Textzeichen-Controls eliminieren | Icon-Control-Gate, Close/Menu Icons |
| `ECH-WP-05` | P0 | completed | XHeader | XHeader Menu Presentation Modes implementieren | Source, Types, Docs, Tests |
| `ECH-WP-06` | P1 | completed | Overlay | Drawer, Side Panel, Modal, Dialog, Popover auf Mode/Token-Paritaet pruefen | Overlay Mode Matrix |
| `ECH-WP-07` | P1 | completed | Layout | Layout/Display/Media Komponenten tokenisieren | Layout Token Gate, Docs, Fixtures, x-header bis x-code |
| `ECH-WP-08` | P1 | completed | Forms | Form Controls gegen Theme/A11y Edge Cases haerten | Form Theme/A11y Gate, Density Fixtures, x-input bis x-form |
| `ECH-WP-09` | P1 | completed | Navigation | Navigation, Menu, Tabs und Router active states haerten | Navigation State Hardening Gate, x-menu, x-tabs, x-router, x-link, x-header |
| `ECH-WP-10` | P1 | completed | Visual | Visual- und DOM-Snapshot-Matrix fuer Modi und Signature UI ausbauen | Visual DOM Snapshot Matrix Gate, Browser-Fixture, JSON-DOM-Baseline |
| `ECH-WP-11` | P2 | completed | Docs | Component Authoring Guide fuer Drittanbieter-Designs schreiben | Third-Party Design Authoring Guide, Gate, P0 Token-/Part-Referenz |
| `ECH-WP-12` | P2 | completed | Release | SemVer, Migration und Adoption Handoff abschliessen | Release Handoff, SemVer/Migration Notes, Gate |

## Workpackages im Detail

### ECH-WP-00 - XTend Signature UI Direction und Typografie definieren

- Prioritaet: P0
- Status: completed
- Ziel:
  - Eine sichtbare XTend Designrichtung definieren, die hochwertig, eigenstaendig und enterprise-tauglich ist, ohne Corporate Customization zu blockieren.
- Scope:
  - Signature UI Principles fuer Flaechen, Rhythmus, Dichte, Tiefe, Radius, Linien, Icon-Proportionen und Interaktionszustaende
  - Typografisches System fuer Display, Heading, Body, Label, Control, Code, Numeric und Caption
  - Default Theme als Premium-Ausgangsbasis statt neutralem Rohzustand
  - Anti-Patterns gegen generische Tailwind-/SaaS-Anmutung
  - Corporate Theme Bridge fuer starke Modifikation durch Host-Designsysteme
  - P0 Signature Fixtures fuer `x-header`, `x-button`, `x-menu`, `x-drawer`, `x-modal`, `x-input`, `x-toast`
- Zielartefakte:
  - `development/XTend-Signature-UI-und-Typografie-Designrichtung.md`
  - `design-tokens/themes/xtend-signature.json`
  - `tests/browser/fixtures/xtend-signature-ui-smoke.html`
  - `tests/browser/signature_ui_visual_quality_suite.js`
  - Gate `signature-ui-visual-quality`
- Run-Status:
  - Designrichtungsdokument angelegt
  - Signature Theme Referenzpack angelegt
  - Browser-Fixture angelegt
  - Visual-Quality-Gate im Runner angebunden
  - `x-header` konsumiert Signature-Tokens als Pilot
- Definition of Done:
  - XTend Default UI hat beschriebene visuelle Prinzipien
  - Typografie-Rollen und Tokens sind definiert
  - P0-Komponenten haben eine sichtbare Signature-Richtung
  - Fremdtheme-Beispiele zeigen starke Corporate-Modifikation ohne Qualitaetsverlust
  - generische SaaS-/Tailwind-Anmutung ist als Anti-Pattern pruefbar beschrieben

### ECH-WP-01 - Enterprise Component Flex Hardening Contract ratifizieren

- Prioritaet: P0
- Status: completed
- Ziel:
  - Dieses Dokument als verbindliche Regelbasis fuer die naechste Komponentenwelle etablieren.
- Scope:
  - Contract-Name und Status finalisieren
  - Bezug zu Shell, Styling, Runtime-A11y und Overlay Contracts herstellen
  - Definition of Done fuer flexible Komponenten festlegen
  - Ausnahmen fuer technische Literale dokumentieren
- Zielartefakte:
  - `development/XTend-Enterprise-Component-Flexibilitaets-und-Theme-Hardening-Backlog.md`
  - `xtend-builder/typing/enterprise-component-flex-hardening-contract.js`
  - `xtend-builder/typing/enterprise-component-flex-hardening-contract.d.ts`
  - `tests/components/enterprise_component_flex_hardening_contract_suite.js`
  - Gate `enterprise-component-flex-hardening-contract`
- Run-Status:
  - Factory `createEnterpriseComponentFlexHardeningContract()` angelegt
  - Validator `validateEnterpriseComponentFlexHardeningContract()` angelegt
  - Regeln R1 bis R12 als maschinenlesbare Rule Set API modelliert
  - Signature UI, XTheme, Typografie, Control Iconography, Layoutvarianten und XHeader Pilot als Contract-Domains pruefbar
  - Runner und Package Script angebunden
- Definition of Done:
  - Regeln R1 bis R12 sind akzeptiert
  - Backlog ist priorisiert
  - XHeader ist als Pilot markiert
  - lokale Gates sind benannt

Lokaler Gate:

```bash
node scripts/run_xtend_tests.js enterprise-component-flex-hardening-contract --json
```

### ECH-WP-02 - Statischen Style- und Control-Audit bauen

- Prioritaet: P0
- Status: completed
- Ziel:
  - Hardcoded Styling und Textzeichen-Controls automatisch finden.
- Scope:
  - Source-Scan fuer `components/*.js`, `src/components/**/*.ts`, Docs und Fixtures
  - Whitelist fuer Schema, ARIA, Tests und erlaubte Fallbacks
  - Report mit Component, Datei, Zeile, Kategorie und Vorschlag
- Audit-Kategorien:
  - `style.color.literal`
  - `style.surface.literal`
  - `style.radius.literal`
  - `style.shadow.literal`
  - `style.spacing.literal`
  - `style.typography.literal`
  - `style.z-index.literal`
  - `control.text-glyph`
  - `control.missing-icon-part`
  - `theme.missing-forced-colors`
  - `theme.missing-reduced-motion`
- Zielartefakte:
  - `catalog/enterprise-component-style-audit.js`
  - `tests/components/enterprise_component_style_audit_suite.js`
  - Gate `enterprise-component-style-audit`
  - Runner-Anschluss in `scripts/run_xtend_tests.js`
  - Report-Schema `xtend.enterprise.component-style-audit-report.v1`
- Run-Status:
  - Statische Audit-Engine fuer Source, Docs und Fixtures angelegt.
  - Kategorien fuer direkte Farben, Flaechen, Radius, Schatten, Spacing, Typografie, Z-Index, Textzeichen-Controls, Icon-Part-Luecken und Theme/Motion-Abdeckung implementiert.
  - Known-Residual-Baseline fuer vorhandene Legacy-/P0-Dateien eingefuehrt, damit neue P0-Verstoesse blockieren, waehrend bestehende Befunde sichtbar bleiben.
  - Findings enthalten konkrete Remediation-Hinweise fuer Tokenisierung, XTheme-Kompatibilitaet, Forced Colors, Reduced Motion und Icon Parts.
  - Runner- und Package-Script `enterprise-component-style-audit` angeschlossen.
- Lokaler Gate:

```bash
node scripts/run_xtend_tests.js enterprise-component-style-audit --json
```

- Definition of Done:
  - Gate erkennt direkte Farben ausserhalb erlaubter Fallbacks
  - Gate erkennt `&times;`, sichtbares `X` und Emoji-Controls
  - Gate kann bekannte Legacy-Dateien als bewusstes Residual markieren
  - Gate blockiert neue Verstosse in P0-Komponenten

### ECH-WP-03 - XTheme Token Alias Layer normalisieren

- Prioritaet: P0
- Status: completed
- Ziel:
  - Komponentenweit eine einheitliche Token-Kette sicherstellen.
- Scope:
  - globale `--xtend-color-*`, `--xtend-surface-*`, `--xtend-text-*`, `--xtend-radius-*`, `--xtend-space-*`, `--xtend-elevation-*`, `--xtend-motion-*`
  - component-scoped Alias-Tokens fuer alle P0-Komponenten
  - Mapping alter Token-Namen auf neue Namen
- Zielartefakte:
  - `design-tokens/xtheme-token-alias-layer.js`
  - `design-tokens/xtheme-token-alias-layer.d.ts`
  - `development/XTend-XTheme-Token-Alias-Layer.md`
  - `tests/browser/fixtures/xtheme-token-alias-layer-smoke.html`
  - `tests/tokens/xtheme_token_alias_layer_suite.js`
  - Gate `xtheme-token-alias-layer`
  - XTend.css/XTheme Beispiele im Token-Mapping-Dokument
  - Theme-Fixture fuer Light, Dark, High Contrast und Forced Colors
- Run-Status:
  - Versionierten Alias-Layer `xtend.theme.token-alias-layer.v1` angelegt.
  - Globale Alias-Prefixes fuer Color, Surface, Text, Radius, Space, Elevation und Motion normalisiert.
  - Legacy-Mapping fuer alte Token-Namen wie `--xtend-shadow`, `--xtend-radius`, `--header-bg`, `--drawer-bg` und `--button-text-color` dokumentiert.
  - Component-scoped Alias-Gruppen fuer alle P0-Komponenten definiert.
  - `x-theme` stellt `getTokenAliasLayer()` bereit und bindet den Alias-Layer in `getDesignTokenContract()` sowie den Theme Context ein.
  - `x-button` und `x-menu` als sichtbare P0-Piloten auf Alias-Tokens gehaertet.
  - Package Export und Runner-Gate angeschlossen.
- Lokaler Gate:

```bash
node scripts/run_xtend_tests.js xtheme-token-alias-layer --json
```

- Definition of Done:
  - P0-Komponenten erben XTheme ohne lokale Theme-Sonderlogik
  - Host-Apps koennen per XTend.css alle sichtbaren Flaechen ueberschreiben
  - keine P0-Komponente hat unlesbare Text/Flaechen-Kombinationen in der Theme-Matrix

### ECH-WP-04 - Glyph- und Textzeichen-Controls eliminieren

- Prioritaet: P0
- Status: completed
- Ziel:
  - Alle sichtbaren Controls verwenden `x-icon`, Inline-SVG oder tokenisierte CSS-Grafik.
- Scope:
  - Close Controls in Overlay- und Feedback-Komponenten
  - Menu Trigger und Disclosure Controls
  - Status- und Action-Icons
  - legacy-nahe Sammeldateien wie `xtend.js` pruefen
- Zielartefakte:
  - `catalog/enterprise-icon-control-audit.js`
  - `tests/components/enterprise_icon_control_audit_suite.js`
  - Gate `enterprise-icon-control-audit`
  - Migration auf `x-icon` Core Icons fuer `close`, `menu`, `chevron-*`, `success`, `warning`, `error`
  - Docs-Regel fuer eigene Icon Packs in `docs/components/xicon.md`
  - Produktive Migration in `x-side-panel`, `x-surface-window`, `x-status`, `x-calendar`, `x-hero`, `x-header`, Overlay-/Feedback-Close-Controls und `xtend.js`
- Run-Status:
  - Core Icon Pack um `chevron-left`, `chevron-up`, `pin`, `minus` und `maximize` erweitert.
  - Textglyphen in produktiven Close-, Collapse-, Pin-, Minimize-, Maximize-, Previous/Next-, Scroll- und Status-Controls ersetzt.
  - `x-status` und TypeScript-Quelle nutzen `x-icon` fuer Status- und Dismiss-Icons.
  - `x-side-panel` und `x-surface-window` nutzen `x-icon` und robustes `closest('button[data-action]')` Event-Targeting.
  - Close/Copy/Menu/Icon-Controls expose `part="... control"` und getrennte `part="... control icon"` Grafiken.
  - Legacy-Bundle `xtend.js` nutzt einen Inline-SVG-Control-Helper statt `&times;`.
  - Icon-Control-Gate scannt produktive Komponenten, TS-Quellen und Legacy-Bundles.
- Lokaler Gate:

```bash
node scripts/run_xtend_tests.js enterprise-icon-control-audit --json
```

- Definition of Done:
  - keine sichtbaren Textglyphen fuer Controls in produktiven Komponenten
  - jedes Icon-Control hat `part="control icon"` oder aequivalente getrennte Parts
  - jedes Control hat zugaenglichen Namen und sichtbaren Fokus

### ECH-WP-05 - XHeader Menu Presentation Modes implementieren

- Prioritaet: P0
- Status: completed
- Ziel:
  - `x-header` von einem festen Full-Width-Drawer zu einer variablen Enterprise Header Shell erweitern.
- Scope:
  - Attribute `menu-mode`, `menu-placement`, `menu-modal`, `menu-open`, `menu-breakpoint`, `menu-width`, `menu-max-height`, `menu-align`
  - Public Types fuer `XHeaderMenuMode`, `XHeaderMenuPlacement` und erweiterten Snapshot
  - CSS Parts und Tokens aus dem XHeader Zielbild
  - A11y je Modus
  - RMT-Snapshot und State-Sync
  - Docs und Fixtures
- Zielartefakte:
  - `components/xheader.js`
  - `components/xheader.d.ts`
  - `docs/components/xheader.md`
  - `tests/components/xheader.component_suite.js`
  - `tests/components/xheader_menu_modes_suite.js`
  - `tests/components/fixtures/xheader.component.html`
  - Browser-Fixture `tests/browser/fixtures/xheader-menu-modes-smoke.html`
- Run-Status:
  - `x-header` beobachtet `menu-mode`, `menu-placement`, `menu-modal`, `menu-open`, `menu-breakpoint`, `menu-width`, `menu-max-height` und `menu-align`.
  - Default `drawer` bleibt mit `drawerMode: 'fixed-full-width-overlay'` als Legacy-Snapshot-Alias kompatibel.
  - `drawer`, `side-panel`, `popover`, `fullscreen` und `inline-main` sind in Runtime, Types, Docs, Fixture und Gate abgedeckt.
  - `snapshot()` meldet `menuMode`, `menuPlacement`, `menuModal`, `menuBreakpoint`, `menuWidth`, `menuMaxHeight` und `menuAlign`.
  - Neue Events `menu-before-open`, `menu-before-close`, `menu-mode-changed` und `menu-placement-changed` sind verdrahtet.
  - Menu-Surface, Content, Backdrop und Legacy-Drawer-Aliase besitzen eigene Parts und Token-Overrides.
  - Modalpfade nutzen Backdrop, `aria-modal`, Focus Trap, Escape und Focus Return.
- Lokaler Gate:

```bash
node scripts/run_xtend_tests.js xheader-menu-modes --json
```
- Definition of Done:
  - Default bleibt kompatibel mit bestehendem Drawer-Verhalten
  - mindestens `drawer`, `side-panel`, `popover`, `fullscreen`, `inline-main` sind dokumentiert
  - `snapshot()` meldet `menuMode`, `menuPlacement` und `menuModal`
  - Host-CSS kann Flaechen, Trigger, Menu Items, Backdrop, Breite und Position kontrollieren
  - Light, Dark, High Contrast und Forced Colors bestehen
  - Escape, Outside Click, Focus Return und Keyboard Paths sind mode-spezifisch getestet

### ECH-WP-06 - Overlay Mode/Token Paritaet

- Prioritaet: P1
- Status: completed
- Ziel:
  - Overlay-nahe Komponenten gleichartig skinbar und orchestrierbar machen.
- Zielkomponenten:
  - `x-drawer`
  - `x-side-panel`
  - `x-modal`
  - `x-dialog`
  - `x-popover`
  - `x-tooltip`
- Scope:
  - Surface Tokens
  - Backdrop Tokens
  - Close Controls
  - Focus Trap/Inert/Scroll Lock je Modus
  - z-index Tokenisierung
  - SurfaceManager-Kompatibilitaet
- Zielartefakte:
  - `catalog/enterprise-overlay-mode-token-parity.js`
  - `tests/components/enterprise_overlay_mode_token_parity_suite.js`
  - Gate `enterprise-overlay-mode-token-parity`
  - Docs-Ergaenzung in `x-drawer`, `x-side-panel`, `x-modal`, `x-dialog`, `x-popover`, `x-tooltip`
  - Runtime-Paritaet fuer `surface`, `backdrop`, `close`, `content`, `--xtend-overlay-*` und komponentennahe Legacy-Aliase
- Run-Status:
  - `x-drawer`, `x-side-panel`, `x-modal`, `x-dialog`, `x-popover` und `x-tooltip` besitzen gemeinsame Overlay-Part-Aliase fuer Surface, Backdrop, Close und Content.
  - Backdrop-Aliase bleiben kompatibel: `overlay` fuer Modal/Dialog/Drawer und `scrim` fuer SidePanel.
  - `x-popover` nutzt optionalen Backdrop bei `modal` und einen tokenisierten Close-Control mit `x-icon`.
  - `x-tooltip` bleibt bewusst nicht-modal; Backdrop und Close sind nicht-interaktive Part-Sentinels fuer Theme-/Part-Paritaet.
  - Overlay-Surface, Text, Border, Elevation, Backdrop, Z-Index und Focus laufen ueber `--xtend-overlay-*` und bestehende Komponenten-Tokens.
  - Modal- und Nicht-Modal-Pfade sind in Docs und Gate getrennt.
- Lokaler Gate:

```bash
node scripts/run_xtend_tests.js enterprise-overlay-mode-token-parity --json
```
- Definition of Done:
  - alle Overlay-Surfaces besitzen `surface`, `backdrop`, `close`, `content` Parts
  - kein Overlay erzwingt unueberschreibbare Farben oder Schatten
  - modale und nicht-modale Modi sind in Docs und Tests getrennt

### ECH-WP-07 - Layout/Display/Media Komponenten tokenisieren

- Prioritaet: P1
- Status: completed
- Ziel:
  - Layout-Komponenten als hochwertige Design-System-Bausteine mit sichtbarer XTend-Signature absichern.
- Zielkomponenten:
  - `x-header`
  - `x-footer`
  - `x-hero`
  - `x-section`
  - `x-cards`
  - `x-masonry`
  - `x-code`
- Scope:
  - spacing, radius, typography, surface, image/media, elevation
  - responsive grid/flex tokens
  - overflow und long-label Verhalten
  - visuelle Hierarchie fuer Shell, Hero, Cards, Section und Code-Flaechen
  - Default-Kompositionen, die nicht wie generische SaaS-Kartenraster wirken
- Definition of Done:
  - jede Komponente hat eine dokumentierte Token-Tabelle
  - Fixtures zeigen mindestens ein Fremdtheme
  - keine Layout-Komponente erzwingt eine One-Brand-Optik
  - jede Layout-Komponente hat eine `signatureDesign`-Notiz
  - Default UI wirkt hochwertig, bevor ein Corporate Theme angewendet wird
- Run-Status:
  - `x-header`, `x-footer`, `x-hero`, `x-section`, `x-cards`, `x-masonry` und `x-code` konsumieren gemeinsame `--xtend-layout-*` Tokens fuer Surface, Text, Border, Radius, Elevation, Spacing, Grid/Flex, Typografie, Media und Focus.
  - Alle Zielkomponenten besitzen eine `signatureDesign`-Notiz im Layout Display Media UX Profil.
  - Docs enthalten je Komponente eine ECH-WP-07 Token-Tabelle und ein Fremdtheme-Beispiel.
  - Fixtures nutzen `data-xtend-layout-theme="enterprise-foreign"` als Corporate-Design-Probe.
  - `x-masonry` nutzt icon-only Toggle Controls statt sichtbarer Textzeichen.
  - Lokales Gate: `node scripts/run_xtend_tests.js enterprise-layout-display-media-tokenization --json`

### ECH-WP-08 - Form Controls gegen Theme/A11y Edge Cases haerten

- Prioritaet: P1
- Status: completed
- Ziel:
  - Form Controls in dichten Enterprise-Layouts, Dark Mode und Forced Colors stabil machen.
- Zielkomponenten:
  - `x-input`
  - `x-select`
  - `x-checkbox`
  - `x-radio`
  - `x-textarea`
  - `x-form`
- Scope:
  - Label, helper, error, invalid, required, disabled, busy
  - native focus vs custom focus
  - contrast-safe validation
  - density profiles
  - typografische Rollen fuer Label, Control, Helper, Error und Status
  - Premium-Default fuer Form-Flaechen, der nicht nach Standard-Browser oder 0815 Admin UI wirkt
- Definition of Done:
  - alle Form Controls bestehen Light/Dark/High-Contrast/Forced-Colors
  - Error/Invalid ist nicht farb-only
  - Host-Apps koennen Control, Label, Helper, Error und Icon separat stylen
  - Default-Forms haben sichtbare Qualitaet in `comfortable`, `compact` und `dense`
- Run-Status:
  - `x-input`, `x-select`, `x-checkbox`, `x-radio`, `x-textarea` und `x-form` konsumieren gemeinsame `--xtend-form-*` Tokens fuer Text, Control-Surface, Label, Helper, Error, Icon, Focus, Radius, Gap, Typografie und Density.
  - `invalid`, `busy`, `disabled` und `required` werden visuell und per ARIA gespiegelt; Error/Invalid nutzt Kante, Ring, Shadow oder Marker statt nur Farbe.
  - Komponenten expose `label`, `helper`, `error`, `status`, `control` und soweit sinnvoll `icon` Parts fuer Host-Themes.
  - Fixtures zeigen ein Fremdtheme via `data-xtend-form-theme="enterprise-foreign"` sowie `comfortable`, `compact` und `dense`.
  - Lokales Gate: `node scripts/run_xtend_tests.js enterprise-form-control-theme-a11y --json`

### ECH-WP-09 - Navigation und Routing States haerten

- Prioritaet: P1
- Status: completed
- Ziel:
  - Navigationselemente konsistent themebar, keyboard-stabil und active-state-sicher machen.
- Zielkomponenten:
  - `x-menu`
  - `x-tabs`
  - `x-router`
  - `x-link`
  - `x-header`
- Scope:
  - Active, Current, Selected, Hover, Focus, Disabled
  - `aria-current`, `aria-selected`, route announcements
  - Disclosure und nested Menu Icons
  - long-label wrapping
- Definition of Done:
  - aktive Routen sind in jedem Theme sichtbar
  - nested Menues nutzen Icon Controls statt Glyphen
  - Keyboard-Verhalten ist dokumentiert und gatebar
- Run-Status:
  - `x-menu`, `x-tabs`, `x-router`, `x-link` und `x-header` konsumieren gemeinsame `--xtend-nav-*` Tokens fuer Surface, Text, Border, Radius, Gap, Typografie, Active, Hover, Focus, Current-Indikator und Disabled.
  - Active/Current/Selected wird ueber `aria-current`, `aria-selected`, `active` und sichtbare nicht farb-only Indikatoren gehaertet.
  - Disabled- und Long-Label-Zustaende sind in Runtime, Docs und Fixtures abgedeckt.
  - Nested Menu/Disclosure Controls nutzen Icon Parts wie `disclosure-icon control icon` statt Textglyphen.
  - Lokales Gate: `node scripts/run_xtend_tests.js enterprise-navigation-routing-state-hardening --json`

### ECH-WP-10 - Visual- und DOM-Snapshot-Matrix fuer Modi ausbauen

- Prioritaet: P1
- Status: completed
- Ziel:
  - Layout-, Theme- und Signature-Design-Regressionen frueh erkennen.
- Scope:
  - Desktop, Tablet, Mobile
  - Light, Dark, High Contrast, Forced Colors
  - Comfortable, Compact, Dense
  - Reduced Motion
  - XHeader Menu Modes
  - Signature UI States: default, hover, focus, active, disabled, empty, loading, error
  - Typografie-Proben fuer lange Labels, Zahlen, Code und dichte Navigation
  - Anti-Generic-Checks gegen monotone Farbpaletten, uebermaessige Card-Dominanz und unmotivierte Gradients
- Zielartefakte:
  - `catalog/enterprise-visual-dom-snapshot-matrix.js`
  - `tests/browser/fixtures/enterprise-visual-dom-snapshot-matrix.html`
  - `tests/browser/visual-baselines/enterprise-visual-dom-snapshot-matrix.dom-baseline.json`
  - `tests/browser/enterprise_visual_dom_snapshot_matrix_suite.js`
  - Gate `enterprise-visual-dom-snapshot-matrix`
  - DOM-basierte Assertions und optionale Screenshot-Baseline-Metadaten
  - Visual Quality Report `xtend.signature-ui.visual-quality-report.v1`
- Run-Status:
  - Browser-Fixture deckt Desktop, Tablet, Mobile sowie Light, Dark, High Contrast, Forced Colors, Comfortable, Compact, Dense und Reduced Motion ab.
  - `x-header` Menu Modes `drawer`, `side-panel`, `popover`, `fullscreen` und `inline-main` haben je eigene DOM-Snapshot-Records.
  - Signature UI States `default`, `hover`, `focus`, `active`, `disabled`, `empty`, `loading` und `error` sind als Fixture-Proben und Report-Dimensionen sichtbar.
  - Typografie-Proben fuer lange Labels, Zahlen, Code und dichte Navigation sind abgedeckt.
  - Anti-Generic-Checks gegen monotone Palette, Card-Dominanz und unmotivierte Gradients sind im Report pruefbar.
  - Lokales Gate: `node scripts/run_xtend_tests.js enterprise-visual-dom-snapshot-matrix --json`
- Definition of Done:
  - `x-header` Modi haben eigene Snapshot-Abdeckung
  - Kontrast- und Focus-Risiken werden im Report sichtbar
  - Signature UI Regressionen werden sichtbar reportet
  - Typografie- und Dichteproben sind abgedeckt
  - Gate laeuft lokal reproduzierbar

### ECH-WP-11 - Component Authoring Guide fuer Drittanbieter-Designs

- Prioritaet: P2
- Status: completed
- Ziel:
  - Drittentwickler bekommen eine klare Anleitung, wie sie XTend-Komponenten ohne Fork an ihr Designsystem anbinden.
- Scope:
  - XTend.css Override Patterns
  - XTheme Token Bridge
  - CSS Parts
  - Icon Pack Registrierung
  - Layout Modes
  - A11y-Dos and Donts
- Zielartefakte:
  - `docs/third-party-design-authoring.md`
  - `catalog/enterprise-third-party-authoring-guide.js`
  - `tests/docs/enterprise_third_party_authoring_guide_suite.js`
  - Gate `enterprise-third-party-authoring-guide`
  - Docs-Menue- und Enterprise-Adoption-Verlinkung
- Run-Status:
  - Guide enthaelt ein vollstaendiges Fremdtheme-Beispiel mit XTend.css, XTheme Runtime Theme, CSS Parts, Icon Pack, `x-header` Layout Mode, Forced Colors und Reduced Motion.
  - P0-Komponenten `x-theme`, `x-header`, `x-icon`, `x-button`, `x-menu`, `x-drawer`, `x-side-panel`, `x-modal`, `x-dialog`, `x-popover` und `x-toast` sind mit Token-/Part-Referenz verlinkt.
  - Legacy Token-Namen aus dem XTheme Alias Layer sind mit normalisierten `--xtend-*` Alias-Namen dokumentiert.
  - Lokales Gate: `node scripts/run_xtend_tests.js enterprise-third-party-authoring-guide --json`
- Definition of Done:
  - Guide enthaelt ein vollstaendiges Fremdtheme-Beispiel
  - jede P0-Komponente verweist auf ihre Token-/Part-Tabelle
  - Migration von Legacy Token-Namen ist dokumentiert

### ECH-WP-12 - SemVer, Migration und Adoption Handoff

- Prioritaet: P2
- Status: completed
- Ziel:
  - Die Haertungswelle releasefaehig abschliessen.
- Scope:
  - SemVer-Bewertung fuer neue Attribute, Tokens und Parts
  - Deprecated Aliases
  - Migration Notes
  - Release Checklist
  - Adoption Risiken fuer bestehende Apps
- Zielartefakte:
  - `docs/enterprise-component-flex-release-handoff.md`
  - `catalog/enterprise-component-flex-release-handoff.js`
  - `tests/platform/enterprise_component_flex_release_handoff_suite.js`
  - Gate `enterprise-component-flex-release-handoff`
  - Docs-Menue-, README-, Enterprise-Adoption- und Third-Party-Authoring-Verlinkung
- Run-Status:
  - SemVer-Entscheidung ist als `minor-pre-1.0-additive-public-api-hardening` dokumentiert; vorgeschlagene Version: `0.1.0-enterprise-design-system-rc.1`.
  - Deprecated CSS Token-, CSS Part-, Slot- und Density-Aliases bleiben gebridged und sind mit Migration Window dokumentiert.
  - Migration Notes, Release Checklist und Adoption Risiken sind in einem Handoff-Contract zusammengefuehrt.
  - Publish Boundary bleibt `private-until-release-owner-acceptance`; `package.json` bleibt `private: true`.
  - Lokales Gate: `node scripts/run_xtend_tests.js enterprise-component-flex-release-handoff --json`
- Definition of Done:
  - bestehende Defaults bleiben kompatibel
  - neue Modi sind additive Features
  - Breaking Changes sind entweder vermieden oder explizit versioniert

## Komponenten-Priorisierung

### P0 Pilot und kritische Shells

- `x-header`
- `x-theme`
- `x-icon`
- `x-button`
- `x-menu`
- `x-drawer`
- `x-side-panel`
- `x-modal`
- `x-dialog`
- `x-popover`
- `x-toast`

Grund: Diese Komponenten definieren Shell, Theme, Iconography, Navigation und Overlay-Verhalten. Fehler hier wirken in fast jeder App.

### P1 Breite Produktflaeche

- `x-input`
- `x-select`
- `x-checkbox`
- `x-radio`
- `x-textarea`
- `x-form`
- `x-tabs`
- `x-router`
- `x-link`
- `x-footer`
- `x-hero`
- `x-section`
- `x-cards`
- `x-alert`
- `x-status`
- `x-progress`

### P2 Long Tail und Spezialkomponenten

- `x-calendar`
- `x-writer`
- `x-code`
- `x-lightbox`
- `x-masonry`
- `x-player`
- `x-spinner`
- `x-summary`
- `x-type`
- `x-surface-manager`
- `x-surface-window`

## Gate Matrix

Bestehende Gates, die weiter genutzt werden:

```bash
node scripts/run_xtend_tests.js component-shell-contract --json
node scripts/run_xtend_tests.js component-styling-contract --json
node scripts/run_xtend_tests.js runtime-a11y-contract --json
node scripts/run_xtend_tests.js component-shell-theme-matrix --json
node scripts/run_xtend_tests.js overlay-interaction-ux --json
node scripts/run_xtend_tests.js layout-display-media-ux --json
node scripts/run_xtend_tests.js components --json
```

Neue vorgeschlagene Gates:

```bash
node scripts/run_xtend_tests.js signature-ui-visual-quality --json
node scripts/run_xtend_tests.js enterprise-component-style-audit --json
node scripts/run_xtend_tests.js xheader-menu-modes --json
node scripts/run_xtend_tests.js component-theme-token-aliases --json
node scripts/run_xtend_tests.js icon-control-contract --json
```

P0-Abnahme fuer diese Haertungswelle:

```bash
node scripts/run_xtend_tests.js signature-ui-visual-quality enterprise-component-style-audit xheader-menu-modes component-shell-theme-matrix runtime-a11y-contract components --json
```

## Definition of Done fuer eine gehaertete Komponente

Eine Komponente erreicht `enterprise-design-system-ready`, wenn:

- alle Regeln R1 bis R12 erfuellt sind
- sie im Default-Theme sichtbar hochwertig, fertig und XTend-eigenstaendig wirkt
- sie nicht wie eine austauschbare SaaS- oder Tailwind-Standardkomponente wirkt
- sie typografische Rollen statt beliebiger Einzelwerte nutzt
- alle sichtbaren Werte tokenisiert oder per Part/Slot erreichbar sind
- XTheme in Light, Dark, High Contrast und Forced Colors lesbar bleibt
- keine sichtbaren Textglyphen als Controls existieren
- Varianten als Public API dokumentiert sind
- Snapshot und Events relevante Layout-/Interaktionsmodi abbilden
- Docs Signature-Rolle, Token, Parts, Slots, Attribute, A11y und Fremdtheme-Beispiel enthalten
- Fixtures mindestens Signature Default, Dark und ein Host-Override abdecken
- lokale Gates ohne Residual fuer die Komponente bestehen

## Residual Policy

Ein Residual ist nur erlaubt, wenn:

- es in einem Report sichtbar ist
- es eine Owner-Komponente oder Datei nennt
- es ein Ablaufdatum oder Ziel-Workpackage hat
- es nicht die Lesbarkeit, Bedienbarkeit oder A11y eines P0-Flows bricht
- es keine neue Public API blockiert

Nicht akzeptierte Residuals:

- Default UI wirkt unfertig, generisch oder austauschbar
- Typografie ist nur ein undifferenzierter Systemfont-Fallback ohne Rollen
- unlesbarer Dark Mode
- unlesbarer Bright/Light Mode
- unsichtbarer Focus
- Close/Menu Control als Textzeichen
- nicht ueberschreibbare Brandfarbe
- modal wirkendes UI ohne Escape/Focus Return
- Layoutmodus ohne Snapshot oder Docs

## Erste konkrete Umsetzungsempfehlung

Die Umsetzung sollte mit `ECH-WP-00`, `ECH-WP-02`, `ECH-WP-04` und `ECH-WP-05` starten.

Grund:

- `ECH-WP-00` verhindert, dass Themebarkeit als visuelle Neutralisierung missverstanden wird.
- Der statische Audit macht die bestehenden Hardcoding-Probleme sichtbar und verhindert neue Drift.
- Die Icon-Control-Regel ist klar abgrenzbar und reduziert A11y- und Design-Schulden schnell.
- `x-header` ist das prominenteste Beispiel fuer fehlende Layoutvariabilitaet und liefert ein gutes Muster fuer spaetere Komponenten.

Empfohlene Reihenfolge:

1. Signature UI Direction und Typografie-Rollen fuer XTend definieren.
2. Audit-Gate bauen und nur reportend laufen lassen.
3. XHeader Tokens, Parts und sichtbares Signature-Default erweitern, ohne Verhalten zu brechen.
4. XHeader `menu-mode` API einfuehren, Default bleibt `drawer`.
5. `side-panel` und `popover` als erste neue Modi implementieren.
6. `fullscreen` und `inline-main` ergaenzen.
7. Docs, Fixture und Browser-Smoke inklusive Signature- und Corporate-Theme-Beispiel aktualisieren.
8. Audit- und Visual-Quality-Gates fuer P0-Komponenten scharf schalten.
