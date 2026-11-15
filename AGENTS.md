# AGENTS.md — agentsmd-lint

이 리포에서 작업하는 AI 에이전트를 위한 안내입니다. 이 파일 자체도 CI에서 `npm run self-check`로 검사됩니다.

## 구조

- `bin/agentsmd-lint.js`: CLI. 인자 처리와 출력만 담당
- `src/rules.js`: 검사 규칙. 새 규칙은 여기에 함수 하나를 추가하고 `RULES`에 등록
- `src/types.js`: 공통 JSDoc 타입
- `test/lint.test.js`: 규칙별 단위 테스트

## 명령

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run check
```

## 규칙

- 런타임 의존성을 추가하지 않습니다. 개발 도구는 devDependencies에만 둡니다.
- 규칙을 추가하면 같은 PR에 탐지 케이스와 비탐지(오탐 방지) 케이스 테스트를 함께 추가합니다.
- 오탐을 줄이려고 검사를 제외할 때는 README의 "한계" 항목에 무엇을 놓치게 되는지 적습니다.
