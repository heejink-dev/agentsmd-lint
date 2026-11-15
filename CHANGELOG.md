# Changelog

## 0.3.0 — 2026-11-15
- ESLint(flat config) 추가, CI에 lint·`npm pack --dry-run` 단계 추가
- 이 리포의 AGENTS.md를 CI에서 직접 검사 (dogfooding)
- `files`·`exports` 설정으로 배포 패키지를 `bin/`·`src/`로 한정
- Dependabot으로 npm·GitHub Actions 의존성 주간 점검

## 0.2.0 — 2026-11-15
- 단일 파일을 `extract` / `repo` / `rules` / `lint` 모듈로 분리
- JSDoc 타입 + `tsc --checkJs`(strict) 타입 검사, 이 과정에서 타입 버그 1건 수정
- 규칙별 단위 테스트 9개(`node:test`), CI를 Node 20·22 매트릭스로 확장

## 0.1.0 — 2026-11-15
- 스크립트·Make 타깃·경로 드리프트 검사, 위험 지시 5종 검사
- 공개 리포 7개 측정으로 오탐 원인 5가지를 규칙화 (next.js 기준 43 → 7건)
