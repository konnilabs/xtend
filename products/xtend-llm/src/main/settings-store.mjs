import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_THEME_MODE,
  SETTINGS_SCHEMA
} from './constants.mjs';
import { normalizeUpdateSettings } from './ipc-contract.mjs';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createDefaultSettings(now = () => new Date().toISOString()) {
  return {
    schema: SETTINGS_SCHEMA,
    themeMode: DEFAULT_THEME_MODE,
    customInstructions: '',
    updatedAt: now()
  };
}

export class SettingsStore {
  constructor(options = {}) {
    this.filePath = options.filePath;
    this.now = typeof options.now === 'function' ? options.now : () => new Date().toISOString();
    this.state = createDefaultSettings(this.now);
  }

  load() {
    if (!this.filePath || !fs.existsSync(this.filePath)) return this.snapshot();
    const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
    if (parsed && parsed.schema === SETTINGS_SCHEMA) {
      this.state = {
        ...createDefaultSettings(this.now),
        ...normalizeUpdateSettings({
          themeMode: parsed.themeMode,
          customInstructions: parsed.customInstructions
        }),
        updatedAt: typeof parsed.updatedAt === 'string' && parsed.updatedAt ? parsed.updatedAt : this.now()
      };
    }
    return this.snapshot();
  }

  save() {
    if (!this.filePath) return;
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, `${JSON.stringify(this.state, null, 2)}\n`);
  }

  snapshot() {
    return clone(this.state);
  }

  update(input = {}) {
    const update = normalizeUpdateSettings(input);
    this.state = {
      ...this.state,
      ...update,
      schema: SETTINGS_SCHEMA,
      updatedAt: this.now()
    };
    this.save();
    return this.snapshot();
  }

  reset() {
    this.state = createDefaultSettings(this.now);
    this.save();
    return this.snapshot();
  }
}

export default SettingsStore;
