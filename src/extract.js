/** @typedef {import('./types.js').Snippet} Snippet */

const FENCE = /^\s*(```|~~~)/;
const INLINE_CODE = /`([^`]+)`/g;

/**
 * 마크다운에서 코드블록 안의 줄과 인라인 백틱 내용을 줄 번호와 함께 뽑는다.
 * @param {string} markdown
 * @returns {Snippet[]}
 */
export function extractSnippets(markdown) {
  /** @type {Snippet[]} */
  const out = [];
  let inFence = false;

  markdown.split('\n').forEach((line, i) => {
    if (FENCE.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) {
      out.push({ line: i + 1, text: line.trim() });
      return;
    }
    for (const m of line.matchAll(INLINE_CODE)) out.push({ line: i + 1, text: m[1].trim() });
  });

  return out.filter((s) => s.text.length > 0);
}
