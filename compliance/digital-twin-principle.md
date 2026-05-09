# Digital Twin Principle – CCS Networks Compliance

## Ziel und Motivation

Das Digital Twin Principle ist ein fundamentales Architekturprinzip bei CCS Networks. Es stellt sicher, dass zu jedem Zeitpunkt eine 100%ige, bidirektionale und deterministische Kopplung zwischen dem logischen Zustand (State) und der UI-Instanz (bzw. jedem Modul) besteht. Ziel ist es, Inkonsistenzen, Race Conditions und unvorhersehbares Verhalten in komplexen Webanwendungen und Frameworks wie XTend vollständig auszuschließen.

---

## Definition

**Digital Twin Principle:**
> "Für jede Instanz eines UI- oder Systemmoduls existiert zu jedem Zeitpunkt ein digitaler Zwilling im globalen State. Änderungen am State werden deterministisch und synchron im UI reflektiert – und umgekehrt. Es gibt keine asynchronen Workarounds, keine lokalen Flags, keine Race Conditions. Die State-Änderung ist die einzige Quelle der Wahrheit."

---

## Leitlinien für Entwickler und AI-Agenten

1. **State als Single Source of Truth:**
   - Alle UI-Änderungen (z.B. Öffnen/Schließen eines Dialogs) werden ausschließlich durch State-Änderungen ausgelöst.
   - Komponenten abonnieren den State und reagieren deterministisch auf Änderungen.

2. **Keine lokalen Flags oder Workarounds:**
   - Es dürfen keine lokalen Variablen, Timeouts, Retry-Logik oder Flags verwendet werden, um UI-Status zu steuern.
   - Die UI darf niemals "vorauslaufen" oder "hinterherhinken" – sie folgt immer dem State.

3. **Bidirektionale Kopplung:**
   - Jede Aktion im UI (z.B. Button-Klick zum Schließen) löst eine State-Änderung aus, die wiederum das UI aktualisiert.
   - Es gibt keine "versteckten" UI-Änderungen ohne State-Update.

4. **Determinismus und Synchronität:**
   - Die Kopplung zwischen State und UI ist synchron und deterministisch.
   - Asynchrone Workarounds (z.B. setTimeout, Polling) sind nicht erlaubt.

5. **Fehlerbehandlung:**
   - Fehler im State-Management werden klar geloggt und führen nicht zu UI-Inkonsistenzen.
   - Komponenten entfernen sich selbst aus dem DOM, wenn der State dies verlangt.

---

## Beispiel: XDialog (XTend)

- Das Öffnen eines Dialogs erfolgt durch Setzen eines State-Flags (z.B. `xstate.set('dialog-open-<id>', true)`).
- Die Komponente `<x-dialog>` abonniert diesen State und öffnet/schließt sich synchron.
- Das Schließen (z.B. per Button) setzt den State zurück (`false`), was zur Entfernung des Dialogs aus dem DOM führt.
- Es gibt keine setTimeouts, keine Retry-Logik, keine lokalen Open-Flags.

---

## Für LLMs und AI-Agenten

- **Immer** State-Management als zentrale Steuerung nutzen.
- **Niemals** UI-Status direkt oder asynchron manipulieren.
- **Alle** Komponenten und APIs müssen deterministisch und synchron auf State-Änderungen reagieren.
- **Jede** Änderung am UI muss im State abgebildet sein – und umgekehrt.

---

## RMT Scheduler-Handshakes

Ab Epic 04 / `WP-E04-05` gilt fuer XTendRMT-Kompatibilitaet:

- Der RMT Scheduler darf Root-Arbeit planen, aber nicht selbst XTend-State, Custom-Element-Callbacks oder DOM-Lifecycle ausfuehren.
- Der XTend Host Adapter fuehrt Root-Phasen wie `create`, `mount`, `hydrate`, `activate`, `update`, `unmount` und `diagnostics` aus.
- Scheduler-Jobs duerfen keine zweite Source of Truth erzeugen. Jede sichtbare Aenderung muss ueber kanonische `xstate`-Keys oder dokumentierte Host-Adapter-Signale gespiegelt werden.
- `setTimeout`, Polling oder Retry-Logik duerfen nicht als Kopplung zwischen Scheduler und UI-State verwendet werden.
- Diagnostics duerfen Snapshots melden, aber keine UI-Wahrheit ersetzen.

## RMT Host Capabilities

Ab Epic 04 / `WP-E04-06` gilt fuer XTend Host Capabilities:

- Host Capabilities beschreiben Manifest, Custom Elements, `xstate`, Hydration, Scheduler-Endpoints, Theme, API, Router und Diagnostics als Adapterdaten.
- Der RMT Kernel darf Capability-IDs und Versionen verhandeln, aber keine XTend Runtime-Module importieren.
- Der RMT Kernel darf `window.XTend` und `xstate.set` nicht direkt aufrufen.
- Fehlende Pflichtfaehigkeiten muessen vor sichtbarem Mount diagnostisch scheitern.
- Fehlende optionale Faehigkeiten duerfen degradieren, muessen aber nachvollziehbar bleiben.
- Capability Negotiation darf keine zweite Source of Truth fuer UI-State erzeugen.

---

## Testbindung

Fuer XTend ist das Prinzip ab Epic 02 als lokaler Architecture-Gate operationalisiert:

```bash
node scripts/run_xtend_tests.js architecture
```

Der Gate prueft SSOT, kanonische State-Keys, dokumentierte Legacy-Fassaden und Anti-Technical-Debt-Grenzen fuer priorisierte Core-Fluesse.

---

## Fazit

Das Digital Twin Principle ist die Grundlage für wartbare, skalierbare und deterministische Webanwendungen bei CCS Networks. Es ist strikt einzuhalten – für Menschen und AI-Agenten gleichermaßen.

---

*Letzte Aktualisierung: 2025-07-19*
