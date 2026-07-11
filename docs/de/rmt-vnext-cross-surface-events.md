# RMT Cross Surface Events

Ereignisse zwischen Oberflächen ohne lose globale Event-Kopplung.

## Worum es geht

Cross-Surface Events transportieren benannte Payloads zwischen getrennten Surface-Ownern. Registry, Version und Empfängerpolicy verhindern, dass beliebige DOM-Events als globaler Bus durch die App wandern.

## Öffentliche Bausteine

- `tools/rmt-language/vnext-cross-surface-events.js` normalisiert Event-Verträge.
- `tests/rmt-language/fixtures/vnext-cross-surface-events-fixture.json` enthält erlaubte und abgelehnte Fälle.
- `xtend.rmt.vnext-cross-surface-events.v1` versioniert den Report.

## Empfohlener Ablauf

Definiere Owner, Eventname, Version und Payload-Schema. Registriere den Empfänger explizit und behandle unbekannte Versionen oder Capabilities als Refusal mit lokalem Fallback.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT vNext Remote Surfaces](./rmt-vnext-remote-surfaces.md)
- [RMT vNext Enterprise MFE Vertrag](./rmt-vnext-remote-surfaces.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)

## Event-Protokoll

Cross-Surface Events verwenden `xtend.rmt.vnext-cross-surface-event-protocol.v1`. Governance-Regeln, Owner, Versionen und erlaubte Zielbereiche werden über `xtend.rmt.vnext-event-governance-policy.v1` geprüft. Dadurch bleibt die Grenze klar: Surfaces dürfen einander signalisieren, aber es gibt `no implicit global Event Bus`.

Die Enterprise-Fixture verwendet zwei stabile Event-Namen:

- `checkout.cart.updated.v1`
- `user.session.changed.v1`

Diese Namen sind Teil des öffentlichen Vertrags, weil Host-Adapter, Telemetrie und Regression-Gates sie wiederfinden müssen. Wenn ein Event umbenannt wird, müssen Fixture, Core Output, Governance-Policy und Browser-Smoke gemeinsam geändert werden.

## Minimaler Event-Pfad

```rmt
event checkout.cart.updated.v1 {
  from surface checkout.cart
  to surface commerce.summary
  payload contract checkout.cart.payload.v1
}
```

Prüfe Event-Änderungen lokal:

```bash
node scripts/run_xtend_tests.js rmt-vnext-cross-surface-events rmt-vnext-event-governance --json
node scripts/run_xtend_tests.js rmt-vnext-enterprise-release --json
```

Wenn das Governance-Gate scheitert, korrigiere zuerst Owner, Payload Contract oder Ziel-Surface. Ein Host-seitiger Event-Bus darf den Fehler nicht verdecken.
