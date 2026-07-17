# User Stories — Kagaz

## P0 — must complete

| Story | Acceptance criteria |
|---|---|
| As an owner, I paste an enquiry and get a draft deal. | Scope, budget range, timeline, missing fields, and confidence appear; raw text remains visible. |
| As an owner, I correct the draft before issuing anything. | Every field and line item is editable; totals recalculate on the server. |
| As an owner, I issue a polished quote. | Quote has number, client/project, scope, line items, subtotal/tax/total, validity, business details, and downloadable PDF. |
| As a client, I can accept a quote from a public link. | Page is mobile-readable; tap Accept shows clear success state and prevents duplicate acceptance. |
| As an owner, I see the post-acceptance cascade. | Invoice and payment link appear, reminder is `armed`, deal becomes won, dashboard changes. |
| As an owner, I see a live-looking pipeline. | Dashboard displays counts and INR totals with seeded deals. |

## P1 — only after P0 is rehearsed

| Story | Acceptance criteria |
|---|---|
| As an owner, I upload/play a voice note. | Cached transcript always populates the same deal path within 3 seconds. |
| As an owner, I share a quote. | Copy link action works and produces a toast. |
| As an owner, I select a rate-card service. | Suggested services can be added and edited. |

## P2 — roadmap

WhatsApp Business ingestion, real payment-link creation/webhooks, email/WhatsApp reminders, multi-language transcription, GST e-invoice integration, team permissions, and accounting exports.
