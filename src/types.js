// 공통 타입 정의 (JSDoc + tsc --checkJs 로 검사)

/** @typedef {'error' | 'warn'} Severity */

/**
 * 문서에서 뽑아낸 코드 조각
 * @typedef {object} Snippet
 * @property {number} line   AGENTS.md 기준 1부터 시작하는 줄 번호
 * @property {string} text   코드블록 줄 또는 인라인 백틱 내용
 */

/**
 * 검사 결과 한 건
 * @typedef {object} Finding
 * @property {string} rule
 * @property {Severity} severity
 * @property {number} line
 * @property {string} snippet
 * @property {string} message
 */

/**
 * 검사 대상 리포 정보
 * @typedef {object} RepoContext
 * @property {string} root
 * @property {Set<string> | null} scripts      package.json scripts (package.json 없으면 null)
 * @property {Set<string> | null} makeTargets  Makefile 타깃 (Makefile 없으면 null)
 * @property {(p: string) => boolean} existsAtRoot
 * @property {(p: string) => boolean} existsAnywhere
 */

/**
 * 결과를 기록하는 함수
 * @callback Report
 * @param {string} rule
 * @param {string} message
 * @param {Severity} [severity]
 * @returns {void}
 */

export {};
