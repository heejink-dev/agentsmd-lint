import fs from 'node:fs';
import path from 'node:path';

/** @typedef {import('./types.js').RepoContext} RepoContext */

/** 빌드 산출물·가상환경 등 클론 직후엔 없는 게 정상인 폴더 */
export const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'out', '.next', 'target', 'coverage', '.venv', 'venv',
]);

/**
 * @param {string} file
 * @returns {unknown}
 */
function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * @param {string} root
 * @returns {Set<string> | null}
 */
function loadScripts(root) {
  const pkg = readJSON(path.join(root, 'package.json'));
  if (!pkg || typeof pkg !== 'object') return null;
  const scripts = /** @type {{ scripts?: Record<string, string> }} */ (pkg).scripts ?? {};
  return new Set(Object.keys(scripts));
}

/**
 * @param {string} root
 * @returns {Set<string> | null}
 */
function loadMakeTargets(root) {
  const file = path.join(root, 'Makefile');
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, 'utf8');
  return new Set([...text.matchAll(/^([A-Za-z0-9_./-]+)\s*:(?!=)/gm)].map((m) => m[1]));
}

/**
 * 리포 안의 모든 파일·폴더 상대경로 (모노레포 하위 패키지 기준 경로를 찾기 위해)
 * @param {string} root
 * @returns {string[]}
 */
function buildIndex(root) {
  /** @type {string[]} */
  const index = [];
  /** @param {string} dir @param {string} rel */
  const walk = (dir, rel) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SKIP_DIRS.has(e.name)) continue;
      const r = rel ? `${rel}/${e.name}` : e.name;
      index.push(r);
      if (e.isDirectory()) walk(path.join(dir, e.name), r);
    }
  };
  walk(root, '');
  return index;
}

/**
 * @param {string} root
 * @returns {RepoContext}
 */
export function loadRepo(root) {
  const index = buildIndex(root);
  /** @param {string} p */
  const normalize = (p) => p.replace(/^\.\//, '').replace(/\/$/, '');

  return {
    root,
    scripts: loadScripts(root),
    makeTargets: loadMakeTargets(root),
    existsAtRoot: (p) => fs.existsSync(path.join(root, normalize(p))),
    existsAnywhere: (p) => {
      const clean = normalize(p);
      return fs.existsSync(path.join(root, clean)) || index.some((f) => f === clean || f.endsWith(`/${clean}`));
    },
  };
}
