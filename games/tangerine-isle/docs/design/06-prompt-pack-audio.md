# 06 — 오디오 프롬프트 팩 (Suno V5 + SFX): 감귤섬 삼총사

**문서 버전**: 1.0
**상위 문서**: `04-asset-spec.md` §9 (오디오 ID)
**저장 위치**: `vcc-game/games/tangerine-isle/docs/design/06-prompt-pack-audio.md`
**규격**: suno-music-workflow 스킬 준수 — Style Prompt는 태그 나열(대괄호 없음, 120자 이내), Custom Lyrics는 대괄호 메타태그만(전곡 instrumental), 소괄호 금지, 한 줄 태그 3개 이하.

---

## 0. 음악 방향 — 하나의 문장

**"제주 바람이 부는 칩튠"** — 레트로 게임의 칩튠 골격 위에 어쿠스틱 온기(마림바, 휘슬, 어쿠스틱 기타)를 얹는다. 전곡이 이 공식의 변주이며, 곡마다 무드 축만 이동한다: 타이틀(설렘) → 필드(경쾌) → 심부(긴장) → 화산(웅장) → 엔딩(따뜻함). 전곡 instrumental, 루프 전제.

공통 태그 (모든 BGM Style Prompt에 포함됨): `chiptune, instrumental, video game music, loopable`

---

## 1. `bgm_title` — 타이틀 테마

```
=== Suno 프롬프트 세트 ===

[콘셉트]
용도: BGM / 장르: 칩튠+어쿠스틱 / 분위기: 설렘과 모험의 예감 / 보컬: 없음 / 길이: 2분 루프

[Style Prompt]
chiptune, warm acoustic folk blend, adventurous and inviting, marimba and whistle lead, gentle 8-bit arpeggios, instrumental, video game title theme, loopable

[Custom Lyrics]
[Intro] [Energy: Low]

[Main Theme] [Energy: Medium]

[Variation] [Build-Up]

[Main Theme] [Energy: Medium]

[Outro] [Fade Out]

[설정 참고]
- Suno 모드: Custom Mode / 추천 길이: 2분 / Instrumental: O
```

## 2. `bgm_field` — 필드 테마 (챕터 1–2)

```
=== Suno 프롬프트 세트 ===

[콘셉트]
용도: BGM / 장르: 칩튠 / 분위기: 경쾌한 퍼즐 탐색, 햇살 / 보컬: 없음 / 길이: 2분 루프

[Style Prompt]
upbeat chiptune, playful puzzle game music, bouncy 8-bit melody, marimba accents, light percussion, sunny island mood, instrumental, loopable

[Custom Lyrics]
[Main Theme] [Energy: Medium]

[Variation A]

[Main Theme] [Energy: Medium]

[Variation B] [Energy: Low]

[Main Theme] [Outro]

[설정 참고]
- Suno 모드: Custom Mode / 추천 길이: 2분 / Instrumental: O
- 평가 포인트: 30분 들어도 피로하지 않은가 (퍼즐 게임 BGM의 제1기준)
```

## 3. `bgm_deep` — 심부 테마 (챕터 3–4)

```
=== Suno 프롬프트 세트 ===

[콘셉트]
용도: BGM / 장르: 칩튠 / 분위기: 신중한 긴장, 미스터리 / 보컬: 없음 / 길이: 2분 루프

[Style Prompt]
minor key chiptune, mysterious cave atmosphere, steady tension, deep bass pulse, sparse marimba, subtle wind texture, instrumental, loopable

[Custom Lyrics]
[Intro] [Energy: Low]

[Main Theme] [Energy: Medium]

[Bridge] [Breakdown]

[Main Theme] [Energy: Medium]

[Outro] [Fade Out]

[설정 참고]
- Suno 모드: Custom Mode / 추천 길이: 2분 / Instrumental: O
```

## 4. `bgm_volcano` — 최종 화산 스테이지

```
=== Suno 프롬프트 세트 ===

[콘셉트]
용도: BGM / 장르: 칩튠+오케스트라 하이브리드 / 분위기: 웅장한 최종 결전, 희망 섞인 긴박 / 보컬: 없음 / 길이: 2분 루프

[Style Prompt]
epic chiptune, orchestral hybrid, driving rhythm, heroic brass-like leads, rumbling low end, final stage intensity, instrumental, loopable

[Custom Lyrics]
[Intro] [Build-Up]

[Main Theme] [Energy: High]

[Variation] [Energy: High]

[Bridge] [Breakdown]

[Final Theme] [Energy: High]

[설정 참고]
- Suno 모드: Custom Mode / 추천 길이: 2분 / Instrumental: O
```

## 5. `bgm_balloon` — 열기구 미니게임

```
=== Suno 프롬프트 세트 ===

[콘셉트]
용도: BGM / 장르: 칩튠 왈츠 / 분위기: 두둥실 상쾌한 활공 / 보컬: 없음 / 길이: 1.5분 루프

[Style Prompt]
waltz time chiptune, floating airy melody, breezy whistle lead, light staccato arpeggios, cheerful sky travel, instrumental, loopable

[Custom Lyrics]
[Main Theme] [Energy: Medium]

[Variation] [Energy: Medium]

[Main Theme] [Outro]

[설정 참고]
- Suno 모드: Custom Mode / 추천 길이: 1.5분 / Instrumental: O
```

## 6. `bgm_ending` — 엔딩

```
=== Suno 프롬프트 세트 ===

[콘셉트]
용도: BGM / 장르: 어쿠스틱+칩튠 / 분위기: 따뜻한 귀향, 안도 / 보컬: 없음 / 길이: 2분

[Style Prompt]
warm acoustic guitar, gentle chiptune sparkle, peaceful resolution, soft marimba, sunrise mood, heartfelt ending theme, instrumental

[Custom Lyrics]
[Intro] [Energy: Low]

[Main Theme] [Energy: Medium]

[Reprise] [Energy: Low]

[Outro] [Fade Out]

[설정 참고]
- Suno 모드: Custom Mode / 추천 길이: 2분 / Instrumental: O
- 팁: Main Theme는 bgm_title의 멜로디 모티프를 회상하는 방향으로 — Suno Remix 기능으로 bgm_title에서 파생 생성하면 모티프 통일이 쉽다
```

## 7. 징글 2종

```
=== jgl_clear (스테이지 클리어) ===

[Style Prompt]
triumphant chiptune fanfare, short victory jingle, bright ascending melody, celebratory, instrumental

[Custom Lyrics]
[Short Fanfare] [Energy: High]

[설정 참고] 목표 5초 내 — 생성 후 앞 5초만 잘라 사용


=== jgl_gameover (게임오버) ===

[Style Prompt]
gentle descending chiptune jingle, soft comedic disappointment, short and light, not scary, instrumental

[Custom Lyrics]
[Short Jingle] [Energy: Low] [Fade Out]

[설정 참고] 목표 4초 내 — 아동 친화 톤 유지 (좌절감이 아니라 다시 하고 싶은 톤)
```

## 8. SFX 10종 — Suno가 아닌 파라메트릭 신스로

**판단**: 0.1~0.5초 단발 효과음은 Suno의 영역이 아니다 — 음악 모델은 짧은 신호음을 안정적으로 만들지 못하고, 잘라내는 후처리 비용이 크다. 대신 **jsfxr (sfxr.me)** 로 브라우저에서 10분 내 전량 제작 가능하며, 칩튠 BGM과 음색 계열도 자연스럽게 일치한다. 아래는 jsfxr 시작 프리셋 + 조정 방향의 명세다.

| ID | jsfxr 프리셋 | 조정 방향 |
|---|---|---|
| `sfx_push` | Hit/Hurt | 낮은 주파수, 짧게 — 묵직한 돌 마찰 |
| `sfx_dig` | Explosion | 볼륨 낮춤, 노이즈 성분 위주 — 흙 파는 질감 |
| `sfx_swim` | Blip/Select | 주파수 슬라이드 하강 — 물 첨벙 |
| `sfx_boom` | Explosion | 기본값 근사, 저역 강조 |
| `sfx_button` | Blip/Select | 짧은 클릭, 중음 |
| `sfx_door` | Powerup | 상승 슬라이드 — 문 열림의 성취감 |
| `sfx_tangerine` | Pickup/Coin | 밝은 고음 2노트 |
| `sfx_key` | Pickup/Coin | tangerine보다 한 음 높게 — 희소 아이템 차별화 |
| `sfx_chest` | Powerup | 길게, 상승 아르페지오 |
| `sfx_switch` | Blip/Select | 캐릭터 전환 — 부드러운 포핑 톤 |

내보내기: WAV, 파일명 = ID 그대로, `assets/audio/` 안착.

## 9. 제작 순서 권장

1. `bgm_field` 먼저 (플레이 시간의 대부분을 차지 — 품질 기준점)
2. `bgm_title` → Remix로 `bgm_ending` 파생 (모티프 통일)
3. `bgm_deep`, `bgm_volcano`, `bgm_balloon`
4. 징글 2종
5. SFX 10종 (jsfxr, 일괄 세션)
