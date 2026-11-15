#!/usr/bin/env node
// agentsmd-lint CLI: 인자 처리와 출력만 담당. 검사 로직은 src/ 에 있음.
import path from 'node:path';
import { lint } from '../src/lint.js';

const args = process.argv.slice(2);
const json = args.includes('--json');
const root = path.resolve(args.find((a) => !a.startsWith('--')) ?? '.');

let result;
try {
  result = lint(root);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(2);
}

const { checked, findings } = result;
const errors = findings.filter((f) => f.severity === 'error').length;

if (json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  for (const f of findings) {
    console.log(`AGENTS.md:${f.line}  ${f.severity.toUpperCase()} [${f.rule}]  ${f.message}\n    > ${f.snippet}`);
  }
  console.log(`\n${checked}개 참조 검사, error ${errors}건 / warn ${findings.length - errors}건`);
}

process.exit(errors > 0 ? 1 : 0);
