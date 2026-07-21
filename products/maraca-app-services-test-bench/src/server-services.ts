import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync, type StatementSync } from 'node:sqlite';
import {
  AppServiceError,
  defineServerServices,
  service,
  type AppServiceExecutionContext,
  type AppServiceInputVerdict
} from '@ccslabs/xtend-maraca/server-services';
import type {
  TestBenchListInput,
  TestBenchSaveInput,
  TestBenchTextEntry,
  TestBenchTextResult
} from './services';

const RESULT_SCHEMA = 'maraca.testbench.text-result.v1' as const;
const MAX_TEXT_LENGTH = 4000;
const HISTORY_LIMIT = 20;

interface TextEntryRow {
  id: number | bigint;
  text: string;
  createdAt: string;
}

function databasePath(): string {
  return resolve(process.cwd(), process.env.XTEND_MARACA_TEST_BENCH_DB_PATH || '.data/text-entries.sqlite');
}

function openDatabase(context: AppServiceExecutionContext): DatabaseSync {
  const target = databasePath();
  mkdirSync(dirname(target), { recursive: true });
  const database = new DatabaseSync(target);
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    database.close();
  };
  context.defer?.(close);
  database.exec('PRAGMA journal_mode = WAL;');
  database.exec(`
    CREATE TABLE IF NOT EXISTS text_entries (
      id INTEGER PRIMARY KEY,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    ) STRICT;
    PRAGMA user_version = 1;
  `);
  return database;
}

function mapEntry(row: TextEntryRow): TestBenchTextEntry {
  return {
    id: String(row.id),
    text: String(row.text),
    createdAt: String(row.createdAt)
  };
}

function readEntries(database: DatabaseSync): TestBenchTextEntry[] {
  const statement: StatementSync = database.prepare(`
    SELECT id, content AS text, created_at AS createdAt
    FROM text_entries
    ORDER BY id DESC
    LIMIT 20
  `);
  return (statement.all() as unknown as TextEntryRow[]).map(mapEntry);
}

function summarizeVerdict(verdict: AppServiceInputVerdict | null | undefined): TestBenchTextResult['trustBoundary'] {
  if (!verdict) return null;
  return {
    schema: verdict.schema,
    ok: verdict.ok,
    phase: verdict.phase,
    sanitized: verdict.sanitized
  };
}

function result(
  entries: TestBenchTextEntry[],
  message: string,
  saved: TestBenchTextEntry | null,
  verdict: AppServiceInputVerdict | null | undefined
): TestBenchTextResult {
  return {
    schema: RESULT_SCHEMA,
    ok: true,
    message,
    saved,
    entries,
    count: entries.length,
    empty: entries.length === 0,
    trustBoundary: summarizeVerdict(verdict)
  };
}

function validateText(input: TestBenchSaveInput): string {
  const text = input && input.text;
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new AppServiceError('Text must not be empty.', {
      code: 'xtend.maraca.app-service.invalid_request',
      details: { field: 'text', rule: 'required' },
      expose: true
    });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    throw new AppServiceError(`Text must not exceed ${MAX_TEXT_LENGTH} characters.`, {
      code: 'xtend.maraca.app-service.invalid_request',
      details: { field: 'text', rule: 'maxLength', maxLength: MAX_TEXT_LENGTH },
      expose: true
    });
  }
  return text;
}

export default defineServerServices({
  'maraca.testbench.text.save': service<TestBenchSaveInput, TestBenchTextResult>({
    kind: 'command',
    target: 'server',
    concurrency: 'serial',
    invoke(input, context) {
      context.signal.throwIfAborted();
      const text = validateText(input);
      const database = openDatabase(context);
      const createdAt = new Date().toISOString();
      const insert = database.prepare('INSERT INTO text_entries (content, created_at) VALUES (?, ?)');
      const write = insert.run(text, createdAt);
      const savedRow = database.prepare(`
        SELECT id, content AS text, created_at AS createdAt
        FROM text_entries
        WHERE id = ?
      `).get(write.lastInsertRowid) as unknown as TextEntryRow;
      const saved = mapEntry(savedRow);
      const entries = readEntries(database);
      return result(entries, `Saved entry ${saved.id}.`, saved, context.inputPolicyVerdict);
    }
  }),
  'maraca.testbench.text.list': service<TestBenchListInput, TestBenchTextResult>({
    kind: 'query',
    target: 'server',
    concurrency: 'latest',
    invoke(_input, context) {
      context.signal.throwIfAborted();
      const database = openDatabase(context);
      const entries = readEntries(database);
      return result(entries, `Loaded ${entries.length} persisted entr${entries.length === 1 ? 'y' : 'ies'}.`, null, context.inputPolicyVerdict);
    }
  })
});

export { HISTORY_LIMIT, MAX_TEXT_LENGTH };
