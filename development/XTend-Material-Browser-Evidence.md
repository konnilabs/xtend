# XTend Material Browser Evidence

Status: `accepted`  
Ticket: `XTM-10`  
Report: `xtend.material.browser-evidence.v1`

## Evidence Contract

Das Gate prueft App Shell, Form Flow, Dashboard und Dialog/Toast Flow ueber die vollstaendige Matrix aus vier Themes, drei Dichten, vier Viewports und zwei Motion-Modi. Das ergibt 384 zellgenaue DOM- und Interaktionsnachweise. Chromium erzeugt zusaetzlich je Viewport einen Screenshot unter `.xtend-test-results/material-browser-evidence/`. Lokal vorhandene Support-Browser ohne Browser-Hypervisor-Adapter werden nicht stillschweigend als bestanden behandelt, sondern mit Owner und Grund als Residual reportet.

Die Fixture nutzt ausschliesslich oeffentliche DOM-, Rollen-, Attribut- und Fokusvertraege. Private Shadow Roots sind weder Bestandteil der Baseline noch ein erlaubter Testzugriff.

## Acceptance

- kein horizontaler Overflow je Matrixzelle;
- stabile Landmark-Reihenfolge und semantische Statusregionen;
- Keyboard-Fokus, sichtbarer Fokus und Focus Restore im Dialog-Flow;
- funktionale Reduced-Motion- und Forced-Colors-Pfade;
- keine Findings mit Severity `critical` oder `severe`;
- vier erfolgreiche Chromium-Screenshot-Captures.

## Baseline Update Policy

Die Baseline `tests/browser/visual-baselines/material-browser-evidence.dom-baseline.json` darf nur gemeinsam mit einer absichtlichen Aenderung am oeffentlichen Material Recipe-, Theme- oder Viewport-Contract aktualisiert werden. Ein Update benoetigt:

1. einen nachvollziehbaren Contract-Grund im Ticket oder Review;
2. einen lokal erfolgreichen Lauf des vollstaendigen XTM-10-Gates;
3. Review der vier neu erzeugten Viewport-Screenshots;
4. explizite Bewertung neuer A11y-, Overflow- und Focus-Befunde;
5. unveraendert `false` fuer `privateShadowRootAccess`.

Zeitstempel, Browser-Builds oder maschinenabhaengige Pixel-Hashes gehoeren nicht in die committed Baseline. Screenshots sind Laufartefakte; die stabile Baseline bindet Dimensionen, Szenarien und erwartete DOM-/Interaktionsclaims. Unbeabsichtigtes Drift wird fail-closed behandelt.

## Gate

```bash
node scripts/run_xtend_tests.js xtend-material-browser-evidence visual-snapshots component-runtime-a11y --json
```

Damit ist `XTM-11` fuer Performance-, CSS-Budget- und Reproduzierbarkeitsgates startbar.
