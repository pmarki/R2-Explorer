---
"r2-explorer": minor
---

All configuration options can now be set via environment variables in `wrangler.toml`, without modifying worker code.

```toml
[vars]
R2_EXPLORER_READONLY = "true"
R2_EXPLORER_CORS = "false"
R2_EXPLORER_SHOW_HIDDEN_FILES = "false"
R2_EXPLORER_BASIC_AUTH_USERNAME = "username"
R2_EXPLORER_BASIC_AUTH_PASSWORD = "password"
R2_EXPLORER_CF_ACCESS_TEAM_NAME = "your-team"
R2_EXPLORER_DASHBOARD_URL = "https://example.com"
R2_EXPLORER_EMAIL_ROUTING_TARGET_BUCKET = "BUCKET"
```

ENV variables are merged at request time with priority: static config > ENV vars > defaults. This makes it possible to configure R2 Explorer without touching TypeScript code, and to override settings per environment (e.g. staging vs production).
