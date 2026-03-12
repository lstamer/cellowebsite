# Claude Code Configuration

## Structure

| Path | Purpose |
|------|---------|
| `CLAUDE.md` | Project system prompt — instructions for Claude Code in this repo |
| `settings.json` | Project settings (permissions, env, etc.) — optional |
| `settings.local.json` | Local overrides — gitignored, not shared |

## CLAUDE.md

Add project-specific instructions, conventions, and context. Claude Code reads this file when working in the project.

## Settings

- `settings.json` — committed, shared with team
- `settings.local.json` — local only, gitignored
