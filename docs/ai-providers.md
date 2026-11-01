# Translation and image analysis providers

The AI service makes provider calls from the server. No credentials belong in Vite variables.

## Translation

Set `TRANSLATION_API_URL` to a LibreTranslate compatible `/translate` endpoint. Set `TRANSLATION_API_KEY` for hosted instances that require a key; self-hosted instances can omit it. The service sends the original complaint with source language and English target. Supported source codes are Hindi (`hi`), Tamil (`ta`), Telugu (`te`), Malayalam (`ml`), Kannada (`kn`), Bengali (`bn`), Gujarati (`gu`), Punjabi (`pa`), Marathi (`mr`), and Urdu (`ur`). English is passed through. Unsupported languages, provider errors, and missing endpoint configuration retain the original text, report a non-success translation status, and route classification to `Other` for human review.

## Image analysis

Image analysis is powered exclusively by a fine-tuned, local PyTorch model (`MobileNetV3-Small-Civic`) located in `ai-service/models/civic_mobilenet_v3_best.pth`. It requires no external cloud vision API credentials or network roundtrips. The backend passes the validated uploaded image bytes as base64 to `/analyze-image`. The model classifies the defect into one of 9 civic and non-civic categories (`pothole_road_damage`, `garbage_dumping`, `water_leakage_logging`, `broken_streetlight`, `exposed_wires_electrical`, `unhygienic_toilet_sewage`, `damaged_public_facility`, `open_manhole_drainage`, or `unrelated_negative`), extracts visual observations, computes confidence scores, and determines department routing. Unsupported MIME types, corrupted bytes, or oversized payloads return an explicit error status with human review required. Vision predictions directly drive department routing for image-only complaints and provide corroborating visual evidence for multimodal grievances.

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
