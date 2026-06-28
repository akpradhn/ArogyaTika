# ArogyaTika Agent Guide

This repository contains a lightweight local prototype for ArogyaTika. Treat it
as a healthcare-adjacent product surface where privacy, plain language, and
manual review matter.

## Current App

- Static browser app served from `index.html`.
- Source lives in `src/`.
- Tests live in `tests/`.
- Local scripts live in `scripts/`.
- Demo screenshots for PR review live in `docs/screenshots/`.

There is no backend, production database, authentication service, deployment
configuration, webhook, paid AI integration, or GitHub Actions workflow in this
repository right now.

## Commands

```sh
npm run dev
npm run lint
npm run type-check
npm test
npm run build
```

`npm run dev` starts a local static server. If the default port is occupied, set
`PORT`, for example:

```sh
PORT=4174 npm run dev
```

## Privacy And Safety

- Never use real child, parent, patient, clinic, phone, address, government ID,
  medical record, or appointment data in seed data, screenshots, tests, logs, or
  examples.
- Demo data must be obviously fictional and anonymized.
- Do not add secrets, API keys, tokens, credentials, webhooks, analytics keys, or
  external service configuration.
- Do not modify deployment settings, repository settings, GitHub Actions, or
  production infrastructure.
- Do not provide medical diagnosis or medical advice. Use language that asks the
  parent or guardian to verify schedule guidance with a healthcare professional.
- Preserve historical vaccination records. Parent-entered changes should be
  appended or clearly marked as self-reported rather than silently replacing
  prior completed doses.

## UX Principles

- Build for parents, guardians, and individuals tracking their own records.
- Prefer warm, reassuring language over clinic or operations jargon.
- Keep the most important next action visible near the top.
- Use visual progress, status cards, timelines, reminders, and simple action
  prompts.
- Avoid dense tables for parent-facing views.
- Make overdue states clear without making the experience alarming.
- Include loading, empty, error, no-child, and no-record states when relevant.

## Engineering Guidance

- Reuse existing project patterns before introducing new structure.
- Keep this prototype dependency-light unless a feature genuinely needs a
  package.
- Keep local storage schemas explicit and easy to replace with a backend later.
- Add focused tests for date/status calculations, validation, and record update
  behavior.
- Run lint, type-check, tests, and build before opening or updating a PR.

## Git And Review

- Work on feature branches.
- Open PRs to `main`.
- Do not merge or deploy unless explicitly asked.
- PRs for UI changes should include screenshots using mock data only.
