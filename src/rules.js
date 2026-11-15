import { SKIP_DIRS } from './repo.js';

/** @typedef {import('./types.js').RepoContext} RepoContext */
/** @typedef {import('./types.js').Report} Report */

/**
 * 규칙 하나: 명령 한 줄과 리포 정보를 받아 문제를 report 하고, 실제로 검사한 참조 수를 반환한다.
 * @callback Rule
 * @param {string} cmd
 * @param {RepoContext} repo
 * @param {Report} report
 * @returns {number}
 */

/** npm/pnpm/yarn/bun 내장 명령 — package.json scripts가 아님 */
const PM_BUILTINS = new Set([
  'install', 'i', 'ci', 'add', 'remove', 'rm', 'uninstall', 'update', 'up', 'exec', 'dlx', 'init', 'create',
  'publish', 'link', 'audit', 'outdated', 'why', 'list', 'ls', 'run', 'x', 'npx', 'config', 'install-test',
  'pack', 'version', 'workspace', 'workspaces', 'help', 'login', 'store', 'prune', 'dedupe', 'cache',
]);
const WORKSPACE_FLAG = /^(pnpm|yarn|npm)\s+(--filter|-F|-w|--workspace|workspace)\b/;
const PM_COMMAND = /^(npm|pnpm|yarn|bun)\s+(run\s+)?([\w:.-]+)/;

/** @type {Rule} */
export function checkScripts(cmd, repo, report) {
  if (WORKSPACE_FLAG.test(cmd)) return 0; // 하위 패키지 scripts 기준이라 루트에서 판단 불가
  const m = cmd.match(PM_COMMAND);
  if (!m) return 0;
  const [, pm, run, name] = m;
  if (PM_BUILTINS.has(name)) return 0;
  // npm 은 run 없이 쓸 수 있는 스크립트가 test/start 뿐
  if (pm === 'npm' && !run && !['test', 'start'].includes(name)) return 0;

  if (!repo.scripts) {
    report('script/no-package-json', `package.json이 없는데 "${name}" 스크립트를 참조함`);
  } else if (!repo.scripts.has(name)) {
    if (run || pm === 'npm') report('script/missing', `package.json scripts에 "${name}"가 없음`);
    else report('script/maybe-missing', `scripts에 "${name}"가 없음 (바이너리일 수 있음)`, 'warn');
  }
  return 1;
}

/** @type {Rule} */
export function checkMake(cmd, repo, report) {
  const m = cmd.match(/^make\s+([\w./-]+)/);
  if (!m) return 0;
  if (!repo.makeTargets) report('make/no-makefile', `Makefile이 없는데 "${m[1]}" 타깃을 참조함`);
  else if (!repo.makeTargets.has(m[1])) report('make/missing-target', `Makefile에 "${m[1]}" 타깃이 없음`);
  return 1;
}

const PATH_LIKE = /^(\.{0,2}\/)?[\w.-]+(\/[\w.-]+)+\/?$/;
const PLACEHOLDER = /path\/to\/|(^|\/)(my_|your[_-]|example)/i;

/**
 * 토큰이 검사할 만한 상대경로인지 판단 (URL·글롭·플레이스홀더·빌드 산출물·owner/repo 형태 제외)
 * @param {string} token
 * @param {RepoContext} repo
 * @returns {boolean}
 */
export function isCheckablePath(token, repo) {
  if (!PATH_LIKE.test(token)) return false;
  if (/^[a-z]+:\/\//i.test(token) || /[*<>{}$]/.test(token) || token.startsWith('/')) return false;
  if (PLACEHOLDER.test(token)) return false;
  const segs = token.replace(/^\.\//, '').split('/').filter(Boolean);
  if (segs.some((s) => SKIP_DIRS.has(s))) return false;
  // "vercel/next.js", "react-dom/server.edge" 처럼 첫 폴더가 루트에 없는 2단 토큰은 경로가 아닐 가능성이 큼
  if (segs.length === 2 && !token.startsWith('.') && !repo.existsAtRoot(segs[0])) return false;
  return true;
}

/** @type {Rule} */
export function checkPaths(cmd, repo, report) {
  let checked = 0;
  for (const raw of cmd.split(/\s+/)) {
    const token = raw.replace(/^['"(]+|['"),.:;]+$/g, '');
    if (!isCheckablePath(token, repo)) continue;
    checked++;
    if (!repo.existsAnywhere(token)) report('path/missing', `경로 "${token}"가 존재하지 않음`);
  }
  return checked;
}

/** 에이전트가 그대로 실행하면 위험한 지시 */
export const DANGER_PATTERNS = [
  { rule: 'danger/pipe-to-shell', re: /\b(curl|wget)\b[^|]*\|\s*(sudo\s+)?(ba|z)?sh\b/, msg: '원격 스크립트를 셸로 바로 실행' },
  { rule: 'danger/skip-verify', re: /--no-verify\b|--dangerously-skip-permissions\b/, msg: '검증·권한 확인 우회 플래그' },
  { rule: 'danger/chmod-777', re: /\bchmod\s+(-R\s+)?777\b/, msg: '과도한 권한 부여' },
  { rule: 'danger/rm-rf-root', re: /\brm\s+-rf\s+(\/|~|\$HOME)(\s|$)/, msg: '루트/홈 디렉터리 삭제' },
  { rule: 'secret/hardcoded', re: /\b(ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})\b/, msg: '하드코딩된 키로 보이는 문자열' },
];

/** @type {Rule} */
export function checkDanger(cmd, _repo, report) {
  for (const d of DANGER_PATTERNS) if (d.re.test(cmd)) report(d.rule, d.msg);
  return 0;
}

/** @type {Rule[]} */
export const RULES = [checkScripts, checkMake, checkPaths, checkDanger];
