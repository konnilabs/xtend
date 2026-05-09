# XTend Design Guidelines

## Ziel

Diese Guidelines definieren das offizielle Look & Feel für alle XTend Web Components und Anwendungen. Sie stellen sicher, dass alle Komponenten ein konsistentes, modernes, barrierefreies und hochwertiges Nutzererlebnis bieten – unabhängig vom Entwickler oder Einsatzzweck.

---

## 1. Grundprinzipien

- **Glassmorphism:** Halbtransparente, verschwommene Hintergründe mit dezenten Schatten und abgerundeten Ecken.
- **Konsistenz:** Einheitliche Farben, Abstände, Typografie und Interaktionen in allen Komponenten.
- **Responsiveness:** Optimale Darstellung und Bedienbarkeit auf allen Geräten (Desktop, Tablet, Mobile).
- **Accessibility (A11y):** Strikte Einhaltung von ARIA-Standards, Tastaturbedienung und Screenreader-Support.
- **Digital Twin Principle:** UI und State sind immer synchron und deterministisch gekoppelt.
- **Performance:** Animationen und Effekte sind performant und berücksichtigen prefers-reduced-motion.

---

## 2. Farben & Typografie

- **Primärfarbe:** #4fc3f7 (helles Blau)
- **Primärfarbe (dunkel):** #0288d1
- **Akzentfarbe:** #fff (Weiß)
- **Hintergrund (Glass):** rgba(30, 34, 44, 0.55)
- **Schatten:** 0 8px 32px 0 rgba(31, 38, 135, 0.18)
- **Border-Radius:** 18px (Standard für alle Container, Dialoge, Buttons)
- **Font:** 'Inter', 'Segoe UI', Arial, sans-serif
- **Textschatten:** 0 2px 8px rgba(79,195,247,0.18) für Branding/Title

---

## 3. Komponenten-Stil

- **Container:**
  - Glassmorphism-Hintergrund, Blur, Border-Radius, dezente Schatten
  - Border: 1.5px solid rgba(255,255,255,0.12)
- **Buttons:**
  - Runde, große Flächen (min. 2.6em x 2.6em)
  - SVG-Icons, keine PNGs oder Bitmaps
  - Hover: sanfte Farbänderung, leichte Skalierung (transform: scale(1.08))
  - Fokus: gut sichtbarer Outline (2px solid Primärfarbe)
- **Dialoge/Overlays:**
  - Glassmorphism, Blur, Border-Radius, Schatten
  - Sanfte Fade/Scale-Animation beim Öffnen
  - Schließen-Button als SVG-Icon, oben rechts, groß und klickbar
- **Progress/Slider:**
  - Runde Enden, dezente Farben, klare Interaktion
  - Vertikale Slider für Lautstärke, horizontal für Fortschritt
- **Branding:**
  - Dezentes, aber sichtbares Branding mit Primärfarbe und Textschatten

---

## 4. Animationen & Interaktionen

- **Animationen:**
  - FadeIn/Scale für Dialoge, Overlays, Controls
  - Keine übertriebenen Bewegungen
  - Animationen abschaltbar via prefers-reduced-motion
- **Transitions:**
  - Farb- und Schattenübergänge: 0.2–0.3s
  - Transform-Übergänge: 0.15–0.25s
- **Touch & Pointer:**
  - Alle Controls müssen auf Touch und Pointer reagieren
  - Hitboxen großzügig gestalten

---

## 5. Accessibility (A11y)

- **ARIA-Rollen und -Attribute:**
  - Jede Komponente hat die passende Rolle (z.B. role="dialog", role="button", role="slider")
  - aria-labels für alle interaktiven Elemente
- **Tastaturbedienung:**
  - Tab-Reihenfolge logisch, Fokus-Outline immer sichtbar
  - Escape schließt Dialoge, Enter/Space aktiviert Buttons
- **Screenreader:**
  - Live-Regionen für Statusanzeigen (z.B. aria-live="polite")
  - Keine redundanten Tooltips, keine doppelten Labels
- **Testbindung:**
  - Mindestregeln fuer Accessibility und Hydration sind in `development/XTend-Accessibility-Hydration-Testregeln.md` operationalisiert
  - Priorisierte UI-Komponenten muessen den lokalen Gate `node scripts/run_xtend_tests.js a11y-hydration` bestehen

---

## 6. SVG-Icons

- **Inline SVG:**
  - Alle Icons als Inline-SVG, keine externen Ressourcen
  - Klare, minimalistische Linien, keine unnötigen Details
  - Icons skalieren mit Font-Size
- **Farben:**
  - Icons nutzen currentColor, um sich an Theme anzupassen

---

## 7. Best Practices

- **Keine lokalen UI-Flags:**
  - UI-Status immer über State-Management (z.B. xstate) steuern
- **Keine asynchronen Workarounds:**
  - Keine setTimeouts, keine Polling-Logik für UI-State
- **Defensive Checks:**
  - Komponenten prüfen, ob alle benötigten Elemente vorhanden sind
- **Dokumentation:**
  - Jede Komponente muss eine Markdown-Doku mit Attributen, Events, Slots, Accessibility und Beispielen haben

---

## 8. Beispiele

```html
<!-- XPlayer Beispiel -->
<x-player src="video.mp4" title="Demo" style="width:600px"></x-player>

<!-- XDialog Beispiel -->
<x-dialog open title="Hinweis" overlay>
  <div>Dies ist ein moderner XTend Dialog.</div>
  <button slot="actions">OK</button>
</x-dialog>
```

---

*Letzte Aktualisierung: 20. Juli 2025*
