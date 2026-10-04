export class ResumeStore {
  constructor({ttlMs = 600000, maxEntries = 128, maxBytes = 8 * 1024 * 1024, clock = Date.now} = {}) {
    for (const value of [ttlMs, maxEntries, maxBytes]) if (!Number.isSafeInteger(value) || value < 1) throw new Error('Resume limits must be positive safe integers.');
    this.ttlMs = ttlMs; this.maxEntries = maxEntries; this.maxBytes = maxBytes; this.clock = clock;
    this.records = new Map(); this.bytes = 0;
  }
  delete(token) {
    const record = this.records.get(token);
    if (!record) return;
    this.bytes -= record.bytes; this.records.delete(token);
  }
  prune() {
    const now = this.clock();
    for (const [token, record] of this.records) if (record.expires <= now) this.delete(token);
  }
  set(token, value) {
    this.prune();
    const bytes = Buffer.byteLength(JSON.stringify(value));
    if (bytes > this.maxBytes) throw new Error('Resume payload exceeds byte quota.');
    this.delete(token);
    while (this.records.size >= this.maxEntries || this.bytes + bytes > this.maxBytes) this.delete(this.records.keys().next().value);
    this.records.set(token, {value, bytes, expires: this.clock() + this.ttlMs}); this.bytes += bytes;
  }
  consume(token) {
    this.prune();
    const value = this.records.get(token)?.value;
    this.delete(token);
    return value;
  }
}
