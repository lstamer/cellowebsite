# Cursor Configuration

## Structure

| Path | Purpose |
|------|---------|
| `AGENTS.md` (project root) | Cursor system prompt — agent instructions applied to every chat |
| `.cursor/rules/` | Project rules — `.md` or `.mdc` files with optional frontmatter (`description`, `globs`, `alwaysApply`) |
| `.cursor/skills/` | Project skills — each skill is a directory with `SKILL.md` |

## Adding a Skill

Create a directory under `.cursor/skills/`:

```
.cursor/skills/your-skill-name/
├── SKILL.md    # Required — YAML frontmatter + instructions
├── reference.md   # Optional
└── examples.md    # Optional
```

See Cursor's create-skill flow or `/create-skill` for guidance.

## Adding a Rule

Create `.md` or `.mdc` files in `.cursor/rules/`. Use `.mdc` with frontmatter for:
- `alwaysApply: true` — applied to every session
- `globs: "**/*.tsx"` — applied when matching files are in context
- `description` — used for "Apply Intelligently" matching
