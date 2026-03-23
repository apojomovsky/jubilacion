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
