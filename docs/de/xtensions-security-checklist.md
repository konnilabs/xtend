# XTensions Security Checklist

Prüfe jede XTension, bevor der Host ihre Runtime lädt oder `mount()` aufruft. Die Checkliste gilt für Framework-Adapter, imperative Libraries, Canvas- und WebGL-Hosts sowie kontrollierte Remote-Artefakte.

Ein Fehler in dieser Prüfung degradiert oder blockiert die betroffene Surface. Er darf nicht durch stilles Nachladen, eine schwächere CSP oder einen unkontrollierten Fallback umgangen werden.

## Identität und Provenance

- Ein fachlicher und ein technischer Owner sind benannt.
- ID, Version und Entry stimmen zwischen Contract, Manifest und Registry überein.
- Das ausgelieferte Artefakt besitzt einen überprüften SHA-256-Fingerprint.
- Der Fallback ist lokal verfügbar und braucht die externe Runtime nicht.
- Framework-Versionen sind als `host-provided` oder `external-peer` klassifiziert.
- Keine externe Runtime liegt als versteckte Root-Dependency oder vendorte Datei im XTend-Paket.

Ein minimaler Dependency-Eintrag sieht so aus:

```json
{
  "name": "react",
  "versionRange": "18.x || 19.x",
  "classification": "host-provided",
  "bundled": false,
  "packageIncluded": false
}
```

## CSP und Loading

Erlaube nur die Quellen, die der Adapter tatsächlich benötigt. Prüfe mindestens `script-src`, `style-src`, `img-src`, `connect-src`, `worker-src` und `object-src`. Ein lokaler Standard-Gate darf keine CDN-Ausnahme benötigen.

Remote-Artefakte brauchen zusätzlich eine explizite Origin-Policy, Integrity, Version und einen lokalen Fallback. Ein Manifest ist keine Erlaubnis, beliebige URLs dynamisch zu importieren.

## Runtime-Grenze

- Der Host prüft Capabilities vor `mount()`.
- Props, KernelSignals und SurfaceEvents sind serialisierbar.
- Payload-Schema, Owner, Richtung, Trust Boundary und Fabric-Lane sind festgelegt.
- DOM-Events, Framework-Contexts und Klasseninstanzen verlassen die Host-Grenze nicht.
- `reportError()` redigiert Secrets, Tokens, HTML und nicht freigegebene Stack-Daten.
- Ein fehlender Peer blockiert nicht Shell, Navigation oder andere Surfaces.

## Cleanup

Inventarisiere jeden Listener, Timer, Observer, Worker, Request, Render-Loop und jede GPU-Ressource. `unmount()` muss sie auch nach einem teilweise fehlgeschlagenen Mount freigeben.

Prüfe den Fehlerpfad getrennt: Wenn die Framework-Initialisierung nach dem ersten Observer, aber vor dem Rendern wirft, muss der bereits registrierte Observer trotzdem entfernt werden. Ein Cleanup-Stack mit idempotenten Funktionen ist robuster als mehrere voneinander abhängige Rückbauzweige.

## Gate ausführen

```bash
node scripts/run_xtend_tests.js xtensions-security-integrity-gate xtensions-host-controller xtensions-runtime-capability-registry --json
```

Das erwartete Ergebnis ist ein erlaubter Adapter für das gültige Fixture sowie `policy-blocked` für falsche Integrity, verbotene Dependency-Klassifikation oder fehlenden Fallback. Die negative Fixture ist Teil des Beweises; ein Gate, das nur den Happy Path sieht, reicht nicht.

## Befunde beheben

Bei einem Integrity-Fehler baust du das kontrollierte Artefakt neu und aktualisierst Manifest und Fingerprint gemeinsam. Deaktiviere die Prüfung nicht und akzeptiere keinen Hash aus einer unbekannten Quelle.

Bei einer CSP-Verletzung klärst du, ob der Zugriff wirklich zum Produktvertrag gehört. Wenn ja, begrenze die konkrete Origin und den Ressourcentyp. Eine pauschale Wildcard ist keine Reparatur.

Bei fehlendem Cleanup ergänzt du Ownership im Adapter. Die Shell kann keine Listener entfernen, die sie nicht kennt, und das Framework kann keine Host-Observer bereinigen, die außerhalb seiner Root angelegt wurden.

## Nächste Schritte

- [XTensions Authoring Guide](./xtensions-authoring-guide.md)
- [XTensions Migration und Coexistence](./xtensions-migration-coexistence-guide.md)
- [Manifest Import Policy](./manifest-import-policy.md)
- [Supply Chain Checks](./supply-chain-gates.md)
