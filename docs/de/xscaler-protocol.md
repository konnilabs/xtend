# XScaler-Protokoll

XScaler ist das öffentliche Preflight-Protokoll, mit dem XTend-Hosts entscheiden, ob eine Remote Surface, ein SSR-Adapter und ein XTension-Deployment in einen Runtime-Slot skaliert werden dürfen, bevor Remote-Code ausgeführt wird.

## Schichtgrenze

XScaler ist in zwei Schichten mit getrennten Verantwortlichkeiten aufgeteilt:

1. **XScaler Preflight** trifft eine statische Annahme-/Ablehnungsentscheidung, bevor ein Remote Bundle, eine SSR-Adapter-Erweiterung oder XTension-Code ausgeführt wird. Preflight vergleicht Host-Capabilities, Manifest-Fakten, Integrity-Metadaten, Fallback-Verfügbarkeit, Lane-Platzierung und Policy-Anforderungen und liefert danach den akzeptierten Plan oder den Ablehnungsgrund. Preflight ist bewusst frei von Seiteneffekten: Es öffnet keine Flight-Session, streamt keine UI, führt keine Actions aus und materialisiert keine Surface.
2. **XScaler ATC (Air Traffic Control)** besitzt nach akzeptiertem Preflight die Runtime-Flight-Session. ATC koordiniert Client/Server-Kommunikation, Session-IDs, die Übergabe vom akzeptierten Plan an den Runtime-Host, Lifecycle-Übergänge, Abbruch, Fallback-Aktivierung und Diagnostics. ATC kann orchestrieren, wann eine Remote Surface einen Slot belegt oder verlässt, macht den RMT Kernel aber weiterhin nicht zu einem privaten Remote-Code-Executor.

Nachgelagerte Schichten halten dieselbe Grenze ein. Die Maraca Runtime verarbeitet akzeptierte Streams im Client, führt deklarierte Actions aus und materialisiert Surfaces. XSurface Shard Server Schichten können serverseitige Remote Surfaces orchestrieren. Generische Server-Endpunkte bleiben der Fallback-Pfad, wenn keine Remote Surface Orchestration verfügbar ist. RMT Kernel/Fabric behält Scheduling, Lanes, Diagnostics und Policy-Auswertung, führt aber niemals private Remote-Ausführung aus.

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
