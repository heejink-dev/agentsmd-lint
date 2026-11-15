import fs from 'node:fs';
import path from 'node:path';
import { extractSnippets } from './extract.js';
import { loadRepo } from './repo.js';
import { RULES } from './rules.js';

/** @typedef {import('./types.js').Finding} Finding */

/**
 * @typedef {object} LintResult
 * @property {string} root
 * @property {number} checked
 * @property {Finding[]} findings
 */

/**
 * 리포 루트의 AGENTS.md 를 검사한다.
 * @param {string} root
 * @returns {LintResult}
 */
export function lint(root) {
  const docFile = path.join(root, 'AGENTS.md');
  if (!fs.existsSync(docFile)) throw new Error(`AGENTS.md not found in ${root}`);

  const repo = loadRepo(root);
  /** @type {Finding[]} */
  const findings = [];
  let checked = 0;

  for (const s of extractSnippets(fs.readFileSync(docFile, 'utf8'))) {
    const cmd = s.text.replace(/^\$\s*/, '');
    /** @type {import('./types.js').Report} */
    const report = (rule, message, severity = 'error') => {
      findings.push({ rule, severity, line: s.line, snippet: s.text, message });
    };
    for (const rule of RULES) checked += rule(cmd, repo, report);
  }

  return { root, checked, findings };
}
