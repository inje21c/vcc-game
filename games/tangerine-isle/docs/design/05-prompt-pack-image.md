# 05 — 이미지 프롬프트 팩 (ChatGPT): 감귤섬 삼총사

**문서 버전**: 1.0
**상위 문서**: `04-asset-spec.md` (모든 프롬프트는 04의 ID·시트 그리드 계약을 목표로 한다)
**저장 위치**: `vcc-game/games/tangerine-isle/docs/design/05-prompt-pack-image.md`

---

## 0. 사용 절차 — 일관성이 전부다

AI 이미지 생성의 실패 지점은 개별 품질이 아니라 **에셋 간 스타일 불일치**다. 다음 절차를 지킨다.

1. **§1 스타일 앵커를 가장 먼저 1회 생성**한다 (삼총사 단체 레퍼런스 시트). 이 이미지가 프로젝트의 시각적 헌법이 된다.
2. 이후 모든 생성 요청에서 **앵커 이미지를 대화에 첨부**하고 "match the attached reference style exactly"를 포함한다. 같은 ChatGPT 대화 스레드를 유지하면 일관성이 더 높다.
3. 생성물은 목표 픽셀 치수로 **nearest-neighbor 다운스케일** 후 slice.js로 절단한다 (04 §10).
4. 결과가 어긋나면 프롬프트를 늘리지 말고 앵커 이미지 첨부 여부부터 확인한다 — 프롬프트 추가보다 레퍼런스 참조가 항상 강하다.

**공통 스타일 블록 (모든 프롬프트에 포함됨, 별도 복사 불필요 — 각 프롬프트에 이미 삽입되어 있다):**

> modern hi-bit pixel art, 32x32 pixel grid per cell, crisp pixels, vibrant warm palette anchored on tangerine orange #F28C28, island green, teal sea, soft cel shading within pixel style, clean silhouette, transparent background, no anti-aliasing blur, game asset

---

## 1. 스타일 앵커 — 삼총사 레퍼런스 시트 (최우선 생성)

```
Create a character reference sheet in modern hi-bit pixel art style for a cozy island puzzle game.
Three animal heroes standing side by side, front view, full body, 32x32 pixel grid proportions
(chibi 2-head-tall), crisp pixels, soft cel shading, vibrant warm palette anchored on tangerine
orange #F28C28, island green, teal sea. Transparent background, no text.

1. RABONG — a white cat, confident leader, small tangerine-orange bandana around neck,
   sturdy front paws (the strong one who pushes stone totems)
2. GEUMHYANG — a warm brown rabbit, energetic digger, tiny dirt smudge on cheek,
   big expressive ears, small shovel-shaped tail tuft
3. CHEONGGYUL — a green sea turtle, calm and steady, teal-green shell with a subtle
   tangerine-leaf pattern, gentle smile (the swimmer)

Consistent line weight and palette across all three. This sheet will be the master style
reference for every other asset in the game.
```

목표 산출: `docs/design/ref/style_anchor.png` (에셋 아님, 레퍼런스 보관용)

## 2. 캐릭터 시트 3장 (04 §3 그리드: 4열×3행)

### 2.1 `sheet_cat.png` — 라봉이

```
[스타일 앵커 이미지 첨부 후]
Using the attached reference sheet, generate a sprite sheet of RABONG the white cat only.
Exactly 4 columns x 3 rows, each cell 32x32 pixel grid, transparent background, no labels, no grid lines.
Columns left to right: facing down, facing up, facing left, facing right.
Row 1: walking frame A (left foot forward). Row 2: walking frame B (right foot forward).
Row 3: pushing pose — leaning forward with both front paws extended, effort expression.
Match the attached reference style exactly: same palette, same proportions, same line weight.
Modern hi-bit pixel art, crisp pixels, no anti-aliasing blur.
```

### 2.2 `sheet_rabbit.png` — 금향이

```
[스타일 앵커 이미지 첨부 후]
Using the attached reference sheet, generate a sprite sheet of GEUMHYANG the brown rabbit only.
Exactly 4 columns x 3 rows, each cell 32x32 pixel grid, transparent background, no labels, no grid lines.
Columns left to right: facing down, facing up, facing left, facing right.
Row 1: walking frame A. Row 2: walking frame B (ears bounce slightly differently between frames).
Row 3: digging pose — crouched low, front paws scooping, small dirt particles flying.
Match the attached reference style exactly. Modern hi-bit pixel art, crisp pixels.
```

### 2.3 `sheet_turtle.png` — 청귤이

```
[스타일 앵커 이미지 첨부 후]
Using the attached reference sheet, generate a sprite sheet of CHEONGGYUL the green turtle only.
Exactly 4 columns x 3 rows, each cell 32x32 pixel grid, transparent background, no labels, no grid lines.
Columns left to right: facing down, facing up, facing left, facing right.
Row 1: walking frame A (slow steady step). Row 2: walking frame B.
Row 3: swimming pose — limbs spread as flippers, tiny water ripple lines around the shell.
Match the attached reference style exactly. Modern hi-bit pixel art, crisp pixels.
```

## 3. 지형 시트 `sheet_terrain.png` (04 §4 그리드: 5열×2행)

```
[스타일 앵커 이미지 첨부 후]
Generate a terrain tileset for the same island puzzle game, matching the attached reference style.
Exactly 5 columns x 2 rows, each cell a 32x32 pixel tile, seamless where noted, no labels, no grid lines.
Row 1: (1) plain sandy island ground, seamless tileable; (2) sandy ground variant with a few grass
tufts, tileable with tile 1; (3) dense tangerine bush treated as a wall block — deep green foliage
with small orange tangerine dots, reads clearly as impassable; (4) sea water tile frame A, teal with
light wave highlights, seamless; (5) sea water frame B, same tile with wave highlights shifted for
a 2-frame animation loop.
Row 2: (1) dug pit — dark earthen hole with visible depth; (2) the same pit filled by a grey stone,
flat and walkable; (3) secret door made of wood planks, one tile, clearly wooden; (4) secret door
made of grey stone with a faint glowing rune, clearly stone; (5) volcanic dark rock ground tile, tileable.
Top-down view consistent with the game grid. Crisp pixels, transparent background outside tiles.
```

## 4. 오브젝트 시트 `sheet_objects.png` (04 §5 그리드: 4열×2행)

```
[스타일 앵커 이미지 첨부 후]
Generate a game object sprite sheet matching the attached reference style.
Exactly 4 columns x 2 rows, each cell 32x32 pixel grid, transparent background, no labels.
Row 1: (1) a pushable stone totem — small grey stone statue with a carved gentle face,
reminiscent of an island guardian statue; (2) a round black bomb with a short fuse, NO number
printed on it; (3) a glossy tangerine with one green leaf; (4) a golden key whose bow is shaped
like a tangerine blossom.
Row 2: (1) a closed wooden treasure chest with brass trim; (2) the same chest open with warm
light rays rising from inside; (3) a stone floor button, unpressed, slightly raised; (4) the same
button pressed down with a soft teal glow.
Crisp pixels, consistent palette with the reference.
```

## 5. 이펙트 시트 `sheet_fx.png` (04 §6 그리드: 4열×3행)

```
[스타일 앵커 이미지 첨부 후]
Generate a pixel-art visual effects sheet matching the attached reference style.
Exactly 4 columns x 3 rows, each cell 32x32, transparent background, no labels.
Row 1: bomb explosion in 4 frames — white flash, orange fireball, grey smoke puff, dissipating wisps.
Row 2: digging dust in 2 frames — brown dirt particles bursting low; then water splash in 2 frames —
teal droplets rising and falling.
Row 3: treasure sparkle in 3 frames — small golden star glints growing then fading; leave cell 4 empty.
Crisp pixels, effects readable at small size.
```

## 6. UI 파일들

### 6.1 초상 3종 `ui_portrait_cat / _rabbit / _turtle` (한 번에 생성 후 절단)

```
[스타일 앵커 이미지 첨부 후]
Generate three square character portrait icons in a single row, each 96x96 pixel grid,
matching the attached reference style: RABONG the white cat with tangerine bandana,
GEUMHYANG the brown rabbit, CHEONGGYUL the green turtle. Face and shoulders only,
cheerful expressions, simple circular tangerine-cream background inside each square,
crisp pixel art, no text, transparent outside the squares.
```

### 6.2 아이콘 2종 `ui_icon_tangerine`, `ui_icon_key`

```
[스타일 앵커 이미지 첨부 후]
Two 32x32 pixel art icons side by side, matching the attached reference style, transparent
background, no text: (1) a bright glossy tangerine icon designed to read clearly at small
size as a health/energy unit; (2) a golden key icon with tangerine-blossom bow.
Bold silhouette, crisp pixels.
```

### 6.3 로고 `ui_logo`

```
Game logo for a cozy Korean island puzzle game titled "감귤섬 삼총사".
Playful rounded Korean lettering with pixel-art texture, tangerine orange main color with
island-green accents, a small tangerine replacing one stroke dot, subtle teal outline,
slight arch layout, transparent background, 2:1 aspect ratio.
Below the Korean title, small English subtitle "TANGERINE ISLE" in simple pixel font.
No characters, no background scene — logo typography only.
```

## 7. 배경·일러스트 (스타일 앵커 첨부, 픽셀 밀도만 완화)

배경은 32px 그리드 강제 대신 "pixel-art inspired illustration"으로 밀도를 높인다 — 타일과 달리 배경은 절단되지 않으므로 그리드 계약이 불필요하다.

### 7.1 `bg_title`

```
[스타일 앵커 이미지 첨부 후]
Wide title screen illustration, pixel-art inspired, matching the attached reference palette.
A round tangerine island seen from the sea at golden hour: tangerine orchards on rolling hills,
a large gentle volcano at the island center with a thin worrying wisp of dark smoke,
teal sea in the foreground. On a cliff, small back-view silhouettes of the three heroes —
white cat, brown rabbit, green turtle — looking toward the volcano.
Warm, hopeful but slightly ominous mood. Leave the upper third calm for logo placement. 3:2 ratio.
```

### 7.2 `bg_worldmap`

```
[스타일 앵커 이미지 첨부 후]
Top-down stylized world map of the tangerine island, pixel-art inspired, matching the attached
reference palette. The island divided into four visually distinct regions — orchard coast,
forest hills, stone valley, dark volcanic highlands — with the volcano at the center.
Small winding paths connect the regions toward the volcano. Include 4-5 small clearing spots
per region where stage markers will be placed by the game UI. Teal sea border with tiny waves.
No text, no icons — the game renders markers on top. 3:2 ratio.
```

### 7.3 `bg_story_opening`

```
[스타일 앵커 이미지 첨부 후]
Story illustration, pixel-art inspired, matching the attached reference palette but in a
night scene. Dark silhouetted ships from beyond the sea; shadowy figures hammering tall
sinister iron stakes into the island's hills under a cold moon; the volcano beginning to
glow faint red at its crater. Ominous but storybook-safe for all ages, no violence,
no flags or national symbols. 3:2 ratio.
```

### 7.4 `bg_story_ending`

```
[스타일 앵커 이미지 첨부 후]
Story illustration, pixel-art inspired, matching the attached reference palette.
Bright morning on the tangerine island: the volcano calm and green again, iron stakes gone,
open treasure chests glittering along the hills, and the three heroes — white cat, brown
rabbit, green turtle — resting happily in a tangerine orchard sharing tangerines.
Warm, celebratory, storybook ending mood. 3:2 ratio.
```

### 7.5 `bg_balloon_sky` + `spr_balloon`

```
[스타일 앵커 이미지 첨부 후]
(1) A wide horizontally-tileable daytime sky background for a side-scrolling minigame,
pixel-art inspired, matching the attached palette: layered clouds, distant teal sea horizon,
faint island silhouette. Seamless left-right tiling, 3:1 ratio.
(2) Separately, a 64x96 pixel sprite of RABONG the white cat riding a small hot-air balloon
with tangerine-striped canopy, side view facing right, transparent background, crisp pixels.
```

## 8. 검수 체크리스트 (생성물 수령 시)

- [ ] 시트 셀 수·배치가 04 그리드 계약과 일치하는가 (불일치 = slice.js 실패)
- [ ] 투명 배경인가 (배경색이 구워졌으면 재생성)
- [ ] 폭탄에 숫자가 박혀 있지 않은가 (숫자는 런타임 오버레이)
- [ ] 팔레트가 앵커와 일치하는가 (나란히 놓고 육안 대조)
- [ ] 다운스케일 후에도 실루엣이 읽히는가 (32px 실측 확인)
