# 07 — 구현 지시서 Phase 1: 워킹 프로토타입 (Claude Code 투입용)

**문서 버전**: 1.0
**상위 문서**: `01-gdd.md` (규칙의 유일한 출처), `02-level-format.md` (데이터·솔버 계약), `04-asset-spec.md` (에셋 ID)
**저장 위치**: `vcc-game/games/tangerine-isle/docs/design/07-implementation-phase1.md`
**개발 환경**: VS Code + Claude Code. 작업 루트 = `games/tangerine-isle/`. 에셋은 `tangerine-isle-assets-v5-final.zip`을 루트에 압축 해제한 상태를 전제한다 (assets/, tools/ 생성됨).

---

## 0. Phase 1의 범위 — 이것만 만든다

**목표**: 룸 1개에서 라봉이(고양이)를 움직여 GDD의 핵심 규칙이 전부 동작하는 것을 확인한다.

포함: 4방향 이동, 돌 밀기, 귤 획득(체력 +G), 체력 소모/게임오버, 물·나무·구덩이·문 차단, 돌로 구덩이 메우기, 버튼 그룹 → 비밀문 개방, 폭탄 접촉 기폭·십자 폭발·연쇄, 열쇠 → 상자 개방(클리어), 캐릭터 전환(토끼 땅굴·거북 수영 포함), 터치 D-패드 + 키보드.

제외 (Phase 2 이후): 월드맵, 스테이지 선택, 열기구 미니게임, 오디오, 저장, 애니메이션 폴리시, 데드락 감지 UI.

## 1. 파일 구조 (이대로 생성)

```
games/tangerine-isle/
├── index.html
├── src/
│   ├── core/
│   │   ├── rules.js        ← 규칙 엔진. 순수 함수만. DOM/Canvas 참조 절대 금지
│   │   └── state.js        ← 초기 상태 생성 (stage JSON → State)
│   ├── render/
│   │   └── renderer.js     ← Canvas 2D 렌더러 (§4 렌더링 계약 준수)
│   ├── input/
│   │   └── input.js        ← 키보드 + 터치 D-패드 (§5 입력 계약)
│   ├── data/
│   │   └── stages.json     ← §6의 테스트 스테이지 1개
│   └── main.js             ← 조립: 상태 → 입력 → rules.nextState → 렌더
├── assets/                 ← v5 zip 그대로
└── docs/design/            ← 설계 문서들
```

빌드 도구 없음. ES 모듈(`<script type="module">`)로 직접 로드. 프레임워크 금지 — vanilla JS.

## 2. rules.js 계약 (02 문서 §5 상세화)

```js
// 시그니처 (고정)
export function nextState(state, action) -> { state, events } | null
// action: {type:'move', dir:'up'|'down'|'left'|'right'} | {type:'switch', char:'cat'|'rabbit'|'turtle'}
// null = 불가능한 행동 (벽에 막힘 등). 상태 불변 (원본 변이 금지, 새 객체 반환)
// events: 렌더러가 소비할 이벤트 배열 [{type:'explosion', tiles:[...]}, {type:'pickup', ...}, ...]
```

이동 판정 순서 (GDD 규칙의 코드화 — 이 순서를 지킬 것):
1. 목표 칸 산출. 룸 경계면 인접 룸 전환 (Phase 1은 단일 룸이라 경계 = 차단)
2. 목표 칸에 돌 → 활성 캐릭터가 cat이고 돌의 다음 칸이 (바닥 or 구덩이)면 밀기 성공. 구덩이면 돌 소멸+구덩이 메움. 아니면 null
3. 목표 칸 지형 차단 판정: tree(단, rabbit이고 그 다음 칸이 통행 가능하면 2칸 관통 이동 = 땅굴, 체력 2 소모), water(turtle만), pit(차단), door(열려있지 않으면 차단)
4. 이동 확정 → 체력 -1 (땅굴은 -2). 체력 0 이하 → events에 gameover
5. 도착 칸 처리: 귤(+G, 제거), 열쇠(보유 플래그), 폭탄(즉시 기폭 → 십자 N타일: 나무·나무문 제거, 폭탄 연쇄; 플레이어 무해), 상자(열쇠 보유 시 개방 → events에 clear)
6. 돌 이동 후 버튼 그룹 재평가 → 그룹 완성 시 연결 문 open

캐릭터 전환: 체력 소모 0, 제자리, 언제나 가능.

## 3. state.js — State 형태

```js
{
  char: 'cat',
  pos: [x, y],
  hp: 60,                       // stages.json의 startHp
  hasKey: false,
  tangerines: Set("x,y"),       // 남은 귤 좌표
  rocks: Set("x,y"),
  bombs: Map("x,y" -> range),
  removedTiles: Set("x,y"),     // 폭발로 사라진 나무/나무문
  filledPits: Set("x,y"),
  openDoors: Set("x,y"),
  status: 'playing'|'clear'|'gameover'
}
```

## 4. 렌더링 계약 (목업 검증 완료 — 수치 변경 금지, 튜닝은 상수로 분리)

- 캔버스 논리 해상도: 15×15×128 = 1920×1920. CSS로 `min(100vw, 100vh)` 축소. `image-rendering: auto` (128px 에셋은 픽셀레이티드 강제 불필요)
- 배경색: `#D69E4A`
- 그리기 순서 (검증된 4패스):
  1. 지형 패스: 전 칸 ground_a → 특수 지형 덮기 (ground_b/water/pit/pit_filled). 물은 2프레임 교대 (water_a/b, 500ms)
  2. 바닥 아이템 패스: 귤·열쇠·버튼 — 타일의 80% 크기, 셀 중앙
  3. 입체 패스 (y좌표 오름차순 정렬): 나무(1.18배, 바닥선 앵커) → 문(등배) → 돌/폭탄/상자/캐릭터(그림자 타원 + 1.2배, 바닥선 앵커)
  4. HUD 패스: §5
- 그림자: ellipse(16,84,112,120 @128px 기준), rgba(40,25,10,0.31)
- 폭발 이벤트: fx 시트가 아직 없으므로 Phase 1은 주황 십자 플래시(200ms)로 대체

## 5. 입력 계약 — 한 손 조작 (2026-07-09 확정)

- **터치 D-패드**: 화면 하단 코너에 4방향 패드, 불투명도 40%(터치 중인 방향 버튼만 70%). 지름은 화면 짧은 변의 30%. **좌/우 도킹 토글** 버튼(패드 상단 소형)으로 왼손/오른손 전환, 선택은 localStorage… 대신 메모리 변수로 (아티팩트 환경 고려 불필요, 게임은 실배포므로 localStorage 사용 가능)
- 홀드 = 연속 이동 (180ms 간격 리핏). 이동은 칸 단위 스냅, 이동 중 입력 큐 1칸
- **캐릭터 전환**: D-패드 반대편 하단에 초상 버튼 3개 (Phase 1은 초상 에셋 前이므로 색 원형 + 이니셜 C/R/T). 활성 캐릭터는 테두리 강조
- **키보드** (데스크톱): 화살표/WASD 이동, 1/2/3 전환
- HUD: 좌상단 귤 아이콘(ui_icon_tangerine) + 체력 숫자, 열쇠 아이콘(획득 시 점등)

## 6. 테스트 스테이지 (stages.json에 이것 1개)

02 문서 §2 스키마 준수. 목업 검증에 쓴 룸을 기반으로 하되 **클리어 가능하게** 다음을 보장: 돌 2개와 버튼 2개(그룹 g1) → 돌문 개방 경로, 나무문은 폭탄으로 제거 가능 배치, 물 건너에 열쇠(거북 필요), 나무 1칸 관통해야 닿는 귤(토끼 필요), startHp=60, G=10, 귤 5개.
스테이지 데이터를 만들었으면 **손으로 풀어본 해법 경로를 주석으로 기록**할 것 (솔버는 Phase 2).

## 7. 완료 정의 (Definition of Done)

- [ ] `npx serve` 등 정적 서버로 index.html 열면 즉시 플레이 가능
- [ ] GDD §3 능력 매트릭스의 O/X 전 조합이 실제로 동작 (고양이만 밀기, 토끼만 땅굴, 거북만 수영)
- [ ] 폭탄 연쇄: 3폭탄이 2폭탄을 연쇄 기폭하는 배치에서 두 폭발 범위가 모두 적용됨
- [ ] 체력 0 → 게임오버 → R키/재시작 버튼으로 리셋
- [ ] 열쇠 → 상자 → "CLEAR" 표시
- [ ] 모바일 뷰포트(Chrome DevTools iPhone)에서 D-패드 한 손 조작 성립
- [ ] rules.js에 import 문 외 DOM/window 참조 0건 (Phase 2 솔버가 그대로 가져다 씀)

## 8. Claude Code 세션 시작 프롬프트 (복사용)

```
games/tangerine-isle/docs/design/ 의 01-gdd.md, 02-level-format.md,
07-implementation-phase1.md 를 읽어라. 07이 이번 작업의 범위다.
07의 파일 구조·계약·완료 정의를 그대로 구현하라. 규칙 해석이 애매하면
01-gdd.md 가 유일한 진실이다. 완료 정의 체크리스트를 하나씩 검증하며 진행하라.
```
