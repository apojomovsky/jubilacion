# Project Bootstrap: Multi-Vendor AI Setup

You are setting up the shared AI context boilerplate for a new project. This is a mechanical step, no discovery conversation needed.

**Important: Never use emdashes (the — character) in any output. Use periods, commas, colons, or parentheses instead.**

## What to do

1. **Create `AGENTS.md`** at the project root if it doesn't already exist. Use this template:

```markdown
# Project

<!-- Canonical project context file. -->
<!-- Symlinked to vendor-specific paths. Edit this file only. -->

## Style rules for generated content

- Never use emdashes (the — character). Use periods, commas, colons, or parentheses instead.

## What this is

<!-- Fill in via kickoff workflow or manually -->

## Conventions

<!-- Coding standards, patterns, tech stack decisions -->

## Workflows

- **Project kickoff**: Follow [skills/kickoff.md](skills/kickoff.md)
```

2. **Create symlinks** pointing vendor-specific paths to `AGENTS.md`:

```bash
# Claude Code
ln -sf AGENTS.md CLAUDE.md

# GitHub Copilot
mkdir -p .github
ln -sf ../AGENTS.md .github/copilot-instructions.md

# Gemini
mkdir -p .gemini
ln -sf ../AGENTS.md .gemini/style-guide.md
```

Codex reads `AGENTS.md` natively, so no symlink is needed.
OpenCode can be pointed to it via its config. Remind the user to configure that if they use it.

3. **Create the `skills/` directory** if it doesn't exist, and copy in any shared skill files the user wants (at minimum, `kickoff.md`).

4. **Register slash commands** for tools that support them:

For Claude Code, create a one-liner shim:
```bash
mkdir -p ~/.claude/commands
echo 'Follow the instructions in skills/kickoff.md in the current project.' > ~/.claude/commands/kickoff.md
echo 'Follow the instructions in skills/bootstrap.md in the current project.' > ~/.claude/commands/bootstrap.md
```

For other tools, tell the user how to set up equivalent shortcuts in their tool's config if applicable.

5. **Report what was created.** List the files, symlinks, and registered commands so the user can verify.

6. **Clean up after yourself**:
   - Remove the bootstrap entry from the `## Workflows` section in `AGENTS.md` (the line referencing `skills/bootstrap.md`). Leave all other workflow entries intact.
   - Remove the `~/.claude/commands/bootstrap.md` shim if it was created in step 4.
   - Do NOT delete `skills/bootstrap.md` itself. Keep it around in case it needs to be re-run manually.

## Guidelines

- Never use emdashes. Use periods, commas, colons, or parentheses instead.
- If `AGENTS.md` already exists, don't overwrite it. Ask the user first.
- If any symlink target already exists as a real file (not a symlink), warn the user and ask what to do.
- Keep it idempotent. Running this twice should be safe.
