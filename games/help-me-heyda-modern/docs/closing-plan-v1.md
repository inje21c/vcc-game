# 도와줘 헤이다 2026 — v1.0 개발 클로징 계획

*작성: 2026년 6월*

## 배경과 판단

베타 피드백에서 "18스테이지가 너무 짧다"는 요구가 나왔다. 동시에 내부 개발 방향은 챕터 보스전, 아이템 시스템, 스토리 이미지·사운드 제작 등 애셋 의존도가 높은 쪽으로 흘러가고 있었다.

**이것은 잘못된 방향이다.** 1인 바이브코딩 프로젝트에서 새 애셋을 만들수록 개발 부하가 선형이 아니라 지수로 늘어난다. 보스 1개 = 이미지 + 사운드 + 패턴 로직 + 밸런스 테스트. 이 사이클을 챕터마다 반복하면 v1.0 클로징은 없다.

**판단:** 탄탄한 코어 게임을 먼저 닫는다. 보스전·아이템 확장은 v1.0 이후 버전업으로 분리한다.

---

## v1.0 범위 정의

### 포함 (IN)

| 항목 | 상태 |
|------|------|
| 스테이지 1–18 (레거시 데이터) | 완료 |
| 스테이지 19–36 (절차적 생성) | **신규 작업** |
| Chapter 1 보스 (Stage 6, 붉은 깃발의 감독관) | 완료 |
| 잎의 정화 스킬 (해금 흐름) | 완료 |
| 서바이벌 모드 | 완료 |
| PWA, 사운드, 저장 | 완료 |
| 스테이지 36 클리어 후 서바이벌 전환 유도 | **신규 작업** |
| 난이도 커브 연장 (19–36) | **신규 작업** |
| 스테이지 구간 명칭 정리 | **신규 작업** |

### 제외 — v2.0으로 이월 (OUT)

| 항목 | 이유 |
|------|------|
| Chapter 2 보스 (Stage 12) | 이미지·BGM·패턴 모두 미구현, 애셋 부하 큼 |
| Final Chapter 보스 (Stage 18) | 동일 |
| 추가 아이템·스킬 시스템 | 현재 잎의 정화로 충분, 밸런스 검증 필요 |
| 챕터별 배경·스토리 이미지 추가 | AI 이미지 생성 시간 부하 |
| 미션 모드 | 코어 스테이지 완성 후 |
| 랭킹·리플레이 | 동일 |
| AI 내레이션 | 동일 |

---

## 스테이지 19–36 설계

### 원칙

- **새 애셋 없음.** 기존 블록 스프라이트·BGM·사운드 전부 재사용.
- **절차적 생성.** 레거시 파일이 없는 스테이지는 알고리즘으로 보드를 만든다.
- **난이도 커브 연장.** `stageTime()`, `availableBlockCount()`, 보드 밀도를 18 이후로 자연스럽게 연장.

### 구간 구조

```
Stage  1–18   "원작 구간"  — 레거시 데이터 사용
Stage 19–27   "심화 구간"  — 절차적 생성, 블록 9종, 시간 660→590
Stage 28–36   "극한 구간"  — 절차적 생성, 블록 9종, 밀도 상승, 시간 580→500
Stage 37+     → 서바이벌 모드로 전환 (무한)
```

### 코드 변경 목록

**1. `stageTime()` 연장**

```js
stageTime(stage) {
  if (stage <= 18) {
    const times = [980,970,960,950,930,910,890,870,850,830,810,790,770,750,730,710,690,670];
    return times[stage - 1];
  }
  // 19 이후: 매 스테이지 10씩 감소, 최소 400
  return Math.max(400, 660 - (stage - 19) * 10);
}
```

**2. `availableBlockCount()` 연장**

```js
availableBlockCount(stage) {
  if (stage <= 4)  return 3;
  if (stage <= 7)  return 4;
  if (stage <= 10) return 5;
  if (stage <= 13) return 6;
  if (stage <= 15) return 7;
  if (stage <= 17) return 8;
  return 9;  // 18 이후 전부 9종 (현재와 동일, 변경 없음)
}
```

**3. `generateStage(number)` 추가**

```js
generateStage(number) {
  const board = this.emptyBoard();
  const blockTypes = this.availableBlockCount(number);
  // 심화(19-27): 하단 3줄, 극한(28-36): 하단 4줄, 37+: 5줄
  const filledRows = number <= 27 ? 3 : number <= 36 ? 4 : 5;
  const startRow = ROWS - 1 - filledRows;
  for (let row = startRow; row < ROWS - 1; row++) {
    for (let col = 0; col < COLS; col++) {
      if (Math.random() > 0.18) {  // 약 82% 밀도
        board[row][col] = Math.floor(Math.random() * blockTypes) + 1;
      }
    }
  }
  return board;
}
```

**4. `loadStage()` 수정**

```js
async loadStage(number) {
  if (this.stageCache.has(number)) return this.cloneBoard(this.stageCache.get(number));
  // 레거시 범위 내: 파일 로드
  if (this.stageFiles.length && number <= this.stageFiles.length) {
    // ... 기존 fetch 로직 ...
  }
  // 레거시 범위 초과: 절차적 생성
  const board = this.generateStage(number);
  this.stageCache.set(number, this.cloneBoard(board));
  return this.cloneBoard(board);
}
```

**5. `getTotalStages()` 변경**

```js
getTotalStages() {
  return 36;  // 고정 값, 이후 버전업 때 조정
}
```

**6. `isFinalStage()` 변경**

```js
isFinalStage() {
  return this.stage >= 36;
}
```

**7. 챕터 구간 명칭 정비**

```js
const storyChapters = [
  { label: "Chapter 1", title: "숲이 숨을 멈춘 날",  stages: [1, 6],   bossStage: 6,  ... },
  { label: "Chapter 2", title: "토템의 노래",          stages: [7, 12],  bossStage: null, ... },  // 보스 비활성화
  { label: "Chapter 3", title: "마지막 길",            stages: [13, 18], bossStage: null, ... },  // 보스 비활성화
  { label: "Chapter 4", title: "심화의 숲",            stages: [19, 27], bossStage: null, image: "assets/background-forest-2026.png" },
  { label: "Chapter 5", title: "극한의 길",            stages: [28, 36], bossStage: null, image: "assets/background-forest-2026.png" },
];
```

**8. Stage 36 클리어 후 서바이벌 전환 유도**

```js
// 마지막 스테이지 클리어 결과 화면에서
if (this.isFinalStage()) {
  // "모든 스테이지를 완주했습니다! 이제 무한 서바이벌에 도전하세요." 메시지
  // 서바이벌 모드 시작 버튼 강조
}
```

---

## `storyStoneFlag()` 연장

```js
storyStoneFlag(stage) {
  if (stage <= 6)  return 4;
  if (stage <= 9)  return 3;
  if (stage <= 13) return 2;
  if (stage <= 27) return 1;
  return 0;  // 28 이후: 스톤 플래그 없음 (순수 퍼즐)
}
```

---

## 보스 비활성화 처리

Stage 12, Stage 18 보스는 `bossStage: null` 로 설정해 트리거 없음. 기존 `CHAPTER1_BOSS` 와 Stage 6 보스 로직은 그대로 유지. v2에서 챕터별 보스를 순차 추가.

---

## v1.0 클로징 체크리스트

### 코드 완성

- [ ] `generateStage()` 구현 및 테스트
- [ ] `loadStage()` 분기 수정
- [ ] `stageTime()` 연장
- [ ] `getTotalStages()` → 36
- [ ] `isFinalStage()` 수정
- [ ] `storyChapters` Chapter 4·5 추가
- [ ] Stage 36 클리어 후 서바이벌 유도 UI
- [ ] `storyStoneFlag()` 연장

### 검증

- [ ] Stage 19, 27, 28, 36 각각 진입·클리어 동작 확인
- [ ] 난이도 커브 플레이 테스트 (19→27, 28→36)
- [ ] 36 클리어 후 서바이벌 전환 흐름 확인
- [ ] 저장 진행도 36까지 정상 동작 확인
- [ ] 모바일 기기 실기 테스트

### 동결 확인

- [ ] Chapter 2·3 보스 코드가 트리거되지 않는지 확인
- [ ] 잎의 정화 외 아이템 추가 없음 확인
- [ ] 새 이미지·사운드 애셋 추가 없음 확인

---

## 서바이벌 모드 → 무한 스테이지 연동

서바이벌 모드는 이미 존재한다. v1.0에서 추가할 것은 연결 고리뿐이다.

- 스토리 36스테이지 클리어 → "이제 진짜 도전이 시작됩니다" 결과 화면
- 서바이벌 모드를 "무한 스테이지" 라고도 부를 수 있는 UI 텍스트 병기
- 서바이벌 모드 진입 시 "스토리 완주자" 배지 표시 (localStorage 기반, 서버 없음)

---

## 타임라인

| 단계 | 작업 | 예상 세션 수 |
|------|------|------------|
| 1 | 코드 변경 8개 항목 구현 | 1–2 |
| 2 | Stage 19–36 플레이 테스트 및 난이도 조정 | 1 |
| 3 | 서바이벌 전환 UI | 1 |
| 4 | 전체 클로징 체크리스트 통과 | 1 |
| **총합** | | **4–5 세션** |

---

## v2.0 이후 로드맵 (예약)

- Chapter 2 보스: 철길을 여는 굴착기
- Chapter 3 보스: 거대한 불도저
- 아이템 시스템 확장 (해 토템, 물결 토템 등)
- 챕터별 배경 이미지 교체
- BGM 챕터 분리
- 미션 모드
- 랭킹·일일 챌린지
