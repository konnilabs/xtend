# XTend Accessibility- und Hydration-Testregeln

- Status: Verbindlich fuer Epic 02 ab `WP-E02-09`
- Bezug:
  - `development/XTend-Component-Level-Teststandard.md`
  - `compliance/xtend-design-guidelines.md`
  - `tests/components/accessibility_hydration_suite.js`
  - `tests/browser/browser_smoke_suite.js`

## Zweck

Dieses Dokument uebersetzt die Accessibility- und Hydration-Anforderungen aus Design-Guidelines und Component-Level-Teststandard in pruefbare Mindestregeln. Die Regeln bilden eine Qualitaetsbarriere fuer sichtbare XTend-Komponenten, ohne XTend an ein schwergewichtiges Browser- oder Framework-Testsetup zu binden.

Die automatisierte Suite `a11y-hydration` prueft aktuell die priorisierten UI-Runtime-Komponenten `x-alert`, `x-toast`, `x-modal` und `x-dialog` sowie die bestehenden Browser-Smoke-Fixtures.

## Scope

In Scope:

- ARIA-Rollen und `aria-*` Attribute
- Fokusziele und Fokus-Rueckgabe
- Tastaturpfade fuer Overlays und interaktive Elemente
- `prefers-reduced-motion`
- `connectedCallback`, `attributeChangedCallback` und `disconnectedCallback`
- deterministische Listener-, Timer- und Subscription-Bereinigung
- sichtbare Aktivierung und Hydration in Browser-Fixtures

Out of Scope fuer diesen Schritt:

- vollstaendige WCAG-Zertifizierung
- visuelle Pixelvergleiche
- externe Browser-Farmen
- Framework-spezifische Integrationsadapter

## A11y-Regeln

### A1 - Semantische Rolle

Sichtbare Komponenten muessen eine passende Rolle setzen, wenn ihre native Semantik nicht ausreicht.

Beispiele:

- Feedback: `role="alert"` oder `role="status"`
- Overlays: `role="dialog"` plus `aria-modal="true"`

Automatisierung:

- `tests/components/accessibility_hydration_suite.js` prueft Rollen fuer `x-alert`, `x-toast`, `x-modal` und `x-dialog`.

### A2 - Labels und Live-Regionen

Interaktive Controls muessen ein erkennbares Label besitzen. Feedback-Komponenten muessen ihre Live-Region explizit machen.

Mindestkriterien:

- Schliessen-Buttons besitzen ein `aria-label`
- Feedback-Komponenten setzen `aria-live`
- Dialog-/Modal-Titel werden ueber `aria-labelledby` angebunden

### A3 - Fokusverhalten

Interaktive und overlayartige Komponenten muessen Fokusverhalten definieren.

Mindestkriterien:

- initiales Fokusziel nach Oeffnung
- sichtbarer Fokuszustand fuer Tastaturnutzung
- Fokus-Rueckgabe nach Schliessen von Overlays

### A4 - Tastaturbedienung

Komponenten mit Tastaturvertrag muessen relevante Tastenpfade behandeln.

Mindestkriterien:

- `Escape` schliesst Dialoge und Modals
- `Tab` bleibt in offenen Overlays gefangen
- Dismiss-Controls bleiben per Tastatur erreichbar

### A5 - Reduzierte Bewegung

Animierte Komponenten muessen `prefers-reduced-motion` respektieren.

Mindestkriterium:

- CSS oder Runtime-Logik enthaelt einen expliziten Reduced-Motion-Pfad.

### A6 - Review-Gate fuer neue Komponenten

Wenn eine Komponente sichtbare oder interaktive UI erzeugt, muss ihre Component-Suite die passenden A11y-Regeln pruefen oder dokumentieren, warum eine Regel nicht anwendbar ist.

## Hydration-Regeln

### H1 - Deterministische Aktivierung

Custom Elements muessen in `connectedCallback` einen reproduzierbaren DOM-Zustand erzeugen.

Mindestkriterien:

- Element registriert sich stabil als Custom Element
- DOM oder Shadow DOM wird sichtbar erzeugt
- Browser-Fixtures pruefen sichtbare Aktivierung, nicht nur Import-Erfolg

### H2 - Rehydration nach Attributwechsel

Komponenten mit beobachteten Attributen muessen `attributeChangedCallback` als Rehydration-Pfad nutzen.

Mindestkriterium:

- Attributwechsel koennen Renderzustand und State-Sync aktualisieren.

### H3 - Bereinigung bei Detach

`disconnectedCallback` muss Timer, Listener und Subscriptions entfernen.

Mindestkriterien:

- Timer werden mit `clearTimeout` oder aequivalent bereinigt
- globale Listener werden entfernt
- `xstate` Subscriptions werden abgemeldet

### H4 - State-Sync ohne lokale Drift

Stateful Components muessen den kanonischen `xstate` Key nach dem bekannten XTend-Namensschema verwenden.

Beispiele:

- `xtend.component.x-alert.<id>`
- `xtend.component.x-modal.<id>.open`
- `xtend.component.x-dialog.<id>.open`

### H5 - Fixture-basierte Sichtbarkeit

Jede browsernahe Hydration-Pruefung muss ein Ergebnisobjekt und konkrete Checks fuer sichtbare Aktivierung bereitstellen.

Mindestkriterien:

- Fixture schreibt ein `__xtend...Result` Objekt
- Checks pruefen Shadow DOM, sichtbaren Body, gerenderten Inhalt oder State-Sync
- lokale Fixtures laden repo-lokale Komponenten statt CDN-Artefakte

## Automatisierter Gate

Lokaler Einzelaufruf:

```bash
node scripts/run_xtend_tests.js a11y-hydration
```

Vollstaendiger lokaler Suite-Lauf:

```bash
node scripts/run_xtend_tests.js
```

Die Suite ist absichtlich statisch und fixture-contract-basiert. Sie verhindert regressionsanfaellige Mindestvertraege ohne externe Browser-Abhaengigkeit. Echte Browser-Smokes bleiben ueber `node scripts/run_xtend_tests.js browser` angebunden und koennen optional mit Safari-WebDriver ergaenzt werden.

## Erweiterungsregel

Neue oder modernisierte Komponenten duerfen nur als abgeschlossen gelten, wenn:

- ihre Component-Suite die relevanten A- und H-Regeln abdeckt
- ihre Fixture lokale Imports nutzt
- Accessibility- und Hydration-Grenzen in der Komponentendoku beschrieben sind
- nicht anwendbare Regeln explizit im Workpackage oder in der Suite begruendet werden
