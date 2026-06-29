# ArogyaTika

Lightweight parent-facing vaccine tracking dashboard prototype.

## Parent Vaccine Dashboard

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

This implementation is intentionally local-only. It does not modify secrets,
workflows, deployment settings, or production data. Demo child records are
fictional and must not be replaced with real child or patient data in tests,
screenshots, logs, or seed data.

Parent-entered updates are labeled self-reported. Schedule guidance in the UI is
plain-language support only and should be verified with a healthcare
professional.

## Authentication

The app starts with a parent-facing authentication page inspired by Clerk's
authentication product. The current implementation is a local demo gate only:

- no Clerk publishable key is committed
- no secret key is used
- no external authentication request is made by tests or build scripts
- local demo access is stored in browser storage

When real authentication is approved, mount ClerkJS in the auth slot and provide
the publishable key through runtime configuration, not source control.
