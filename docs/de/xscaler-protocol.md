# XScaler-Protokoll

XScaler ist das öffentliche Preflight-Protokoll, mit dem XTend-Hosts entscheiden, ob eine Remote Surface, ein SSR-Adapter und ein XTension-Deployment in einen Runtime-Slot skaliert werden dürfen, bevor Remote-Code ausgeführt wird.

## Schemas

XScaler-Fixtures verwenden vier stabile Schema-Namen:

- `xtend.xscaler.preflight-request.v1` für Capability-Anfragen des Hosts.
- `xtend.xscaler.preflight-response.v1` für Annahme, Ablehnung und erforderliche Folge-Anker.
- `xtend.xscaler.remote-surface-plan.v1` für Owner, Origin, Integrity, Fallback und Lane-Platzierung.
- `xtend.xscaler.xtension-deployment.v1` für gatebare XTension-Rollout-Metadaten.

## Preflight-Flow

1. Der Host erzeugt einen `xscaler-preflight-request` mit SSR- und XTension-Capabilities.
2. Tooling liefert eine `xscaler-preflight-response`, die festhält, ob die Surface akzeptiert wird.
3. Akzeptierte Surfaces hängen einen `xscaler-remote-surface-plan` und bei Bedarf ein `xscaler-xtension-deployment` an.

## Remote-Surface-Plan

Der Plan spiegelt den RMT-Remote-Surface-Vertrag: Owner, Origin, Integrity, Fallback-Surface und Lane-Ziel sind statische Fakten. XScaler lädt oder führt während der Validierung kein Remote-Bundle aus.

## SSR-Kompatibilitaet

SSR-Adapter müssen XScaler als reinen Preflight-Vertrag behandeln. Ein kompatibler Plan setzt `networkDuringRender` auf `false`, hält Remote-Ausführung aus dem Server-Render-Pfad heraus und hydriert erst nach akzeptierter Preflight-Response.

## XTensions-Deployment

XTensions können XScaler verwenden, um Framework-Inseln hinter einem gegateten Deployment-Record auszurollen. Deployment-Records müssen XTension, Surface, Rollout-Strategie und SSR-Hydration benennen.

## Fixtures

Die minimale Fixture-Familie liegt unter `tests/rmt/fixtures/xscaler/` und deckt Preflight-Request, Preflight-Response, Remote-Surface-Plan und XTension-Deployment-Records ab.
