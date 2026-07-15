# vcc-game

`vcc-game` is the shared workspace for vibe-coded game development.

## Project Vision

`vcc-game` records and modernizes the mobile games originally created from 2003 onward. The project keeps original materials and modern remakes side by side, then presents them as a playable portfolio that can grow into open beta testing, installable mobile web apps, sponsorship, optional ad consent, and lightweight monetization.

Key planning docs:

- [Project philosophy](docs/project-philosophy.md)
- [Portfolio and operating plan](docs/portfolio-operating-plan.md)
- [Beta feedback board plan](docs/beta-feedback-board.md)
- [Jeju Samdasoo game development direction](docs/samdasoo-game-development-direction.md)
- [Workspace conventions](docs/workspace_conventions.md)
- [Help Me Heyda 2026 roadmap](games/help-me-heyda-modern/docs/roadmap-2026.md)
- [v1.0 closing plan](games/help-me-heyda-modern/docs/closing-plan-v1.md)

Beta links:

- [Report a beta issue](games/help-me-heyda-modern/public/report.html)

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
