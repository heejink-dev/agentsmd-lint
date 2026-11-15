# agentsmd-lint

AI 코딩 에이전트는 `AGENTS.md`에 적힌 명령과 경로를 그대로 믿고 실행합니다. 리포가 바뀌었는데 문서가 그대로면 에이전트는 없는 스크립트를 돌리고, 사라진 파일을 찾고, 때로는 위험한 명령을 실행합니다.

`agentsmd-lint`는 `AGENTS.md`가 실제 리포와 맞는지(드리프트), 그리고 에이전트가 그대로 실행하면 위험한 지시가 없는지 검사하는 의존성 없는 CLI입니다.

## 설계 원칙

- **기계로 확인할 수 있는 것만 판정합니다.** 스크립트 존재, 경로 존재, 위험 패턴처럼 리포와 대조해 참·거짓이 나오는 것만 error로 보고하고, 문맥이 필요한 판단(이 경로가 예시인지, 조건부 언급인지)은 제외하거나 warn으로 낮춥니다.
- **오탐보다 미탐을 택합니다.** 린터가 틀린 경고를 반복하면 팀은 결국 끕니다. 오탐을 막으려고 검사를 제외한 경우 무엇을 놓치는지 "한계"에 적습니다.
- **실제 리포로 평가합니다.** 규칙을 바꿀 때마다 AGENTS.md가 있는 공개 리포에 다시 돌려 보고 건수와 오탐을 비교합니다.
- **도구 자신도 같은 기준을 지킵니다.** 이 리포의 AGENTS.md는 CI에서 이 도구로 검사됩니다.

## 사용법

```bash
npx agentsmd-lint            # 현재 디렉터리
npx agentsmd-lint path/to/repo
npx agentsmd-lint . --json   # CI·다른 도구 연동용
```

error가 하나라도 있으면 종료 코드 1을 반환하므로 CI에서 바로 실패로 잡힙니다.

## 검사 규칙

| 규칙 | 심각도 | 내용 |
|---|---|---|
| `script/missing` | error | `npm run X`, `pnpm run X`의 X가 `package.json` scripts에 없음 |
| `script/maybe-missing` | warn | `pnpm X`, `yarn X`의 X가 scripts에 없음 (설치된 바이너리일 수 있어 warn) |
| `make/missing-target` | error | `make X`의 X가 Makefile에 없음 |
| `path/missing` | error | 문서에 적힌 경로가 리포 어디에도 없음 |
| `danger/pipe-to-shell` | error | `curl ... \| sh` 처럼 원격 스크립트를 바로 실행 |
| `danger/skip-verify` | error | `--no-verify`, `--dangerously-skip-permissions` 같은 검증 우회 |
| `danger/chmod-777`, `danger/rm-rf-root` | error | 과도한 권한, 루트/홈 삭제 |
| `secret/hardcoded` | error | `ghp_`, `sk-`, `AKIA` 패턴의 키 |

## 오탐을 줄이기 위한 판단

실제 오픈소스 리포에 돌려보며 다음 규칙을 추가했습니다.

- **모노레포 상대경로**: `src/cli/next-dev.ts`처럼 하위 패키지 기준 경로는 리포 전체 인덱스에서 접미사로 찾음
- **빌드 산출물**: `dist/`, `build/`, `.next/`, `.venv/` 등은 클론 직후 없는 게 정상이므로 제외
- **경로가 아닌 슬래시 토큰**: `vercel/next.js`(GitHub 리포), `react-dom/server.edge`(모듈 경로)처럼 첫 폴더가 리포 루트에 없는 2단 토큰은 제외
- **플레이스홀더**: `path/to/`, `my_script.py`, `example` 등 예시 경로 제외
- **워크스페이스 명령**: `pnpm --filter=pkg build`는 하위 패키지 scripts 기준이라 제외

## 측정 결과 (2026-11-15, AGENTS.md가 있는 공개 리포 7개)

| 리포 | 검사한 참조 | v0.1 초기 결과 | 현재 결과 |
|---|---|---|---|
| vercel/next.js | 95 | 43건 | error 6 / warn 1 |
| apache/airflow | 31 | - | error 1 |
| openai/openai-agents-js | 15 | - | warn 1 |
| openai/openai-agents-python | 12 | 0 | 0 |
| pydantic/pydantic-ai | 20 | - | 0 |
| astral-sh/uv | 1 | - | 0 |
| microsoft/vscode | 0 | - | 0 |

- next.js 기준 보고 건수 **43 → 7 (84% 감소)**
- 남은 7건을 직접 확인한 결과 모두 문맥상 오탐: "(if exists)" 조건부 언급, 브랜치 이름(`releases/lts/active`), 다른 리포의 경로 설명, 매핑 예시(`a.py → tests/a.py`)
- 이번 표본에서 실제로 깨진 참조는 찾지 못함. 잘 관리되는 대형 리포라 예상된 결과이며, 다음 단계는 문맥(조건부 문장, 예시 표기)을 이해하는 판정

## 한계와 다음 단계

- 루트의 `AGENTS.md`만 검사 (하위 디렉터리 `AGENTS.md` 미지원)
- `vercel/next.js` 같은 오탐을 막기 위해, 루트에 없는 폴더로 시작하는 2단 경로(`src/gone.ts` 등)는 검사하지 않음 → 놓치는 경우가 생기는 트레이드오프
- 문장 맥락을 모르는 정규식 기반 판정 → 남은 오탐은 문맥 판정(LLM 보조 포함)으로 줄일 계획
- `git log`로 문서와 코드의 마지막 수정 시점 차이를 비교해 "오래된 문서" 경고 추가 예정
- 긴 AGENTS.md는 에이전트가 규칙을 놓치기 쉬우므로, 길이·섹션 수 기준으로 작업별 문서 분리를 권하는 warn 추가 예정

## 구조

```
bin/agentsmd-lint.js   CLI: 인자 처리와 출력만 담당
src/extract.js         마크다운 → 코드 조각(줄 번호 포함) 추출
src/repo.js            리포 정보 로드 (scripts, Make 타깃, 파일 인덱스)
src/rules.js           검사 규칙. 규칙 = (명령, 리포, report) => 검사 수
src/lint.js            조각마다 모든 규칙 실행
src/types.js           공통 타입 (JSDoc)
test/lint.test.js      규칙별 단위 테스트 (node:test)
```

새 규칙은 `src/rules.js`에 함수 하나를 추가하고 `RULES` 배열에 넣으면 됩니다.

## 개발

```bash
npm ci
npm run lint        # ESLint (flat config)
npm run typecheck   # JSDoc 타입을 tsc --checkJs(strict)로 검사
npm test            # 단위 테스트
npm run check       # 위 셋 + 이 리포의 AGENTS.md 자체 검사
```

CI(GitHub Actions)는 Node 20·22에서 lint → typecheck → test → 자체 AGENTS.md 검사 → 데모 → `npm pack --dry-run`을 실행합니다. 배포 패키지는 `files` 설정으로 `bin/`·`src/`만 포함하고, Dependabot이 의존성을 주간 점검합니다. 런타임 의존성은 없고, TypeScript는 타입 검사용 devDependency로만 씁니다.

## CI 예시

```yaml
# .github/workflows/agentsmd-lint.yml
name: agentsmd-lint
on: [pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npx agentsmd-lint .
```

## 라이선스

MIT
