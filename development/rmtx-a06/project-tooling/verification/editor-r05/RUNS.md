The r05 VSIX is unchanged across all three actual host attempts. Its SHA-256 is `47e041af2be6e50b93c9e0db3f0090d9833c00e3e8fac604e8829ee1611bc27c`.

The original r05 host attempt failed after nine checks: the closed-dependency file watcher did not produce a type diagnostic before the timeout. The cause was not conclusively established. The unchanged r05b trace run passed all ten checks and recorded real file watcher events. Both original attempts are retained verbatim.

The final r05c run passed all ten checks without trace logging. It uses test harness revision 2.0.0, SHA-256 `136ae3d64e2bba9143e071af5c1cfba31faaa15f5d6d0954aefee581257b2e42`, which awaits a real VS Code FileSystemWatcher create event on separate temporary .probe files before the single model change and restoration. It sends no simulated LSP file-change notification. The harness is outside the 851-file packaged source comparison; the runtime VSIX was not changed for this test correction.

The host report DTO has the same fields and schema as before; only the test readiness procedure changed. The exact command and resource measurements are retained in each .time file. Original stdout, report JSON, stderr/resources, and the trace watcher log are copied byte-for-byte.
