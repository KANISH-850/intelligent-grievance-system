# Translation and image analysis providers

The AI service makes provider calls from the server. No credentials belong in Vite variables.

## Translation

Set `TRANSLATION_API_URL` to a LibreTranslate compatible `/translate` endpoint. Set `TRANSLATION_API_KEY` for hosted instances that require a key; self-hosted instances can omit it. The service sends the original complaint with source language and English target. Supported source codes are Hindi (`hi`), Tamil (`ta`), Telugu (`te`), Malayalam (`ml`), Kannada (`kn`), Bengali (`bn`), Gujarati (`gu`), Punjabi (`pa`), Marathi (`mr`), and Urdu (`ur`). English is passed through. Unsupported languages, provider errors, and missing endpoint configuration retain the original text, report a non-success translation status, and route classification to `Other` for human review.

## Image analysis

Set `VISION_API_URL` to the complete OpenAI-compatible Chat Completions endpoint, such as `https://api.openai.com/v1/chat/completions`; set `VISION_API_KEY`; and optionally set `VISION_MODEL` (default `gpt-4o-mini`). The endpoint must support image input and JSON response mode. The backend reads the validated uploaded file and sends its actual bytes to the AI service. Missing configuration, unsupported input, timeout, or provider errors are persisted as an explicit unavailable/failed result with human review required. Vision output is supporting evidence and does not override complaint-text classification.

## Database update

The additive migration `20261017100000_translation_and_image_analysis` adds nullable translation metadata, an explicit routing status, and per-image analysis fields. Existing records are retained with defaults. Review the generated SQL and deployment environment, then apply with `cd backend && npm run db:deploy`; do not use `prisma migrate reset`. Regenerate the Prisma client with `cd backend && npm run db:generate` after applying schema changes.

## Configured routing map

| Category | Department name | Seed code |
| --- | --- | --- |
| Water Supply | Water Supply | WS |
| Electricity | Electricity | ELEC |
| Roads and Transport | Roads and Transport | RT |
| Healthcare | Healthcare | HC |
| Education | Education | EDU |
| Sanitation | Sanitation | SAN |
| Municipal Services | Municipal Services | MS |
| Revenue | Revenue | REV |
| Other | Other | OTH |

The service resolves a department by the AI category's department name, then uses the seeded `OTH` record if resolution fails. Database seed uses upserts by unique department code, so it does not create duplicate department rows.
