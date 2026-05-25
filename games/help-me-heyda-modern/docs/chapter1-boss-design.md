# Chapter 1 Boss Design

## 개요

Chapter 1 보스는 Stage 6에서 처음 등장한다. 목적은 플레이어를 갑자기 어렵게 만드는 것이 아니라, 이후 챕터 보스의 기본 문법을 알려주는 것이다.

- 챕터: Chapter 1, 숲이 숨을 멈춘 날
- 보스 스테이지: Stage 6
- 보스 이름: 붉은 깃발의 감독관
- 핵심 감정: 처음으로 마을이 직접 위협받는 긴장감
- 플레이 목표: 기존 Stage 6 클리어 구조를 유지하면서 보스 경고와 대응을 학습한다.

## 보스 콘셉트

붉은 깃발의 감독관은 숲에 개발 구역 표시를 박는 인물이다. 직접 싸우기보다 특정 줄에 붉은 깃발을 꽂아 플레이어를 흔든다. Chapter 1의 보스이므로 공격은 강하지 않지만, 무시하면 불도저가 조금 더 빨리 다가온다.

시각 키워드:

- 붉은 측량 깃발
- 노란 안전 조끼
- 지도판 또는 측량 막대
- 숲을 침범하는 개발 장비의 전조
- 과장된 모바일 게임 보스 실루엣

## 전투 규칙 1차안

### 보스 상태

- `bossActive`: 현재 스테이지가 보스 스테이지인지 여부
- `bossName`: 붉은 깃발의 감독관
- `bossHpMax`: 3
- `bossHp`: 3
- `bossWarningRow`: 현재 경고가 걸린 줄
- `bossWarningUntil`: 경고 종료 시간
- `bossNextAttackAt`: 다음 경고 시작 시간

### 등장 조건

- Stage 6 시작 시 보스 HUD를 표시한다.
- 스테이지 시작 메시지는 `Boss Stage 6: 붉은 깃발의 감독관`으로 시작한다.
- 시작 후 5초 동안은 보스 공격을 하지 않는다.

### 공격 패턴: 붉은 깃발 경고

1. 보스는 약 20초마다 토템이 남아 있는 줄 하나를 고른다.
2. 해당 줄에 붉은 깃발 경고 표시를 5초 동안 띄운다.
3. 플레이어가 경고 줄을 밀면 경고가 해제되고 작은 점수 보너스를 준다.
4. 5초 안에 대응하지 않으면 보스가 개발 구역을 확정한다.
5. 개발 구역 확정 시 `storyTime`을 5초 줄이고, 카메라 흔들림과 실패 효과음을 낸다.

의도:

- 줄 잠금처럼 답답한 패널티는 피한다.
- 플레이어가 경고를 보고 대응하는 습관을 배운다.
- 실패해도 즉시 게임이 망하지 않고 시간 압박만 늘어난다.

### 보스 피해 규칙

- 스토리 바닥 라인을 정상 클리어할 때마다 보스 HP를 1 줄인다.
- 보스 HP가 0이 되면 보스 공격은 중지된다.
- Stage 6 자체는 기존처럼 모든 토템을 정리해야 클리어된다.

의도:

- 기존 퍼즐 목표를 유지한다.
- 보스 체력은 별도 전투라기보다 챕터 클리어 연출 장치로 사용한다.
- Stage 6은 현재 8회 클리어 분량이므로 HP 3은 충분히 달성 가능하다.

## UI / 연출

### 보스 HUD

위치:

- 플레이 화면 상단, 기존 HUD 아래 또는 보드 상단 좌측

표시 요소:

- 보스 작은 초상
- 보스 이름
- 붉은 깃발 HP 3개
- 경고 중일 때 짧은 타이머 바

텍스트 예:

- `붉은 깃발의 감독관`
- `FLAG WARNING`

### 경고 줄 표시

- 보드의 해당 줄 배경을 붉은색 반투명으로 점멸시킨다.
- 줄 왼쪽 또는 오른쪽에 작은 붉은 깃발 아이콘을 표시한다.
- 경고 중인 줄을 밀면 깃발 아이콘이 터지며 사라진다.

### 보스 패배 연출

- 보스 HP가 0이 되면 붉은 깃발 3개가 순서대로 부러지는 효과를 낸다.
- 메시지: `붉은 깃발이 걷혔습니다`
- 보상: 불도저를 8초 밀어낸다. 이후 토템 정리는 계속 진행한다.

## 밸런스 기준

초기값:

- HP: 3
- 첫 공격 지연: 5초
- 공격 간격: 20초
- 경고 지속: 5초
- 실패 패널티: 시간 5초 감소
- 경고 대응 보너스: 80점
- 보스 패배 보상: 시간 8초 회복

조정 기준:

- 베타 테스터가 Stage 6에서 2회 이상 연속 실패하면 패널티를 4초로 줄인다.
- 경고를 인지하지 못한다는 피드백이 있으면 경고 지속 시간을 6초로 늘린다.
- 보스가 너무 존재감이 약하면 공격 간격을 18초로 줄인다.

## 구현 순서

1. `storyChapters`의 Stage 6 보스 데이터를 실제 전투 데이터로 연결한다.
2. `startStory()`에서 보스 스테이지 여부를 확인해 `bossState`를 초기화한다.
3. `tick()`에 보스 경고 타이머를 추가한다.
4. `push()` 또는 `finishPush()`에서 경고 줄 대응을 처리한다.
5. `checkStoryBottom()` 성공 시 보스 HP 감소를 연결한다.
6. `drawGame()`에 보스 HUD와 경고 줄 표시를 추가한다.
7. Stage 6 클리어, 보스 HP 0, 시간 패널티, 저장 진행을 스모크 테스트한다.

## 필요한 이미지

### 1. 보스 초상

파일 후보:

- `games/help-me-heyda-modern/public/assets/boss-flag-supervisor.png`

ChatGPT Image2 프롬프트:

```text
Create a transparent-background mobile game boss portrait for a Korean indie puzzle game called "Help Me Heyda 2026". Character: an exaggerated construction survey supervisor who marks a forest for development, wearing a yellow safety vest, hard hat, carrying a clipboard and red survey flags. Mood: smug but not scary, suitable for a family-friendly mobile game. Visual style: polished 2D game illustration, painterly cartoon, warm forest colors mixed with construction red and yellow, bold readable silhouette, high contrast, clean edges, no text, no logo, no UI, no background, PNG with alpha. Composition: half-body portrait facing slightly left, one red flag raised, expressive face, dramatic rim light. Aspect ratio 1:1.
```

### 2. 붉은 깃발 경고 아이콘

파일 후보:

- `games/help-me-heyda-modern/public/assets/boss-red-flag-marker.png`

ChatGPT Image2 프롬프트:

```text
Create a transparent-background 2D mobile game icon: a small red survey flag planted into the ground, used as a warning marker in a puzzle board. Style must match polished hand-painted mobile game assets, clean silhouette, bright red cloth, small wooden stake, subtle golden highlight, readable at tiny size, no text, no logo, no UI, no background, PNG with alpha. Aspect ratio 1:1.
```

### 3. Chapter 1 보스 등장 컷신

파일 후보:

- `games/help-me-heyda-modern/public/assets/chapter1-boss-intro.png`

ChatGPT Image2 프롬프트:

```text
Create a vertical mobile game story cutscene illustration for "Help Me Heyda 2026". Scene: a peaceful forest village path is interrupted by red survey flags and a construction survey supervisor standing at the edge of the woods with a clipboard. The heroine Heyda is seen from behind or side, small but determined, holding a totem. Mood: tense first confrontation, not violent, family-friendly adventure. Visual style: cinematic 2D game art, warm dusk forest lighting, painterly cartoon, rich detail, clear foreground and background separation, no text, no logo, no UI. Leave safe visual space near the bottom for story text overlay. Aspect ratio 9:16.
```

## 필요한 BGM

### Stage 6 보스 BGM

파일 후보:

- `games/help-me-heyda-modern/public/assets/bgm-chapter1-boss.mp3`

Suno 프롬프트:

```text
Instrumental looping mobile game boss music for a forest puzzle adventure. First boss encounter, playful tension, family-friendly, tribal hand drums, wooden percussion, low industrial metal hits, marimba ostinato, soft synth bass, subtle forest ambience, rising but not too dark, 95 BPM, seamless loop, no vocals, no lyrics, 90 seconds, energetic but cute, suitable for a Korean indie mobile game.
```

### 보스 경고 짧은 효과음

Suno 또는 효과음 생성 프롬프트:

```text
Short mobile game warning sting, red flag marker appears, wooden tick followed by small brass hit, playful but urgent, no voice, no melody longer than 2 seconds, clean sound effect, suitable for puzzle game UI.
```

### 보스 패배 짧은 효과음

Suno 또는 효과음 생성 프롬프트:

```text
Short mobile game victory sting for a first boss defeated, three red flags snap away, bright wooden percussion, small chime sparkle, warm and satisfying, no voice, 3 seconds, family-friendly puzzle adventure sound effect.
```

## 다음 구현 기준

첫 구현은 이미지/BGM 없이도 동작해야 한다. 에셋이 없을 때는 기존 Web Audio 효과와 Canvas 도형으로 대체하고, 이미지가 추가되면 자동으로 보스 초상과 붉은 깃발 아이콘을 표시한다.

## 1차 구현 기록

- Stage 6 시작 시 `bossState`가 생성된다.
- 5초 후부터 약 20초 간격으로 붉은 깃발 경고 줄이 표시된다.
- 경고 줄을 밀면 경고가 해제되고 80점을 얻는다.
- 경고를 놓치면 시간이 5초 줄어든다.
- 바닥 라인을 정상 클리어할 때마다 보스 HP가 1 감소한다.
- HP 0이 되면 보스 공격이 중지되고 시간이 8초 회복된다.
- 보스 초상과 붉은 깃발 이미지는 없을 때 Canvas 대체 그래픽으로 표시된다.
