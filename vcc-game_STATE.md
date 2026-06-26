# STATE.md — vcc-game

> 변하는 것만. "어디까지 했고 다음에 뭘 할 차례인가." 3~5줄 인계 메모.
> 세션 끝낼 때 갱신 → commit → push.

---

## 마지막 업데이트
- 날짜: 2026-06-27
- 장소/도구: 집 · 맥북 · ~/dev/vcc-game

## 지금까지
- EC2 → 로컬 이전 검증 **완료**. 회사 윈도우에서 `npx vercel dev --local`로 정상 실행 확인.
- 깨진 이미지 2종 수정 완료:
  - `ChatGPT Image...12_00_32.png` → `menu-art-2026.png` (메뉴 아트, index.html 수정)
  - `ChatGPT Image...01_30_42 (2).png` → `gameover-screen.png` (게임오버, game2026.js 수정)
- beta-report API 원인 분석/수정 완료 (따옴표 정규화, 라벨 없이 재시도, req.body 처리).
- beta-report 로컬 테스트 **성공 완료**. 초대코드 검증 및 실제 제출 흐름 확인.
- **Vercel 계정 이전 완료 (2026-06-26)**: vibecoding001(동호회) → inje21cs-projects(개인, bethel803과 동일).
  - Production URL: https://vcc-game-iota.vercel.app (URL 유지)
  - Vercel 대시보드: https://vercel.com/inje21cs-projects/vcc-game
- 맥북 clone 완료 (`~/dev/vcc-game`).
- **맥북 로컬 테스트 완료 (2026-06-27)**: `vercel link` → `vercel env pull` → `npx vercel dev --local` 순서 확립.
  메뉴 아트, 게임오버 화면, beta-report 흐름 모두 정상 확인.
- **Vercel Production URL 최종 확인 완료 (2026-06-27)**: 메뉴 아트, 게임오버 화면, beta-report 흐름 정상.

## 다음에 할 차례
- 없음 (v1 배포 완료 상태)

## 막힌 것 / 결정 대기
- 없음

## 건드리면 안 되는 것 / 주의
- **로컬 실행: `npx vercel dev --local`** (루트에서 실행. `npx serve`로 하면 경로 깨짐).
- beta-report 제출 테스트 = 실제 GitHub issue 생성됨. 누르지 말 것.
- games/help-me-heyda (2003 오리지널) 수정 금지. 아카이브.
- 한글·공백·괄호 포함 ChatGPT 이미지 원본 파일은 삭제하지 말 것(영문 복사본이 실사용).

## 나중에 (백로그)
- 나머지 ChatGPT AI 생성 이미지(사용되지 않는 파일들) 정리 여부 결정
