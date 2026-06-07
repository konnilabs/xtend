# SurfaceManager Quality Gates

Contract: `xtend.surface.quality-gates.v1`

Die SurfaceManager Quality Gates halten den gemischten Surface Stack in vier lokalen Qualitaetsdomaenen pruefbar.

## Domains

- Browser
- A11y
- Performance
- Visual

## Evidence

Browser-Smoke:

```text
tests/browser/fixtures/surface-manager-quality-smoke.html
```

Lokaler Gate:

```bash
node scripts/run_xtend_tests.js surface-manager-quality --json
```

## Qualitaetsmodell

Die SurfaceManager Quality Gates buendeln vier Domaenen, weil Surface-Probleme selten nur in einer Schicht auftreten. Ein Browser-Fehler kann als falscher Stack-Wert sichtbar werden. Ein A11y-Fehler kann aus einem verlorenen Fokusziel entstehen. Ein Performance-Fehler kann von zu vielen Snapshot-Updates kommen. Ein Visual-Fehler kann durch instabile Layout-Slots in Window oder Side Panel entstehen. Der Contract `xtend.surface.quality-gates.v1` haelt diese Domaenen zusammen, damit Release Owner nicht einzelne Smokes isoliert interpretieren muessen.

Die Gates bleiben lokal und deterministisch. Sie brauchen keine externe Messplattform und keine produktive Telemetrie. Stattdessen pruefen sie Fixtures, Runtime-Records und dokumentierte Schwellen. Das ist wichtig fuer PR-Arbeit: Ein Entwickler soll vor dem Push sehen koennen, ob eine Surface-Aenderung Browser-, A11y-, Performance- oder Visual-Evidence beruehrt.

## Domaenen

Browser prueft, ob Manager, Fenster, Panel und Overlay Bridge in einer echten DOM-Umgebung zusammenarbeiten. A11y prueft Rollen, Fokusfluss, inert/aria-hidden und Bedienbarkeit ueber Tastatur. Performance prueft, ob Snapshot- und Layout-Arbeit begrenzt bleibt und keine neue Update-Schleife entsteht. Visual prueft keine pixelperfekte Marke, sondern stabile sichtbare Zustandswechsel: aktiv, minimiert, geschlossen, pinned, collapsed und overlay.

Die Fixture `tests/browser/fixtures/surface-manager-quality-smoke.html` ist der gemeinsame Beleg. Sie soll klein bleiben, aber genug Surfaces enthalten, um Kollisionen zu zeigen. Wenn ein neuer Surface-Modus hinzukommt, muss der Owner entscheiden, welche Domaene betroffen ist und welche lokale Evidence den Modus absichert. Nicht jeder Modus braucht sofort einen Pixel-Baseline-Prozess, aber jeder sichtbare Modus braucht eine nachvollziehbare Qualitaetsaussage.

## Release Review

Ein gruenes Quality-Gate bedeutet, dass die gemischte Surface-App weiterhin bedienbar, messbar und reproduzierbar ist. Es bedeutet nicht, dass jede denkbare Produktkomposition abgedeckt ist. Residuals wie echte Browser-Lab-Artefakte oder breite visuelle Baselines werden separat im Release-Handoff gefuehrt. Geblockt sind Aenderungen, die sichtbare Surface-Faehigkeiten behaupten, ohne eine der vier Domaenen zu beruehren.

Reviewende sollten besonders auf stille Scope-Erweiterungen achten. Wenn ein Patch eine neue Dragging-, Resizing-, Modality- oder Stacking-Aussage macht, braucht er mehr als eine Code-Aenderung. Er braucht einen Contract-Punkt, eine Fixture oder einen Gate-Nachweis. Diese Seite beschreibt, wo dieser Nachweis erwartet wird.
