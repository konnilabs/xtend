import fs from 'node:fs';
import path from 'node:path';
import {Transform} from 'node:stream';

export class ProxyBudget {
  constructor(root, options = {}) {
    this.root = root;
    this.maxObjectBytes = options.maxObjectBytes ?? 8 * 1024 ** 3;
    this.maxCacheBytes = options.maxCacheBytes ?? 32 * 1024 ** 3;
    this.maxCacheEntries = options.maxCacheEntries ?? 4096;
    this.maxApiBytes = options.maxApiBytes ?? 4 * 1024 ** 2;
    this.timeoutMs = options.timeoutMs ?? 900000;
    this.maxConcurrent = options.maxConcurrent ?? 2;
    for (const value of [this.maxObjectBytes, this.maxCacheBytes, this.maxCacheEntries, this.maxApiBytes, this.timeoutMs, this.maxConcurrent]) if (!Number.isSafeInteger(value) || value < 1) throw new Error('Proxy limits must be positive safe integers.');
    this.downloads = new Map(); this.temporaryFiles = new Set(); this.reserved = 0; this.apiActive = 0;
  }
  entries() {
    const entries = [];
    const visit = (directory) => {
      if (!fs.existsSync(directory)) return;
      for (const name of fs.readdirSync(directory)) {
        const file = path.join(directory, name); const stat = fs.lstatSync(file);
        if (stat.isSymbolicLink()) throw new Error('Model cache must not contain symlinks.');
        if (stat.isDirectory()) visit(file);
        else if (stat.isFile() && !this.temporaryFiles.has(file)) entries.push({file, bytes: stat.size, time: stat.mtimeMs});
      }
      const activeAncestor = [...this.temporaryFiles].some(file => file.startsWith(`${directory}${path.sep}`));
      if (directory !== this.root && !activeAncestor && fs.readdirSync(directory).length === 0) fs.rmdirSync(directory);
    };
    visit(this.root);
    return entries.sort((a, b) => a.time - b.time);
  }
  reserve(bytes) {
    const entries = this.entries();
    let used = entries.reduce((sum, record) => sum + record.bytes, 0);
    while ((used + this.reserved + bytes > this.maxCacheBytes || entries.length > this.maxCacheEntries) && entries.length) {
      const entry = entries.shift(); fs.unlinkSync(entry.file); used -= entry.bytes;
    }
    if (used + this.reserved + bytes > this.maxCacheBytes) throw new Error('Model cache byte quota exceeded.');
    this.reserved += bytes;
  }
  limiter(onBytes) {
    let received = 0;
    const budget = this;
    const transform = new Transform({transform(chunk, _encoding, callback) {
      try {
        if (received + chunk.length > budget.maxObjectBytes) throw new Error('Model object byte limit exceeded.');
        budget.reserve(chunk.length); received += chunk.length; onBytes?.(chunk.length); callback(null, chunk);
      } catch (error) { callback(error); }
    }});
    return {transform, release: () => { budget.reserved -= received; }};
  }
  async download(key, task) {
    if (this.downloads.has(key)) return this.downloads.get(key);
    if (this.downloads.size + this.apiActive >= this.maxConcurrent) throw new Error('Model proxy concurrency limit exceeded.');
    const promise = Promise.resolve().then(task);
    this.downloads.set(key, promise);
    try { return await promise; } finally { this.downloads.delete(key); }
  }
  async api(task) {
    if (this.apiActive + this.downloads.size >= this.maxConcurrent) throw new Error('Model proxy concurrency limit exceeded.');
    this.apiActive += 1;
    try { return await task(); } finally { this.apiActive -= 1; }
  }
}
