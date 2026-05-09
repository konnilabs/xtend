# WP-01 - Core-Contract-Freeze

- Status: Completed
- Datum: 24. Maerz 2026
- Epic: `EPIC-01-XTend-Core-Standardisierung-und-Konsolidierung`

## Ziel

Dieses Workpackage friert den kanonischen Core-Contract fuer XTend ein, damit nachfolgende Codeaenderungen auf einem einheitlichen Zielbild aufbauen.

## Kanonische Core-Module

- `components/manifest.json`
- `xtend-dev.js`
- `api.js`
- `components/xstate.js`
- `components/xtheme.js`
- `components/xrouter.js`
- `components/xlink.js`
- `components/xdialog.js`
- `components/xmodal.js`
- `components/xtoast.js`
- `components/xalert.js`

## Rollenverteilung

### Manifest

- ist die kanonische Registry fuer hydrierbare XTend-Komponenten
- enthaelt zusaetzlich reservierte Bootstrap-Keys wie `xstate`
- ordnet einem Tag genau einen Modulpfad bzw. eine konkrete Modul-URL zu
- ist die einzige autoritative Quelle fuer komponentenbezogene Ladepfade

### Loader

- laedt Manifest und Basismodule
- steuert Bootstrap-Reihenfolge, Discovery, Preload und Lazy Loading
- orchestriert Laden, besitzt aber keine fachliche UI-Logik

### XState

- ist die zentrale State-Schnittstelle des Frameworks
- ist Single Source of Truth fuer Core-Zustaende
- stellt den kanonischen Subscription-Contract bereit

### XTheme

- verwaltet globale Theme-Zustaende, Theme-Registry und Theme-Lifecycle
- ist nach `xstate` das zweite Basismodul
- besitzt keine konkurrierende Parallel-API neben dem XTend-Core-Namespace

### XTend API

- ist die oeffentliche Orchestrierungs- und Komfortschicht
- darf Komponenten instanziieren und globale Helper bereitstellen
- darf Core-Contracts nicht durch alternative State-Keys oder Event-Namen unterlaufen

### Router und Link

- bilden gemeinsam den kanonischen Navigationsvertrag
- muessen fuer deklarative und programmatische Navigation denselben State- und Event-Contract nutzen

### Dialog, Modal, Toast, Alert

- sind rendernde Core-Komponenten fuer UI-Feedback und Overlay-Fluesse
- muessen deterministisch und state-getrieben arbeiten
- duerfen keine versteckten lokalen Wahrheitsquellen fuer ihren Lebenszyklus fuehren

## Bootstrap-Contract

Die kanonische Bootstrap-Reihenfolge lautet:

1. Manifest aufloesen und laden
2. `xstate` laden und global verfuegbar machen
3. `xtheme` laden und mit `xstate` verbinden
4. im DOM benoetigte bzw. vorzuladende Komponenten aufloesen
5. XTend API initialisieren
6. Seite nach abgeschlossenem Core-Bootstrap sichtbar machen

## Oeffentliche Contracts

### Tag-Namen

- Laufzeit-Tags sind kanonisch in hyphenated lowercase zu schreiben
- Beispiel: `x-router`, `x-link`, `x-dialog`

### Moduldateien

- bestehende Dateinamen wie `xrouter.js` oder `xbutton.js` bleiben waehrend Epic 01 als Repository-Konvention erhalten
- die Dateibenennung ist nicht die kanonische Laufzeitbenennung

### State-Contract

- der kanonische Core-State-Contract basiert auf `xstate.subscribe(fn, keyFilter)`
- neue Core-Implementierungen duerfen keinen alternativen Event-Emitter-Contract wie `on/off` als primaere Schnittstelle voraussetzen
- Core-Zustaende muessen eindeutig namespaced und dokumentiert werden

### Event-Contract

- oeffentliche DOM-Events sind hyphenated lowercase
- Event-Namen muessen domain- oder komponentenspezifisch eindeutig sein
- Legacy-Aliase sind nur als dokumentierte Kompatibilitaet erlaubt

### API-Contract

- `window.XTend` ist der kanonische globale XTend-Namespace
- globale Kurzformen wie `window.XTheme`, `window.XToast`, `window.XAlert`, `window.XDialog` oder `window.XModal` sind nur als Kompatibilitaetsfassaden zu behandeln

## Architekturgrenzen

- Loader bestimmt Ladeverhalten, nicht fachliche Komponentensemantik
- API orchestriert, Komponenten rendern
- State bestimmt UI-Lifecycle, nicht lokale Timer oder Flags
- Doku muss den implementierten Contract beschreiben, nicht ein davon getrenntes Zielbild

## Sofort wirksame Ableitungen

- `xstate` ist ein expliziter Bootstrap-Baustein und muss im Basispfad des Loaders beruecksichtigt werden
- `xrouter` darf keine nicht vorhandenen `xstate.on/off`-Methoden mehr voraussetzen
- neue Core-Aenderungen muessen sich am `subscribe`-Contract orientieren

## Definition of Done

- die Core-Rollen sind schriftlich fixiert
- die Bootstrap-Reihenfolge ist verbindlich definiert
- der kanonische State-, Event- und API-Rahmen ist fuer die Folgearbeit klar
