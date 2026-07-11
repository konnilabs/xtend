# Epic18 Vendor Bugfixes

Diese Seite spiegelt die Epic18 Vendor-Bugfix-Evidence fuer `x-tooltip`, `x-player`, `x-surface-window`, `x-side-panel` und `x-surface-manager-controller`.

Lokaler Gate:

```bash
node scripts/run_xtend_tests.js epic18-vendor-bugfix-smokes --json
```

## Scope

Die Epic18 Vendor-Bugfixes sichern konkrete Rueckmeldungen aus der App-Platform- und Surface-Arbeit ab. Sie sind kein neues Vendor-Paket und keine breite API-Erweiterung, sondern ein Set aus gezielten Korrekturen an bestehenden owned Komponenten. `x-tooltip` bleibt fuer einfache Hilfetexte und Trigger-Fokus zustaendig. `x-player` bleibt die Medienkomponente fuer kontrollierte Playback- und Caption-Faelle. `x-surface-window`, `x-side-panel` und `x-surface-manager-controller` halten die Surface Manager Runtime stabil, wenn Fenster, Panels und Controller gleichzeitig in einer RMT-App verwendet werden.

Der wichtigste Release-Punkt ist Nachvollziehbarkeit. Jede Korrektur muss an einem sichtbaren Symptom haengen: falscher Fokus, ein unvollstaendiges Event, ein instabiler Stack-Wert, ein unklarer Medienzustand oder eine Controller-Aktion, die nicht sauber in den Surface Snapshot zurueckgeschrieben wurde. Ein Fix zaehlt nur, wenn der Smoke denselben Pfad abdeckt, den Host-Anwendungen spaeter verwenden. Dadurch verhindert das Paket, dass kosmetische Aenderungen als Vendor-Bugfixes verkauft werden.

## Evidence Modell

Der lokale Gate `epic18-vendor-bugfix-smokes` prueft die betroffenen Komponenten als kleine Integrationsgruppe. Reviewende sollten zuerst auf die Komponentennamen achten und danach auf die Wirkungskette: Eingabe, Runtime-Zustand, DOM-Ausgabe und Event. Bei Tooltips bedeutet das, dass Trigger und beschreibender Inhalt konsistent bleiben. Beim Player bedeutet es, dass Medienkontrolle und Host-Ereignisse nicht auseinanderlaufen. Bei Surface-Komponenten bedeutet es, dass Fenster- und Panel-Zustaende vom Controller gelesen, aktualisiert und wieder beobachtbar gemacht werden.

Die Evidence bleibt bewusst lokal. Es gibt keine Netzwerkannahme, keinen externen Browserdienst und keine neue Drittanbieterabhaengigkeit. Wenn eine Anwendung fuer die Reproduktion echte Medien oder komplexe Layouts braucht, wird die Fixture reduziert, bis der Bugfix-Kern sichtbar bleibt. Das macht die Smokes schnell genug fuer PR-Gates und konkret genug fuer Release Owner.

## Reviewer Notes

Akzeptiert ist ein Bugfix, wenn er den bestehenden Contract enger erfuellt, ohne neue Produktversprechen zu oeffnen. Geblockt ist ein Fix, wenn er eine Framework-spezifische API einfuehrt, manuelle `innerHTML`-Hosts benoetigt, die Surface Registry dupliziert oder die Native-First-Grenze zwischen RMT und XTend-Komponenten verwischt. Residuals gehoeren in das Epic18-Handoff, nicht in stille Codepfade. So bleibt klar, welche Fehler geschlossen wurden und welche Beweise fuer spaetere App-Platform-Arbeit noch fehlen.
