# Chapter 1 Reward: Nature Power

## 설계 목표

Chapter 1 클리어 후 플레이어는 단순히 다음 챕터로 넘어가는 것이 아니라, 헤이다가 토템 안의 자연의 힘을 처음 깨우는 순간을 경험한다. 원작의 타임 아이템은 2026년판에서 이미 바닥 라인 클리어 보상으로 흡수되었으므로, 새 보상은 시간 회복이 아니라 방해물에 대응하는 능력이어야 한다.

핵심 방향:

- 토템은 점수 블록이 아니라 마을의 기억과 자연의 힘을 담은 매개체다.
- 불도저는 시간이 지나며 다가오는 존재에서, 챕터가 진행될수록 길을 오염시키는 존재로 확장된다.
- Chapter 1 보상은 이후 방해물 시스템을 학습시키는 첫 스킬이어야 한다.

## 스토리 제안

붉은 깃발의 감독관이 물러난 뒤, 숲에 꽂혀 있던 깃발들이 쓰러진다. 그러나 깃발 아래에는 이미 땅을 파헤친 자국과 굳어버린 흙덩이가 남아 있다. 헤이다는 토템을 들어 올리고, 잎 문양에서 작은 빛이 새어 나온다. 그 빛은 흙 위로 번져 새싹을 틔우고, 막혀 있던 길을 다시 부드럽게 만든다.

추장은 말한다.

> "토템은 시간을 되돌리는 물건이 아니다. 길이 막혔을 때 다시 숨을 불어넣는 힘이다."

이후 Chapter 2부터 불도저는 단순히 다가오기만 하지 않는다. 개발 장비가 지나간 흔적으로 보드 안에 방해물을 남기고, 플레이어는 Chapter 1에서 얻은 자연의 힘으로 그 흔적을 정화해야 한다.

## Chapter 1 클리어 보상

보상 이름:

- 자연의 힘: 잎의 정화

해금 시점:

- Stage 6 보스 클리어 후 Chapter 2 인트로 진입 전 또는 Chapter 2 인트로 안에서 해금한다.

스토리 문구:

- `잎 토템이 깨어났습니다`
- `막힌 길에 다시 숨을 불어넣습니다`
- `Chapter 2부터 개발의 흔적을 정화할 수 있습니다`

플레이 기능:

- 선택한 줄의 가장 앞 방해물 또는 첫 토템을 정화한다.
- 방해물이 있으면 방해물을 우선 제거한다.
- 방해물이 없으면 해당 줄의 첫 토템 하나를 제거한다.
- 사용 횟수는 제한한다. Chapter 2 첫 구현에서는 스테이지당 1회가 적당하다.

## 불도저 방해물 설계

방해물 이름:

- 개발의 흔적

시각 콘셉트:

- 굳은 흙덩이
- 붉은 측량 끈 조각
- 작은 말뚝
- 회색 먼지
- 토템 문양이 없는 막힌 칸

역할:

- 일반 토템처럼 바닥 라인으로 밀어 넣을 수 없다.
- 줄의 가장 앞에 있으면 해당 줄의 push를 막는다.
- 자연의 힘으로 제거할 수 있다.
- 일부 보스 패턴이나 불도저 압박 이벤트로 생성된다.

왜 필요한가:

- 지금은 바닥 라인을 맞추면 자동으로 시간이 늘어나므로, 플레이어의 대응 수단이 대부분 시간 보상에 모인다.
- 방해물은 "시간이 부족하다"가 아니라 "길이 막혔다"는 새로운 문제를 만든다.
- 자연의 힘은 이 문제를 해결하는 보상으로 의미가 생긴다.

## Chapter 2 적용 1차안

처음부터 강하게 넣지 않는다. Chapter 2는 자연의 힘 튜토리얼 역할을 한다.

Stage 7:

- 시작 시 방해물 1개를 고정 배치한다.
- 자연의 힘 버튼을 안내한다.
- 스테이지당 1회 사용 가능.

Stage 8-9:

- 시작 배치에 방해물 1-2개.
- 실수 시 낮은 확률로 방해물 1개가 생긴다.

Stage 10-11:

- 보스 예고로 방해물 생성 빈도를 조금 올린다.
- 자연의 힘을 아껴 쓰는 판단이 생기게 한다.

Stage 12 보스:

- 보스가 일정 시간마다 `개발의 흔적`을 생성한다.
- Chapter 1에서 배운 자연의 힘을 사용해야 안정적으로 클리어할 수 있다.

## 자연의 힘 확장 방향

Chapter 1 보상은 잎 하나만 해금한다. 이후 챕터에서 다른 자연력으로 확장한다.

- 잎: 정화. 앞 방해물 또는 첫 토템 제거.
- 물결: 흐름. 한 줄의 빈칸을 아래로 안정화하거나 방해물을 뒤로 밀어낸다.
- 산: 버팀. 불도저 압박 또는 라인 상승을 1회 막는다.
- 해: 활력. 다음 바닥 매칭 보상을 강화한다.
- 바람: 이동. 선택 줄의 토템 순서를 한 칸 회전한다.
- 구름: 예지. 다음 보스 방해 줄을 미리 보여준다.

## UI 제안

게임 화면 하단 또는 오른쪽에 작은 자연력 버튼을 둔다.

표시 요소:

- 잎 아이콘
- 남은 사용 횟수 `1`
- 사용 가능할 때 녹색 빛
- 사용 후 회색 처리

조작:

1. 자연력 버튼 터치
2. 정화할 줄 터치
3. 해당 줄의 앞 방해물 또는 첫 토템 제거

실수 방지:

- 버튼을 다시 누르면 취소.
- 사용 가능한 줄이 없으면 사용하지 않고 메시지만 표시.

## 밸런스 기준

초기값:

- Chapter 2부터 스테이지당 1회 사용 가능
- 방해물은 Stage 7에서 1개, Stage 8-9에서 1-2개, Stage 10-11에서 2개 이하
- Stage 12 보스는 18-22초마다 방해물 1개 생성

실패 방지:

- 방해물이 너무 많아 클리어 불가능해지면 안 된다.
- 한 줄에 방해물은 1개만 둔다.
- 방해물은 바닥 수집 줄에는 생성하지 않는다.
- 방해물 생성은 빈칸 또는 맨 앞칸에만 제한한다.

## 구현 순서

1. Chapter 1 클리어 후 `leafCleanse` 해금 상태를 저장한다.
2. Stage 7부터 자연력 버튼을 표시한다.
3. 선택 모드와 줄 터치 정화 흐름을 추가한다.
4. 방해물 값을 보드 데이터에 별도 상수로 정의한다.
5. Stage 7에 튜토리얼 방해물 1개를 생성한다.
6. Stage 8-12에 방해물 생성 규칙을 확장한다.
7. Stage 12 보스 설계와 연결한다.

## 필요한 에셋 제안

### 잎 자연력 아이콘

파일 후보:

- `games/help-me-heyda-modern/public/assets/power-leaf-cleanse.png`

프롬프트:

```text
Create a transparent-background mobile game skill icon for "Nature Power: Leaf Cleanse". A glowing green leaf totem symbol releasing small golden particles, clean circular composition, polished 2D mobile game asset, readable at 48px, warm forest fantasy style, no text, no logo, no UI frame, PNG with alpha, aspect ratio 1:1.
```

### 개발의 흔적 방해물

파일 후보:

- `games/help-me-heyda-modern/public/assets/obstacle-development-mark.png`

프롬프트:

```text
Create a transparent-background 2D mobile puzzle obstacle tile. Concept: a compact clump of hardened dirt with a small red survey stake, gray dust, and a torn construction ribbon, representing a development scar in a forest. It must fit inside a square puzzle tile, readable at small size, polished painterly mobile game style, not too dark, no text, no logo, PNG with alpha, aspect ratio 1:1.
```

### 자연력 해금 컷신

파일 후보:

- `games/help-me-heyda-modern/public/assets/chapter1-reward-leaf-power.png`

프롬프트:

```text
Create a vertical mobile game story cutscene for "Help Me Heyda 2026". Scene: after the first boss is defeated, red survey flags lie on the forest ground while Heyda holds a glowing leaf totem. Green light spreads from the totem into damaged soil, small sprouts appear, and the forest path begins to heal. Emotional mood: relief, discovery, hopeful magic, family-friendly. Cinematic 2D painterly mobile game art, warm forest light, clear character silhouette, no text, no logo, no UI. Leave safe space near bottom for story text overlay. Aspect ratio 9:16.
```

## BGM / 효과음 제안

자연력 해금 짧은 음악:

```text
Short magical unlock sting for a mobile forest puzzle adventure. A gentle leaf totem awakens, warm marimba, soft wooden chimes, airy flute shimmer, hopeful and emotional, no vocals, no lyrics, 6 seconds, clean ending.
```

정화 스킬 효과음:

```text
Short mobile game skill sound effect. Leaf magic cleanses a blocked tile, soft green sparkle, tiny wooden chime, gentle wind swirl, satisfying but not loud, no voice, 1.5 seconds.
```
