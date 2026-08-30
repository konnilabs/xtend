# ADR RMT-KERNEL-008: Single Scheduler Microkernel

- Status: `accepted`
- Datum: 2026-08-30
- Zielrelease: `0.8.0`
- Owner: `RMT Kernel / Performance`

## Kontext

Der bisherige RMT-Stack enthielt Scheduling-Verantwortung in Kernel-, Performance-, Browser- und Fabric-nahen Pfaden. Dadurch konnten Queue-Reihenfolge, Cancellation, Async-Fehler und Backpressure je nach Einstieg unterschiedlich behandelt werden. KernelLab zeigte außerdem, dass Scheduler-Code mit Rendering-, Product-Surface- und Prewarm-Services im vollständigen Bundle gekoppelt war.

## Entscheidung

`createRmtKernelScheduler()` ist die einzige Scheduling-Autorität. Das hostneutrale Artefakt wird über `./kernel-scheduler` ausgeliefert und besitzt Queue, Job-Lifecycle, Yield, Cancellation, Timeout, Coalescing und Scheduler-Diagnostics.

Fabric bleibt Userland-Koordination. Es erzeugt kanonische Work-Intents, meldet Backpressure und empfängt redigierte Lifecycle-/Panic-/Recovery-Telemetrie. Fabric besitzt keine zweite Work Queue. Registry, Maraca, Core, Browser Runtime, State-/Telemetry-Bridge und optionale Services erhalten dieselbe Scheduler-Instanz durch Injection.

Product Surface ist ein optionaler Service. Direkter Microkernel-Boot ist Default; ESM-Importe erzeugen weder Runtime noch globale Factory-Mirrors. Der Browser-Scheduler bleibt ausschließlich ein delegierender 0.8-Migrationsadapter.

## Konsequenzen

- `schedule()` und alle produktiven Scheduling-Fassaden liefern `RmtJobHandle`.
- Alte Lane-Namen werden nur am Browser-Adapter normalisiert.
- `inline` und `runInline` sind keine Ausführungspfade mehr.
- Promise-Rejections, Panic Blocking, Cancellation und Dispose folgen einem Job-Contract.
- Native Browser-Scheduler sind optionale Host-Optimierungen; Timer bleiben der portable Fallback.
- Der Microkernel darf keine DOM-, Template-, Product-Surface- oder Prewarm-Abhängigkeiten enthalten.
- Der Cutover ist ein dokumentierter Breaking Change innerhalb der Pre-1.0-Policy; es gibt keinen produktiven Dualbetrieb und keinen automatischen Publish.

## Verifikation

KernelLab prüft Runtime-Port-Provider, verbotene Service-Kanten, Scheduler-Zyklen, Duplikate sowie `160 KiB` raw / `32 KiB` gzip. Scheduler-, Orchestration-, Fabric-, Maraca-, Compatibility-, Artifact-Parity- und Type-Export-Gates sichern den Cutover.
