import { defineAppServices, service } from '@ccslabs/xtend-maraca/app-services';

export interface TestBenchTextEntry {
  id: string;
  text: string;
  createdAt: string;
}

export interface TestBenchSaveInput {
  text: string;
}

export interface TestBenchListInput {
  trigger: string;
}

export interface TestBenchTextResult {
  schema: 'maraca.testbench.text-result.v1';
  ok: true;
  message: string;
  saved: TestBenchTextEntry | null;
  entries: TestBenchTextEntry[];
  count: number;
  empty: boolean;
  trustBoundary: {
    schema: string;
    ok: boolean;
    phase: string;
    sanitized: boolean;
  } | null;
}

export default defineAppServices({
  'maraca.testbench.text.save': service<TestBenchSaveInput, TestBenchTextResult>({
    kind: 'command',
    target: 'server',
    concurrency: 'serial'
  }),
  'maraca.testbench.text.list': service<TestBenchListInput, TestBenchTextResult>({
    kind: 'query',
    target: 'server',
    concurrency: 'latest'
  })
});
