# vcc-game

`vcc-game` is the shared workspace for vibe-coded game development.

## Working Rule

- Common assets, shared tooling, and reusable docs live in the root workspace.
- Each individual game lives in its own subfolder under `games/`.
- New game work should start in `games/<game-name>/`.

## Structure

```text
vcc-game/
  common/      shared assets, helpers, utilities
  docs/        shared design notes and development conventions
  templates/   starter templates for new games
  games/       each game in its own subfolder
```

## Example

```text
vcc-game/
  games/
    neon-runner/
    card-battle/
    rhythm-lab/
```

## Default Workflow

1. Create a new game folder in `games/`.
2. Keep game-specific code, assets, and notes inside that folder.
3. Move only truly reusable parts into `common/` or `templates/`.
