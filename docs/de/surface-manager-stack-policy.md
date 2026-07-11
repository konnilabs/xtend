# SurfaceManager Stack Policy

Contract: `xtend.surface.stack-policy.v1`

Die Stack Policy gehört dem `x-surface-manager`. Sie koordiniert Modalität, Focus Restore, Inert, Escape, Scroll Lock und Layer Tokens für Fenster, Panels und Overlays.

## Policy

- `modal-policy` entscheidet, ob nur die oberste Surface oder mehrere Surfaces modal wirken.
- Focus Restore bringt Fokus nach dem Schließen zur vorherigen Quelle zurück.
- Inert und `aria-hidden` isolieren Hintergrund-Surfaces.
- Escape wirkt topmost und schließt nicht versehentlich tiefere Surfaces.
- Scroll Lock ist an aktive modale Surfaces gebunden.
- Die Runtime erstellt keine zweite Registry.

## Gate

```bash
node scripts/run_xtend_tests.js surface-stack-policy --json
```

## Policy Ziele

Die Stack Policy ist der Teil des Surface Managers, der aus vielen sichtbaren Flächen eine bedienbare App macht. Fenster, Panels, Modals, Dialoge und kurze Overlays können gleichzeitig existieren. Ohne gemeinsame Policy würden sie konkurrierende Escape-Handler, Scroll Locks, Fokusziele und Z-Werte setzen. `xtend.surface.stack-policy.v1` legt fest, welche Surface oben liegt, welche Surface modal wirkt, wann Hintergrundbereiche inert werden und wohin Fokus nach dem Schliessen zurückkehrt.

Die Policy ist absichtlich manager-owned. Einzelne Komponenten können ihre lokale Semantik behalten, aber sie entscheiden nicht global über den Rest der App. Ein Modal kann melden, dass es blocking ist. Ein Panel kann melden, dass es overlay-artig sichtbar ist. Ein Fenster kann melden, dass es aktiv sein will. Der Manager setzt diese Signale in eine Reihenfolge, damit Host, Browser und Assistive Technology dieselbe Struktur sehen.

## Modalität und Fokus

`modal-policy` entscheidet, ob nur die oberste Surface modal ist oder ob ein definierter Satz von Surfaces blockierend wirkt. Diese Entscheidung beeinflusst `aria-hidden`, inert, Scroll Lock und Escape. Der Fokus wird beim Oeffnen auf ein sinnvolles Ziel in der aktiven Surface gesetzt und beim Schliessen zur vorherigen Quelle zurückgeführt. Wenn diese Quelle nicht mehr existiert, braucht die Runtime einen stabilen Fallback, etwa den auslösenden Controller oder die nächste aktive Surface.

Escape wirkt topmost. Ein Tastendruck darf nicht ein tiefes Fenster schliessen, wenn darüber ein Dialog liegt. Ebenso darf ein Toast nicht den Fokuspfad einer modalen Surface stehlen. Diese Regeln klingen klein, sind aber für reale App Shells entscheidend: Nutzer müssen vorhersagen können, welche Ebene sie gerade bedienen, und Tests müssen dieselbe Ebene reproduzieren können.

## Release Review

Reviewende prüfen Stack-Änderungen gegen drei Risiken. Erstens: Wurde eine globale Entscheidung in eine einzelne Komponente verschoben? Zweitens: Entsteht ein Zustand, in dem zwei Surfaces beide topmost sind? Drittens: Bleiben nach dem Schliessen verwaiste Locks, Inert-Markierungen oder Fokusziele zurück? Der Gate `surface-stack-policy` deckt diese Risiken lokal ab und macht die wichtigsten Policy-Entscheidungen im Report sichtbar.

Neue Layer Tokens, Modality-Modi oder Escape-Regeln brauchen Evidence. Sie werden nicht allein durch CSS oder ein neues Attribut akzeptiert. Eine gute Änderung beschreibt den Record, den Policy-Entscheid und die sichtbare Wirkung. So bleibt der Surface Stack berechenbar, auch wenn Workbench, Side Panel und Overlay Bridge in derselben App laufen.

## Weiterführend

Der Controller-Vertrag zeigt, welche Surface-Transitions die Stack Policy auslösen. [Verwandter Artikel](./surface-manager-controller.md)
