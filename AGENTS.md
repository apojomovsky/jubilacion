<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Git commit messages

ALL commits MUST use conventional commits format. No exceptions, ever.

```
<type>(<optional scope>): <description>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:

- `feat: add contribution growth rate selector to main form`
- `fix: fund chart tooltip showing English keys instead of Spanish labels`
- `docs: add Previsor branding and README`
- `refactor: replace hardcoded SCENARIO_SPREAD with form input`
- `style: remove all emdashes from UI text`

Never write a commit message without a type prefix. If unsure of the type, use `chore`.

# Formatting

This project uses Prettier. A PostToolUse hook in `.claude/settings.json` runs Prettier automatically after every Edit or Write tool call — you do not need to run it manually.

If you need to format manually (e.g. after bulk changes via Bash):

```
npm run format
```

To check without writing:

```
npm run format:check
```

The pre-commit git hook (via `simple-git-hooks` + `lint-staged`) also runs Prettier and ESLint on staged files before every commit. Do not bypass it with `--no-verify`.
