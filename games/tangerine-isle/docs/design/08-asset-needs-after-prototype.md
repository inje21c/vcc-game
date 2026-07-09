# 08 — 워킹 프로토타입 후 추가 이미지 필요 목록

**작성일**: 2026-07-09
**목적**: 워킹 프로토타입 플레이 피드백에서 드러난 임시 드로잉/부족 에셋을 실제 이미지 에셋으로 교체하기 위한 목록과 생성 프롬프트.

## 우선순위 A — 규칙 피드백 에셋

### `assets/objects/obj_tunnel_hole_rabbit.png`

- 크기: 128x128 PNG, transparent background
- 용도: 토끼 땅굴 시작/도착 칸에 남는 구멍. 현재는 Canvas 2D로 임시 타원과 흙더미를 그림.
- 요구: 구멍은 타일 바닥에 얹히는 낮은 오브젝트여야 하며, 캐릭터와 겹쳐도 읽혀야 한다.

Prompt:

```text
Create a 128x128 transparent PNG game object for a top-down tile puzzle game.
Subject: a small rabbit burrow hole in warm island soil, with a dark oval opening and soft piles of freshly dug dirt on both sides.
Style: modern hi-bit pixel art, cute Korean island fantasy game, rich but clean shading, readable at mobile size.
Perspective: top-down three-quarter, object anchored to the floor, no cast shadow outside the object, no text.
Palette: warm brown soil, subtle orange-tan highlights, compatible with sandy tangerine island ground tiles.
Output must contain only the object on transparent background, centered, no border, no UI, no extra props.
Target file name: obj_tunnel_hole_rabbit.png
```

### `assets/objects/obj_sign_rabbit_hole.png`

- 크기: 128x128 PNG, transparent background
- 용도: 구멍 위/옆에 세우는 “금향이용” 표식. 현재는 Canvas 2D로 작은 푯말과 `금향` 글자를 그림.
- 요구: 글자는 런타임 텍스트로 얹을 수 있으므로, 가능하면 빈 나무 푯말 버전이 좋다. 한글이 AI 생성에서 깨질 가능성이 높다.

Prompt:

```text
Create a 128x128 transparent PNG game object for a top-down tile puzzle game.
Subject: a tiny cute wooden signpost planted beside a small rabbit burrow, with a blank light wooden sign board suitable for runtime Korean text.
Style: modern hi-bit pixel art, cute Korean island fantasy, warm handmade wood, clean silhouette.
Perspective: top-down three-quarter, floor object, readable at 128px and mobile scale.
Palette: warm brown post, pale tan sign board, slight orange island sunlight.
Important: leave the sign board blank, no letters, no icons, no border around the whole image.
Output must contain only the signpost object on transparent background, centered.
Target file name: obj_sign_rabbit_hole.png
```

### `assets/ui/ui_lock_forbidden.png`

- 크기: 96x96 PNG, transparent background
- 용도: 물 위/구멍 위 전환 금지 시 캐릭터 버튼에 잠깐 뜨는 금지 표시. 현재는 DOM 텍스트 `⊘`로 표시.
- 요구: 작은 버튼 위에서도 읽히는 빨간 금지 마크.

Prompt:

```text
Create a 96x96 transparent PNG UI icon.
Subject: a clear red forbidden symbol, circular red badge with diagonal slash, friendly game UI style.
Style: modern hi-bit pixel art UI, crisp edges, subtle highlight, high contrast, readable at 32px.
Palette: vivid red, white slash, tiny dark red shadow only inside the icon.
Output must be only the icon on transparent background, centered, no text.
Target file name: ui_lock_forbidden.png
```

## 우선순위 B — 행동 이펙트

### `assets/fx/fx_dig_1.png`, `assets/fx/fx_dig_2.png`

- 크기: 128x128 PNG each, transparent background
- 용도: 토끼 땅굴 이동 순간의 흙먼지. 현재는 토끼 `*_act` 포즈와 구멍 표시만 있음.

Prompt:

```text
Create two 128x128 transparent PNG animation frames for a top-down tile puzzle game.
Subject: cute dirt-digging dust effect for a rabbit burrowing through soil, frame 1 small dirt burst, frame 2 settling dust and pebble crumbs.
Style: modern hi-bit pixel art VFX, soft chunky pixels, readable at mobile size, no character visible.
Perspective: top-down three-quarter floor effect, centered on a tile.
Palette: warm brown dirt, tan dust, a few orange soil highlights.
Output as two separate transparent PNG frames named fx_dig_1.png and fx_dig_2.png.
```

### `assets/fx/fx_splash_1.png`, `assets/fx/fx_splash_2.png`

- 크기: 128x128 PNG each, transparent background
- 용도: 청귤이 물 진입/수영 이동 첨벙 이펙트. 현재는 수영 포즈만 있음.

Prompt:

```text
Create two 128x128 transparent PNG animation frames for a top-down tile puzzle game.
Subject: small cute water splash effect for a turtle swimming on a water tile, frame 1 splash crown, frame 2 ripple ring.
Style: modern hi-bit pixel art VFX, clean readable shapes, no character visible.
Perspective: top-down floor effect, centered on a tile.
Palette: turquoise blue water, pale foam highlights, compatible with island water tiles.
Output as two separate transparent PNG frames named fx_splash_1.png and fx_splash_2.png.
```

## 우선순위 C — UI 완성도

### `assets/ui/ui_portrait_cat.png`, `assets/ui/ui_portrait_rabbit.png`, `assets/ui/ui_portrait_turtle.png`

- 크기: 96x96 PNG each, transparent background
- 용도: 현재 C/R/T 원형 버튼을 캐릭터 얼굴 버튼으로 교체.

Prompt:

```text
Create three 96x96 transparent PNG character portrait icons for a cute top-down puzzle game.
Characters:
1. Rabongi, white cat with orange tangerine scarf, leader expression.
2. Geumhyangi, brown rabbit with small blue backpack, cheerful digging character.
3. Cheonggyuli, green turtle with orange tangerine scarf, calm swimmer.
Style: modern hi-bit pixel art UI portrait, rounded friendly face, crisp silhouette, consistent lighting and palette.
Each icon should show head and upper body only, centered, no circular frame, no text, transparent background.
Output as three separate files named ui_portrait_cat.png, ui_portrait_rabbit.png, ui_portrait_turtle.png.
```

## 구현 교체 메모

- `obj_tunnel_hole_rabbit.png`가 생기면 `src/render/renderer.js`의 `drawTunnelHole()`에서 타원 구멍 드로잉을 이미지 렌더링으로 교체한다.
- `obj_sign_rabbit_hole.png`가 생기면 같은 함수에서 푯말 도형만 이미지로 교체하고, `금향` 텍스트는 런타임으로 유지한다.
- `ui_lock_forbidden.png`가 생기면 `src/input/input.js`의 `showSwitchBlocked()`에서 DOM 텍스트 `⊘` 대신 이미지 마커를 사용한다.
- `fx_dig_*`, `fx_splash_*`는 현재 이벤트 구조에 `tunnel`/water move 이벤트를 렌더러 FX로 전달하는 작업이 필요하다.
