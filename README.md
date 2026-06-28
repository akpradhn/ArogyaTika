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
