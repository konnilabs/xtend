# SurfaceManager Quality Gates

Contract: `xtend.surface.quality-gates.v1`

Die SurfaceManager Quality Gates halten den gemischten Surface Stack in vier lokalen Qualitätsdomänen prüfbar.

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

## Qualitätsmodell

Die SurfaceManager Quality Gates bündeln vier Domänen, weil Surface-Probleme selten nur in einer Schicht auftreten. Ein Browser-Fehler kann als falscher Stack-Wert sichtbar werden. Ein A11y-Fehler kann aus einem verlorenen Fokusziel entstehen. Ein Performance-Fehler kann von zu vielen Snapshot-Updates kommen. Ein Visual-Fehler kann durch instabile Layout-Slots in Window oder Side Panel entstehen. Der Contract `xtend.surface.quality-gates.v1` hält diese Domänen zusammen, damit Reviewende nicht einzelne Smokes isoliert interpretieren müssen.

Die Gates bleiben lokal und deterministisch. Sie brauchen keine externe Messplattform und keine produktive Telemetrie. Stattdessen prüfen sie Fixtures, Runtime-Records und dokumentierte Schwellen. Das ist wichtig für PR-Arbeit: Ein Entwickler soll vor dem Push sehen können, ob eine Surface-Änderung Browser-, A11y-, Performance- oder Visual-Evidence berührt.

## Domänen

Browser prüft, ob Manager, Fenster, Panel und Overlay Bridge in einer echten DOM-Umgebung zusammenarbeiten. A11y prüft Rollen, Fokusfluss, inert/aria-hidden und Bedienbarkeit über Tastatur. Performance prüft, ob Snapshot- und Layout-Arbeit begrenzt bleibt und keine neue Update-Schleife entsteht. Visual prüft keine pixelperfekte Marke, sondern stabile sichtbare Zustandswechsel: aktiv, minimiert, geschlossen, pinned, collapsed und overlay.

Die Fixture `tests/browser/fixtures/surface-manager-quality-smoke.html` ist der gemeinsame Beleg. Sie soll klein bleiben, aber genug Surfaces enthalten, um Kollisionen zu zeigen. Wenn ein neuer Surface-Modus hinzukommt, muss der Owner entscheiden, welche Domäne betroffen ist und welche lokale Evidence den Modus absichert. Nicht jeder Modus braucht sofort einen Pixel-Baseline-Prozess, aber jeder sichtbare Modus braucht eine nachvollziehbare Qualitätsaussage.

## Release Review

Ein grünes Quality-Gate bedeutet, dass die gemischte Surface-App weiterhin bedienbar, messbar und reproduzierbar ist. Es bedeutet nicht, dass jede denkbare Produktkomposition abgedeckt ist. Offene Browser-Lab-Artefakte oder breitere visuelle Baselines werden separat in der Release-Dokumentation geführt. Geblockt sind Änderungen, die sichtbare Surface-Fähigkeiten behaupten, ohne eine der vier Domänen zu berühren.

Reviewende sollten besonders auf stille Scope-Erweiterungen achten. Wenn ein Patch eine neue Dragging-, Resizing-, Modality- oder Stacking-Aussage macht, braucht er mehr als eine Code-Änderung. Er braucht einen Contract-Punkt, eine Fixture oder einen Gate-Nachweis. Diese Seite beschreibt, wo dieser Nachweis erwartet wird.

## Weiterführend

Der Release-Ablauf zeigt, wie SurfaceManager-Reports mit den Repository-Gates kombiniert werden. [Verwandter Artikel](./release-verification.md)
