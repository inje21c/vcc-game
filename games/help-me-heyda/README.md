# Help Me Heyda

Original title: 도와줘 헤이다

This folder is for rebuilding the 2003 MobileAge feature-phone game as a modern mobile-screen game.

## Where to Put Files

- `docs/scenario/`: original scenario, story flow, dialogue, stage notes, character descriptions
- `docs/source-materials/`: legacy planning docs, old rules, reference notes, captured text, phone-era specs
- `assets/`: images, sprites, audio, fonts, UI references, exported resources
- `public/`: files that should be served directly by a web/mobile build
- `src/`: game source code

## Suggested Next Inputs

1. Put any scenario document into `docs/scenario/`.
2. Put original game source, pseudo-code, or decompiled/reference code into `docs/source-materials/` or `src/`, depending on whether it should remain reference-only or become active code.
3. Put visual/audio resources into `assets/`.

Once resources are added, the next step is to define the modern mobile gameplay loop, screen layout, input controls, and first playable prototype.

## First Playable Prototype

Run a local static server from this folder:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://127.0.0.1:8080/public/index.html
```

Controls:

- Row number buttons: choose the row Heyda will push from
- `▲` / `▼`: move the selected row
- `밀기`: push the first block in the selected row
- `스킬`: remove matching blocks when enough skill points are available
- `스토리`: restart story mode from stage 1
- `서바이벌`: start survival mode

Keyboard controls are also available:

- Arrow up/down: move row selection
- Arrow left or Space: push
- Arrow right: skill
- Escape: pause
