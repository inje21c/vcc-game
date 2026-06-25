# STATE.md — vcc-game

> 변하는 것만. "어디까지 했고 다음에 뭘 할 차례인가." 3~5줄 인계 메모.
> 세션 끝낼 때 갱신 → commit → push.

---

## 마지막 업데이트
- 날짜: 2026-06-26
- 장소/도구: 회사 · 윈도우 · C:\dev\vcc-game · Codex

## 지금까지
- EC2 → 로컬 이전 검증 **완료**. 회사 윈도우에서 `npx vercel dev --local`로 정상 실행 확인.
- vibecoding001(동호회) Vercel 계정으로 link 완료. 게임 화면 정상 렌더링 확인.
- 깨진 이미지 2종 수정 완료:
  - `ChatGPT Image...12_00_32.png` → `menu-art-2026.png` (메뉴 아트, index.html 수정)
  - `ChatGPT Image...01_30_42 (2).png` → `gameover-screen.png` (게임오버, game2026.js 수정)
- beta-report API 원인 분석/수정 완료:
  - `.env.local` 값의 따옴표를 서버 함수에서 정규화
  - GitHub `beta` 라벨이 없어도 이슈 생성이 되도록 라벨 없이 자동 재시도

## 다음에 할 차례
- [ ] 배포 후 Vercel Production URL에서 메뉴 아트, 게임오버 화면, beta-report 제출 흐름 확인
- [ ] (선택) 집 맥북에서도 `vercel dev --local`로 검증

## 막힌 것 / 결정 대기
- 없음

## 건드리면 안 되는 것 / 주의
- **로컬 실행 명령: `npx vercel dev --local`** (기존 `vercel dev`는 Vercel팀 인증 강제됨 → 타 계정 브라우저 차단).
  - `--local` = Vercel 프로젝트 링크 없이 순수 로컬 서버로 실행. 어떤 브라우저에서도 로그인 없이 접근 가능.
  - `api/beta-report`는 `.env.local` 변수를 그대로 읽으므로 API 기능도 동작.
- Vercel은 **vibecoding001 계정**으로만 (개인 계정 아님). 프로덕션 배포/링크 시 계정 확인 필수.
- beta-report 제출 테스트 = 실제 GitHub issue 생성됨. 누르지 말 것.
- games/help-me-heyda (2003 오리지널) 수정 금지. 아카이브.
- 한글·공백·괄호 포함 ChatGPT 이미지 원본 파일은 삭제하지 말 것(영문 복사본이 실사용).

## 나중에 (백로그)
- 나머지 ChatGPT AI 생성 이미지(사용되지 않는 파일들) 정리 여부 결정
