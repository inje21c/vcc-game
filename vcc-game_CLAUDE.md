# CLAUDE.md — vcc-game

> 이 파일은 **변하지 않는 것**을 담는다. 구조, 실행법, 계정, 제약.
> "지금 어디까지 했나"는 `STATE.md`에 쓴다.
> 어느 기기·어느 도구로 열든 이 파일이 동일한 전제를 보장한다.

---

## 0. 이 프로젝트가 무엇인가

vcc-game은 **사내 바이브코딩 동호회(VCC)** 프로젝트로,
**2003년에 만든 모바일 게임 "help-me-heyda(도와줘 헤이다)"를 모던 웹/PWA로 리메이크**하는 것이다.
오리지널(2003)과 모던화 버전을 함께 보존하는 아카이브 + 리메이크 성격.
사용자 피드백을 받아 GitHub Issue로 자동 등록하는 구조가 있다.

---

## 1. 인프라·계정 (중요 — 개인 프로젝트와 분리됨)

- **GitHub**: `git@github.com:inje21c/vcc-game.git` (개인 핸들과 공유)
- **Vercel**: **vibecoding001 계정 (동호회 전용)** — 개인 bethel803 Vercel 계정과 다름!
  - vercel 명령 시 반드시 **vibecoding001** 계정으로 로그인.
  - 다른 계정으로는 vcc-game 프로젝트가 목록에 안 보임.
- **회사 윈도우**: HTTPS clone 막힘 → **SSH로** clone/push.
- EC2 없음(2003 원본 포함 GitHub가 단일 진실). 소스 무변경으로 이전됨.

---

## 2. 로컬 실행 (★ 가장 중요 — 안 그러면 깨진다)

- **`npx serve`로 띄우면 깨진다.** index.html은 `public/`에,
  styles.css·game2026.js는 `src/`에 분리돼 있어 경로가 안 맞음(404).
- **반드시 루트에서 `npx vercel dev --local`** 로 띄울 것.
  → Vercel 팀 인증 없이 src/public 경로 매핑 + api/ 서버리스가 로컬에서 작동.
  → http://localhost:3000

```
cd C:\dev\vcc-game
npx vercel dev --local
```

- 무시해도 되는 404: `favicon.ico` (사이트 아이콘, 게임과 무관).
- Vercel 프로젝트 link 또는 일반 `vercel dev` 실행 시 `.env.local`(VERCEL_OIDC_TOKEN)·`.vercel/` 자동 생성
  → **둘 다 git에 올리지 말 것** (.gitignore 확인 필수).

---

## 3. 구조

```
vcc-game/
├── games/
│   ├── help-me-heyda/          # 오리지널 (2003) — 아카이브, 읽기 전용처럼 다룰 것
│   │   ├── public/index.html
│   │   └── src/ (app.js, styles.css)
│   └── help-me-heyda-modern/   # 모던화 리메이크
│       ├── docs/   (기획: chapter1-boss-design, remake-direction, roadmap-2026 등)
│       ├── public/ (index.html, manifest.webmanifest, sw.js, assets)
│       └── src/    (app.js, game2026.js, styles.css)
├── api/
│   └── beta-report.js          # Vercel Serverless Function
├── index.html                  # 루트 런처/포털
├── vercel.json (있으면 라우팅 규칙)
└── .vercelignore
```

- 빌드 도구 없는 **순수 정적 웹** + Vercel 서버리스. 루트에 package.json 없음.

---

## 4. 피드백 → GitHub Issue 연동

- `api/beta-report.js` = Vercel Serverless Function.
  사용자 의견 제출 → 이 함수가 GitHub API로 **issue 자동 생성**.
- GitHub 토큰은 **서버리스 함수(서버 측)에만** 있음(Vercel 환경변수). 프론트 노출 없음 — 안전한 구조(A).
- ⚠️ **로컬에서 beta-report 제출 테스트 = 실제 GitHub issue가 생성됨** (운영 레포).
  테스트 시 제출 버튼 누르지 말 것. 정말 필요하면 별도 테스트 레포로.

---

## 5. 보존 원칙 (2003 원본)

- `games/help-me-heyda/` (오리지널)은 20여 년 된 디지털 유산.
- 모던화 작업은 `*-modern/`에서만. **오리지널을 덮어쓰거나 수정하지 말 것.**
- 오리지널은 읽기 전용 아카이브로 취급.

---

## 6. 작업 방식

- 세션 시작: `git pull --rebase`. 종료: STATE.md 갱신 → commit → push.
- 단계마다 보고 후 확인 대기. 표면 해결보다 구조 해부 우선.
