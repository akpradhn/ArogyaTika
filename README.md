# ArogyaTika

Lightweight internal admin prototype for tracking product requests from rough idea
to manual GitHub issue, branch, and PR handoff.

## Agent Requests

Run locally:

```sh
npm run dev
```

Then open `http://127.0.0.1:4173`.

Build and verify:

```sh
npm run lint
npm run type-check
npm test
npm run build
```

This implementation is intentionally local-only. It does not call paid AI APIs,
GitHub APIs, webhooks, GitHub Actions, deployment systems, or any external
service. Demo content is anonymized and must not be replaced with real patient
data.
