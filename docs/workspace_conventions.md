# Workspace Conventions

## Principle

`vcc-game` is the umbrella workspace.
Each game is isolated in its own folder so experiments do not collide.

## Folder Rules

- `common/`: code or assets reused across multiple games
- `templates/`: starter kits, boilerplates, or scaffolds
- `docs/`: shared design docs, process notes, naming rules
- `games/<name>/`: one game per folder

## Naming

- Prefer lowercase kebab-case for game folder names
- Example: `games/neon-drift`

## Recommended Per-Game Layout

```text
games/my-game/
  src/
  public/
  assets/
  docs/
  README.md
```
