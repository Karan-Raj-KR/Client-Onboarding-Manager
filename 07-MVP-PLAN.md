# MVP Scope and 24-Hour Development Plan

## Scope guardrail

The demo must work end-to-end with no network dependency beyond an optional LLM call. Build text input first. For every external integration, provide a seeded/mock adapter before attempting the live version.

| In MVP | Cut / simulate |
|---|---|
| Text enquiry, AI/cached extraction, editable deal, rate card, quote PDF, public acceptance, invoice PDF, mock payment link, dashboard | Authentication, real WhatsApp API, real payment collection, webhooks, live GST e-invoice, reminder delivery, multi-tenant roles |

## Milestones

| Time | Outcome | Owner |
|---|---|---|
| 0–1h | Fresh repo, README skeleton, stack selected, fixtures/data contract agreed | Saagnik + team |
| 1–3h | Schema, seed data, API stubs, route/screen shell | Karan + Havinash |
| 3–6h | Extract-to-editable-deal flow end-to-end (mock LLM acceptable) | Karan + Havinash |
| 6–9h | Rate card, pricing, quote PDF and public quote view | Karan + Havinash |
| 9–10h | **Integration checkpoint:** shared branch works from enquiry to quote | Entire team |
| 10–13h | Accept transaction, invoice, payment-link mock, dashboard update | Karan + Havinash |
| 13–16h | Dashboard polish, seed data, PDF design, mobile acceptance screen | Havinash + Saagnik |
| 16–18h | Voice cached path and optional external integrations (time-box 2h) | Karan |
| 18–20h | Tests, fallback rehearsal, error states, link checks | Saagnik |
| 20–22h | Record demo video; README and deck | Saagnik + Karan |
| 22–24h | Two timed rehearsals, bugs only, submission verification | Entire team |

## Definition of done

On a clean run, operator can paste the demo enquiry, edit/confirm ₹35,000, issue a branded PDF, accept on a second device/incognito page, and show invoice + payment link + ₹35,000 won state. Every link works twice in succession.
