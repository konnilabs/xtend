# XTend Architecture Gate Regeln

- Status: Verbindlich fuer Epic 02 ab `WP-E02-10`
- Bezug:
  - `docs/XTend-ADR.md`
  - `development/compliance/digital-twin-principle.md`
  - `development/XTend-Core-Compliance-Checklist.md`
  - `development/XTend-Component-Level-Teststandard.md`
  - `tests/core/architecture_gate_suite.js`

## Zweck

Dieses Dokument macht die Architekturprinzipien aus ADR und Compliance als pruefbare Gates greifbar. Der Gate schuetzt XTend vor schleichender Contract-Drift, lokalen UI-Wahrheiten und unklaren Legacy-Pfaden, ohne den lokalen Test-Harness an externe Services zu binden.

Der automatisierte Einstieg lautet:

```bash
node scripts/run_xtend_tests.js architecture
```

## SSOT-Regeln

### S1 - Manifest, Doku und Runtime bilden einen Vertrag

Kanonische Runtime-Pfade, oeffentliche APIs, Dokumentation und Migrationshinweise muessen denselben Contract beschreiben.

Automatisierung:

- `docs/XTend-ADR.md` muss XTend als manifest- und state-zentriertes Framework beschreiben.
- `docs/api.md`, `docs/core-migration-guide.md` und Component-Dokus muessen die priorisierten State- und API-Vertraege decken.

### S2 - State ist die zentrale UI-Wahrheit

Sichtbarer UI-Zustand darf nicht als zweite lokale Wahrheit entstehen. Lokale Felder sind nur erlaubt, wenn sie aus `xstate`, Attributen oder eindeutig abgeleitetem Runtime-State berechnet werden.

Automatisierung:

- Overlay-Komponenten muessen Open-State aus `xstate` bzw. dem aggregierten `ui`-State ableiten.
- lokale Open-Caches wie `_open` duerfen nur aus einem resolved state gesetzt und danach in DOM/Event-Ausgabe gespiegelt werden.

### S3 - Legacy-Pfade sind Fassaden

Legacy-Keys und unnamespaced Helper duerfen weiter bestehen, muessen aber dokumentiert und an kanonische Pfade gekoppelt bleiben.

Automatisierung:

- Legacy-State-Keys werden gegen `docs/core-migration-guide.md` geprueft.
- Legacy-Helper `window.showToast`, `window.showAlert`, `window.showDialog` und `window.showModal` duerfen nur in `api.js` als Fassade gebunden werden.

## Digital-Twin-Regeln

### D1 - UI-Aktionen schreiben zurueck in State

Benutzeraktionen wie Close, Escape, Overlay-Klick oder API-gesteuerte Entfernungen muessen den State aktualisieren, bevor die UI als abgeschlossen gilt.

Automatisierung:

- `x-dialog` und `x-modal` muessen Close-Aktionen ueber `setDialogOpenState` bzw. `setModalOpenState` in `xstate` zurueckschreiben.

### D2 - State-Aenderungen treiben UI

Komponenten mit State-Vertrag muessen `xstate.subscribe(fn, keyFilter?)` oder einen gleichwertig dokumentierten State-Pfad nutzen. Neue Core-Implementierungen duerfen `xstate.on/off` nicht direkt verwenden.

Automatisierung:

- priorisierte Core-Dateien werden auf direkte `xstate.on/off` Nutzung geprueft.
- `xstate.on/off` bleibt nur im `xstate`-Modul selbst als Legacy-Fassade erlaubt.

### D3 - Cleanup bleibt deterministisch

Subscriptions, globale Listener und Timer muessen bei Disconnect oder Lifecycle-Ende bereinigt werden.

Automatisierung:

- Lifecycle-Cleanup ist bereits in Core-, Component- und A11y-/Hydration-Gates verankert.
- WP-10 blockiert Timer-Workarounds fuer Overlay-Open-State.

## Anti-Technical-Debt-Regeln

### T1 - Keine unerklaerten Workarounds im priorisierten Core

Der priorisierte Core darf keine offenen `TODO`, `FIXME` oder `HACK` Marker enthalten.

Automatisierung:

- `tests/core/architecture_gate_suite.js` prueft die priorisierten Core-Dateien auf solche Marker.

### T2 - Keine Timer als State-Kopplung

Timer duerfen nicht verwendet werden, um Open-/Close-, Navigations- oder State-Synchronisierung zu erzwingen.

Erlaubte Ausnahme:

- explizite UI-Zeitvertraege wie Auto-Dismiss bei Toasts oder Alerts, wenn der Timer bereinigt und dokumentiert ist.

Automatisierung:

- `x-dialog` und `x-modal` duerfen keine Timer fuer Open-State-Synchronisierung enthalten.

### T3 - Keine versteckten globalen Nebenpfade

Komponenten duerfen keine neuen unnamespaced globalen Helper definieren.

Automatisierung:

- priorisierte Komponenten werden auf `window.show*` Helper geprueft.
- `api.js` darf diese Namen als dokumentierte Legacy-Fassade weiter binden.

### T4 - Event- und State-Namen bleiben lesbar

Neue State-Keys unterliegen dem XTend-Namespace. Legacy-Namen brauchen eine dokumentierte Migration.

Automatisierung:

- Dialog, Modal, Alert, Theme und Router werden gegen kanonische Keys plus dokumentierte Legacy-Fassaden geprueft.

## Review-Regel fuer neue Komponenten

Neue oder modernisierte Komponenten muessen:

- einen kanonischen State-Key dokumentieren, falls sie stateful sind
- Legacy-Keys nur als Kompatibilitaets-Fassade verwenden
- globale Helper vermeiden
- lokale UI-Felder als abgeleitete Render-Caches begruenden
- relevante Architecture-, Component-, A11y-/Hydration- und Browser-Gates bestehen

## Lokaler Gate

Einzelaufruf:

```bash
node scripts/run_xtend_tests.js architecture
```

Vollstaendiger Suite-Lauf:

```bash
node scripts/run_xtend_tests.js
```
